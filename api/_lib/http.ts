import { User } from '~/shared/types'

import { verifyToken } from './auth'

export const createSuccessResponse = (data = {}, statusCode = 200) =>
  Response.json({ success: true, ...data }, { status: statusCode })

export const createErrorResponse = (
  message = 'Server error. Please try again later.',
  statusCode = 500,
) => Response.json({ success: false, message }, { status: statusCode })

export const getDetailParam = (apiPath: string, resourceName: string): string | null => {
  const pathParts = apiPath.split('/')
  const detailPath = pathParts[pathParts.indexOf(resourceName) + 1]
  return detailPath ? decodeURIComponent(detailPath) : null
}

export type Middleware<T = any> = (request: Request, context: any) => Promise<T | Response>

export type Handler<T = any> = (request: Request, context: T) => Promise<Response | null>

export function authMiddleware() {
  return async (request: Request): Promise<{ user: User } | Response> => {
    const authHeader =
      request.headers.get('Authorization') || request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return createErrorResponse('Missing token', 401)
    }

    try {
      const user = verifyToken(token) as User
      if (!user) {
        return createErrorResponse('Unauthorized', 401)
      }
      return { user }
    } catch (error: unknown) {
      return createErrorResponse('Unauthorized', 401)
    }
  }
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

export function createHandler<T>(options: { middlewares?: Middleware<any>[] }) {
  return function withConfig<U = T>(handler: Handler<U>): (request: Request) => Promise<Response> {
    return async (request: Request) => {
      let context: any = {}

      if (options.middlewares) {
        for (const middleware of options.middlewares) {
          const result = await middleware(request, context)
          if (result instanceof Response) {
            return result
          }
          context = { ...context, ...result }
        }
      }

      try {
        const result = await handler(request, context)
        return result || createErrorResponse('Internal server error', 500)
      } catch (error: unknown) {
        console.error(error)
        return createErrorResponse()
      }
    }
  }
}
