import { getStore } from '@netlify/blobs'
import { getNesModel } from './_lib/db'
import {
  createErrorResponse,
  createSuccessResponse,
  getDetailParam,
} from './_lib/http'
import { logError } from './_lib/utils'
import { compose, methodMiddleware, sameOriginMiddleware } from './_lib/middleware'

const handleNesGames = compose(sameOriginMiddleware(), methodMiddleware(['GET', 'HEAD']))

export default handleNesGames(async (request: Request) => {
  try {
    const url = new URL(request.url)
    const path = url.pathname
    const id = getDetailParam(path, 'nes-games')

    const NesModel = await getNesModel()

    if (id) {
      const item = await NesModel.findById(id).select('id name').lean().exec()
      if (!item) {
        return new Response('Game not found', { status: 404 })
      }

      const store = getStore('games')

      const romData = await store.get(`roms/${item.name}.nes`, { type: 'arrayBuffer' })

      return new Response(Buffer.from(romData))
    }

    const games = await NesModel.find().sort({ name: 1 }).select('id name').lean().exec()

    return createSuccessResponse({ games })
  } catch (error: unknown) {
    logError(error)
    return createErrorResponse()
  }
})
