import { memo, useState } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import {
  ChevronDown, ChevronRight, Globe, Zap, Radio, Settings,
  Server, Database, MessageSquare, Shield, Link, Layers, LucideIcon,
} from 'lucide-react'
import { Service, ServiceShape } from '../types/schema'
import { useGraphStore, useNodeHighlight } from '../store/graph'
import {
  ENDPOINT_TYPE_COLORS,
  TASK_TYPE_COLORS,
  EVENT_TYPE_COLORS,
  INTERNAL_PROCESS_COLOR,
} from '../lib/interactionStyles'

export type ServiceNodeData = { service: Service } & Record<string, unknown>
export type ServiceNodeType = Node<ServiceNodeData, 'service'>

// ─── Shape definitions ────────────────────────────────────────────────────────

interface ShapeDef {
  label: string
  Icon: LucideIcon
  /** Tailwind rounded class */
  rounded: string
  /** CSS border style */
  borderStyle: 'solid' | 'dashed'
  /** Tailwind border-width class */
  borderWidth: string
  /** Small chip shown in the header */
  chipClass: string
}

export const SHAPE_DEFS: Record<ServiceShape, ShapeDef> = {
  service: {
    label: 'Service',
    Icon: Server,
    rounded: 'rounded-xl',
    borderStyle: 'solid',
    borderWidth: 'border-2',
    chipClass: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  },
  database: {
    label: 'Database',
    Icon: Database,
    rounded: 'rounded-sm',
    borderStyle: 'solid',
    borderWidth: 'border-2',
    chipClass: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
  },
  queue: {
    label: 'Queue',
    Icon: MessageSquare,
    rounded: 'rounded-lg',
    borderStyle: 'solid',
    borderWidth: 'border-2',
    chipClass: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
  },
  gateway: {
    label: 'Gateway',
    Icon: Shield,
    rounded: 'rounded-3xl',
    borderStyle: 'solid',
    borderWidth: 'border-[3px]',
    chipClass: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  },
  cache: {
    label: 'Cache',
    Icon: Zap,
    rounded: 'rounded-lg',
    borderStyle: 'dashed',
    borderWidth: 'border-2',
    chipClass: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  },
  external: {
    label: 'External',
    Icon: Link,
    rounded: 'rounded-sm',
    borderStyle: 'dashed',
    borderWidth: 'border-2',
    chipClass: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300',
  },
}

// ─── Member rows ──────────────────────────────────────────────────────────────

function EndpointRow({ svcId, id, name, type }: { svcId: string; id: string; name: string; type: string }) {
  const { selectMember, selectedMember } = useGraphStore()
  const isSelected = selectedMember?.serviceId === svcId && selectedMember?.memberId === id
  const color = ENDPOINT_TYPE_COLORS[type] ?? '#6B7280'

  return (
    <div
      className={`relative flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors
        ${isSelected ? 'bg-indigo-100 dark:bg-indigo-950 ring-1 ring-indigo-400 dark:ring-indigo-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      onClick={(e) => {
        e.stopPropagation()
        selectMember(isSelected ? null : { serviceId: svcId, memberId: id, memberType: 'endpoint' })
      }}
    >
      <Handle type="target" position={Position.Left} id={`${id}-tgt`}
        style={{ left: -6, width: 8, height: 8, background: color, border: '1px solid white' }} />
      <span className="inline-block px-1 rounded text-white font-mono text-[10px]" style={{ background: color }}>
        {type.toUpperCase()}
      </span>
      <span className="truncate text-gray-700 dark:text-gray-200">{name}</span>
      <Handle type="source" position={Position.Right} id={`${id}-src`}
        style={{ right: -6, width: 8, height: 8, background: color, border: '1px solid white' }} />
    </div>
  )
}

function TaskRow({ svcId, id, name, type }: { svcId: string; id: string; name: string; type: string }) {
  const { selectMember, selectedMember } = useGraphStore()
  const isSelected = selectedMember?.serviceId === svcId && selectedMember?.memberId === id
  const color = TASK_TYPE_COLORS[type] ?? '#6B7280'

  return (
    <div
      className={`relative flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors
        ${isSelected ? 'bg-orange-100 dark:bg-orange-950 ring-1 ring-orange-400 dark:ring-orange-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      onClick={(e) => {
        e.stopPropagation()
        selectMember(isSelected ? null : { serviceId: svcId, memberId: id, memberType: 'async' })
      }}
    >
      <Handle type="target" position={Position.Left} id={`${id}-tgt`}
        style={{ left: -6, width: 8, height: 8, background: color, border: '1px solid white' }} />
      <span className="inline-block px-1 rounded text-white font-mono text-[10px] truncate max-w-[80px]" style={{ background: color }}>
        {type.replace(/_/g, ' ')}
      </span>
      <span className="truncate text-gray-700 dark:text-gray-200">{name}</span>
      <Handle type="source" position={Position.Right} id={`${id}-src`}
        style={{ right: -6, width: 8, height: 8, background: color, border: '1px solid white' }} />
    </div>
  )
}

