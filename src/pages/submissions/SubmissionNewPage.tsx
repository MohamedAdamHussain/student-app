import { useState, useRef, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, Upload, AlertTriangle,
  Save, X, CheckCircle2, Circle, Calendar, Trash2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { mockGetTasks, mockGetHackathons, mockGetTeams } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { useCreateSubmission } from '@/hooks/useSubmissions'
import { validateFile, getFileExtension } from '@/lib/fileValidation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// =====================================================
// ✨ P1-B PATCH: SubmissionNewPage
// =====================================================
// التغييرات:
//   1) P0: double-submit protection عبر submitting state (منع الإرسال المزدوج)
//   2) P1-A: حذف 'final' من نوع المهمة — كل المهام 'hw' فقط
//   3) P1-A: تحديث الوصف "HW أو Final Project" → "HW"
//   4) P1-A: تحديث الـ option text — حذف branch الخاص بـ 'final'

export function SubmissionNewPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: tasksData } = useQuery({ queryKey: queryKeys.tasks, queryFn: () => mockGetTasks() })
  const { data: hackathonsData } = useQuery({ queryKey: queryKeys.hackathons, queryFn: () => mockGetHackathons() })
  const { data: teams } = useQuery({ queryKey: queryKeys.teams, queryFn: mockGetTeams })

  const createMutation = useCreateSubmission()

  const tasks = tasksData?.data ?? []
  const hackathons = hackathonsData?.data ?? []

  const [type, setType] = useState<'task' | 'hackathon'>('task')
  const [taskId, setTaskId] = useState('')
  const [hackathonId, setHackathonId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)

  // ✨ P0 PATCH: double-submit protection
  // قبل: كان disabled={createMutation.isPending} فقط. لكن isPending يتغير
  // بعد بدء الـ mutation. لو ضغط الطالب مرتين بسرعة (أو Enter مرتين)،
  // يُرسل الطلبان قبل أن يصبح isPending = true.
  // الآن: submitting state يُضبط قبل استدعاء mutate مباشرة.
  const [submitting, setSubmitting] = useState(false)

  const selectedTask = tasks?.find((t) => t.id === Number(taskId))
  const videoRequired = type === 'task' && selectedTask?.videoRequired

  const isDeadlinePassed = () => {
    if (type === 'task' && selectedTask?.batch?.endDate) {
      return new Date(selectedTask.batch.endDate) < new Date()
    }
    if (type === 'hackathon' && hackathonId) {
      const h = hackathons?.find((h) => h.id === Number(hackathonId))
      return h ? new Date(h.deadline) < new Date() : false
    }
    return false
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    // ✨ P0 PATCH: حارس مبكر ضد double-submit
    if (submitting || createMutation.isPending) return

    if (isDeadlinePassed()) {
      toast.error('انتهى موعد التقديم على هذه المهمة. لا يمكن التقديم بعد انتهاء الدفعة.')
      return
    }

    if (type === 'task' && !taskId) {
      toast.error('اختر مهمة للتسليم عليها')
      return
    }
    if (type === 'hackathon' && !hackathonId) {
      toast.error('اختر هاكاثوناً للتسليم عليه')
      return
    }
    if (!githubUrl && !liveUrl && !videoUrl && !file) {
      toast.error('يجب تقديم صيغة واحدة على الأقل (GitHub، Live، فيديو، أو ملف)')
      return
    }
    if (videoRequired && !videoUrl) {
      toast.error('هذه المهمة تتطلب رابط فيديو')
      return
    }
    if (file && !validateFile(file, {
      types: ['application/pdf', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream', ''],
      maxSizeMB: 10,
      label: 'الملف',
    })) return

    const allowedExtensions = ['pdf', 'zip', 'rar', '7z', 'doc', 'docx', 'txt', 'md', 'json', 'csv']
    if (file) {
      const ext = getFileExtension(file)
      if (!allowedExtensions.includes(ext)) {
        toast.error('صيغة الملف غير مدعومة. المسموح: PDF, ZIP, RAR, 7Z, DOC(X), TXT, MD, JSON, CSV')
        return
      }
    }

    // ✨ P0 PATCH: اضبط submitting قبل mutate، أفرغه في onSettled
    setSubmitting(true)
    createMutation.mutate(
      {
        taskId: type === 'task' ? Number(taskId) : null,
        hackathonId: type === 'hackathon' ? Number(hackathonId) : null,
        teamId: teamId ? Number(teamId) : null,
        githubUrl: githubUrl || null,
        liveUrl: liveUrl || null,
        videoUrl: videoUrl || null,
        notes: notes || null,
        file: file ?? undefined,
      },
      {
        onSettled: () => setSubmitting(false),
      },
    )
  }

  const checklist = [
    { done: !!(type === 'task' ? taskId : hackathonId), label: 'اخترت مهمة أو هاكاثون' },
    { done: !!(githubUrl || liveUrl || file), label: 'صيغة واحدة على الأقل (GitHub, Live, أو ملف)' },
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
                  {/* ✨ P1-A: حذف "HW أو Final Project" — كل المهام HW فقط */}
                  <div className="text-xs text-ink-400">واجب منزلي (HW)</div>
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
                      {/* ✨ P1-A: حذف branch الخاص بـ 'final' — كلها HW */}
                      {t.title} (HW)
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
              {teams?.filter((t) => t.teamableId === (Number(taskId) || Number(hackathonId))).map((t) => (
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

            <div className="mb-5">
              <label className="block text-[13px] font-semibold mb-1.5">ملف مرفق (PDF, ZIP)</label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.zip,.rar,.7z,.doc,.docx,.txt,.md,.json,.csv"
                onChange={(e) => {
                  const selected = e.target.files?.[0]
                  if (selected) setFile(selected)
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20')
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20')
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20')
                  const dropped = e.dataTransfer.files?.[0]
                  if (dropped) setFile(dropped)
                }}
                className={cn(
                  'border-2 border-dashed rounded-md p-5 text-center cursor-pointer hover:border-brand-500 transition-colors',
                  file
                    ? 'border-success bg-success-soft'
                    : 'border-ink-300 dark:border-ink-700',
                )}
              >
                {file ? (
                  <>
                    <FileText size={20} className="mx-auto mb-2 text-success" />
                    <div className="text-sm font-semibold mb-1 text-success">{file.name}</div>
                    <div className="text-xs text-ink-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · اضغط للتغيير
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-danger hover:underline"
                    >
                      <Trash2 size={12} />
                      إزالة الملف
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="mx-auto mb-2 text-ink-400" />
                    <div className="text-sm font-semibold mb-1">اسحب الملف هنا أو اضغط للاختيار</div>
                    <div className="text-xs text-ink-400">PDF, ZIP, RAR, 7Z, DOC, TXT · حد أقصى 10MB</div>
                  </>
                )}
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
            <Button
              type="submit"
              size="lg"
              disabled={submitting || createMutation.isPending}
            >
              {submitting || createMutation.isPending ? (
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
            <Link to="/submissions">
              <Button type="button" variant="ghost" size="lg">إلغاء</Button>
            </Link>
          </div>
        </form>

        {/* Right Sidebar */}
        <aside className="space-y-5">
          {selectedTask && (
            <Card>
              <CardTitle className="mb-4">المهمة المختارة</CardTitle>
              <div className="p-3 bg-warning-soft border border-warning-border rounded-md">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {/* ✨ P1-A: حذف 'final' branch */}
                  <Badge variant="info">HW</Badge>
                  {selectedTask.videoRequired && (
                    <Badge variant="info">فيديو إلزامي</Badge>
                  )}
                </div>
                <div className="font-semibold mb-1">{selectedTask.title}</div>
                <div className="text-xs text-ink-400 mb-3 flex items-center gap-1">
                  <Calendar size={12} />
                  ينتهي {selectedTask.batch?.endDate}
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
