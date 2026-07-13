import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Code, Globe, Video, ExternalLink, Pencil, Trash2,
  CheckCircle2, Star, AlertTriangle, Clock, RefreshCw, XCircle,
  Lightbulb, Target, Sparkles,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { mockGetProposal } from '@/lib/mockData'
import { proposalKeys } from '@/lib/queryClient'
import { useDeleteProposal } from '@/hooks/useProposals'
import { formatRelative, cn } from '@/lib/utils'
import { useConfirm } from '@/components/common/ConfirmDialog'

const STATUS_CONFIG: Record<string, {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'accent'
  label: string
  icon: typeof CheckCircle2
  bg: string
  text: string
}> = {
  accepted_merged: {
    variant: 'success', label: 'مقبول + مدمج في النظام', icon: CheckCircle2,
    bg: 'bg-success', text: 'text-success',
  },
  accepted_showcase: {
    variant: 'accent', label: 'مقبول للعرض فقط', icon: Star,
    bg: 'bg-brand-500', text: 'text-brand-500',
  },
  needs_revision: {
    variant: 'warning', label: 'يحتاج تعديل', icon: RefreshCw,
    bg: 'bg-warning', text: 'text-warning',
  },
  pending: {
    variant: 'info', label: 'بانتظار المراجعة', icon: Clock,
    bg: 'bg-info', text: 'text-info',
  },
  rejected: {
    variant: 'danger', label: 'مرفوض', icon: XCircle,
    bg: 'bg-danger', text: 'text-danger',
  },
}

