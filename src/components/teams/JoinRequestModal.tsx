import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { useCreateJoinRequest } from '@/hooks/useJoinRequests'
import type { TeamPreview } from '@/types'

/**
 * ✨ نافذة طلب الانضمام لفريق.
 * تُظهر معاينة محدودة للفريق (preview) + حقل رسالة اختياري.
 */
export function JoinRequestModal({
  open,
  onOpenChange,
  preview,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  preview: TeamPreview | null
}) {
  const [message, setMessage] = useState('')
  const createMutation = useCreateJoinRequest()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!preview) return
    createMutation.mutate(
      { teamId: preview.id, message: message.trim() || null },
      {
        onSuccess: () => {
          onOpenChange(false)
          setMessage('')
        },
      },
    )
  }

  return (
    <AnimatePresence>
      {open && preview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-ink-900 rounded-xl shadow-lg border border-ink-200 dark:border-ink-800 max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">طلب الانضمام للفريق</h3>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md">
              <div className="font-semibold mb-1">{preview.name}</div>
              <div className="text-xs text-ink-400 mb-2">
                {preview.teamableTitle} · {preview.membersCount}
                {preview.maxTeamSize ? ` / ${preview.maxTeamSize}` : ''} أعضاء
                {preview.leaderName ? ` · القائد: ${preview.leaderName}` : ''}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <Textarea
                label="رسالة للقائد (اختياري)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="عرّف بنفسك ولماذا تريد الانضمام..."
                rows={3}
                hint="حتى 500 حرف"
              />

              <div className="flex gap-3 mt-5">
                <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                  <UserPlus size={16} />
                  {createMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
