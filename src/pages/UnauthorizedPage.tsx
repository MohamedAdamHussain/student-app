import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldX, ArrowRight, LogOut } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

interface UnauthorizedPageProps {
  requiredRole?: UserRole
}

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'طالب',
  company: 'شركة',
  admin: 'مسؤول',
}

export function UnauthorizedPage({ requiredRole }: UnauthorizedPageProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 bg-danger-soft rounded-full grid place-items-center"
        >
          <ShieldX size={40} className="text-danger" />
        </motion.div>

        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 mb-2">
          غير مصرح
        </h1>

        <p className="text-sm text-ink-500 dark:text-ink-400 mb-6 leading-relaxed">
          {requiredRole ? (
            <>
              هذه الصفحة متاحة فقط لـ <strong className="text-ink-700 dark:text-ink-200">{ROLE_LABELS[requiredRole]}</strong>.
              <br />
              حسابك الحالي ({ROLE_LABELS[user?.role ?? 'student'] ?? 'مستخدم'}) لا يملك صلاحية الوصول.
            </>
          ) : (
            'لا تملك صلاحية الوصول لهذه الصفحة.'
          )}
        </p>

        {/* ✨ معالجة 403 Forbidden — توجيه ذكي */}
        {user?.role === 'admin' && (
          <div className="p-4 bg-info-soft border border-info-border rounded-md mb-6 text-sm text-ink-600 dark:text-ink-300">
            <strong className="text-info">مسؤول النظام:</strong> أنت تسجّل الدخول بحساب مسؤول.
            استخدم <strong>Admin App</strong> على المنفذ 5174 للوصول للوحة التحكم.
          </div>
        )}

        {user?.role === 'company' && (
          <div className="p-4 bg-info-soft border border-info-border rounded-md mb-6 text-sm text-ink-600 dark:text-ink-300">
            <strong className="text-info">حساب شركة:</strong> هذه الصفحة مخصصة للطلاب فقط.
            الشركة تستطيع تصفح الملفات عبر الـ endpoints المخصصة لها.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate('/dashboard')} block>
            <ArrowRight size={16} />
            العودة للوحة التحكم
          </Button>

          <Button variant="ghost" onClick={handleLogout} block>
            <LogOut size={16} />
            تسجيل الخروج
          </Button>
        </div>

        {/* ✨ نصيحة أمنية */}
        <div className="mt-8 p-3 bg-ink-100 dark:bg-ink-800/50 rounded-md text-xs text-ink-400">
          <strong>رمز الخطأ:</strong> 403 Forbidden
          <br />
          إذا كنت تعتقد أن هذا خطأ، تواصل مع مسؤول النظام.
        </div>
      </motion.div>
    </div>
  )
}
