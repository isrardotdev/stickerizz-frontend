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
  onDelete: (id: string) => void
}

type LayerItemProps = {
  node: EditorNode
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

const getLayerLabel = (node: EditorNode) => {
  if (node.type === 'text') {
    const text = node.text.trim()
    return text.length > 0 ? text.slice(0, 28) : 'Text'
  }
  return 'Image'
}

const LayerItem = ({ node, isSelected, onSelect, onDelete }: LayerItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: node.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      className={`group grid w-full cursor-grab grid-cols-[20px_52px_1fr_28px] items-center gap-2 rounded-xl border px-3 py-2 text-left text-slate-200 transition-colors active:cursor-grabbing ${
        isSelected
          ? 'border-blue-400 bg-slate-800/60 shadow-[0_0_0_1px_rgba(96,165,250,0.4)]'
          : 'border-slate-700 bg-slate-900 hover:border-blue-500 hover:bg-slate-800/70'
      }`}
      style={style}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
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
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-slate-400 opacity-0 transition-opacity hover:bg-slate-800 hover:text-slate-200 group-hover:opacity-100 group-focus-within:opacity-100 max-[900px]:opacity-100"
        onPointerDown={(event) => {
          event.stopPropagation()
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onDelete()
        }}
        aria-label="Delete layer"
        title="Delete"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  )
}

const LayersPanel = ({ nodes, selectedId, onSelect, onReorder, onDelete }: LayersPanelProps) => {
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
                  onDelete={() => onDelete(node.id)}
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
