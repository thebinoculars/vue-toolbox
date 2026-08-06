import { defineStore } from 'pinia'

import type { User } from '~/shared/types'

const STORAGE_KEY = 'auth.token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEY))

  const setUser = (userData: User) => {
    user.value = userData
  }

  const setToken = (tokenValue: string) => {
    token.value = tokenValue
    localStorage.setItem(STORAGE_KEY, tokenValue)
  }

  const clearAuth = () => {
    user.value = null
    token.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    user,
    token,
    setUser,
    setToken,
    clearAuth,
  }
})
