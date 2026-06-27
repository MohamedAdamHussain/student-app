import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

// In production this would be Laravel backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor: attach Sanctum token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('gradshow_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor: handle auth errors + extract Laravel error messages
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    // 401 → logout & redirect
    if (error.response?.status === 401) {
      localStorage.removeItem('gradshow_token')
      localStorage.removeItem('gradshow_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    // Enhance error with Laravel message if available
    const laravelMessage = error.response?.data?.message
    const validationErrors = error.response?.data?.errors

    if (laravelMessage) {
      error.message = laravelMessage
    }

    // Attach validation errors for forms to use
    if (validationErrors) {
      (error as any).validationErrors = validationErrors
      // First validation error as main message
      const firstError = Object.values(validationErrors)[0]?.[0]
      if (firstError) {
        error.message = firstError
      }
    }

    return Promise.reject(error)
  },
)

// =====================================================
// Helpers for Laravel pagination responses
// =====================================================

/**
 * Laravel paginate returns: { data: [], links: {}, meta: { current_page, ... } }
 * This helper extracts just the data array.
 */
export function extractPaginatedData<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data: T[] | T }).data
    return Array.isArray(data) ? data : []
  }
  return []
}
