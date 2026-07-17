import { describe, expect, it } from 'vitest'
import { computeTrace } from './tracing'
import { Config, Interaction, Service } from '../types/schema'

function svc(id: string): Service {
  return { id, name: id }
}

function ix(id: string, from: string, to: string): Interaction {
  return { id, from, to, type: 'http' }
}

function configOf(services: string[], interactions: Interaction[]): Config {
  return {
    version: '1.0',
    name: 'test',
    services: services.map(svc),
    interactions,
  }
}

describe('computeTrace', () => {
  it('highlights only the direct callee when it has no further calls', () => {
    // a.x -> b.y, and b.y calls nothing else.
    const cfg = configOf(
      ['a', 'b'],
      [ix('a-x-to-b-y', 'a.x', 'b.y')],
    )
    const trace = computeTrace(cfg, { serviceId: 'a', memberId: 'x', memberType: 'endpoint' })

    expect(trace.calleeInteractionIds).toEqual(new Set(['a-x-to-b-y']))
    expect(trace.callerInteractionIds).toEqual(new Set())
    expect(trace.involvedServiceIds).toEqual(new Set(['a', 'b']))
  })

  it('collects the member refs of every member in the chain (incl. the selected one)', () => {
    // gateway.ep -> a.x -> b.y ; a also has an unrelated member a.z that isn't in the chain.
    const cfg = configOf(
      ['gateway', 'a', 'b'],
      [
        ix('gw-to-a', 'gateway.ep', 'a.x'),
        ix('a-to-b', 'a.x', 'b.y'),
        ix('z-to-b', 'a.z', 'b.y'),
      ],
    )
    const trace = computeTrace(cfg, { serviceId: 'a', memberId: 'x', memberType: 'endpoint' })

    // Selected member, its caller, and its callee are all in the chain…
    expect(trace.involvedMemberRefs.has('a.x')).toBe(true)
    expect(trace.involvedMemberRefs.has('gateway.ep')).toBe(true)
    expect(trace.involvedMemberRefs.has('b.y')).toBe(true)
    // …but a.z (an unrelated sibling that also calls b.y) is not.
    expect(trace.involvedMemberRefs.has('a.z')).toBe(false)
  })

  it('does not sweep in unrelated sibling members of a touched service (regression)', () => {
    // a.x -> b.y (b.y has no further calls). b also has an unrelated member b.w that
    // independently calls c — that call must NOT be highlighted just because b was touched.
    const cfg = configOf(
      ['a', 'b', 'c'],
      [
        ix('a-x-to-b-y', 'a.x', 'b.y'),
        ix('b-w-to-c', 'b.w', 'c.z'),
      ],
    )
    const trace = computeTrace(cfg, { serviceId: 'a', memberId: 'x', memberType: 'endpoint' })

    expect(trace.calleeInteractionIds).toEqual(new Set(['a-x-to-b-y']))
    expect(trace.calleeInteractionIds.has('b-w-to-c')).toBe(false)
    // The involved-services set may include b (the box lights up), but c is unrelated.
    expect(trace.involvedServiceIds.has('c')).toBe(false)
  })

  it('follows a transitive chain of exact member-to-member calls', () => {
    // a.x -> b.y -> c.z — selecting a.x should surface both hops.
    const cfg = configOf(
      ['a', 'b', 'c'],
      [
        ix('a-to-b', 'a.x', 'b.y'),
        ix('b-to-c', 'b.y', 'c.z'),
      ],
    )
    const trace = computeTrace(cfg, { serviceId: 'a', memberId: 'x', memberType: 'endpoint' })

    expect(trace.calleeInteractionIds).toEqual(new Set(['a-to-b', 'b-to-c']))
    expect(trace.involvedServiceIds).toEqual(new Set(['a', 'b', 'c']))
  })

  it('finds direct and transitive callers (backward trace)', () => {
    // gateway.ep -> a.x -> b.y — selecting a.x should surface the caller edge too.
    const cfg = configOf(
      ['gateway', 'a', 'b'],
      [
        ix('gw-to-a', 'gateway.ep', 'a.x'),
        ix('a-to-b', 'a.x', 'b.y'),
      ],
    )
    const trace = computeTrace(cfg, { serviceId: 'a', memberId: 'x', memberType: 'endpoint' })

    expect(trace.callerInteractionIds).toEqual(new Set(['gw-to-a']))
    expect(trace.calleeInteractionIds).toEqual(new Set(['a-to-b']))
  })

  it('preserves legitimate fan-out through a bare (memberless) bus service', () => {
    // a.evt -> bus (bare), then bus -> c.consumer and bus -> d.consumer (also bare "from").
    // These all share the exact same "bus" ref, so this is not sibling-member leakage.
    const cfg = configOf(
      ['a', 'bus', 'c', 'd'],
      [
        ix('a-to-bus', 'a.evt', 'bus'),
        ix('bus-to-c', 'bus', 'c.consumer'),
        ix('bus-to-d', 'bus', 'd.consumer'),
      ],
    )
    const trace = computeTrace(cfg, { serviceId: 'a', memberId: 'evt', memberType: 'event' })

    expect(trace.calleeInteractionIds).toEqual(new Set(['a-to-bus', 'bus-to-c', 'bus-to-d']))
  })

  it('ignores service-level (bare-to-bare) interactions entirely', () => {
    // a bare-to-bare interaction is rendered as "Internal" info, not a graph edge, and must
    // never be pulled into a member-level trace even if it shares a touched service.
    const cfg = configOf(
      ['a', 'b'],
      [
        ix('a-x-to-b-y', 'a.x', 'b.y'),
        ix('a-internal-to-b', 'a', 'b'),
      ],
    )
    const trace = computeTrace(cfg, { serviceId: 'a', memberId: 'x', memberType: 'endpoint' })

    expect(trace.calleeInteractionIds.has('a-internal-to-b')).toBe(false)
  })

  it('returns empty callee/caller sets for a member with no interactions', () => {
    const cfg = configOf(['a'], [])
    const trace = computeTrace(cfg, { serviceId: 'a', memberId: 'x', memberType: 'endpoint' })

    expect(trace.calleeInteractionIds.size).toBe(0)
    expect(trace.callerInteractionIds.size).toBe(0)
    expect(trace.involvedServiceIds).toEqual(new Set(['a']))
  })
})
