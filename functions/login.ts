import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getUserModel } from './_lib/db'
import { checkMethod, createErrorResponse, createSuccessResponse, parseBody } from './_lib/http'
import { getJwtSecret, logError } from './_lib/utils'

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

    const User = await getUserModel()
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return createErrorResponse('Invalid email or password', 401)
    }

    if (!user.isApproved) {
      return createErrorResponse('Your account is pending approval.', 403)
    }

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, getJwtSecret(), {
      expiresIn: '7d',
    })

    return createSuccessResponse({ token, user: { id: user._id.toString(), email: user.email } })
  } catch (error: unknown) {
    logError(error)
    return createErrorResponse()
  }
}
