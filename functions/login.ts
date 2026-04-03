import type { Handler } from '@netlify/functions'
import bcrypt from 'bcryptjs'
import { getUserModel } from './_lib/db'
import { generateToken, CORS_HEADERS } from './_lib/jwt'

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
        body: JSON.stringify({
          success: false,
          message: 'Email and password are required',
        }),
      }
    }

    const User = await getUserModel()
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: 'Invalid email or password' }),
      }
    }

    if (!user.isApproved) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: 'Your account is pending approval.' }),
      }
    }

    const token = generateToken({ id: user._id.toString(), email: user.email })

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        token,
        user: { id: user._id, email: user.email },
      }),
    }
  } catch (error) {
    console.error('Login error:', error)
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
