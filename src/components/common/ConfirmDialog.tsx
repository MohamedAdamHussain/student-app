import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// =====================================================
// ConfirmDialog — بديل موحّد لـ window.confirm
// =====================================================
// قبل هذا: كان window.confirm يُستخدم في 7 مواضع، ويعطي مربع
// حوار المتصفح الأصلي (إنجليزي الأزرار، لا تخصيص، يقطع الـ UI).
// الآن: useConfirm()(opts) → Promise<boolean> مع مربع حوار عربي
// يتبع تصميم التطبيق (RTL، داكن، framer-motion).
//
// الاستخدام:
//   const confirm = useConfirm()
//   if (!(await confirm({ title: 'حذف', message: 'هل أنت متأكد؟' }))) return
//   deleteMutation.mutate()

interface ConfirmOptions {
  title?: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  /** نمط زر التأكيد. 'danger' للأفعال المدمّرة (افتراضي)، 'primary' للإجراءات المحايدة. */
  variant?: 'danger' | 'primary'
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setState(opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const close = useCallback((value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setState(null)
  }, [])

  // Enter = تأكيد، ESC = إلغاء (فقط أثناء عرض الحوار)
  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, close])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {createPortal(
        <AnimatePresence>
          {state && (
            <motion.div
              className="fixed inset-0 z-[100] grid place-items-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* overlay */}
              <div
                className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
                onClick={() => close(false)}
              />
              {/* dialog */}
              <motion.div
                role="alertdialog"
                aria-modal="true"
                dir="rtl"
                className={cn(
                  'relative w-full max-w-md bg-white dark:bg-ink-800 rounded-xl shadow-2xl',
                  'border border-ink-200 dark:border-ink-700 p-6',
                )}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex gap-4">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-full grid place-items-center flex-shrink-0 text-white',
                      state.variant === 'danger' ? 'bg-danger' : 'bg-brand-500',
                    )}
                  >
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-1">
                      {state.title ?? 'تأكيد'}
                    </h2>
                    <div className="text-sm text-ink-600 dark:text-ink-300">
                      {state.message}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    block
                    onClick={() => close(false)}
                  >
                    {state.cancelText ?? 'إلغاء'}
                  </Button>
                  <Button
                    type="button"
                    variant={state.variant === 'danger' ? 'danger' : 'primary'}
                    block
                    onClick={() => close(true)}
                  >
                    {state.confirmText ?? 'تأكيد'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')
  return ctx
}
