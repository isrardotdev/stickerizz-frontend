import { apiClient } from './client'

export type TemplateListItem = {
  id: string
  title: string
  updatedAt: string
  previewUrl: string | null
}

export type TemplateRecord = {
  id: string
  title: string
  canvasData: unknown
  previewUrl: string
}

export const listTemplates = async () => {
  const response = await apiClient.get<{ templates: TemplateListItem[] }>('/api/templates')
  return response.data.templates
}

export const getTemplate = async (id: string) => {
  const response = await apiClient.get<{ template: TemplateRecord }>(`/api/templates/${id}`)
  return response.data.template
}

