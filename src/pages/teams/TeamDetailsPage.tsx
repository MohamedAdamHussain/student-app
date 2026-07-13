import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Crown, UserMinus, Plus, Trophy, Clock,
  ArrowLeft, Trash2, AlertTriangle, FileText, CheckSquare, Share2, Link2,
  CheckCircle2, XCircle,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { mockGetTeam, mockRemoveTeamMember } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { extractApiMessage } from '@/lib/errors'
import { useConfirm } from '@/components/common/ConfirmDialog'
import { useTeamJoinRequests, useApproveJoinRequest, useRejectJoinRequest } from '@/hooks/useJoinRequests'
import { formatRelative, daysUntil, formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

export function TeamDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const teamId = Number(id)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const confirm = useConfirm()
  const navigate = useNavigate()  // ✨ P0: استبدل window.location بـ navigate
  // ✨ طلبات الانضمام (للقائد: المعلّقة فقط).
  const { data: pendingRequests } = useTeamJoinRequests(teamId)
  const approveMutation = useApproveJoinRequest(teamId)
  const rejectMutation = useRejectJoinRequest(teamId)

  const { data: team, isLoading, error } = useQuery({
    queryKey: queryKeys.team(teamId),
    queryFn: () => mockGetTeam(teamId),
    enabled: !!teamId,
  })

  // ✨ Mutation لإزالة عضو
  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => mockRemoveTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team(teamId) })
      toast.success('تم إزالة العضو من الفريق')
    },
    onError: (err: unknown) => {
      toast.error(extractApiMessage(err, 'فشل إزالة العضو'))
    },
  })

  if (isLoading) {
    return (
      <AppShell title="إدارة الفريق">
        <Skeleton className="h-96" />
      </AppShell>
    )
  }

  // ✨ FIX: معالجة 403 — الـ backend يرفض رؤية فريق لست عضواً فيه (منع IDOR).
  // قبل هذا: كانت الصفحة تعرض skeleton إلى الأبد للزائر غير العضو.
  if (error || !team) {
    const status = (error as { response?: { status?: number } })?.response?.status
    return (
      <AppShell title="إدارة الفريق">
        <Card className="max-w-lg mx-auto mt-10 text-center">
          <AlertTriangle size={36} className="mx-auto mb-3 text-warning" />
          <h2 className="text-lg font-bold mb-2">لا يمكن عرض هذا الفريق</h2>
          <p className="text-sm text-ink-400 mb-5">
            {status === 403
              ? 'هذا الفريق خاص. لا يمكنك رؤية تفاصيل فريق لست عضواً فيه. اطلب من قائد الفريق إضافتك.'
              : 'تعذّر تحميل بيانات الفريق. تحقق من الرابط وحاول مرة أخرى.'}
          </p>
          <Link to="/teams">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={14} />
              العودة للفرق
            </Button>
          </Link>
        </Card>
      </AppShell>
    )
  }

  const myMembership = team.teamMembers.find((m) => m.userId === user?.id)
  const isLeader = myMembership?.isLeader
  // ✨ P2-1: type-safe access لـ maxTeamSize (موجودة في Task و Hackathon)
  const teamable = team.teamable
  const maxSize = teamable?.maxTeamSize ?? 4
  const isFull = team.teamMembers.length >= maxSize
  const hasEmptySlot = !isFull
  // ✨ P2-1: استخدم team.teamableType مباشرة (typed كـ TeamableType)
  const teamableType = team.teamableType
  const isHackathon = teamableType === 'hackathon'
  // ✨ P2-1: type-safe access للـ deadline عبر discriminated union
  const deadline = teamable && 'deadline' in teamable ? teamable.deadline : null
  const isCompleted = deadline ? new Date(deadline).getTime() < Date.now() : false
  const days = daysUntil(deadline ?? undefined)

  const handleRemoveMember = async (userId: number, userName: string) => {
    const ok = await confirm({
      title: 'إزالة عضو',
      message: `هل أنت متأكد من إزالة "${userName}" من الفريق؟`,
      confirmText: 'إزالة',
      variant: 'danger',
    })
    if (ok) removeMemberMutation.mutate(userId)
  }

  const handleShareLink = () => {
    const teamUrl = `${window.location.origin}/teams/${team.id}`
    const shareText = `انضم لفريقي "${team.name}" في GradShow`

    // ✨ جرّب Web Share API أولاً (mobile + متصفحات حديثة)
    if (navigator.share) {
      navigator.share({ title: 'دعوة فريق', text: shareText, url: teamUrl })
        .catch(() => {
          // المستخدم ألغى المشاركة — لا حاجة لرسالة
        })
    } else {
      // fallback: نسخ للحافظة
      navigator.clipboard.writeText(`${shareText}: ${teamUrl}`)
        .then(() => toast.success('تم نسخ رابط الفريق!'))
        .catch(() => toast.info(`انسخ هذا الرابط: ${teamUrl}`))
    }
  }

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
              {isHackathon ? <Trophy size={12} /> : <CheckSquare size={12} />}
              {isHackathon ? 'هاكاثون' : 'مهمة'}
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm">
                <Clock size={12} />
                منتهي
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold mb-2">{team.name}</h1>
          <p className="text-base opacity-90 mb-6">
            للمشاركة في {teamable?.title ?? (isHackathon ? 'هاكاثون' : 'مهمة')}
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
              <div className="text-lg font-bold truncate">
                {team.teamMembers.find((m) => m.isLeader)?.user.name ?? '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] opacity-75 mb-1 uppercase">الحالة</div>
              <div className="text-lg font-bold">
                {isCompleted ? 'منتهي' : hasEmptySlot ? 'يبحث عن عضو' : 'مكتمل'}
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
              {isLeader && hasEmptySlot && (
                <Button size="sm" onClick={() => document.getElementById('invite-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Plus size={14} />
                  طلبات الانضمام
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
                  <Avatar name={member.user.name} size="md" src={member.user.avatar ?? undefined} />
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
                  {/* ✨ زر إزالة العضو — يعمل فعلياً عبر API */}
                  {isLeader && !member.isLeader && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!p-2 !w-8 !h-8 text-danger hover:bg-danger-soft"
                      onClick={() => handleRemoveMember(member.userId, member.user.name)}
                      disabled={removeMemberMutation.isPending}
                      title="إزالة العضو"
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
                    <div className="text-xs text-ink-400">
                      ادعُ عضواً لإكمال الفريق ({maxSize - team.teamMembers.length} مقاعد متاحة)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ✨ طلبات الانضمام — للقائد فقط (بدل بطاقة "طلبات الانضمام" الوهمية). */}
          {isLeader && hasEmptySlot && (
            <Card id="invite-section">
              <CardTitle className="mb-2">طلبات الانضمام</CardTitle>
              <p className="text-sm text-ink-400 mb-4">
                الطلبات المعلّقة من الطلاب الراغبين بالانضمام لفريقك.
                {!pendingRequests || pendingRequests.length === 0
                  ? ' لا توجد طلبات حالياً — شارك رابط الفريق ليدعو زملاؤك الانضمام.'
                  : ''}
              </p>

              {pendingRequests && pendingRequests.length > 0 && (
                <div className="flex flex-col gap-3 mb-4">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-3 border border-ink-200 dark:border-ink-800 rounded-md"
                    >
                      <Avatar name={req.user?.name ?? '؟'} size="sm" src={req.user?.avatar ?? undefined} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{req.user?.name ?? 'طالب'}</div>
                        <div className="text-xs text-ink-400">{req.user?.email}</div>
                        {req.message && (
                          <div className="text-xs text-ink-500 mt-1 line-clamp-2">{req.message}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'قبول طلب الانضمام',
                              message: `إضافة "${req.user?.name ?? 'الطالب'}" للفريق؟`,
                              confirmText: 'قبول',
                              variant: 'primary',
                            })
                            if (ok) approveMutation.mutate(req.id)
                          }}
                        >
                          <CheckCircle2 size={14} />
                          قبول
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:bg-danger-soft"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'رفض طلب الانضمام',
                              message: `رفض طلب "${req.user?.name ?? 'الطالب'}"؟`,
                              confirmText: 'رفض',
                              variant: 'danger',
                            })
                            if (ok) rejectMutation.mutate(req.id)
                          }}
                        >
                          <XCircle size={14} />
                          رفض
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* مشاركة رابط (معلوماتي — لدعوة الزملاء لطلب الانضمام). */}
              <Button type="button" variant="secondary" onClick={handleShareLink} block>
                <Share2 size={14} />
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function'
                  ? 'مشاركة الرابط'
                  : 'نسخ رابط الفريق'}
              </Button>

              <div className="text-xs text-info bg-info-soft border border-info-border rounded-md p-2 mt-3 flex items-start gap-2">
                <Link2 size={12} className="flex-shrink-0 mt-0.5 text-info" />
                <span>
                  <strong>كيف ينضم الزملاء؟</strong> شارك رابط صفحة الهاكاثون/المهمة —
                  سيرى الطلاب فريقك في قسم "الفرق المتاحة" ويطلبون الانضمام. أنت توافق من هنا.
                </span>
              </div>
            </Card>
          )}
        </div>

        {/* Right */}
        <aside className="space-y-5">
          {/* Teamable Info (Hackathon or Task) */}
          <Card>
            <CardTitle className="mb-4">
              {isHackathon ? 'الهاكاثون' : 'المهمة'}
            </CardTitle>
            <div className="p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md mb-3">
              <div className="font-semibold mb-1">{teamable?.title ?? '—'}</div>
              <div className="text-xs text-ink-400 mb-3 line-clamp-3">
                {teamable?.description ?? '—'}
              </div>
              {isHackathon ? (
                <Link to={`/hackathons/${teamable?.id}`}>
                  <Button variant="secondary" size="sm" block>
                    عرض تفاصيل الهاكاثون
                  </Button>
                </Link>
              ) : (
                <Link to={`/tasks/${teamable?.id}`}>
                  <Button variant="secondary" size="sm" block>
                    عرض تفاصيل المهمة
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex flex-col gap-3 text-sm">
              {deadline && (
                <>
                  <div className="flex justify-between">
                    <span className="text-ink-500">الموعد النهائي</span>
                    <span className="font-semibold">{formatDate(deadline)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500">متبقي</span>
                    <span className={cn('font-semibold', isCompleted ? 'text-danger' : 'text-warning')}>
                      {isCompleted
                        ? `انتهى قبل ${Math.abs(days)} يوم`
                        : days > 0
                          ? `${days} أيام`
                          : 'انتهى اليوم'}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-ink-500">الحد الأقصى</span>
                <span className="font-semibold">{maxSize} أعضاء</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">نوع المشاركة</span>
                <span className="font-semibold">{isHackathon ? 'هاكاثون' : 'مهمة'}</span>
              </div>
            </div>
          </Card>

          {/* Submission Status — ✨ ديناميكي */}
          <Card className={isCompleted ? 'bg-ink-100 dark:bg-ink-800/50 border-ink-200 dark:border-ink-700' : 'bg-warning-soft border-warning-border'}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'w-10 h-10 rounded-md grid place-items-center text-white',
                isCompleted ? 'bg-ink-400' : 'bg-warning'
              )}>
                <FileText size={18} />
              </div>
              <div>
                <div className={cn('font-bold', isCompleted ? 'text-ink-500' : 'text-warning')}>
                  {isCompleted ? 'انتهى الموعد' : 'لم تُسلِّم بعد'}
                </div>
                <div className="text-xs text-ink-600 dark:text-ink-300">
                  {isCompleted
                    ? 'انتهى موعد التسليم لهذا الهاكاثون'
                    : 'تقديم الفريق غير موجود'}
                </div>
              </div>
            </div>
            {!isCompleted && (
              <Link to="/submissions/new">
                <Button block>
                  <Plus size={14} />
                  تسليم باسم الفريق
                </Button>
              </Link>
            )}
            <div className="text-xs text-ink-400 mt-3 text-center">
              سيُحتسب التسليم لكل أعضاء الفريق
            </div>
          </Card>

          {/* Danger Zone — ✨ للقائد فقط */}
          {isLeader && (
            <Card className="bg-danger-soft border-danger-border">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-danger" />
                <div className="font-bold text-danger">منطقة الخطر</div>
              </div>
              <div className="text-xs text-ink-600 dark:text-ink-300 mb-3">
                كقائد، يمكنك مغادرة الفريق. سيتم تعيين أقدم عضو كقائد جديد. لو كنت العضو الوحيد، سيُحذف الفريق نهائياً.
              </div>
              <Button
                variant="danger"
                block
                size="sm"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'مغادرة الفريق',
                    message: `هل أنت متأكد من مغادرة الفريق "${team.name}"؟`,
                    confirmText: 'مغادرة',
                    variant: 'danger',
                  })
                  if (ok) {
                    // ✨ استخدام نفس آلية إزالة العضو
                    removeMemberMutation.mutate(user!.id)
                  }
                }}
                disabled={removeMemberMutation.isPending}
              >
                <Trash2 size={14} />
                مغادرة الفريق
              </Button>
            </Card>
          )}

          {/* ✨ لغير القادة: زر مغادرة بسيط */}
          {!isLeader && (
            <Card className="bg-danger-soft border-danger-border">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-danger" />
                <div className="font-bold text-danger">مغادرة الفريق</div>
              </div>
              <Button
                variant="danger"
                block
                size="sm"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'مغادرة الفريق',
                    message: `هل أنت متأكد من مغادرة الفريق "${team.name}"؟`,
                    confirmText: 'مغادرة',
                    variant: 'danger',
                  })
                  if (ok) {
                    // ✨ P0 PATCH: استخدم navigate بدل window.location — يحافظ على SPA + cache
                    removeMemberMutation.mutate(user!.id, {
                      onSuccess: () => navigate('/teams', { replace: true }),
                    })
                  }
                }}
                disabled={removeMemberMutation.isPending}
              >
                <UserMinus size={14} />
                مغادرة الفريق
              </Button>
            </Card>
          )}
        </aside>
      </div>
    </AppShell>
  )
}
