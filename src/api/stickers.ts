import { apiClient } from './client'

export type SavedSticker = {
  id: string
  title: string | null
  imageUrl: string
  widthPx: number
  heightPx: number
  widthMm: number | null
  heightMm: number | null
  bytes: number | null
  designId: string | null
  createdAt: string
}

export const listStickers = async () => {
  const response = await apiClient.get<{ stickers: SavedSticker[] }>('/api/stickers')
  return response.data.stickers
}

export const createSticker = async (payload: {
  designId?: string
  imageUrl: string
  imagePublicId: string
  widthPx: number
  heightPx: number
  widthMm?: number
  heightMm?: number
  bytes?: number
}) => {
  const response = await apiClient.post<{ sticker: SavedSticker }>(
    '/api/stickers',
    payload
  )
  return response.data.sticker
}

export const deleteSticker = async (id: string) => {
  await apiClient.delete(`/api/stickers/${id}`)
}
