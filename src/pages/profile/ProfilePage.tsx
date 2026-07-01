import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Code,
  Briefcase,
  Globe,
  FileText,
  Download,
  Star,
  Pencil,
  Trophy,
  Award,
  TrendingUp,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { mockGetSubmissions, mockGetDashboardStats, mockGetProfile } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'

export function ProfilePage() {
  const { user } = useAuth()

  // ✨ جلب الـ profile من API مباشرة (لا نعتمد على user object المُخزّن)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: mockGetProfile,
  })

  const { data: submissions } = useQuery({
    queryKey: queryKeys.submissions,
    queryFn: mockGetSubmissions,
  })
  const { data: stats } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: mockGetDashboardStats,
  })

  const acceptedSubmissions = (submissions ?? []).filter((s) => s.status === 'accepted')
  const featuredProject = profile?.featuredProject

  if (!profile || profileLoading) {
    return (
      <AppShell title="ملفي الشخصي">
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppShell>
    )
  }

  // Skill averages from accepted submissions
  const skillAverages: Record<string, { score: number; type: string }> = {}
  acceptedSubmissions.forEach((s) => {
    s.skillScores.forEach((ss) => {
      const name = ss.skill.name
      if (!skillAverages[name]) {
        skillAverages[name] = { score: 0, type: ss.skill.type }
      }
      skillAverages[name].score += ss.score
    })
  })
  const avgSkills = Object.entries(skillAverages).map(([name, data]) => ({
    name,
    type: data.type,
    avg: data.score / acceptedSubmissions.filter((s) => s.skillScores.some((ss) => ss.skill.name === name)).length,
  }))
  const technical = avgSkills.filter((s) => s.type === 'technical')
  const soft = avgSkills.filter((s) => s.type === 'soft')

  return (
    <AppShell title="ملفي الشخصي">
      <PageHeader
        title="ملفي الشخصي"
        breadcrumbs={[{ label: 'الرئيسية', to: '/dashboard' }, { label: 'ملفي الشخصي' }]}
        actions={
          <Link to="/profile/edit">
            <Button size="sm">
              <Pencil size={14} />
              تعديل الملف
            </Button>
          </Link>
        }
      />

      {/* Profile Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="mb-6">
          <div className="flex items-start gap-6 flex-wrap">
            <Avatar name={user?.name ?? 'User'} size="xl" />
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-extrabold">{user?.name}</h1>
                <Badge variant="success">
                  <Star size={12} />
                  مُتحقق
                </Badge>
              </div>
              <div className="text-ink-500 mb-4">{profile.tagline} · Batch 1 - 2026</div>
              <p className="text-ink-600 dark:text-ink-300 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm">
                    <Code size={14} />
                    GitHub
                  </Button>
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm">
                    <Briefcase size={14} />
                    LinkedIn
                  </Button>
                </a>
              )}
              {profile.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm">
                    <Globe size={14} />
                    Portfolio
                  </Button>
                </a>
              )}
              {profile.cvPath && (
                <a href="#">
                  <Button variant="secondary" size="sm">
                    <Download size={14} />
                    تحميل CV
                  </Button>
                </a>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Three-column summary */}
      <div className="grid md:grid-cols-3 gap-5 mb-6">
        <Card>
          <CardTitle className="mb-4">المسارات</CardTitle>
          <div className="flex flex-wrap gap-2">
            {profile.tracks.map((track) => (
              <Badge key={track.id} variant="accent" className="px-3 py-1.5">
                {track.name}
              </Badge>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">الدفعة</CardTitle>
          <div className="font-semibold text-lg">Batch 1 - 2026</div>
          <div className="text-sm text-ink-400 mt-1">يناير 2026 → يونيو 2026</div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-ink-500">تقدم البرنامج</span>
              <span className="font-semibold">88%</span>
            </div>
            <Progress value={88} variant="success" />
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">إحصائيات سريعة</CardTitle>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-sm text-ink-500">إجمالي التقديمات</span>
              <span className="font-bold">{stats?.total_submissions ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-ink-500">مقبولة</span>
              <span className="font-bold text-success">{stats?.accepted ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-ink-500">متوسط الدرجات</span>
              <span className="font-bold">{stats?.average_score ?? 0}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-ink-500">ترتيبي بالدفعة</span>
              <span className="font-bold flex items-center gap-1">
                <Trophy size={14} className="text-warning" />
                #{stats?.rank_in_batch ?? 3}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Featured Project */}
      {featuredProject && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 border-brand-200 dark:border-brand-800" style={{ background: 'linear-gradient(135deg, #FAFBFF 0%, #F0F4FF 100%)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star size={20} className="text-brand-500 fill-brand-500" />
                <span className="font-bold text-brand-600">المشروع المميز</span>
              </div>
              <Badge variant="success">
                مقبول · {featuredProject.score}/100
              </Badge>
            </div>

            <h3 className="text-2xl font-bold mb-2">
              {featuredProject.task?.title ?? featuredProject.hackathon?.title}
            </h3>
            <p className="text-ink-600 dark:text-ink-300 mb-4 max-w-3xl leading-relaxed">
              {featuredProject.notes}
            </p>

            <div className="flex gap-3 mb-4 flex-wrap">
              {featuredProject?.githubUrl && (
                <a href={featuredProject?.githubUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm">
                    <Code size={14} />
                    GitHub
                  </Button>
                </a>
              )}
              {featuredProject?.liveUrl && (
                <a href={featuredProject?.liveUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm">
                    <Globe size={14} />
                    Live Demo
                  </Button>
                </a>
              )}
              {featuredProject?.videoUrl && (
                <a href={featuredProject?.videoUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm">
                    <FileText size={14} />
                    عرض الفيديو
                  </Button>
                </a>
              )}
            </div>

            <div className="border-t border-brand-200 dark:border-brand-800 pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredProject.skillScores.map((ss) => (
                  <div key={ss.id}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-ink-500">{ss.skill.name}</span>
                      <span className="font-bold">{ss.score}/10</span>
                    </div>
                    <Progress value={ss.score * 10} variant="success" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Skill Averages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>مهاراتي (متوسط كل التقييمات)</CardTitle>
          <Badge variant="neutral">{acceptedSubmissions.length} تقييمات</Badge>
        </CardHeader>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="text-xs font-semibold text-ink-400 uppercase mb-4 flex items-center gap-1">
              <TrendingUp size={14} />
              مهارات تقنية
            </div>
            <div className="flex flex-col gap-3">
              {technical.length === 0 ? (
                <div className="text-sm text-ink-400">لا توجد مهارات تقنية مُقيَّمة بعد</div>
              ) : (
                technical.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{skill.name}</span>
                      <span className="font-bold">{skill.avg.toFixed(1)}</span>
                    </div>
                    <Progress value={skill.avg * 10} variant="success" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-ink-400 uppercase mb-4 flex items-center gap-1">
              <Award size={14} />
              مهارات شخصية
            </div>
            <div className="flex flex-col gap-3">
              {soft.length === 0 ? (
                <div className="text-sm text-ink-400">لا توجد مهارات شخصية مُقيَّمة بعد</div>
              ) : (
                soft.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{skill.name}</span>
                      <span className="font-bold">{skill.avg.toFixed(1)}</span>
                    </div>
                    <Progress value={skill.avg * 10} variant="success" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Accepted Works */}
      <Card>
        <CardHeader>
          <CardTitle>الأعمال المقبولة</CardTitle>
          <Link to="/submissions">
            <Button variant="ghost" size="sm">عرض الكل</Button>
          </Link>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50 dark:bg-ink-800/50 text-xs uppercase text-ink-500">
                <th className="text-right p-3 font-semibold">المشروع</th>
                <th className="text-right p-3 font-semibold">النوع</th>
                <th className="text-right p-3 font-semibold">الدرجة</th>
                <th className="text-right p-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {acceptedSubmissions.map((s) => (
                <tr key={s.id} className="border-b border-ink-100 dark:border-ink-800 last:border-0 hover:bg-ink-50 dark:hover:bg-ink-800/50">
                  <td className="p-3">
                    <div className="font-semibold">{s.task?.title ?? s.hackathon?.title}</div>
                    <div className="text-xs text-ink-400">
                      {s.task ? `HW #${s.task.id}` : 'Hackathon'}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={s.task?.type === 'final' || s.hackathon ? 'warning' : 'info'}>
                      {s.task?.type === 'final' ? 'Final' : s.hackathon ? 'Hackathon' : 'HW'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="success">
                      {s.score ? `${(s.score / 10).toFixed(1)}/10` : '—'}
                    </Badge>
                  </td>
                  <td className="p-3 text-left">
                    <Link to={`/submissions/${s.id}`}>
                      <Button variant="ghost" size="sm">عرض</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
