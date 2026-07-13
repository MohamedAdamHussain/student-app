import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Clock, Users, Calendar, Medal } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/common/Pagination'
import { mockGetHackathons } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { daysUntil, cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type { Hackathon } from '@/types'

type TabKey = 'active' | 'upcoming' | 'completed'

export function HackathonsListPage() {
  const [tab, setTab] = useState<TabKey>('active')
  const [page, setPage] = useState(1)
  const { user } = useAuth()

  // ✨ Stage 7: PaginatedResponse
  const { data: hackathonsData, isLoading } = useQuery({
    queryKey: [...queryKeys.hackathons, page],
    queryFn: () => mockGetHackathons({ page }),
  })

  const hackathons = hackathonsData?.data ?? []
  const meta = hackathonsData?.meta

  const filtered = hackathons.filter((h) => {
    const days = daysUntil(h.deadline)
    if (tab === 'active') return days >= 0 && days <= 7
    if (tab === 'upcoming') return days > 7
    return days < 0
  })

  const counts = {
    active: hackathons.filter((h) => daysUntil(h.deadline) >= 0 && daysUntil(h.deadline) <= 7).length,
    upcoming: hackathons.filter((h) => daysUntil(h.deadline) > 7).length,
    completed: hackathons.filter((h) => daysUntil(h.deadline) < 0).length,
  }

  // ✨ P1-1: title ديناميكي
  const batchName = user?.batch?.name ?? (user?.batchId ? `Batch ${user.batchId}` : 'دفعتك')

  return (
    <AppShell title="الهاكاثونات">
      <PageHeader
        title={`هاكاثونات ${batchName}`}
        subtitle="مسابقات برمجية مكثفة بمدة محدودة · شارك بفريق أو فردياً"
        breadcrumbs={[{ label: 'الرئيسية', to: '/dashboard' }, { label: 'الهاكاثونات' }]}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-200 dark:border-ink-800 mb-5">
        {(['active', 'upcoming', 'completed'] as TabKey[]).map((t) => (
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
            {t === 'active' ? 'النشطة' : t === 'upcoming' ? 'القادمة' : 'المنتهية'}
            <span className="mr-1.5 text-xs opacity-70">({counts[t]})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-5">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <HackathonCard hackathon={h} />
            </motion.div>
          ))}
        </div>
      )}

      {/* ✨ Stage 7: Pagination controls */}
      {meta && (
        <Pagination
          meta={meta}
          onPageChange={(p) => setPage(p)}
          loading={isLoading}
        />
      )}
    </AppShell>
  )
}

function HackathonCard({ hackathon }: { hackathon: Hackathon }) {
  const days = daysUntil(hackathon.deadline)
  const isCompleted = days < 0
  const isActive = days >= 0 && days <= 7
  const isUpcoming = days > 7

  return (
    <Link to={`/hackathons/${hackathon.id}`}>
      <Card
        hoverable
        className={cn('h-full relative overflow-hidden', isCompleted && 'opacity-90')}
      >
        {isActive && (
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: 'linear-gradient(90deg, #F59E0B, #EF4444)' }}
          />
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {isActive && (
              <Badge variant="warning">
                <span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
                نشط الآن
              </Badge>
            )}
            {isUpcoming && <Badge variant="info">قادم</Badge>}
            {isCompleted && <Badge variant="neutral">منتهي</Badge>}
            <Badge variant={hackathon.isTeam ? 'accent' : 'neutral'}>
              {hackathon.isTeam ? `فِرقي · حتى ${hackathon.maxTeamSize}` : 'فردي'}
            </Badge>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2">{hackathon.title}</h3>
        <p className="text-sm text-ink-500 mb-4 leading-relaxed line-clamp-2">
          {hackathon.description}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-xs text-ink-400 mb-1">الموعد النهائي</div>
            <div className="font-bold flex items-center gap-1">
              <Calendar size={14} className={isActive ? 'text-warning' : 'text-ink-400'} />
              {hackathon.deadline.split('T')[0]}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-400 mb-1">
              {isCompleted ? 'انتهى قبل' : 'متبقي'}
            </div>
            <div
              className={cn(
                'font-bold',
                isActive && 'text-warning',
                isUpcoming && 'text-info',
                isCompleted && 'text-ink-400',
              )}
            >
              {isCompleted ? `${Math.abs(days)} أيام` : `${days} ${days <= 1 ? 'يوم' : 'أيام'}`}
            </div>
          </div>
        </div>

        <div className="border-t border-ink-100 dark:border-ink-800 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <Users size={14} />
            <span>{hackathon.submissionsCount ?? 0} {hackathon.isTeam ? 'فرق' : 'مشترك'}</span>
          </div>
          {hackathon.myRank && (
            <Badge variant="success">
              <Medal size={12} />
              {/* ✨ P0-1: score من 10 — لا /100 */}
              المركز #{hackathon.myRank} · {hackathon.myScore?.toFixed(1)}/10
            </Badge>
          )}
          {!isCompleted && !hackathon.myTeam && (
            <Badge variant="accent">سجّل الآن</Badge>
          )}
          {!isCompleted && hackathon.myTeam && (
            <Badge variant="success">مسجّل</Badge>
          )}
        </div>
      </Card>
    </Link>
  )
}
