// =====================================================
// Real API Services — تتصل بـ Laravel Backend
// =====================================================
// كل دالة هنا تستدعي endpoint حقيقي في Laravel
// يتم استخدامها تلقائياً عندما VITE_USE_MOCK=false
// (راجع src/lib/mockData.ts للـ fallback logic)
//
// ✨ ملاحظة: كل الاستجابات تُحوّل من snake_case إلى camelCase
// عبر transformToCamelCase / transformUser

import { api, extractPaginatedData } from '@/lib/api'
import {
  transformToCamelCase,
  transformUser,
  transformAuthResponse,
  transformStudentProfile,
  transformSubmission,
} from '@/lib/transforms'
import type {
  AuthResponse,
  Batch,
  DashboardStats,
  Hackathon,
  LoginCredentials,
  RegisterData,
  Skill,
  StudentProfile,
  Submission,
  Task,
  Team,
  Track,
  User,
} from '@/types'

// ============== AUTH ==============

export async function loginApi(creds: LoginCredentials): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', creds)
  // ✨ تحويل snake_case → camelCase (student_profile → studentProfile)
  return transformAuthResponse(data)
}

export async function registerApi(payload: RegisterData): Promise<AuthResponse> {
  const { data } = await api.post('/auth/register', payload)
  return transformAuthResponse(data)
}

export async function getMeApi(): Promise<User> {
  const { data } = await api.get('/auth/me')
  return transformUser(data)
}

// ============== DASHBOARD ==============

export async function getDashboardStatsApi(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats')
  return data
}

// ============== TASKS ==============

export async function getTasksApi(filters?: { batch_id?: number; type?: string }): Promise<Task[]> {
  const { data } = await api.get('/tasks', { params: filters })
  const tasks = extractPaginatedData<any>(data)
  return tasks.map((t) => transformToCamelCase<Task>(t))
}

export async function getTaskApi(id: number): Promise<Task> {
  const { data } = await api.get(`/tasks/${id}`)
  return transformToCamelCase<Task>(data)
}

// ============== HACKATHONS ==============

export async function getHackathonsApi(filters?: { batch_id?: number }): Promise<Hackathon[]> {
  const { data } = await api.get('/hackathons', { params: filters })
  const hackathons = extractPaginatedData<any>(data)
  return hackathons.map((h) => transformToCamelCase<Hackathon>(h))
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
}): Promise<Submission[]> {
  const { data } = await api.get('/submissions', { params: filters })
  const submissions = extractPaginatedData<any>(data)
  return submissions.map((s) => transformSubmission(s))
}

export async function getSubmissionApi(id: number): Promise<Submission> {
  const { data } = await api.get(`/submissions/${id}`)
  return transformSubmission(data)
}

export async function createSubmissionApi(payload: Partial<Submission> & { file?: File }): Promise<Submission> {
  // Handle file upload via FormData
  if (payload.file) {
    const formData = new FormData()
    formData.append('file_path', payload.file)

    if (payload.taskId) formData.append('task_id', String(payload.taskId))
    if (payload.hackathonId) formData.append('hackathon_id', String(payload.hackathonId))
    if (payload.teamId) formData.append('team_id', String(payload.teamId))
    if ((payload as any).github_url) formData.append('github_url', (payload as any).github_url)
    if (payload.liveUrl) formData.append('live_url', payload.liveUrl)
    if (payload.videoUrl) formData.append('video_url', payload.videoUrl)
    if (payload.notes) formData.append('notes', payload.notes)

    const { data } = await api.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return transformSubmission(data)
  }

  const { data } = await api.post('/submissions', payload)
  return transformSubmission(data)
}

export async function deleteSubmissionApi(id: number): Promise<void> {
  await api.delete(`/submissions/${id}`)
}

// ============== TEAMS ==============

export async function getMyTeamsApi(): Promise<Team[]> {
  const { data } = await api.get('/my-teams')
  const teams = Array.isArray(data) ? data : []
  return teams.map((t: any) => transformToCamelCase<Team>(t))
}

