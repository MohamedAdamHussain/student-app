import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Upload, FileText, Trash2, Info, Save } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/context/AuthContext'
import { mockGetTracks, mockGetSubmissions, mockUpdateProfile } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ProfileEditPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const profile = user?.studentProfile
  const queryClient = useQueryClient()

  const { data: tracks } = useQuery({ queryKey: queryKeys.tracks, queryFn: mockGetTracks })
  const { data: submissions } = useQuery({ queryKey: queryKeys.submissions, queryFn: mockGetSubmissions })

  const acceptedSubmissions = (submissions ?? []).filter((s) => s.status === 'accepted')

  const [form, setForm] = useState({
    bio: profile?.bio ?? '',
    tagline: profile?.tagline ?? '',
    githubUrl: profile?.githubUrl ?? '',
    linkedinUrl: profile?.linkedinUrl ?? '',
    portfolioUrl: profile?.portfolioUrl ?? '',
    featuredProjectId: profile?.featuredProjectId ?? '',
    tracks: profile?.tracks?.map((t) => t.id) ?? [],
  })

  const updateMutation = useMutation({
    mutationFn: mockUpdateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      toast.success('تم حفظ التغييرات بنجاح ✓')
      navigate('/profile')
    },
    onError: () => toast.error('حدث خطأ أثناء الحفظ'),
  })

  const set = (k: keyof typeof form, v: string | number | number[]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const toggleTrack = (id: number) => {
    setForm((f) => ({
      ...f,
      tracks: f.tracks.includes(id)
        ? f.tracks.filter((t) => t !== id)
        : [...f.tracks, id],
    }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      ...form,
      featuredProjectId: form.featuredProjectId ? Number(form.featuredProjectId) : null,
    } as any)
  }

  // Profile completion calculation
  const fields = [
    form.tagline, form.bio, form.githubUrl, form.linkedinUrl,
    form.featuredProjectId, form.tracks.length > 0,
  ]
  const filled = fields.filter(Boolean).length
  const completion = Math.round((filled / fields.length) * 100)

  return (
    <AppShell title="تعديل الملف الشخصي">
      <PageHeader
        title="تعديل الملف الشخصي"
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'ملفي الشخصي', to: '/profile' },
          { label: 'تعديل' },
        ]}
        actions={
          <Button type="submit" form="profile-form" size="sm" disabled={updateMutation.isPending}>
            <Save size={14} />
            {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        }
      />

      {/* Completion Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="mb-6 bg-info-soft border-info-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-info rounded-md grid place-items-center text-white flex-shrink-0">
              <Info size={22} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-info mb-1">
                ملفك مكتمل بنسبة {completion}%
              </div>
              <div className="text-sm text-ink-600 dark:text-ink-300">
                {completion < 100
                  ? 'أضف البيانات الناقصة لرفع نسبة الاكتمال وزيادة فرص ظهورك للشركات.'
                  : 'ممتاز! ملفك مكتمل 100%'}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <form id="profile-form" onSubmit={handleSubmit} className="max-w-3xl">
        {/* Avatar */}
        <Card className="mb-5">
          <CardTitle className="mb-4">الصورة الشخصية</CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <Avatar name={user?.name ?? 'User'} size="lg" />
            <div>
              <div className="flex gap-2 mb-2">
                <Button type="button" variant="secondary" size="sm">
                  <Upload size={14} />
                  رفع صورة
                </Button>
                <Button type="button" variant="ghost" size="sm">حذف</Button>
              </div>
              <div className="text-xs text-ink-400">JPG, PNG أو GIF · حد أقصى 2MB</div>
            </div>
          </div>
        </Card>

        {/* Basic Info */}
        <Card className="mb-5">
          <CardTitle className="mb-4">المعلومات الأساسية</CardTitle>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="الاسم الكامل"
              value={user?.name}
              hint="لا يمكن تغيير الاسم — تواصل مع المسؤول عند الحاجة"
              disabled
            />
            <Input
              label="العنوان التعريفي (Tagline)"
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="مثال: Fullstack Developer شغوف بـ React"
              hint="جملة واحدة تصف من تكون مهنياً"
            />
          </div>

          <Textarea
            label="نبذة شخصية (Bio)"
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="اكتب نبذة قصيرة عنك، اهتماماتك، وأهدافك المهنية..."
            rows={4}
            hint="حتى 1000 حرف — اكتب بأسلوبك الطبيعي"
          />
        </Card>

        {/* Links */}
        <Card className="mb-5">
          <CardTitle className="mb-4">الروابط الخارجية</CardTitle>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="GitHub URL"
              value={form.githubUrl}
              onChange={(e) => set('githubUrl', e.target.value)}
              placeholder="https://github.com/username"
            />
            <Input
              label="LinkedIn URL"
              value={form.linkedinUrl}
              onChange={(e) => set('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </div>

          <Input
            label="Portfolio URL (اختياري)"
            value={form.portfolioUrl}
            onChange={(e) => set('portfolioUrl', e.target.value)}
            placeholder="https://myportfolio.com"
          />
        </Card>

        {/* CV Upload */}
        <Card className="mb-5">
          <CardTitle className="mb-4">السيرة الذاتية (CV)</CardTitle>

          <div className="border-2 border-dashed border-ink-300 dark:border-ink-700 rounded-md p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-ink-100 dark:bg-ink-800 rounded-full grid place-items-center text-ink-400">
              <Upload size={22} />
            </div>
            <div className="font-semibold mb-1">اسحب ملف CV هنا أو اضغط للاختيار</div>
            <div className="text-xs text-ink-400 mb-4">PDF فقط · حد أقصى 5MB</div>
            <Button type="button" variant="secondary" size="sm">اختر ملف</Button>
          </div>

          <div className="mt-4 flex items-center gap-3 p-3 bg-success-soft border border-success-border rounded-md">
            <div className="w-9 h-9 bg-success rounded grid place-items-center text-white flex-shrink-0">
              <FileText size={16} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Ahmed_Ali_CV.pdf</div>
              <div className="text-xs text-ink-400">تم الرفع · 280KB</div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="text-danger">
              <Trash2 size={14} />
            </Button>
          </div>
        </Card>

        {/* Tracks */}
        <Card className="mb-5">
          <CardTitle className="mb-1">المسارات (Tracks)</CardTitle>
          <p className="text-sm text-ink-400 mb-4">اختر المسارات التي تمثل تخصصك</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tracks?.map((track) => {
              const selected = form.tracks.includes(track.id)
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => toggleTrack(track.id)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-md text-sm cursor-pointer transition-all border-2 text-right',
                    selected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 font-semibold'
                      : 'border-ink-200 dark:border-ink-800 hover:border-ink-300 dark:hover:border-ink-700',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {}}
                    className="w-4 h-4 text-brand-500 rounded"
                  />
                  <span>{track.name}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Featured Project */}
        <Card className="mb-5">
          <CardTitle className="mb-1">المشروع المميز</CardTitle>
          <p className="text-sm text-ink-400 mb-4">
            اختر أحد تقديماتك المقبولة ليُبرز في ملفك
          </p>

          <Select
            value={form.featuredProjectId}
            onChange={(e) => set('featuredProjectId', e.target.value)}
            hint="يمكنك اختيار تقديم مقبول فقط"
          >
            <option value="">— اختر مشروعاً مميزاً —</option>
            {acceptedSubmissions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.task?.title ?? s.hackathon?.title}
                {s.score ? ` (${(s.score / 10).toFixed(1)}/10)` : ''}
              </option>
            ))}
          </Select>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Button type="submit" size="lg" disabled={updateMutation.isPending}>
            <Save size={16} />
            {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/profile')}>
            إلغاء
          </Button>
        </div>
      </form>
    </AppShell>
  )
}
