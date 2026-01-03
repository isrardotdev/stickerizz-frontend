export type NodeType = 'text' | 'image' | 'shape'

export type BaseNode = {
  id: string
  type: NodeType
  x: number
  y: number
  rotation: number
}

export type TextNode = BaseNode & {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fontStyle: string
  fill: string
  letterSpacing: number
  strokeEnabled: boolean
  strokeColor: string
  strokeWidth: number
  strokeJoin: 'miter' | 'round' | 'bevel'
}

export type ImageNode = BaseNode & {
  type: 'image'
  src: string
  width: number
  height: number
  assetPublicId?: string
  assetOwner?: 'user' | 'template'
}

export type ShapeType = 'rect' | 'circle'

export type ShapeNode = BaseNode & {
  type: 'shape'
  shape: ShapeType
  fill: string
  strokeEnabled: boolean
  strokeColor: string
  strokeWidth: number
} & (
    | {
        shape: 'rect'
        width: number
        height: number
        cornerRadius: number
      }
    | {
        shape: 'circle'
        radius: number
      }
  )

export type EditorNode = TextNode | ImageNode | ShapeNode

export const generateId = () =>
  `node_${Math.random().toString(36).slice(2, 10)}`
