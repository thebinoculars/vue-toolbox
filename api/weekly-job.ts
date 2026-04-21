import axios from 'axios'
import { getTrackModel } from './_lib/db'
import { createErrorResponse, createSuccessResponse } from './_lib/http'
import { logError } from './_lib/utils'
import { compose, methodMiddleware, sameOriginMiddleware } from './_lib/middleware'
import type { OnePieceEpisode, OnePieceBulkUpdateConfig } from '../shared/types'

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
    const Track = await getTrackModel()
    await Track.bulkWrite(bulkOps)
  }
}

const handleWeeklyJob = compose(sameOriginMiddleware(), methodMiddleware(['GET']))

export default handleWeeklyJob(async (_request: Request) => {
  try {
    await syncTracks()

    return createSuccessResponse({ message: 'One Piece episodes updated successfully' })
  } catch (error: unknown) {
    logError(error)
    return createErrorResponse()
  }
})
