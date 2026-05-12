import { getTrackModel } from './_lib/db'
import {
  createErrorResponse,
  createHandler,
  createSuccessResponse,
  getDetailParam,
  methodMiddleware,
  sameOriginMiddleware,
} from './_lib/http'

const handler = createHandler({
  middlewares: [sameOriginMiddleware(), methodMiddleware(['GET'])],
})

export default handler(async (request: Request) => {
  const url = new URL(request.url)
  const path = url.pathname
  const episode = getDetailParam(path, 'one-piece')

  const trackModel = await getTrackModel()

  if (episode !== null && episode !== '' && !Number.isNaN(Number(episode))) {
    const item = await trackModel.findOne({ episode: episode }).lean().exec()
    if (!item) {
      return createErrorResponse('Episode not found', 404)
    }

    return createSuccessResponse({ item })
  }

  const episodes = await trackModel.find().select('episode').sort({ episode: 'desc' }).lean().exec()

  return createSuccessResponse({ episodes })
})
