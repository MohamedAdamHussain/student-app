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
    const status = error.response?.status

    // ✨ 401 Unauthorized → logout & redirect to login
    if (status === 401) {
      localStorage.removeItem('gradshow_token')
      localStorage.removeItem('gradshow_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    // ✨ 403 Forbidden → redirect to unauthorized page
    // (لو الطالب حاول يفتح endpoint خاص بالأدمن أو العكس)
    if (status === 403) {
      const currentPath = window.location.pathname
      // لا نُعيد التوجيه لو كنا بالفعل في صفحة unauthorized
      if (!currentPath.startsWith('/unauthorized')) {
        // نُمرر رسالة الخطأ للمستخدم قبل التوجيه
        const msg = error.response?.data?.message ?? 'غير مصرح'
        console.warn('🔒 403 Forbidden:', msg)

        // ✨ معالجة ذكية: لو طالب حاول يفتح admin endpoint
        // نوجهه لصفحة unauthorized بدلاً من تركه في صفحة فارغة
        if (currentPath.startsWith('/admin')) {
          window.location.href = '/unauthorized'
        }
        // لو في صفحة student و حصل 403 (مثلاً يفتح submission لطالب آخر)
        // نعرض toast فقط (الصفحة نفسها يجب أن تعالج الخطأ)
      }
    }

    // ✨ 419 CSRF → رسالة واضحة
    if (status === 419) {
      error.message = 'انتهت صلاحية الجلسة. حدّث الصفحة وحاول مرة أخرى'
    }

    // ✨ 500+ Server Error → رسالة واضحة
    if (status && status >= 500) {
      console.error('🚨 Server Error:', status, error.response?.data)
      error.message = 'خطأ في الخادم. يرجى المحاولة لاحقاً'
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

    // ✨ Network Error (no response — CORS or server down)
    if (!error.response && error.request) {
      error.message = 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت'
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
