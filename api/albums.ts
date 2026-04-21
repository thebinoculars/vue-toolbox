import { getAlbumModel, getImageModel } from './_lib/db'
import { createErrorResponse, createSuccessResponse, parseBody } from './_lib/http'
import { logError } from './_lib/utils'
import { compose, authMiddleware, methodMiddleware, sameOriginMiddleware } from './_lib/middleware'
import { AuthContext, UploadOptions } from '~/shared/types'
import { deleteImage, uploadImage, getThumbnailUrl } from './_lib/cloudinary'

// ============ Utility Functions ============
const parseMultipart = (body: string, boundary: string) => {
  const parts = body.split(`--${boundary}`)
  const result: { files: any[]; fields: any } = { files: [], fields: {} }

  for (const part of parts) {
    if (part.includes('Content-Disposition')) {
      const lines = part.split('\r\n')
      const dispositionLine = lines.find((line) => line.includes('Content-Disposition'))

      if (dispositionLine) {
        const nameMatch = dispositionLine.match(/name="([^"]*)"/)
        const filenameMatch = dispositionLine.match(/filename="([^"]*)"/)

        if (nameMatch) {
          const name = nameMatch[1]
          const contentStart = part.indexOf('\r\n\r\n') + 4
          const content = part.substring(contentStart).replace(/\r\n$/, '')

          if (filenameMatch) {
            const filename = filenameMatch[1]
            const contentTypeMatch = part.match(/Content-Type: ([^\r\n]*)/)
            const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream'

            result.files.push({
              fieldname: name,
              filename,
              contentType,
              content: Buffer.from(content, 'binary'),
            })
          } else {
            result.fields[name] = content
          }
        }
      }
    }
  }

  return result
}

const validateAndParseImageUpload = async (request: Request) => {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return { error: createErrorResponse('Content-Type must be multipart/form-data', 400), file: null }
  }

  const boundary = contentType.split('boundary=')[1]
  if (!boundary) {
    return { error: createErrorResponse('Boundary not found in Content-Type', 400), file: null }
  }

  const buffer = await request.arrayBuffer()
  const binaryBody = Buffer.from(buffer).toString('binary')
  const parsed = parseMultipart(binaryBody, boundary)

  const file = parsed.files[0]
  if (!file) return { error: createErrorResponse('File is required', 400), file: null }

  if (!file.contentType.startsWith('image/')) {
    return { error: createErrorResponse('Only image files are allowed', 400), file: null }
  }

  const maxSize = 6 * 1024 * 1024
  if (file.content.length > maxSize) {
    return { error: createErrorResponse('File too large (max 6MB)', 400), file: null }
  }

  return { error: null, file }
}

// ============ Image Handlers ============
const handleImageUpload = async (albumId: string, file: any, user: any) => {
  const Album = await getAlbumModel()
  const Image = await getImageModel()

  const album = await Album.findOne({ _id: albumId, userId: user.id })
  if (!album) return createErrorResponse('Album not found', 404)

  const uploadOptions: UploadOptions = {
    userId: user.id,
    albumId,
    fileBuffer: file.content,
  }

  const uploadResult = await uploadImage(uploadOptions)
  const thumbnailUrl = getThumbnailUrl(uploadResult.public_id)

  const newImage = new Image({
    albumId,
    userId: user.id,
    filename: file.filename,
    originalName: file.filename,
    url: uploadResult.secure_url,
    thumbnailUrl,
    publicId: uploadResult.public_id,
    format: uploadResult.format,
    width: uploadResult.width,
    height: uploadResult.height,
    size: uploadResult.bytes,
  })

  const savedImage = await newImage.save()
  return createSuccessResponse({ data: savedImage })
}