function EventRow({ svcId, id, name, type }: { svcId: string; id: string; name: string; type: string }) {
  const { selectMember, selectedMember } = useGraphStore()
  const isSelected = selectedMember?.serviceId === svcId && selectedMember?.memberId === id
  const color = EVENT_TYPE_COLORS[type] ?? '#6B7280'

  return (
    <div
      className={`relative flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors
        ${isSelected ? 'bg-green-100 dark:bg-green-950 ring-1 ring-green-400 dark:ring-green-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      onClick={(e) => {
        e.stopPropagation()
        selectMember(isSelected ? null : { serviceId: svcId, memberId: id, memberType: 'event' })
      }}
    >
      <Handle type="target" position={Position.Left} id={`${id}-tgt`}
        style={{ left: -6, width: 8, height: 8, background: color, border: '1px solid white' }} />
      <span className="inline-block px-1 rounded text-white font-mono text-[10px]" style={{ background: color }}>
        {type.toUpperCase()}
      </span>
      <span className="truncate text-gray-700 dark:text-gray-200">{name}</span>
      <Handle type="source" position={Position.Right} id={`${id}-src`}
        style={{ right: -6, width: 8, height: 8, background: color, border: '1px solid white' }} />
    </div>
  )
}

function InternalRow({ svcId, id, name }: { svcId: string; id: string; name: string }) {
  const { selectMember, selectedMember } = useGraphStore()
  const isSelected = selectedMember?.serviceId === svcId && selectedMember?.memberId === id

  return (
    <div
      className={`relative flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors
        ${isSelected ? 'bg-slate-200 dark:bg-slate-700 ring-1 ring-slate-400 dark:ring-slate-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      onClick={(e) => {
        e.stopPropagation()
        selectMember(isSelected ? null : { serviceId: svcId, memberId: id, memberType: 'internal' })
      }}
    >
      <Handle type="target" position={Position.Left} id={`${id}-tgt`}
        style={{ left: -6, width: 8, height: 8, background: INTERNAL_PROCESS_COLOR, border: '1px solid white' }} />
      <span className="inline-block px-1 rounded text-white font-mono text-[10px]" style={{ background: INTERNAL_PROCESS_COLOR }}>
        INT
      </span>
      <span className="truncate text-gray-700 dark:text-gray-200">{name}</span>
      <Handle type="source" position={Position.Right} id={`${id}-src`}
        style={{ right: -6, width: 8, height: 8, background: INTERNAL_PROCESS_COLOR, border: '1px solid white' }} />
    </div>
  )
}

