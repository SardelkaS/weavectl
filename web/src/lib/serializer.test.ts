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

  it('still renders a legacy bare-to-bare interaction as an edge, anchored on the non-connectable default handles', () => {
    // New interactions can no longer be created this way (see Canvas.onConnect), but old
    // configs that predate that rule shouldn't have the edge silently vanish.
    const cfg: Config = {
      version: '1.0',
      name: 'test',
      services: [svc('a'), svc('b')],
      interactions: [ix('a-to-b', 'a', 'b')],
    }

    const { edges } = configToFlow(cfg)

    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({ source: 'a', target: 'b', sourceHandle: 'default-src', targetHandle: 'default-tgt' })
  })

  it('passes internal-process members through onto node data alongside endpoints/async/events', () => {
    const cfg: Config = {
      version: '1.0',
      name: 'test',
      services: [svc('a', { internal: [{ id: 'db-access', name: 'DbAccess' }] })],
      interactions: [],
    }

    const { nodes } = configToFlow(cfg)
    const nodeA = nodes.find((n) => n.id === 'a') as ServiceNodeType
    expect(nodeA.data.service.internal).toEqual([{ id: 'db-access', name: 'DbAccess' }])
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
