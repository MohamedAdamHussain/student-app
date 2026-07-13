import { useState, type FormEvent, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Save, X, AlertTriangle, Code, Globe, Video,
  CheckCircle2, Circle, RefreshCw,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { mockGetProposal } from '@/lib/mockData'
import { proposalKeys } from '@/lib/queryClient'
import { useUpdateProposal } from '@/hooks/useProposals'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/**
 * ✨ FIX #3: صفحة تعديل اقتراح ميزة (كانت مفقودة بالكامل).
 * الـ backend يدعم PUT /proposals/{proposal} لكنه لم يكن مُستخدماً.
 * تُستخدم عند:
 * - الطالب يريد تعديل اقتراح pending قبل المراجعة
 * - الأدمن ردّه بـ needs_revision والطالب عاد ليعدّله
 */
export function FeatureProposalEditPage() {
  const { id } = useParams<{ id: string }>()
  const proposalId = Number(id)

  const { data: proposal, isLoading } = useQuery({
    queryKey: proposalKeys.detail(proposalId),
    queryFn: () => mockGetProposal(proposalId),
    enabled: !!proposalId,
  })

  const [form, setForm] = useState({
    title: '',
    problem_statement: '',
    proposed_solution: '',
    added_value: '',
    github_url: '',
    live_url: '',
    video_url: '',
    implementation_notes: '',
  })

  // ✨ تعبئة الفورم ببيانات الاقتراح الحالية بعد تحميلها
  useEffect(() => {
    if (proposal) {
      setForm({
        title: proposal.title ?? '',
        problem_statement: proposal.problemStatement ?? '',
        proposed_solution: proposal.proposedSolution ?? '',
        added_value: proposal.addedValue ?? '',
        github_url: proposal.githubUrl ?? '',
        live_url: proposal.liveUrl ?? '',
        video_url: proposal.videoUrl ?? '',
        implementation_notes: proposal.implementationNotes ?? '',
      })
    }
  }, [proposal])

  const updateMutation = useUpdateProposal(proposalId)

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.problem_statement || !form.proposed_solution || !form.added_value) {
      toast.error('يرجى ملء كل الحقول المطلوبة')
      return
    }
    updateMutation.mutate(form)
  }

  const checklist = [
    { done: !!form.title, label: 'عنوان واضح للميزة' },
    { done: !!form.problem_statement, label: 'وصف المشكلة' },
    { done: !!form.proposed_solution, label: 'الحل المقترح' },
    { done: !!form.added_value, label: 'القيمة المضافة' },
    { done: !!(form.github_url || form.live_url || form.video_url), label: 'صيغة عرض واحدة على الأقل' },
  ]

  if (isLoading || !proposal) {
    return (
      <AppShell title="تعديل الاقتراح">
        <Skeleton className="h-96" />
      </AppShell>
    )
  }

  const isNeedsRevision = proposal.status === 'needs_revision'

  return (
    <AppShell title="تعديل الاقتراح">
      <PageHeader
        title="✏️ تعديل الاقتراح"
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'الهاكاثونات', to: '/hackathons' },
          { label: proposal.hackathon?.title ?? 'الهاكاثون', to: `/hackathons/${proposal.hackathonId}` },
          { label: proposal.title ?? 'الاقتراح', to: `/proposals/${proposalId}` },
          { label: 'تعديل' },
        ]}
        actions={
          <Link to={`/proposals/${proposalId}`}>
            <Button variant="ghost" size="sm"><X size={14} />إلغاء</Button>
          </Link>
        }
      />

      {isNeedsRevision && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 mb-6 border border-warning-border bg-warning-soft flex items-start gap-3"
        >
          <RefreshCw size={20} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-warning mb-1">هذا الاقتراح يحتاج تعديلات</div>
            {proposal.adminFeedback ? (
              <p className="text-sm text-ink-600 dark:text-ink-300 whitespace-pre-line">
                <strong>ملاحظات الأدمن:</strong> {proposal.adminFeedback}
              </p>
            ) : (
              <p className="text-sm text-ink-600 dark:text-ink-300">
                عُدّل الاقتراح حسب الملاحظات ثم أعد إرساله للمراجعة.
              </p>
            )}
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-5">
          <CardTitle className="mb-1">📌 عنوان الاقتراح</CardTitle>
          <p className="text-sm text-ink-400 mb-5">عنوان موجز يصف الميزة المقترحة</p>
          <Input
            required
            placeholder="مثال: إضافة بحث ذكي بالـ AI لقسم الأسئلة الشائعة"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </Card>

        <Card className="mb-5">
          <CardTitle className="mb-1">📝 المشكلة والحل</CardTitle>
          <p className="text-sm text-ink-400 mb-5">اشرح لماذا هذه الميزة مهمة وكيف تحل المشكلة</p>

          <Textarea
            label="ما المشكلة التي تحلها؟"
            required
            rows={4}
            placeholder="مثال: المستخدمون يواجهون صعوبة في العثور على المعلومات بسرعة..."
            value={form.problem_statement}
            onChange={(e) => set('problem_statement', e.target.value)}
            hint="كن محدداً - استخدم أرقام إن أمكن"
          />

          <Textarea
            label="كيف تحلها؟ (الحل المقترح)"
            required
            rows={5}
            placeholder="مثال: بناء chatbot ذكي باستخدام OpenAI GPT-4..."
            value={form.proposed_solution}
            onChange={(e) => set('proposed_solution', e.target.value)}
            hint="اشرح التقنيات + الميزات الرئيسية"
          />

          <Textarea
            label="لماذا تستحق الإضافة؟ (Added Value)"
            required
            rows={4}
            placeholder="مثال: تقليل وقت الاستجابة 95%، زيادة رضا المستخدمين 30%..."
            value={form.added_value}
            onChange={(e) => set('added_value', e.target.value)}
            hint="اربطها بأرقام/نسب متوقعة"
          />
        </Card>

        <Card className="mb-5">
          <CardTitle className="mb-1">🔗 روابط التنفيذ</CardTitle>
          <p className="text-sm text-ink-400 mb-5">على الأقل رابط واحد مطلوب</p>

          <div className="relative">
            <Input
              label="GitHub Repository"
              type="url"
              placeholder="https://github.com/username/feature-name"
              value={form.github_url}
              onChange={(e) => set('github_url', e.target.value)}
            />
            <Code size={16} className="absolute left-3 top-[38px] text-ink-400" />
          </div>

          <div className="relative">
            <Input
              label="Live Demo"
              type="url"
              placeholder="https://my-feature.demo.com"
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
              hint="فيديو 3-5 دقائق يشرح الميزة"
            />
            <Video size={16} className="absolute left-3 top-[38px] text-ink-400" />
          </div>

          <Textarea
            label="ملاحظات التنفيذ (اختياري)"
            rows={3}
            placeholder="مثال: استخدمت LangChain للـ RAG..."
            value={form.implementation_notes}
            onChange={(e) => set('implementation_notes', e.target.value)}
          />
        </Card>

        <div className="flex gap-3 mb-6">
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
          <Link to={`/proposals/${proposalId}`}>
            <Button type="button" variant="secondary" size="lg">إلغاء</Button>
          </Link>
        </div>
      </form>

      <aside className="space-y-5">
        <Card>
          <CardTitle className="mb-4">قائمة التحقق</CardTitle>
          <div className="flex flex-col gap-3">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle2 size={18} className="text-success" />
                ) : (
                  <Circle size={18} className="text-ink-300" />
                )}
                <span className={cn('text-sm', item.done ? 'text-ink-700 dark:text-ink-200' : 'text-ink-400')}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {isNeedsRevision && (
          <Card className="bg-warning-soft border-warning-border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-warning" />
              <div className="font-semibold text-warning">حالة الاقتراح الحالية</div>
            </div>
            <Badge variant="warning">يحتاج تعديل</Badge>
            <p className="text-sm text-ink-600 dark:text-ink-300 mt-3">
              بعد الحفظ، سيعود الاقتراح لحالة "بانتظار المراجعة" ليطّلع عليه الأدمن من جديد.
            </p>
          </Card>
        )}
      </aside>
    </AppShell>
  )
}
