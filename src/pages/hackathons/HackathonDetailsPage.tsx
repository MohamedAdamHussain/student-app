import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Trophy, Clock, Users, Plus, UserPlus, CheckCircle2,
  Calendar, Info, ArrowLeft, Video, Code, Globe, FileText,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { mockGetHackathon, mockGetTeams } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { daysUntil, gradientFor } from '@/lib/utils'

export function HackathonDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const hackathonId = Number(id)

  const { data: hackathon, isLoading } = useQuery({
    queryKey: queryKeys.hackathon(hackathonId),
    queryFn: () => mockGetHackathon(hackathonId),
    enabled: !!hackathonId,
  })

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams,
    queryFn: mockGetTeams,
  })

  if (isLoading || !hackathon) {
    return (
      <AppShell title="تفاصيل الهاكاثون">
        <Skeleton className="h-96" />
      </AppShell>
    )
  }

  const days = daysUntil(hackathon.deadline)
  const hours = Math.max(0, days * 24)
  const registeredTeams = (teams ?? []).filter(
    (t) => t.teamable_id === hackathon.id && t.teamable_type === 'Hackathon',
  )

  return (
    <AppShell title="تفاصيل الهاكاثون">
      <PageHeader
        title={hackathon.title}
        breadcrumbs={[
          { label: 'الرئيسية', to: '/dashboard' },
          { label: 'الهاكاثونات', to: '/hackathons' },
          { label: hackathon.title },
        ]}
        actions={
          <Link to="/hackathons">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={14} />
              رجوع
            </Button>
          </Link>
        }
      />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-8 mb-6 text-white relative overflow-hidden border-0"
        style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
      >
        <div className="absolute -top-1/3 left-0 w-1/2 h-[200%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {days >= 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" />
                نشط الآن
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm">
              {hackathon.is_team ? `فِرقي · حتى ${hackathon.max_team_size} أعضاء` : 'فردي'}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold mb-2">{hackathon.title}</h1>
          <p className="text-base opacity-90 mb-6 max-w-2xl leading-relaxed">
            {hackathon.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] opacity-75 mb-1 uppercase">الموعد النهائي</div>
              <div className="text-lg font-bold">{hackathon.deadline.split('T')[0]}</div>
            </div>
            <div>
              <div className="text-[11px] opacity-75 mb-1 uppercase">متبقي</div>
              <div className="text-lg font-bold text-yellow-300">{hours} ساعة</div>
            </div>
            <div>
              <div className="text-[11px] opacity-75 mb-1 uppercase">الفرق المسجّلة</div>
              <div className="text-lg font-bold">{registeredTeams.length} فِرَق</div>
            </div>
            <div>
              <div className="text-[11px] opacity-75 mb-1 uppercase">الجائزة</div>
              <div className="text-lg font-bold">+30 نقطة</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <Card className="mb-6 bg-warning-soft border-warning-border">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning rounded-md grid place-items-center text-white">
              <Clock size={22} />
            </div>
            <div>
              <div className="font-bold text-warning">لم تُسجّل في هذا الهاكاثون بعد</div>
              <div className="text-sm text-ink-600 dark:text-ink-300">
                أنشئ فريقاً أو انضم لفريق موجود قبل انتهاء مهلة التسجيل
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/teams">
              <Button>
                <Plus size={14} />
                إنشاء فريق جديد
              </Button>
            </Link>
            <Button variant="secondary">
              <UserPlus size={14} />
              انضم لفريق
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Left */}
        <div className="space-y-5">
          <Card>
            <CardTitle className="mb-4">تفاصيل التحدي</CardTitle>
            <div className="text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
              {hackathon.description}
            </div>
          </Card>

          {/* Registered Teams */}
          <Card>
            <CardHeader>
              <CardTitle>الفرق المسجّلة ({registeredTeams.length})</CardTitle>
              <Button variant="ghost" size="sm">عرض الكل</Button>
            </CardHeader>
            <div className="flex flex-col gap-3">
              {registeredTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-4 p-4 border border-ink-200 dark:border-ink-800 rounded-md"
                >
                  <div className="w-11 h-11 rounded-md grid place-items-center text-white font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${gradientFor(team.name)[0]}, ${gradientFor(team.name)[1]})` }}>
                    {team.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{team.name}</div>
                    <div className="text-xs text-ink-400">
                      {team.teamMembers.length} أعضاء · أُنشئ قبل {daysUntil(team.created_at)} يوم
                    </div>
                  </div>
                  <div className="flex items-center -space-x-2 space-x-reverse">
                    {team.teamMembers.slice(0, 4).map((m) => (
                      <Avatar key={m.id} name={m.user.name} size="sm" className="border-2 border-white dark:border-ink-900" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right */}
        <aside className="space-y-5">
          <Card>
            <CardTitle className="mb-4">متطلبات التسليم</CardTitle>
            <div className="flex flex-col gap-3">
              {[
                { icon: Code, label: 'GitHub Repository' },
                { icon: Globe, label: 'Live Deployment URL' },
                { icon: Video, label: 'Demo Video (3-5 دقائق)' },
                { icon: FileText, label: 'README مع التعليمات' },
              ].map((req) => (
                <div key={req.label} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-success" />
                  <req.icon size={16} className="text-ink-400" />
                  <span className="text-sm">{req.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">الجدول الزمني</CardTitle>
            <div className="flex flex-col gap-4">
              {[
                { label: 'بداية التسجيل', date: '8 يوليو · 09:00', done: true },
                { label: 'بداية الهاكاثون', date: '9 يوليو · 00:00', done: true, active: true },
                { label: 'نهاية التسليم', date: '10 يوليو · 23:59', done: false },
                { label: 'إعلان النتائج', date: '12 يوليو · 18:00', done: false },
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className={[
                    'w-7 h-7 rounded-full grid place-items-center flex-shrink-0 text-xs',
                    step.done
                      ? step.active ? 'bg-warning text-white' : 'bg-success text-white'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-400 border-2 border-ink-200 dark:border-ink-700',
                  ].join(' ')}>
                    {step.done ? <CheckCircle2 size={14} /> : <span>●</span>}
                  </div>
                  <div>
                    <div className={`font-semibold text-sm ${step.done ? '' : 'text-ink-400'}`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-ink-400">{step.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-info-soft border-info-border">
            <div className="flex items-center gap-2 mb-2">
              <Info size={18} className="text-info" />
              <div className="font-semibold text-info">تحتاج مساعدة؟</div>
            </div>
            <div className="text-sm text-ink-600 dark:text-ink-300 mb-3">
              تواصل مع المسؤول أو راجع الـ FAQ في حالة لديك استفسار.
            </div>
            <Button variant="secondary" size="sm" block>تواصل مع المسؤول</Button>
          </Card>
        </aside>
      </div>
    </AppShell>
  )
}
