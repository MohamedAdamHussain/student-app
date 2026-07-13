import { Crown, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import type { Submission } from '@/types'

export function ContributionSummary({ submissions }: { submissions: Submission[] }) {
  const teamSubmissions = submissions.filter((s) => s.isTeamSubmission)
  const withContribution = teamSubmissions.filter(
    (s) => s.myContribution !== null && s.myContribution !== undefined,
  )
  const asLeader = teamSubmissions.filter((s) => s.myRole === 'leader').length

  if (teamSubmissions.length === 0) return null

  const avgContribution =
    withContribution.length > 0
      ? Math.round(
          withContribution.reduce((sum, s) => sum + (s.myContribution ?? 0), 0) /
            withContribution.length,
        )
      : null

  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-md bg-brand-50 dark:bg-brand-900/20 grid place-items-center">
          <Users size={16} className="text-brand-500" />
        </div>
        <h3 className="font-bold text-sm text-ink-900 dark:text-ink-100">مساهماتي في الفرق</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-brand-500">{teamSubmissions.length}</div>
          <div className="text-xs text-ink-400 mt-1">مشروع جماعي</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-accent-500">{asLeader}</div>
          <div className="text-xs text-ink-400 mt-1">قائد فريق</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-success">
            {avgContribution !== null ? `${avgContribution}%` : '—'}
          </div>
          <div className="text-xs text-ink-400 mt-1">متوسط المساهمة</div>
        </div>
      </div>
    </div>
  )
}
