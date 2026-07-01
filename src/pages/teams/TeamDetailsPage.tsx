import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Crown, UserPlus, UserMinus, Plus, Trophy, Clock,
  ArrowLeft, Mail, Trash2, AlertTriangle, FileText,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { mockGetTeam } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { formatRelative, daysUntil, cn } from '@/lib/utils'

export function TeamDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const teamId = Number(id)
  const { user } = useAuth()

  const { data: team, isLoading } = useQuery({
    queryKey: queryKeys.team(teamId),
    queryFn: () => mockGetTeam(teamId),
    enabled: !!teamId,
  })

  if (isLoading || !team) {
    return (
      <AppShell title="إدارة الفريق">
        <Skeleton className="h-96" />
      </AppShell>
    )
  }

  const myMembership = team.teamMembers.find((m) => m.userId === user?.id)
  const isLeader = myMembership?.isLeader
  const maxSize = (team.teamable as any)?.max_team_size ?? 4
  const isFull = team.teamMembers.length >= maxSize
  const hasEmptySlot = !isFull
  const hackathon = team.teamable as any

  return (
    <AppShell title="إدارة الفريق">
      <PageHeader
        title={team.name}
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'فرقي', to: '/teams' },
          { label: team.name },
        ]}
        actions={
          <Link to="/teams">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
              رجوع للفرق
            </Button>
          </Link>
        }
      />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-8 mb-6 text-white relative overflow-hidden border-0"
        style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
      >
        <div className="absolute -top-1/3 left-0 w-1/2 h-[200%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {isLeader && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm">
                <Crown size={12} />
                أنا القائد
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm">
              <Trophy size={12} />
              هاكاثون
            </span>
          </div>

          <h1 className="text-3xl font-extrabold mb-2">{team.name}</h1>
          <p className="text-base opacity-90 mb-6">
            للمشاركة في {hackathon?.title}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] opacity-75 mb-1 uppercase">الأعضاء</div>
              <div className="text-lg font-bold">{team.teamMembers.length} / {maxSize}</div>
            </div>
            <div>
              <div className="text-[11px] opacity-75 mb-1 uppercase">أنشأ في</div>
              <div className="text-lg font-bold">{formatRelative(team.createdAt)}</div>
            </div>
            <div>
              <div className="text-[11px] opacity-75 mb-1 uppercase">القائد</div>
              <div className="text-lg font-bold">
                {team.teamMembers.find((m) => m.isLeader)?.user.name}
              </div>
            </div>
            <div>
              <div className="text-[11px] opacity-75 mb-1 uppercase">الحالة</div>
              <div className="text-lg font-bold">
                {hasEmptySlot ? 'يبحث عن عضو' : 'مكتمل'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Left */}
        <div className="space-y-5">
          {/* Members */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-ink-100 dark:border-ink-800">
              <CardTitle>أعضاء الفريق ({team.teamMembers.length})</CardTitle>
              {isLeader && (
                <Button size="sm">
                  <Plus size={14} />
                  دعوة عضو
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {team.teamMembers.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    'flex items-center gap-4 p-4 border rounded-md',
                    member.isLeader
                      ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800'
                      : 'border-ink-200 dark:border-ink-800',
                  )}
                >
                  <Avatar name={member.user.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">
                        {member.user.name}
                        {member.userId === user?.id && ' (أنت)'}
                      </span>
                      {member.isLeader && (
                        <Badge variant="accent">
                          <Crown size={12} />
                          القائد
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-ink-400">{member.user.email}</div>
                  </div>
                  <div className="text-xs text-ink-400">
                    انضم {formatRelative(team.createdAt)}
                  </div>
                  {isLeader && !member.isLeader && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!p-2 !w-8 !h-8 text-danger hover:bg-danger-soft"
                    >
                      <UserMinus size={14} />
                    </Button>
                  )}
                </div>
              ))}

              {/* Empty slot */}
              {hasEmptySlot && (
                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-ink-200 dark:border-ink-700 rounded-md">
                  <div className="w-9 h-9 rounded-full bg-ink-100 dark:bg-ink-800 border-2 border-dashed border-ink-300 dark:border-ink-600 grid place-items-center text-ink-400">
                    +
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-ink-400">مقعد شاغر</div>
                    <div className="text-xs text-ink-400">ادعُ عضواً رابعاً لإكمال الفريق</div>
                  </div>
                  {isLeader && (
                    <Button variant="secondary" size="sm">
                      <UserPlus size={14} />
                      دعوة عضو
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Invite by Email */}
          <Card>
            <CardTitle className="mb-2">دعوة عضو جديد</CardTitle>
            <p className="text-sm text-ink-400 mb-4">
              أرسل دعوة لطالب آخر عن طريق البريد الإلكتروني
            </p>

            <div className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <input
                  type="email"
                  className="form-input !pr-10"
                  placeholder="student@email.com"
                />
                <Mail size={16} className="absolute right-3 top-3 text-ink-400" />
              </div>
              <Button>
                <Mail size={14} />
                إرسال الدعوة
              </Button>
            </div>

            <div className="border-t border-ink-100 dark:border-ink-800 pt-4">
              <div className="text-xs font-semibold text-ink-400 uppercase mb-3">
                دعوات مرسلة (1)
              </div>
              <div className="flex items-center justify-between p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-ink-200 dark:bg-ink-700 grid place-items-center text-ink-400 text-xs">
                    ؟
                  </div>
                  <div>
                    <div className="text-sm font-semibold">عبدالله الحربي</div>
                    <div className="text-xs text-ink-400">abdullah@email.com</div>
                  </div>
                </div>
                <Badge variant="warning">بانتظار الرد</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Right */}
        <aside className="space-y-5">
          {/* Hackathon Info */}
          <Card>
            <CardTitle className="mb-4">الهاكاثون</CardTitle>
            <div className="p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md mb-3">
              <div className="font-semibold mb-1">{hackathon?.title}</div>
              <div className="text-xs text-ink-400 mb-3 line-clamp-2">
                {hackathon?.description}
              </div>
              <Link to={`/hackathons/${hackathon?.id}`}>
                <Button variant="secondary" size="sm" block>
                  عرض تفاصيل الهاكاثون
                </Button>
              </Link>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">الموعد النهائي</span>
                <span className="font-semibold">
                  {hackathon?.deadline?.split('T')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">متبقي</span>
                <span className="font-semibold text-warning">
                  {Math.max(daysUntil(hackathon?.deadline ?? new Date().toISOString()), 0)} أيام
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">الحد الأقصى</span>
                <span className="font-semibold">{maxSize} أعضاء</span>
              </div>
            </div>
          </Card>

          {/* Submission Status */}
          <Card className="bg-warning-soft border-warning-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-warning rounded-md grid place-items-center text-white">
                <FileText size={18} />
              </div>
              <div>
                <div className="font-bold text-warning">لم تُسلِّم بعد</div>
                <div className="text-xs text-ink-600 dark:text-ink-300">تقديم الفريق غير موجود</div>
              </div>
            </div>
            <Link to="/submissions/new">
              <Button block>
                <Plus size={14} />
                تسليم باسم الفريق
              </Button>
            </Link>
            <div className="text-xs text-ink-400 mt-3 text-center">
              سيُحتسب التسليم لكل أعضاء الفريق
            </div>
          </Card>

          {/* Danger Zone */}
          {isLeader && (
            <Card className="bg-danger-soft border-danger-border">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-danger" />
                <div className="font-bold text-danger">منطقة الخطر</div>
              </div>
              <div className="text-xs text-ink-600 dark:text-ink-300 mb-3">
                كقائد، يمكنك حذف الفريق. سيتم إزالة جميع الأعضاء والإلغاء من الهاكاثون.
              </div>
              <Button variant="danger" block size="sm">
                <Trash2 size={14} />
                حذف الفريق نهائياً
              </Button>
            </Card>
          )}
        </aside>
      </div>
    </AppShell>
  )
}
