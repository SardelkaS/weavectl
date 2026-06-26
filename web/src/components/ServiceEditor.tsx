import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Service, Endpoint, AsyncTask, Event, EndpointType, AsyncTaskType, ServiceShape } from '../types/schema'
import { useGraphStore } from '../store/graph'
import { SERVICE_COLORS, ENDPOINT_TYPE_COLORS, TASK_TYPE_COLORS } from '../lib/interactionStyles'
import { SHAPE_DEFS } from './ServiceNode'

const ALL_SHAPES: ServiceShape[] = ['service', 'database', 'queue', 'gateway', 'cache', 'external']

const ENDPOINT_TYPES: EndpointType[] = ['http', 'grpc', 'graphql', 'websocket']
const TASK_TYPES: AsyncTaskType[] = [
  'kafka_consumer', 'kafka_producer', 'amqp_consumer', 'amqp_producer', 'cron', 'worker',
]
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-0.5">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 ${props.className ?? ''}`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
    />
  )
}

function EndpointForm({
  ep,
  onChange,
  onDelete,
}: {
  ep: Endpoint
  onChange: (patch: Partial<Endpoint>) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const color = ENDPOINT_TYPE_COLORS[ep.type] ?? '#6B7280'

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="text-[10px] font-bold px-1 rounded text-white" style={{ background: color }}>
          {ep.type.toUpperCase()}
        </span>
        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{ep.name || '(unnamed)'}</span>
        <button
          className="text-red-400 hover:text-red-600 p-0.5"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {open && (
        <div className="px-3 py-2 space-y-2 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name">
              <Input value={ep.name} onChange={(e) => onChange({ name: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={ep.type} onChange={(e) => onChange({ type: e.target.value as EndpointType })}>
                {ENDPOINT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
          {ep.type === 'http' && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Method">
                <Select value={ep.method ?? 'GET'} onChange={(e) => onChange({ method: e.target.value })}>
                  {HTTP_METHODS.map((m) => <option key={m}>{m}</option>)}
                </Select>
              </Field>
              <Field label="Path">
                <Input value={ep.path ?? ''} placeholder="/api/v1/..." onChange={(e) => onChange({ path: e.target.value })} />
              </Field>
            </div>
          )}
          {(ep.type === 'grpc' || ep.type === 'graphql') && (
            <Field label="Path / Method">
              <Input value={ep.path ?? ''} placeholder="e.g. /pkg.Service/Method" onChange={(e) => onChange({ path: e.target.value })} />
            </Field>
          )}
          <Field label="Description">
            <Textarea value={ep.description ?? ''} rows={2} onChange={(e) => onChange({ description: e.target.value })} />
          </Field>
        </div>
      )}
    </div>
  )
}

function TaskForm({
  task,
  onChange,
  onDelete,
}: {
  task: AsyncTask
  onChange: (patch: Partial<AsyncTask>) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const color = TASK_TYPE_COLORS[task.type] ?? '#6B7280'

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="text-[10px] font-bold px-1 rounded text-white truncate max-w-[90px]" style={{ background: color }}>
          {task.type.replace(/_/g, ' ')}
        </span>
        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{task.name || '(unnamed)'}</span>
        <button
          className="text-red-400 hover:text-red-600 p-0.5"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {open && (
        <div className="px-3 py-2 space-y-2 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name">
              <Input value={task.name} onChange={(e) => onChange({ name: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={task.type} onChange={(e) => onChange({ type: e.target.value as AsyncTaskType })}>
                {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
          {task.type.includes('kafka') && (
            <Field label="Topic">
              <Input value={task.topic ?? ''} placeholder="e.g. orders.created" onChange={(e) => onChange({ topic: e.target.value })} />
            </Field>
          )}
          {task.type.includes('amqp') && (
            <Field label="Queue">
              <Input value={task.queue ?? ''} placeholder="e.g. payments" onChange={(e) => onChange({ queue: e.target.value })} />
            </Field>
          )}
          {task.type === 'cron' && (
            <Field label="Schedule (cron)">
              <Input value={task.schedule ?? ''} placeholder="0 * * * *" onChange={(e) => onChange({ schedule: e.target.value })} />
            </Field>
          )}
          <Field label="Description">
            <Textarea value={task.description ?? ''} rows={2} onChange={(e) => onChange({ description: e.target.value })} />
          </Field>
        </div>
      )}
    </div>
  )
}

function EventForm({
  ev,
  onChange,
  onDelete,
}: {
  ev: Event
  onChange: (patch: Partial<Event>) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className={`text-[10px] font-bold px-1 rounded text-white ${ev.type === 'publish' ? 'bg-green-500' : 'bg-blue-400'}`}>
          {ev.type.toUpperCase()}
        </span>
        <span className="text-sm font-medium text-gray-700 flex-1 truncate">{ev.name || '(unnamed)'}</span>
        <button
          className="text-red-400 hover:text-red-600 p-0.5"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {open && (
        <div className="px-3 py-2 space-y-2 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name">
              <Input value={ev.name} onChange={(e) => onChange({ name: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={ev.type} onChange={(e) => onChange({ type: e.target.value as 'publish' | 'subscribe' })}>
                <option value="publish">publish</option>
                <option value="subscribe">subscribe</option>
              </Select>
            </Field>
          </div>
          <Field label="Topic">
            <Input value={ev.topic ?? ''} placeholder="e.g. user.created" onChange={(e) => onChange({ topic: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea value={ev.description ?? ''} rows={2} onChange={(e) => onChange({ description: e.target.value })} />
          </Field>
        </div>
      )}
    </div>
  )
}

export default function ServiceEditor({ serviceId }: { serviceId: string }) {
  const { config, updateService, removeService, selectService } = useGraphStore()
  const svc = config.services.find((s) => s.id === serviceId)
  if (!svc) return null

  function patch(p: Partial<Service>) {
    updateService(serviceId, p)
  }

  function addEndpoint() {
    const id = slug(`ep-${(svc!.endpoints?.length ?? 0) + 1}`)
    patch({ endpoints: [...(svc!.endpoints ?? []), { id, name: 'NewEndpoint', type: 'http' }] })
  }

  function addTask() {
    const id = slug(`task-${(svc!.async_tasks?.length ?? 0) + 1}`)
    patch({ async_tasks: [...(svc!.async_tasks ?? []), { id, name: 'NewTask', type: 'kafka_consumer' }] })
  }

  function addEvent() {
    const id = slug(`event-${(svc!.events?.length ?? 0) + 1}`)
    patch({ events: [...(svc!.events ?? []), { id, name: 'NewEvent', type: 'publish' }] })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Edit Service</h3>
        <button
          className="text-gray-400 hover:text-gray-600"
          onClick={() => selectService(null)}
        >
          <X size={16} />
        </button>
      </div>

      {/* Basic info */}
      <div className="space-y-2">
        <Field label="Name">
          <Input value={svc.name} onChange={(e) => patch({ name: e.target.value })} />
        </Field>
        <Field label="ID (used in interactions)">
          <Input
            value={svc.id}
            disabled
            className="bg-gray-50 text-gray-400 cursor-not-allowed"
          />
        </Field>
        <Field label="Description">
          <Textarea value={svc.description ?? ''} rows={2} onChange={(e) => patch({ description: e.target.value })} />
        </Field>
        <Field label="Color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={svc.color ?? '#4F46E5'}
              onChange={(e) => patch({ color: e.target.value })}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
            />
            <div className="flex gap-1 flex-wrap">
              {SERVICE_COLORS.map((c) => (
                <button
                  key={c}
                  className="w-5 h-5 rounded-full border-2 border-white shadow"
                  style={{ background: c, outline: svc.color === c ? `2px solid ${c}` : undefined }}
                  onClick={() => patch({ color: c })}
                />
              ))}
            </div>
          </div>
        </Field>

        <Field label="Shape">
          <div className="grid grid-cols-3 gap-1.5">
            {ALL_SHAPES.map((s) => {
              const def = SHAPE_DEFS[s]
              const { Icon } = def
              const isActive = (svc.shape ?? 'service') === s
              return (
                <button
                  key={s}
                  onClick={() => patch({ shape: s })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-colors
                    ${isActive
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                >
                  <Icon size={16} />
                  {def.label}
                </button>
              )
            })}
          </div>
        </Field>
      </div>

      {/* Endpoints */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Endpoints</span>
          <button
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
            onClick={addEndpoint}
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-1.5">
          {svc.endpoints?.map((ep, i) => (
            <EndpointForm
              key={ep.id}
              ep={ep}
              onChange={(p) => {
                const endpoints = [...(svc.endpoints ?? [])]
                endpoints[i] = { ...ep, ...p }
                patch({ endpoints })
              }}
              onDelete={() => patch({ endpoints: svc.endpoints?.filter((_, j) => j !== i) })}
            />
          ))}
        </div>
      </div>

      {/* Async Tasks */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Async Tasks</span>
          <button
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800"
            onClick={addTask}
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-1.5">
          {svc.async_tasks?.map((task, i) => (
            <TaskForm
              key={task.id}
              task={task}
              onChange={(p) => {
                const async_tasks = [...(svc.async_tasks ?? [])]
                async_tasks[i] = { ...task, ...p }
                patch({ async_tasks })
              }}
              onDelete={() => patch({ async_tasks: svc.async_tasks?.filter((_, j) => j !== i) })}
            />
          ))}
        </div>
      </div>

      {/* Events */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Events</span>
          <button
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
            onClick={addEvent}
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-1.5">
          {svc.events?.map((ev, i) => (
            <EventForm
              key={ev.id}
              ev={ev}
              onChange={(p) => {
                const events = [...(svc.events ?? [])]
                events[i] = { ...ev, ...p }
                patch({ events })
              }}
              onDelete={() => patch({ events: svc.events?.filter((_, j) => j !== i) })}
            />
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="pt-2 border-t border-gray-200">
        <button
          className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
          onClick={() => {
            if (confirm(`Delete service "${svc.name}"?`)) {
              removeService(serviceId)
              selectService(null)
            }
          }}
        >
          <Trash2 size={14} /> Delete Service
        </button>
      </div>
    </div>
  )
}