function Section({ label, icon, count, children }: {
  label: string; icon: React.ReactNode; count: number; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  if (count === 0) return null
  return (
    <div className="mt-1">
      <button
        className="flex items-center gap-1 w-full px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 uppercase tracking-wide"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
      >
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        {icon}
        {label} ({count})
      </button>
      {open && <div className="space-y-0.5 px-1">{children}</div>}
    </div>
  )
}

// ─── Database cylinder decoration ─────────────────────────────────────────────

function DbTop({ color }: { color: string }) {
  return (
    <div className="absolute -top-2.5 left-3 right-3 h-5 flex items-center justify-center pointer-events-none">
      <div className="w-full h-5 rounded-full border-2" style={{ borderColor: color, background: `${color}22` }} />
    </div>
  )
}

// ─── Main node component ──────────────────────────────────────────────────────

export default memo(function ServiceNode({ data, selected }: NodeProps<ServiceNodeType>) {
  const { service } = data
  const shape: ServiceShape = service.shape ?? 'service'
  const shapeDef = SHAPE_DEFS[shape] ?? SHAPE_DEFS.service
  const { Icon } = shapeDef

  const highlight = useNodeHighlight(service.id)
  const { selectService } = useGraphStore()

  const borderColor = highlight === 'highlighted'
    ? '#4F46E5'
    : selected
    ? '#6366F1'
    : (service.color ?? '#CBD5E1')

  const opacity = highlight === 'dimmed' ? 0.35 : 1

  const isDb = shape === 'database'

  return (
    <div
      className={`bg-white dark:bg-gray-800 ${shapeDef.rounded} shadow-lg ${shapeDef.borderWidth} min-w-[240px] max-w-[300px] select-none transition-all relative`}
      style={{ borderColor, opacity, borderStyle: shapeDef.borderStyle }}
      onClick={() => selectService(service.id)}
    >
      {isDb && <DbTop color={service.color ?? '#22C55E'} />}

      {/* Whole-service handles — kept only so legacy bare-ref interactions (from before
          service-level connections were disallowed) still have somewhere to anchor;
          not connectable, so new connections can't be dragged from/to them. */}
      <Handle type="target" position={Position.Left} id="default-tgt" isConnectable={false}
        style={{ top: 24, left: -6, width: 10, height: 10, background: service.color ?? '#CBD5E1', border: '2px solid white' }} />
      <Handle type="source" position={Position.Right} id="default-src" isConnectable={false}
        style={{ top: 24, right: -6, width: 10, height: 10, background: service.color ?? '#CBD5E1', border: '2px solid white' }} />

      {/* Header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 ${isDb ? 'mt-2' : ''} ${shapeDef.rounded.replace('rounded', 'rounded-t')}`}
        style={{ background: `${service.color ?? '#CBD5E1'}18` }}
      >
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: service.color ?? '#CBD5E1' }} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{service.name}</div>
          {service.description && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{service.description}</div>
          )}
        </div>
        {/* Shape badge */}
        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold shrink-0 ${shapeDef.chipClass}`}>
          <Icon size={8} />
          {shapeDef.label}
        </span>
      </div>

      {/* Members */}
      <div className="px-1 pb-2 pt-1">
        <Section label="Endpoints" icon={<Globe size={10} />} count={service.endpoints?.length ?? 0}>
          {service.endpoints?.map((ep) => (
            <EndpointRow key={ep.id} svcId={service.id} id={ep.id} name={ep.name} type={ep.type} />
          ))}
        </Section>
        <Section label="Async" icon={<Layers size={10} />} count={service.async?.length ?? 0}>
          {service.async?.map((t) => (
            <TaskRow key={t.id} svcId={service.id} id={t.id} name={t.name} type={t.type} />
          ))}
        </Section>
        <Section label="Events" icon={<Radio size={10} />} count={service.events?.length ?? 0}>
          {service.events?.map((ev) => (
            <EventRow key={ev.id} svcId={service.id} id={ev.id} name={ev.name} type={ev.type} />
          ))}
        </Section>
        <Section label="Internal" icon={<Settings size={10} />} count={service.internal?.length ?? 0}>
          {service.internal?.map((proc) => (
            <InternalRow key={proc.id} svcId={service.id} id={proc.id} name={proc.name} />
          ))}
        </Section>
        {(!service.endpoints?.length && !service.async?.length && !service.events?.length && !service.internal?.length) && (
          <div className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 dark:text-gray-500">
            <Settings size={10} />
            <span>No members — click Edit to add</span>
          </div>
        )}
      </div>
    </div>
  )
})
