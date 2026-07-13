// =====================================================
// Real API Services — تتصل بـ Laravel Backend
// =====================================================
// كل دالة هنا تستدعي endpoint حقيقي في Laravel
// يتم استخدامها تلقائياً عندما VITE_USE_MOCK=false
// (راجع src/lib/mockData.ts للـ fallback logic)
//
// ✨ ملاحظة: كل الاستجابات تُحوّل من snake_case إلى camelCase
// عبر transformToCamelCase / transformUser

import { api, extractPaginatedData, extractPaginated, type PaginatedResponse } from '@/lib/api'
import {
  transformToCamelCase,
  transformToSnakeCase,
  transformUser,
  transformAuthResponse,
  transformStudentProfile,
  transformSubmission,
  transformTeam,
} from '@/lib/transforms'
import type {
  AuthResponse,
  Batch,
  CreateProposalData,
  DashboardStats,
  FeatureProposal,
  Hackathon,
  JoinRequest,
  LoginCredentials,
  RegisterData,
  Skill,
  StudentProfile,
  Submission,
  Task,
  Team,
  TeamPreview,
  Track,
  User,
} from '@/types'

// ============== AUTH ==============

export async function loginApi(creds: LoginCredentials): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', creds)
  // ✨ تحويل snake_case → camelCase (student_profile → studentProfile)
  return transformAuthResponse(data)
}

// ============== EMAIL VERIFICATION ==============
// ✨ B6: التحقق من البريد الإلكتروني (سياسة تذكيرية — لا حجب).

/**
 * POST /auth/verify-email — تأكيد البريد عبر الرمز المُرسل.
 * endpoint عام (لا يتطلب auth) — يُستدعى من صفحة VerifyEmailPage
 * سواء أتى المستخدم من رابط الإيميل أو أدخل الرمز يدوياً.
 *
 * @param payload.token  الرمز الطويل المُرسل في رابط الإيميل
 * @param payload.email  البريد المُراد تأكيده
 */
export async function verifyEmailApi(payload: {
  token: string
  email: string
}): Promise<{ message: string }> {
  const { data } = await api.post('/auth/verify-email', payload)
  return data
}

/**
 * POST /auth/resend-verification — إعادة إرسال رمز تحقق جديد.
 * يتطلب auth (Bearer token) — يستدعيه المستخدم المسجّل دخول فقط.
 * الـ backend لا يكشف هل البريد مُتحقَّق أم لا (منع enumeration).
 */
export async function resendVerificationApi(): Promise<{ message: string }> {
  const { data } = await api.post('/auth/resend-verification')
  return data
}

export async function registerApi(payload: RegisterData): Promise<AuthResponse> {
  // ✨ B1: Laravel RegisterRequest يتوقع snake_case (password_confirmation, batch_id, company_name).
  // transformToSnakeCase يحوّل passwordConfirmation → password_confirmation إلخ.
  const snakePayload = transformToSnakeCase<Omit<RegisterData, 'password'> & { password: string }>(payload)
  const { data } = await api.post('/auth/register', snakePayload)
  return transformAuthResponse(data)
}

export async function getMeApi(): Promise<User> {
  const { data } = await api.get('/auth/me')
  return transformUser(data)
}

// ============== DASHBOARD ==============

export async function getDashboardStatsApi(): Promise<DashboardStats> {
  const { data } = await api.get('/dashboard/stats')
  // ✨ BUG FIX: Laravel يُرجع snake_case (total_submissions, average_score, rank_in_batch)
  // يجب تحويلها لـ camelCase قبل الإرجاع للـ UI
  return transformToCamelCase<DashboardStats>(data)
}

// ============== TASKS ==============

export async function getTasksApi(filters?: {
  batch_id?: number
  type?: string
  page?: number
}): Promise<PaginatedResponse<Task>> {
  const { data } = await api.get('/tasks', { params: filters })
  const paginated = extractPaginated<any>(data)
  return {
    data: paginated.data.map((t) => transformToCamelCase<Task>(t)),
    meta: paginated.meta,
  }
}

export async function getTaskApi(id: number): Promise<Task> {
  const { data } = await api.get(`/tasks/${id}`)
  return transformToCamelCase<Task>(data)
}

