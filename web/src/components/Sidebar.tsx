import { Plus, Eye } from 'lucide-react'
import { useGraphStore } from '../store/graph'
import { Service } from '../types/schema'
import { SERVICE_COLORS, INTERACTION_STYLES } from '../lib/interactionStyles'
import ServiceEditor from './ServiceEditor'
import InteractionEditor from './InteractionEditor'
import MemberEditor from './MemberEditor'

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function ServiceItem({ svc }: { svc: Service }) {
  const { selectedServiceId, selectService, config } = useGraphStore()
  const isSelected = selectedServiceId === svc.id
  const ixCount = config.interactions.filter(
    (i) => i.from.startsWith(svc.id) || i.to.startsWith(svc.id),
  ).length

  return (
    <button
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
        ${isSelected ? 'bg-indigo-50 ring-1 ring-indigo-300' : 'hover:bg-gray-50'}`}
      onClick={() => selectService(isSelected ? null : svc.id)}
    >
      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: svc.color ?? '#CBD5E1' }} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-800 truncate">{svc.name}</div>
        <div className="text-[10px] text-gray-400">
          {[
            svc.endpoints?.length ? `${svc.endpoints.length} endpoint${svc.endpoints.length > 1 ? 's' : ''}` : null,
            svc.async?.length ? `${svc.async.length} async` : null,
            ixCount ? `${ixCount} interaction${ixCount > 1 ? 's' : ''}` : null,
          ].filter(Boolean).join(' · ') || 'No members'}
        </div>
      </div>
    </button>
  )
}

export default function Sidebar() {
  const {
    config, addService, selectedServiceId, selectedInteractionId, selectedMember, viewMode,
  } = useGraphStore()

  function handleAddService() {
    const name = prompt('Service name:')
    if (!name?.trim()) return
    const id = slug(name)
    const color = SERVICE_COLORS[config.services.length % SERVICE_COLORS.length]
    const newSvc: Service = { id, name: name.trim(), color, endpoints: [], async: [], events: [] }
    addService(newSvc)
  }

  const hasSelection = Boolean(selectedServiceId || selectedInteractionId || selectedMember)
  const showEditor = !viewMode && hasSelection

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* View mode banner */}
      {viewMode && (
        <div className="flex items-center gap-1.5 bg-gray-800 text-white px-3 py-1.5 text-xs">
          <Eye size={12} />
          <span>View-only mode — editing is disabled</span>
        </div>
      )}

      {showEditor ? (
        <div className="flex-1 overflow-y-auto p-3">
          {selectedMember && <MemberEditor member={selectedMember} />}
          {!selectedMember && selectedServiceId && <ServiceEditor serviceId={selectedServiceId} />}
          {!selectedMember && selectedInteractionId && <InteractionEditor interactionId={selectedInteractionId} />}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Services</span>
            <button
              className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
              onClick={handleAddService}
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {config.services.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8">
                <div className="text-2xl mb-2">🕸️</div>
                <div>No services yet.</div>
                <div>Click "Add" to get started.</div>
              </div>
            ) : (
              config.services.map((svc) => <ServiceItem key={svc.id} svc={svc} />)
            )}
          </div>

          {/* Interaction list */}
          {config.interactions.length > 0 && (
            <>
              <div className="flex items-center px-3 py-1.5 border-t border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Interactions ({config.interactions.length})
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto p-2 space-y-0.5">
                {config.interactions.map((ix) => {
                  const style = INTERACTION_STYLES[ix.type]
                  return (
                    <button
                      key={ix.id}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded text-left text-xs hover:bg-gray-50"
                      onClick={() => useGraphStore.getState().selectInteraction(ix.id)}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: style?.color }} />
                      <span className="truncate text-gray-600">
                        {ix.from} → {ix.to}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </aside>
  )
}
