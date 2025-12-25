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
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
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
      className={`grid w-full cursor-grab grid-cols-[20px_52px_1fr] items-center gap-2 rounded-xl border px-3 py-2 text-left text-slate-200 transition-colors active:cursor-grabbing ${
        isSelected
          ? 'border-blue-400 bg-slate-800/60 shadow-[0_0_0_1px_rgba(96,165,250,0.4)]'
          : 'border-slate-700 bg-slate-900 hover:border-blue-500 hover:bg-slate-800/70'
      }`}
      style={style}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <span className="text-base text-slate-400" aria-hidden="true">
        ≡
      </span>
      <span className="text-[11px] uppercase tracking-[0.08em] text-slate-400">
        {node.type}
      </span>
      <span className="truncate text-sm">{getLayerLabel(node)}</span>
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
    <div className="flex h-full flex-col text-slate-200">
      <div className="border-b border-slate-800 px-4 py-3 text-xs uppercase tracking-[0.08em] text-slate-400">
        <span>Layers</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
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
          modifiers={[restrictToVerticalAxis]}
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
      <div className="border-t border-slate-800 px-4 py-2 text-xs text-slate-400">
        Drag layers to reorder the z-index.
      </div>
    </div>
  )
}

export default LayersPanel
