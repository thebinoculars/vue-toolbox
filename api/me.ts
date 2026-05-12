import { User } from '~/shared/types'

import { comparePassword, hashPassword } from './_lib/auth'
import { getUserModel } from './_lib/db'
import {
  authMiddleware,
  createErrorResponse,
  createHandler,
  createSuccessResponse,
  methodMiddleware,
  sameOriginMiddleware,
} from './_lib/http'

const handler = createHandler({
  middlewares: [sameOriginMiddleware(), authMiddleware(), methodMiddleware(['GET', 'POST'])],
})

export default handler(async (request: Request, { user }: { user: User }) => {
  const UserModel = await getUserModel()

  if (request.method === 'POST') {
    const { currentPassword, newPassword } = (await request.json()) as {
      currentPassword: string
      newPassword: string
    }
    if (!currentPassword || !newPassword) {
      return createErrorResponse('Missing required fields', 400)
    }
    if (newPassword.length < 6) {
      return createErrorResponse('New password must be at least 6 characters', 400)
    }

    const userDoc = await UserModel.findById(user.id)
    if (!userDoc) {
      return createErrorResponse('User not found', 404)
    }

    const isMatch = await comparePassword(currentPassword, userDoc.password)
    if (!isMatch) {
      return createErrorResponse('Current password is incorrect', 400)
    }

    userDoc.password = await hashPassword(newPassword, 10)
    await userDoc.save()
    return createSuccessResponse({ message: 'Password updated successfully' })
  }

  const userDoc = await UserModel.findById(user.id).select('-password')
  if (!userDoc) {
    return createErrorResponse('User not found', 404)
  }

  return createSuccessResponse({
    user: { id: userDoc._id.toString(), email: userDoc.email, isApproved: userDoc.isApproved },
  })
})
