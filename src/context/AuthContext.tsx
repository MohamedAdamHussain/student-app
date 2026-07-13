import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { User, LoginCredentials, RegisterData } from '@/types'
import { mockLogin, mockRegister, mockGetMe } from '@/lib/mockData'
import { api } from '@/lib/api'

// =====================================================
// AuthContext — مصدر واحد للحقيقة عبر TanStack Query
// =====================================================
// قبل هذا: كان user يُخزّن في useState + localStorage يدوياً، وعمليات
// تحديث الصورة مثلاً تضطر لتعديل localStorage يدوياً + window.dispatchEvent
// لإجبار إعادة العرض. الآن: user يأتي من useQuery (queryKey: ['auth']).
//
// - localStorage يحتفظ بـ token فقط (+ نسخة user للعرض الفوري قبل التحقق).
// - أي تعديل للـ user (صورة/بيانات) يُبلَغ عبر invalidateUser() → إعادة جلب /auth/me.
// - isLoading: يحمي التوجيه حتى يتأكد أن الـ token صالح.

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

const TOKEN_KEY = 'gradshow_token'
const USER_KEY = 'gradshow_user' // نسخة احتياطية للعرض الفوري فقط (غير مُعتمد عليها)

export const AUTH_QUERY_KEY = ['auth'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  )
  // عرض فوري للـ user المحفوظ قبل اكتمال التحقق (يمنع وميض "غير مسجّل")
  const [seedUser, setSeedUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY)
    try {
      return stored ? (JSON.parse(stored) as User) : null
    } catch {
      return null
    }
  })

  // ✨ مصدر الحقيقة للـ user عبر /auth/me. يُفعّل فقط عند وجود token.
  const { data: user } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: mockGetMe,
    enabled: !!token,
    // لا نُعيد المحاولة عند 401 (الـ interceptor يمسح الجلسة محلياً)
    retry: false,
    staleTime: 60 * 1000,
    initialData: () => (token ? seedUser : null),
  })

  // ✨ isLoading صحيح فقط أثناء التحقق المبدئي للجلسة (وليس أثناء refetch صامت)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  useEffect(() => {
    // لو لا يوجد token → لا تحقق مطلوب
    if (!token) {
      setInitialCheckDone(true)
      return
    }
    // إعادة جلب تلقائي عند التحميل (يستخدم initialData للعرض الفوري)
    queryClient
      .refetchQueries({ queryKey: AUTH_QUERY_KEY })
      .catch(() => {
        // 401 → interceptor يُنظّف، أو نُنظّف هنا كذلك
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
      })
      .finally(() => setInitialCheckDone(true))
  }, [token, queryClient])

  // حفظ نسخة احتياطية من آخر user معروف (للعرض الفوري في الجلسة التالية)
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  }, [user])

  const login = useCallback(async (creds: LoginCredentials) => {
    const { user: u, token: t } = await mockLogin(creds.email, creds.password)
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setSeedUser(u)
    setToken(t)
    // اعرض الـ user فوراً قبل إعادة الجلب
    queryClient.setQueryData(AUTH_QUERY_KEY, u)
  }, [queryClient])

  const register = useCallback(async (data: RegisterData) => {
    const { user: u, token: t } = await mockRegister(data)
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setSeedUser(u)
    setToken(t)
    queryClient.setQueryData(AUTH_QUERY_KEY, u)
  }, [queryClient])

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
    localStorage.removeItem(USER_KEY)
    queryClient.setQueryData(AUTH_QUERY_KEY, null)
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY })
    setSeedUser(null)
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
        // isLoading يحجب التوجيه فقط حتى نتحقق من الـ token مبدئياً
        // (لا يحجب أثناء refetch صامت لاحقاً — المستخدم يرى بياناته بالفعل)
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
