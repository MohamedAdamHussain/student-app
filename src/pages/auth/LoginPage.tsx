import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowLeft, Mail, Lock } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('ahmed.ali@student.com')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ email, password })
      toast.success('مرحباً بعودتك! 👋')
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Login error details:', err)

      //✨ رسالة خطأ ذكية حسب نوع المشكلة
      let message = 'بيانات غير صحيحة. حاول مرة أخرى.'

      if (err?.response) {
        // Laravel response
        const status = err.response.status
        const laravelMessage = err.response.data?.message

        if (status === 401) {
          message = laravelMessage ?? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        } else if (status === 422) {
          message = laravelMessage ?? 'بيانات غير صالحة'
        } else if (status === 419) {
          message = 'انتهت صلاحية الجلسة. حدّث الصفحة وحاول مرة أخرى'
        } else if (status >= 500) {
          message = 'خطأ في الخادم. تأكد أن Laravel يعمل'
        } else {
          message = laravelMessage ?? message
        }
      } else if (err?.request) {
        // Request was made but no response (CORS / Network)
        message = 'تعذّر الاتصال بالخادم. تحقق من أن Laravel يعمل على ' + (import.meta.env.VITE_API_URL ?? '/api')
        console.error('Network/CORS error. Check:', {
          apiUrl: import.meta.env.VITE_API_URL,
          useMock: import.meta.env.VITE_USE_MOCK,
          error: err.message,
        })
      } else {
        message = err?.message ?? message
      }

      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Visual aside */}
      <aside className="relative hidden md:flex flex-col justify-between p-16 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
        <div className="absolute -top-20 -left-10 w-[60%] h-[60%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)' }} />
        <div className="absolute -bottom-10 -right-10 w-[50%] h-[50%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <Logo variant="light" size="lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 max-w-md"
        >
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            أظهر ما بنيته.<br />وُظّف على عملك.
          </h1>
          <p className="text-base leading-relaxed opacity-90 mb-10">
            منصة GradShow تربط خرّيجي 90Soft بالشركات عبر ملف شخصي غني يبرز مهاراتك وأعمالك الحقيقية — لا مجرد سيرة ذاتية.
          </p>

          <div className="flex flex-col gap-4">
            {[
              'ملف شخصي احترافي يبرز مشروعك المميز',
              'تقديمات مرنة: GitHub، Live URL، ملف، فيديو',
              'تقييم مهارات حقيقي من مدربين محترفين',
            ].map((feat, i) => (
              <motion.div
                key={feat}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm grid place-items-center flex-shrink-0">
                  <CheckCircle2 size={16} className="text-white" />
                </div>
                <span className="text-sm">{feat}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 border-r-2 border-white/30 pr-4 text-sm italic opacity-90 leading-relaxed"
        >
          "الدرجات وحدها لا توظف أحداً. القصة هي التي توظف."
        </motion.blockquote>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center p-8 md:p-10 bg-ink-50 dark:bg-ink-950">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="md:hidden mb-8">
            <Logo />
          </div>

          <div className="text-xs text-ink-400 mb-4 flex items-center gap-1">
            <Link to="/" className="hover:text-brand-500">الرئيسية</Link>
            <span>/</span>
            <span>تسجيل الدخول</span>
          </div>

          <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-100 mb-1.5">
            أهلاً بعودتك 👋
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-8">
            سجّل دخولك للوصول إلى لوحة تحكم الطالب
          </p>

          <form onSubmit={handleSubmit} className="space-y-1">
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                label="البريد الإلكتروني"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={16} className="absolute left-3 top-[38px] text-ink-400 pointer-events-none" />
            </div>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type="password"
                label="كلمة المرور"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} className="absolute left-3 top-[38px] text-ink-400 pointer-events-none" />
            </div>

            <div className="flex items-center justify-between mb-5 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-brand-500 rounded border-ink-300"
                />
                <span className="text-sm text-ink-500">إبقائي مسجّلاً</span>
              </label>
              <a href="#" className="text-sm text-brand-500 font-medium">
                نسيت كلمة المرور؟
              </a>
            </div>

            <Button type="submit" size="lg" block disabled={loading}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                <>
                  تسجيل الدخول
                  <ArrowLeft size={16} />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-6">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="text-brand-500 font-semibold hover:underline">
              أنشئ حساباً جديداً
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
