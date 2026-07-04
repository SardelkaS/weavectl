import { Config, SelectedMember } from '../types/schema'
import { isServiceLevel } from './serializer'

export interface TraceResult {
  /** Interaction IDs that are reachable from the selected member (callees) */
  calleeInteractionIds: Set<string>
  /** Interaction IDs that lead to the selected member (callers) */
  callerInteractionIds: Set<string>
  /** Service IDs involved */
  involvedServiceIds: Set<string>
}

function memberRef(serviceId: string, memberId?: string): string {
  return memberId ? `${serviceId}.${memberId}` : serviceId
}

function serviceIdOf(ref: string): string {
  return ref.split('.')[0]
}

/**
 * BFS over interactions starting from the selected member.
 *
 * Traversal only ever follows an exact "from"/"to" ref match — reaching a
 * service through one of its members never fans out into that service's
 * other, unrelated members. A call is only highlighted when it chains
 * directly off the specific endpoint/task/event that was actually invoked;
 * if that member has no further outgoing (or incoming) interactions, the
 * trace stops there instead of sweeping in the rest of the service.
 */
export function computeTrace(cfg: Config, selected: SelectedMember): TraceResult {
  const startRef = memberRef(selected.serviceId, selected.memberId)
  const calleeInteractionIds = new Set<string>()
  const callerInteractionIds = new Set<string>()
  const involvedServiceIds = new Set<string>([selected.serviceId])

  // Forward BFS — what does the selected member call, directly or transitively?
  const forwardQueue = [startRef]
  const forwardVisited = new Set<string>()
  while (forwardQueue.length > 0) {
    const ref = forwardQueue.shift()!
    if (forwardVisited.has(ref)) continue
    forwardVisited.add(ref)

    for (const ix of cfg.interactions) {
      if (isServiceLevel(ix)) continue
      if (ix.from !== ref) continue
      calleeInteractionIds.add(ix.id)
      involvedServiceIds.add(serviceIdOf(ix.from))
      involvedServiceIds.add(serviceIdOf(ix.to))
      forwardQueue.push(ix.to)
    }
  }

  // Backward BFS — what calls the selected member, directly or transitively?
  const backwardQueue = [startRef]
  const backwardVisited = new Set<string>()
  while (backwardQueue.length > 0) {
    const ref = backwardQueue.shift()!
    if (backwardVisited.has(ref)) continue
    backwardVisited.add(ref)

    for (const ix of cfg.interactions) {
      if (isServiceLevel(ix)) continue
      if (ix.to !== ref) continue
      callerInteractionIds.add(ix.id)
      involvedServiceIds.add(serviceIdOf(ix.from))
      involvedServiceIds.add(serviceIdOf(ix.to))
      backwardQueue.push(ix.from)
    }
  }

  return { calleeInteractionIds, callerInteractionIds, involvedServiceIds }
}
