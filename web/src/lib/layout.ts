import dagre from '@dagrejs/dagre'
import { Node, Edge } from '@xyflow/react'

const NODE_WIDTH = 280
const NODE_HEIGHT = 200

export function applyDagreLayout<N extends Node>(nodes: N[], edges: Edge[]): N[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', ranksep: 220, nodesep: 80, marginx: 40, marginy: 40 })

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  return nodes.map((node) => {
    const n = g.node(node.id)
    return { ...node, position: { x: n.x - NODE_WIDTH / 2, y: n.y - NODE_HEIGHT / 2 } }
  })
}
