import type { User, StudentProfile, CompanyProfile, Batch, Submission } from '@/types'

/**
 * تحويل snake_case إلى camelCase لمفتاح واحد
 */
function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * تحويل أي object من snake_case إلى camelCase (بشكل تعاودي)
 */
export function transformToCamelCase<T>(obj: any): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(transformToCamelCase) as T
  if (typeof obj !== 'object') return obj

  const transformed: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key)
      transformed[camelKey] = transformToCamelCase(obj[key])
    }
  }
  return transformed as T
}

/**
 * تحويل استجابة Laravel للمستخدم (snake_case → camelCase)
 * - student_profile → studentProfile
 * - company_profile → companyProfile
 * - created_at يبقى كما هو (التواريخ لا تحتاج تحويل)
 */
export function transformUser(rawUser: any): User {
  if (!rawUser) return rawUser

  const transformed: User = {
    id: rawUser.id,
    name: rawUser.name,
    email: rawUser.email,
    role: rawUser.role,
    avatar: rawUser.avatar,
    batchId: rawUser.batch_id,
    createdAt: rawUser.created_at,
    studentProfile: rawUser.student_profile
      ? transformToCamelCase<StudentProfile>(rawUser.student_profile)
      : rawUser.studentProfile
        ? transformToCamelCase<StudentProfile>(rawUser.studentProfile)
        : undefined,
    companyProfile: rawUser.company_profile
      ? transformToCamelCase<CompanyProfile>(rawUser.company_profile)
      : rawUser.companyProfile
        ? transformToCamelCase<CompanyProfile>(rawUser.companyProfile)
        : undefined,
  }

  // ✨ batch يُضاف كـ optional property (لا يوجد في النوع الأساسي)
  ;(transformed as any).batch = rawUser.batch
    ? transformToCamelCase<Batch>(rawUser.batch)
    : undefined

  return transformed
}

/**
 * تحويل استجابة Laravel لـ AuthResponse (login / register)
 */
export function transformAuthResponse(rawResponse: any): { user: User; token: string } {
  return {
    user: transformUser(rawResponse.user),
    token: rawResponse.token,
  }
}

/**
 * تحويل استجابة Student Profile
 */
export function transformStudentProfile(rawProfile: any): StudentProfile {
  return transformToCamelCase<StudentProfile>(rawProfile)
}

/**
 * تحويل استجابة Submission (تشمل relations)
 */
export function transformSubmission(rawSubmission: any): Submission {
  return transformToCamelCase<Submission>(rawSubmission)
}
