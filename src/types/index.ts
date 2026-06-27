// =====================================================
// GradShow — Domain Types (matching Laravel models)
// =====================================================

export type UserRole = 'student' | 'company' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  avatar: string | null
  batch_id: number | null
  created_at: string
  studentProfile?: StudentProfile
  companyProfile?: CompanyProfile
}

export interface Batch {
  id: number
  name: string
  status: 'active' | 'completed'
  start_date: string
  end_date: string
  users_count?: number
  tasks_count?: number
  hackathons_count?: number
}

export interface Track {
  id: number
  name: string
}

export type SkillType = 'technical' | 'soft'

export interface Skill {
  id: number
  name: string
  type: SkillType
}

export interface StudentProfile {
  id: number
  user_id: number
  name: string
  bio: string | null
  tagline: string | null
  github_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  cv_path: string | null
  featured_project_id: number | null
  tracks: Track[]
  featuredProject?: Submission | null
}

export interface CompanyProfile {
  id: number
  user_id: number
  company_name: string
  website: string | null
  logo: string | null
}

export type TaskType = 'hw' | 'final'

export interface Task {
  id: number
  title: string
  description: string | null
  type: TaskType
  is_team: boolean
  max_team_size: number | null
  video_required: boolean
  batch_id: number
  created_by: number
  skills: Skill[]
  tracks: Track[]
  batch?: Batch
  submissions_count?: number
  my_submission_status?: SubmissionStatus | null
  created_at: string
}

export interface Hackathon {
  id: number
  title: string
  description: string | null
  is_team: boolean
  max_team_size: number | null
  deadline: string
  batch_id: number
  created_by: number
  batch?: Batch
  submissions_count?: number
  my_team?: Team | null
  my_rank?: number | null
  my_score?: number | null
}

export interface Team {
  id: number
  name: string
  teamable_type: string
  teamable_id: number
  batch_id: number
  teamMembers: TeamMember[]
  teamable?: Task | Hackathon
  created_at: string
}

export interface TeamMember {
  id: number
  team_id: number
  user_id: number
  is_leader: boolean
  user: User
}

export type SubmissionStatus = 'pending' | 'accepted' | 'rejected'

export interface Submission {
  id: number
  task_id: number | null
  hackathon_id: number | null
  user_id: number | null
  team_id: number | null
  github_url: string | null
  live_url: string | null
  file_path: string | null
  video_url: string | null
  status: SubmissionStatus
  score: number | null
  is_featured: boolean
  is_reopened?: boolean
  notes: string | null
  task?: Task | null
  hackathon?: Hackathon | null
  user?: User | null
  team?: Team | null
  skillScores: SkillScore[]
  auditLogs?: AuditLog[]
  created_at: string
}

export interface SkillScore {
  id: number
  submission_id: number
  skill_id: number
  score: number
  skill: Skill
}

export interface AuditLog {
  id: number
  submission_id: number
  changed_by: number
  action: string
  old_status: string | null
  new_status: string | null
  old_score: number | null
  new_score: number | null
  notes: string | null
  changedBy: User
  created_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role: 'student' | 'company'
  batch_id?: number
}

export interface AuthResponse {
  user: User
  token: string
}

export interface DashboardStats {
  total_submissions: number
  accepted: number
  pending: number
  rejected: number
  average_score: number
  rank_in_batch: number
}
