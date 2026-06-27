// =====================================================
// Real API Services — تتصل بـ Laravel Backend
// =====================================================
// كل دالة هنا تستدعي endpoint حقيقي في Laravel
// يتم استخدامها تلقائياً عندما VITE_USE_MOCK=false
// (راجع src/lib/mockData.ts للـ fallback logic)

import { api, extractPaginatedData } from '@/lib/api'
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
  const { data } = await api.post<AuthResponse>('/auth/login', creds)
  return data
}

export async function registerApi(payload: RegisterData): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  return data
}

export async function getMeApi(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}

// ============== DASHBOARD ==============

export async function getDashboardStatsApi(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats')
  return data
}

// ============== TASKS ==============

export async function getTasksApi(filters?: { batch_id?: number; type?: string }): Promise<Task[]> {
  const { data } = await api.get('/tasks', { params: filters })
  return extractPaginatedData<Task>(data)
}

export async function getTaskApi(id: number): Promise<Task> {
  const { data } = await api.get<Task>(`/tasks/${id}`)
  return data
}

// ============== HACKATHONS ==============

export async function getHackathonsApi(filters?: { batch_id?: number }): Promise<Hackathon[]> {
  const { data } = await api.get('/hackathons', { params: filters })
  return extractPaginatedData<Hackathon>(data)
}

export async function getHackathonApi(id: number): Promise<Hackathon> {
  const { data } = await api.get<Hackathon>(`/hackathons/${id}`)
  return data
}

// ============== SUBMISSIONS ==============

export async function getSubmissionsApi(filters?: {
  task_id?: number
  hackathon_id?: number
  status?: string
}): Promise<Submission[]> {
  const { data } = await api.get('/submissions', { params: filters })
  return extractPaginatedData<Submission>(data)
}

export async function getSubmissionApi(id: number): Promise<Submission> {
  const { data } = await api.get<Submission>(`/submissions/${id}`)
  return data
}

export async function createSubmissionApi(payload: Partial<Submission> & { file?: File }): Promise<Submission> {
  // Handle file upload via FormData
  if (payload.file) {
    const formData = new FormData()
    formData.append('file_path', payload.file)

    if (payload.task_id) formData.append('task_id', String(payload.task_id))
    if (payload.hackathon_id) formData.append('hackathon_id', String(payload.hackathon_id))
    if (payload.team_id) formData.append('team_id', String(payload.team_id))
    if (payload.github_url) formData.append('github_url', payload.github_url)
    if (payload.live_url) formData.append('live_url', payload.live_url)
    if (payload.video_url) formData.append('video_url', payload.video_url)
    if (payload.notes) formData.append('notes', payload.notes)

    const { data } = await api.post<Submission>('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  const { data } = await api.post<Submission>('/submissions', payload)
  return data
}

export async function deleteSubmissionApi(id: number): Promise<void> {
  await api.delete(`/submissions/${id}`)
}

// ============== TEAMS ==============

export async function getMyTeamsApi(): Promise<Team[]> {
  const { data } = await api.get('/my-teams')
  return Array.isArray(data) ? data : []
}

export async function getTeamApi(id: number): Promise<Team> {
  const { data } = await api.get<Team>(`/teams/${id}`)
  return data
}

export async function createTeamApi(payload: {
  name: string
  teamable_id: number
  teamable_type: 'task' | 'hackathon'
}): Promise<Team> {
  // Laravel expects 'task' or 'hackathon' as string
  const { data } = await api.post<Team>('/teams', payload)
  return data
}

export async function addTeamMemberApi(teamId: number, userId: number): Promise<Team> {
  const { data } = await api.post<Team>(`/teams/${teamId}/members`, { user_id: userId })
  return data
}

export async function removeTeamMemberApi(teamId: number, userId: number): Promise<void> {
  await api.delete(`/teams/${teamId}/members/${userId}`)
}

// ============== PROFILE ==============

export async function getProfileApi(): Promise<StudentProfile> {
  const { data } = await api.get<StudentProfile>('/student/profile')
  return data
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
    if (payload.github_url !== undefined) formData.append('github_url', payload.github_url ?? '')
    if (payload.linkedin_url !== undefined) formData.append('linkedin_url', payload.linkedin_url ?? '')
    if (payload.portfolio_url !== undefined) formData.append('portfolio_url', payload.portfolio_url ?? '')
    if (payload.featured_project_id !== undefined && payload.featured_project_id) {
      formData.append('featured_project_id', String(payload.featured_project_id))
    }
    if (payload.tracks) {
      payload.tracks.forEach((id) => formData.append('tracks[]', String(id)))
    }

    const { data } = await api.put<StudentProfile>('/student/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  // JSON request (no file)
  const { data } = await api.put<StudentProfile>('/student/profile', payload)
  return data
}

// ============== REFERENCE DATA ==============

export async function getSkillsApi(): Promise<Skill[]> {
  const { data } = await api.get('/skills')
  return extractPaginatedData<Skill>(data)
}

export async function getTracksApi(): Promise<Track[]> {
  const { data } = await api.get('/tracks')
  return extractPaginatedData<Track>(data)
}

export async function getBatchesApi(): Promise<Batch[]> {
  const { data } = await api.get('/batches')
  return extractPaginatedData<Batch>(data)
}
