import { comparePassword, generateToken } from './_lib/auth'
import { getUserModel } from './_lib/db'
import {
  createErrorResponse,
  createHandler,
  createSuccessResponse,
  methodMiddleware,
  sameOriginMiddleware,
} from './_lib/http'

const handler = createHandler({
  middlewares: [sameOriginMiddleware(), methodMiddleware(['POST'])],
})

export default handler(async (request: Request) => {
  const { email, password } = (await request.json()) as { email: string; password: string }

  if (!email || !password) {
    return createErrorResponse('Email and password are required', 400)
  }

  const UserModel = await getUserModel()
  const user = await UserModel.findOne({ email: email.toLowerCase() })

  if (!user || !(await comparePassword(password, user.password))) {
    return createErrorResponse('Invalid email or password', 401)
  }

  if (!user.isApproved) {
    return createErrorResponse('Your account is pending approval.', 403)
  }

  const token = generateToken({ id: user._id.toString(), email: user.email })

  return createSuccessResponse({ token, user: { id: user._id.toString(), email: user.email } })
})
