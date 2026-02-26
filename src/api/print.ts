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

export const createPrintCheckoutSession = async (payload: {
  paperSize: PaperSize
  marginMm: number
  placements: SheetPlacement[]
  quantity: number
}) => {
  const response = await apiClient.post<{
    printJobId: string
    checkoutUrl: string
  }>('/api/print/checkout-session', payload, { timeout: 30000 })
  return response.data
}
