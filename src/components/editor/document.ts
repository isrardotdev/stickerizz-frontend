import type { EditorNode } from './types'

export type EditorDocumentV1 = {
  schemaVersion: 1
  canvas: {
    widthCm: string
    heightCm: string
  }
  nodes: EditorNode[]
  meta?: {
    sourceTemplateId?: string
    previewAssetPublicId?: string
    previewBytes?: number
    previewWidth?: number
    previewHeight?: number
  }
}

export const isEditorDocumentV1 = (value: unknown): value is EditorDocumentV1 => {
  if (!value || typeof value !== 'object') return false
  const doc = value as Partial<EditorDocumentV1>
  return (
    doc.schemaVersion === 1 &&
    typeof doc.canvas?.widthCm === 'string' &&
    typeof doc.canvas?.heightCm === 'string' &&
    Array.isArray(doc.nodes)
  )
}
