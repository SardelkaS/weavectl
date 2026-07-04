import { X, Trash2 } from 'lucide-react'
import { Endpoint, AsyncTask, Event, EndpointType, AsyncTaskType, SelectedMember } from '../types/schema'
import { useGraphStore } from '../store/graph'
import {
  ENDPOINT_TYPE_COLORS, TASK_TYPE_COLORS,
  ENDPOINT_TYPES, TASK_TYPES, HTTP_METHODS,
} from '../lib/interactionStyles'
import { Field, Input, Textarea, Select } from './FormControls'

function EditorHeader({ color, badge, title, subtitle, onClose }: {
  color: string
  badge: string
  title: string
  subtitle: string
  onClose: () => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[10px] font-bold px-1 rounded text-white shrink-0 truncate max-w-[110px]"
            style={{ background: color }}
          >
            {badge}
          </span>
          <h3 className="font-semibold text-gray-800 truncate">{title}</h3>
        </div>
        <button className="text-gray-400 hover:text-gray-600 shrink-0" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="text-[11px] text-gray-400 truncate">{subtitle}</div>
    </div>
  )
}

function EndpointMemberEditor({ serviceId, ep, serviceName }: { serviceId: string; ep: Endpoint; serviceName: string }) {
  const { config, updateService, selectMember } = useGraphStore()
  const color = ENDPOINT_TYPE_COLORS[ep.type] ?? '#6B7280'

  function patch(p: Partial<Endpoint>) {
    const endpoints = config.services.find((s) => s.id === serviceId)?.endpoints ?? []
    updateService(serviceId, { endpoints: endpoints.map((e) => (e.id === ep.id ? { ...e, ...p } : e)) })
  }

  function remove() {
    const endpoints = config.services.find((s) => s.id === serviceId)?.endpoints ?? []
    updateService(serviceId, { endpoints: endpoints.filter((e) => e.id !== ep.id) })
    selectMember(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <EditorHeader
        color={color}
        badge={ep.type.toUpperCase()}
        title="Edit Endpoint"
        subtitle={serviceName}
        onClose={() => selectMember(null)}
      />

      <Field label="Name">
        <Input value={ep.name} onChange={(e) => patch({ name: e.target.value })} />
      </Field>

      <Field label="Type">
        <Select value={ep.type} onChange={(e) => patch({ type: e.target.value as EndpointType })}>
          {ENDPOINT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </Select>
      </Field>

      {ep.type === 'http' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Method">
            <Select value={ep.method ?? 'GET'} onChange={(e) => patch({ method: e.target.value })}>
              {HTTP_METHODS.map((m) => <option key={m}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Path">
            <Input value={ep.path ?? ''} placeholder="/api/v1/..." onChange={(e) => patch({ path: e.target.value })} />
          </Field>
        </div>
      )}

      {(ep.type === 'grpc' || ep.type === 'graphql') && (
        <Field label="Path / Method">
          <Input
            value={ep.path ?? ''}
            placeholder="e.g. /pkg.Service/Method"
            onChange={(e) => patch({ path: e.target.value })}
          />
        </Field>
      )}

      <Field label="Description">
        <Textarea value={ep.description ?? ''} rows={3} onChange={(e) => patch({ description: e.target.value })} />
      </Field>

      <div className="pt-2 border-t border-gray-200">
        <button className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700" onClick={remove}>
          <Trash2 size={14} /> Delete Endpoint
        </button>
      </div>
    </div>
  )
}

function TaskMemberEditor({ serviceId, task, serviceName }: { serviceId: string; task: AsyncTask; serviceName: string }) {
  const { config, updateService, selectMember } = useGraphStore()
  const color = TASK_TYPE_COLORS[task.type] ?? '#6B7280'

  function patch(p: Partial<AsyncTask>) {
    const tasks = config.services.find((s) => s.id === serviceId)?.async ?? []
    updateService(serviceId, { async: tasks.map((t) => (t.id === task.id ? { ...t, ...p } : t)) })
  }

  function remove() {
    const tasks = config.services.find((s) => s.id === serviceId)?.async ?? []
    updateService(serviceId, { async: tasks.filter((t) => t.id !== task.id) })
    selectMember(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <EditorHeader
        color={color}
        badge={task.type.replace(/_/g, ' ')}
        title="Edit Async Task"
        subtitle={serviceName}
        onClose={() => selectMember(null)}
      />

      <Field label="Name">
        <Input value={task.name} onChange={(e) => patch({ name: e.target.value })} />
      </Field>

      <Field label="Type">
        <Select value={task.type} onChange={(e) => patch({ type: e.target.value as AsyncTaskType })}>
          {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
        </Select>
      </Field>

      {task.type.includes('kafka') && (
        <Field label="Topic">
          <Input value={task.topic ?? ''} placeholder="e.g. orders.created" onChange={(e) => patch({ topic: e.target.value })} />
        </Field>
      )}

      {task.type.includes('amqp') && (
        <Field label="Queue">
          <Input value={task.queue ?? ''} placeholder="e.g. payments" onChange={(e) => patch({ queue: e.target.value })} />
        </Field>
      )}

      {task.type === 'cron' && (
        <Field label="Schedule (cron)">
          <Input value={task.schedule ?? ''} placeholder="0 * * * *" onChange={(e) => patch({ schedule: e.target.value })} />
        </Field>
      )}

      <Field label="Description">
        <Textarea value={task.description ?? ''} rows={3} onChange={(e) => patch({ description: e.target.value })} />
      </Field>

      <div className="pt-2 border-t border-gray-200">
        <button className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700" onClick={remove}>
          <Trash2 size={14} /> Delete Task
        </button>
      </div>
    </div>
  )
}

function EventMemberEditor({ serviceId, ev, serviceName }: { serviceId: string; ev: Event; serviceName: string }) {
  const { config, updateService, selectMember } = useGraphStore()
  const color = ev.type === 'publish' ? '#22C55E' : '#60A5FA'

  function patch(p: Partial<Event>) {
    const events = config.services.find((s) => s.id === serviceId)?.events ?? []
    updateService(serviceId, { events: events.map((e) => (e.id === ev.id ? { ...e, ...p } : e)) })
  }

  function remove() {
    const events = config.services.find((s) => s.id === serviceId)?.events ?? []
    updateService(serviceId, { events: events.filter((e) => e.id !== ev.id) })
    selectMember(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <EditorHeader
        color={color}
        badge={ev.type.toUpperCase()}
        title="Edit Event"
        subtitle={serviceName}
        onClose={() => selectMember(null)}
      />

      <Field label="Name">
        <Input value={ev.name} onChange={(e) => patch({ name: e.target.value })} />
      </Field>

      <Field label="Type">
        <Select value={ev.type} onChange={(e) => patch({ type: e.target.value as 'publish' | 'subscribe' })}>
          <option value="publish">publish</option>
          <option value="subscribe">subscribe</option>
        </Select>
      </Field>

      <Field label="Topic">
        <Input value={ev.topic ?? ''} placeholder="e.g. user.created" onChange={(e) => patch({ topic: e.target.value })} />
      </Field>

      <Field label="Description">
        <Textarea value={ev.description ?? ''} rows={3} onChange={(e) => patch({ description: e.target.value })} />
      </Field>

      <div className="pt-2 border-t border-gray-200">
        <button className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700" onClick={remove}>
          <Trash2 size={14} /> Delete Event
        </button>
      </div>
    </div>
  )
}

export default function MemberEditor({ member }: { member: SelectedMember }) {
  const svc = useGraphStore((s) => s.config.services.find((sv) => sv.id === member.serviceId))
  if (!svc) return null

  if (member.memberType === 'endpoint') {
    const ep = svc.endpoints?.find((e) => e.id === member.memberId)
    if (!ep) return null
    return <EndpointMemberEditor serviceId={svc.id} ep={ep} serviceName={svc.name} />
  }

  if (member.memberType === 'async') {
    const task = svc.async?.find((t) => t.id === member.memberId)
    if (!task) return null
    return <TaskMemberEditor serviceId={svc.id} task={task} serviceName={svc.name} />
  }

  const ev = svc.events?.find((e) => e.id === member.memberId)
  if (!ev) return null
  return <EventMemberEditor serviceId={svc.id} ev={ev} serviceName={svc.name} />
}
