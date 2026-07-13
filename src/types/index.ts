// =====================================================
// GradShow — Domain Types (matching Laravel models)
// =====================================================
//
// ✨ P1-A PATCH: حذف 'final' من TaskType.
// الـ backend (TaskRequest.php) يقبل فقط 'hw'. النوع 'final' كان محجوزاً
// للتوافق مع الكود القديم، لكنه لم يعد يستخدم — الـ Final = الهاكاثون نفسه.

export type UserRole = 'student' | 'company' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  avatar: string | null
  batchId: number | null
  emailVerifiedAt?: string | null
  isActive?: boolean | null
  createdAt: string
  batch?: Batch | null
  studentProfile?: StudentProfile
  companyProfile?: CompanyProfile
}

export interface Batch {
  id: number
  name: string
  status: 'active' | 'completed'
  startDate: string
  endDate: string
  isRegistrationOpen?: boolean | null
  isDefaultForNewStudents?: boolean | null
  usersCount?: number
  tasksCount?: number
  hackathonsCount?: number
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
  cvUrl?: string | null
  featuredProjectId: number | null
  tracks: Track[]
  featuredProject?: Submission | null
}

export interface CompanyProfile {
  id: number
  userId: number
  companyName: string
  website: string | null
  logo: string | null
}

// ✨ P1-A: الـ Tasks = "hw" فقط — الـ Final = الهاكاثون نفسه
export type TaskType = 'hw'

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
  featureProposalsCount?: number
  submissionsCount?: number
  myTeam?: Team | null
  myRank?: number | null
  myScore?: number | null
}

export type TeamableType = 'task' | 'hackathon'

export interface Team {
  id: number
  name: string
  teamableType: TeamableType
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

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

export interface JoinRequest {
  id: number
  teamId: number
  userId: number
  status: JoinRequestStatus
  message: string | null
  createdAt: string
  team?: Team
  user?: User
}

export interface TeamPreview {
  id: number
  name: string
  teamableType: TeamableType
  teamableId: number
  teamableTitle: string
  membersCount: number
  maxTeamSize: number | null
  leaderName: string | null
  canRequestJoin: boolean
}

export type SubmissionStatus = 'pending' | 'accepted' | 'rejected'

export interface SubmissionTeamMember {
  id: number
  submissionId: number
  userId: number
  teamId: number | null
  isLeader: boolean
  contributionPercentage: number | null
  contributionNotes: string | null
  user?: {
    id: number
    name: string
    avatar: string | null
  }
  createdAt: string
}

export interface Submission {
  id: number
  taskId: number | null
  hackathonId: number | null
  userId: number | null
  teamId: number | null
  githubUrl: string | null
  liveUrl: string | null
  filePath: string | null
  fileUrl?: string | null
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
  isTeamSubmission?: boolean
  participantsCount?: number
  teamMembers?: SubmissionTeamMember[]
  myContribution?: number | null
  myContributionNotes?: string | null
  myRole?: 'leader' | 'member' | null
  createdAt: string
  updatedAt?: string
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
  changedBy?: User | number
  changedByUser?: User
  action: string
  oldStatus: string | null
  newStatus: string | null
  oldScore: number | null
  newScore: number | null
  notes: string | null
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
  passwordConfirmation: string
  role: 'student' | 'company'
  batchId?: number
  companyName?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface DashboardStats {
  totalSubmissions: number
  accepted: number
  pending: number
  rejected: number
  averageScore: number
  rankInBatch: number | null
  skillsCount?: number
}

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
  reviewedByUser?: User | null
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
