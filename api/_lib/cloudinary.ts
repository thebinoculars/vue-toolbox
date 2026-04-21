import { v2 as cloudinary } from 'cloudinary'
import { UploadOptions, UploadResult } from '~/shared/types'
import { getCloudinaryCloudName, getCloudinaryApiKey, getCloudinaryApiSecret } from './utils'

function ensureConfigured() {
  cloudinary.config({
    cloud_name: getCloudinaryCloudName(),
    api_key: getCloudinaryApiKey(),
    api_secret: getCloudinaryApiSecret(),
  })
}

export async function uploadImage({
  userId,
  albumId,
  fileBuffer,
}: UploadOptions): Promise<UploadResult> {
  ensureConfigured()

  const uploadResult: UploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'image',
          folder: `gallery/${userId}/${albumId}`,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as UploadResult)
        },
      )
      .end(fileBuffer)
  })

  return uploadResult
}

export async function deleteImage(publicId: string): Promise<void> {
  ensureConfigured()
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (err) {
    console.error(`Error deleting image ${publicId}`, err)
  }
}

export function getThumbnailUrl(publicId: string): string {
  ensureConfigured()
  return cloudinary.url(publicId, {
    width: 400,
    height: 400,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  })
}
