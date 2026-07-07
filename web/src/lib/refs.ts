import { Service, SelectedMember } from '../types/schema'

export interface ResolvedRef {
  /** Human-readable label, e.g. "Order Service" or "Order Service · CreateOrder". */
  label: string
  /** Present when the ref points at a specific endpoint/task/event. */
  member?: SelectedMember
}

/**
 * Resolve a `serviceId` or `serviceId.memberId` ref into a human-readable label and,
 * when it points at a specific member, the `SelectedMember` descriptor for it (so
 * callers can wire the ref up to call-graph tracing / the member editor).
 */
export function resolveRef(services: Service[], ref: string): ResolvedRef {
  const [svcId, ...rest] = ref.split('.')
  const memberId = rest.join('.')
  const svc = services.find((s) => s.id === svcId)
  const serviceName = svc?.name ?? svcId
  if (!memberId) return { label: serviceName }

  const endpoint = svc?.endpoints?.find((e) => e.id === memberId)
  if (endpoint) {
    return { label: `${serviceName} · ${endpoint.name}`, member: { serviceId: svcId, memberId, memberType: 'endpoint' } }
  }
  const task = svc?.async?.find((t) => t.id === memberId)
  if (task) {
    return { label: `${serviceName} · ${task.name}`, member: { serviceId: svcId, memberId, memberType: 'async' } }
  }
  const event = svc?.events?.find((e) => e.id === memberId)
  if (event) {
    return { label: `${serviceName} · ${event.name}`, member: { serviceId: svcId, memberId, memberType: 'event' } }
  }
  const internal = svc?.internal?.find((p) => p.id === memberId)
  if (internal) {
    return { label: `${serviceName} · ${internal.name}`, member: { serviceId: svcId, memberId, memberType: 'internal' } }
  }
  return { label: `${serviceName} · ${memberId}` }
}
