/** Longest side (px) of a photo before it is sent to the backend. Keeps uploads small and fast. */
const MAX_SIDE = 1536
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export class ImageError extends Error {}

/**
 * Validates a user image and re-encodes it as a JPEG no larger than MAX_SIDE.
 * Re-encoding through a canvas also strips EXIF metadata (including GPS location) and applies EXIF rotation.
 * Everything happens locally in the browser; nothing is uploaded here.
 */
export async function prepareImage(file: Blob): Promise<Blob> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageError('Please use a JPG, PNG or WebP image.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageError('That image is larger than 20 MB. Please choose a smaller one.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new ImageError('This image could not be read. Try a different JPG or PNG file.')
  }

  try {
    if (bitmap.width < 200 || bitmap.height < 200) {
      throw new ImageError('This image is too small. Please use a photo at least 200 × 200 pixels.')
    }
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageError('Your browser could not process this image.')
    ctx.fillStyle = '#ffffff' // flatten transparency (PNG/WebP) onto white
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) throw new ImageError('Your browser could not process this image.')
    return blob
  } finally {
    bitmap.close()
  }
}
