import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CheckCircle2, Star, Code, Globe, Video, FileText, Download,
  ExternalLink, Pencil, Share2, Award, Clock, ArrowLeft, History,
  AlertTriangle,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { mockGetSubmission } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { formatRelative, cn } from '@/lib/utils'
import { assetUrl } from '@/lib/api'
import { toast } from 'sonner'
import { TeamMembersCard, MyContributionBanner } from './TeamMembersCard'
import type { AuditLog, User } from '@/types'

// =====================================================
// ✨ P1-C PATCH: SubmissionDetailsPage
// =====================================================
// التغييرات:
//   1) P1: معالجة 403 — لو طالب حاول /submissions/123 لتقديم لا يملكه،
//      يرى skeleton للأبد. الآن: يعرض رسالة "غير مصرح" واضحة.
//   2) P1: حذف hardcoded "90Soft Admin" في بطاقة "ملاحظات المسؤول" —
//      استخدام reviewerName(log) مثلما فعل في بطاقة "راجعه".
//   3) P1-A: حذف 'final' من badges — كل المهام 'hw' فقط.

function reviewerName(log?: AuditLog): string | undefined {
  if (!log) return undefined
  const fromUser = log.changedByUser
  if (fromUser) return fromUser.name
  const changedBy = log.changedBy
  if (typeof changedBy === 'object' && changedBy !== null) return (changedBy as User).name
  return undefined
}

