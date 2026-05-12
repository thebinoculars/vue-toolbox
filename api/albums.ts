import { User } from '~/shared/types'

import { deleteImage, getThumbnailUrl, uploadImage, type UploadOptions } from './_lib/image'
import { getAlbumModel, getImageModel } from './_lib/db'
import {
  authMiddleware,
  createErrorResponse,
  createHandler,
  createSuccessResponse,
  methodMiddleware,
  sameOriginMiddleware,
} from './_lib/http'

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
    return {
      error: createErrorResponse('Content-Type must be multipart/form-data', 400),
      file: null,
    }
  }

  const boundary = contentType.split('boundary=')[1]
  if (!boundary) {
    return { error: createErrorResponse('Boundary not found in Content-Type', 400), file: null }
  }

  const buffer = await request.arrayBuffer()
  const binaryBody = Buffer.from(buffer).toString('binary')
  const parsed = parseMultipart(binaryBody, boundary)

  const file = parsed.files[0]
  if (!file) {
    return { error: createErrorResponse('File is required', 400), file: null }
  }

  if (!file.contentType.startsWith('image/')) {
    return { error: createErrorResponse('Only image files are allowed', 400), file: null }
  }

  const maxSize = 6 * 1024 * 1024
  if (file.content.length > maxSize) {
    return { error: createErrorResponse('File too large (max 6MB)', 400), file: null }
  }

  return { error: null, file }
}

