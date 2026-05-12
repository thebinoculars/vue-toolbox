import axios from 'axios'

import { getTrackModel } from './_lib/db'
import {
  createHandler,
  createSuccessResponse,
  methodMiddleware,
  sameOriginMiddleware,
} from './_lib/http'

interface OnePieceEpisode {
  _id: string
  episode: number
}

type OnePieceBulkUpdateConfig = {
  updateOne: {
    filter: { episode: number }
    update: { $set: OnePieceEpisode }
    upsert: true
  }
}

const syncTracks = async () => {
  const bulkOps: OnePieceBulkUpdateConfig[] = []

  const response = await axios.get('http://onepiecetracklist.com/server/getstamps.php')

  const { episodes } = response.data

  episodes.forEach((episode: OnePieceEpisode) => {
    bulkOps.push({
      updateOne: {
        filter: { episode: episode.episode },
        update: { $set: episode },
        upsert: true,
      },
    })
  })

  if (bulkOps.length) {
    const trackModel = await getTrackModel()
    await trackModel.bulkWrite(bulkOps)
  }
}

const handler = createHandler({
  middlewares: [sameOriginMiddleware(), methodMiddleware(['GET'])],
})

export default handler(async () => {
  await syncTracks()

  return createSuccessResponse({ message: 'One Piece episodes updated successfully' })
})
