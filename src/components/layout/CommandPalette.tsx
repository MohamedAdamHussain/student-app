import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  User,
  CheckSquare,
  Trophy,
  FileText,
  Users,
  Plus,
  Home,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  action: () => void
  group: string
  keywords?: string
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const items: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      description: 'الصفحة الرئيسية',
      icon: LayoutDashboard,
      action: () => navigate('/dashboard'),
      group: 'التنقل',
      keywords: 'dashboard home main',
    },
    {
      id: 'profile',
      label: 'ملفي الشخصي',
      description: 'عرض وتعديل ملفك',
      icon: User,
      action: () => navigate('/profile'),
      group: 'التنقل',
      keywords: 'profile me account',
    },
    {
      id: 'tasks',
      label: 'المهام',
      description: 'مهام دفعتك',
      icon: CheckSquare,
      action: () => navigate('/tasks'),
      group: 'التنقل',
      keywords: 'tasks homework hw final',
    },
    {
      id: 'hackathons',
      label: 'الهاكاثونات',
      description: 'المسابقات الجارية',
      icon: Trophy,
      action: () => navigate('/hackathons'),
      group: 'التنقل',
      keywords: 'hackathon competition',
    },
    {
      id: 'submissions',
      label: 'تقديماتي',
      description: 'كل أعمالك السابقة',
      icon: FileText,
      action: () => navigate('/submissions'),
      group: 'التنقل',
      keywords: 'submissions work',
    },
    {
      id: 'teams',
      label: 'فرقي',
      description: 'الفرق التي تنتمي إليها',
      icon: Users,
      action: () => navigate('/teams'),
      group: 'التنقل',
      keywords: 'teams group',
    },
    {
      id: 'new-submission',
      label: 'تقديم جديد',
      description: 'اسلّم عملاً جديداً',
      icon: Plus,
      action: () => navigate('/submissions/new'),
      group: 'إجراءات سريعة',
      keywords: 'new submission create add',
    },
    {
      id: 'edit-profile',
      label: 'تعديل الملف الشخصي',
      description: 'حدّث معلوماتك',
      icon: User,
      action: () => navigate('/profile/edit'),
      group: 'إجراءات سريعة',
      keywords: 'edit profile update',
    },
    {
      id: 'home',
      label: 'العودة للرئيسية',
      description: 'صفحة البداية',
      icon: Home,
      action: () => navigate('/dashboard'),
      group: 'إجراءات سريعة',
      keywords: 'home back',
    },
  ]

  const filtered = items.filter((item) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.keywords?.toLowerCase().includes(q)
    )
  })

  // Group filtered items
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (open && e.key === 'Escape') onOpenChange(false)
      if (open && e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % filtered.length)
      }
      if (open && e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length)
      }
      if (open && e.key === 'Enter' && filtered[activeIndex]) {
        filtered[activeIndex].action()
        onOpenChange(false)
        setQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onOpenChange, filtered, activeIndex])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  let runningIndex = -1

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-ink-950/60 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-ink-900 rounded-xl shadow-lg border border-ink-200 dark:border-ink-800 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-100 dark:border-ink-800">
              <Search size={18} className="text-ink-400" />
              <input
                autoFocus
                type="text"
                placeholder="ابحث أو نفّذ أمراً..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400"
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-ink-100 dark:bg-ink-800 rounded text-ink-500">
                ESC
              </kbd>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2">
              {Object.keys(groups).length === 0 ? (
                <div className="text-center py-8 text-sm text-ink-400">
                  لا نتائج لـ "{query}"
                </div>
              ) : (
                Object.entries(groups).map(([group, groupItems]) => (
                  <div key={group} className="mb-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 px-2 py-1.5">
                      {group}
                    </div>
                    {groupItems.map((item) => {
                      runningIndex++
                      const isActive = runningIndex === activeIndex
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            item.action()
                            onOpenChange(false)
                            setQuery('')
                          }}
                          onMouseEnter={() => setActiveIndex(runningIndex)}
                          className={cn(
                            'w-full flex items-center gap-3 px-2 py-2.5 rounded-md text-sm transition-colors',
                            isActive
                              ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-300'
                              : 'text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800',
                          )}
                        >
                          <Icon size={16} className="flex-shrink-0" />
                          <div className="flex-1 text-right">
                            <div className="font-medium">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-ink-400">{item.description}</div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
