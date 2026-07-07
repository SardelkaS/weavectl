import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  NodeTypes,
  EdgeTypes,
  Connection,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import ServiceNode from './ServiceNode'
import InteractionEdge from './InteractionEdge'
import { useGraphStore } from '../store/graph'
import { useThemeStore } from '../store/theme'
import { INTERACTION_STYLES } from '../lib/interactionStyles'
import { Interaction } from '../types/schema'

const nodeTypes: NodeTypes = { service: ServiceNode as never }
const edgeTypes: EdgeTypes = { interaction: InteractionEdge as never }

function Legend() {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow p-3 text-xs">
      <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Interaction Types</div>
      <div className="space-y-1">
        {Object.entries(INTERACTION_STYLES).map(([type, style]) => (
          <div key={type} className="flex items-center gap-2">
            <svg width="32" height="8">
              <line
                x1="0" y1="4" x2="32" y2="4"
                stroke={style.color}
                strokeWidth="2"
                strokeDasharray={style.strokeDasharray ?? undefined}
              />
            </svg>
            <span className="text-gray-600 dark:text-gray-300">{style.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-green-500" />
          <span className="text-gray-600 dark:text-gray-300">Callee (outgoing)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-blue-500" />
          <span className="text-gray-600 dark:text-gray-300">Caller (incoming)</span>
        </div>
      </div>
    </div>
  )
}

export default function Canvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addInteraction,
    clearSelection,
    config,
  } = useGraphStore()
  const isDark = useThemeStore((s) => s.theme === 'dark')

  const onConnect = useCallback(
    (connection: Connection) => {
      const fromMember = (connection.sourceHandle ?? '').replace('-src', '')
      const toMember = (connection.targetHandle ?? '').replace('-tgt', '')

      // Whole-service handles are not connectable (see ServiceNode), so this should never
      // fire for them — guard anyway: interactions must target a specific endpoint, async
      // task, event, or internal process, never a bare service.
      if (!fromMember || fromMember === 'default' || !toMember || toMember === 'default') return

      const ix: Interaction = {
        id: `ix-${Date.now()}`,
        from: `${connection.source}.${fromMember}`,
        to: `${connection.target}.${toMember}`,
        type: 'http',
        label: '',
      }
      addInteraction(ix)
    },
    [addInteraction],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onPaneClick={clearSelection}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      defaultEdgeOptions={{
        type: 'interaction',
        markerEnd: { type: MarkerType.ArrowClosed },
      }}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} size={1} color={isDark ? '#374151' : '#e5e7eb'} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => {
          const svc = config.services.find((s) => s.id === n.id)
          return svc?.color ?? '#CBD5E1'
        }}
        maskColor={isDark ? 'rgba(17,24,39,0.7)' : 'rgba(255,255,255,0.7)'}
      />
      <Panel position="bottom-left">
        <Legend />
      </Panel>
    </ReactFlow>
  )
}
