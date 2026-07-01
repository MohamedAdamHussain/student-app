import type { FeatureProposal, CreateProposalData,
  AuditLog,
  Batch,
  DashboardStats,
  Hackathon,
  LoginCredentials,
  RegisterData,
  Skill,
  Submission,
  Task,
  Team,
  Track,
  User,
} from '@/types'
import { sleep } from './utils'
import * as apiServices from '@/services'

// =====================================================
// Smart Backend Facade
// =====================================================
// هذا الملف يعمل كـ "واجهة" تختار تلقائياً بين:
// - Laravel API الحقيقي (عند VITE_USE_MOCK=false)
// - بيانات وهمية (عند VITE_USE_MOCK=true — افتراضي للتطوير بدون Laravel)
//
// الصفحات لا تحتاج لتعديل — فقط غيّر VITE_USE_MOCK في .env

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// =====================================================
// Mock data — simulates the Laravel backend responses
// (يُستخدم فقط عند VITE_USE_MOCK=true)
// =====================================================

export const mockTracks: Track[] = [
  { id: 1, name: 'Backend' },
  { id: 2, name: 'Frontend' },
  { id: 3, name: 'UI/UX' },
  { id: 4, name: 'Mobile' },
  { id: 5, name: 'Fullstack' },
]

export const mockSkills: Skill[] = [
  { id: 1, name: 'Code Quality', type: 'technical' },
  { id: 2, name: 'Problem Solving', type: 'technical' },
  { id: 3, name: 'Architecture', type: 'technical' },
  { id: 4, name: 'Testing', type: 'technical' },
  { id: 5, name: 'Documentation', type: 'technical' },
  { id: 6, name: 'Communication', type: 'soft' },
  { id: 7, name: 'Delivery', type: 'soft' },
  { id: 8, name: 'Teamwork', type: 'soft' },
  { id: 9, name: 'Presentation', type: 'soft' },
]

export const mockBatches: Batch[] = [
  {
    id: 1,
    name: 'Batch 1 - 2026',
    status: 'active',
    start_date: '2026-01-01',
    end_date: '2026-06-30',
    users_count: 24,
    tasks_count: 5,
    hackathons_count: 2,
  },
  {
    id: 2,
    name: 'Batch 2 - 2026',
    status: 'active',
    start_date: '2026-04-01',
    end_date: '2026-10-30',
    users_count: 18,
    tasks_count: 3,
    hackathons_count: 1,
  },
]

export const mockCurrentUser: User = {
  id: 1,
  name: 'أحمد علي محمد',
  email: 'ahmed.ali@student.com',
  role: 'student',
  avatar: null,
  batchId: 1,
  createdAt: '2026-01-15T10:00:00Z',
  studentProfile: {
    id: 1,
    userId: 1,
    name: 'أحمد علي محمد',
    bio: 'طالب علوم حاسوب شغوف ببناء أنظمة backend قابلة للتوسع. خبرة في Laravel و PostgreSQL، وأعمل حالياً على إتقان الـ microservices. أبحث عن فرصة تطوير حقيقية.',
    tagline: 'Backend Developer في طور التعلم',
    githubUrl: 'https://github.com/ahmed-ali',
    linkedinUrl: 'https://linkedin.com/in/ahmed-ali',
    portfolioUrl: null,
    cvPath: 'cvs/ahmed_cv.pdf',
    featuredProjectId: 2,
    tracks: [mockTracks[0], mockTracks[4]], // Backend, Fullstack
    featuredProject: null, // will be set below
  },
}