export function FeatureProposalDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const proposalId = Number(id)
  const { user } = useAuth()
  const confirm = useConfirm()

  const { data: proposal, isLoading } = useQuery<any>({
    queryKey: proposalKeys.detail(proposalId),
    queryFn: () => mockGetProposal(proposalId),
    enabled: !!proposalId,
  })

  const deleteMutation = useDeleteProposal(proposalId)

  if (isLoading || !proposal) {
    return (
      <AppShell title="تفاصيل الاقتراح">
        <Skeleton className="h-96" />
      </AppShell>
    )
  }

  const status = STATUS_CONFIG[proposal.status]
  const StatusIcon = status.icon
  const isOwner = proposal.userId === user?.id
  const canEdit = isOwner && (proposal.status === 'pending' || proposal.status === 'needs_revision')
  const canDelete = isOwner && proposal.status === 'pending'

  const scores = [
    { name: 'Impact (الأثر)', value: proposal.impactScore, max: 10 },
    { name: 'Innovation (الابتكار)', value: proposal.innovationScore, max: 10 },
    { name: 'Execution (التنفيذ)', value: proposal.executionScore, max: 10 },
  ].filter((s) => s.value !== null)

  const avgScore = scores.length > 0
    ? (scores.reduce((sum, s) => sum + (s.value ?? 0), 0) / scores.length).toFixed(1)
    : null

  return (
    <AppShell title="تفاصيل الاقتراح">
      <PageHeader
        title={proposal.title}
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'الهاكاثونات', to: '/hackathons' },
          { label: proposal.hackathon?.title ?? 'الهاكاثون', to: `/hackathons/${proposal.hackathonId}` },
          { label: 'الاقتراح' },
        ]}
        actions={
          <>
            <Link to={`/hackathons/${proposal.hackathonId}`}>
              <Button variant="ghost" size="sm"><ArrowLeft size={14} />رجوع</Button>
            </Link>
            {/* ✨ FIX #3: زر التعديل الفعلي — كان canEdit يُحسب لكن الزر مفقود */}
            {canEdit && (
              <Link to={`/proposals/${proposalId}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil size={14} />
                  {proposal.status === 'needs_revision' ? 'تعديل وإعادة إرسال' : 'تعديل'}
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger-soft"
                onClick={async () => {
                  if (await confirm({ message: 'هل أنت متأكد من حذف هذا الاقتراح؟' })) deleteMutation.mutate()
                }}
              >
                <Trash2 size={14} />حذف
              </Button>
            )}
          </>
        }
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className={cn('w-16 h-16 rounded-md grid place-items-center text-white flex-shrink-0', status.bg)}>
              <StatusIcon size={32} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-extrabold">{proposal.title}</h1>
                <Badge variant={status.variant}>
                  <StatusIcon size={12} />
                  {status.label}
                </Badge>
              </div>
              <div className="text-sm text-ink-500">
                قُدّم {formatRelative(proposal.createdAt)}
                {proposal.reviewedAt && ` · رُوجع ${formatRelative(proposal.reviewedAt)}`}
              </div>
            </div>
            {avgScore && (
              <div className="flex flex-col items-center gap-1 p-3 bg-success-soft border border-success-border rounded-md min-w-[120px]">
                <div className="text-xs text-ink-500 uppercase">المتوسط</div>
                <div className="text-success text-3xl font-extrabold leading-none">
                  {avgScore}<span className="text-base opacity-70">/10</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        <div className="space-y-5">
          {proposal.problemStatement && (
            <Card>
              <CardTitle className="mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-warning" />
                المشكلة
              </CardTitle>
              <p className="text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
                {proposal.problemStatement}
              </p>
            </Card>
          )}

          {proposal.proposedSolution && (
            <Card>
              <CardTitle className="mb-3 flex items-center gap-2">
                <Lightbulb size={18} className="text-info" />
                الحل المقترح
              </CardTitle>
              <p className="text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
                {proposal.proposedSolution}
              </p>
            </Card>
          )}

          {proposal.addedValue && (
            <Card>
              <CardTitle className="mb-3 flex items-center gap-2">
                <Target size={18} className="text-success" />
                القيمة المضافة
              </CardTitle>
              <p className="text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
                {proposal.addedValue}
              </p>
            </Card>
          )}

          {(proposal.githubUrl || proposal.liveUrl || proposal.videoUrl || proposal.implementationNotes) && (
            <Card>
              <CardTitle className="mb-3 flex items-center gap-2">
                <Sparkles size={18} className="text-brand-500" />
                التنفيذ
              </CardTitle>
              <div className="flex flex-col gap-3 mb-4">
                {proposal.githubUrl && (
                  <a href={proposal.githubUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md hover:bg-ink-100 transition-colors">
                    <Code size={18} className="text-brand-500" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">GitHub Repository</div>
                      <div className="text-xs text-brand-500 truncate">{proposal.githubUrl}</div>
                    </div>
                    <ExternalLink size={14} className="text-ink-400" />
                  </a>
                )}
                {proposal.liveUrl && (
                  <a href={proposal.liveUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md hover:bg-ink-100 transition-colors">
                    <Globe size={18} className="text-info" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Live Demo</div>
                      <div className="text-xs text-brand-500 truncate">{proposal.liveUrl}</div>
                    </div>
                    <ExternalLink size={14} className="text-ink-400" />
                  </a>
                )}
                {proposal.videoUrl && (
                  <a href={proposal.videoUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md hover:bg-ink-100 transition-colors">
                    <Video size={18} className="text-warning" />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Demo Video</div>
                      <div className="text-xs text-brand-500 truncate">{proposal.videoUrl}</div>
                    </div>
                    <ExternalLink size={14} className="text-ink-400" />
                  </a>
                )}
              </div>
              {proposal.implementationNotes && (
                <div className="border-t border-ink-100 dark:border-ink-800 pt-4 mt-4">
                  <div className="text-xs font-semibold text-ink-400 uppercase mb-2">ملاحظات التنفيذ</div>
                  <p className="text-ink-600 dark:text-ink-300 text-sm leading-relaxed whitespace-pre-line">
                    {proposal.implementationNotes}
                  </p>
                </div>
              )}
            </Card>
          )}

          {proposal.adminFeedback && (
            <Card className={proposal.status === 'rejected' ? 'bg-danger-soft border-danger-border' : 'bg-success-soft border-success-border'}>
              <CardTitle className="mb-3 flex items-center gap-2">
                <Avatar name={proposal.reviewedByUser?.name ?? 'Admin'} size="sm" />
                ملاحظات المسؤول
              </CardTitle>
              <div className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
                {proposal.adminFeedback}
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-5">
          {scores.length > 0 && (
            <Card>
              <CardTitle className="mb-4">تقييم المسؤول</CardTitle>
              <div className="flex flex-col gap-4">
                {scores.map((score) => (
                  <div key={score.name}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold">{score.name}</span>
                      <span className="font-bold text-success">{score.value}/10</span>
                    </div>
                    <Progress value={(score.value ?? 0) * 10} variant="success" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {proposal.hackathon && (
            <Card>
              <CardTitle className="mb-4">الهاكاثون</CardTitle>
              <div className="p-3 bg-ink-50 dark:bg-ink-800/50 rounded-md">
                <div className="font-semibold mb-1">{proposal.hackathon.title}</div>
                <Link to={`/hackathons/${proposal.hackathonId}`}>
                  <Button variant="secondary" size="sm" block>عرض الهاكاثون</Button>
                </Link>
              </div>
            </Card>
          )}

          {proposal.user && (
            <Card>
              <CardTitle className="mb-4">صاحب الاقتراح</CardTitle>
              <div className="flex items-center gap-3">
                <Avatar name={proposal.user.name} size="md" />
                <div>
                  <div className="font-semibold">{proposal.user.name}</div>
                  <div className="text-xs text-ink-400">{proposal.user.email}</div>
                </div>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </AppShell>
  )
}
