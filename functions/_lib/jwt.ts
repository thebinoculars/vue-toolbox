import jwt from 'jsonwebtoken'
import type { HandlerEvent } from '@netlify/functions'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'
const JWT_EXPIRES_IN = '7d'

export interface TokenPayload {
  id: string
  email: string
}

export const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}

export function authenticateRequest(event: HandlerEvent): { user?: TokenPayload; error?: object } {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return {
      error: {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message: 'Authentication required.' }),
      },
    }
  }

  try {
    return { user: verifyToken(token) }
  } catch (err: any) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token has expired. Please sign in again.'
        : 'Invalid token. Please sign in again.'
    return {
      error: {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, message }),
      },
    }
  }
}