export const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Final Project — Build a SaaS Dashboard',
    description:
      'في هذه المهمة النهائية، ستقوم ببناء لوحة تحكم SaaS متعددة المستخدمين. يجب أن يدعم النظام: تسجيل دخول متعدد الأدوار، عرض إحصائيات حية، إدارة المستخدمين (CRUD)، إعدادات الحساب الشخصي، تصدير البيانات (CSV, PDF)، وDark mode support.\n\nالمتطلبات التقنية:\n- Backend: Laravel 11+ مع REST API\n- Frontend: React/Next.js أو Vue/Nuxt\n- قاعدة بيانات: PostgreSQL\n- Tests: PHPUnit + Vitest\n- Documentation: Scribe أو OpenAPI\n\nفيديو العرض (إلزامي): سجل فيديو (5-10 دقائق) تشرح فيه المعمارية، التحديات، الحلول، وكيفية تشغيل المشروع محلياً.',
    type: 'final',
    isTeam: false,
    maxTeamSize: null,
    videoRequired: true,
    batchId: 1,
    createdBy: 2,
    skills: [mockSkills[0], mockSkills[2], mockSkills[4], mockSkills[8]],
    tracks: [mockTracks[0], mockTracks[4]],
    batch: mockBatches[0],
    submissionsCount: 18,
    mySubmissionStatus: null,
    createdAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 2,
    title: 'HW #4 — Authentication & Authorization',
    description:
      'بناء نظام مصادقة كامل باستخدام Laravel Sanctum + Role Middleware. يجب دعم 3 أدوار على الأقل (admin, student, company) مع Endpoints منفصلة لكل دور.',
    type: 'hw',
    isTeam: false,
    maxTeamSize: null,
    videoRequired: false,
    batchId: 1,
    createdBy: 2,
    skills: [mockSkills[0], mockSkills[2], mockSkills[4]],
    tracks: [mockTracks[0]],
    batch: mockBatches[0],
    submissionsCount: 22,
    mySubmissionStatus: 'pending',
    createdAt: '2026-06-20T10:00:00Z',
  },
  {
    id: 3,
    title: 'HW #3 — E-commerce API',
    description:
      'بناء RESTful API لإدارة متجر إلكتروني مع المنتجات، السلة، الطلبات. يشمل migrations, models, controllers, و API documentation.',
    type: 'hw',
    isTeam: false,
    maxTeamSize: null,
    videoRequired: false,
    batchId: 1,
    createdBy: 2,
    skills: [mockSkills[0], mockSkills[2], mockSkills[4]],
    tracks: [mockTracks[0]],
    batch: mockBatches[0],
    submissionsCount: 20,
    mySubmissionStatus: 'accepted',
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 4,
    title: 'Final Project v1 — REST API Design',
    description:
      'تصميم REST API كامل لنظام مدونات. يشمل authentication, pagination, error handling, و rate limiting.',
    type: 'final',
    isTeam: false,
    maxTeamSize: null,
    videoRequired: true,
    batchId: 1,
    createdBy: 2,
    skills: [mockSkills[0], mockSkills[2], mockSkills[4]],
    tracks: [mockTracks[0]],
    batch: mockBatches[0],
    submissionsCount: 19,
    mySubmissionStatus: 'accepted',
    createdAt: '2026-05-25T10:00:00Z',
  },
  {
    id: 5,
    title: 'HW #5 — Database Optimization',
    description:
      'تحسين استعلامات N+1 + إضافة indexes على الجداول الحرجة. تحليل الـ EXPLAIN لـ 5 استعلامات بطيئة.',
    type: 'hw',
    isTeam: false,
    maxTeamSize: null,
    videoRequired: false,
    batchId: 1,
    createdBy: 2,
    skills: [mockSkills[2], mockSkills[1]],
    tracks: [mockTracks[0]],
    batch: mockBatches[0],
    submissionsCount: 12,
    mySubmissionStatus: null,
    createdAt: '2026-06-25T10:00:00Z',
  },
]

export const mockHackathons: Hackathon[] = [
  {
    id: 1,
    title: '90Soft Hackathon #2 — Car Rental System',
    description:
      'بناء نظام تأجير سيارات كامل في 48 ساعة. يجب أن يشمل بحث، حجز، دفع، وإدارة fleet. الحلول الإبداعية للـ UX والـ performance تحسب لها نقاط إضافية.',
    isTeam: true,
    maxTeamSize: 4,
    deadline: '2026-07-10T23:59:00Z',
    batchId: 1,
    createdBy: 2,
    batch: mockBatches[0],
    submissionsCount: 8,
    myTeam: null,
  },
  {
    id: 2,
    title: 'AI Challenge Hackathon',
    description:
      'بناء تطبيق ذكاء اصطناعي يحل مشكلة حقيقية في 24 ساعة. يمكن استخدام أي LLM أو نموذج AI.',
    isTeam: false,
    maxTeamSize: null,
    deadline: '2026-07-20T23:59:00Z',
    batchId: 1,
    createdBy: 2,
    batch: mockBatches[0],
    submissionsCount: 15,
    myTeam: null,
  },
  {
    id: 3,
    title: '90Soft Hackathon #1 — EduPlatform',
    description:
      'بناء منصة تعليمية في 48 ساعة. شارك 6 فرق، وفاز فريق "Null Pointers" بالمركز الثاني.',
    isTeam: true,
    maxTeamSize: 4,
    deadline: '2026-06-15T23:59:00Z',
    batchId: 1,
    createdBy: 2,
    batch: mockBatches[0],
    submissionsCount: 6,
    myTeam: null,
    myRank: 2,
    myScore: 85,
  },
]

