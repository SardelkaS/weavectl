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

/** BFS over interactions starting from the selected member. */
export function computeTrace(cfg: Config, selected: SelectedMember): TraceResult {
  const startRef = memberRef(selected.serviceId, selected.memberId)
  const calleeInteractionIds = new Set<string>()
  const callerInteractionIds = new Set<string>()
  const involvedServiceIds = new Set<string>([selected.serviceId])

  // Forward BFS — what does the selected method call?
  const forwardQueue = [startRef]
  const forwardVisited = new Set<string>()
  while (forwardQueue.length > 0) {
    const ref = forwardQueue.shift()!
    if (forwardVisited.has(ref)) continue
    forwardVisited.add(ref)

    for (const ix of cfg.interactions) {
      if (isServiceLevel(ix)) continue
      const fromSvc = serviceIdOf(ix.from)
      const fromMatches = ix.from === ref || ix.from.startsWith(ref + '.')
      if (fromMatches) {
        calleeInteractionIds.add(ix.id)
        const toSvc = serviceIdOf(ix.to)
        involvedServiceIds.add(toSvc)
        involvedServiceIds.add(fromSvc)
        forwardQueue.push(ix.to)
        forwardQueue.push(toSvc)
      }
    }
  }

  // Backward BFS — what calls the selected method?
  const backwardQueue = [startRef]
  const backwardVisited = new Set<string>()
  while (backwardQueue.length > 0) {
    const ref = backwardQueue.shift()!
    if (backwardVisited.has(ref)) continue
    backwardVisited.add(ref)

    for (const ix of cfg.interactions) {
      if (isServiceLevel(ix)) continue
      const toSvc = serviceIdOf(ix.to)
      const toMatches = ix.to === ref || ix.to.startsWith(ref + '.')
      if (toMatches) {
        callerInteractionIds.add(ix.id)
        const fromSvc = serviceIdOf(ix.from)
        involvedServiceIds.add(fromSvc)
        involvedServiceIds.add(toSvc)
        backwardQueue.push(ix.from)
        backwardQueue.push(fromSvc)
      }
    }
  }

  return { calleeInteractionIds, callerInteractionIds, involvedServiceIds }
}
