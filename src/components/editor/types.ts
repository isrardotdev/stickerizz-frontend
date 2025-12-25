export type NodeType = 'text' | 'image'

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
}

export type ImageNode = BaseNode & {
  type: 'image'
  src: string
  width: number
  height: number
}

export type EditorNode = TextNode | ImageNode

export const generateId = () =>
  `node_${Math.random().toString(36).slice(2, 10)}`