export const mockSubmissions: Submission[] = [
  {
    id: 1,
    taskId: 1,
    hackathonId: null,
    userId: 1,
    teamId: null,
    githubUrl: 'https://github.com/ahmed-ali/saas-dashboard',
    liveUrl: 'https://saas-dashboard.demo.com',
    filePath: null,
    videoUrl: 'https://youtube.com/watch?v=abc123',
    status: 'pending',
    score: null,
    isFeatured: false,
    isReopened: false,
    notes: 'ركّزت على الـ architecture والـ UX. أبرز التحديات كان الـ real-time updates.',
    task: mockTasks[0],
    user: mockCurrentUser,
    skillScores: [],
    createdAt: '2026-06-25T16:45:00Z',
  },
  {
    id: 2,
    taskId: 3,
    hackathonId: null,
    userId: 1,
    teamId: null,
    githubUrl: 'https://github.com/ahmed-ali/ecommerce-api',
    liveUrl: 'https://ecommerce-api.demo.com',
    filePath: 'submissions/ecommerce-api-docs.pdf',
    videoUrl: 'https://youtube.com/watch?v=def456',
    status: 'accepted',
    score: 90,
    isFeatured: true,
    isReopened: false,
    notes: 'ركّزت في هذا التسليم على البنية المعمارية النظيفة (Clean Architecture). أبرز ما أضفته: نظام Roles & Permissions، Custom Form Requests لكل endpoint، و API docs كاملة عبر Scribe.',
    task: mockTasks[2],
    user: mockCurrentUser,
    skillScores: [
      { id: 1, submissionId: 2, skillId: 1, score: 9, skill: mockSkills[0] },
      { id: 2, submissionId: 2, skillId: 3, score: 8.5, skill: mockSkills[2] },
      { id: 3, submissionId: 2, skillId: 5, score: 9.5, skill: mockSkills[4] },
      { id: 4, submissionId: 2, skillId: 2, score: 9, skill: mockSkills[1] },
    ],
    auditLogs: [
      {
        id: 1,
        submissionId: 2,
        changedBy: 2,
        action: 'reviewed',
        oldStatus: 'pending',
        newStatus: 'accepted',
        oldScore: null,
        newScore: 90,
        notes: 'عمل ممتاز! الكود نظيف جداً والـ API docs احترافية. ⭐',
        changedByUser: {
          id: 2,
          name: '90Soft Admin',
          email: 'admin@90soft.com',
          role: 'admin',
          avatar: null,
          batchId: null,
          createdAt: '2026-01-01T00:00:00Z',
        },
        createdAt: '2026-06-22T14:30:00Z',
      },
      {
        id: 2,
        submissionId: 2,
        changedBy: 1,
        action: 'submitted',
        oldStatus: null,
        newStatus: 'pending',
        oldScore: null,
        newScore: null,
        notes: null,
        changedByUser: mockCurrentUser,
        createdAt: '2026-06-20T16:45:00Z',
      },
    ],
    createdAt: '2026-06-20T16:45:00Z',
  },
  {
    id: 3,
    taskId: 4,
    hackathonId: null,
    userId: 1,
    teamId: null,
    githubUrl: 'https://github.com/ahmed-ali/rest-api-design',
    liveUrl: null,
    filePath: null,
    videoUrl: 'https://youtube.com/watch?v=ghi789',
    status: 'accepted',
    score: 90,
    isFeatured: true,
    isReopened: false,
    notes: 'تصميم REST API كامل لنظام مدونات مع rate limiting.',
    task: mockTasks[3],
    user: mockCurrentUser,
    skillScores: [
      { id: 5, submissionId: 3, skillId: 1, score: 9, skill: mockSkills[0] },
      { id: 6, submissionId: 3, skillId: 2, score: 8.5, skill: mockSkills[1] },
    ],
    createdAt: '2026-06-10T11:20:00Z',
  },
  {
    id: 4,
    taskId: 2,
    hackathonId: null,
    userId: 1,
    teamId: null,
    githubUrl: 'https://github.com/ahmed-ali/laravel-auth',
    liveUrl: null,
    filePath: null,
    videoUrl: null,
    status: 'pending',
    score: null,
    isFeatured: false,
    isReopened: false,
    notes: null,
    task: mockTasks[1],
    user: mockCurrentUser,
    skillScores: [],
    createdAt: '2026-06-26T09:15:00Z',
  },
  {
    id: 5,
    hackathonId: 3,
    taskId: null,
    userId: null,
    teamId: 1,
    githubUrl: 'https://github.com/code-wizards/eduplatform',
    liveUrl: 'https://eduplatform.demo.com',
    filePath: null,
    videoUrl: 'https://youtube.com/watch?v=jkl012',
    status: 'accepted',
    score: 85,
    isFeatured: false,
    isReopened: false,
    notes: 'منصة تعليمية بميزات بحث، تسجيل، ولوحة تحكم للمعلم.',
    hackathon: mockHackathons[2],
    user: null,
    team: null,
    skillScores: [],
    createdAt: '2026-06-15T22:00:00Z',
  },
]

