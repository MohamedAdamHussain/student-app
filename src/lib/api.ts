import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

// In production this would be Laravel backend URL
// ✨ FIX: استخدم relative '/api' ليشتغل عبر Vite proxy في التطوير
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// ✨ FIX #1: قاعدة روابط الـ assets (avatars, CVs, submission files)
const STORAGE_BASE = import.meta.env.VITE_STORAGE_URL ?? ''

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * ✨ FIX #1: تحويل رابط نسبي للـ asset لرابط قابل للتحميل في المتصفح.
 */
export function assetUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/storage/')) return `${STORAGE_BASE}${path}`
  if (path.startsWith('storage/')) return `${STORAGE_BASE}/${path}`
  return `${STORAGE_BASE}/storage/${path}`
}

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

// =====================================================
// ✨ P0-B PATCH: 401 handling عبر event بدلاً من window.location
// =====================================================
// المشكلة السابقة: أي 401 (حتى من refetch صامت) كان يعيد تحميل التطبيق
// بالكامل (window.location.href = '/login'). هذا يفقد الـ React Query cache
// + أي إدخال غير محفوظ في النماذج.
//
// الحل: نُطلق CustomEvent 'auth:unauthorized'، ويستمع له AuthContext
// ويضبط state محلي لـ force-redirect عبر React Router (لا reload).
// النموذج يبقى في الذاكرة، ولو عاد المستخدم بعد login، يرى ما كان يكتبه.

const AUTH_UNAUTHORIZED_EVENT = 'gradshow:auth-unauthorized'

ResponseInterceptorSetup: {
  // لا شيء — مجرد label للتوثيق
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const status = error.response?.status

    // ✨ 401 Unauthorized → أطلِق event بدل window.location.href
    // الـ AuthContext يستمع له ويوجّه عبر React Router (لا reload).
    if (status === 401) {
      localStorage.removeItem('gradshow_token')
      // ✨ P0-C: لا نحذف gradshow_user من هنا — AuthContext يتكفّل بتنظيف الـ state
      // (لو حذفناه هنا + استمعنا له في AuthContext، نتجنب race conditions)
      // نطلق event واحد فقط لكل 401 (لا نطلق لو كنا في /login لتجنب loop)
      if (!window.location.pathname.startsWith('/login')) {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
      }
    }

    // ✨ 403 Forbidden → toast فقط (الصفحة تعالج الخطأ محلياً)
    if (status === 403) {
      const msg = error.response?.data?.message ?? 'غير مصرح'
      console.warn('🔒 403 Forbidden:', msg)
      // لا redirect هنا — الصفحة تعرض رسالة مناسبة بناءً على الحالة
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
      ;(error as any).validationErrors = validationErrors
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

// تصدير اسم الـ event ليستخدمه AuthContext
export { AUTH_UNAUTHORIZED_EVENT }

// =====================================================
// Helpers for Laravel pagination responses
// =====================================================

export function extractPaginatedData<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data: T[] | T }).data
    return Array.isArray(data) ? data : []
  }
  return []
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export function extractPaginated<T>(response: unknown): PaginatedResponse<T> {
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: response.length,
        total: response.length,
        from: response.length > 0 ? 1 : null,
        to: response.length > 0 ? response.length : null,
      },
    }
  }

  if (response && typeof response === 'object' && 'data' in response) {
    const obj = response as { data: T[]; meta?: PaginationMeta }
    return {
      data: Array.isArray(obj.data) ? obj.data : [],
      meta: obj.meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        from: null,
        to: null,
      },
    }
  }

  return {
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 20, total: 0, from: null, to: null },
  }
}
