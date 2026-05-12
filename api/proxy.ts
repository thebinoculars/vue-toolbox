import axios, { AxiosRequestConfig } from 'axios'
import { URLSearchParams } from 'url'

import { getGoogleTranslateApiKey, getWeatherApiKey } from '../shared/utils'
import {
  createErrorResponse,
  createHandler,
  getDetailParam,
  methodMiddleware,
  sameOriginMiddleware,
} from './_lib/http'

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
  translate: {
    baseURL: 'https://translation.googleapis.com',
    url: '/language/translate/v2',
    params: {
      key: getGoogleTranslateApiKey(),
    },
  },
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}

const handler = createHandler({
  middlewares: [sameOriginMiddleware(), methodMiddleware(['GET', 'POST', 'PUT', 'DELETE'])],
})

export default handler(async (request: Request) => {
  const url = new URL(request.url)
  const path = url.pathname
  const target = getDetailParam(path, 'proxy')

  if (!target) {
    return createErrorResponse(`Missing target in path. Use format: /api/proxy/{target}`, 400)
  }

  const incomingHeaders = request.headers || {}
  const rawQuery = url.searchParams || {}

  const config = SERVICES[target as keyof typeof SERVICES] as
    | (AxiosRequestConfig & {
        transformRequest?: (config: AxiosRequestConfig) => AxiosRequestConfig
        transformResponse?: (response: { data: any; status: number; headers: any }) => {
          data: any
          status: number
          headers: any
        }
      })
    | undefined
  if (!config) {
    return createErrorResponse(`Unknown target "${target}"`, 400)
  }

  const mergedQuery = { ...config.params }
  rawQuery.forEach((value, key) => {
    mergedQuery[key] = value
  })
  const queryParams = new URLSearchParams(mergedQuery)

  let requestUrl = config.url || ''
  let baseURL = config.baseURL || ''

  if (rawQuery.has('path')) {
    const pathValue = rawQuery.get('path') || ''
    requestUrl = pathValue.startsWith('/') ? pathValue : `/${pathValue}`
    queryParams.delete('path')
  }

  let requestData: any = undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        requestData = await request.json()
      } else {
        requestData = await request.text()
      }
    } catch (e) {}
  }

  const axiosConfig: AxiosRequestConfig = {
    method: request.method,
    baseURL,
    url: requestUrl,
    params: Object.fromEntries(queryParams),
    headers: { ...DEFAULT_HEADERS },
    data: requestData,
    responseType: 'text' as const,
  }

  const finalConfig = config.transformRequest ? config.transformRequest(axiosConfig) : axiosConfig

  const forwardHeaders: Record<string, string> = {}
  Object.entries(incomingHeaders).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase()
    if (lowerKey !== 'host' && lowerKey !== 'content-length' && typeof value === 'string') {
      forwardHeaders[key] = value
    }
  })

  finalConfig.headers = { ...DEFAULT_HEADERS, ...forwardHeaders }

  const response = await axios(finalConfig)

  let responseData = response.data
  let responseStatus = response.status
  let responseHeaders: Record<string, string> = {}

  if (config.transformResponse) {
    const transformed = config.transformResponse({
      data: response.data,
      status: response.status,
      headers: response.headers,
    })
    responseData = transformed.data
    responseStatus = transformed.status
    responseHeaders = transformed.headers as Record<string, string>
  } else {
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value) {
        responseHeaders[key] = String(value)
      }
    })
  }

  return new Response(responseData, {
    status: responseStatus,
    headers: responseHeaders,
  })
})
