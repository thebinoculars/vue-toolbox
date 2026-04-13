import jwt from 'jsonwebtoken'
import { getUserModel } from './_lib/db'
import { checkMethod, createErrorResponse, createSuccessResponse } from './_lib/http'
import { getJwtSecret, logError } from './_lib/utils'
import { User } from '~/shared/types'

export default async (request: Request) => {
  const methodError = checkMethod(request.method, ['GET'])
  if (methodError) {
    return methodError
  }

  const authHeader =
    request.headers.get('Authorization') || request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return createErrorResponse('Missing token', 401)
  }

  try {
    const auth = jwt.verify(token, getJwtSecret()) as User
    if (!auth) {
      return createErrorResponse('Unauthorized', 401)
    }

    const User = await getUserModel()
    const user = await User.findById(auth!.id).select('-password')
    if (!user) {
      return createErrorResponse('User not found', 404)
    }

    return createSuccessResponse({
      user: { id: user._id.toString(), email: user.email, isApproved: user.isApproved },
    })
  } catch (error: unknown) {
    logError(error)
    return createErrorResponse()
  }
}
