const processEnv = typeof process !== 'undefined' ? process.env : {}
const viteEnv = (import.meta as any).env || {}

export const getRandomKey = (keysString: string): string => {
  if (!keysString) {
    return ''
  }
  const keys = keysString.split(',').map(key => key.trim()).filter(key => !!key)
  if (keys.length === 0) {
    return ''
  }
  const randomIndex = Math.floor(Math.random() * keys.length)
  return keys[randomIndex]
}

const getEnv = (key: string, defaultValue: string) => {
  const value = processEnv[key] || viteEnv[key]
  
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
    return defaultValue
  }
  
  return getRandomKey(value)
}

export const getJwtSecret = () => getEnv('JWT_SECRET', 'secret-key')
export const getWeatherApiKey = () => getEnv('OPEN_WEATHER_MAP_API_KEY', '')
export const getMongoDBUri = () => getEnv('MONGODB_URI', 'mongodb://localhost:27017/toolbox')
export const getCloudinaryCloudName = () => getEnv('CLOUDINARY_CLOUD_NAME', '')
export const getCloudinaryApiKey = () => getEnv('CLOUDINARY_API_KEY', '')
export const getCloudinaryApiSecret = () => getEnv('CLOUDINARY_API_SECRET', '')
export const getGoogleTranslateApiKey = () => getEnv('GOOGLE_TRANSLATE_API_KEY', '')
export const getGoogleMapsApiKey = () => getEnv('VITE_GOOGLE_MAPS_API_KEY', '')
