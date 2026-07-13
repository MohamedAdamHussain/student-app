import type { User, StudentProfile, CompanyProfile, Batch, Submission, Team, TeamableType } from '@/types'

/**
 * تحويل snake_case إلى camelCase لمفتاح واحد
 */
function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * تحويل camelCase إلى snake_case لمفتاح واحد
 */
function toSnakeCase(key: string): string {
  return key.replace(/([A-Z])/g, (_, letter) => '_' + letter.toLowerCase())
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
 * تحويل أي object من camelCase → snake_case (بشكل تعاودي)
 * ✨ يُستخدم قبل إرسال البيانات للـ Laravel API
 */
export function transformToSnakeCase<T>(obj: any): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(transformToSnakeCase) as T
  if (typeof obj !== 'object' || obj instanceof Date || obj instanceof File) return obj

  const transformed: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = toSnakeCase(key)
      transformed[snakeKey] = transformToSnakeCase(obj[key])
    }
  }
  return transformed as T
}

/**
 * تحويل استجابة Laravel للمستخدم (snake_case → camelCase)
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
    // ✨ B6: حالة التحقق من البريد
    emailVerifiedAt: rawUser.email_verified_at ?? null,
    // ✨ B4: حالة تفعيل الحساب (من toggle-active في الأدمن)
    isActive: rawUser.is_active ?? null,
    batch: rawUser.batch ? transformToCamelCase<Batch>(rawUser.batch) : null,
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

/**
 * ✨ تحويل استجابة Team مع تطبيع teamableType
 *
 * Laravel يخزن polymorphic teamable_type كاسم الفئة الكامل:
 *   - 'App\\Models\\Hackathon'
 *   - 'App\\Models\\Task'
 *
 * لكن الواجهة تتوقع اسم قصير صغير (lowercase short):
 *   - 'hackathon'
 *   - 'task'
 */
export function transformTeam(rawTeam: any): Team {
  if (!rawTeam) return rawTeam

  const team = transformToCamelCase<Team>(rawTeam)
  const rawType = (rawTeam.teamable_type ?? rawTeam.teamableType ?? '') as string
  // ✨ cast آمن: normalizeTeamableType يُرجع دائماً 'task' | 'hackathon'
  team.teamableType = normalizeTeamableType(rawType)

  return team
}

/**
 * تطبيع قيمة teamableType من أي صيغة إلى 'hackathon' أو 'task'
 */
export function normalizeTeamableType(rawType: string): TeamableType {
  if (!rawType) return 'task'
  const lower = rawType.toLowerCase()
  if (lower.includes('hackathon')) return 'hackathon'
  if (lower.includes('task')) return 'task'
  return 'task'
}

