import { type Component } from 'vue'

export interface ApiError {
  success: boolean
  message: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
  }
  token?: string
}

export interface User {
  id: string
  email: string
}

export interface OnePieceEpisode {
  _id: string
  episode: number
}

export interface OnePieceStamp {
  _id?: string
  time: string
  song?: {
    id: number
    titles: { en: string }
  }
  album?: {
    titles: { en: string }
  }
}

export interface OnePieceBulkUpdateConfig {
  updateOne: {
    filter: { episode: number }
    update: { $set: OnePieceEpisode }
    upsert: true
  }
}

export interface TextArtSettings {
  width: number
  height: number
  lyrics: string
  lineSeparator: string
  bgColor: string
  brightness: number
  contrast: number
  fontFamily: string
  fontSize: number
  lineHeight: number
  maintainAspectRatio: boolean
}

export interface WeatherInfo {
  main: { temp: number; feels_like: number; humidity: number; pressure: number }
  weather: Array<{ icon: string; description: string }>
  wind: { speed: number }
}

export interface ForecastItem {
  dt: number
  main: { temp: number; temp_min: number; temp_max: number; humidity: number }
  weather: Array<{ icon: string; description: string }>
}

export interface SpotlightImageUrl {
  asset: string
}

export interface SpotlightImageData {
  title?: string
  portraitImage?: SpotlightImageUrl
  landscapeImage?: SpotlightImageUrl
}

export interface SpotlightResponse {
  ad?: SpotlightImageData
}

export interface Tool {
  path: string
  title: string
  category: string
  icon: Component
  desc: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TimerId = ReturnType<typeof setTimeout> | any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IntervalId = ReturnType<typeof setInterval> | any
