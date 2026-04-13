import { getTrackModel } from './_lib/db'
import {
  checkMethod,
  createErrorResponse,
  createSuccessResponse,
  getDetailParam,
} from './_lib/http'
import { logError } from './_lib/utils'

export default async (request: Request) => {
  const methodError = checkMethod(request.method, ['GET'])
  if (methodError) {
    return methodError
  }

  try {
    const url = new URL(request.url)
    const path = url.pathname
    const episode = getDetailParam(path, 'one-piece')

    const TrackModel = await getTrackModel()

    if (episode !== null && episode !== '' && !Number.isNaN(Number(episode))) {
      const item = await TrackModel.findOne({ episode: episode }).lean().exec()
      if (!item) {
        return createErrorResponse('Episode not found', 404)
      }

      return createSuccessResponse({ item })
    }

    const episodes = await TrackModel.find()
      .select('episode')
      .sort({ episode: 'desc' })
      .lean()
      .exec()

    return createSuccessResponse({ episodes })
  } catch (error: unknown) {
    logError(error)
    return createErrorResponse()
  }
}
