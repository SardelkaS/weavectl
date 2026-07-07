import { Node, Edge } from '@xyflow/react'
import { Config, Service, Interaction } from '../types/schema'
import { ServiceNodeData, ServiceNodeType } from '../components/ServiceNode'
import { InteractionEdgeData, InteractionEdgeType } from '../components/InteractionEdge'

/** True when both ends are plain service IDs (no member routing). */
export function isServiceLevel(ix: Interaction): boolean {
  return !ix.from.includes('.') && !ix.to.includes('.')
}

/** True when a ref is a bare service ID (no `.memberId` suffix). */
function isBareRef(ref: string): boolean {
  return !ref.includes('.')
}

export function configToFlow(cfg: Config): {
  nodes: Node<ServiceNodeData>[]
  edges: Edge<InteractionEdgeData>[]
} {
  // An interaction shows up in a service's "Internal" card whenever THAT service's own
  // side of the connection is a bare service ref (no specific endpoint/task/event) —
  // regardless of whether the other side is bare too or points at a specific member.
  // Interactions that are fully bare (both sides) are internal-only and never become an
  // edge; half-bare ones (one side specific) are internal for the bare side *and* still
  // rendered as a normal edge, since the specific side has a real handle to connect to.
  const internalByService = new Map<string, Interaction[]>()
  const addInternal = (svcId: string, ix: Interaction) => {
    if (!internalByService.has(svcId)) internalByService.set(svcId, [])
    const arr = internalByService.get(svcId)!
    if (!arr.includes(ix)) arr.push(ix)
  }
  for (const ix of cfg.interactions) {
    if (isBareRef(ix.from)) addInternal(ix.from, ix)
    if (isBareRef(ix.to)) addInternal(ix.to, ix)
  }

  const nodes: ServiceNodeType[] = cfg.services.map((svc) => ({
    id: svc.id,
    type: 'service' as const,
    position: svc.position ?? { x: 0, y: 0 },
    data: { service: svc, serviceInteractions: internalByService.get(svc.id) ?? [] },
  }))

  const edges: InteractionEdgeType[] = cfg.interactions
    .filter((ix) => !isServiceLevel(ix))
    .map((ix) => {
      const fromParts = ix.from.split('.')
      const toParts = ix.to.split('.')
      return {
        id: ix.id,
        source: fromParts[0],
        target: toParts[0],
        sourceHandle: fromParts.length > 1 ? `${fromParts.slice(1).join('.')}-src` : 'default-src',
        targetHandle: toParts.length > 1 ? `${toParts.slice(1).join('.')}-tgt` : 'default-tgt',
        type: 'interaction' as const,
        data: { interaction: ix },
      }
    })

  return { nodes, edges }
}

export function flowToConfig(
  cfg: Config,
  nodes: Node<ServiceNodeData>[],
  _edges: Edge<InteractionEdgeData>[],
): Config {
  const serviceById = new Map<string, Service>(cfg.services.map((s) => [s.id, s]))

  const services: Service[] = nodes.map((n) => {
    const existing = serviceById.get(n.id) ?? n.data.service
    return { ...existing, position: { x: Math.round(n.position.x), y: Math.round(n.position.y) } }
  })

  return { ...cfg, services }
}

export function updateInteractionsInConfig(cfg: Config, interactions: Interaction[]): Config {
  return { ...cfg, interactions }
}
