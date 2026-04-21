import { getUserModel } from './_lib/db'
import { createErrorResponse, createSuccessResponse } from './_lib/http'
import { logError } from './_lib/utils'
import { compose, authMiddleware, methodMiddleware, sameOriginMiddleware } from './_lib/middleware'
import { AuthContext } from '~/shared/types'

const handleMe = compose(sameOriginMiddleware(), authMiddleware, methodMiddleware(['GET']))

export default handleMe(async (_request: Request, { user }: AuthContext) => {
  try {
    const User = await getUserModel()
    const userDoc = await User.findById(user.id).select('-password')
    if (!userDoc) {
      return createErrorResponse('User not found', 404)
    }

    return createSuccessResponse({
      user: { id: userDoc._id.toString(), email: userDoc.email, isApproved: userDoc.isApproved },
    })
  } catch (error: unknown) {
    logError(error)
    return createErrorResponse()
  }
})
