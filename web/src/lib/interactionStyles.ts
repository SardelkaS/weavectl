import { InteractionType, EndpointType, AsyncTaskType } from '../types/schema'

export interface EdgeStyle {
  color: string
  strokeDasharray?: string
  label: string
  markerEnd?: string
}

export const INTERACTION_STYLES: Record<InteractionType, EdgeStyle> = {
  http:      { color: '#3B82F6', label: 'HTTP',     strokeDasharray: undefined },
  grpc:      { color: '#8B5CF6', label: 'gRPC',     strokeDasharray: undefined },
  graphql:   { color: '#EC4899', label: 'GraphQL',  strokeDasharray: undefined },
  websocket: { color: '#14B8A6', label: 'WS',       strokeDasharray: '8 4' },
  kafka:     { color: '#F97316', label: 'Kafka',    strokeDasharray: '6 3' },
  amqp:      { color: '#EAB308', label: 'AMQP',    strokeDasharray: '6 3' },
  redis:     { color: '#EF4444', label: 'Redis',    strokeDasharray: '3 3' },
  database:  { color: '#22C55E', label: 'DB',       strokeDasharray: undefined },
}

export const INTERACTION_TYPES: InteractionType[] = [
  'http', 'grpc', 'graphql', 'websocket', 'kafka', 'amqp', 'redis', 'database',
]

export const SERVICE_COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#D97706',
  '#059669', '#0891B2', '#2563EB', '#475569', '#0D9488',
]

export const ENDPOINT_TYPE_COLORS: Record<string, string> = {
  http:      '#3B82F6',
  grpc:      '#8B5CF6',
  graphql:   '#EC4899',
  websocket: '#14B8A6',
}

export const TASK_TYPE_COLORS: Record<string, string> = {
  kafka_consumer: '#F97316',
  kafka_producer: '#FB923C',
  amqp_consumer:  '#EAB308',
  amqp_producer:  '#FDE047',
  cron:           '#6B7280',
  worker:         '#9CA3AF',
  task:           '#A78BFA',
}

export const EVENT_TYPE_COLORS: Record<string, string> = {
  publish:   '#22C55E',
  subscribe: '#86EFAC',
}

/** Single badge color for internal-process members (no sub-type to color by). */
export const INTERNAL_PROCESS_COLOR = '#64748B'

export const ENDPOINT_TYPES: EndpointType[] = ['http', 'grpc', 'graphql', 'websocket']

export const TASK_TYPES: AsyncTaskType[] = [
  'kafka_consumer', 'kafka_producer', 'amqp_consumer', 'amqp_producer', 'cron', 'worker', 'task',
]

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
