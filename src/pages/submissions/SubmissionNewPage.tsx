import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Code, Globe, Video, FileText, Upload, AlertTriangle,
  Save, X, CheckCircle2, Circle, Calendar,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { mockGetTasks, mockGetHackathons, mockGetTeams, mockCreateSubmission } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function SubmissionNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: tasks } = useQuery({ queryKey: queryKeys.tasks, queryFn: mockGetTasks })
  const { data: hackathons } = useQuery({ queryKey: queryKeys.hackathons, queryFn: mockGetHackathons })
  const { data: teams } = useQuery({ queryKey: queryKeys.teams, queryFn: mockGetTeams })

  const [type, setType] = useState<'task' | 'hackathon'>('task')
  const [taskId, setTaskId] = useState('')
  const [hackathonId, setHackathonId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [notes, setNotes] = useState('')

  const selectedTask = tasks?.find((t) => t.id === Number(taskId))
  const videoRequired = type === 'task' && selectedTask?.video_required

  const createMutation = useMutation({
    mutationFn: mockCreateSubmission,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
      toast.success('تم إنشاء التقديم بنجاح ✓')
      navigate(`/submissions/${data.id}`)
    },
    onError: () => toast.error('حدث خطأ أثناء الإنشاء'),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    // Validation
    if (type === 'task' && !taskId) {
      toast.error('اختر مهمة للتسليم عليها')
      return
    }
    if (type === 'hackathon' && !hackathonId) {
      toast.error('اختر هاكاثوناً للتسليم عليه')
      return
    }
    if (!githubUrl && !liveUrl && !videoUrl) {
      toast.error('يجب تقديم صيغة واحدة على الأقل')
      return
    }
    if (videoRequired && !videoUrl) {
      toast.error('هذه المهمة تتطلب رابط فيديو')
      return
    }

    createMutation.mutate({
      task_id: type === 'task' ? Number(taskId) : null,
      hackathon_id: type === 'hackathon' ? Number(hackathonId) : null,
      team_id: teamId ? Number(teamId) : null,
      github_url: githubUrl || null,
      live_url: liveUrl || null,
      video_url: videoUrl || null,
      notes: notes || null,
    })
  }

  // Checklist
  const checklist = [
    { done: !!(type === 'task' ? taskId : hackathonId), label: 'اخترت مهمة أو هاكاثون' },
    { done: !!(githubUrl || liveUrl), label: 'صيغة واحدة على الأقل (GitHub, Live)' },
    { done: !videoRequired || !!videoUrl, label: 'فيديو إلزامي', required: videoRequired },
  ]

  return (
    <AppShell title="تقديم جديد">
      <PageHeader
        title="تقديم جديد"
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'تقديماتي', to: '/submissions' },
          { label: 'جديد' },
        ]}
        actions={
          <Link to="/submissions">
            <Button variant="ghost" size="sm">
              <X size={14} />
              إلغاء
            </Button>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Type selector */}
          <Card className="mb-5">
            <CardTitle className="mb-1">اختر ما تُسلِّم عليه</CardTitle>
            <p className="text-sm text-ink-400 mb-4">اختر إما مهمة أو هاكاثون — وليس الاثنين معاً</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('task')}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all border-2 text-right',
                  type === 'task'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-ink-200 dark:border-ink-800 hover:border-ink-300',
                )}
              >
                <input type="radio" checked={type === 'task'} onChange={() => {}} className="text-brand-500" />
                <div>
                  <div className="font-semibold text-sm">مهمة (Task)</div>
                  <div className="text-xs text-ink-400">HW أو Final Project</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType('hackathon')}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all border-2 text-right',
                  type === 'hackathon'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-ink-200 dark:border-ink-800 hover:border-ink-300',
                )}
              >
                <input type="radio" checked={type === 'hackathon'} onChange={() => {}} className="text-brand-500" />
                <div>
                  <div className="font-semibold text-sm">هاكاثون</div>
                  <div className="text-xs text-ink-400">مسابقة جماعية</div>
                </div>
              </button>
            </div>

            <div className="mt-5">
              {type === 'task' ? (
                <Select
                  label="المهمة"
                  required
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                >
                  <option value="" disabled>اختر المهمة</option>
                  {tasks?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.type === 'final' ? 'Final' : 'HW'})
                    </option>
                  ))}
                </Select>
              ) : (
                <Select
                  label="الهاكاثون"
                  required
                  value={hackathonId}
                  onChange={(e) => setHackathonId(e.target.value)}
                >
                  <option value="" disabled>اختر الهاكاثون</option>
                  {hackathons?.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </Card>

          {/* Team */}
          <Card className="mb-5">
            <div className="flex items-center justify-between mb-1">
              <CardTitle>الفريق (اختياري)</CardTitle>
              <Badge variant="info">للمهام الجماعية فقط</Badge>
            </div>
            <p className="text-sm text-ink-400 mb-4">
              اختر فريقك إن كانت المهمة جماعية، أو اتركها فارغة للتسليم الفردي
            </p>
            <Select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              hint={
                <>
                  إذا لم تكن عضواً في فريق بعد،{' '}
                  <Link to="/teams" className="text-brand-500">أنشئ فريقاً جديداً</Link>
                </>
              }
            >
              <option value="">تسليم فردي (بدون فريق)</option>
              {teams?.filter((t) => t.teamable_id === (Number(taskId) || Number(hackathonId))).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.teamMembers.length} أعضاء)
                </option>
              ))}
            </Select>
          </Card>

          {/* Submission formats */}
          <Card className="mb-5">
            <CardTitle className="mb-1">روابط ومحتوى التقديم</CardTitle>
            <p className="text-sm text-ink-400 mb-4">
              على الأقل صيغة واحدة مطلوبة
              {videoRequired && <span className="text-danger font-semibold"> + الفيديو الإلزامي</span>}
            </p>

            <Input
              label="GitHub URL"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/project-name"
            />

            <Input
              label="Live URL (Deployment)"
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://myproject.vercel.app"
            />

            {/* File upload (decorative) */}
            <div className="mb-5">
              <label className="block text-[13px] font-semibold mb-1.5">ملف مرفق (PDF, ZIP)</label>
              <div className="border-2 border-dashed border-ink-300 dark:border-ink-700 rounded-md p-5 text-center cursor-pointer hover:border-brand-500 transition-colors">
                <Upload size={20} className="mx-auto mb-2 text-ink-400" />
                <div className="text-sm font-semibold mb-1">اسحب الملف هنا أو اضغط للاختيار</div>
                <div className="text-xs text-ink-400">PDF, ZIP · حد أقصى 10MB</div>
              </div>
            </div>

            <Input
              label={videoRequired ? 'رابط الفيديو (إلزامي للمشاريع النهائية)' : 'رابط الفيديو'}
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required={videoRequired}
              hint={videoRequired ? 'هذه المهمة تتطلب فيديو (5-10 دقائق)' : undefined}
            />

            <Textarea
              label="ملاحظات للمُقيِّم (اختياري)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات تود إخبار المسؤول عنها؟ تحديات واجهتها، ميزات إضافية بنيتها..."
              rows={3}
            />
          </Card>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button type="submit" size="lg" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جاري التسليم...
                </>
              ) : (
                <>
                  <Save size={16} />
                  تسليم نهائي
                </>
              )}
            </Button>
            <Button type="button" variant="secondary" size="lg">حفظ كمسودة</Button>
            <Link to="/submissions">
              <Button type="button" variant="ghost" size="lg">إلغاء</Button>
            </Link>
          </div>
        </form>

        {/* Right Sidebar */}
        <aside className="space-y-5">
          {/* Selected Task Summary */}
          {selectedTask && (
            <Card>
              <CardTitle className="mb-4">المهمة المختارة</CardTitle>
              <div className="p-3 bg-warning-soft border border-warning-border rounded-md">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={selectedTask.type === 'final' ? 'warning' : 'info'}>
                    {selectedTask.type === 'final' ? 'Final' : 'HW'}
                  </Badge>
                  {selectedTask.video_required && (
                    <Badge variant="info">فيديو إلزامي</Badge>
                  )}
                </div>
                <div className="font-semibold mb-1">{selectedTask.title}</div>
                <div className="text-xs text-ink-400 mb-3 flex items-center gap-1">
                  <Calendar size={12} />
                  ينتهي {selectedTask.batch?.end_date}
                </div>
                <Link to={`/tasks/${selectedTask.id}`}>
                  <Button variant="secondary" size="sm" block>عرض تفاصيل المهمة</Button>
                </Link>
              </div>

              <div className="text-xs font-semibold text-ink-400 uppercase mt-4 mb-3">
                المهارات المُقيَّمة
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTask.skills.map((s) => (
                  <Badge key={s.id} variant="neutral">{s.name}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Checklist */}
          <Card>
            <CardTitle className="mb-4">قائمة التحقق</CardTitle>
            <div className="flex flex-col gap-3">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 size={18} className="text-success" />
                  ) : (
                    <Circle size={18} className={item.required ? 'text-danger' : 'text-ink-300'} />
                  )}
                  <span className={cn(
                    'text-sm',
                    item.required && !item.done && 'text-danger font-semibold',
                    !item.done && !item.required && 'text-ink-400',
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Warning */}
          <Card className="bg-warning-soft border-warning-border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-warning" />
              <div className="font-semibold text-warning">تنبيه</div>
            </div>
            <div className="text-sm text-ink-600 dark:text-ink-300">
              لا يمكن تعديل التقديم بعد إرساله إلا إذا أعاد المسؤول فتحه للمراجعة. تأكد من صحة كل الروابط.
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  )
}
