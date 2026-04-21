import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { AuthResponse, User, ApiError } from '~/shared/types'

const STORAGE_KEY = 'auth.token'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

async function handleApiCall<T>(promise: Promise<T>): Promise<{ data?: T; error?: ApiError }> {
  try {
    const response = await promise
    return { data: response }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return {
        error: {
          success: false,
          message: error.response?.data?.message || error.message,
        },
      }
    }
    return {
      error: {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      },
    }
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem(STORAGE_KEY))
  const loading = ref(false)

  const register = async (email: string, password: string) => {
    loading.value = true
    const { data, error } = await handleApiCall<AuthResponse>(
      apiClient.post<AuthResponse>('/register', { email, password }).then((res) => res.data),
    )
    if (data?.success && data.token) {
      token.value = data.token
      localStorage.setItem(STORAGE_KEY, data.token)
      user.value = data.user || { id: '', email }
    }
    loading.value = false
    return { data, error }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    const { data, error } = await handleApiCall<AuthResponse>(
      apiClient.post<AuthResponse>('/login', { email, password }).then((res) => res.data),
    )
    if (data?.success && data.token) {
      token.value = data.token
      localStorage.setItem(STORAGE_KEY, data.token)
      user.value = data.user || { id: '', email }
    }
    loading.value = false
    return { data, error }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem(STORAGE_KEY)
    return { error: null }
  }

  const fetchMe = async () => {
    if (!token.value) return
    const { data } = await handleApiCall<AuthResponse>(
      apiClient
        .get<AuthResponse>('/me', {
          headers: { Authorization: `Bearer ${token.value}` },
        })
        .then((res) => res.data),
    )
    if (data?.success && data.user) user.value = data.user
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
