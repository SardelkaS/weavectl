import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import {
  Service, Endpoint, AsyncTask, Event, InternalProcess,
  EndpointType, AsyncTaskType, ServiceShape,
} from '../types/schema'
import { useGraphStore } from '../store/graph'
import {
  SERVICE_COLORS, ENDPOINT_TYPE_COLORS, TASK_TYPE_COLORS, INTERNAL_PROCESS_COLOR,
  ENDPOINT_TYPES, TASK_TYPES, HTTP_METHODS,
} from '../lib/interactionStyles'
import { SHAPE_DEFS } from './ServiceNode'
import { Field, Input, Textarea, Select } from './FormControls'

const ALL_SHAPES: ServiceShape[] = ['service', 'database', 'queue', 'gateway', 'cache', 'external']

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="text-[10px] font-bold px-1 rounded text-white" style={{ background: color }}>
          {ep.type.toUpperCase()}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 truncate">{ep.name || '(unnamed)'}</span>
        <button
          className="text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0.5"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {open && (
        <div className="px-3 py-2 space-y-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-600">
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
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="text-[10px] font-bold px-1 rounded text-white truncate max-w-[90px]" style={{ background: color }}>
          {task.type.replace(/_/g, ' ')}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 truncate">{task.name || '(unnamed)'}</span>
        <button
          className="text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0.5"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {open && (
        <div className="px-3 py-2 space-y-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-600">
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
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className={`text-[10px] font-bold px-1 rounded text-white ${ev.type === 'publish' ? 'bg-green-500' : 'bg-blue-400'}`}>
          {ev.type.toUpperCase()}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 truncate">{ev.name || '(unnamed)'}</span>
        <button
          className="text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0.5"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {open && (
        <div className="px-3 py-2 space-y-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-600">
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

function InternalProcessForm({
  proc,
  onChange,
  onDelete,
}: {
  proc: InternalProcess
  onChange: (patch: Partial<InternalProcess>) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="text-[10px] font-bold px-1 rounded text-white" style={{ background: INTERNAL_PROCESS_COLOR }}>
          INTERNAL
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 truncate">{proc.name || '(unnamed)'}</span>
        <button
          className="text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0.5"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {open && (
        <div className="px-3 py-2 space-y-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-600">
          <Field label="Name">
            <Input value={proc.name} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea
              value={proc.description ?? ''}
              rows={2}
              placeholder="e.g. Repository layer, rate limiter, generic bus interface…"
              onChange={(e) => onChange({ description: e.target.value })}
            />
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
    const id = slug(`task-${(svc!.async?.length ?? 0) + 1}`)
    patch({ async: [...(svc!.async ?? []), { id, name: 'NewTask', type: 'kafka_consumer' }] })
  }

  function addEvent() {
    const id = slug(`event-${(svc!.events?.length ?? 0) + 1}`)
    patch({ events: [...(svc!.events ?? []), { id, name: 'NewEvent', type: 'publish' }] })
  }

  function addInternalProcess() {
    const id = slug(`internal-${(svc!.internal?.length ?? 0) + 1}`)
    patch({ internal: [...(svc!.internal ?? []), { id, name: 'NewInternalProcess' }] })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Edit Service</h3>
        <button
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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
            className="bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
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
              className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600 cursor-pointer"
            />
            <div className="flex gap-1 flex-wrap">
              {SERVICE_COLORS.map((c) => (
                <button
                  key={c}
                  className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow"
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
                      ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-300'}`}
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
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Endpoints</span>
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

      {/* Async */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Async</span>
          <button
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800"
            onClick={addTask}
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-1.5">
          {svc.async?.map((task, i) => (
            <TaskForm
              key={task.id}
              task={task}
              onChange={(p) => {
                const updated = [...(svc.async ?? [])]
                updated[i] = { ...task, ...p }
                patch({ async: updated })
              }}
              onDelete={() => patch({ async: svc.async?.filter((_, j) => j !== i) })}
            />
          ))}
        </div>
      </div>

      {/* Events */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Events</span>
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

      {/* Internal */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Internal</span>
          <button
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
            onClick={addInternalProcess}
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-1.5">
          {svc.internal?.map((proc, i) => (
            <InternalProcessForm
              key={proc.id}
              proc={proc}
              onChange={(p) => {
                const updated = [...(svc.internal ?? [])]
                updated[i] = { ...proc, ...p }
                patch({ internal: updated })
              }}
              onDelete={() => patch({ internal: svc.internal?.filter((_, j) => j !== i) })}
            />
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          className="flex items-center gap-1 text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
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
