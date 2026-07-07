import { describe, expect, it } from 'vitest'
import { configToFlow, flowToConfig, isServiceLevel } from './serializer'
import { Config, Interaction, Service } from '../types/schema'
import { ServiceNodeType } from '../components/ServiceNode'

function svc(id: string, extra: Partial<Service> = {}): Service {
  return { id, name: id, ...extra }
}

function ix(id: string, from: string, to: string): Interaction {
  return { id, from, to, type: 'http' }
}

describe('isServiceLevel', () => {
  it('is true only when both ends are bare service ids', () => {
    expect(isServiceLevel(ix('i', 'a', 'b'))).toBe(true)
    expect(isServiceLevel(ix('i', 'a.x', 'b'))).toBe(false)
    expect(isServiceLevel(ix('i', 'a', 'b.y'))).toBe(false)
    expect(isServiceLevel(ix('i', 'a.x', 'b.y'))).toBe(false)
  })
})

describe('configToFlow', () => {
  it('turns services into nodes and non-service-level interactions into edges', () => {
    const cfg: Config = {
      version: '1.0',
      name: 'test',
      services: [svc('a'), svc('b')],
      interactions: [ix('a-x-to-b-y', 'a.x', 'b.y')],
    }

    const { nodes, edges } = configToFlow(cfg)

    expect(nodes.map((n) => n.id)).toEqual(['a', 'b'])
    expect(nodes.every((n) => n.type === 'service')).toBe(true)

    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({
      id: 'a-x-to-b-y',
      source: 'a',
      target: 'b',
      sourceHandle: 'x-src',
      targetHandle: 'y-tgt',
      type: 'interaction',
    })
  })

  it('uses default handles for bare (memberless) endpoints', () => {
    const cfg: Config = {
      version: '1.0',
      name: 'test',
      services: [svc('a'), svc('b')],
      interactions: [ix('a-to-b', 'a', 'b.y')],
    }

    const { edges } = configToFlow(cfg)
    expect(edges[0].sourceHandle).toBe('default-src')
    expect(edges[0].targetHandle).toBe('y-tgt')
  })

  it('routes service-level (bare-to-bare) interactions onto node data instead of edges', () => {
    const cfg: Config = {
      version: '1.0',
      name: 'test',
      services: [svc('a'), svc('b')],
      interactions: [ix('a-internal-to-b', 'a', 'b')],
    }

    const { nodes, edges } = configToFlow(cfg)

    expect(edges).toHaveLength(0)
    const nodeA = nodes.find((n) => n.id === 'a') as ServiceNodeType
    const nodeB = nodes.find((n) => n.id === 'b') as ServiceNodeType
    expect(nodeA.data.serviceInteractions).toHaveLength(1)
    expect(nodeB.data.serviceInteractions).toHaveLength(1)
    expect(nodeA.data.serviceInteractions[0].id).toBe('a-internal-to-b')
  })

  it('lists a half-bare interaction (one bare side, one specific endpoint) as internal for the bare side only, while still rendering it as an edge', () => {
    const cfg: Config = {
      version: '1.0',
      name: 'test',
      services: [svc('a'), svc('b')],
      interactions: [ix('a-to-b-y', 'a', 'b.y')],
    }

    const { nodes, edges } = configToFlow(cfg)

    // Still a real, connectable edge — the specific side has a handle to attach to.
    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({ source: 'a', target: 'b', targetHandle: 'y-tgt' })

    // Internal card: only service "a" (the bare side) lists it; "b" (specific side) does not.
    const nodeA = nodes.find((n) => n.id === 'a') as ServiceNodeType
    const nodeB = nodes.find((n) => n.id === 'b') as ServiceNodeType
    expect(nodeA.data.serviceInteractions).toHaveLength(1)
    expect(nodeA.data.serviceInteractions[0].id).toBe('a-to-b-y')
    expect(nodeB.data.serviceInteractions).toHaveLength(0)
  })

  it('falls back to (0,0) position when a service has none set', () => {
    const cfg: Config = {
      version: '1.0',
      name: 'test',
      services: [svc('a', { position: { x: 120, y: 40 } }), svc('b')],
      interactions: [],
    }

    const { nodes } = configToFlow(cfg)
    expect(nodes.find((n) => n.id === 'a')!.position).toEqual({ x: 120, y: 40 })
    expect(nodes.find((n) => n.id === 'b')!.position).toEqual({ x: 0, y: 0 })
  })
})

describe('flowToConfig', () => {
  it('writes rounded node positions back onto the matching services', () => {
    const cfg: Config = {
      version: '1.0',
      name: 'test',
      services: [svc('a', { description: 'keep me' })],
      interactions: [],
    }
    const { nodes } = configToFlow(cfg)
    const movedNodes = nodes.map((n) => ({ ...n, position: { x: 10.6, y: -3.4 } }))

    const updated = flowToConfig(cfg, movedNodes, [])

    expect(updated.services[0].position).toEqual({ x: 11, y: -3 })
    expect(updated.services[0].description).toBe('keep me')
  })
})
