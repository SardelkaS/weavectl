export type EndpointType = 'http' | 'grpc' | 'graphql' | 'websocket'
export type AsyncTaskType =
  | 'kafka_consumer'
  | 'kafka_producer'
  | 'cron'
  | 'worker'
  | 'amqp_consumer'
  | 'amqp_producer'
  | 'task'
export type EventType = 'publish' | 'subscribe'
export type InteractionType =
  | 'http'
  | 'grpc'
  | 'kafka'
  | 'amqp'
  | 'redis'
  | 'database'
  | 'websocket'
  | 'graphql'

export interface Position {
  x: number
  y: number
}

export interface Endpoint {
  id: string
  name: string
  type: EndpointType
  method?: string
  path?: string
  description?: string
  tags?: string[]
}

export interface AsyncTask {
  id: string
  name: string
  type: AsyncTaskType
  topic?: string
  queue?: string
  schedule?: string
  description?: string
  tags?: string[]
}

export interface Event {
  id: string
  name: string
  type: EventType
  topic?: string
  description?: string
  tags?: string[]
}

export type ServiceShape = 'service' | 'database' | 'queue' | 'gateway' | 'cache' | 'external'

export interface Service {
  id: string
  name: string
  description?: string
  color?: string
  shape?: ServiceShape
  tags?: string[]
  position?: Position
  endpoints?: Endpoint[]
  async?: AsyncTask[]
  events?: Event[]
}

export interface Interaction {
  id: string
  from: string // serviceId or serviceId.memberId
  to: string   // serviceId or serviceId.memberId
  type: InteractionType
  label?: string
  description?: string
  async?: boolean
  metadata?: Record<string, unknown>
}

export interface Config {
  version: string
  name: string
  description?: string
  ai_prompt?: string
  services: Service[]
  interactions: Interaction[]
}

// A selected sub-member within a service node
export interface SelectedMember {
  serviceId: string
  memberId: string
  memberType: 'endpoint' | 'async' | 'event'
}
