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
  batchId: number | null
  createdAt: string
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
  userId: number
  name: string
  bio: string | null
  tagline: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  portfolioUrl: string | null
  cvPath: string | null
  featuredProjectId: number | null
  tracks: Track[]
  featuredProject?: Submission | null
}

export interface CompanyProfile {
  id: number
  userId: number
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
  isTeam: boolean
  maxTeamSize: number | null
  videoRequired: boolean
  batchId: number
  createdBy: number
  skills: Skill[]
  tracks: Track[]
  batch?: Batch
  submissionsCount?: number
  mySubmissionStatus?: SubmissionStatus | null
  createdAt: string
}

export interface Hackathon {
  id: number
  title: string
  description: string | null
  isTeam: boolean
  maxTeamSize: number | null
  deadline: string
  batchId: number
  createdBy: number
  batch?: Batch
  submissionsCount?: number
  myTeam?: Team | null
  myRank?: number | null
  myScore?: number | null
}

export interface Team {
  id: number
  name: string
  teamableType: string
  teamableId: number
  batchId: number
  teamMembers: TeamMember[]
  teamable?: Task | Hackathon
  createdAt: string
}

export interface TeamMember {
  id: number
  teamId: number
  userId: number
  isLeader: boolean
  user: User
}

export type SubmissionStatus = 'pending' | 'accepted' | 'rejected'

export interface Submission {
  id: number
  taskId: number | null
  hackathonId: number | null
  userId: number | null
  teamId: number | null
  githubUrl: string | null
  liveUrl: string | null
  filePath: string | null
  videoUrl: string | null
  status: SubmissionStatus
  score: number | null
  isFeatured: boolean
  isReopened?: boolean
  notes: string | null
  task?: Task | null
  hackathon?: Hackathon | null
  user?: User | null
  team?: Team | null
  skillScores: SkillScore[]
  auditLogs?: AuditLog[]
  createdAt: string
}

export interface SkillScore {
  id: number
  submissionId: number
  skillId: number
  score: number
  skill: Skill
}

export interface AuditLog {
  id: number
  submissionId: number
  changedBy: number
  action: string
  oldStatus: string | null
  newStatus: string | null
  oldScore: number | null
  newScore: number | null
  notes: string | null
  changedByUser: User
  createdAt: string
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
  batchId?: number
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

// =====================================================
// ✨ Feature Proposal Types
// =====================================================

export type ProposalStatus =
  | 'pending'
  | 'accepted_merged'
  | 'accepted_showcase'
  | 'needs_revision'
  | 'rejected'

export interface FeatureProposal {
  id: number
  hackathonId: number
  userId: number | null
  teamId: number | null
  title: string
  problemStatement: string
  proposedSolution: string
  addedValue: string
  githubUrl: string | null
  liveUrl: string | null
  videoUrl: string | null
  implementationNotes: string | null
  status: ProposalStatus
  adminFeedback: string | null
  impactScore: number | null
  innovationScore: number | null
  executionScore: number | null
  reviewedBy: number | null
  reviewedAt: string | null
  hackathon?: Hackathon
  user?: User | null
  team?: Team | null
  createdAt: string
  updatedAt: string
}

export interface CreateProposalData {
  title: string
  problem_statement: string
  proposed_solution: string
  added_value: string
  github_url?: string | null
  live_url?: string | null
  video_url?: string | null
  implementation_notes?: string | null
  team_id?: number | null
}
