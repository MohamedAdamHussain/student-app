import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { mockVerifyEmail, mockResendVerification } from '@/lib/mockData'
import { useAuth } from '@/context/AuthContext'
import { extractApiMessage } from '@/lib/errors'
import { toast } from 'sonner'

// =====================================================
// ✨ B6: VerifyEmailPage — صفحة تأكيد البريد الإلكتروني
// =====================================================
//
// سيناريوهات الاستخدام:
//
// 1) من رابط الإيميل: `/verify-email?token=xxx&email=yyy`
//    → المحتوى مكتمل → نُحاول التحقق تلقائياً عند mount.
//    → لو نجح: شاشة نجاح + زر للـ dashboard.
//    → لو فشل: نموذج لإعادة الإدخال يدوياً.
//
// 2) يدوي (من Settings أو رابط مباشر): `/verify-email`
//    → لا يوجد token/email في الـ URL → نعرض النموذج فوراً.
//
// 3) إعادة إرسال الرمز:
//    → إن كان المستخدم مسجّلاً دخول، زر "إعادة إرسال" يستدعي
//      POST /auth/resend-verification (يتطلب auth).
//    → لو غير مسجّل، نوجّه لتسجيل الدخول أولاً.
//
// الـ backend لا يحجب الوصول لغير المُتحقَّق — هذه الصفحة تذكيرية فقط.

