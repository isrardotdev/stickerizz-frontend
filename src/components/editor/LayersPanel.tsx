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
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { HiBars3, HiOutlinePhoto, HiOutlineSquare2Stack, HiOutlineTrash, HiOutlineViewfinderCircle } from 'react-icons/hi2'
import { TbLetterT } from 'react-icons/tb'
import type { EditorNode } from './types'

type LayersPanelProps = {
  nodes: EditorNode[]
  selectedIds: string[]
  onSelect: (id: string) => void
  onReorder: (orderedIds: string[]) => void
  onDelete: (id: string) => void
}

type LayerItemProps = {
  node: EditorNode
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

const getElementTypeLabel = (node: EditorNode) => {
  if (node.type === 'text') return 'Text'
  if (node.type === 'shape') return node.shape === 'rect' ? 'Shape' : 'Shape'
  return 'Image'
}

const getLayerLabel = (node: EditorNode) => {
  if (node.type === 'text') {
    const text = node.text.trim()
    return text.length > 0 ? text.slice(0, 28) : 'Text block'
  }
  if (node.type === 'shape') {
    return node.shape === 'rect' ? 'Rectangle' : 'Circle'
  }
  return 'Image'
}

const ElementIcon = ({ node }: { node: EditorNode }) => {
  if (node.type === 'text') {
    return <TbLetterT className="h-4 w-4" aria-hidden="true" />
  }
  if (node.type === 'shape') {
    return node.shape === 'rect' ? (
      <HiOutlineSquare2Stack className="h-4 w-4" aria-hidden="true" />
    ) : (
      <HiOutlineViewfinderCircle className="h-4 w-4" aria-hidden="true" />
    )
  }
  return <HiOutlinePhoto className="h-4 w-4" aria-hidden="true" />
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
      className={`group grid w-full cursor-grab grid-cols-[20px_40px_1fr_28px] items-center gap-2 rounded-2xl border px-3 py-3 text-left transition-colors active:cursor-grabbing ${
        isSelected
          ? 'border-brand-200 bg-brand-50 text-slate-900 shadow-sm'
          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-200 hover:bg-white'
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
        <HiBars3 className="h-4 w-4" />
      </span>
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
        <ElementIcon node={node} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{getLayerLabel(node)}</span>
        <span className="block text-xs text-slate-500">{getElementTypeLabel(node)}</span>
      </span>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-xl border border-transparent text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 group-focus-within:opacity-100 max-[900px]:opacity-100"
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
        <HiOutlineTrash className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

const LayersPanel = ({ nodes, selectedIds, onSelect, onReorder, onDelete }: LayersPanelProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const orderedIds = useMemo(() => nodes.map((node) => node.id).reverse(), [nodes])
  const nodeLookup = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  )

  return (
    <div className="flex h-full flex-col text-slate-700">
      <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <span>Elements</span>
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
                  isSelected={selectedIds.includes(node.id)}
                  onSelect={() => onSelect(node.id)}
                  onDelete={() => onDelete(node.id)}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </div>
      <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        Drag items up or down to change what appears in front.
      </div>
    </div>
  )
}

export default LayersPanel
