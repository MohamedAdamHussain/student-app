import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { mockForgotPassword } from '@/lib/mockData'
import { toast } from 'sonner'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('يرجى إدخال البريد الإلكتروني')
      return
    }
    setLoading(true)
    try {
      // ✨ P1-5: استخدم Facade (يعمل في mock + real API)
      await mockForgotPassword(email)
      setSent(true)
      toast.success('تم إرسال رابط إعادة التعيين (إذا كان البريد مسجّلاً)')
    } catch (err: unknown) {
      // ✨ حتى في الخطأ، نعرض رسالة النجاح لمنع enumeration
      setSent(true)
      console.error('Forgot password error:', err)
    } finally {
      setLoading(false)
    }
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
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 mb-2">
                نسيت كلمة المرور؟
              </h1>
              <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
              </p>

              <form onSubmit={handleSubmit} className="space-y-1">
                <div className="relative">
                  <Input
                    label="البريد الإلكتروني"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} className="absolute left-3 top-[38px] text-ink-400 pointer-events-none" />
                </div>

                <Button type="submit" size="lg" block disabled={loading} className="mt-4">
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      إرسال الرابط
                      <ArrowLeft size={16} />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-ink-500 mt-6">
                تذكرت كلمة المرور؟{' '}
                <Link to="/login" className="text-brand-500 font-semibold hover:underline">
                  العودة لتسجيل الدخول
                </Link>
              </p>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-soft grid place-items-center">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <h2 className="text-xl font-bold text-ink-900 dark:text-ink-100 mb-2">
                تحقق من بريدك الإلكتروني
              </h2>
              <p className="text-sm text-ink-500 dark:text-ink-400 mb-6 leading-relaxed">
                إذا كان <strong className="text-ink-700 dark:text-ink-300">{email}</strong> مسجّلاً
                لدينا، ستصلك رسالة مع رابط إعادة تعيين كلمة المرور خلال دقائق.
              </p>
              <div className="bg-info-soft border border-info-border rounded-md p-3 mb-6 text-xs text-info flex items-start gap-2 text-right">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <strong>للتطوير المحلي:</strong> ابحث في <code dir="ltr">storage/logs/laravel.log</code>
                  عن الـ token وعنوان URL لإعادة التعيين (لأن الإعداد البريدي غير مفعّل).
                </div>
              </div>
              <Button variant="secondary" size="sm" block onClick={() => navigate('/login')}>
                العودة لتسجيل الدخول
              </Button>
            </motion.div>
          )}
        </div>

        <p className="text-center text-xs text-ink-400 mt-6">
          <Link to="/" className="hover:text-brand-500">العودة للرئيسية</Link>
        </p>
      </motion.div>
    </div>
  )
}
