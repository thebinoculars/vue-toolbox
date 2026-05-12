import { type Component } from 'vue'

export interface User {
  id: string
  email: string
}

export interface Tool {
  path: string
  title: string
  category: string
  icon: Component
  desc: string
}

export type TimerId = ReturnType<typeof setTimeout> | any
export type IntervalId = ReturnType<typeof setInterval> | any
