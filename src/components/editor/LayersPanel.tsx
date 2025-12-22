import { useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { EditorNode } from './types'

type LayersPanelProps = {
  nodes: EditorNode[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onReorder: (orderedIds: string[]) => void
}

type LayerItemProps = {
  node: EditorNode
  isSelected: boolean
  onSelect: () => void
}

const getLayerLabel = (node: EditorNode) => {
  if (node.type === 'text') {
    const text = node.text.trim()
    return text.length > 0 ? text.slice(0, 28) : 'Text'
  }
  return 'Image'
}

const LayerItem = ({ node, isSelected, onSelect }: LayerItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`layer-item${isSelected ? ' layer-item--active' : ''}`}
      style={style}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <span className="layer-item__grip" aria-hidden="true">
        ≡
      </span>
      <span className="layer-item__type">{node.type}</span>
      <span className="layer-item__label">{getLayerLabel(node)}</span>
    </button>
  )
}

const LayersPanel = ({ nodes, selectedId, onSelect, onReorder }: LayersPanelProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const orderedIds = useMemo(() => nodes.map((node) => node.id).reverse(), [nodes])
  const nodeLookup = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  )

  return (
    <div className="layers-panel">
      <div className="layers-panel__header">
        <span>Layers</span>
      </div>
      <div className="layers-panel__list">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (!over || active.id === over.id) return
            const oldIndex = orderedIds.indexOf(String(active.id))
            const newIndex = orderedIds.indexOf(String(over.id))
            if (oldIndex === -1 || newIndex === -1) return
            const nextOrder = arrayMove(orderedIds, oldIndex, newIndex)
            onReorder(nextOrder)
          }}
        >
          <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
            {orderedIds.map((id) => {
              const node = nodeLookup.get(id)
              if (!node) return null
              return (
                <LayerItem
                  key={node.id}
                  node={node}
                  isSelected={node.id === selectedId}
                  onSelect={() => onSelect(node.id)}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </div>
      <div className="layers-panel__footer">Drag layers to reorder the z-index.</div>
    </div>
  )
}

export default LayersPanel
