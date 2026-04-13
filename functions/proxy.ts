import { URLSearchParams } from 'url'
import axios, { AxiosRequestConfig } from 'axios'
import { checkMethod, createErrorResponse, getDetailParam } from './_lib/http'
import { getWeatherApiKey, logError } from './_lib/utils'

const SERVICES = {
  weather: {
    baseURL: 'https://api.openweathermap.org',
    params: {
      units: 'metric',
      lang: 'en',
      appid: getWeatherApiKey(),
    },
  },
  spotlight: {
    baseURL: 'https://fd.api.iris.microsoft.com/v4/api',
    url: '/selection',
    params: {
      placement: '88000820',
      fmt: 'json',
      locale: 'en-US',
      country: 'vi',
    },
  },
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}

export default async (request: Request) => {
  const methodError = checkMethod(request.method, ['GET', 'POST', 'PUT', 'DELETE'])
  if (methodError) {
    return methodError
  }

  try {
    const url = new URL(request.url)
    const path = url.pathname
    const target = getDetailParam(path, 'proxy')

    if (!target) {
      return createErrorResponse(`Missing target in path. Use format: /api/proxy/{target}`, 400)
    }

    const incomingHeaders = request.headers || {}
    const rawQuery = url.searchParams || {}

    const targetHeaders: Record<string, string> = { ...DEFAULT_HEADERS }

    const config = SERVICES[target as keyof typeof SERVICES] as AxiosRequestConfig | undefined
    if (!config) {
      return createErrorResponse(`Unknown target "${target}"`, 400)
    }

    const mergedQuery = { ...config.params }
    rawQuery.forEach((value, key) => {
      mergedQuery[key] = value
    })
    const queryParams = new URLSearchParams(mergedQuery)

    let requestUrl = config.url || ''
    if (rawQuery.has('path')) {
      const pathValue = rawQuery.get('path') || ''
      requestUrl = pathValue.startsWith('/') ? pathValue : `/${pathValue}`
      queryParams.delete('path')
    }

    const forwardHeaders: Record<string, string> = {}
    Object.entries(incomingHeaders).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase()
      if (lowerKey !== 'host' && lowerKey !== 'content-length' && typeof value === 'string') {
        forwardHeaders[key] = value
      }
    })

    const axiosConfig = {
      method: request.method,
      baseURL: config.baseURL,
      url: requestUrl,
      params: Object.fromEntries(queryParams),
      headers: { ...targetHeaders, ...forwardHeaders },
      data: request.body && request.method !== 'GET' ? request.body : undefined,
      responseType: 'text' as const,
    }

    const response = await axios(axiosConfig)

    const headers = new Headers()
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value) {
        headers.append(key, String(value))
      }
    })

    return new Response(response.data, {
      status: response.status,
      headers,
    })
  } catch (error: unknown) {
    logError(error)
    return createErrorResponse()
  }
}
