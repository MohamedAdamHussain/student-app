import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Trophy, Users, Crown, UserPlus, Star, CheckSquare,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input, Select } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { mockGetTeams, mockGetHackathons, mockCreateTeam } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { toast } from 'sonner'
import { formatRelative, gradientFor, cn } from '@/lib/utils'
import type { Team } from '@/types'

type TabKey = 'all' | 'leader' | 'member'

export function TeamsListPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>('all')
  const [modalOpen, setModalOpen] = useState(false)

  const { data: teams, isLoading } = useQuery({
    queryKey: queryKeys.teams,
    queryFn: mockGetTeams,
  })
  const { data: hackathons } = useQuery({
    queryKey: queryKeys.hackathons,
    queryFn: mockGetHackathons,
  })

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
              <p className="text-sm text-ink-400 mb-4">أنشئ فريقك الأول للمشاركة في الهاكاثونات</p>
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

          {/* Other teams to join */}
          {otherTeams.length > 0 && (
            <>
              <h2 className="text-lg font-bold mt-8 mb-4">فرق تبحث عن أعضاء</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {otherTeams.slice(0, 2).map((team) => (
                  <Card key={team.id} className="border-dashed">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="warning">هاكاثون</Badge>
                      <span className="text-xs text-ink-400">
                        {team.teamMembers.length}/{team.teamable?.maxTeamSize ?? 4} أعضاء
                      </span>
                    </div>
                    <h3 className="font-bold mb-2">{team.name}</h3>
                    <p className="text-sm text-ink-500 mb-4 line-clamp-2">
                      فريق يبحث عن عضو إضافي. القائد: {team.teamMembers.find((m) => m.isLeader)?.user.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center -space-x-2 space-x-reverse">
                        {team.teamMembers.slice(0, 4).map((m) => (
                          <Avatar key={m.id} name={m.user.name} size="sm" className="border-2 border-white dark:border-ink-900" />
                        ))}
                      </div>
                      <Button size="sm">
                        <UserPlus size={14} />
                        طلب الانضمام
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <CreateTeamModal open={modalOpen} onOpenChange={setModalOpen} hackathons={hackathons ?? []} />
    </AppShell>
  )
}

function TeamCard({ team, currentUserId }: { team: Team; currentUserId: number }) {
  const myMembership = team.teamMembers.find((m) => m.userId === currentUserId)
  const isLeader = myMembership?.isLeader
  const maxSize = team.teamable?.maxTeamSize ?? 4
  const isFull = team.teamMembers.length >= maxSize
  const isCompleted = team.teamable && 'deadline' in team.teamable && new Date(team.teamable.deadline).getTime() < Date.now()

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
            <Badge variant="warning">هاكاثون</Badge>
            {isCompleted && <Badge variant="neutral">منتهي</Badge>}
          </div>
          <span className="text-xs text-ink-400">
            {team.teamMembers.length} أعضاء
          </span>
        </div>

        <h3 className="text-lg font-bold mb-2">{team.name}</h3>
        <p className="text-sm text-ink-500 mb-4 line-clamp-1">
          لـ {(team.teamable as any)?.title ?? 'هاكاثون'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center -space-x-2 space-x-reverse">
            {team.teamMembers.slice(0, 4).map((m) => (
              <Avatar
                key={m.id}
                name={m.user.name}
                size="sm"
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
      </Card>
    </Link>
  )
}

function CreateTeamModal({
  open, onOpenChange, hackathons,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  hackathons: any[]
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [hackathonId, setHackathonId] = useState('')

  const mutation = useMutation({
    mutationFn: mockCreateTeam,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams })
      toast.success(`تم إنشاء فريق ${data.name} ✓`)
      onOpenChange(false)
      setName('')
      setHackathonId('')
      window.location.href = `/teams/${data.id}`
    },
    onError: () => toast.error('حدث خطأ أثناء الإنشاء'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !hackathonId) {
      toast.error('املأ جميع الحقول')
      return
    }
    mutation.mutate({ name, teamableId: Number(hackathonId), teamableType: 'Hackathon' })
  }

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

              <Select
                label="اختر الهاكاثون"
                required
                value={hackathonId}
                onChange={(e) => setHackathonId(e.target.value)}
              >
                <option value="" disabled>اختر هاكاثوناً</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>{h.title}</option>
                ))}
              </Select>

              <div className="p-3 bg-info-soft border border-info-border rounded-md mb-5 text-sm text-info">
                <strong>ملاحظة:</strong> ستُنشأ كقائد للفريق تلقائياً وستتمكن من دعوة أعضاء بعد الإنشاء.
              </div>

              <div className="flex gap-2">
                <Button type="submit" block disabled={mutation.isPending}>
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