const handleImageDelete = async (imageId: string, user: any) => {
  const Image = await getImageModel()
  const image = await Image.findOne({ _id: imageId, userId: user.id })

  if (!image) return createErrorResponse('Image not found', 404)

  if (image.publicId) {
    await deleteImage(image.publicId)
  }

  await Image.deleteOne({ _id: imageId })
  return createSuccessResponse({ message: 'Image successfully deleted' })
}

const handleListImages = async (albumId: string, params: URLSearchParams, user: any) => {
  const Album = await getAlbumModel()
  const Image = await getImageModel()

  const limit = parseInt(params.get('limit') || '20', 10)
  const page = parseInt(params.get('page') || '1', 10)
  const skip = (page - 1) * limit
  const sort = params.get('sort') || 'newest'

  const album = await Album.findOne({ _id: albumId, userId: user.id })
  if (!album) return createErrorResponse('Album not found', 404)

  let sortCriteria: any = {}
  switch (sort) {
    case 'newest':
      sortCriteria = { createdAt: -1 }
      break
    case 'oldest':
      sortCriteria = { createdAt: 1 }
      break
    case 'largest':
      sortCriteria = { size: -1 }
      break
    case 'smallest':
      sortCriteria = { size: 1 }
      break
    default:
      break
  }

  const images = await Image.find({ albumId }).sort(sortCriteria).skip(skip).limit(limit).lean()
  const total = await Image.countDocuments({ albumId })
  const hasMore = skip + images.length < total

  return createSuccessResponse({
    data: { images, total, hasMore, page, limit },
  })
}

