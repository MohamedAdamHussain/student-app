import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  mockPreviewTeam,
  mockCreateJoinRequest,
  mockGetMyJoinRequests,
  mockGetTeamJoinRequests,
  mockApproveJoinRequest,
  mockRejectJoinRequest,
  mockGetTeamsForTeamable,
} from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { extractApiMessage } from '@/lib/errors'
import type { TeamSummary } from '@/services'

/** فرق متاحة لـ teamable (لاكتشاف الانضمام). */
export function useTeamsForTeamable(teamableType: 'task' | 'hackathon' | null, teamableId: number | null) {
  return useQuery<TeamSummary[]>({
    queryKey: ['teams', 'for', teamableType ?? '_', teamableId ?? '_'],
    queryFn: () => mockGetTeamsForTeamable(teamableType!, teamableId!),
    enabled: teamableType != null && teamableId != null,
    staleTime: 30 * 1000,
  })
}

// =====================================================
// Join Requests — طلبات الانضمام للفرق (موافقة القائد)
// =====================================================
// نمط مطابق لـ useSubmissions: mutationFn = mock facade،
// onSuccess → invalidate + toast، onError → extractApiMessage + toast.

export function useMyJoinRequests() {
  return useQuery({
    queryKey: queryKeys.myJoinRequests,
    queryFn: mockGetMyJoinRequests,
  })
}

/** طلبات الفريق المعلّقة (للقائد فقط). */
export function useTeamJoinRequests(teamId: number | null) {
  return useQuery({
    queryKey: teamId ? queryKeys.teamJoinRequests(teamId) : ['teams', 'join-requests', 'none'],
    queryFn: () => mockGetTeamJoinRequests(teamId!),
    enabled: teamId != null,
  })
}

/** إرسال طلب انضمام. */
export function useCreateJoinRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ teamId, message }: { teamId: number; message?: string | null }) =>
      mockCreateJoinRequest(teamId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myJoinRequests })
      queryClient.invalidateQueries({ queryKey: ['teams'] }) // يُحدّث preview (canRequestJoin)
      toast.success('تم إرسال طلب الانضمام ✓')
    },
    onError: (err: unknown) =>
      toast.error(extractApiMessage(err, 'فشل إرسال الطلب')),
  })
}

/** موافقة القائد على طلب. يُحدّث الفريق + القائمة + طلباتي. */
export function useApproveJoinRequest(teamId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (joinRequestId: number) => mockApproveJoinRequest(teamId, joinRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team(teamId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.teamJoinRequests(teamId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myJoinRequests })
      queryClient.invalidateQueries({ queryKey: queryKeys.teams })
      toast.success('تمت الموافقة وإضافة العضو ✓')
    },
    onError: (err: unknown) =>
      toast.error(extractApiMessage(err, 'فشلت الموافقة على الطلب')),
  })
}

/** رفض القائد لطلب. */
export function useRejectJoinRequest(teamId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (joinRequestId: number) => mockRejectJoinRequest(teamId, joinRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teamJoinRequests(teamId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myJoinRequests })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('تم رفض الطلب')
    },
    onError: (err: unknown) =>
      toast.error(extractApiMessage(err, 'فشل رفض الطلب')),
  })
}