export const mockTeams: Team[] = [
  {
    id: 1,
    name: 'Code Wizards',
    teamableType: 'Hackathon',
    teamableId: 1,
    batchId: 1,
    teamMembers: [
      {
        id: 1,
        teamId: 1,
        userId: 1,
        isLeader: true,
        user: mockCurrentUser,
      },
      {
        id: 2,
        teamId: 1,
        userId: 3,
        isLeader: false,
        user: {
          id: 3,
          name: 'محمد سالم',
          email: 'mohammed@student.com',
          role: 'student',
          avatar: null,
          batchId: 1,
          createdAt: '2026-01-15T10:00:00Z',
        },
      },
      {
        id: 3,
        teamId: 1,
        userId: 4,
        isLeader: false,
        user: {
          id: 4,
          name: 'سارة المطيري',
          email: 'sara@student.com',
          role: 'student',
          avatar: null,
          batchId: 1,
          createdAt: '2026-01-15T10:00:00Z',
        },
      },
    ],
    teamable: mockHackathons[0],
    createdAt: '2026-07-08T09:00:00Z',
  },
  {
    id: 2,
    name: 'Byte Busters',
    teamableType: 'Hackathon',
    teamableId: 2,
    batchId: 1,
    teamMembers: [
      {
        id: 4,
        teamId: 2,
        userId: 5,
        isLeader: true,
        user: {
          id: 5,
          name: 'فهد الزهراني',
          email: 'fahad@student.com',
          role: 'student',
          avatar: null,
          batchId: 1,
          createdAt: '2026-01-15T10:00:00Z',
        },
      },
      {
        id: 5,
        teamId: 2,
        userId: 6,
        isLeader: false,
        user: {
          id: 6,
          name: 'خالد العتيبي',
          email: 'khaled@student.com',
          role: 'student',
          avatar: null,
          batchId: 1,
          createdAt: '2026-01-15T10:00:00Z',
        },
      },
      {
        id: 6,
        teamId: 2,
        userId: 1,
        isLeader: false,
        user: mockCurrentUser,
      },
      {
        id: 7,
        teamId: 2,
        userId: 7,
        isLeader: false,
        user: {
          id: 7,
          name: 'ليلى الشمري',
          email: 'layla@student.com',
          role: 'student',
          avatar: null,
          batchId: 1,
          createdAt: '2026-01-15T10:00:00Z',
        },
      },
    ],
    teamable: mockHackathons[1],
    createdAt: '2026-07-09T15:00:00Z',
  },
]

