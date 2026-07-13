import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { mockResetPassword } from '@/lib/mockData'
import { extractApiMessage, extractValidationErrors } from '@/lib/errors'
import { toast } from 'sonner'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reset, setReset] = useState(false)

  // ✨ إذا لم يكن هناك token أو email، اعرض خطأ
  if (!token || !email) {
    return (
      <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100 mb-2">رابط غير صالح</h2>
          <p className="text-sm text-ink-500 mb-6">
            الرابط الذي اتبعته غير مكتمل أو منتهي الصلاحية.
          </p>
          <Link to="/forgot-password">
            <Button variant="secondary" size="sm">طلب رابط جديد</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password || !passwordConfirmation) {
      toast.error('يرجى ملء جميع الحقول')
      return
    }
    if (password.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    if (password !== passwordConfirmation) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }

    setLoading(true)
    try {
      // ✨ P1-5: استخدم Facade (يعمل في mock + real API)
      await mockResetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      setReset(true)
      toast.success('تم تغيير كلمة المرور بنجاح ✓')
    } catch (err: unknown) {
      const validationErrors = extractValidationErrors(err)
      if (validationErrors) {
        const firstErr = Object.values(validationErrors)[0]?.[0]
        toast.error(firstErr ?? extractApiMessage(err, 'حدث خطأ'))
      } else {
        toast.error(extractApiMessage(err, 'الرمز غير صالح أو منتهي الصلاحية'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (reset) {
    return (
      <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-soft grid place-items-center">
            <CheckCircle2 size={32} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100 mb-2">
            تم تغيير كلمة المرور
          </h2>
          <p className="text-sm text-ink-500 mb-6">
            يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
          </p>
          <Button block onClick={() => navigate('/login')}>تسجيل الدخول</Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 mb-2">
            تعيين كلمة مرور جديدة
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
            أدخل كلمة المرور الجديدة لحسابك.
          </p>

          <form onSubmit={handleSubmit} className="space-y-1">
            <div className="relative">
              <Input
                label="كلمة المرور الجديدة"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                hint="8 أحرف على الأقل"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute left-3 top-[38px] text-ink-400 hover:text-ink-600"
                aria-label={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Input
              label="تأكيد كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" size="lg" block disabled={loading} className="mt-4">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  تعيين كلمة المرور
                  <ArrowLeft size={16} />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-400 mt-6">
          <Link to="/login" className="hover:text-brand-500">العودة لتسجيل الدخول</Link>
        </p>
      </motion.div>
    </div>
  )
}
