export const createSuccessResponse = (data = {}, statusCode = 200) =>
  Response.json({ success: true, ...data }, { status: statusCode })

export const createErrorResponse = (
  message = 'Server error. Please try again later.',
  statusCode = 500,
) => Response.json({ success: false, message }, { status: statusCode })

export const parseBody = (body: string): any => {
  try {
    return JSON.parse(body || '{}')
  } catch {
    throw new Error('Invalid JSON body')
  }
}

export const getDetailParam = (apiPath: string, resourceName: string): string | null => {
  const pathParts = apiPath.split('/')
  const detailPath = pathParts[pathParts.indexOf(resourceName) + 1]
  return detailPath ? decodeURIComponent(detailPath) : null
}