const handleUploadImage = async (albumId: string, file: any, user: User) => {
  const AlbumModel = await getAlbumModel()
  const ImageModel = await getImageModel()

  const album = await AlbumModel.findOne({ _id: albumId, userId: user.id })
  if (!album) {
    return createErrorResponse('Album not found', 404)
  }

  const uploadOptions: UploadOptions = {
    userId: user.id,
    albumId,
    fileBuffer: file.content,
  }

  const uploadResult = await uploadImage(uploadOptions)
  const thumbnailUrl = getThumbnailUrl(uploadResult.public_id)

  const newImage = new ImageModel({
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

const handleDeleteImage = async (imageId: string, user: User) => {
  const ImageModel = await getImageModel()
  const image = await ImageModel.findOne({ _id: imageId, userId: user.id })

  if (!image) {
    return createErrorResponse('Image not found', 404)
  }

  if (image.publicId) {
    await deleteImage(image.publicId)
  }

  await ImageModel.deleteOne({ _id: imageId })
  return createSuccessResponse({ message: 'Image successfully deleted' })
}

const handleGetImages = async (albumId: string, params: URLSearchParams, user: User) => {
  const AlbumModel = await getAlbumModel()
  const ImageModel = await getImageModel()

  const limit = parseInt(params.get('limit') || '20', 10)
  const page = parseInt(params.get('page') || '1', 10)
  const skip = (page - 1) * limit
  const sort = params.get('sort') || 'newest'

  const album = await AlbumModel.findOne({ _id: albumId, userId: user.id })
  if (!album) {
    return createErrorResponse('Album not found', 404)
  }

  let sortCriteria: any
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
      sortCriteria = { createdAt: -1 }
      break
  }

  const images = await ImageModel.find({ albumId })
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit)
    .lean()
  const total = await ImageModel.countDocuments({ albumId })
  const hasMore = skip + images.length < total

  return createSuccessResponse({
    data: { images, total, hasMore, page, limit },
  })
}

const handleGetAlbums = async (params: URLSearchParams, user: User) => {
  const AlbumModel = await getAlbumModel()
  const ImageModel = await getImageModel()

  const limit = parseInt(params.get('limit') || '50', 10)
  const page = parseInt(params.get('page') || '1', 10)
  const skip = (page - 1) * limit
  const search = params.get('search') || ''
  const sort = params.get('sort') || 'newest'

  const filter: any = { userId: user.id }
  if (search.trim()) {
    filter.name = { $regex: search.trim(), $options: 'i' }
  }

  let sortCriteria: any
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
      break
  }

  const albumList = await AlbumModel.find(filter).sort(sortCriteria).skip(skip).limit(limit).lean()

  const albumsWithCounts = await Promise.all(
    albumList.map(async (album) => {
      const imageCount = await ImageModel.countDocuments({ albumId: album._id })
      const coverImage = await ImageModel.findOne({ albumId: album._id })
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

  const total = await AlbumModel.countDocuments(filter)

  return createSuccessResponse({
    data: albumsWithCounts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

const handleCreateAlbum = async (request: Request, user: User) => {
  const AlbumModel = await getAlbumModel()
  const { name, description, isPrivate } = (await request.json()) as {
    name: string
    description?: string
    isPrivate?: boolean
  }

  if (!name?.trim()) {
    return createErrorResponse('Album name is required', 400)
  }

  const newAlbum = new AlbumModel({
    name: name.trim(),
    description: description?.trim() || '',
    isPrivate: Boolean(isPrivate),
    userId: user.id,
  })

  const inserted = await newAlbum.save()
  return createSuccessResponse({ data: inserted })
}

const handleGetAlbum = async (albumId: string, user: User) => {
  const AlbumModel = await getAlbumModel()
  const ImageModel = await getImageModel()

  const album = await AlbumModel.findOne({ _id: albumId, userId: user.id }).lean()
  if (!album) {
    return createErrorResponse('Album not found', 404)
  }

  const imageCount = await ImageModel.countDocuments({ albumId })
  return createSuccessResponse({ data: { ...album, imageCount } })
}

const handleUpdateAlbum = async (albumId: string, request: Request, user: User) => {
  const AlbumModel = await getAlbumModel()
  const { name, description, isPrivate } = (await request.json()) as {
    name: string
    description?: string
    isPrivate?: boolean
  }

  if (!name?.trim()) {
    return createErrorResponse('Album name is required', 400)
  }

  const album = await AlbumModel.findOne({ _id: albumId, userId: user.id })
  if (!album) {
    return createErrorResponse('Album not found', 404)
  }

  album.name = name.trim()
  album.description = description?.trim() || ''
  if (isPrivate !== undefined) {
    album.isPrivate = Boolean(isPrivate)
  }
  await album.save()

  return createSuccessResponse({ data: album })
}

const handleDeleteAlbum = async (albumId: string, user: User) => {
  const AlbumModel = await getAlbumModel()
  const ImageModel = await getImageModel()

  const album = await AlbumModel.findOne({ _id: albumId, userId: user.id })
  if (!album) {
    return createErrorResponse('Album not found', 404)
  }

  const albumImages = await ImageModel.find({ albumId })
  const deletePromises = albumImages.map(async (image) => {
    if (image.publicId) {
      await deleteImage(image.publicId)
    }
  })

  await Promise.all(deletePromises)
  await ImageModel.deleteMany({ albumId })
  await AlbumModel.deleteOne({ _id: albumId })

  return createSuccessResponse({ message: 'Album deleted successfully' })
}

const handler = createHandler({
  middlewares: [
    sameOriginMiddleware(),
    authMiddleware(),
    methodMiddleware(['GET', 'POST', 'PUT', 'DELETE']),
  ],
})

export default handler(async (request: Request, { user }: { user: User }) => {
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
    if (isImages && request.method === 'POST') {
      const { error, file } = await validateAndParseImageUpload(request)
      if (error) {
        return error
      }

      return await handleUploadImage(albumId, file, user)
    }

    if (isImages && request.method === 'DELETE') {
      const imageId = pathParts.length > albumsIndex + 3 ? pathParts[albumsIndex + 3] : null
      if (!imageId || imageId.length !== 24) {
        return createErrorResponse('Invalid image ID', 400)
      }

      return await handleDeleteImage(imageId, user)
    }

    if (isImages && request.method === 'GET') {
      return await handleGetImages(albumId, params, user)
    }

    if (request.method === 'GET') {
      return await handleGetAlbum(albumId, user)
    }

    if (request.method === 'PUT') {
      return await handleUpdateAlbum(albumId, request, user)
    }

    if (request.method === 'DELETE') {
      return await handleDeleteAlbum(albumId, user)
    }

    return createErrorResponse('Method not allowed', 405)
  }

  if (request.method === 'GET') {
    return await handleGetAlbums(params, user)
  }

  if (request.method === 'POST') {
    return await handleCreateAlbum(request, user)
  }

  return createErrorResponse('Method not allowed', 405)
})
