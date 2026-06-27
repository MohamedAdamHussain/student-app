import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  CheckSquare,
  Trophy,
  FileText,
  Users,
  X,
  LogOut,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const navItems = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/profile', label: 'ملفي الشخصي', icon: User },
  { to: '/tasks', label: 'المهام', icon: CheckSquare },
  { to: '/hackathons', label: 'الهاكاثونات', icon: Trophy },
  { to: '/submissions', label: 'تقديماتي', icon: FileText },
  { to: '/teams', label: 'فرقي', icon: Users },
]

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="md:hidden fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-40"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-ink-900 z-50 flex flex-col p-4"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink-100 dark:border-ink-800">
              <Logo />
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active =
                  location.pathname === item.to ||
                  (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors mb-0.5',
                      active
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300'
                        : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800',
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="pt-4 border-t border-ink-100 dark:border-ink-800">
              <Link
                to="/profile"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2.5 p-2 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 mb-2"
              >
                <Avatar name={user?.name ?? 'User'} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-900 dark:text-ink-100 truncate">
                    {user?.name}
                  </div>
                  <div className="text-xs text-ink-400">طالب · Batch 1</div>
                </div>
              </Link>
              <button
                onClick={() => {
                  logout()
                  onOpenChange(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-ink-600 dark:text-ink-300 text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              >
                <LogOut size={18} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
