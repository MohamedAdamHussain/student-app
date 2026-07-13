import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  mockGetProfile,
  mockGetTracks,
  mockGetSubmissions,
  mockUpdateProfile,
  mockDeleteCv,
  mockUploadAvatar,
  mockDeleteAvatar,
} from '@/lib/mockData'
import { queryKeys } from '@/lib/queryClient'
import { extractApiMessage } from '@/lib/errors'
import { useAuth, useCurrentUser } from '@/context/AuthContext'
import type { StudentProfile } from '@/types'

// =====================================================
// Profile — queries + mutations في مكان واحد
// =====================================================
// قبل هذا الـ hook، كانت ProfileEditPage تحتوي على 4 mutations + 3 queries
// مع تكرار منطق invalidation و toast في كل واحد. الآن كل منطق الـ profile
// (جلب/تعديل/حذف CV/صورة) يُدار من هنا، والصفحة تركّز على الـ UI فقط.
//
// ملاحظة: تحديث الـ user (avatar) يتم عبر invalidateUser() من AuthContext،
// فلا حاجة لـ window.dispatchEvent أو تعديل localStorage يدوياً.

/** جلب الـ profile الكامل من الخادم. */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: mockGetProfile,
  })
}

/** جلب المسارات المتاحة. */
export function useTracks() {
  return useQuery({
    queryKey: queryKeys.tracks,
    queryFn: mockGetTracks,
  })
}

/** جلب تقديماتي (لتحديد المشروع المميز). */
export function useMySubmissions() {
  return useQuery({
    queryKey: queryKeys.submissions,
    queryFn: () => mockGetSubmissions(),
  })
}

/** نوع حمولة تحديث الـ profile (يدعم رفع CV كـ File + tracks كأرقام). */
export type UpdateProfilePayload = Omit<Partial<StudentProfile>, 'tracks'> & {
  cv?: File
  tracks?: number[]
}

/** تعديل الـ profile. يُحدّث cache + يعيد التوجيه لصفحة العرض عند النجاح. */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => mockUpdateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      toast.success('تم حفظ التغييرات بنجاح ✓')
      navigate('/profile')
    },
    onError: (err: unknown) => {
      toast.error(extractApiMessage(err, 'حدث خطأ أثناء الحفظ'))
    },
  })
}

/** حذف السيرة الذاتية. */
export function useDeleteCv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => mockDeleteCv(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      toast.success('تم حذف السيرة الذاتية')
    },
    onError: (err: unknown) => toast.error(extractApiMessage(err, 'فشل حذف السيرة الذاتية')),
  })
}

/** رفع صورة شخصية جديدة. يُحدّث الـ user عبر AuthContext تلقائياً. */
export function useUploadAvatar() {
  const queryClient = useQueryClient()
  const { invalidateUser } = useAuth()
  return useMutation({
    mutationFn: (file: File) => mockUploadAvatar(file),
    onSuccess: (data) => {
      // ✨ حدّث cache الـ profile فوراً + أعد جلب الـ user من AuthContext
      queryClient.setQueryData(queryKeys.profile, data.user.studentProfile)
      invalidateUser()
      toast.success('تم تحديث الصورة الشخصية ✓')
    },
    onError: (err: unknown) => toast.error(extractApiMessage(err, 'فشل رفع الصورة')),
  })
}

/** حذف الصورة الشخصية. يُحدّث الـ user عبر AuthContext تلقائياً. */
export function useDeleteAvatar() {
  const queryClient = useQueryClient()
  const { invalidateUser } = useAuth()
  return useMutation({
    mutationFn: () => mockDeleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      invalidateUser()
      toast.success('تم حذف الصورة الشخصية')
    },
    onError: (err: unknown) => toast.error(extractApiMessage(err, 'فشل حذف الصورة')),
  })
}

/** يُستخدم في الصفحات التي تحتاج فقط لـ user الحالي للعرض. */
export { useCurrentUser }
