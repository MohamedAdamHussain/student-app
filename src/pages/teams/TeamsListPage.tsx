import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Trophy, Users, Crown, UserPlus, CheckSquare,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { ApiDebug } from '@/components/common/ApiDebug'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input, Select } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { mockGetTeams, mockGetHackathons, mockGetTasks, mockCreateTeam } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { useMyJoinRequests } from '@/hooks/useJoinRequests'
import { extractApiMessage } from '@/lib/errors'
import { toast } from 'sonner'
import { formatRelative, gradientFor, cn } from '@/lib/utils'
import type { Team, Hackathon, Task } from '@/types'

type TabKey = 'all' | 'leader' | 'member'

export function TeamsListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('all')
  const [modalOpen, setModalOpen] = useState(false)
  // ✨ استخدام useSearchParams بدلاً من window.location (أكثر موثوقية)
  const [searchParams] = useSearchParams()
  const preselectedHackathonId = searchParams.get('hackathon_id')
  const preselectedTaskId = searchParams.get('task_id')

  const { data: teams, isLoading, error: teamsError } = useQuery({
    queryKey: queryKeys.teams,
    queryFn: mockGetTeams,
  })
  const { data: hackathonsData } = useQuery({
    queryKey: queryKeys.hackathons,
    queryFn: () => mockGetHackathons(),
  })
  const { data: tasksData } = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => mockGetTasks(),
  })
  // ✨ طلبات الانضمام المُرسَلة (حالتها).
  const { data: myJoinRequests } = useMyJoinRequests()

  // ✨ Stage 7: استخرج data من PaginatedResponse
  const hackathons = hackathonsData?.data ?? []
  const tasks = tasksData?.data ?? []

  // ✨ فتح الـ Modal تلقائياً عند وجود query param
  useEffect(() => {
    if (preselectedHackathonId || preselectedTaskId) {
      setModalOpen(true)
    }
  }, [preselectedHackathonId, preselectedTaskId])

  // ✨ معالجة دفاعية: myTeams بفلترة المستخدم الحالي
  const myTeams = (teams ?? []).filter((t) =>
    t.teamMembers.some((m) => m.userId === user?.id),
  )
  const otherTeams = (teams ?? []).filter((t) =>
    !t.teamMembers.some((m) => m.userId === user?.id),
  )

  const filtered = myTeams.filter((t) => {
    const membership = t.teamMembers.find((m) => m.userId === user?.id)
    if (tab === 'leader') return membership?.isLeader
    if (tab === 'member') return !membership?.isLeader
    return true
  })

  const counts = {
    all: myTeams.length,
    leader: myTeams.filter((t) => t.teamMembers.find((m) => m.userId === user?.id)?.isLeader).length,
    member: myTeams.filter((t) => !t.teamMembers.find((m) => m.userId === user?.id)?.isLeader).length,
  }

  return (
    <AppShell title="فرقي">
      <PageHeader
        title="فرقي"
        subtitle="الفرق التي أنشأتها أو تنتمي إليها للمهام الجماعية والهاكاثونات"
        breadcrumbs={[{ label: 'الرئيسية', to: '/dashboard' }, { label: 'فرقي' }]}
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} />
            إنشاء فريق جديد
          </Button>
        }
      />

      {/* ✨ تتبع الربط — يظهر فقط في وضع التطوير */}
      <ApiDebug
        label="GET /my-teams"
        transformedData={teams}
        error={teamsError}
        expectedFields={['teamableType', 'teamableId', 'teamMembers']}
      />
      <ApiDebug
        label="GET /hackathons"
        transformedData={hackathons}
        expectedFields={['isTeam', 'maxTeamSize']}
      />

      {/* ✨ طلبات الانضمام المُرسَلة — حالة الطلبات المعلّقة/المقبولة/المرفوضة. */}
      {myJoinRequests && myJoinRequests.length > 0 && (
        <Card className="mb-5">
          <CardTitle className="mb-3">طلبات الانضمام المُرسَلة ({myJoinRequests.length})</CardTitle>
          <div className="flex flex-col gap-2">
            {myJoinRequests.map((req) => {
              const teamableTitle = (req.team?.teamable as { title?: string } | undefined)?.title ?? '—'
              const variant = req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'
              const label = req.status === 'approved' ? 'مقبول' : req.status === 'rejected' ? 'مرفوض' : 'بانتظار القائد'
              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 p-3 border border-ink-200 dark:border-ink-800 rounded-md"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {req.team?.name ?? 'فريق'}
                      <span className="text-ink-400 font-normal"> · {teamableTitle}</span>
                    </div>
                    <div className="text-xs text-ink-400">{formatRelative(req.createdAt)}</div>
                  </div>
                  <Badge variant={variant}>{label}</Badge>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-200 dark:border-ink-800 mb-5">
        {(['all', 'leader', 'member'] as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all',
              tab === t
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-ink-500 hover:text-ink-900 dark:hover:text-ink-100',
            )}
          >
            {t === 'all' ? 'كل الفرق' : t === 'leader' ? 'أنا القائد' : 'أنا عضو'}
            <span className="mr-1.5 text-xs opacity-70">({counts[t]})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-5">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <Card className="text-center py-12">
              <Users size={48} className="mx-auto mb-4 text-ink-300" />
              <h3 className="font-semibold mb-1">لا توجد فرق</h3>
              <p className="text-sm text-ink-400 mb-4">
                {preselectedHackathonId || preselectedTaskId
                  ? 'أنشئ فريقك الأول للمشاركة'
                  : 'أنشئ فريقك الأول للمشاركة في المهام الجماعية أو الهاكاثونات'}
              </p>
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={14} />
                إنشاء فريق
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {filtered.map((team, i) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <TeamCard team={team} currentUserId={user?.id ?? 0} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Other teams to join — ✨ عرض ذكي بدون زر "طلب الانضمام" وهمي */}
          {otherTeams.length > 0 && (
            <>
              <h2 className="text-lg font-bold mt-8 mb-4">فرق أخرى في دفعتك</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {otherTeams.slice(0, 4).map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    currentUserId={user?.id ?? 0}
                    isOther
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <CreateTeamModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        hackathons={hackathons.filter((h) => h.isTeam)}
        tasks={tasks.filter((t) => t.isTeam)}
        defaultHackathonId={preselectedHackathonId}
        defaultTaskId={preselectedTaskId}
        onCreated={(teamId) => navigate(`/teams/${teamId}`)}
      />
    </AppShell>
  )
}

function TeamCard({
  team,
  currentUserId,
  isOther,
}: {
  team: Team
  currentUserId: number
  isOther?: boolean
}) {
  const myMembership = team.teamMembers.find((m) => m.userId === currentUserId)
  const isLeader = myMembership?.isLeader
  // ✨ معالجة دفاعية لـ maxTeamSize
  const maxSize = team.teamable?.maxTeamSize ?? 4
  const isFull = team.teamMembers.length >= maxSize
  // ✨ P2-1: استخدم team.teamableType مباشرة (typed كـ TeamableType الآن)
  const teamableType = team.teamableType
  const isHackathon = teamableType === 'hackathon'
  // ✨ P2-1: type-safe access للـ deadline عبر discriminated union pattern
  const teamable = team.teamable
  const deadline = teamable && 'deadline' in teamable ? teamable.deadline : null
  const isCompleted = deadline ? new Date(deadline).getTime() < Date.now() : false

  return (
    <Link to={`/teams/${team.id}`}>
      <Card hoverable className={cn('h-full relative overflow-hidden', isLeader && 'border-brand-300')}>
        {isLeader && (
          <div
            className="absolute top-0 right-0 left-0 h-1"
            style={{ background: 'linear-gradient(90deg, #4F46E5, #7C3AED)' }}
          />
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {isLeader && (
              <Badge variant="accent">
                <Crown size={12} />
                أنا القائد
              </Badge>
            )}
            {/* ✨ Badge ديناميكي حسب نوع الفريق */}
            <Badge variant={isHackathon ? 'warning' : 'info'}>
              {isHackathon ? <Trophy size={12} /> : <CheckSquare size={12} />}
              {isHackathon ? 'هاكاثون' : 'مهمة'}
            </Badge>
            {isCompleted && <Badge variant="neutral">منتهي</Badge>}
          </div>
          <span className="text-xs text-ink-400">
            {team.teamMembers.length} أعضاء
          </span>
        </div>

        <h3 className="text-lg font-bold mb-2">{team.name}</h3>
        <p className="text-sm text-ink-500 mb-4 line-clamp-1">
          {/* ✨ P2-1: type-safe access للـ title */}
          لـ {team.teamable?.title ?? (isHackathon ? 'هاكاثون' : 'مهمة')}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center -space-x-2 space-x-reverse">
            {team.teamMembers.slice(0, 4).map((m) => (
              <Avatar
                key={m.id}
                name={m.user.name}
                size="sm"
                src={m.user.avatar ?? undefined}
                className="border-2 border-white dark:border-ink-900"
              />
            ))}
            {!isFull && (
              <div className="w-7 h-7 rounded-full bg-ink-100 dark:bg-ink-800 border-2 border-white dark:border-ink-900 grid place-items-center text-ink-400 text-xs">
                +
              </div>
            )}
          </div>
          <span className="text-xs text-ink-400">
            {isFull ? 'مكتمل' : `متاح ${maxSize - team.teamMembers.length} مقعد`}
          </span>
        </div>

        {isOther && (
          <div className="mt-3 pt-3 border-t border-ink-100 dark:border-ink-800 text-xs text-ink-400">
            القائد: {team.teamMembers.find((m) => m.isLeader)?.user.name ?? '—'}
          </div>
        )}
      </Card>
    </Link>
  )
}

function CreateTeamModal({
  open,
  onOpenChange,
  hackathons,
  tasks,
  defaultHackathonId,
  defaultTaskId,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  hackathons: Hackathon[]
  tasks: Task[]
  defaultHackathonId?: string | null
  defaultTaskId?: string | null
  // ✨ P0-4: استبدل window.location.href بـ callback (يحافظ على SPA + cache)
  onCreated: (teamId: number) => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  // ✨ تحديد القيمة الافتراضية: هاكاثون أو مهمة مُختارة مسبقاً
  const teamHackathons = hackathons
  const teamTasks = tasks

  // ✨ تحديد الاختيار الافتراضي بناءً على الـ query param
  const initialTeamableType: 'hackathon' | 'task' = defaultTaskId ? 'task' : 'hackathon'
  const initialTeamableId = defaultHackathonId ?? defaultTaskId ?? ''

  const [teamableType, setTeamableType] = useState<'hackathon' | 'task'>(initialTeamableType)
  const [teamableId, setTeamableId] = useState(initialTeamableId)

  // ✨ تحديث القيم عند تغير الـ query params
  useEffect(() => {
    if (defaultTaskId) {
      setTeamableType('task')
      setTeamableId(defaultTaskId)
    } else if (defaultHackathonId) {
      setTeamableType('hackathon')
      setTeamableId(defaultHackathonId)
    }
  }, [defaultHackathonId, defaultTaskId])

  const mutation = useMutation({
    mutationFn: mockCreateTeam,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams })
      toast.success(`تم إنشاء فريق ${data.name} ✓`)
      onOpenChange(false)
      setName('')
      setTeamableId('')
      // ✨ P0-4: استخدم navigate بدل window.location — يحافظ على SPA + React Query cache
      onCreated(data.id)
    },
    onError: (err: unknown) => {
      toast.error(extractApiMessage(err, 'حدث خطأ أثناء الإنشاء'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !teamableId) {
      toast.error('املأ جميع الحقول')
      return
    }
    // ✨ إرسال lowercase ('hackathon' أو 'task') — Laravel يتوقع هذا
    mutation.mutate({
      name,
      teamableId: Number(teamableId),
      teamableType: teamableType,
    })
  }

  // ✨ اختيار القائمة المناسبة حسب النوع
  const teamableOptions = teamableType === 'hackathon' ? teamHackathons : teamTasks
  const hasOptions = teamableOptions.length > 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-ink-900 rounded-xl shadow-lg border border-ink-200 dark:border-ink-800 max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">إنشاء فريق جديد</h3>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-md hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <Input
                label="اسم الفريق"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: Code Warriors"
              />

              {/* ✨ اختيار نوع الفريق: هاكاثون أو مهمة */}
              <Select
                label="نوع المشاركة"
                required
                value={teamableType}
                onChange={(e) => {
                  setTeamableType(e.target.value as 'hackathon' | 'task')
                  setTeamableId('') // إعادة تعيين عند تغيير النوع
                }}
              >
                <option value="hackathon">هاكاثون</option>
                <option value="task">مهمة</option>
              </Select>

              {/* ✨ اختيار الـ teamable حسب النوع */}
              <Select
                label={teamableType === 'hackathon' ? 'اختر الهاكاثون' : 'اختر المهمة'}
                required
                value={teamableId}
                onChange={(e) => setTeamableId(e.target.value)}
              >
                <option value="" disabled>
                  {hasOptions
                    ? `اختر ${teamableType === 'hackathon' ? 'هاكاثوناً' : 'مهمة'}`
                    : `لا توجد ${teamableType === 'hackathon' ? 'هاكاثونات' : 'مهام'} فِرقية متاحة`}
                </option>
                {teamableOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </Select>

              {/* ✨ تنبيه عند عدم توفر خيارات */}
              {!hasOptions && (
                <div className="p-3 bg-warning-soft border border-warning-border rounded-md mb-5 text-sm text-warning">
                  <strong>تنبيه:</strong>{' '}
                  {teamableType === 'hackathon'
                    ? 'لا توجد هاكاثونات فِريقية مفعّلة حالياً. تواصل مع المسؤول.'
                    : 'لا توجد مهام فِريقية مفعّلة حالياً. تواصل مع المسؤول.'}
                </div>
              )}

              <div className="p-3 bg-info-soft border border-info-border rounded-md mb-5 text-sm text-info">
                <strong>ملاحظة:</strong>{' '}
                {teamableType === 'hackathon'
                  ? 'ستُنشأ كقائد للفريق تلقائياً وستتمكن من دعوة أعضاء بعد الإنشاء (حتى الحد الأقصى لكل هاكاثون).'
                  : 'ستُنشأ كقائد للفريق تلقائياً وستتمكن من دعوة أعضاء بعد الإنشاء (حتى الحد الأقصى لكل مهمة).'}
              </div>

              <div className="flex gap-2">
                <Button type="submit" block disabled={mutation.isPending || !hasOptions}>
                  {mutation.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    'إنشاء الفريق'
                  )}
                </Button>
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
