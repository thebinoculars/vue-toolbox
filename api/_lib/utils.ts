const processEnv = (globalThis as any).process?.env || {}
const consoleError = (globalThis as any).console?.error || (() => {})

const getEnv = (key: string, defaultValue: string) => {
  const value = processEnv[key]
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
    return defaultValue
  }
  return value
}

export const getJwtSecret = () => getEnv('JWT_SECRET', 'secret-key')

export const getWeatherApiKey = () => getEnv('WEATHER_API_KEY', '')

export const getMongoDBUri = () => getEnv('MONGODB_URI', 'mongodb://localhost:27017/toolbox')

export const getCloudinaryCloudName = () => getEnv('CLOUDINARY_CLOUD_NAME', '')
export const getCloudinaryApiKey = () => getEnv('CLOUDINARY_API_KEY', '')
export const getCloudinaryApiSecret = () => getEnv('CLOUDINARY_API_SECRET', '')

export const logError = (error: Error | string | unknown) =>
  consoleError(error instanceof Error ? error.message : String(error))
