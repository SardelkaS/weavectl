import { describe, expect, it } from 'vitest'
import type { Node, Edge } from '@xyflow/react'
import { applyDagreLayout } from './layout'

function node(id: string): Node {
  return { id, position: { x: 0, y: 0 }, data: {} }
}

function edge(id: string, source: string, target: string): Edge {
  return { id, source, target }
}

describe('applyDagreLayout', () => {
  it('assigns every node a finite position', () => {
    const nodes = [node('a'), node('b'), node('c')]
    const edges = [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c')]

    const laidOut = applyDagreLayout(nodes, edges)

    expect(laidOut).toHaveLength(3)
    for (const n of laidOut) {
      expect(Number.isFinite(n.position.x)).toBe(true)
      expect(Number.isFinite(n.position.y)).toBe(true)
    }
  })

  it('places nodes left-to-right in call-chain order (rankdir LR)', () => {
    const nodes = [node('a'), node('b'), node('c')]
    const edges = [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c')]

    const laidOut = applyDagreLayout(nodes, edges)
    const byId = Object.fromEntries(laidOut.map((n) => [n.id, n.position]))

    expect(byId.a.x).toBeLessThan(byId.b.x)
    expect(byId.b.x).toBeLessThan(byId.c.x)
  })

  it('preserves node ids and count for disconnected nodes', () => {
    const nodes = [node('solo1'), node('solo2')]
    const laidOut = applyDagreLayout(nodes, [])

    expect(laidOut.map((n) => n.id).sort()).toEqual(['solo1', 'solo2'])
  })
})
