import { Handler } from '@netlify/functions'
import axios from 'axios'

import {
  batchInsertOnePieceTracks,
  batchUpdateOnePieceTracks,
  getOnePieceTracksByEpisodes,
} from './database/OnePiece'

export const syncOnePieceTracks = async () => {
  const baseUrl = 'http://onepiecetracklist.com/server/getstamps.php'
  let page = 1
  let totalPages = 1
  let allEpisodes: any[] = []

  do {
    const response = await axios.get<{
      pages: number
      episodes: Array<{
        episode_id: number
        episode: number
        titles: {
          en: string
          ja?: string
        }
        release_date: string
        stamps: unknown[]
      }>
    }>(`${baseUrl}?page=${page}`)
    const data = response.data

    allEpisodes = [...allEpisodes, ...data.episodes]

    page++
  } while (page <= totalPages)

  const episodeNumbers = allEpisodes.map((ep) => ep.episode)
  const existingTracks = await getOnePieceTracksByEpisodes(episodeNumbers)
  const existingEpisodeMap = new Map(
    (existingTracks || []).map((track: any) => [track.episode, track.id]),
  )

  const toInsert: Array<{
    episode: number
    title_en: string
    title_ja: string | null
    release_date: string
    stamps: unknown[]
  }> = []

  const toUpdate: Array<{
    episode: number
    title_en: string
    title_ja: string | null
    release_date: string
    stamps: unknown[]
  }> = []

  for (const episode of allEpisodes) {
    const trackData = {
      episode: episode.episode,
      title_en: episode.titles.en,
      title_ja: episode.titles.ja || null,
      release_date: episode.release_date,
      stamps: episode.stamps,
    }

    if (existingEpisodeMap.has(episode.episode)) {
      toUpdate.push(trackData)
    } else {
      toInsert.push(trackData)
    }
  }

  if (toInsert.length > 0) {
    await batchInsertOnePieceTracks(toInsert)
  }

  if (toUpdate.length > 0) {
    await batchUpdateOnePieceTracks(toUpdate)
  }

  return { success: true }
}

export const syncOnePieceTracksHandler = async () => {
  try {
    await syncOnePieceTracks()
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'One Piece tracks synced successfully' }),
    }
  } catch (error) {
    console.error('One Piece tracks sync failed:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'One Piece tracks sync failed' }),
    }
  }
}

export const handler: Handler = async () => {
  await syncOnePieceTracksHandler()

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'All scheduled tasks completed successfully' }),
  }
}
