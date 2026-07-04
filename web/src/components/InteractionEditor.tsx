import { X, Trash2 } from 'lucide-react'
import { Interaction, InteractionType } from '../types/schema'
import { useGraphStore } from '../store/graph'
import { INTERACTION_TYPES, INTERACTION_STYLES } from '../lib/interactionStyles'
import { Field, Input, Textarea, Select } from './FormControls'

function MemberSelect({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  const { config } = useGraphStore()

  return (
    <Field label={label}>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— select —</option>
        {config.services.map((svc) => (
          <optgroup key={svc.id} label={svc.name}>
            <option value={svc.id}>{svc.name} (service)</option>
            {svc.endpoints?.map((ep) => (
              <option key={ep.id} value={`${svc.id}.${ep.id}`}>
                ↳ {ep.name} [{ep.type}]
              </option>
            ))}
            {svc.async?.map((t) => (
              <option key={t.id} value={`${svc.id}.${t.id}`}>
                ↳ {t.name} [{t.type}]
              </option>
            ))}
            {svc.events?.map((ev) => (
              <option key={ev.id} value={`${svc.id}.${ev.id}`}>
                ↳ {ev.name} [{ev.type}]
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
    </Field>
  )
}

export default function InteractionEditor({ interactionId }: { interactionId: string }) {
  const { config, updateInteraction, removeInteraction, selectInteraction } = useGraphStore()
  const ix = config.interactions.find((i) => i.id === interactionId)
  if (!ix) return null

  function patch(p: Partial<Interaction>) {
    updateInteraction(interactionId, p)
  }

  const style = INTERACTION_STYLES[ix.type]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: style?.color }} />
          <h3 className="font-semibold text-gray-800">Edit Interaction</h3>
        </div>
        <button className="text-gray-400 hover:text-gray-600" onClick={() => selectInteraction(null)}>
          <X size={16} />
        </button>
      </div>

      <MemberSelect label="From" value={ix.from} onChange={(v) => patch({ from: v })} />
      <MemberSelect label="To" value={ix.to} onChange={(v) => patch({ to: v })} />

      <Field label="Type">
        <Select value={ix.type} onChange={(e) => patch({ type: e.target.value as InteractionType })}>
          {INTERACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {INTERACTION_STYLES[t].label} ({t})
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Label">
        <Input
          value={ix.label ?? ''}
          placeholder="Short label shown on graph edge"
          onChange={(e) => patch({ label: e.target.value })}
        />
      </Field>

      <Field label="Description">
        <Textarea
          value={ix.description ?? ''}
          rows={2}
          placeholder="Optional detailed description"
          onChange={(e) => patch({ description: e.target.value })}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={ix.async ?? false}
          onChange={(e) => patch({ async: e.target.checked })}
          className="rounded"
        />
        Asynchronous (fire-and-forget)
      </label>

      <div className="pt-2 border-t border-gray-200">
        <button
          className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
          onClick={() => {
            removeInteraction(interactionId)
            selectInteraction(null)
          }}
        >
          <Trash2 size={14} /> Delete Interaction
        </button>
      </div>
    </div>
  )
}
