import { apiClient } from './client'

export type DesignListItem = {
  id: string
  title: string | null
  previewUrl: string
  updatedAt: string
}

export type DesignRecord = {
  id: string
  title: string | null
  previewUrl: string
  canvasData: unknown
  updatedAt: string
  sourceTemplateId: string | null
}

export const listDesigns = async () => {
  const response = await apiClient.get<{ designs: DesignListItem[] }>('/api/designs')
  return response.data.designs
}

export const getDesign = async (id: string) => {
  const response = await apiClient.get<{ design: DesignRecord }>(`/api/designs/${id}`)
  return response.data.design
}

export const createDesign = async (input: {
  canvasData: unknown
  previewUrl: string
  sourceTemplateId?: string
}) => {
  const response = await apiClient.post<{ design: { id: string; title: string | null; previewUrl: string } }>(
    '/api/designs',
    input
  )
  return response.data.design
}

export const updateDesign = async (
  id: string,
  input: { canvasData: unknown; previewUrl: string }
) => {
  const response = await apiClient.put<{ design: DesignRecord }>(`/api/designs/${id}`, input)
  return response.data.design
}

