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

const HISTORY_LIMIT = 50

interface GraphStore {
  config: Config
  nodes: SNode[]
  edges: SEdge[]

  /** Undo/redo history of past/future `config` snapshots. */
  past: Config[]
  future: Config[]
  /** True while a node drag gesture is in progress, so intermediate frames coalesce into one history entry. */
  dragActive: boolean

  selectedServiceId: string | null
  selectedInteractionId: string | null
  selectedMember: SelectedMember | null
  trace: TraceResult | null

  /** When true, selecting a graph element only highlights/traces it — the editor stays closed. */
  viewMode: boolean

  /** Global collapse/expand-all signal for the member groups inside every service node. */
  sectionsCollapsed: boolean

  loadConfig: (cfg: Config) => void
  onNodesChange: (changes: NodeChange<SNode>[]) => void
  onEdgesChange: (changes: EdgeChange<SEdge>[]) => void

  selectService: (id: string | null) => void
  selectInteraction: (id: string | null) => void
  selectMember: (member: SelectedMember | null) => void
  clearSelection: () => void
  toggleViewMode: () => void
  toggleSectionsCollapsed: () => void

  addService: (svc: Service) => void
  updateService: (id: string, patch: Partial<Service>) => void
  removeService: (id: string) => void
  addInteraction: (ix: Interaction) => void
  updateInteraction: (id: string, patch: Partial<Interaction>) => void
  removeInteraction: (id: string) => void

  autoLayout: () => void
  getConfig: () => Config

  undo: () => void
  redo: () => void
}

const EMPTY_CONFIG: Config = {
  version: '1.0',
  name: 'New Architecture',
  services: [],
  interactions: [],
}

/** Snapshot the current config onto the undo stack and clear the redo stack. */
function pushHistory(s: Pick<GraphStore, 'config' | 'past'>): Pick<GraphStore, 'past' | 'future'> {
  return { past: [...s.past, s.config].slice(-HISTORY_LIMIT), future: [] }
}

// Rapid-fire edits sharing the same key within COALESCE_MS (e.g. every keystroke while
// typing a field) collapse into a single undo step instead of one per keystroke.
let lastCoalesceKey: string | null = null
let lastCoalesceTime = 0
const COALESCE_MS = 700

function pushHistoryCoalesced(
  s: Pick<GraphStore, 'config' | 'past'>,
  key: string,
): Partial<Pick<GraphStore, 'past' | 'future'>> {
  const now = Date.now()
  if (key === lastCoalesceKey && now - lastCoalesceTime < COALESCE_MS) {
    lastCoalesceTime = now
    return {}
  }
  lastCoalesceKey = key
  lastCoalesceTime = now
  return pushHistory(s)
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  config: EMPTY_CONFIG,
  nodes: [],
  edges: [],
  past: [],
  future: [],
  dragActive: false,
  selectedServiceId: null,
  selectedInteractionId: null,
  selectedMember: null,
  trace: null,
  viewMode: false,
  sectionsCollapsed: false,

  loadConfig(cfg) {
    const { nodes, edges } = configToFlow(cfg)
    const allZero = nodes.every((n) => n.position.x === 0 && n.position.y === 0)
    const finalNodes = allZero && nodes.length > 1 ? applyDagreLayout(nodes, edges) : nodes
    lastCoalesceKey = null
    set({
      config: cfg,
      nodes: finalNodes,
      edges,
      past: [],
      future: [],
      selectedMember: null,
      trace: null,
      selectedServiceId: null,
      selectedInteractionId: null,
    })
  },

  onNodesChange(changes) {
    set((s) => {
      const hasRemove = changes.some((c) => c.type === 'remove')
      const dragStart = changes.some((c) => c.type === 'position' && c.dragging === true) && !s.dragActive
      const dragEnd = changes.some((c) => c.type === 'position' && c.dragging === false)

      const nodes = applyNodeChanges(changes, s.nodes) as SNode[]
      const config = flowToConfig(s.config, nodes, s.edges)
      const history = hasRemove || dragStart ? pushHistory(s) : {}

      return {
        nodes,
        config,
        dragActive: dragEnd ? false : dragStart ? true : s.dragActive,
        ...history,
      }
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

  toggleSectionsCollapsed() {
    set((s) => ({ sectionsCollapsed: !s.sectionsCollapsed }))
  },

  addService(svc) {
    set((s) => {
      const config = { ...s.config, services: [...s.config.services, svc] }
      const { nodes, edges } = configToFlow(config)
      return { config, nodes, edges, ...pushHistory(s) }
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
      return { config, nodes, ...pushHistoryCoalesced(s, `service:${id}`) }
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
      return { config, nodes, edges, ...pushHistory(s) }
    })
  },

  addInteraction(ix) {
    set((s) => {
      const interactions = [...s.config.interactions, ix]
      const config = { ...s.config, interactions }
      const { nodes, edges } = configToFlow(config)
      return { config, nodes, edges, ...pushHistory(s) }
    })
  },

  updateInteraction(id, patch) {
    set((s) => {
      const interactions = s.config.interactions.map((ix) =>
        ix.id === id ? { ...ix, ...patch } : ix,
      )
      const config = { ...s.config, interactions }
      const { nodes, edges } = configToFlow(config)
      return { config, nodes, edges, ...pushHistoryCoalesced(s, `interaction:${id}`) }
    })
  },

  removeInteraction(id) {
    set((s) => {
      const interactions = s.config.interactions.filter((ix) => ix.id !== id)
      const config = { ...s.config, interactions }
      const { nodes, edges } = configToFlow(config)
      return { config, nodes, edges, ...pushHistory(s) }
    })
  },

  autoLayout() {
    set((s) => {
      const nodes = applyDagreLayout(s.nodes, s.edges)
      const config = flowToConfig(s.config, nodes, s.edges)
      return { nodes, config, ...pushHistory(s) }
    })
  },

  getConfig() {
    return get().config
  },

  undo() {
    lastCoalesceKey = null
    set((s) => {
      if (s.past.length === 0) return {}
      const previous = s.past[s.past.length - 1]
      const { nodes, edges } = configToFlow(previous)
      return {
        config: previous,
        nodes,
        edges,
        past: s.past.slice(0, -1),
        future: [s.config, ...s.future].slice(0, HISTORY_LIMIT),
        selectedServiceId: null,
        selectedInteractionId: null,
        selectedMember: null,
        trace: null,
      }
    })
  },

  redo() {
    lastCoalesceKey = null
    set((s) => {
      if (s.future.length === 0) return {}
      const next = s.future[0]
      const { nodes, edges } = configToFlow(next)
      return {
        config: next,
        nodes,
        edges,
        past: [...s.past, s.config].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        selectedServiceId: null,
        selectedInteractionId: null,
        selectedMember: null,
        trace: null,
      }
    })
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

/**
 * Trace state for a single member row.
 * - `hasTrace`: a member is currently selected, so tracing is active.
 * - `inChain`: this member takes part in the traced call chain.
 */
export function useMemberTrace(serviceId: string, memberId: string): { hasTrace: boolean; inChain: boolean } {
  const trace = useGraphStore((s) => s.trace)
  if (!trace) return { hasTrace: false, inChain: false }
  return { hasTrace: true, inChain: trace.involvedMemberRefs.has(`${serviceId}.${memberId}`) }
}
