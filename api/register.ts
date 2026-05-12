import { hashPassword } from './_lib/auth'
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

  if (password.length < 6) {
    return createErrorResponse('Invalid password', 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return createErrorResponse('Invalid email address', 400)
  }

  const UserModel = await getUserModel()

  const existing = await UserModel.findOne({ email: email.toLowerCase() })
  if (existing) {
    return createErrorResponse('Email is already taken', 409)
  }

  const passwordHash = await hashPassword(password)
  const user = await UserModel.create({ email: email.toLowerCase(), password: passwordHash })

  return createSuccessResponse(
    {
      message: 'Registration successful',
      user: { id: user._id.toString(), email },
    },
    201,
  )
})
