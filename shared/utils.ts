// Tệp chứa các hàm Utils bổ trợ chung cho dự án
import axios from 'axios'
import type { ApiError } from './types'

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function handleApiCall<T>(promise: Promise<T>): Promise<{ data?: T; error?: ApiError }> {
  try {
    const response = await promise
    return { data: response }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        error: {
          success: false,
          message: error.response?.data?.message || error.message,
        },
      }
    }
    return {
      error: {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      },
    }
  }
}