export function SubmissionDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number(id)

  const { data: submission, isLoading, error } = useQuery({
    queryKey: queryKeys.submission(submissionId),
    queryFn: () => mockGetSubmission(submissionId),
    enabled: !!submissionId,
  })

  // ✨ P1 PATCH: معالجة 403 — الـ backend يرفض رؤية تقديم لا يملكه الطالب (منع IDOR).
  // قبل: كانت الصفحة تعرض skeleton إلى الأبد للزائر غير المصرّح.
  if (isLoading) {
    return (
      <AppShell title="تفاصيل التقديم">
        <Skeleton className="h-96" />
      </AppShell>
    )
  }

  // ✨ P1 PATCH: معالجة الأخطاء (403 / 404 / شبكة)
  if (error || !submission) {
    const status = (error as { response?: { status?: number } })?.response?.status
    const isForbidden = status === 403
    const isNotFound = status === 404
    return (
      <AppShell title="تفاصيل التقديم">
        <Card className="max-w-lg mx-auto mt-10 text-center">
          <AlertTriangle
            size={36}
            className={cn(
              'mx-auto mb-3',
              isForbidden ? 'text-warning' : isNotFound ? 'text-ink-400' : 'text-danger',
            )}
          />
          <h2 className="text-lg font-bold mb-2">
            {isForbidden ? 'لا يمكن عرض هذا التقديم' : isNotFound ? 'التقديم غير موجود' : 'تعذّر تحميل التقديم'}
          </h2>
          <p className="text-sm text-ink-400 mb-5">
            {isForbidden
              ? 'هذا التقديم خاص بطالب آخر. لا يمكنك رؤية تقديمات غيرك.'
              : isNotFound
                ? 'ربما حُذف التقديم أو أن الرابط غير صحيح.'
                : 'تعذّر تحميل بيانات التقديم. تحقق من اتصالك وحاول مرة أخرى.'}
          </p>
          <Link to="/submissions">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={14} />
              العودة للتقديمات
            </Button>
          </Link>
        </Card>
      </AppShell>
    )
  }

  const isAccepted = submission.status === 'accepted'
  const title = submission.task?.title ?? submission.hackathon?.title ?? 'تقديم'
  const statusBadge = {
    accepted: <Badge variant="success"><CheckCircle2 size={12} /> مقبول{submission.isFeatured && ' · مميّز ⭐'}</Badge>,
    pending: <Badge variant="warning"><Clock size={12} /> معلّق</Badge>,
    rejected: <Badge variant="danger">مرفوض</Badge>,
  }[submission.status]

  // ✨ P1 PATCH: استخدم اسم الـ reviewer من audit log (كان hardcoded "90Soft Admin")
  const reviewedLog = submission.auditLogs?.find(
    (log) => log.action === 'reviewed' || log.action === 'score_updated',
  )
  const reviewer = reviewerName(reviewedLog)

  return (
    <AppShell title="تفاصيل التقديم">
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'تقديماتي', to: '/submissions' },
          { label: title },
        ]}
        actions={
          <>
            <Link to="/submissions">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={14} />
                رجوع
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => { const url = assetUrl(submission.fileUrl ?? submission.filePath); if (url) window.open(url, "_blank"); }}>
              <Download size={14} />
              تحميل
            </Button>
          </>
        }
      />

      <MyContributionBanner submission={submission} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-14 h-14 rounded-md grid place-items-center flex-shrink-0',
                isAccepted ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning',
              )}>
                <CheckCircle2 size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl font-extrabold">{title}</h1>
                  {/* ✨ P1-A: حذف 'final' branch — Hackathon أو HW فقط */}
                  <Badge variant={submission.hackathon ? 'warning' : 'info'}>
                    {submission.hackathon ? 'Hackathon' : 'HW'}
                  </Badge>
                  {statusBadge}
                </div>
                <div className="text-sm text-ink-500">
                  قُدِّم {formatRelative(submission.createdAt)} · {submission.teamId ? 'فِرقي' : 'فردي'}
                </div>
              </div>
            </div>

            {submission.score && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="flex flex-col items-center gap-1 p-3 bg-success-soft border border-success-border rounded-md min-w-[120px]"
              >
                <div className="text-xs text-ink-500 uppercase">الدرجة النهائية</div>
                <div className="text-success text-3xl font-extrabold leading-none">
                  {submission.score!.toFixed(1)}
                  <span className="text-base opacity-70">/10</span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="border-t border-ink-100 dark:border-ink-800 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-ink-400 mb-1 uppercase">المهمة</div>
              {submission.task ? (
                <Link to={`/tasks/${submission.task.id}`} className="font-semibold text-brand-500">
                  {submission.task.title.substring(0, 30)}...
                </Link>
              ) : (
                <span className="text-ink-400">هاكاثون</span>
              )}
            </div>
            <div>
              <div className="text-xs text-ink-400 mb-1 uppercase">راجعه</div>
              <div className="font-semibold">{reviewer ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-ink-400 mb-1 uppercase">تاريخ المراجعة</div>
              <div className="font-semibold">
                {reviewedLog?.createdAt ? formatRelative(reviewedLog.createdAt) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-ink-400 mb-1 uppercase">الحالة</div>
              {statusBadge}
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Left */}
        <div className="space-y-5">
          {/* Submitted Content */}
          <Card>
            <CardTitle className="mb-4">محتوى التقديم</CardTitle>
            <div className="flex flex-col gap-3">
              {submission.githubUrl && (
                <SubmissionLink
                  icon={<Code size={18} />}
                  label="GitHub Repository"
                  url={submission.githubUrl}
                  color="bg-brand-50 dark:bg-brand-900/20 text-brand-500"
                  actionLabel="فتح"
                />
              )}
              {submission.liveUrl && (
                <SubmissionLink
                  icon={<Globe size={18} />}
                  label="Live Deployment"
                  url={submission.liveUrl}
                  color="bg-info-soft text-info"
                  actionLabel="فتح"
                />
              )}
              {submission.videoUrl && (
                <SubmissionLink
                  icon={<Video size={18} />}
                  label="Demo Video"
                  url={submission.videoUrl}
                  color="bg-warning-soft text-warning"
                  actionLabel="تشغيل"
                />
              )}
              {submission.filePath && (
                <SubmissionLink
                  icon={<FileText size={18} />}
                  label="ملف مرفق"
                  url={assetUrl(submission.fileUrl ?? submission.filePath) ?? '#'}
                  color="bg-danger-soft text-danger"
                  actionLabel="تحميل"
                />
              )}
            </div>

            {submission.notes && (
              <div className="border-t border-ink-100 dark:border-ink-800 mt-4 pt-4">
                <div className="text-xs font-semibold text-ink-400 uppercase mb-2">
                  ملاحظاتي للمُقيِّم
                </div>
                <p className="text-ink-600 dark:text-ink-300 text-sm leading-relaxed">
                  {submission.notes}
                </p>
              </div>
            )}
          </Card>

          <TeamMembersCard submission={submission} />

          {/* Skill Scores */}
          {submission.skillScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>تقييم المهارات</CardTitle>
                <Badge variant="success">{submission.skillScores.length} مهارات مُقيَّمة</Badge>
              </CardHeader>
              <div className="flex flex-col gap-4">
                {submission.skillScores.map((ss) => (
                  <div key={ss.id}>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{ss.skill.name}</span>
                        <Badge variant="neutral">
                          {ss.skill.type === 'technical' ? 'تقنية' : 'شخصية'}
                        </Badge>
                      </div>
                      <span className="font-bold text-success">{ss.score.toFixed(1)}/10</span>
                    </div>
                    <Progress value={ss.score * 10} variant="success" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ✨ P1 PATCH: Reviewer Notes — استخدم reviewer name بدل "90Soft Admin" */}
          {reviewedLog?.notes && (
            <Card>
              <CardTitle className="mb-4">ملاحظات المسؤول</CardTitle>
              <div className="flex items-start gap-3">
                <Avatar name={reviewer ?? 'المسؤول'} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">{reviewer ?? 'المسؤول'}</span>
                    <span className="text-xs text-ink-400">
                      · راجع {reviewedLog.createdAt && formatRelative(reviewedLog.createdAt)}
                    </span>
                  </div>
                  <div className="p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md text-sm leading-relaxed whitespace-pre-line">
                    {reviewedLog.notes}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Audit Log */}
          {submission.auditLogs && submission.auditLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>سجل التغييرات (Audit Log)</CardTitle>
                <Badge variant="neutral">{submission.auditLogs.length} أحداث</Badge>
              </CardHeader>
              <div className="flex flex-col gap-4">
                {submission.auditLogs.map((log, i) => {
                  const isFirst = i === 0
                  const isLast = i === submission.auditLogs!.length - 1
                  return (
                    <div key={log.id} className="flex gap-3">
                      <div className={cn(
                        'w-7 h-7 rounded-full grid place-items-center flex-shrink-0 text-xs',
                        log.action === 'reviewed' && log.newStatus === 'accepted'
                          ? 'bg-success text-white'
                          : log.action === 'submitted'
                          ? 'bg-info text-white'
                          : 'bg-ink-100 dark:bg-ink-800 text-ink-400 border-2 border-ink-200 dark:border-ink-700',
                      )}>
                        {log.action === 'reviewed' ? <CheckCircle2 size={14} /> : <History size={14} />}
                      </div>
                      <div className={cn(!isLast && 'pb-3')}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm">
                            {log.action === 'reviewed' && log.newStatus === 'accepted' && 'تمت المراجعة وقُبل التقديم'}
                            {log.action === 'reviewed' && log.newStatus === 'rejected' && 'تمت المراجعة ورُفض التقديم'}
                            {log.action === 'submitted' && 'تم تسليم المشروع'}
                          </span>
                          {log.newScore && (
                            <Badge variant="success">الدرجة: {log.newScore.toFixed(1)}/10</Badge>
                          )}
                          {log.action === 'reviewed' && submission.isFeatured && isFirst && (
                            <Badge variant="accent">مميّز ⭐</Badge>
                          )}
                        </div>
                        <div className="text-xs text-ink-400">
                          بواسطة {reviewerName(log) ?? '—'} · {formatRelative(log.createdAt)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right */}
        <aside className="space-y-5">
          <Card className={cn(
            isAccepted
              ? 'bg-success-soft border-success-border'
              : submission.status === 'pending'
              ? 'bg-warning-soft border-warning-border'
              : 'bg-danger-soft border-danger-border',
          )}>
            <div className="text-center">
              <div className={cn(
                'w-14 h-14 rounded-full grid place-items-center mx-auto mb-3 text-white',
                isAccepted ? 'bg-success' : submission.status === 'pending' ? 'bg-warning' : 'bg-danger',
              )}>
                {isAccepted ? <Award size={28} /> : <Clock size={28} />}
              </div>
              <div className={cn(
                'font-bold mb-1',
                isAccepted ? 'text-success' : submission.status === 'pending' ? 'text-warning' : 'text-danger',
              )}>
                {isAccepted ? `مقبول${submission.isFeatured ? ' · مميّز ⭐' : ''}` : submission.status === 'pending' ? 'معلّق' : 'مرفوض'}
              </div>
              <div className="text-sm text-ink-600 dark:text-ink-300">
                {isAccepted ? 'تم قبول تقديمك وإضافته لـ Showcase' : submission.status === 'pending' ? 'بانتظار المراجعة' : 'راجع ملاحظات المسؤول'}
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">إجراءات</CardTitle>
            <div className="flex flex-col gap-2">
              {submission.status === 'pending' && (
                <Link to={`/submissions/${submission.id}/edit`}>
                  <Button variant="secondary" block>
                    <Pencil size={14} />
                    تعديل التقديم
                  </Button>
                </Link>
              )}
              {submission.status !== 'pending' && (
                <Button variant="secondary" block disabled>
                  <Pencil size={14} />
                  التعديل متاح فقط قبل المراجعة
                </Button>
              )}
              {isAccepted && (
                <Link to="/profile/edit" state={{ preselectFeaturedId: submission.id }}>
                  <Button block>
                    <Star size={14} />
                    جعله المشروع المميز
                  </Button>
                </Link>
              )}
              <Button variant="ghost" block onClick={() => {
                  const url = window.location.href
                  if (navigator.share) {
                    navigator.share({ title: 'تقديم GradShow', url }).catch(() => {})
                  } else {
                    navigator.clipboard?.writeText(url).then(() => toast.success('تم نسخ الرابط')).catch(() => toast.info(url))
                  }
                }}>
                <Share2 size={14} />
                مشاركة الرابط
              </Button>
            </div>
          </Card>

          {submission.task && (
            <Card>
              <CardTitle className="mb-4">معلومات المهمة</CardTitle>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-500">العنوان</span>
                  <Link to={`/tasks/${submission.task.id}`} className="font-semibold text-brand-500">
                    {submission.task.title.substring(0, 20)}...
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">النوع</span>
                  {/* ✨ P1-A: حذف 'final' branch */}
                  <Badge variant="info">HW</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">نوع العمل</span>
                  <span className="font-semibold">{submission.task.isTeam ? 'فِرقي' : 'فردي'}</span>
                </div>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </AppShell>
  )
}

function SubmissionLink({
  icon, label, url, color, actionLabel,
}: {
  icon: React.ReactNode
  label: string
  url: string
  color: string
  actionLabel: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md">
      <div className={cn('w-10 h-10 rounded-md grid place-items-center flex-shrink-0', color)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-brand-500 truncate">{url}</div>
      </div>
      <a href={url} target="_blank" rel="noreferrer">
        <Button variant="secondary" size="sm">
          {actionLabel}
          <ExternalLink size={12} />
        </Button>
      </a>
    </div>
  )
}
