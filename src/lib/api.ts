import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

// In production this would be Laravel backend URL
// ✨ FIX: استخدم relative '/api' ليشتغل عبر Vite proxy في التطوير
// (بدون proxy ستحتاج VITE_API_URL=http://localhost:8000/api)
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// ✨ FIX #1: قاعدة روابط الـ assets (avatars, CVs, submission files)
// الـ backend يُرجِع روابط نسبية مثل '/storage/avatars/x.jpg' عبر Storage::url().
// في التطوير مع Vite proxy → نُبقيها نسبية (الـ proxy يوجّهها للـ backend).
// في الإنتاج → اضبط VITE_STORAGE_URL=https://api.example.com
const STORAGE_BASE = import.meta.env.VITE_STORAGE_URL ?? ''

export const api = axios.create({
  baseURL: API_BASE_URL,
  // ✨ FIX #6: لا نحتاج withCredentials — نستخدم Bearer Token (وليس cookie auth)
  // إزالته تقلّل preflight CORS requests بلا داعٍ
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * ✨ FIX #1: تحويل رابط نسبي للـ asset (avatar, CV, submission file)
 * لرابط قابل للتحميل في المتصفح.
 *
 * - null/undefined → null
 * - 'http(s)://...' → كما هو
 * - '/storage/...' → prepend STORAGE_BASE (لو محدّد في الإنتاج)
 * - 'storage/...' → prepend STORAGE_BASE + '/'
 * - 'cvs/x.pdf' (raw path) → prepend STORAGE_BASE + '/storage/'
 */
export function assetUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/storage/')) return `${STORAGE_BASE}${path}`
  if (path.startsWith('storage/')) return `${STORAGE_BASE}/${path}`
  // raw path بدون /storage/ prefix
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

/**
 * ✨ Stage 7: استخراج data + meta من استجابة Laravel paginate
 * للقوائم التي تحتاج pagination controls
 */
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
  // ✨ array مباشرة (من Skill::all() مثلاً) — نُحوّل لـ paginate شكل
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

  // ✨ شكل Laravel paginate {data: [], meta: {...}}
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