// ============== HACKATHONS ==============

export async function getHackathonsApi(filters?: {
  batch_id?: number
  page?: number
}): Promise<PaginatedResponse<Hackathon>> {
  const { data } = await api.get('/hackathons', { params: filters })
  const paginated = extractPaginated<any>(data)
  return {
    data: paginated.data.map((h) => transformToCamelCase<Hackathon>(h)),
    meta: paginated.meta,
  }
}

export async function getHackathonApi(id: number): Promise<Hackathon> {
  const { data } = await api.get(`/hackathons/${id}`)
  return transformToCamelCase<Hackathon>(data)
}

// ============== SUBMISSIONS ==============

export async function getSubmissionsApi(filters?: {
  task_id?: number
  hackathon_id?: number
  status?: string
  page?: number
}): Promise<PaginatedResponse<Submission>> {
  const { data } = await api.get('/submissions', { params: filters })
  const paginated = extractPaginated<any>(data)
  return {
    data: paginated.data.map((s) => transformSubmission(s)),
    meta: paginated.meta,
  }
}

export async function getSubmissionApi(id: number): Promise<Submission> {
  const { data } = await api.get(`/submissions/${id}`)
  return transformSubmission(data)
}

/**
 * ✨ P0 FIX: PUT /submissions/{submission} — تعديل التقديم (فقط pending).
 *
 * الـ backend (SubmissionController@update) يقبل: github_url, live_url,
 * video_url, notes (كلها nullable) + file_path اختياري (multipart).
 * يُرجع SubmissionResource (snake_case) — يجب تحويله عبر transformSubmission.
 *
 * @param id        معرّف التقديم
 * @param payload   الحقول القابلة للتعديل (snake_case، كما ينتظرها الـ backend)
 * @param file      ملف مرفق اختياري (يُرسل عبر FormData عند وجوده)
 */
