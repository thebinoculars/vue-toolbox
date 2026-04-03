const API_URL = '/api'

export interface AuthResponse {
  success: boolean
  message: string
  user?: {
    id: string
    email: string
  }
  token?: string
}

export interface ApiError {
  success: boolean
  message: string
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const url = `${API_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data }
    }

    return { data }
  } catch (error) {
    return {
      error: {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      },
    }
  }
}

export const authAPI = {
  register: (email: string, password: string) =>
    apiCall<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    apiCall<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    apiCall<AuthResponse>('/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}
