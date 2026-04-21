import jwt from 'jsonwebtoken'
import { createErrorResponse } from './http'
import { getJwtSecret } from './utils'
import { User, AuthContext, LogContext, Middleware, Handler } from '~/shared/types'

export async function authMiddleware(request: Request): Promise<AuthContext | Response> {
  const authHeader =
    request.headers.get('Authorization') || request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  
  if (!token) {
    return createErrorResponse('Missing token', 401)
  }

  try {
    const user = jwt.verify(token, getJwtSecret()) as User
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }
    return { user }
  } catch (err) {
    return createErrorResponse('Unauthorized', 401)
  }
}

export async function logMiddleware(request: Request): Promise<LogContext> {
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`)
  return { timestamp: new Date().toISOString() }
}

export function methodMiddleware(allowedMethods: string[]) {
  return async (request: Request): Promise<{} | Response> => {
    if (!allowedMethods.includes(request.method)) {
      return createErrorResponse(`Method ${request.method} not allowed`, 405)
    }
    return {}
  }
}

export function sameOriginMiddleware() {
  return async (request: Request): Promise<{} | Response> => {
    const requestOrigin = request.headers.get('origin')
    const host = request.headers.get('host')

    // Allow same-origin requests
    if (requestOrigin && host) {
      const requestHost = new URL(requestOrigin).hostname
      const currentHost = host.split(':')[0]

      if (requestHost !== currentHost) {
        return createErrorResponse('Same-origin policy: Origin not allowed', 403)
      }
    }

    return {}
  }
}

export function compose<T>(...middlewares: Middleware<any>[]) {
  return function withMiddlewares<U = T>(handler: Handler<U>): (request: Request) => Promise<Response> {
    return async (request: Request) => {
      let context: any = {}

      for (const middleware of middlewares) {
        const result = await middleware(request, context)
        if (result instanceof Response) {
          return result
        }
        context = { ...context, ...result }
      }

      const result = await handler(request, context)
      return result || createErrorResponse('Internal server error', 500)
    }
  }
}

export const withAuth = compose(authMiddleware)

export const withAuthAndLog = compose(authMiddleware, logMiddleware)
