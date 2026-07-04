import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import { Config, Service, Interaction, SelectedMember } from '../types/schema'
import { configToFlow, flowToConfig } from '../lib/serializer'
import { computeTrace, TraceResult } from '../lib/tracing'
import { applyDagreLayout } from '../lib/layout'
import { ServiceNodeData } from '../components/ServiceNode'
import { InteractionEdgeData } from '../components/InteractionEdge'

type SNode = Node<ServiceNodeData>
type SEdge = Edge<InteractionEdgeData>

interface GraphStore {
  config: Config
  nodes: SNode[]
  edges: SEdge[]

  selectedServiceId: string | null
  selectedInteractionId: string | null
  selectedMember: SelectedMember | null
  trace: TraceResult | null

  /** When true, selecting a graph element only highlights/traces it — the editor stays closed. */
  viewMode: boolean

  loadConfig: (cfg: Config) => void
  onNodesChange: (changes: NodeChange<SNode>[]) => void
  onEdgesChange: (changes: EdgeChange<SEdge>[]) => void

  selectService: (id: string | null) => void
  selectInteraction: (id: string | null) => void
  selectMember: (member: SelectedMember | null) => void
  clearSelection: () => void
  toggleViewMode: () => void

  addService: (svc: Service) => void
  updateService: (id: string, patch: Partial<Service>) => void
  removeService: (id: string) => void
  addInteraction: (ix: Interaction) => void
  updateInteraction: (id: string, patch: Partial<Interaction>) => void
  removeInteraction: (id: string) => void

  autoLayout: () => void
  getConfig: () => Config
}

const EMPTY_CONFIG: Config = {
  version: '1.0',
  name: 'New Architecture',
  services: [],
  interactions: [],
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  config: EMPTY_CONFIG,
  nodes: [],
  edges: [],
  selectedServiceId: null,
  selectedInteractionId: null,
  selectedMember: null,
  trace: null,
  viewMode: false,

  loadConfig(cfg) {
    const { nodes, edges } = configToFlow(cfg)
    const allZero = nodes.every((n) => n.position.x === 0 && n.position.y === 0)
    const finalNodes = allZero && nodes.length > 1 ? applyDagreLayout(nodes, edges) : nodes
    set({
      config: cfg,
      nodes: finalNodes,
      edges,
      selectedMember: null,
      trace: null,
      selectedServiceId: null,
      selectedInteractionId: null,
    })
  },

  onNodesChange(changes) {
    set((s) => {
      const nodes = applyNodeChanges(changes, s.nodes) as SNode[]
      const config = flowToConfig(s.config, nodes, s.edges)
      return { nodes, config }
    })
  },

  onEdgesChange(changes) {
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) as SEdge[] }))
  },

  selectService(id) {
    set({ selectedServiceId: id, selectedInteractionId: null, selectedMember: null, trace: null })
  },

  selectInteraction(id) {
    set({ selectedInteractionId: id, selectedServiceId: null, selectedMember: null, trace: null })
  },

  selectMember(member) {
    if (!member) {
      set({ selectedMember: null, trace: null })
      return
    }
    const trace = computeTrace(get().config, member)
    set({ selectedMember: member, trace, selectedInteractionId: null, selectedServiceId: null })
  },

  clearSelection() {
    set({ selectedServiceId: null, selectedInteractionId: null, selectedMember: null, trace: null })
  },

  toggleViewMode() {
    set((s) => ({ viewMode: !s.viewMode }))
  },

  addService(svc) {
    set((s) => {
      const config = { ...s.config, services: [...s.config.services, svc] }
      const { nodes, edges } = configToFlow(config)
      return { config, nodes, edges }
    })
  },

  updateService(id, patch) {
    set((s) => {
      const services = s.config.services.map((sv) => (sv.id === id ? { ...sv, ...patch } : sv))
      const config = { ...s.config, services }
      const nodes: SNode[] = s.nodes.map((n) => {
        if (n.id !== id) return n
        const updated = services.find((sv) => sv.id === id)!
        return { ...n, data: { ...n.data, service: updated } }
      })
      return { config, nodes }
    })
  },

  removeService(id) {
    set((s) => {
      const services = s.config.services.filter((sv) => sv.id !== id)
      const interactions = s.config.interactions.filter(
        (ix) => !ix.from.startsWith(id) && !ix.to.startsWith(id),
      )
      const config = { ...s.config, services, interactions }
      const { nodes, edges } = configToFlow(config)
      return { config, nodes, edges }
    })
  },

  addInteraction(ix) {
    set((s) => {
      const interactions = [...s.config.interactions, ix]
      const config = { ...s.config, interactions }
      const { nodes, edges } = configToFlow(config)
      return { config, nodes, edges }
    })
  },

  updateInteraction(id, patch) {
    set((s) => {
      const interactions = s.config.interactions.map((ix) =>
        ix.id === id ? { ...ix, ...patch } : ix,
      )
      const config = { ...s.config, interactions }
      const { nodes, edges } = configToFlow(config)
      return { config, nodes, edges }
    })
  },

  removeInteraction(id) {
    set((s) => {
      const interactions = s.config.interactions.filter((ix) => ix.id !== id)
      const config = { ...s.config, interactions }
      const { nodes, edges } = configToFlow(config)
      return { config, nodes, edges }
    })
  },

  autoLayout() {
    set((s) => {
      const nodes = applyDagreLayout(s.nodes, s.edges)
      const config = flowToConfig(s.config, nodes, s.edges)
      return { nodes, config }
    })
  },

  getConfig() {
    return get().config
  },
}))

export function useNodeHighlight(nodeId: string): 'highlighted' | 'dimmed' | 'normal' {
  const { trace, selectedMember } = useGraphStore()
  if (!trace || !selectedMember) return 'normal'
  if (trace.involvedServiceIds.has(nodeId)) return 'highlighted'
  return 'dimmed'
}

export function useEdgeHighlight(edgeId: string): 'callee' | 'caller' | 'dimmed' | 'normal' {
  const { trace, selectedMember } = useGraphStore()
  if (!trace || !selectedMember) return 'normal'
  if (trace.calleeInteractionIds.has(edgeId)) return 'callee'
  if (trace.callerInteractionIds.has(edgeId)) return 'caller'
  return 'dimmed'
}
