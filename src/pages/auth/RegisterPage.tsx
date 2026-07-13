import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowLeft, User, Mail, Lock, GraduationCap, Info } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { extractApiMessage } from '@/lib/errors'
import { toast } from 'sonner'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    agree: false,
  })
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password !== form.passwordConfirmation) {
      toast.error('كلمتا المرور غير متطابقتين')
      return
    }
    if (!form.agree) {
      toast.error('يجب الموافقة على الشروط')
      return
    }
    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        passwordConfirmation: form.passwordConfirmation,
        role: 'student',
        // batch_id لم يعد مطلوباً — Laravel يخصصه تلقائياً
      })
      // ✨ B6: التسجيل يُرسل إيميل تحقق تلقائياً. نوجّه الطالب لصفحة
      // VerifyEmailPage حيث يمكنه إدخال الرمز يدوياً أو إعادة الإرسال.
      // (لو ضغط على رابط الإيميل، سيذهب لنفس الصفحة بـ token في الـ URL.)
      toast.success('تم إنشاء حسابك! تحقق من بريدك لتأكيد الحساب 📧')
      navigate('/verify-email')
    } catch (err: unknown) {
      toast.error(extractApiMessage(err, 'حدث خطأ. حاول مرة أخرى.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <aside
        className="relative hidden md:flex flex-col justify-between p-16 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
      >
        <div className="absolute -top-20 -left-10 w-[60%] h-[60%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)' }} />
        <div className="absolute -bottom-10 -right-10 w-[50%] h-[50%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <Logo variant="light" size="lg" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 max-w-md"
        >
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            ابدأ رحلتك<br />نحو أول وظيفة.
          </h1>
          <p className="text-base leading-relaxed opacity-90 mb-10">
            أنشئ حسابك في دقائق، ارفع أعمالك، ودع الشركات ترى ما يمكنك بناءه فعلاً.
          </p>

          <div className="flex flex-col gap-4">
            {[
              'إعداد مجاني خلال 3 دقائق',
              'ملف شخصي يُنشأ تلقائياً عند التسجيل',
              'وصول لكل مهام وهاكاثونات دفعتك',
            ].map((feat, i) => (
              <motion.div
                key={feat}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm grid place-items-center flex-shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-sm">{feat}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <blockquote className="relative z-10 border-r-2 border-white/30 pr-4 text-sm italic opacity-90 leading-relaxed">
          "المهارة التي مارستها ليست كيفية استخدام الذكاء الاصطناعي — بل كيفية التفكير في منتج ما قبل بناءه."
        </blockquote>
      </aside>

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
            <span>إنشاء حساب</span>
          </div>

          <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-100 mb-1.5 flex items-center gap-2">
            <GraduationCap size={24} className="text-brand-500" />
            إنشاء حساب طالب
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-8">
            املأ البيانات التالية. سيُنشأ ملف شخصي فارغ تلقائياً.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Input
                label="الاسم الكامل"
                placeholder="مثال: أحمد علي محمد"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
              <User size={16} className="absolute left-3 top-[38px] text-ink-400" />
            </div>

            <div className="relative">
              <Input
                type="email"
                label="البريد الإلكتروني"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
                hint="سيتم استخدامه لتسجيل الدخول لاحقاً"
              />
              <Mail size={16} className="absolute left-3 top-[38px] text-ink-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  type="password"
                  label="كلمة المرور"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  required
                  hint="8 أحرف على الأقل"
                />
                <Lock size={16} className="absolute left-3 top-[38px] text-ink-400" />
              </div>
              <div className="relative">
                <Input
                  type="password"
                  label="تأكيد كلمة المرور"
                  placeholder="••••••••"
                  value={form.passwordConfirmation}
                  onChange={(e) => set('passwordConfirmation', e.target.value)}
                  required
                />
                <Lock size={16} className="absolute left-3 top-[38px] text-ink-400" />
              </div>
            </div>

            {/* ✨ إزالة حقل batch_id — التخصيص تلقائي */}
            <div className="flex items-start gap-3 p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-md mb-5">
              <Info size={18} className="text-brand-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-ink-700 dark:text-ink-200">
                <strong className="text-brand-600 dark:text-brand-300">سيتم إضافتك تلقائياً</strong>{' '}
                للدفعة النشطة الحالية. لا داعي لاختيار دفعة — يتولى المسؤول تنظيم ذلك.
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => set('agree', e.target.checked)}
                className="w-4 h-4 mt-0.5 text-brand-500 rounded border-ink-300"
              />
              <span className="text-sm text-ink-500">
                أوافق على{' '}
                <a href="#" className="text-brand-500">شروط الاستخدام</a>
                {' '}و{' '}
                <a href="#" className="text-brand-500">سياسة الخصوصية</a>
              </span>
            </label>

            <Button type="submit" size="lg" block disabled={loading}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  إنشاء الحساب
                  <ArrowLeft size={16} />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-6">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-brand-500 font-semibold hover:underline">
              سجّل دخولك
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
