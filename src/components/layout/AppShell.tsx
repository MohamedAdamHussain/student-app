import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { MobileNav } from '@/components/layout/MobileNav'

interface AppShellProps {
  title: string
  children: ReactNode
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'لوحة التحكم',
  '/profile': 'ملفي الشخصي',
  '/profile/edit': 'تعديل الملف الشخصي',
  '/tasks': 'المهام',
  '/hackathons': 'الهاكاثونات',
  '/submissions': 'تقديماتي',
  '/submissions/new': 'تقديم جديد',
  '/teams': 'فرقي',
}

export function AppShell({ title, children }: AppShellProps) {
  const location = useLocation()
  const [commandOpen, setCommandOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          onOpenCommand={() => setCommandOpen(true)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 p-5 md:p-8 max-w-[1280px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </div>
  )
}

export function getPageTitle(pathname: string): string {
  // Try exact match first
  if (pageTitles[pathname]) return pageTitles[pathname]
  // Try prefix match
  for (const key of Object.keys(pageTitles)) {
    if (pathname.startsWith(key) && key !== '/dashboard') {
      return pageTitles[key]
    }
  }
  // Pattern matches
  if (pathname.match(/^\/tasks\/\d+$/)) return 'تفاصيل المهمة'
  if (pathname.match(/^\/hackathons\/\d+$/)) return 'تفاصيل الهاكاثون'
  if (pathname.match(/^\/submissions\/\d+$/)) return 'تفاصيل التقديم'
  if (pathname.match(/^\/teams\/\d+$/)) return 'إدارة الفريق'
  return 'GradShow'
}
