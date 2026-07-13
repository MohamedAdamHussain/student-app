import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  mockCreateProposal,
  mockUpdateProposal,
  mockDeleteProposal,
  mockGetProposal,
} from '@/lib/mockData'
import { proposalKeys } from '@/lib/queryClient'
import { extractApiMessage } from '@/lib/errors'
import type { CreateProposalData } from '@/types'

// =====================================================
// Feature Proposals — queries + mutations في مكان واحد
// =====================================================
// قبل هذا الـ hook، كانت ثلاث صفحات (Builder/Edit/Details) تكرّر pattern
// الـ mutation يدوياً (mutationFn + invalidate + toast + onError). الآن كل
// منطق الاقتراحات (إنشاء/تعديل/حذف/جلب) مُدار من هنا.

/** جلب اقتراح واحد بالـ id. */
export function useProposal(id: number | null) {
  return useQuery({
    queryKey: id ? proposalKeys.detail(id) : ['proposals', 'none'],
    queryFn: () => mockGetProposal(id!),
    enabled: id != null,
  })
}

/** إنشاء اقتراح لهاكاثون. يُعيد التوجيه لصفحة التفاصيل عند النجاح. */
export function useCreateProposal(hackathonId: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: CreateProposalData) => mockCreateProposal(hackathonId, data),
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.hackathon(hackathonId) })
      queryClient.invalidateQueries({ queryKey: proposalKeys.mine })
      toast.success('تم إرسال اقتراحك بنجاح! 🚀')
      navigate(`/proposals/${proposal.id}`)
    },
    onError: (err: unknown) =>
      toast.error(extractApiMessage(err, 'حدث خطأ أثناء الإرسال')),
  })
}

/** تعديل اقتراح. يُعيد التوجيه لصفحة التفاصيل عند النجاح. */
export function useUpdateProposal(proposalId: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: Partial<CreateProposalData>) => mockUpdateProposal(proposalId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) })
      queryClient.invalidateQueries({ queryKey: proposalKeys.hackathon(updated.hackathonId) })
      queryClient.invalidateQueries({ queryKey: proposalKeys.mine })
      toast.success('تم تعديل الاقتراح بنجاح ✓')
      navigate(`/proposals/${proposalId}`)
    },
    onError: (err: unknown) =>
      toast.error(extractApiMessage(err, 'حدث خطأ أثناء التعديل')),
  })
}

/** حذف اقتراح. يُعيد التوجيه لصفحة الهاكاثون المرتبط عند النجاح. */
export function useDeleteProposal(proposalId: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => mockDeleteProposal(proposalId),
    onSuccess: () => {
      // ✨ اقرأ hackathonId من cache وقت النجاح (لا نعرفه عند التهيئة)
      const proposal = queryClient.getQueryData<import('@/types').FeatureProposal>(
        proposalKeys.detail(proposalId),
      )
      const hackathonId = proposal?.hackathonId

      queryClient.invalidateQueries({ queryKey: proposalKeys.all })
      queryClient.invalidateQueries({ queryKey: proposalKeys.mine })
      if (hackathonId) {
        queryClient.invalidateQueries({ queryKey: proposalKeys.hackathon(hackathonId) })
      }
      toast.success('تم حذف الاقتراح')
      navigate(hackathonId ? `/hackathons/${hackathonId}` : '/hackathons')
    },
    onError: (err: unknown) =>
      toast.error(extractApiMessage(err, 'فشل الحذف')),
  })
}
