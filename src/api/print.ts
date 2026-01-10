import { apiClient } from './client'

export type PaperSize = 'A4' | 'LETTER'

export type SheetPlacement = {
  stickerId: string
  xMm: number
  yMm: number
  rotationDeg: number
}

export const generateStickerSheetPdf = async (payload: {
  paperSize: PaperSize
  marginMm: number
  placements: SheetPlacement[]
}) => {
  const response = await apiClient.post<{
    pdfUrl: string
    pdfPublicId: string
  }>('/api/print/sheets', payload, { timeout: 180000 })
  return response.data
}
