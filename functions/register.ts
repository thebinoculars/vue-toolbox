import bcrypt from 'bcryptjs'
import { getUserModel } from './_lib/db'
import { checkMethod, createErrorResponse, createSuccessResponse, parseBody } from './_lib/http'
import { logError } from './_lib/utils'

export default async (request: Request) => {
  const methodError = checkMethod(request.method, ['POST'])
  if (methodError) {
    return methodError
  }

  try {
    const bodyText = await request.text()
    const { email, password } = parseBody(bodyText)

    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    if (password.length < 6) {
      return createErrorResponse('Invalid password', 400)
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return createErrorResponse('Invalid email address', 400)
    }

    const User = await getUserModel()

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return createErrorResponse('Email is already taken', 409)
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ email: email.toLowerCase(), password: passwordHash })

    return createSuccessResponse(
      {
        message: 'Registration successful',
        user: { id: user._id.toString(), email },
      },
      201,
    )
  } catch (error: unknown) {
    logError(error)
    return createErrorResponse()
  }
}
