import { memo } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge, Edge } from '@xyflow/react'
import { Interaction } from '../types/schema'
import { INTERACTION_STYLES } from '../lib/interactionStyles'
import { useEdgeHighlight, useGraphStore } from '../store/graph'

export type InteractionEdgeData = { interaction: Interaction } & Record<string, unknown>
export type InteractionEdgeType = Edge<InteractionEdgeData, 'interaction'>

export default memo(function InteractionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<InteractionEdgeType>) {
  const interaction = data?.interaction
  if (!interaction) return null

  const style = INTERACTION_STYLES[interaction.type] ?? { color: '#6B7280', label: interaction.type }
  const highlight = useEdgeHighlight(id)
  const { selectInteraction, selectedInteractionId } = useGraphStore()
  const isSelected = selectedInteractionId === id

  let strokeWidth = 2
  let opacity = 1
  let stroke = style.color

  if (highlight === 'callee') {
    strokeWidth = 3
    stroke = '#22C55E'
  } else if (highlight === 'caller') {
    strokeWidth = 3
    stroke = '#3B82F6'
  } else if (highlight === 'dimmed') {
    opacity = 0.15
  } else if (isSelected) {
    strokeWidth = 3
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth,
          strokeDasharray: style.strokeDasharray,
          opacity,
          cursor: 'pointer',
        }}
        interactionWidth={10}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ cursor: 'pointer' }}
        onClick={() => selectInteraction(isSelected ? null : id)}
      />
      <EdgeLabelRenderer>
        <div
          className="absolute pointer-events-auto"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            opacity,
          }}
          onClick={() => selectInteraction(isSelected ? null : id)}
        >
          <div
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-white shadow cursor-pointer
              ${isSelected ? 'ring-2 ring-white' : ''}`}
            style={{ background: highlight === 'callee' ? '#22C55E' : highlight === 'caller' ? '#3B82F6' : style.color }}
          >
            {interaction.label || style.label}
            {interaction.async && ' ⚡'}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
})
