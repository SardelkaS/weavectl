import { describe, expect, it } from 'vitest'
import { resolveRef } from './refs'
import { Service } from '../types/schema'

const services: Service[] = [
  {
    id: 'order-service',
    name: 'Order Service',
    endpoints: [{ id: 'create-order', name: 'CreateOrder', type: 'grpc' }],
    async: [{ id: 'payment-consumer', name: 'PaymentResultConsumer', type: 'kafka_consumer' }],
    events: [{ id: 'order-created', name: 'OrderCreated', type: 'publish' }],
  },
  { id: 'postgres', name: 'PostgreSQL' },
]

describe('resolveRef', () => {
  it('resolves a bare service ref to just the service name, with no member', () => {
    expect(resolveRef(services, 'order-service')).toEqual({ label: 'Order Service' })
  })

  it('resolves an endpoint ref to a combined label and an endpoint SelectedMember', () => {
    expect(resolveRef(services, 'order-service.create-order')).toEqual({
      label: 'Order Service · CreateOrder',
      member: { serviceId: 'order-service', memberId: 'create-order', memberType: 'endpoint' },
    })
  })

  it('resolves an async task ref to a combined label and an async SelectedMember', () => {
    expect(resolveRef(services, 'order-service.payment-consumer')).toEqual({
      label: 'Order Service · PaymentResultConsumer',
      member: { serviceId: 'order-service', memberId: 'payment-consumer', memberType: 'async' },
    })
  })

  it('resolves an event ref to a combined label and an event SelectedMember', () => {
    expect(resolveRef(services, 'order-service.order-created')).toEqual({
      label: 'Order Service · OrderCreated',
      member: { serviceId: 'order-service', memberId: 'order-created', memberType: 'event' },
    })
  })

  it('falls back to the raw id when the service is unknown', () => {
    expect(resolveRef(services, 'unknown-service')).toEqual({ label: 'unknown-service' })
  })

  it('falls back to the raw member id when the member does not exist on the service', () => {
    expect(resolveRef(services, 'order-service.no-such-member')).toEqual({
      label: 'Order Service · no-such-member',
    })
  })
})
