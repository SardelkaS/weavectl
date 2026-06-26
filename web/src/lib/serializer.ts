import { Node, Edge } from '@xyflow/react'
import { Config, Service, Interaction } from '../types/schema'
import { ServiceNodeData, ServiceNodeType } from '../components/ServiceNode'
import { InteractionEdgeData, InteractionEdgeType } from '../components/InteractionEdge'

export function configToFlow(cfg: Config): {
  nodes: Node<ServiceNodeData>[]
  edges: Edge<InteractionEdgeData>[]
} {
  const nodes: ServiceNodeType[] = cfg.services.map((svc) => ({
    id: svc.id,
    type: 'service' as const,
    position: svc.position ?? { x: 0, y: 0 },
    data: { service: svc },
  }))

  const edges: InteractionEdgeType[] = cfg.interactions.map((ix) => {
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
