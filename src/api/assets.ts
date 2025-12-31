import { apiClient } from './client'

export type UploadedAsset = {
  publicId: string
  url: string
  width: number
  height: number
}

export const uploadImage = async (file: Blob, filename = 'upload.png') => {
  const formData = new FormData()
  formData.append('file', file, filename)

  const response = await apiClient.post<{ asset: UploadedAsset }>(
    '/api/assets/images',
    formData
  )
  return response.data.asset
}

