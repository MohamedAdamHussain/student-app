import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { Submission } from '@/types'

/**
 * ✨ بادج يظهر "مشروع جماعي" للتقديمات الجماعية، "مشروع فردي" للفردية.
 */
export function TeamBadge({ submission }: { submission: Submission }) {
  if (submission.isTeamSubmission) {
    return (
      <Badge variant="info">
        <Users size={10} />
        مشروع جماعي
        {submission.participantsCount && submission.participantsCount > 1 && (
          <span className="opacity-70">· {submission.participantsCount} أعضاء</span>
        )}
      </Badge>
    )
  }
  return <Badge variant="neutral">مشروع فردي</Badge>
}

/**
 * ✨ بادج مختصر — يظهر فقط "جماعي" للتقديمات الجماعية، ولا شيء للفردية.
 */