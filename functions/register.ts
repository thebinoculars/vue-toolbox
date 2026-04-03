import type { Handler } from '@netlify/functions'
import bcrypt from 'bcryptjs'
import { getUserModel } from './_lib/db'
import { CORS_HEADERS } from './_lib/jwt'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    }
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}')

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: 'Email and password are required' }),
      }
    }
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: 'Password must be at least 6 characters',
        }),
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: 'Invalid email address',
        }),
      }
    }

    const User = await getUserModel()

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: 'Email is already taken' }),
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ email: email.toLowerCase(), password: passwordHash })

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Registration successful',
        user: { id: user._id, email },
      }),
    }
  } catch (error) {
    console.error('Register error:', error)
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Server error. Please try again later.',
      }),
    }
  }
}