// ============ Album Handlers ============
const handleGetAlbums = async (params: URLSearchParams, user: any) => {
  const Album = await getAlbumModel()
  const Image = await getImageModel()

  const limit = parseInt(params.get('limit') || '50', 10)
  const page = parseInt(params.get('page') || '1', 10)
  const skip = (page - 1) * limit
  const search = params.get('search') || ''
  const sort = params.get('sort') || 'newest'

  const filter: any = { userId: user.id }
  if (search.trim()) filter.name = { $regex: search.trim(), $options: 'i' }

  let sortCriteria: any = {}
  switch (sort) {
    case 'newest':
      sortCriteria = { createdAt: -1 }
      break
    case 'oldest':
      sortCriteria = { createdAt: 1 }
      break
    case 'name':
      sortCriteria = { name: 1 }
      break
    case 'images':
      sortCriteria = { createdAt: -1 }
      break
    default:
      sortCriteria = { createdAt: -1 }
  }

  const albumList = await Album.find(filter).sort(sortCriteria).skip(skip).limit(limit).lean()

  const albumsWithCounts = await Promise.all(
    albumList.map(async (album) => {
      const imageCount = await Image.countDocuments({ albumId: album._id })
      const coverImage = await Image.findOne({ albumId: album._id })
        .sort({ createdAt: -1 })
        .lean()

      return {
        ...album,
        imageCount,
        coverImage: coverImage?.thumbnailUrl || coverImage?.url || null,
      }
    }),
  )

  if (sort === 'images') {
    albumsWithCounts.sort((a, b) => (b.imageCount || 0) - (a.imageCount || 0))
  }

  const total = await Album.countDocuments(filter)

  return createSuccessResponse({
    data: albumsWithCounts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

const handleCreateAlbum = async (bodyText: string, user: any) => {
  const Album = await getAlbumModel()
  const { name, description, isPrivate } = parseBody(bodyText)

  if (!name?.trim()) return createErrorResponse('Album name is required', 400)

  const newAlbum = new Album({
    name: name.trim(),
    description: description?.trim() || '',
    isPrivate: Boolean(isPrivate),
    userId: user.id,
  })

  const inserted = await newAlbum.save()
  return createSuccessResponse({ data: inserted })
}

const handleGetAlbum = async (albumId: string, user: any) => {
  const Album = await getAlbumModel()
  const Image = await getImageModel()

  const album = await Album.findOne({ _id: albumId, userId: user.id }).lean()
  if (!album) return createErrorResponse('Album not found', 404)

  const imageCount = await Image.countDocuments({ albumId })
  return createSuccessResponse({ data: { ...album, imageCount } })
}

const handleUpdateAlbum = async (albumId: string, bodyText: string, user: any) => {
  const Album = await getAlbumModel()
  const { name, description, isPrivate } = parseBody(bodyText)

  if (!name?.trim()) return createErrorResponse('Album name is required', 400)

  const album = await Album.findOne({ _id: albumId, userId: user.id })
  if (!album) return createErrorResponse('Album not found', 404)

  album.name = name.trim()
  album.description = description?.trim() || ''
  if (isPrivate !== undefined) album.isPrivate = Boolean(isPrivate)
  await album.save()

  return createSuccessResponse({ data: album })
}

const handleDeleteAlbum = async (albumId: string, user: any) => {
  const Album = await getAlbumModel()
  const Image = await getImageModel()

  const album = await Album.findOne({ _id: albumId, userId: user.id })
  if (!album) return createErrorResponse('Album not found', 404)

  const albumImages = await Image.find({ albumId })
  const deletePromises = albumImages.map(async (image) => {
    if (image.publicId) {
      await deleteImage(image.publicId)
    }
  })

  await Promise.all(deletePromises)
  await Image.deleteMany({ albumId })
  await Album.deleteOne({ _id: albumId })

  return createSuccessResponse({ message: 'Album deleted successfully' })
}

// ============ Middleware ============
const handleAlbums = compose(sameOriginMiddleware(), authMiddleware, methodMiddleware(['GET', 'POST', 'PUT', 'DELETE']))

// ============ Main Handler ============
export default handleAlbums(async (request: Request, { user }: AuthContext) => {
  try {
    const url = new URL(request.url)
    const path = url.pathname
    const params = url.searchParams

    const pathParts = path.split('/').filter(Boolean)
    const albumsIndex = pathParts.indexOf('albums')

    const albumId =
      albumsIndex !== -1 && pathParts.length > albumsIndex + 1 ? pathParts[albumsIndex + 1] : null
    const isImages =
      albumsIndex !== -1 &&
      pathParts.length > albumsIndex + 2 &&
      pathParts[albumsIndex + 2] === 'images'

    if (albumId && albumId.length === 24) {
      // valid ObjectId length
      // POST /albums/{id}/images - Upload image
      if (isImages && request.method === 'POST') {
        const { error, file } = await validateAndParseImageUpload(request)
        if (error) return error

        return await handleImageUpload(albumId, file, user)
      }

      // DELETE /albums/{id}/images/{imageId} - Delete image
      if (isImages && request.method === 'DELETE') {
        const imageId =
          pathParts.length > albumsIndex + 3 ? pathParts[albumsIndex + 3] : null
        if (!imageId || imageId.length !== 24) {
          return createErrorResponse('Invalid image ID', 400)
        }

        return await handleImageDelete(imageId, user)
      }

      // GET /albums/{id}/images - List images
      if (isImages && request.method === 'GET') {
        return await handleListImages(albumId, params, user)
      }

      // album CRUD
      if (request.method === 'GET') {
        return await handleGetAlbum(albumId, user)
      }

      if (request.method === 'PUT') {
        const bodyText = await request.text()
        return await handleUpdateAlbum(albumId, bodyText, user)
      }

      if (request.method === 'DELETE') {
        return await handleDeleteAlbum(albumId, user)
      }

      return createErrorResponse('Method not allowed', 405)
    }

    // Collection Level
    if (request.method === 'GET') {
      return await handleGetAlbums(params, user)
    }

    if (request.method === 'POST') {
      const bodyText = await request.text()
      return await handleCreateAlbum(bodyText, user)
    }

    return createErrorResponse('Method not allowed', 405)
  } catch (error: unknown) {
    logError(error)
    return createErrorResponse()
  }
})
