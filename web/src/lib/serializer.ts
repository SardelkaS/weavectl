import { Node, Edge } from '@xyflow/react'
import { Config, Service, Interaction } from '../types/schema'
import { ServiceNodeData, ServiceNodeType } from '../components/ServiceNode'
import { InteractionEdgeData, InteractionEdgeType } from '../components/InteractionEdge'

/** True when both ends are plain service IDs (no member routing). */
export function isServiceLevel(ix: Interaction): boolean {
  return !ix.from.includes('.') && !ix.to.includes('.')
}

export function configToFlow(cfg: Config): {
  nodes: Node<ServiceNodeData>[]
  edges: Edge<InteractionEdgeData>[]
} {
  // Partition interactions: service-level ones become card items, not edges.
  const svcLevelByService = new Map<string, Interaction[]>()
  for (const ix of cfg.interactions) {
    if (!isServiceLevel(ix)) continue
    for (const svcId of [ix.from, ix.to]) {
      if (!svcLevelByService.has(svcId)) svcLevelByService.set(svcId, [])
      // avoid duplicates when from === to
      const arr = svcLevelByService.get(svcId)!
      if (!arr.includes(ix)) arr.push(ix)
    }
  }

  const nodes: ServiceNodeType[] = cfg.services.map((svc) => ({
    id: svc.id,
    type: 'service' as const,
    position: svc.position ?? { x: 0, y: 0 },
    data: { service: svc, serviceInteractions: svcLevelByService.get(svc.id) ?? [] },
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
