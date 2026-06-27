import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  CheckSquare,
  Trophy,
  FileText,
  Users,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface NavItemDef {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
}

const mainNav: NavItemDef[] = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/profile', label: 'ملفي الشخصي', icon: User },
]

const workNav: NavItemDef[] = [
  { to: '/tasks', label: 'المهام', icon: CheckSquare, badge: 5 },
  { to: '/hackathons', label: 'الهاكاثونات', icon: Trophy, badge: 2 },
  { to: '/submissions', label: 'تقديماتي', icon: FileText },
  { to: '/teams', label: 'فرقي', icon: Users },
]

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()

  const isActive = (to: string) =>
    location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-white dark:bg-ink-900 border-l border-ink-200 dark:border-ink-800 p-4 sticky top-0 h-screen overflow-y-auto flex-shrink-0">
      <div className="px-2 pb-6 mb-4 border-b border-ink-100 dark:border-ink-800">
        <Logo />
      </div>

      <nav className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 px-3 pb-2">
          الرئيسية
        </div>
        {mainNav.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} />
        ))}
      </nav>

      <nav className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 px-3 pb-2">
          العمل
        </div>
        {workNav.map((item) => (
          <NavLink key={item.to} item={item} active={isActive(item.to)} />
        ))}
      </nav>

      <nav className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 px-3 pb-2">
          الحساب
        </div>
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-ink-600 dark:text-ink-300 text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors mb-0.5"
        >
          <Settings size={18} />
          <span>الإعدادات</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-ink-600 dark:text-ink-300 text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors mb-0.5"
        >
          <LogOut size={18} />
          <span>تسجيل الخروج</span>
        </button>
      </nav>

      <div className="mt-auto pt-4 border-t border-ink-100 dark:border-ink-800">
        <Link
          to="/profile"
          className="flex items-center gap-2.5 p-2 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors cursor-pointer"
        >
          <Avatar name={user?.name ?? 'User'} size="md" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink-900 dark:text-ink-100 truncate">
              {user?.name}
            </div>
            <div className="text-xs text-ink-400">طالب · Batch 1</div>
          </div>
        </Link>
      </div>
    </aside>
  )
}

function NavLink({ item, active }: { item: NavItemDef; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all mb-0.5',
        active
          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300 font-semibold'
          : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-ink-100',
      )}
    >
      <Icon size={18} className="flex-shrink-0" />
      <span>{item.label}</span>
      {item.badge && (
        <span className="mr-auto bg-brand-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
          {item.badge}
        </span>
      )}
    </Link>
  )
}
