import type { Handler } from '@netlify/functions'
import { getUserModel } from './_lib/db'
import { authenticateRequest, CORS_HEADERS } from './_lib/jwt'

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    }
  }

  const auth = authenticateRequest(event)
  if (auth.error) return auth.error as any

  try {
    const User = await getUserModel()
    const user = await User.findById(auth.user!.id).select('-password')
    if (!user) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: 'User not found' }),
      }
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        user: { id: user._id, email: user.email, isApproved: user.isApproved },
      }),
    }
  } catch (error) {
    console.error('Me error:', error)
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: 'Server error. Please try again later.' }),
    }
  }
}
