import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  mockCreateSubmission,
  mockUpdateSubmission,
  mockDeleteSubmission,
  mockGetSubmission,
} from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { extractApiMessage } from '@/lib/errors'
import type { Submission } from '@/types'

// =====================================================
// Submissions — queries + mutations في مكان واحد
// =====================================================
// قبل هذا الـ hook، كانت ثلاث صفحات (New/Edit/List/Details) تكرّر pattern
// الـ mutation يدوياً (mutationFn + invalidate + toast + onError). الآن كل
// منطق التقديمات (إنشاء/تعديل/حذف/جلب) مُدار من هنا.

export type CreateSubmissionPayload = Partial<Submission> & { file?: File }
export type UpdateSubmissionPayload = Partial<Submission>

/** جلب تقديم واحد بالـ id. */
export function useSubmission(id: number | null) {
  return useQuery({
    queryKey: id ? queryKeys.submission(id) : ['submission', 'none'],
    queryFn: () => mockGetSubmission(id!),
    enabled: id != null,
  })
}

/** إنشاء تقديم. يُعيد التوجيه لصفحة التفاصيل عند النجاح. */
export function useCreateSubmission() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: CreateSubmissionPayload) => mockCreateSubmission(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
      toast.success('تم إنشاء التقديم بنجاح ✓')
      navigate(`/submissions/${data.id}`)
    },
    onError: (err: unknown) =>
      toast.error(extractApiMessage(err, 'حدث خطأ أثناء الإنشاء')),
  })
}

/** تعديل تقديم. يُعيد التوجيه لصفحة التفاصيل عند النجاح. */
export function useUpdateSubmission(submissionId: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: UpdateSubmissionPayload) => mockUpdateSubmission(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submission(submissionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
      toast.success('تم تعديل التقديم بنجاح ✓')
      navigate(`/submissions/${submissionId}`)
    },
    onError: (err: unknown) =>
      toast.error(extractApiMessage(err, 'حدث خطأ أثناء التعديل')),
  })
}

/** حذف تقديم. يُحدّث قائمة التقديمات + الإحصائيات. */
export function useDeleteSubmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => mockDeleteSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      toast.success('تم حذف التقديم')
    },
    onError: (err: unknown) =>
      toast.error(extractApiMessage(err, 'فشل الحذف')),
  })
}