export async function getTeamApi(id: number): Promise<Team> {
  const { data } = await api.get(`/teams/${id}`)
  return transformToCamelCase<Team>(data)
}

export async function createTeamApi(payload: {
  name: string
  teamableId: number
  teamableType: 'task' | 'hackathon'
}): Promise<Team> {
  // Laravel expects 'task' or 'hackathon' as string
  const { data } = await api.post('/teams', payload)
  return transformToCamelCase<Team>(data)
}

export async function addTeamMemberApi(teamId: number, userId: number): Promise<Team> {
  const { data } = await api.post(`/teams/${teamId}/members`, { user_id: userId })
  return transformToCamelCase<Team>(data)
}

export async function removeTeamMemberApi(teamId: number, userId: number): Promise<void> {
  await api.delete(`/teams/${teamId}/members/${userId}`)
}

// ============== PROFILE ==============

export async function getProfileApi(): Promise<StudentProfile> {
  const { data } = await api.get('/student/profile')
  return transformStudentProfile(data)
}

export async function updateProfileApi(
  payload: Partial<StudentProfile> & { cv?: File; tracks?: number[] },
): Promise<StudentProfile> {
  // Use FormData if CV file is being uploaded
  if (payload.cv) {
    const formData = new FormData()
    formData.append('cv', payload.cv)

    if (payload.bio !== undefined) formData.append('bio', payload.bio ?? '')
    if (payload.tagline !== undefined) formData.append('tagline', payload.tagline ?? '')
    if ((payload as any).github_url !== undefined) formData.append('github_url', (payload as any).github_url ?? '')
    if ((payload as any).linkedin_url !== undefined) formData.append('linkedin_url', (payload as any).linkedin_url ?? '')
    if ((payload as any).portfolio_url !== undefined) formData.append('portfolio_url', (payload as any).portfolio_url ?? '')
    if ((payload as any).featured_project_id !== undefined && (payload as any).featured_project_id) {
      formData.append('featured_project_id', String((payload as any).featured_project_id))
    }
    if (payload.tracks) {
      payload.tracks.forEach((id) => formData.append('tracks[]', String(id)))
    }

    const { data } = await api.put('/student/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return transformStudentProfile(data)
  }

  // JSON request (no file)
  const { data } = await api.put('/student/profile', payload)
  return transformStudentProfile(data)
}

// ============== REFERENCE DATA ==============

export async function getSkillsApi(): Promise<Skill[]> {
  const { data } = await api.get('/skills')
  const skills = extractPaginatedData<any>(data)
  return skills.map((s) => transformToCamelCase<Skill>(s))
}

export async function getTracksApi(): Promise<Track[]> {
  const { data } = await api.get('/tracks')
  const tracks = extractPaginatedData<any>(data)
  return tracks.map((t) => transformToCamelCase<Track>(t))
}

export async function getBatchesApi(): Promise<Batch[]> {
  const { data } = await api.get('/batches')
  const batches = extractPaginatedData<any>(data)
  return batches.map((b) => transformToCamelCase<Batch>(b))
}

export async function deleteProposalApi(id: number): Promise<void> {
  await api.delete(`/proposals/${id}`)
}
export async function getHackathonProposalsApi(hackathonId: number): Promise<any[]> {
  const { data } = await api.get(`/hackathons/${hackathonId}/proposals`)
  return extractPaginatedData<any>(data)
}
export async function getMyProposalsApi(): Promise<any[]> {
  const { data } = await api.get('/my-proposals')
  return Array.isArray(data) ? data : []
}
export async function getProposalApi(id: number): Promise<any> {
  const { data } = await api.get(`/proposals/${id}`)
  return transformToCamelCase<any>(data)
}
export async function createProposalApi(hackathonId: number, payload: any): Promise<any> {
  const { data } = await api.post(`/hackathons/${hackathonId}/proposals`, payload)
  return transformToCamelCase<any>(data)
}
