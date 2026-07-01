import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Lightbulb, Save, X, AlertTriangle, Code, Globe, Video, Sparkles,
  CheckCircle2, Circle,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { mockGetHackathon, mockCreateProposal } from '@/lib/mockData'
import { queryKeys, proposalKeys } from '@/lib/queryClient'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function FeatureProposalBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const hackathonId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: hackathon } = useQuery({
    queryKey: queryKeys.hackathon(hackathonId),
    queryFn: () => mockGetHackathon(hackathonId),
    enabled: !!hackathonId,
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

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => mockCreateProposal(hackathonId, data),
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.hackathon(hackathonId) })
      queryClient.invalidateQueries({ queryKey: proposalKeys.mine })
      toast.success('تم إرسال اقتراحك بنجاح! 🚀')
      navigate(`/proposals/${proposal.id}`)
    },
    onError: (err: any) => toast.error(err?.message ?? 'حدث خطأ أثناء الإرسال'),
  })

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.problem_statement || !form.proposed_solution || !form.added_value) {
      toast.error('يرجى ملء كل الحقول المطلوبة')
      return
    }
    createMutation.mutate(form)
  }

  const checklist = [
    { done: !!form.title, label: 'عنوان واضح للميزة' },
    { done: !!form.problem_statement, label: 'وصف المشكلة' },
    { done: !!form.proposed_solution, label: 'الحل المقترح' },
    { done: !!form.added_value, label: 'القيمة المضافة' },
    { done: !!(form.github_url || form.live_url || form.video_url), label: 'صيغة عرض واحدة على الأقل' },
  ]

  return (
    <AppShell title="اقتراح ميزة جديدة">
      <PageHeader
        title="🚀 اقترح ميزة جديدة"
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'الهاكاثونات', to: '/hackathons' },
          { label: hackathon?.title ?? 'الهاكاثون', to: `/hackathons/${hackathonId}` },
          { label: 'اقتراح جديد' },
        ]}
        actions={
          <Link to={`/hackathons/${hackathonId}`}>
            <Button variant="ghost" size="sm"><X size={14} />إلغاء</Button>
          </Link>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-6 mb-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
      >
        <div className="absolute -top-1/3 left-0 w-1/2 h-[200%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={22} />
            <h2 className="text-xl font-bold">فرصتك لتتجاوز الـ scope المحدد</h2>
          </div>
          <p className="text-sm opacity-90 max-w-2xl leading-relaxed">
            هذه ليست مهمة عادية. فكر في مشكلة حقيقية يواجهها المستخدمون، اقترح حل مبتكر، ونفّذه.
            أفضل الاقتراحات سيتم <strong>دمجها فعلياً في النظام</strong> + ستظهر في ملفك أمام الشركات.
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        <form onSubmit={handleSubmit}>
          <Card className="mb-5">
            <CardTitle className="mb-1 flex items-center gap-2">
              <Lightbulb size={18} className="text-brand-500" />
              فكرة الميزة
            </CardTitle>
            <p className="text-sm text-ink-400 mb-5">ابدأ بفكرة واضحة وقابلة للتنفيذ</p>
            <Input
              label="عنوان الميزة"
              required
              placeholder="مثال: AI Chatbot للدعم الفني"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              hint="عنوان واضح يصف الميزة في جملة واحدة"
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
            <Button type="submit" size="lg" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <><Save size={16} />إرسال الاقتراح</>
              )}
            </Button>
            <Link to={`/hackathons/${hackathonId}`}>
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

          <Card className="bg-warning-soft border-warning-border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-warning" />
              <div className="font-semibold text-warning">نصائح للاقتراح القوي</div>
            </div>
            <ul className="text-sm text-ink-600 dark:text-ink-300 space-y-2 mt-3">
              <li>• ابدأ بمشكلة حقيقية، لا بميزة تقنية</li>
              <li>• استخدم أرقاماً ومقاييس</li>
              <li>• اشرح التقنيات لكن ركّز على القيمة</li>
              <li>• الفيديو يضاعف فرص القبول</li>
            </ul>
          </Card>
        </aside>
      </div>
    </AppShell>
  )
}