// Set featured project back-reference
if (mockCurrentUser.studentProfile) {
  mockCurrentUser.studentProfile.featuredProject = mockSubmissions[1]
}

export const mockDashboardStats: DashboardStats = {
  total_submissions: 12,
  accepted: 8,
  pending: 3,
  rejected: 1,
  average_score: 8.4,
  rank_in_batch: 3,
}

// =====================================================
// Mock API functions — simulate network latency
// =====================================================

export async function mockLogin(email: string, _password: string) {
  if (!USE_MOCK) {
    return apiServices.loginApi({ email, password: _password } as LoginCredentials)
  }
  await sleep(800)
  if (!email) throw new Error('Email required')
  return {
    user: mockCurrentUser,
    token: 'mock-sanctum-token-' + Date.now(),
  }
}

export async function mockRegister(data: RegisterData) {
  if (!USE_MOCK) {
    return apiServices.registerApi(data)
  }
  await sleep(1000)
  const newUser: User = {
    ...mockCurrentUser,
    name: data.name,
    email: data.email,
    batchId: data.batchId ?? 1,
  }
  return {
    user: newUser,
    token: 'mock-sanctum-token-' + Date.now(),
  }
}

export async function mockGetDashboardStats() {
  if (!USE_MOCK) {
    return apiServices.getDashboardStatsApi()
  }
  await sleep(500)
  return mockDashboardStats
}

export async function mockGetTasks() {
  if (!USE_MOCK) {
    return apiServices.getTasksApi()
  }
  await sleep(400)
  return mockTasks
}

export async function mockGetTask(id: number) {
  if (!USE_MOCK) {
    return apiServices.getTaskApi(id)
  }
  await sleep(400)
  const task = mockTasks.find((t) => t.id === id)
  if (!task) throw new Error('Task not found')
  return task
}

export async function mockGetHackathons() {
  if (!USE_MOCK) {
    return apiServices.getHackathonsApi()
  }
  await sleep(400)
  return mockHackathons
}

export async function mockGetHackathon(id: number) {
  if (!USE_MOCK) {
    return apiServices.getHackathonApi(id)
  }
  await sleep(400)
  const hackathon = mockHackathons.find((h) => h.id === id)
  if (!hackathon) throw new Error('Hackathon not found')
  return hackathon
}

export async function mockGetSubmissions() {
  if (!USE_MOCK) {
    return apiServices.getSubmissionsApi()
  }
  await sleep(400)
  return mockSubmissions
}

export async function mockGetSubmission(id: number) {
  if (!USE_MOCK) {
    return apiServices.getSubmissionApi(id)
  }
  await sleep(400)
  const sub = mockSubmissions.find((s) => s.id === id)
  if (!sub) throw new Error('Submission not found')
  return sub
}

export async function mockCreateSubmission(data: Partial<Submission>) {
  if (!USE_MOCK) {
    return apiServices.createSubmissionApi(data)
  }
  await sleep(800)
  const newSub: Submission = {
    id: mockSubmissions.length + 1,
    taskId: data.taskId ?? null,
    hackathonId: data.hackathonId ?? null,
    userId: mockCurrentUser.id,
    teamId: data.teamId ?? null,
    githubUrl: data.githubUrl ?? null,
    liveUrl: data.liveUrl ?? null,
    filePath: data.filePath ?? null,
    videoUrl: data.videoUrl ?? null,
    status: 'pending',
    score: null,
    isFeatured: false,
    isReopened: false,
    notes: data.notes ?? null,
    task: mockTasks.find((t) => t.id === data.taskId) ?? null,
    hackathon: mockHackathons.find((h) => h.id === data.hackathonId) ?? null,
    user: mockCurrentUser,
    skillScores: [],
    createdAt: new Date().toISOString(),
  }
  mockSubmissions.unshift(newSub)
  return newSub
}

// ✨ P0-2: تعديل التقديم (فقط لو pending)
export async function mockUpdateSubmission(id: number, data: Partial<Submission>) {
  if (!USE_MOCK) {
    const { api } = await import('@/lib/api')
    const { data: result } = await api.put(`/submissions/${id}`, data)
    return result
  }
  await sleep(700)
  const sub = mockSubmissions.find((s) => s.id === id)
  if (!sub) throw new Error('Submission not found')
  if (sub.status !== 'pending') {
    throw new Error('لا يمكن تعديل تسليم تمت مراجعته')
  }
  Object.assign(sub, data)
  return sub
}

