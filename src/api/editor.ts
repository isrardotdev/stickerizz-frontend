import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 30000,
})

type RemoveBackgroundResponse = Blob

const normalizeFilename = (input: File | Blob) => {
  if (input instanceof File && input.name) return input.name
  return 'upload.png'
}

export const removeBackground = async (
  image: File | Blob
): Promise<RemoveBackgroundResponse> => {
  const formData = new FormData()
  formData.append('image', image, normalizeFilename(image))

  const response = await apiClient.post(
    '/images/remove-background',
    formData,
    { responseType: 'arraybuffer' }
  )

  return new Blob([response.data], { type: 'image/png' })
}