type Status = 'idle' | 'verifying' | 'success' | 'error' | 'manual'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, invalidateUser } = useAuth()

  const urlToken = searchParams.get('token') ?? ''
  const urlEmail = searchParams.get('email') ?? ''

  const [status, setStatus] = useState<Status>(urlToken && urlEmail ? 'verifying' : 'manual')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // حقول الإدخال اليدوي
  const [email, setEmail] = useState(urlEmail || user?.email || '')
  const [token, setToken] = useState(urlToken)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  // ── محاولة التحقق التلقائي عند القدوم من رابط الإيميل ──
  useEffect(() => {
    if (!urlToken || !urlEmail) return
    let cancelled = false

    const autoVerify = async () => {
      try {
        await mockVerifyEmail({ token: urlToken, email: urlEmail })
        if (cancelled) return
        setStatus('success')
        // ✨ تحديث حالة المستخدم في الـ AuthContext (إن كان مسجّلاً)
        invalidateUser()
        toast.success('تم تأكيد بريدك الإلكتروني ✓')
      } catch (err: unknown) {
        if (cancelled) return
        const msg = extractApiMessage(err, 'رمز غير صالح أو منتهي الصلاحية')
        setErrorMessage(msg)
        setStatus('error')
        // نسمح بإعادة المحاولة يدوياً
        setToken('')
      }
    }

    autoVerify()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken, urlEmail])

  // ── إرسال يدوي للنموذج ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !token) {
      toast.error('يرجى إدخال البريد الإلكتروني والرمز')
      return
    }

    setLoading(true)
    setErrorMessage(null)
    try {
      await mockVerifyEmail({ token, email })
      setStatus('success')
      invalidateUser()
      toast.success('تم تأكيد بريدك الإلكتروني ✓')
    } catch (err: unknown) {
      const msg = extractApiMessage(err, 'رمز غير صالح أو منتهي الصلاحية')
      setErrorMessage(msg)
      // لا نغيّر status — نبقى في manual ليُعيد المستخدم المحاولة
    } finally {
      setLoading(false)
    }
  }

  // ── إعادة إرسال الرمز (يتطلب auth) ──
  const handleResend = async () => {
    if (!user) {
      toast.info('سجّل دخولك أولاً لإعادة إرسال الرمز')
      navigate('/login')
      return
    }

    setResending(true)
    try {
      await mockResendVerification()
      toast.success('تمت إعادة إرسال رمز التحقق إلى بريدك')
    } catch (err: unknown) {
      toast.error(extractApiMessage(err, 'تعذّر إعادة الإرسال. حاول لاحقاً.'))
    } finally {
      setResending(false)
    }
  }

  // ── شاشة التحقق التلقائي (جاري...) ──
  if (status === 'verifying') {
    return (
      <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950 p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-8 flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl p-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-50 dark:bg-brand-900/20 grid place-items-center">
              <span className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100 mb-2">
              جاري تأكيد بريدك...
            </h2>
            <p className="text-sm text-ink-500">
              يرجى الانتظار بينما نتحقق من الرمز.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── شاشة النجاح ──
  if (status === 'success') {
    return (
      <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-soft grid place-items-center">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100 mb-2">
              تم تأكيد بريدك الإلكتروني
            </h2>
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-6 leading-relaxed">
              رائع! تم تفعيل حسابك بالكامل. يمكنك الآن الاستمتاع بكل ميزات GradShow.
            </p>
            <Button block size="lg" onClick={() => navigate('/dashboard')}>
              الذهاب للوحة التحكم
              <ArrowLeft size={16} />
            </Button>
          </div>
          <p className="text-center text-xs text-ink-400 mt-6">
            <Link to="/dashboard" className="hover:text-brand-500">تخطي والذهاب للوحة التحكم</Link>
          </p>
        </motion.div>
      </div>
    )
  }

  // ── شاشة الخطأ + النموذج اليدوي ──
  // (status === 'error' أو 'manual' أو 'idle')
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
            تأكيد البريد الإلكتروني
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
            أدخل البريد الإلكتروني والرمز الذي أرسلناه لتأكيد حسابك.
          </p>

          {/* ✨ تنبيه خطأ من محاولة تلقائية */}
          {status === 'error' && errorMessage && (
            <div className="flex items-start gap-2 p-3 mb-5 bg-danger/10 border border-danger/20 rounded-md text-sm text-danger">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>تعذّر التحقق التلقائي:</strong>
                <br />
                {errorMessage}
                <br />
                <span className="text-xs opacity-80">يمكنك إدخال الرمز يدوياً أدناه أو طلب رمز جديد.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-1">
            <div className="relative">
              <Input
                label="البريد الإلكتروني"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!user} // لو مسجّل دخول، نثبّته على إيميله
              />
              <Mail size={16} className="absolute left-3 top-[38px] text-ink-400 pointer-events-none" />
            </div>

            <Input
              label="رمز التحقق"
              placeholder="الصق الرمز المُرسل في الإيميل"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              hint="رمز طويل من أحرف وأرقام — تجده في رسالة التحقق"
            />

            <Button type="submit" size="lg" block disabled={loading} className="mt-4">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  تأكيد البريد
                  <ArrowLeft size={16} />
                </>
              )}
            </Button>
          </form>

          {/* ✨ إعادة إرسال الرمز */}
          <div className="mt-5 pt-5 border-t border-ink-100 dark:border-ink-800">
            <p className="text-xs text-ink-400 text-center mb-3">
              لم يصلك الرمز؟
            </p>
            <Button
              variant="secondary"
              size="sm"
              block
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-ink-400 border-t-transparent rounded-full animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send size={14} />
                  إعادة إرسال الرمز
                </>
              )}
            </Button>
            {!user && (
              <p className="text-xs text-ink-400 text-center mt-2">
                يجب{' '}
                <Link to="/login" className="text-brand-500 hover:underline">
                  تسجيل الدخول
                </Link>{' '}
                أولاً لإعادة الإرسال.
              </p>
            )}
          </div>

          {/* ✨ ملاحظة للتطوير المحلي */}
          <div className="mt-5 bg-info-soft border border-info-border rounded-md p-3 text-xs text-info flex items-start gap-2 text-right">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>للتطوير المحلي:</strong> ابحث في{' '}
              <code dir="ltr">storage/logs/laravel.log</code>{' '}
              عن رابط التحقق (لأن الإعداد البريدي قد لا يكون مفعّلاً).
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-ink-400 mt-6">
          <Link to="/login" className="hover:text-brand-500">العودة لتسجيل الدخول</Link>
          {' · '}
          <Link to="/dashboard" className="hover:text-brand-500">لوحة التحكم</Link>
        </p>
      </motion.div>
    </div>
  )
}