export async function mockGetTeams() {
  if (!USE_MOCK) {
    return apiServices.getMyTeamsApi()
  }
  await sleep(400)
  return mockTeams
}

export async function mockGetTeam(id: number) {
  if (!USE_MOCK) {
    return apiServices.getTeamApi(id)
  }
  await sleep(400)
  const team = mockTeams.find((t) => t.id === id)
  if (!team) throw new Error('Team not found')
  return team
}

export async function mockCreateTeam(data: { name: string; teamableId: number; teamableType: string }) {
  if (!USE_MOCK) {
    // Laravel expects 'task' or 'hackathon' (lowercase)
    const teamableType = data.teamableType.toLowerCase() === 'hackathon' ? 'hackathon' : 'task'
    return apiServices.createTeamApi({
      name: data.name,
      teamableId: data.teamableId,
      teamableType: teamableType as 'task' | 'hackathon',
    })
  }
  await sleep(700)
  const newTeam: Team = {
    id: mockTeams.length + 1,
    name: data.name,
    teamableType: data.teamableType,
    teamableId: data.teamableId,
    batchId: 1,
    teamMembers: [
      {
        id: Date.now(),
        teamId: mockTeams.length + 1,
        userId: mockCurrentUser.id,
        isLeader: true,
        user: mockCurrentUser,
      },
    ],
    teamable: data.teamableType === 'Hackathon'
      ? mockHackathons.find((h) => h.id === data.teamableId)
      : mockTasks.find((t) => t.id === data.teamableId),
    createdAt: new Date().toISOString(),
  }
  mockTeams.unshift(newTeam)
  return newTeam
}

export async function mockUpdateProfile(data: Partial<NonNullable<User['studentProfile']>>) {
  if (!USE_MOCK) {
    return apiServices.updateProfileApi(data as any)
  }
  await sleep(700)
  if (mockCurrentUser.studentProfile) {
    Object.assign(mockCurrentUser.studentProfile, data)
  }
  return mockCurrentUser.studentProfile
}

// ✨ جلب الـ profile من API مباشرة (يستخدمه ProfilePage)
export async function mockGetProfile() {
  if (!USE_MOCK) {
    return apiServices.getProfileApi()
  }
  await sleep(400)
  return mockCurrentUser.studentProfile
}

export async function mockGetSkills() {
  if (!USE_MOCK) {
    return apiServices.getSkillsApi()
  }
  await sleep(200)
  return mockSkills
}

export async function mockGetTracks() {
  if (!USE_MOCK) {
    return apiServices.getTracksApi()
  }
  await sleep(200)
  return mockTracks
}

export async function mockGetBatches() {
  if (!USE_MOCK) {
    return apiServices.getBatchesApi()
  }
  await sleep(200)
  return mockBatches
}

// =====================================================
// ✨ Feature Proposals Mock Data + Functions
// =====================================================

