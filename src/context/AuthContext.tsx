import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { User, LoginCredentials, RegisterData } from '@/types'
import { mockLogin, mockRegister, mockGetMe } from '@/lib/mockData'
import { api, AUTH_UNAUTHORIZED_EVENT } from '@/lib/api'

// =====================================================
// AuthContext — مصدر واحد للحقيقة عبر TanStack Query
// =====================================================
//
// ✨ P0-C PATCH: إزالة USER_KEY من localStorage.
// قبل: كان يُخزّن نسخة من الـ user في localStorage للعرض الفوري قبل
// التحقق. المشكلة: لو عطّل الأدمن الحساب بين الجلستين، يرى الطالب UI
// كاملاً لثانية ثم يُطرد. لو غيّر صورته من جهاز آخر، يرى القديمة فوراً.
// الآن: نعرض null (شاشة تحميل) حتى يُكمل /auth/me. أبطأ بـ 200ms لكنه صحيح.
//
// ✨ P0-B PATCH: استماع لـ event 'auth:unauthorized' من الـ interceptor.
// بدل window.location.reload، نستخدم navigate من React Router.

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (creds: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  /** أعد جلب الـ user الحالي من الخادم (استخدم بعد تعديل الصورة/البيانات). */
  invalidateUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'gradshow_student_token'
// ✨ مفتاح معزول خاص بالطالب — يمنع تعارض الجلسات مع admin-app على نفس الـ origin (5173).
const LEGACY_TOKEN_KEY = 'gradshow_token' // مُهاجَر من نسخ سابقة

// ✨ Migration مرة واحدة: انقل الـ token القديم للمفتاح الجديد (تفادي تسجيل خروج المستخدمين الحاليين).
function migrateTokenKey() {
  const legacy = localStorage.getItem(LEGACY_TOKEN_KEY)
  if (legacy && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, legacy)
  }
  if (legacy) localStorage.removeItem(LEGACY_TOKEN_KEY)
}
migrateTokenKey()

// ✨ P0-C: تم حذف USER_KEY كلياً — لا نُخزّن نسخة من الـ user

export const AUTH_QUERY_KEY = ['auth'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  )
  // ✨ P0-C: لا seedUser — نبدأ بـ null حتى يُكمل /auth/me
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  // ✨ مصدر الحقيقة للـ user عبر /auth/me. يُفعّل فقط عند وجود token.
  const { data: user } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: mockGetMe,
    enabled: !!token,
    retry: false,
    staleTime: 60 * 1000,
  })

  // ✨ إعادة جلب تلقائي عند التحميل (للتحقق من صحة الـ token)
  useEffect(() => {
    if (!token) {
      setInitialCheckDone(true)
      return
    }
    queryClient
      .refetchQueries({ queryKey: AUTH_QUERY_KEY })
      .catch(() => {
        // 401 → الـ interceptor أطلق event؛ ننظّف هنا كذلك
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      })
      .finally(() => setInitialCheckDone(true))
  }, [token, queryClient])

  // ✨ P0-B: استماع لـ event 'auth:unauthorized' من الـ interceptor
  // أي 401 (من refetch صامت أو mutation) → نُنظّف الجلسة + نوجّه لـ /login
  // بدون window.location.reload (نحافظ على SPA + cache + إدخال النماذج).
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(TOKEN_KEY)
      queryClient.setQueryData(AUTH_QUERY_KEY, null)
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY })
      setToken(null)
      // ✨ نوجّه فقط لو لم نكن بالفعل في /login (تجنب loop)
      if (!window.location.pathname.startsWith('/login')) {
        navigate('/login', { replace: true })
      }
    }
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handler)
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handler)
  }, [queryClient, navigate])

  const login = useCallback(
    async (creds: LoginCredentials) => {
      const { user: u, token: t } = await mockLogin(creds.email, creds.password)
      localStorage.setItem(TOKEN_KEY, t)
      setToken(t)
      // ✨ اعرض الـ user فوراً قبل إعادة الجلب
      queryClient.setQueryData(AUTH_QUERY_KEY, u)
    },
    [queryClient],
  )

  const register = useCallback(
    async (data: RegisterData) => {
      const { user: u, token: t } = await mockRegister(data)
      localStorage.setItem(TOKEN_KEY, t)
      setToken(t)
      queryClient.setQueryData(AUTH_QUERY_KEY, u)
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    // ✨ FIX #2: استدعِ POST /auth/logout على الـ backend لإبطال الـ Sanctum token
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (storedToken) {
      try {
        await api.post('/auth/logout')
      } catch {
        // تجاهل — نُنظّف محلياً على أي حال
      }
    }
    localStorage.removeItem(TOKEN_KEY)
    queryClient.setQueryData(AUTH_QUERY_KEY, null)
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY })
    // ✨ نُفرغ كل الـ queries الأخرى (لا نريد بيانات المستخدم السابق)
    queryClient.clear()
    setToken(null)
  }, [queryClient])

  const invalidateUser = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
  }, [queryClient])

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        token,
        isAuthenticated: !!token,
        isLoading: !!token && !initialCheckDone,
        login,
        register,
        logout,
        invalidateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** يُستخدم خارج React tree (نادراً) أو كمكوّن hook خفيف لجلب الـ user فقط. */
export function useCurrentUser() {
  return useAuth().user
}
