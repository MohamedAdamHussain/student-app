import { useState, type FormEvent, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Save, X, Code, Globe, Video, AlertTriangle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { mockGetSubmission } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { useUpdateSubmission } from '@/hooks/useSubmissions'

export function SubmissionEditPage() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number(id)

  const { data: submission, isLoading } = useQuery({
    queryKey: queryKeys.submission(submissionId),
    queryFn: () => mockGetSubmission(submissionId),
    enabled: !!submissionId,
  })

  const [form, setForm] = useState({
    github_url: '',
    live_url: '',
    video_url: '',
    notes: '',
  })

  // ✨ تعبئة الفورم ببيانات التقديم الحالية
  useEffect(() => {
    if (submission) {
      setForm({
        github_url: submission.githubUrl ?? '',
        live_url: submission.liveUrl ?? '',
        video_url: submission.videoUrl ?? '',
        notes: submission.notes ?? '',
      })
    }
  }, [submission])

  const updateMutation = useUpdateSubmission(submissionId)

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(form)
  }

  if (isLoading || !submission) {
    return (
      <AppShell title="تعديل التقديم">
        <div className="space-y-4">
          <div className="skeleton h-12" />
          <div className="skeleton h-64" />
        </div>
      </AppShell>
    )
  }

  // ✨ منع التعديل لو مش pending
  if (submission.status !== 'pending') {
    return (
      <AppShell title="تعديل التقديم">
        <Card className="bg-warning-soft border-warning-border">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={24} className="text-warning" />
            <div className="font-bold text-warning">لا يمكن التعديل</div>
          </div>
          <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
            هذا التقديم تمت مراجعته ({submission.status === 'accepted' ? 'مقبول' : 'مرفوض'}).
            التعديل متاح فقط للتقديمات المعلّقة.
          </p>
          <Link to={`/submissions/${submissionId}`}>
            <Button variant="secondary">العودة للتقديم</Button>
          </Link>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell title="تعديل التقديم">
      <PageHeader
        title="تعديل التقديم"
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'تقديماتي', to: '/submissions' },
          { label: submission.task?.title ?? submission.hackathon?.title ?? 'تقديم', to: `/submissions/${submissionId}` },
          { label: 'تعديل' },
        ]}
        actions={
          <Link to={`/submissions/${submissionId}`}>
            <Button variant="ghost" size="sm"><X size={14} />إلغاء</Button>
          </Link>
        }
      />

      {/* Info Banner */}
      <Card className="mb-6 bg-info-soft border-info-border">
        <div className="flex items-center gap-3">
          <Badge variant="info">معلّق</Badge>
          <div className="text-sm text-ink-600 dark:text-ink-300">
            يمكنك تعديل روابطك وملاحظاتك. بمجرد أن يراجع المسؤول التقديم، لن تتمكن من التعديل.
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card className="mb-5">
          <CardTitle className="mb-1">تعديل الروابط والمحتوى</CardTitle>
          <p className="text-sm text-ink-400 mb-5">حدّث ما تريد تعديله</p>

          <div className="relative">
            <Input
              label="GitHub Repository"
              type="url"
              placeholder="https://github.com/username/project-name"
              value={form.github_url}
              onChange={(e) => set('github_url', e.target.value)}
            />
            <Code size={16} className="absolute left-3 top-[38px] text-ink-400" />
          </div>

          <div className="relative">
            <Input
              label="Live Demo"
              type="url"
              placeholder="https://myproject.vercel.app"
              value={form.live_url}
              onChange={(e) => set('live_url', e.target.value)}
            />
            <Globe size={16} className="absolute left-3 top-[38px] text-ink-400" />
          </div>

          <div className="relative">
            <Input
              label="Demo Video"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={form.video_url}
              onChange={(e) => set('video_url', e.target.value)}
            />
            <Video size={16} className="absolute left-3 top-[38px] text-ink-400" />
          </div>

          <Textarea
            label="ملاحظات للمُقيِّم"
            rows={3}
            placeholder="أي ملاحظات تود إخبار المسؤول عنها؟"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Card>

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <><Save size={16} />حفظ التعديلات</>
            )}
          </Button>
          <Link to={`/submissions/${submissionId}`}>
            <Button type="button" variant="secondary" size="lg">إلغاء</Button>
          </Link>
        </div>
      </form>
    </AppShell>
  )
}
