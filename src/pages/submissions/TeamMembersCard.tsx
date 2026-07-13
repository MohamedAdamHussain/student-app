import { Users, Crown, User } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import type { Submission, SubmissionTeamMember } from '@/types'

interface TeamMembersCardProps {
  submission: Submission
}

/**
 * ✨ بطاقة عرض أعضاء الفريق + نسب المساهمة.
 * تظهر فقط لتقديمات الفرق (isTeamSubmission = true).
 */
export function TeamMembersCard({ submission }: TeamMembersCardProps) {
  if (!submission.isTeamSubmission || !submission.teamMembers?.length) {
    return null
  }

  const members = submission.teamMembers
  const leader = members.find((m) => m.isLeader)
  const otherMembers = members.filter((m) => !m.isLeader)
  const hasUnsetContributions = members.some(
    (m) => m.contributionPercentage === null || m.contributionPercentage === undefined,
  )

  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 grid place-items-center">
            <Users size={18} className="text-brand-500" />
          </div>
          <div>
            <h3 className="font-bold text-ink-900 dark:text-ink-100">فريق المشروع</h3>
            <p className="text-xs text-ink-400">
              {members.length} أعضاء · نسب المساهمة يضبطها الأدمن عند المراجعة
            </p>
          </div>
        </div>
        <Badge variant="info">مشروع جماعي</Badge>
      </div>

      <div className="space-y-3">
        {leader && (
          <MemberRow member={leader} isCurrentUser={leader.userId === submission.userId} />
        )}
        {otherMembers.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isCurrentUser={member.userId === submission.userId}
          />
        ))}
      </div>

      {hasUnsetContributions && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            ⏳ نسب المساهمة لم تُضبط بعد. سيقوم الأدمن بضبطها عند مراجعة التقديم.
          </p>
        </div>
      )}
    </div>
  )
}

function MemberRow({
  member,
  isCurrentUser,
}: {
  member: SubmissionTeamMember
  isCurrentUser: boolean
}) {
  const contribution = member.contributionPercentage
  const hasContribution = contribution !== null && contribution !== undefined
  const memberName = member.user?.name ?? 'عضو الفريق'

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg ${
        isCurrentUser
          ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800'
          : 'bg-ink-50 dark:bg-ink-800/50'
      }`}
    >
      <Avatar src={member.user?.avatar} name={memberName} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-ink-900 dark:text-ink-100">{memberName}</span>
          {member.isLeader && (
            <Badge variant="accent">
              <Crown size={10} />
              قائد الفريق
            </Badge>
          )}
          {isCurrentUser && <Badge variant="info">أنت</Badge>}
        </div>
        {member.contributionNotes && (
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 leading-relaxed">
            {member.contributionNotes}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 w-24 text-left">
        {hasContribution ? (
          <div>
            <div className="flex items-center justify-end gap-1 mb-1">
              <span className="text-lg font-bold text-brand-500">{contribution}%</span>
            </div>
            <Progress value={contribution} variant="default" />
          </div>
        ) : (
          <span className="text-xs text-ink-400">—</span>
        )}
      </div>
    </div>
  )
}

/**
 * ✨ بطاقة "مساهمتي" — تظهر نسبة مساهمة المستخدم الحالي في هذا المشروع.
 */
export function MyContributionBanner({ submission }: { submission: Submission }) {
  if (!submission.myContribution && !submission.myRole) return null

  const contribution = submission.myContribution
  const role = submission.myRole
  const notes = submission.myContributionNotes

  return (
    <div className="rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 p-4 mb-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/40 grid place-items-center flex-shrink-0">
          <User size={24} className="text-brand-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-sm text-brand-900 dark:text-brand-100">
              مساهمتي في هذا المشروع
            </span>
            <Badge variant={role === 'leader' ? 'accent' : 'info'}>
              {role === 'leader' ? 'قائد الفريق' : 'عضو'}
            </Badge>
          </div>
          {notes && <p className="text-xs text-brand-700 dark:text-brand-300 mb-2">{notes}</p>}
          {contribution !== null && contribution !== undefined && (
            <div className="flex items-center gap-2">
              <Progress value={contribution} variant="default" />
              <span className="text-sm font-bold text-brand-500 flex-shrink-0">{contribution}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