export const mockProposals: FeatureProposal[] = [
  {
    id: 1,
    hackathonId: 3,
    userId: 1,
    teamId: null,
    title: 'AI Chatbot للدعم الفني',
    problemStatement: 'المستخدمون يواجهون صعوبة في العثور على المعلومات بسرعة.',
    proposedSolution: 'بناء chatbot ذكي باستخدام OpenAI GPT-4 مع RAG.',
    addedValue: 'تقليل وقت الاستجابة 95%، زيادة رضا المستخدمين 30%.',
    githubUrl: 'https://github.com/ahmed-ali/support-chatbot',
    liveUrl: 'https://chatbot.demo.com',
    videoUrl: 'https://youtube.com/watch?v=chatbot-demo',
    implementationNotes: 'استخدمت LangChain للـ RAG.',
    status: 'accepted_merged',
    adminFeedback: 'عمل استثنائي! ⭐',
    impactScore: 9,
    innovationScore: 8,
    executionScore: 9,
    reviewedBy: 2,
    reviewedAt: '2026-05-25T10:00:00Z',
    hackathon: mockHackathons[2],
    user: mockCurrentUser,
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-05-25T10:00:00Z',
  },
  {
    id: 2,
    hackathonId: 3,
    userId: 1,
    teamId: null,
    title: 'Dark Mode with Custom Themes',
    problemStatement: 'إجهاد العين من الإضاءة الساطعة ليلاً.',
    proposedSolution: 'CSS variables + localStorage + 3 ثيمات.',
    addedValue: 'تحسين UX 25%، تقليل إجهاد العين.',
    githubUrl: 'https://github.com/ahmed-ali/dark-mode',
    liveUrl: null,
    videoUrl: 'https://youtube.com/watch?v=darkmode-demo',
    implementationNotes: 'استخدمت Tailwind dark: variant.',
    status: 'accepted_showcase',
    adminFeedback: 'تنفيذ جيد وأنيق.',
    impactScore: 7,
    innovationScore: 6,
    executionScore: 8,
    reviewedBy: 2,
    reviewedAt: '2026-05-25T10:00:00Z',
    hackathon: mockHackathons[2],
    user: mockCurrentUser,
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-05-25T10:00:00Z',
  },
  {
    id: 3,
    hackathonId: 1,
    userId: 1,
    teamId: null,
    title: 'Real-time Analytics Dashboard',
    problemStatement: 'الإحصائيات تتأخر 24 ساعة.',
    proposedSolution: 'WebSocket لـ real-time updates.',
    addedValue: 'اتخاذ قرارات أسرع 10x.',
    githubUrl: 'https://github.com/ahmed-ali/realtime-dashboard',
    liveUrl: 'https://analytics.demo.com',
    videoUrl: 'https://youtube.com/watch?v=analytics-demo',
    implementationNotes: 'استخدمت Socket.io + Redis.',
    status: 'pending',
    adminFeedback: null,
    impactScore: null,
    innovationScore: null,
    executionScore: null,
    reviewedBy: null,
    reviewedAt: null,
    hackathon: mockHackathons[0],
    user: mockCurrentUser,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function mockGetHackathonProposals(hackathonId: number) {
  if (!USE_MOCK) {
    return apiServices.getHackathonProposalsApi(hackathonId)
  }
  await sleep(400)
  return mockProposals.filter((p) => p.hackathonId === hackathonId)
}

export async function mockGetMyProposals() {
  if (!USE_MOCK) {
    return apiServices.getMyProposalsApi()
  }
  await sleep(400)
  return mockProposals.filter((p) => p.userId === mockCurrentUser.id)
}

export async function mockGetProposal(id: number) {
  if (!USE_MOCK) {
    return apiServices.getProposalApi(id)
  }
  await sleep(400)
  const proposal = mockProposals.find((p) => p.id === id)
  if (!proposal) throw new Error('Proposal not found')
  return proposal
}

export async function mockCreateProposal(hackathonId: number, data: CreateProposalData) {
  if (!USE_MOCK) {
    return apiServices.createProposalApi(hackathonId, data)
  }
  await sleep(800)
  const newProposal: FeatureProposal = {
    id: mockProposals.length + 1,
    hackathonId,
    userId: mockCurrentUser.id,
    teamId: data.team_id ?? null,
    title: data.title,
    problemStatement: data.problem_statement,
    proposedSolution: data.proposed_solution,
    addedValue: data.added_value,
    githubUrl: data.github_url ?? null,
    liveUrl: data.live_url ?? null,
    videoUrl: data.video_url ?? null,
    implementationNotes: data.implementation_notes ?? null,
    status: 'pending',
    adminFeedback: null,
    impactScore: null,
    innovationScore: null,
    executionScore: null,
    reviewedBy: null,
    reviewedAt: null,
    hackathon: mockHackathons.find((h) => h.id === hackathonId),
    user: mockCurrentUser,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockProposals.unshift(newProposal)
  return newProposal
}

export async function mockDeleteProposal(id: number) {
  if (!USE_MOCK) {
    return apiServices.deleteProposalApi(id)
  }
  await sleep(500)
  const idx = mockProposals.findIndex((p) => p.id === id)
  if (idx >= 0) mockProposals.splice(idx, 1)
}
