import { ref } from 'vue'
import { authAPI } from '../services/api'

interface User {
  id: string
  email: string
}

const user = ref<User | null>(null)
const token = ref<string | null>(localStorage.getItem('authToken'))
const loading = ref(false)

export function useAuth() {
  const register = async (email: string, password: string) => {
    loading.value = true
    const { data, error } = await authAPI.register(email, password)
    if (data?.success && data.token) {
      token.value = data.token
      localStorage.setItem('authToken', data.token)
      user.value = data.user || { id: '', email }
    }
    loading.value = false
    return { data, error }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    const { data, error } = await authAPI.login(email, password)
    if (data?.success && data.token) {
      token.value = data.token
      localStorage.setItem('authToken', data.token)
      user.value = data.user || { id: '', email }
    }
    loading.value = false
    return { data, error }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('authToken')
    return { error: null }
  }

  const fetchMe = async () => {
    if (!token.value) return
    const { data } = await authAPI.me(token.value)
    if (data?.success && data.user) user.value = data.user
  }

  return { user, token, loading, register, login, logout, fetchMe }
}