export async function updateSubmissionApi(
  id: number,
  payload: { github_url?: string | null; live_url?: string | null; video_url?: string | null; notes?: string | null },
  file?: File | null,
): Promise<Submission> {
  // ✨ رفع ملف → FormData (multipart)
  if (file) {
    const formData = new FormData()
    formData.append('file_path', file)
    if (payload.github_url !== undefined) formData.append('github_url', payload.github_url ?? '')
    if (payload.live_url !== undefined) formData.append('live_url', payload.live_url ?? '')
    if (payload.video_url !== undefined) formData.append('video_url', payload.video_url ?? '')
    if (payload.notes !== undefined) formData.append('notes', payload.notes ?? '')
    const { data } = await api.put(`/submissions/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return transformSubmission(data)
  }

  // ✨ JSON — الـ URLs الفارغة → null (يتجاوز Laravel url validation)
  const jsonPayload: Record<string, unknown> = {}
  if (payload.github_url !== undefined) jsonPayload.github_url = payload.github_url === '' ? null : payload.github_url
  if (payload.live_url !== undefined) jsonPayload.live_url = payload.live_url === '' ? null : payload.live_url
  if (payload.video_url !== undefined) jsonPayload.video_url = payload.video_url === '' ? null : payload.video_url
  if (payload.notes !== undefined) jsonPayload.notes = payload.notes

  const { data } = await api.put(`/submissions/${id}`, jsonPayload)
  return transformSubmission(data)
}

export async function createSubmissionApi(payload: Partial<Submission> & { file?: File }): Promise<Submission> {
  // Handle file upload via FormData
  if (payload.file) {
    const formData = new FormData()
    formData.append('file_path', payload.file)

    // ✨ P0-2: استخدم camelCase من payload (لا snake_case)
    if (payload.taskId) formData.append('task_id', String(payload.taskId))
    if (payload.hackathonId) formData.append('hackathon_id', String(payload.hackathonId))
    if (payload.teamId) formData.append('team_id', String(payload.teamId))
    if (payload.githubUrl) formData.append('github_url', payload.githubUrl)
    if (payload.liveUrl) formData.append('live_url', payload.liveUrl)
    if (payload.videoUrl) formData.append('video_url', payload.videoUrl)
    if (payload.notes) formData.append('notes', payload.notes)

    const { data } = await api.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return transformSubmission(data)
  }

  // ✨ تحويل camelCase → snake_case قبل الإرسال كـ JSON
  const { taskId, hackathonId, teamId, githubUrl, liveUrl, videoUrl, notes, ...rest } = payload
  const jsonPayload: Record<string, unknown> = { ...rest }
  if (taskId !== undefined) jsonPayload.task_id = taskId
  if (hackathonId !== undefined) jsonPayload.hackathon_id = hackathonId
  if (teamId !== undefined) jsonPayload.team_id = teamId
  if (githubUrl !== undefined) jsonPayload.github_url = githubUrl
  if (liveUrl !== undefined) jsonPayload.live_url = liveUrl
  if (videoUrl !== undefined) jsonPayload.video_url = videoUrl
  if (notes !== undefined) jsonPayload.notes = notes

  const { data } = await api.post('/submissions', jsonPayload)
  return transformSubmission(data)
}

export async function deleteSubmissionApi(id: number): Promise<void> {
  await api.delete(`/submissions/${id}`)
}

// ============== TEAMS ==============
// ✨ P2-4: استخدم transformTeam لتطبيع teamableType في كل استدعاء

export async function getMyTeamsApi(): Promise<Team[]> {
  const { data } = await api.get('/my-teams')
  const teams = Array.isArray(data) ? data : []
  return teams.map((t) => transformTeam(t))
}

export async function getTeamApi(id: number): Promise<Team> {
  const { data } = await api.get(`/teams/${id}`)
  return transformTeam(data)
}

export async function createTeamApi(payload: {
  name: string
  teamableId: number
  teamableType: 'task' | 'hackathon'
}): Promise<Team> {
  // ✨ BUG FIX #6: Laravel TeamRequest يتوقع snake_case (teamable_id, teamable_type)
  // كنا نُرسل camelCase → كان يفشل بـ 422 دائماً
  const snakePayload = {
    name: payload.name,
    teamable_id: payload.teamableId,
    teamable_type: payload.teamableType,
  }
  const { data } = await api.post('/teams', snakePayload)
  return transformTeam(data)
}

export async function addTeamMemberApi(teamId: number, userId: number): Promise<Team> {
  const { data } = await api.post(`/teams/${teamId}/members`, { user_id: userId })
  return transformTeam(data)
}

export async function removeTeamMemberApi(teamId: number, userId: number): Promise<void> {
  await api.delete(`/teams/${teamId}/members/${userId}`)
}

// ============== JOIN REQUESTS ==============
// ✨ طلبات الانضمام للفرق (موافقة القائد). preview لغير الأعضاء (بلا كشف الأعضاء).

export async function previewTeamApi(id: number): Promise<TeamPreview> {
  const { data } = await api.get(`/teams/${id}/preview`)
  return transformToCamelCase<TeamPreview>(data)
}

/**
 * ✨ فرق متاحة لـ teamable (لاكتشاف الانضمام) — معاينة محدودة لكل فريق.
 * النوع union صغير بدل TeamPreview الكامل (بلا teamableTitle/canRequestJoin...).
 */
export interface TeamSummary {
  id: number
  name: string
  membersCount: number
  maxTeamSize: number | null
  leaderName: string | null
  canRequestJoin: boolean
}

export async function getTeamsForTeamableApi(teamableType: 'task' | 'hackathon', teamableId: number): Promise<TeamSummary[]> {
  const { data } = await api.get(`/teams/for/${teamableType}/${teamableId}`)
  const teams = Array.isArray(data) ? data : []
  return teams.map((t) => transformToCamelCase<TeamSummary>(t))
}

export async function createJoinRequestApi(teamId: number, message?: string | null): Promise<JoinRequest> {
  const { data } = await api.post(`/teams/${teamId}/join-requests`, { message: message ?? null })
  return transformToCamelCase<JoinRequest>(data)
}

export async function getMyJoinRequestsApi(): Promise<JoinRequest[]> {
  const { data } = await api.get('/my-join-requests')
  const requests = Array.isArray(data) ? data : []
  return requests.map((r) => transformToCamelCase<JoinRequest>(r))
}

export async function getTeamJoinRequestsApi(teamId: number): Promise<JoinRequest[]> {
  const { data } = await api.get(`/teams/${teamId}/join-requests`)
  const requests = Array.isArray(data) ? data : []
  return requests.map((r) => transformToCamelCase<JoinRequest>(r))
}

export async function approveJoinRequestApi(teamId: number, joinRequestId: number): Promise<JoinRequest> {
  const { data } = await api.post(`/teams/${teamId}/join-requests/${joinRequestId}/approve`)
  return transformToCamelCase<JoinRequest>(data)
}

export async function rejectJoinRequestApi(teamId: number, joinRequestId: number): Promise<JoinRequest> {
  const { data } = await api.post(`/teams/${teamId}/join-requests/${joinRequestId}/reject`)
  return transformToCamelCase<JoinRequest>(data)
}

// ============== PROFILE ==============

export async function getProfileApi(): Promise<StudentProfile> {
  const { data } = await api.get('/student/profile')
  return transformStudentProfile(data)
}

export async function updateProfileApi(
  payload: Omit<Partial<StudentProfile>, 'tracks'> & { cv?: File; tracks?: number[] },
): Promise<StudentProfile> {
  // Use FormData if CV file is being uploaded
  if (payload.cv) {
    const formData = new FormData()
    formData.append('cv', payload.cv)

    // ✨ B2: الـ URLs الفارغة → null (نتجاوز Laravel url validation). FormData لا يقبل null
    // كقيمة، فنُرسل سلسلة فارغة بعد تعطيل الحقل فقط إن كان غير فارغ — لكن Laravel يُحوّل ''
    // إلى null عبر ConvertEmptyStringsToNull. لذلك نُرسل '' صراحةً (بدل حذف الحقل) ليُحدَّث.
    if (payload.bio !== undefined) formData.append('bio', payload.bio ?? '')
    if (payload.tagline !== undefined) formData.append('tagline', payload.tagline ?? '')
    if (payload.githubUrl !== undefined) formData.append('github_url', payload.githubUrl ?? '')
    if (payload.linkedinUrl !== undefined) formData.append('linkedin_url', payload.linkedinUrl ?? '')
    if (payload.portfolioUrl !== undefined) formData.append('portfolio_url', payload.portfolioUrl ?? '')
    // ✨ F4: اسمح بمسح featured_project_id (أرسِل '' عند null/0 ليُحدَّث لـ null)
    if (payload.featuredProjectId !== undefined) {
      formData.append('featured_project_id', payload.featuredProjectId ? String(payload.featuredProjectId) : '')
    }
    if (payload.tracks) {
      payload.tracks.forEach((id) => formData.append('tracks[]', String(id)))
    }

    const { data } = await api.put('/student/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return transformStudentProfile(data)
  }

  // ✨ JSON request (no file) — تحويل camelCase → snake_case يدوياً للأمان
  const { githubUrl, linkedinUrl, portfolioUrl, featuredProjectId, tracks, ...rest } = payload
  const jsonPayload: Record<string, unknown> = { ...rest }
  if (githubUrl !== undefined) {
    // ✨ تحويل string الفارغ إلى null لتجاوز Laravel url validation
    jsonPayload.github_url = githubUrl === '' ? null : githubUrl
  }
  if (linkedinUrl !== undefined) {
    jsonPayload.linkedin_url = linkedinUrl === '' ? null : linkedinUrl
  }
  if (portfolioUrl !== undefined) {
    jsonPayload.portfolio_url = portfolioUrl === '' ? null : portfolioUrl
  }
  if (featuredProjectId !== undefined) {
    jsonPayload.featured_project_id = featuredProjectId || null
  }
  if (tracks !== undefined) {
    jsonPayload.tracks = tracks
  }

  const { data } = await api.put('/student/profile', jsonPayload)
  return transformStudentProfile(data)
}

/**
 * ✨ P1-3: حذف الـ CV
 */
export async function deleteCvApi(): Promise<void> {
  await api.delete('/student/profile/cv')
}

/**
 * ✨ Stage 5: رفع الصورة الشخصية
 */
export async function uploadAvatarApi(file: File): Promise<{ avatar: string; user: User }> {
  const formData = new FormData()
  formData.append('avatar', file)
  const { data } = await api.post('/student/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return {
    avatar: data.avatar,
    user: transformUser(data.user),
  }
}

/**
 * ✨ Stage 5: حذف الصورة الشخصية
 */
export async function deleteAvatarApi(): Promise<{ user: User }> {
  const { data } = await api.delete('/student/profile/avatar')
  return { user: transformUser(data.user) }
}

// ============== REFERENCE DATA ==============

export async function getSkillsApi(): Promise<Skill[]> {
  const { data } = await api.get('/skills')
  const skills = extractPaginatedData<Skill>(data)
  return skills.map((s) => transformToCamelCase<Skill>(s))
}

export async function getTracksApi(): Promise<Track[]> {
  const { data } = await api.get('/tracks')
  const tracks = extractPaginatedData<Track>(data)
  return tracks.map((t) => transformToCamelCase<Track>(t))
}

export async function getBatchesApi(): Promise<Batch[]> {
  const { data } = await api.get('/batches')
  const batches = extractPaginatedData<Batch>(data)
  return batches.map((b) => transformToCamelCase<Batch>(b))
}

// ============== FEATURE PROPOSALS ==============
// ✨ P2-1: استبدال any بالأنواع الصحيحة

export async function deleteProposalApi(id: number): Promise<void> {
  await api.delete(`/proposals/${id}`)
}

export async function getHackathonProposalsApi(hackathonId: number): Promise<FeatureProposal[]> {
  const { data } = await api.get(`/hackathons/${hackathonId}/proposals`)
  const proposals = extractPaginatedData<FeatureProposal>(data)
  return proposals.map((p) => transformToCamelCase<FeatureProposal>(p))
}

export async function getMyProposalsApi(): Promise<FeatureProposal[]> {
  const { data } = await api.get('/my-proposals')
  const proposals = Array.isArray(data) ? data : []
  return proposals.map((p) => transformToCamelCase<FeatureProposal>(p))
}

export async function getProposalApi(id: number): Promise<FeatureProposal> {
  const { data } = await api.get(`/proposals/${id}`)
  return transformToCamelCase<FeatureProposal>(data)
}

export async function createProposalApi(
  hackathonId: number,
  payload: CreateProposalData,
): Promise<FeatureProposal> {
  // ✨ payload already in snake_case (CreateProposalData uses snake_case fields)
  // ✨ M-teams3: حوّل الـ URLs الفارغة إلى null دفاعياً (لا نعتمد على ConvertEmptyStringsToNull)
  const safePayload: CreateProposalData = {
    ...payload,
    github_url: payload.github_url === '' ? null : payload.github_url,
    live_url: payload.live_url === '' ? null : payload.live_url,
    video_url: payload.video_url === '' ? null : payload.video_url,
  }
  const { data } = await api.post(`/hackathons/${hackathonId}/proposals`, safePayload)
  return transformToCamelCase<FeatureProposal>(data)
}

/**
 * ✨ FIX #3: PUT /proposals/{proposal} — تعديل اقتراح (فقط لو pending أو needs_revision)
 * الـ backend يدعم هذا عبر FeatureProposalController@update، لكنه كان غير مُستخدم في الواجهة.
 */
export async function updateProposalApi(
  id: number,
  payload: Partial<CreateProposalData>,
): Promise<FeatureProposal> {
  // ✨ حوّل الـ URLs الفارغة إلى null دفاعياً (نفس منطق createProposalApi)
  const safePayload: Partial<CreateProposalData> = { ...payload }
  if ('github_url' in safePayload && safePayload.github_url === '') {
    safePayload.github_url = null
  }
  if ('live_url' in safePayload && safePayload.live_url === '') {
    safePayload.live_url = null
  }
  if ('video_url' in safePayload && safePayload.video_url === '') {
    safePayload.video_url = null
  }
  const { data } = await api.put(`/proposals/${id}`, safePayload)
  return transformToCamelCase<FeatureProposal>(data)
}
