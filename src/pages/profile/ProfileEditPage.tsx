import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, FileText, Trash2, Info, Save, Camera } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/context/AuthContext'
import {
  useProfile,
  useTracks,
  useMySubmissions,
  useUpdateProfile,
  useDeleteCv,
  useUploadAvatar,
  useDeleteAvatar,
  type UpdateProfilePayload,
} from '@/hooks/useProfileMutations'
import { validateFile } from '@/lib/fileValidation'
import { useConfirm } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ProfileEditPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const confirm = useConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // ✨ كل منطق الجلب/التعديل في hooks ممنوطة (انظر src/hooks/useProfileMutations)
  const { data: profile } = useProfile()
  const { data: tracks } = useTracks()
  const { data: submissionsData } = useMySubmissions()
  const submissions = submissionsData?.data ?? []

  const updateMutation = useUpdateProfile()
  const deleteCvMutation = useDeleteCv()
  const avatarMutation = useUploadAvatar()
  const deleteAvatarMutation = useDeleteAvatar()

  const acceptedSubmissions = submissions.filter((s) => s.status === 'accepted')

  const [form, setForm] = useState({
    bio: profile?.bio ?? '',
    tagline: profile?.tagline ?? '',
    githubUrl: profile?.githubUrl ?? '',
    linkedinUrl: profile?.linkedinUrl ?? '',
    portfolioUrl: profile?.portfolioUrl ?? '',
    featuredProjectId: profile?.featuredProjectId ?? '',
    tracks: profile?.tracks?.map((t) => t.id) ?? [],
  })

  // ✨ state للـ CV file
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvFileName, setCvFileName] = useState<string | null>(profile?.cvPath?.split('/').pop() ?? null)

  // ✨ sync form مع profile quand il arrive (async fetch)
  // useState initial يُحدّث مرة واحدة فقط عند mount، نحتاج useEffect للمزامنة
  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio ?? '',
        tagline: profile.tagline ?? '',
        githubUrl: profile.githubUrl ?? '',
        linkedinUrl: profile.linkedinUrl ?? '',
        portfolioUrl: profile.portfolioUrl ?? '',
        featuredProjectId: profile.featuredProjectId ?? '',
        tracks: profile.tracks?.map((t) => t.id) ?? [],
      })
      setCvFileName(profile.cvPath?.split('/').pop() ?? null)
    }
  }, [profile])

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

  // ✨ handler لاختيار ملف CV
  const handleCvChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // ✨ فحص موحّد للنوع (PDF فقط) والحجم (5MB)
    if (!validateFile(file, { types: ['application/pdf'], maxSizeMB: 5, label: 'السيرة الذاتية' })) return
    setCvFile(file)
    setCvFileName(file.name)
    toast.info('سيتم رفع السيرة الذاتية عند الحفظ')
  }

  const handleDeleteCv = async () => {
    const ok = await confirm({
      title: 'حذف السيرة الذاتية',
      message: 'هل أنت متأكد من حذف السيرة الذاتية؟',
      confirmText: 'حذف',
      variant: 'danger',
    })
    if (!ok) return
    deleteCvMutation.mutate()
    setCvFile(null)
    setCvFileName(null)
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // ✨ فحص موحّد للنوع والحجم
    if (!validateFile(file, {
      types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxSizeMB: 2,
      label: 'الصورة الشخصية',
    })) return
    avatarMutation.mutate(file)
  }

  const handleDeleteAvatar = async () => {
    const ok = await confirm({
      title: 'حذف الصورة الشخصية',
      message: 'هل أنت متأكد من حذف الصورة الشخصية؟',
      confirmText: 'حذف',
      variant: 'danger',
    })
    if (!ok) return
    deleteAvatarMutation.mutate()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // ✨ إرسال cv كـ File لو تم اختياره
    const payload: UpdateProfilePayload = {
      ...form,
      featuredProjectId: form.featuredProjectId ? Number(form.featuredProjectId) : null,
    }
    if (cvFile) {
      payload.cv = cvFile
    }
    updateMutation.mutate(payload)
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
            {/* ✨ Stage 5: استخدم user.avatar الفعلي مع fallback للحرف الأول */}
            <div className="relative">
              <Avatar
                name={user?.name ?? 'User'}
                src={user?.avatar ?? undefined}
                size="lg"
              />
              {avatarMutation.isPending && (
                <div className="absolute inset-0 rounded-full bg-ink-900/50 grid place-items-center">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-input"
              />
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={avatarMutation.isPending}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera size={14} />
                  {user?.avatar ? 'تغيير الصورة' : 'رفع صورة'}
                </Button>
                {user?.avatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    onClick={handleDeleteAvatar}
                    disabled={deleteAvatarMutation.isPending}
                  >
                    <Trash2 size={14} />
                    حذف
                  </Button>
                )}
              </div>
              <div className="text-xs text-ink-400">JPG, PNG, WebP أو GIF · حد أقصى 2MB</div>
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

          {/* ✨ P1-3: hidden input + label بدلاً من button غير فعّال */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleCvChange}
            className="hidden"
            id="cv-file-input"
          />

          <label
            htmlFor="cv-file-input"
            className="block border-2 border-dashed border-ink-300 dark:border-ink-700 rounded-md p-6 text-center cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 transition-colors"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-ink-100 dark:bg-ink-800 rounded-full grid place-items-center text-ink-400">
              <Upload size={22} />
            </div>
            <div className="font-semibold mb-1">اسحب ملف CV هنا أو اضغط للاختيار</div>
            <div className="text-xs text-ink-400 mb-4">PDF فقط · حد أقصى 5MB</div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-ink-100 dark:bg-ink-800 rounded-md">
              <Upload size={14} />
              اختر ملف
            </span>
          </label>

          {/* ✨ P1-3: عرض اسم الملف الفعلي + زر حذف فعّال */}
          {cvFileName && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-success-soft border border-success-border rounded-md">
              <div className="w-9 h-9 bg-success rounded grid place-items-center text-white flex-shrink-0">
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{cvFileName}</div>
                <div className="text-xs text-ink-400">
                  {cvFile ? `جاهز للرفع · ${(cvFile.size / 1024).toFixed(0)}KB` : 'مرفوع سابقاً'}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={handleDeleteCv}
                disabled={deleteCvMutation.isPending}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}
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
                {/* ✨ P0-1: score أصلاً من 10 — لا قسمة */}
                {s.score != null ? ` (${s.score.toFixed(1)}/10)` : ''}
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
