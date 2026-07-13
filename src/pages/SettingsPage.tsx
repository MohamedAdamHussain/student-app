import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Save, Lock, Eye, EyeOff, Moon, Sun, Bell, Globe, LogOut, KeyRound, Mail, MailCheck, Send, AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { mockChangePassword, mockResendVerification } from '@/lib/mockData'
import { extractApiMessage, extractValidationErrors } from '@/lib/errors'
import { useConfirm } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, logout, invalidateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const confirm = useConfirm()

  // ✨ change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)

  // ✨ B6: email verification state
  const [resending, setResending] = useState(false)
  const isEmailVerified = !!user?.emailVerifiedAt

  // ✨ preferences (localStorage-backed for now — backend could add user_settings table later)
  const [emailNotifications, setEmailNotifications] = useState(
    localStorage.getItem('gradshow_email_notifications') !== 'false',
  )
  const [arabicLanguage, setArabicLanguage] = useState(true) // ✨ التطبيق عربي فقط حالياً

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword) {
      toast.error('يرجى ملء جميع الحقول')
      return
    }

    if (newPassword.length < 8) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
      return
    }

    if (newPassword !== newPasswordConfirmation) {
      toast.error('كلمتا المرور الجديدتان غير متطابقتين')
      return
    }

    if (newPassword === currentPassword) {
      toast.error('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية')
      return
    }

    setLoading(true)
    try {
      // ✨ P1-5: استخدم Facade (يعمل في mock + real API)
      await mockChangePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPasswordConfirmation,
      })
      toast.success('تم تغيير كلمة المرور بنجاح ✓')
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirmation('')
    } catch (err: unknown) {
      // ✨ أخطاء التحقق (422) أولاً، ثم رسالة Laravel العامة، ثم fallback
      const validationErrors = extractValidationErrors(err)
      if (validationErrors) {
        const firstErr = Object.values(validationErrors)[0]?.[0]
        toast.error(firstErr ?? 'بيانات غير صالحة')
      } else {
        toast.error(extractApiMessage(err, 'حدث خطأ. حاول مرة أخرى.'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggleNotifications = (checked: boolean) => {
    setEmailNotifications(checked)
    localStorage.setItem('gradshow_email_notifications', String(checked))
    toast.success(checked ? 'تم تفعيل إشعارات البريد' : 'تم إيقاف إشعارات البريد')
  }

  // ✨ B6: إعادة إرسال رمز التحقق (يتطلب auth)
  const handleResendVerification = async () => {
    setResending(true)
    try {
      await mockResendVerification()
      toast.success('تمت إعادة إرسال رمز التحقق إلى بريدك 📧')
    } catch (err: unknown) {
      toast.error(extractApiMessage(err, 'تعذّر إعادة الإرسال. حاول لاحقاً.'))
    } finally {
      setResending(false)
    }
  }

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'تسجيل الخروج',
      message: 'هل أنت متأكد من تسجيل الخروج؟',
      confirmText: 'تسجيل الخروج',
      variant: 'primary',
    })
    if (!ok) return
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell title="الإعدادات">
      <PageHeader
        title="الإعدادات"
        subtitle="إدارة حسابك وتفضيلاتك"
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'الإعدادات' },
        ]}
      />

      <div className="max-w-3xl space-y-6">
        {/* Account Info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardTitle className="mb-4">معلومات الحساب</CardTitle>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="الاسم الكامل" value={user?.name ?? ''} disabled />
              <Input label="البريد الإلكتروني" value={user?.email ?? ''} disabled />
              <Input
                label="الدور"
                value={user?.role === 'student' ? 'طالب' : user?.role === 'company' ? 'شركة' : 'مسؤول'}
                disabled
              />
              <Input
                label="الدفعة"
                value={user?.batch?.name ?? (user?.batchId ? `Batch ${user.batchId}` : '—')}
                disabled
              />
            </div>
            <p className="text-xs text-ink-400 mt-3">
              هذه المعلومات لا يمكن تعديلها مباشرة. تواصل مع المسؤول عند الحاجة.
            </p>
          </Card>
        </motion.div>

        {/* ✨ B6: Email Verification Status */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              {isEmailVerified ? <MailCheck size={18} className="text-success" /> : <Mail size={18} className="text-warning" />}
              حالة البريد الإلكتروني
            </CardTitle>

            {isEmailVerified ? (
              <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-md">
                <div className="w-10 h-10 rounded-lg bg-success/20 grid place-items-center flex-shrink-0">
                  <MailCheck size={20} className="text-success" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-success mb-0.5">
                    بريدك مُؤكَّد ✓
                  </div>
                  <div className="text-xs text-ink-500">
                    تم تأكيد البريد الإلكتروني{' '}
                    <strong dir="ltr">{user?.email}</strong>. حسابك مفعّل بالكامل.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-1">
                      بريدك غير مُؤكَّد
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      لم تؤكّد البريد الإلكتروني{' '}
                      <strong dir="ltr">{user?.email}</strong> بعد. التأكيد ليس إلزامياً،
                      لكنه يساعد في استرجاع حسابك عند نسيان كلمة المرور.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate('/verify-email')}
                  >
                    <MailCheck size={14} />
                    تأكيد البريد
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResendVerification}
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
                </div>

                <p className="text-xs text-ink-400">
                  💡 إذا لم تجد الرسالة، تحقّق من مجلد السبام (Spam/Junk).
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <KeyRound size={18} />
              تغيير كلمة المرور
            </CardTitle>

            <form onSubmit={handlePasswordChange} className="space-y-1">
              <div className="relative">
                <Input
                  label="كلمة المرور الحالية"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((s) => !s)}
                  className="absolute left-3 top-[38px] text-ink-400 hover:text-ink-600"
                  aria-label={showCurrent ? 'إخفاء' : 'إظهار'}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="كلمة المرور الجديدة"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  hint="8 أحرف على الأقل"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute left-3 top-[38px] text-ink-400 hover:text-ink-600"
                  aria-label={showNew ? 'إخفاء' : 'إظهار'}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Input
                label="تأكيد كلمة المرور الجديدة"
                type={showNew ? 'text' : 'password'}
                value={newPasswordConfirmation}
                onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
                required
              />

              <div className="flex justify-end mt-4">
                <Button type="submit" size="sm" disabled={loading}>
                  <Save size={14} />
                  {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Preferences */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardTitle className="mb-4">التفضيلات</CardTitle>

            {/* Theme toggle */}
            <div className="flex items-center justify-between py-3 border-b border-ink-100 dark:border-ink-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-ink-100 dark:bg-ink-800 grid place-items-center text-ink-500">
                  {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <div className="font-semibold text-sm">المظهر</div>
                  <div className="text-xs text-ink-400">
                    {theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  theme === 'dark' ? 'bg-brand-500' : 'bg-ink-200',
                )}
                aria-label="تبديل المظهر"
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                    theme === 'dark' ? 'right-0.5' : 'right-5',
                  )}
                />
              </button>
            </div>

            {/* Email notifications */}
            <div className="flex items-center justify-between py-3 border-b border-ink-100 dark:border-ink-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-ink-100 dark:bg-ink-800 grid place-items-center text-ink-500">
                  <Bell size={16} />
                </div>
                <div>
                  <div className="font-semibold text-sm">إشعارات البريد</div>
                  <div className="text-xs text-ink-400">تنبيهات عند مراجعة تقديماتك</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotifications(!emailNotifications)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  emailNotifications ? 'bg-brand-500' : 'bg-ink-200',
                )}
                aria-label="تبديل إشعارات البريد"
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                    emailNotifications ? 'right-0.5' : 'right-5',
                  )}
                />
              </button>
            </div>

            {/* Language (placeholder) */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-ink-100 dark:bg-ink-800 grid place-items-center text-ink-500">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="font-semibold text-sm">اللغة</div>
                  <div className="text-xs text-ink-400">العربية (الوحيدة المتاحة حالياً)</div>
                </div>
              </div>
              <span className="text-xs text-ink-400 px-3 py-1 bg-ink-100 dark:bg-ink-800 rounded-md">
                قريباً: English
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-danger/30">
            <CardTitle className="mb-3 text-danger">منطقة الخطر</CardTitle>
            <p className="text-sm text-ink-500 mb-4">
              تسجيل الخروج سينهي جلستك الحالية. ستحتاج لتسجيل الدخول مرة أخرى للوصول إلى حسابك.
            </p>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              <LogOut size={14} />
              تسجيل الخروج
            </Button>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
