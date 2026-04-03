import type { Handler } from '@netlify/functions'
import { authenticateRequest, CORS_HEADERS } from './_lib/jwt'

interface ApiTarget {
  baseUrl: string
  authHeader: string | null
  authPrefix?: string
  authQueryParam?: string
  envKey: string
}

const API_TARGETS: Record<string, ApiTarget> = {
  openai: {
    baseUrl: 'https://api.openai.com',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    envKey: 'OPENAI_API_KEY',
  },
  weather: {
    baseUrl: 'https://api.openweathermap.org',
    authHeader: null,
    authQueryParam: 'appid',
    envKey: 'OPENWEATHER_API_KEY',
  },
  github: {
    baseUrl: 'https://api.github.com',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    envKey: 'GITHUB_API_KEY',
  },
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, message: 'Method not allowed.' }),
    }
  }

  const auth = authenticateRequest(event)
  if (auth.error) return auth.error as any

  try {
    const {
      target,
      method = 'GET',
      path = '/',
      body: requestBody,
      query = {},
      customUrl,
    } = JSON.parse(event.body || '{}')

    if (!target) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          message: `Missing "target". Supported: ${Object.keys(API_TARGETS).join(', ')}, custom`,
        }),
      }
    }

    let targetUrl: string
    const targetHeaders: Record<string, string> = { 'Content-Type': 'application/json' }

    if (target === 'custom') {
      if (!customUrl)
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: false,
            message: 'Missing "customUrl" for custom target',
          }),
        }
      targetUrl = customUrl
    } else {
      const config = API_TARGETS[target]
      if (!config) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, message: `Unknown target "${target}"` }),
        }
      }

      const apiKey = process.env[config.envKey]
      if (!apiKey) {
        return {
          statusCode: 500,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: false,
            message: `API key for "${target}" not configured. Set ${config.envKey}.`,
          }),
        }
      }

      const queryParams = new URLSearchParams(query)
      if (config.authQueryParam) queryParams.set(config.authQueryParam, apiKey)
      const qs = queryParams.toString()
      targetUrl = `${config.baseUrl}${path}${qs ? '?' + qs : ''}`
      if (config.authHeader)
        targetHeaders[config.authHeader] = `${config.authPrefix || ''}${apiKey}`
    }

    const fetchOptions: RequestInit = { method: method.toUpperCase(), headers: targetHeaders }
    if (requestBody && method.toUpperCase() !== 'GET')
      fetchOptions.body = JSON.stringify(requestBody)

    const response = await fetch(targetUrl, fetchOptions)
    const text = await response.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    return {
      statusCode: response.status,
      headers: { ...CORS_HEADERS, 'X-Proxy-Status': response.status.toString() },
      body: JSON.stringify({ success: response.ok, status: response.status, data }),
    }
  } catch (error: any) {
    console.error('Proxy error:', error)
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        message: 'Proxy request failed. ' + (error.message || 'Unknown error'),
      }),
    }
  }
}
