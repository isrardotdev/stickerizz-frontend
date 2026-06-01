import { apiClient } from './client'

export type PaperSize = 'A4' | 'LETTER'

export type SheetPlacement = {
  stickerId: string
  xMm: number
  yMm: number
  rotationDeg: number
}

export type PendingPrintJob = {
  id: string
  status: 'PENDING_PAYMENT'
  paperSize: PaperSize
  quantity: number
  totalAmount: number
  currency: string
  expiresAt: string
  createdAt: string
  payload: {
    paperSize: PaperSize
    marginMm: number
    placements: SheetPlacement[]
    quantity?: number
  }
  checkoutUrl: string | null
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
  addressId: string
  couponCode?: string
}) => {
  const response = await apiClient.post<{
    printJobId: string
    checkoutUrl: string
  }>('/api/print/checkout-session', payload, { timeout: 30000 })
  return response.data
}

export type CouponValidationResult =
  | { valid: true; couponCode: string; discountType: string; discountAmount: number; originalTotal: number; discountedTotal: number }
  | { valid: false; message: string }

export const validateCoupon = async (code: string, paperSize: PaperSize, quantity: number) => {
  const params = new URLSearchParams({ paperSize, quantity: String(quantity) })
  const response = await apiClient.get<CouponValidationResult>(
    `/api/print/coupons/${encodeURIComponent(code)}/validate?${params.toString()}`,
    { timeout: 10000 }
  )
  return response.data
}

export const getLatestPendingPrintJob = async () => {
  const response = await apiClient.get<{
    pendingJob: PendingPrintJob | null
  }>('/api/print/jobs/pending-latest', { timeout: 15000 })
  return response.data.pendingJob
}

export const cancelPendingPrintJob = async (printJobId: string) => {
  await apiClient.post(`/api/print/jobs/${printJobId}/cancel`, undefined, {
    timeout: 15000,
  })
}
