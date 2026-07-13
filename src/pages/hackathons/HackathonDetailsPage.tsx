import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Trophy, Clock, Users, Plus, CheckCircle2, AlertCircle,
  Calendar, Info, ArrowLeft, UserPlus, Lock,
  Lightbulb,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { mockGetHackathon } from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { useTeamsForTeamable, useMyJoinRequests } from '@/hooks/useJoinRequests'
import { JoinRequestModal } from '@/components/teams/JoinRequestModal'
import { daysUntil, gradientFor } from '@/lib/utils'
import type { TeamPreview } from '@/types'

export function HackathonDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const hackathonId = Number(id)

  const { data: hackathon, isLoading } = useQuery({
    queryKey: queryKeys.hackathon(hackathonId),
    queryFn: () => mockGetHackathon(hackathonId),
    enabled: !!hackathonId,
  })

  // ✨ اكتشاف الفرق المتاحة للانضمام (للطالب بلا فريق في هذا الهاكاثون).
  const myTeam = hackathon?.myTeam ?? null
  const { data: availableTeams } = useTeamsForTeamable(
    hackathon?.isTeam ? 'hackathon' : null,
    hackathonId,
  )
  const { data: myRequests } = useMyJoinRequests()
  const [joinPreview, setJoinPreview] = useState<TeamPreview | null>(null)

  if (isLoading || !hackathon) {
    return (
      <AppShell title="تفاصيل الهاكاثون">
        <Skeleton className="h-96" />
      </AppShell>
    )
  }

  const days = daysUntil(hackathon.deadline)
  const hours = Math.max(0, days * 24)
  const isRegistered = !!myTeam

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
              {hackathon.isTeam ? `فِرقي · حتى ${hackathon.maxTeamSize} أعضاء` : 'فردي'}
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
              <div className="text-[11px] opacity-75 mb-1 uppercase">إجمالي التقديمات</div>
              <div className="text-lg font-bold">{hackathon.submissionsCount ?? 0}</div>
            </div>
            <div>
              <div className="text-[11px] opacity-75 mb-1 uppercase">حالتي</div>
              <div className="text-lg font-bold">
                {isRegistered ? 'مُسجّل' : 'غير مُسجّل'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA — يتغير حسب حالة التسجيل */}
      {!isRegistered && (
        <Card className="mb-6 bg-warning-soft border-warning-border">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-warning rounded-md grid place-items-center text-white">
                <Clock size={22} />
              </div>
              <div>
                <div className="font-bold text-warning">لم تُسجّل في هذا الهاكاثون بعد</div>
                <div className="text-sm text-ink-600 dark:text-ink-300">
                  {hackathon.isTeam
                    ? 'أنشئ فريقاً قبل انتهاء مهلة التسجيل'
                    : 'سلّم عملك قبل انتهاء المهلة'}
                </div>
              </div>
            </div>
            {hackathon.isTeam && (
              <Link to="/teams">
                <Button>
                  <Plus size={14} />
                  إنشاء فريق جديد
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Left */}
        <div className="space-y-5">
          <Card>
            <CardTitle className="mb-4">تفاصيل التحدي</CardTitle>
            <div className="text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
              {hackathon.description}
            </div>
          </Card>

          {/* My Team — بديل "الفرق المسجّلة" (لا يمكن رؤية فرق الآخرين أمنياً) */}
          {hackathon.isTeam && (
            <Card>
              <CardTitle className="mb-4">فريقي في هذا الهاكاثون</CardTitle>
              {myTeam ? (
                <div className="flex items-center gap-4 p-4 border border-ink-200 dark:border-ink-800 rounded-md">
                  <div
                    className="w-11 h-11 rounded-md grid place-items-center text-white font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${gradientFor(myTeam.name)[0]}, ${gradientFor(myTeam.name)[1]})` }}
                  >
                    {myTeam.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{myTeam.name}</div>
                    <div className="text-xs text-ink-400">
                      {myTeam.teamMembers?.length ?? 0} أعضاء · أُنشئ قبل {daysUntil(myTeam.createdAt)} يوم
                    </div>
                  </div>
                  <div className="flex items-center -space-x-2 space-x-reverse">
                    {myTeam.teamMembers?.slice(0, 4).map((m) => (
                      <Avatar key={m.id} name={m.user.name} size="sm" className="border-2 border-white dark:border-ink-900" />
                    ))}
                  </div>
                  <Link to={`/teams/${myTeam.id}`}>
                    <Button variant="secondary" size="sm">عرض</Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 text-ink-400 text-sm">
                  <Users size={28} className="mx-auto mb-2 text-ink-300" />
                  لم تنشئ فريقاً لهذا الهاكاثون بعد
                </div>
              )}
            </Card>
          )}

          {/* ✨ الفرق المتاحة للانضمام — يظهر للطالب بلا فريق في هاكاثون جماعي. */}
          {hackathon.isTeam && !myTeam && availableTeams && availableTeams.length > 0 && (
            <Card>
              <CardTitle className="mb-1">الفرق المتاحة للانضمام</CardTitle>
              <p className="text-sm text-ink-400 mb-4">
                اطلب الانضمام لفريق قائم — القائد يراجع طلبك ويوافق.
              </p>
              <div className="flex flex-col gap-3">
                {availableTeams.map((t) => {
                  // هل أرسلنا طلباً لهذا الفريق سابقاً؟
                  const myReq = myRequests?.find((r) => r.teamId === t.id)
                  const requested = !!myReq
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-4 p-4 border border-ink-200 dark:border-ink-800 rounded-md"
                    >
                      <div
                        className="w-11 h-11 rounded-md grid place-items-center text-white font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${gradientFor(t.name)[0]}, ${gradientFor(t.name)[1]})` }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-xs text-ink-400">
                          {t.membersCount}
                          {t.maxTeamSize ? ` / ${t.maxTeamSize}` : ''} أعضاء
                          {t.leaderName ? ` · القائد: ${t.leaderName}` : ''}
                        </div>
                      </div>
                      {t.canRequestJoin && !requested && (
                        <Button
                          size="sm"
                          onClick={() =>
                            setJoinPreview({
                              id: t.id,
                              name: t.name,
                              teamableType: 'hackathon',
                              teamableId: hackathon.id,
                              teamableTitle: hackathon.title,
                              membersCount: t.membersCount,
                              maxTeamSize: t.maxTeamSize,
                              leaderName: t.leaderName,
                              canRequestJoin: true,
                            })
                          }
                        >
                          <UserPlus size={14} />
                          طلب الانضمام
                        </Button>
                      )}
                      {requested && (
                        <Badge variant={myReq!.status === 'approved' ? 'success' : myReq!.status === 'rejected' ? 'danger' : 'warning'}>
                          {myReq!.status === 'approved' ? 'مقبول' : myReq!.status === 'rejected' ? 'مرفوض' : 'بانتظار القائد'}
                        </Badge>
                      )}
                      {!t.canRequestJoin && !requested && (
                        <span className="text-xs text-ink-400 flex items-center gap-1">
                          <Lock size={12} /> غير متاح
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* My Result — لو وُجد score/rank من الـ backend */}
          {hackathon.myScore != null && (
            <Card className="bg-success-soft border-success-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success rounded-md grid place-items-center text-white">
                  <Trophy size={18} />
                </div>
                <div>
                  <div className="font-bold text-success">
                    نتيجتي: {hackathon.myScore.toFixed(1)}/10
                    {hackathon.myRank != null && ` · المرتبة #${hackathon.myRank}`}
                  </div>
                  <div className="text-sm text-ink-600 dark:text-ink-300">
                    نتائج هذا الهاكاثون
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right */}
        <aside className="space-y-5">
          <Card>
            <CardTitle className="mb-4">ملخص الهاكاثون</CardTitle>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-ink-500 flex items-center gap-1.5">
                  <Calendar size={14} /> الموعد النهائي
                </span>
                <span className="font-bold">{hackathon.deadline.split('T')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-500 flex items-center gap-1.5">
                  <Users size={14} /> نوع العمل
                </span>
                <span className="font-bold">
                  {hackathon.isTeam ? `فِرقي (حتى ${hackathon.maxTeamSize})` : 'فردي'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-500 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> إجمالي التقديمات
                </span>
                <span className="font-bold">{hackathon.submissionsCount ?? 0}</span>
              </div>
              {isRegistered && (
                <div className="flex justify-between">
                  <span className="text-sm text-ink-500 flex items-center gap-1.5">
                    <AlertCircle size={14} /> حالة التسجيل
                  </span>
                  <Badge variant="success">مُسجّل</Badge>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-info-soft border-info-border">
            <div className="flex items-center gap-2 mb-2">
              <Info size={18} className="text-info" />
              <div className="font-semibold text-info">عن الهاكاثون</div>
            </div>
            <div className="text-sm text-ink-600 dark:text-ink-300">
              {hackathon.isTeam
                ? 'هذا الهاكاثون يتطلب عملاً جماعياً. أنشئ فريقاً أو انضم لفريق موجود للمشاركة.'
                : 'هذا الهاكاثون فردي. سلّم عملك مباشرة قبل الموعد النهائي.'}
            </div>
          </Card>
        </aside>
      </div>

      {/* ✨ نافذة طلب الانضمام */}
      <JoinRequestModal
        open={!!joinPreview}
        onOpenChange={(v) => !v && setJoinPreview(null)}
        preview={joinPreview}
      />
    </AppShell>
  )
}
