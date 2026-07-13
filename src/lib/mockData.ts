// =====================================================
// ✨ P0-A PATCH: Smart Facade خفيف بدل mockData.ts العملاق (1410 سطر)
// =====================================================
//
// المشكلة:
//   الملف الأصلي mockData.ts كان 1410 سطراً يحتوي بيانات وهمية ضخمة
//   تُحمّل في الـ bundle الإنتاجي (~50KB+) حتى لو USE_MOCK=false.
//
// الحل:
//   1) هذا الملف هو facade خفيف (200 سطر فقط).
//   2) الـ mock data الفعلية تُحمّل عبر dynamic import() فقط لو USE_MOCK=true.
//      في الإنتاج (USE_MOCK=false)، الـ chunk لا يُحمّل أبداً.
//   3) كل الدوال تُعيد توجيه لـ apiServices.* في الإنتاج.
//
// الـ mock data الأصلية موجودة في src/lib/mock-data.ts (الذي لا يُحمّل
// إلا عبر dynamic import في وضع mock).

import type {
  AuthResponse,
  Batch,
  CreateProposalData,
  DashboardStats,
  FeatureProposal,
  Hackathon,
  JoinRequest,
  LoginCredentials,
  PaginatedResponse,
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
import * as apiServices from '@/services'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ✨ نوع الوحدة الكسولة (lazy) — تُحمّل فقط في وضع mock
// نستخدم `typeof import('./mock-data')` لاشتقاق الأنواع تلقائياً
type MockModule = typeof import('./mock-data')

// ✨ Lazy loader — يُحمّل مرة واحدة فقط ويُخزّن في الـ cache
let _mockModulePromise: Promise<MockModule> | null = null
function loadMockModule(): Promise<MockModule> {
  if (!_mockModulePromise) {
    // ✨ dynamic import — Vite يضع هذا في chunk منفصل لا يُحمّل إلا عند الحاجة
    _mockModulePromise = import('./mock-data')
  }
  return _mockModulePromise
}

// =====================================================
// Helper: ينفّذ الدالة من الـ mock module أو من apiServices حسب USE_MOCK
// =====================================================
async function facade<T>(mockFn: (m: MockModule) => Promise<T>, realFn: () => Promise<T>): Promise<T> {
  if (!USE_MOCK) return realFn()
  const m = await loadMockModule()
  return mockFn(m)
}

// =====================================================
// Auth
// =====================================================
export async function mockLogin(email: string, password: string): Promise<AuthResponse> {
  return facade(
    (m) => m.mockLogin(email, password),
    () => apiServices.loginApi({ email, password }),
  )
}

export async function mockRegister(data: RegisterData): Promise<AuthResponse> {
  return facade(
    (m) => m.mockRegister(data),
    () => apiServices.registerApi(data),
  )
}

export async function mockGetMe(): Promise<User | null> {
  return facade(
    (m) => m.mockGetMe(),
    () => apiServices.getMeApi(),
  )
}

// =====================================================
// Dashboard
// =====================================================
export async function mockGetDashboardStats(): Promise<DashboardStats> {
  return facade(
    (m) => m.mockGetDashboardStats(),
    () => apiServices.getDashboardStatsApi(),
  )
}

// =====================================================
// Tasks
// =====================================================
export async function mockGetTasks(filters?: { batch_id?: number; type?: string; page?: number }): Promise<PaginatedResponse<Task>> {
  return facade(
    (m) => m.mockGetTasks(filters?.page),
    () => apiServices.getTasksApi(filters),
  )
}

export async function mockGetTask(id: number): Promise<Task> {
  return facade(
    (m) => m.mockGetTask(id),
    () => apiServices.getTaskApi(id),
  )
}

// =====================================================
// Hackathons
// =====================================================
export async function mockGetHackathons(filters?: { batch_id?: number; page?: number }): Promise<PaginatedResponse<Hackathon>> {
  return facade(
    (m) => m.mockGetHackathons(filters?.page),
    () => apiServices.getHackathonsApi(filters),
  )
}

export async function mockGetHackathon(id: number): Promise<Hackathon> {
  return facade(
    (m) => m.mockGetHackathon(id),
    () => apiServices.getHackathonApi(id),
  )
}

// =====================================================
// Submissions
// =====================================================
export async function mockGetSubmissions(filters?: { task_id?: number; hackathon_id?: number; status?: string; page?: number }): Promise<PaginatedResponse<Submission>> {
  return facade(
    (m) => m.mockGetSubmissions(filters?.page),
    () => apiServices.getSubmissionsApi(filters),
  )
}

export async function mockGetSubmission(id: number): Promise<Submission> {
  return facade(
    (m) => m.mockGetSubmission(id),
    () => apiServices.getSubmissionApi(id),
  )
}

export async function mockCreateSubmission(data: Partial<Submission> & { file?: File }): Promise<Submission> {
  return facade(
    (m) => m.mockCreateSubmission(data),
    () => apiServices.createSubmissionApi(data),
  )
}

export async function mockUpdateSubmission(id: number, data: Partial<Submission>): Promise<Submission> {
  return facade(
    (m) => m.mockUpdateSubmission(id, data),
    () => apiServices.updateSubmissionApi(
      id,
      {
        github_url: data.githubUrl,
        live_url: data.liveUrl,
        video_url: data.videoUrl,
        notes: data.notes,
      },
      (data as any).file,
    ),
  )
}

export async function mockDeleteSubmission(id: number): Promise<void> {
  return facade(
    (m) => m.mockDeleteSubmission(id),
    () => apiServices.deleteSubmissionApi(id),
  )
}

// =====================================================
// Teams
// =====================================================
export async function mockGetTeams(): Promise<Team[]> {
  return facade(
    (m) => m.mockGetTeams(),
    () => apiServices.getMyTeamsApi(),
  )
}

export async function mockGetTeam(id: number): Promise<Team> {
  return facade(
    (m) => m.mockGetTeam(id),
    () => apiServices.getTeamApi(id),
  )
}

export async function mockCreateTeam(data: { name: string; teamableId: number; teamableType: 'task' | 'hackathon' }): Promise<Team> {
  return facade(
    (m) => m.mockCreateTeam(data),
    () => apiServices.createTeamApi(data),
  )
}

export async function mockRemoveTeamMember(teamId: number, userId: number): Promise<void> {
  await facade(
    async (m) => { await m.mockRemoveTeamMember(teamId, userId) },
    async () => { await apiServices.removeTeamMemberApi(teamId, userId) },
  )
}

// =====================================================
// Join Requests
// =====================================================
export async function mockPreviewTeam(teamId: number): Promise<TeamPreview> {
  return facade(
    (m) => m.mockPreviewTeam(teamId),
    () => apiServices.previewTeamApi(teamId),
  )
}

export async function mockGetTeamsForTeamable(teamableType: 'task' | 'hackathon', teamableId: number): Promise<import('@/services').TeamSummary[]> {
  return facade(
    (m) => m.mockGetTeamsForTeamable(teamableType, teamableId),
    () => apiServices.getTeamsForTeamableApi(teamableType, teamableId),
  )
}

export async function mockCreateJoinRequest(teamId: number, message?: string | null): Promise<JoinRequest> {
  return facade(
    (m) => m.mockCreateJoinRequest(teamId, message),
    () => apiServices.createJoinRequestApi(teamId, message),
  )
}

export async function mockGetMyJoinRequests(): Promise<JoinRequest[]> {
  return facade(
    (m) => m.mockGetMyJoinRequests(),
    () => apiServices.getMyJoinRequestsApi(),
  )
}

export async function mockGetTeamJoinRequests(teamId: number): Promise<JoinRequest[]> {
  return facade(
    (m) => m.mockGetTeamJoinRequests(teamId),
    () => apiServices.getTeamJoinRequestsApi(teamId),
  )
}

export async function mockApproveJoinRequest(teamId: number, joinRequestId: number): Promise<JoinRequest> {
  return facade(
    (m) => m.mockApproveJoinRequest(teamId, joinRequestId),
    () => apiServices.approveJoinRequestApi(teamId, joinRequestId),
  )
}

export async function mockRejectJoinRequest(teamId: number, joinRequestId: number): Promise<JoinRequest> {
  return facade(
    (m) => m.mockRejectJoinRequest(teamId, joinRequestId),
    () => apiServices.rejectJoinRequestApi(teamId, joinRequestId),
  )
}

// =====================================================
// Profile + Reference data
// =====================================================
export async function mockGetProfile(): Promise<StudentProfile> {
  const result = await facade(
    (m) => m.mockGetProfile(),
    () => apiServices.getProfileApi(),
  )
  return result as StudentProfile
}

export async function mockGetSkills(): Promise<Skill[]> {
  return facade(
    (m) => m.mockGetSkills(),
    () => apiServices.getSkillsApi(),
  )
}

export async function mockGetTracks(): Promise<Track[]> {
  return facade(
    (m) => m.mockGetTracks(),
    () => apiServices.getTracksApi(),
  )
}

export async function mockGetBatches(): Promise<Batch[]> {
  return facade(
    (m) => m.mockGetBatches(),
    () => apiServices.getBatchesApi(),
  )
}

// =====================================================
// Feature Proposals
// =====================================================
export async function mockGetHackathonProposals(hackathonId: number): Promise<FeatureProposal[]> {
  return facade(
    (m) => m.mockGetHackathonProposals(hackathonId),
    () => apiServices.getHackathonProposalsApi(hackathonId),
  )
}

export async function mockGetMyProposals(): Promise<FeatureProposal[]> {
  return facade(
    (m) => m.mockGetMyProposals(),
    () => apiServices.getMyProposalsApi(),
  )
}

export async function mockGetProposal(id: number): Promise<FeatureProposal> {
  return facade(
    (m) => m.mockGetProposal(id),
    () => apiServices.getProposalApi(id),
  )
}

export async function mockCreateProposal(hackathonId: number, data: CreateProposalData): Promise<FeatureProposal> {
  return facade(
    (m) => m.mockCreateProposal(hackathonId, data),
    () => apiServices.createProposalApi(hackathonId, data),
  )
}

export async function mockUpdateProposal(id: number, data: Partial<CreateProposalData>): Promise<FeatureProposal> {
  return facade(
    (m) => m.mockUpdateProposal(id, data),
    () => apiServices.updateProposalApi(id, data),
  )
}

export async function mockDeleteProposal(id: number): Promise<void> {
  return facade(
    (m) => m.mockDeleteProposal(id),
    () => apiServices.deleteProposalApi(id),
  )
}

// =====================================================
// Auth helpers (forgot/reset/change password, email verify)
// =====================================================
export async function mockForgotPassword(email: string): Promise<{ message: string }> {
  if (!USE_MOCK) {
    const { data } = await (await import('@/lib/api')).api.post('/auth/forgot-password', { email })
    return data
  }
  const m = await loadMockModule()
  return m.mockForgotPassword(email)
}

export async function mockResetPassword(payload: { token: string; email: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
  if (!USE_MOCK) {
    const { data } = await (await import('@/lib/api')).api.post('/auth/reset-password', payload)
    return data
  }
  const m = await loadMockModule()
  return m.mockResetPassword(payload)
}

export async function mockChangePassword(payload: { current_password: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
  if (!USE_MOCK) {
    const { data } = await (await import('@/lib/api')).api.put('/auth/password', payload)
    return data
  }
  const m = await loadMockModule()
  return m.mockChangePassword(payload)
}

export async function mockVerifyEmail(payload: { token: string; email: string }): Promise<{ message: string }> {
  if (!USE_MOCK) {
    const { data } = await (await import('@/lib/api')).api.post('/auth/verify-email', payload)
    return data
  }
  const m = await loadMockModule()
  return m.mockVerifyEmail(payload)
}

export async function mockResendVerification(): Promise<{ message: string }> {
  if (!USE_MOCK) {
    const { data } = await (await import('@/lib/api')).api.post('/auth/resend-verification')
    return data
  }
  const m = await loadMockModule()
  return m.mockResendVerification()
}

// =====================================================
// ✨ BUG-1 FIX: Profile management exports (كانت مفقودة من الـ facade)
// =====================================================
export async function mockUpdateProfile(payload: import('@/hooks/useProfileMutations').UpdateProfilePayload): Promise<import('@/types').StudentProfile> {
  const result = await facade(
    (m) => m.mockUpdateProfile(payload),
    () => apiServices.updateProfileApi(payload),
  )
  return result as import('@/types').StudentProfile
}

export async function mockDeleteCv(): Promise<void> {
  return facade(
    (m) => m.mockDeleteCv(),
    () => apiServices.deleteCvApi(),
  )
}

export async function mockUploadAvatar(file: File): Promise<{ avatar: string; user: import('@/types').User }> {
  return facade(
    (m) => m.mockUploadAvatar(file),
    () => apiServices.uploadAvatarApi(file),
  )
}

export async function mockDeleteAvatar(): Promise<{ user: import('@/types').User }> {
  return facade(
    (m) => m.mockDeleteAvatar(),
    () => apiServices.deleteAvatarApi(),
  )
}
