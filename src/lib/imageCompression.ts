import imageCompression from 'browser-image-compression'

const options = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  fileType: 'image/webp' as const,
}

export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, options)
}
