import type { Area } from 'react-easy-crop'

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const isRemote =
      source.startsWith('http://') || source.startsWith('https://')
    if (isRemote) {
      image.crossOrigin = 'anonymous'
      image.referrerPolicy = 'no-referrer'
    }
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () => reject(new Error('Failed to load image.')))
    image.src = source
  })

export const getCroppedImageBlob = async (imageUrl: string, crop: Area) => {
  const image = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  const width = Math.round(crop.width)
  const height = Math.round(crop.height)

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to create crop context.')
  }

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    width,
    height
  )

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to crop image.'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}
