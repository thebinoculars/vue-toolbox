import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { User } from '~/shared/types'

interface AuthResponse {
  success: boolean
  message: string
  user?: User
  token?: string
}

const STORAGE_KEY = 'auth.token'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEY))
  const loading = ref(false)

  const register = async (email: string, password: string) => {
    loading.value = true
    try {
      const response = await apiClient.post<AuthResponse>('/register', { email, password })
      const data = response.data

      if (data.success && data.token) {
        token.value = data.token
        localStorage.setItem(STORAGE_KEY, data.token)
        user.value = data.user || { id: '', email }
      }
      return { data, error: null }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed'
      return { data: null, error: message }
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    try {
      const response = await apiClient.post<AuthResponse>('/login', { email, password })
      const data = response.data

      if (data.success && data.token) {
        token.value = data.token
        localStorage.setItem(STORAGE_KEY, data.token)
        user.value = data.user || { id: '', email }
      }
      return { data, error: null }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed'
      return { data: null, error: message }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem(STORAGE_KEY)
    return { error: null }
  }

  const fetchMe = async () => {
    if (!token.value) {
      return
    }

    try {
      const response = await apiClient.get<AuthResponse>('/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      const data = response.data
      if (data.success && data.user) {
        user.value = data.user
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout() // Token invalid or expired
    }
  }

  return {
    user,
    token,
    loading,
    register,
    login,
    logout,
    fetchMe,
  }
})
