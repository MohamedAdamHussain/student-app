import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Sun, Moon, Command, Menu } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface TopbarProps {
  title: string
  onOpenCommand?: () => void
  onOpenMobileNav?: () => void
}

export function Topbar({ title, onOpenCommand, onOpenMobileNav }: TopbarProps) {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 flex items-center px-4 md:px-8 gap-4">
      <button
        onClick={onOpenMobileNav}
        className="md:hidden p-2 -mr-2 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>

      <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{title}</h2>

      <div className="mr-auto flex items-center gap-2">
        <button
          onClick={onOpenCommand}
          className={cn(
            'hidden sm:flex items-center gap-2 px-3 py-2 rounded-md border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-950 text-sm text-ink-400 transition-all w-[280px]',
            searchFocused && 'border-brand-500 shadow-glow bg-white dark:bg-ink-900',
          )}
        >
          <Search size={16} />
          <span className="flex-1 text-right">بحث...</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded text-[10px] font-mono">
            <Command size={10} />K
          </kbd>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={() => navigate('/submissions')}
          className="relative p-2 rounded-md text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white dark:border-ink-900" />
        </button>
      </div>
    </header>
  )
}
