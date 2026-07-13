import type { FeatureProposal, CreateProposalData,
  Batch,
  DashboardStats,
  Hackathon,
  JoinRequest,
  LoginCredentials,
  PaginatedResponse,
  RegisterData,
  Skill,
  Submission,
  Task,
  Team,
  TeamPreview,
  Track,
  User,
} from '@/types'
import { sleep } from './utils'
import { api } from '@/lib/api'
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

/**
 * ✨ إنشاء خطأ بهيئة Axios كي يصلحه extractApiMessage (response.data.message).
 * يُستخدم في دوال mock لرمي 422 بنفس شكل استجابة Laravel.
 */
function makeMockError(message: string, status = 422): Error {
  const err = new Error(message) as Error & { response?: { status: number; data: { message: string } } }
  err.response = { status, data: { message } }
  return err
}

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
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    usersCount: 24,
    tasksCount: 5,
    hackathonsCount: 2,
  },
  {
    id: 2,
    name: 'Batch 2 - 2026',
    status: 'active',
    startDate: '2026-04-01',
    endDate: '2026-10-30',
    usersCount: 18,
    tasksCount: 3,
    hackathonsCount: 1,
  },
]

export const mockCurrentUser: User = {
  id: 1,
  name: 'أحمد علي محمد',
  email: 'ahmed.ali@student.com',
  role: 'student',
  avatar: null,
  batchId: 1,
  // ✨ B6: محاكاة بريد مُتحقَّق (لتجربة الـ banner "مُؤكَّد" في mock)
  // غيّر لـ null لتجربة الـ banner "غير مُؤكَّد"
  emailVerifiedAt: '2026-01-15T10:05:00Z',
  // ✨ B4: الحساب نشط
  isActive: true,
  // ✨ P1-1: أضف batch كاملاً ليظهر في Sidebar/ProfilePage في وضع mock
  batch: mockBatches[0],
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
    type: 'hw',
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
    type: 'hw',
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
    score: 9, // ✨ P0-2: من 10 (كان 90 من 100)
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
        newScore: 9,
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
    score: 9, // ✨ P0-2: من 10 (كان 90)
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
    score: 8.5, // ✨ P0-2: من 10 (كان 85)
    isFeatured: false,
    isReopened: false,
    notes: 'منصة تعليمية بميزات بحث، تسجيل، ولوحة تحكم للمعلم.',
    hackathon: mockHackathons[2],
    user: null,
    team: null,
    skillScores: [],
    // ✨ TEAM EVALUATION: بيانات تقديم جماعي
    isTeamSubmission: true,
    participantsCount: 4,
    myContribution: 35,
    myContributionNotes: 'قائد الفريق — صمّمت الـ architecture وقُدت الاجتماعات',
    myRole: 'leader',
    teamMembers: [
      {
        id: 1,
        submissionId: 5,
        userId: 1,
        teamId: 1,
        isLeader: true,
        contributionPercentage: 35,
        contributionNotes: 'قائد الفريق — صمّمت الـ architecture وقُدت الاجتماعات',
        user: {
          id: 1,
          name: 'أحمد علي محمد',
          avatar: null,
        },
        createdAt: '2026-06-15T22:00:00Z',
      },
      {
        id: 2,
        submissionId: 5,
        userId: 2,
        teamId: 1,
        isLeader: false,
        contributionPercentage: 25,
        contributionNotes: 'بنى الـ API endpoints والـ authentication',
        user: {
          id: 2,
          name: 'سارة المطيري',
          avatar: null,
        },
        createdAt: '2026-06-15T22:00:00Z',
      },
      {
        id: 3,
        submissionId: 5,
        userId: 3,
        teamId: 1,
        isLeader: false,
        contributionPercentage: 25,
        contributionNotes: 'بنى الـ frontend بـ React و Tailwind',
        user: {
          id: 3,
          name: 'محمد سالم',
          avatar: null,
        },
        createdAt: '2026-06-15T22:00:00Z',
      },
      {
        id: 4,
        submissionId: 5,
        userId: 4,
        teamId: 1,
        isLeader: false,
        contributionPercentage: 15,
        contributionNotes: 'كتب الاختبارات والتوثيق',
        user: {
          id: 4,
          name: 'فهد الزهراني',
          avatar: null,
        },
        createdAt: '2026-06-15T22:00:00Z',
      },
    ],
    createdAt: '2026-06-15T22:00:00Z',
  },
]

export const mockTeams: Team[] = [
  {
    id: 1,
    name: 'Code Wizards',
    teamableType: 'hackathon',
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
    teamableType: 'hackathon',
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
  totalSubmissions: 12,
  accepted: 8,
  pending: 3,
  rejected: 1,
  averageScore: 8.4,
  rankInBatch: 3,
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

/**
 * ✨ P1-4: محاكاة GET /auth/me للتحقق من صلاحية الـ token
 * في وضع mock، يُرجع mockCurrentUser مباشرة (لا يوجد server للتحقق)
 */
export async function mockGetMe() {
  if (!USE_MOCK) {
    return apiServices.getMeApi()
  }
  await sleep(200)
  return mockCurrentUser
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

// ✨ helper: wrap array in PaginatedResponse (mock mode)
function paginateMock<T>(items: T[]): PaginatedResponse<T> {
  return {
    data: items,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: items.length,
      total: items.length,
      from: items.length > 0 ? 1 : null,
      to: items.length > 0 ? items.length : null,
    },
  }
}

export async function mockGetTasks(page?: number): Promise<PaginatedResponse<Task>> {
  if (!USE_MOCK) {
    return apiServices.getTasksApi(page ? { page } : undefined)
  }
  await sleep(400)
  return paginateMock(mockTasks)
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

export async function mockGetHackathons(page?: number): Promise<PaginatedResponse<Hackathon>> {
  if (!USE_MOCK) {
    return apiServices.getHackathonsApi(page ? { page } : undefined)
  }
  await sleep(400)
  return paginateMock(mockHackathons)
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

export async function mockGetSubmissions(page?: number): Promise<PaginatedResponse<Submission>> {
  if (!USE_MOCK) {
    return apiServices.getSubmissionsApi(page ? { page } : undefined)
  }
  await sleep(400)
  return paginateMock(mockSubmissions)
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

export async function mockCreateSubmission(data: Partial<Submission> & { file?: File }) {
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
    // ✨ خزّن اسم الملف المرفوع كـ path وهمي (mock) — الـ fileUrl يُشتق منه
    filePath: data.file ? `submissions/mock-${Date.now()}-${data.file.name}` : null,
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
    // ✨ P0 FIX: استخدم updateSubmissionApi (transformSubmission + snake_case + FormData)
    // بدل api.put المباشر الذي كان يُرجع snake_case خام فيُكسر الـ UI.
    return apiServices.updateSubmissionApi(id, {
      github_url: (data as Record<string, unknown>).github_url as string | null | undefined,
      live_url: (data as Record<string, unknown>).live_url as string | null | undefined,
      video_url: (data as Record<string, unknown>).video_url as string | null | undefined,
      notes: (data as Record<string, unknown>).notes as string | null | undefined,
    })
  }
  await sleep(700)
  const sub = mockSubmissions.find((s) => s.id === id)
  if (!sub) throw new Error('Submission not found')
  if (sub.status !== 'pending') {
    throw new Error('لا يمكن تعديل تسليم تمت مراجعته')
  }
  // ✨ B2-mock: طابّق مفاتيح snake_case (من صفحة التعديل) إلى camelCase لنموذج Submission
  if ((data as Record<string, unknown>).github_url !== undefined) {
    sub.githubUrl = (data as Record<string, unknown>).github_url as string | null
  }
  if ((data as Record<string, unknown>).live_url !== undefined) {
    sub.liveUrl = (data as Record<string, unknown>).live_url as string | null
  }
  if ((data as Record<string, unknown>).video_url !== undefined) {
    sub.videoUrl = (data as Record<string, unknown>).video_url as string | null
  }
  if ((data as Record<string, unknown>).notes !== undefined) {
    sub.notes = (data as Record<string, unknown>).notes as string | null
  }
  return sub
}

/**
 * ✨ B3: واجهة facade لحذف التقديم — كانت مفقودة فكان الحذف معطّلاً تماماً.
 */
export async function mockDeleteSubmission(id: number): Promise<void> {
  if (!USE_MOCK) {
    return apiServices.deleteSubmissionApi(id)
  }
  await sleep(500)
  const idx = mockSubmissions.findIndex((s) => s.id === id)
  if (idx >= 0) {
    mockSubmissions.splice(idx, 1)
  }
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
    // ✨ Laravel expects 'task' or 'hackathon' (lowercase)
    const teamableType = data.teamableType.toLowerCase() === 'hackathon' ? 'hackathon' : 'task'
    return apiServices.createTeamApi({
      name: data.name,
      teamableId: data.teamableId,
      teamableType: teamableType as 'task' | 'hackathon',
    })
  }
  await sleep(700)
  // ✨ mock data يستخدم lowercase للاتساق مع transformTeam
  const normalizedType = data.teamableType.toLowerCase() === 'hackathon' ? 'hackathon' : 'task'
  const newTeam: Team = {
    id: mockTeams.length + 1,
    name: data.name,
    teamableType: normalizedType,
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
    teamable: normalizedType === 'hackathon'
      ? mockHackathons.find((h) => h.id === data.teamableId)
      : mockTasks.find((t) => t.id === data.teamableId),
    createdAt: new Date().toISOString(),
  }
  mockTeams.unshift(newTeam)
  return newTeam
}

export async function mockUpdateProfile(
  data: Omit<Partial<NonNullable<User['studentProfile']>>, 'tracks'> & { cv?: File; tracks?: number[] },
) {
  if (!USE_MOCK) {
    return apiServices.updateProfileApi(data)
  }
  await sleep(700)
  if (mockCurrentUser.studentProfile) {
    // ✨ P1-3: لا تخزّن File object في الـ mock — استخدم اسم الملف فقط
    const { cv, tracks, ...rest } = data
    Object.assign(mockCurrentUser.studentProfile, rest)
    if (cv) {
      mockCurrentUser.studentProfile.cvPath = `cvs/${cv.name}`
    }
    // ✨ tracks هنا number[] — لا نحدث الـ studentProfile.tracks (التي Track[]) في mock
    // الـ backend فقط يربط الـ IDs بالـ tracks الفعلية
  }
  return mockCurrentUser.studentProfile
}

/**
 * ✨ P1-3: حذف الـ CV
 */
export async function mockDeleteCv() {
  if (!USE_MOCK) {
    return apiServices.deleteCvApi()
  }
  await sleep(500)
  if (mockCurrentUser.studentProfile) {
    mockCurrentUser.studentProfile.cvPath = null
  }
}

/**
 * ✨ Stage 5: رفع الصورة الشخصية
 */
export async function mockUploadAvatar(file: File) {
  if (!USE_MOCK) {
    return apiServices.uploadAvatarApi(file)
  }
  await sleep(800)
  // ✨ في وضع mock، نُنشئ object URL مؤقت للمعاينة
  const avatarUrl = URL.createObjectURL(file)
  mockCurrentUser.avatar = avatarUrl
  return {
    avatar: avatarUrl,
    user: { ...mockCurrentUser },
  }
}

/**
 * ✨ Stage 5: حذف الصورة الشخصية
 */
export async function mockDeleteAvatar() {
  if (!USE_MOCK) {
    return apiServices.deleteAvatarApi()
  }
  await sleep(400)
  mockCurrentUser.avatar = null
  return { user: { ...mockCurrentUser } }
}

// ✨ جلب الـ profile من API مباشرة (يستخدمه ProfilePage)
export async function mockGetProfile() {
  if (!USE_MOCK) {
    return apiServices.getProfileApi()
  }
  await sleep(400)
  // ✨ BUG FIX #9: featuredProject كان دائماً null في mock — اربطه بـ mockSubmissions
  // محاكاة لـ StudentProfileController@show الذي يبحث عن أعلى submission مقبول
  const profile = mockCurrentUser.studentProfile
  if (profile && !profile.featuredProject) {
    const bestSubmission = mockSubmissions
      .filter((s) => s.status === 'accepted' && s.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
    if (bestSubmission) {
      profile.featuredProject = bestSubmission
      profile.featuredProjectId = bestSubmission.id
    }
  }
  return profile
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

/**
 * ✨ FIX #3: تعديل اقتراح (mock + real API) — كان مفقوداً تماماً.
 * يستخدم في صفحة FeatureProposalEditPage الجديدة.
 */
export async function mockUpdateProposal(id: number, data: Partial<CreateProposalData>) {
  if (!USE_MOCK) {
    return apiServices.updateProposalApi(id, data)
  }
  await sleep(700)
  const proposal = mockProposals.find((p) => p.id === id)
  if (!proposal) throw new Error('Proposal not found')
  if (proposal.status !== 'pending' && proposal.status !== 'needs_revision') {
    throw new Error('لا يمكن تعديل proposal تمت مراجعته وقبوله')
  }
  if (data.title !== undefined) proposal.title = data.title
  if (data.problem_statement !== undefined) proposal.problemStatement = data.problem_statement
  if (data.proposed_solution !== undefined) proposal.proposedSolution = data.proposed_solution
  if (data.added_value !== undefined) proposal.addedValue = data.added_value
  if (data.github_url !== undefined) proposal.githubUrl = data.github_url ?? null
  if (data.live_url !== undefined) proposal.liveUrl = data.live_url ?? null
  if (data.video_url !== undefined) proposal.videoUrl = data.video_url ?? null
  if (data.implementation_notes !== undefined) proposal.implementationNotes = data.implementation_notes ?? null
  // ✨ لو كان needs_revision، نُعيده لـ pending بعد التعديل
  if (proposal.status === 'needs_revision') {
    proposal.status = 'pending'
  }
  proposal.updatedAt = new Date().toISOString()
  return proposal
}

// ✨ إزالة عضو من فريق
export async function mockRemoveTeamMember(teamId: number, userId: number) {
  if (!USE_MOCK) {
    return apiServices.removeTeamMemberApi(teamId, userId)
  }
  await sleep(500)
  const team = mockTeams.find((t) => t.id === teamId)
  if (!team) throw new Error('Team not found')
  team.teamMembers = team.teamMembers.filter((m) => m.userId !== userId)
  return team
}

// =====================================================
// ✨ Join Requests — طلبات الانضمام للفرق (موافقة القائد)
// =====================================================
// mockJoinRequests يُخزَّن في الذاكرة؛ الإقران عبر (teamId, userId) فريد.
const mockJoinRequests: JoinRequest[] = []

export async function mockPreviewTeam(teamId: number): Promise<TeamPreview> {
  if (!USE_MOCK) {
    return apiServices.previewTeamApi(teamId)
  }
  await sleep(300)
  const team = mockTeams.find((t) => t.id === teamId)
  if (!team) throw new Error('Team not found')
  return computePreview(team)
}

/**
 * ✨ فرق متاحة لـ teamable (لاكتشاف الانضمام) — معاينة محدودة لكل فريق.
 */
export async function mockGetTeamsForTeamable(
  teamableType: 'task' | 'hackathon',
  teamableId: number,
): Promise<import('@/services').TeamSummary[]> {
  if (!USE_MOCK) {
    return apiServices.getTeamsForTeamableApi(teamableType, teamableId)
  }
  await sleep(300)
  return mockTeams
    .filter((t) => t.teamableType === teamableType && t.teamableId === teamableId)
    .map((t) => {
      const p = computePreview(t)
      return {
        id: p.id,
        name: p.name,
        membersCount: p.membersCount,
        maxTeamSize: p.maxTeamSize,
        leaderName: p.leaderName,
        canRequestJoin: p.canRequestJoin,
      }
    })
}

// ✨ منطق مشترك لحساب معاينة فريق (preview) من بيانات mock.
function computePreview(team: Team): TeamPreview {
  const teamable = team.teamable
  const maxTeamSize = (teamable && 'maxTeamSize' in teamable ? teamable.maxTeamSize : null) ?? null
  const membersCount = team.teamMembers.length
  const leader = team.teamMembers.find((m) => m.isLeader)
  const isMember = team.teamMembers.some((m) => m.userId === mockCurrentUser.id)
  const hasPending = mockJoinRequests.some(
    (r) => r.teamId === team.id && r.userId === mockCurrentUser.id && r.status === 'pending',
  )
  const slotAvailable = !maxTeamSize || membersCount < maxTeamSize
  const canRequestJoin =
    mockCurrentUser.role === 'student' &&
    !isMember &&
    !hasPending &&
    slotAvailable &&
    mockCurrentUser.batchId === team.batchId
  return {
    id: team.id,
    name: team.name,
    teamableType: team.teamableType,
    teamableId: team.teamableId,
    teamableTitle: teamable?.title ?? '—',
    membersCount,
    maxTeamSize,
    leaderName: leader?.user.name ?? null,
    canRequestJoin,
  }
}

export async function mockCreateJoinRequest(teamId: number, message?: string | null): Promise<JoinRequest> {
  if (!USE_MOCK) {
    return apiServices.createJoinRequestApi(teamId, message)
  }
  await sleep(600)
  const team = mockTeams.find((t) => t.id === teamId)
  if (!team) throw new Error('Team not found')

  const isMember = team.teamMembers.some((m) => m.userId === mockCurrentUser.id)
  if (isMember) throw makeMockError('أنت بالفعل عضو في هذا الفريق', 422)
  const existing = mockJoinRequests.find((r) => r.teamId === teamId && r.userId === mockCurrentUser.id)
  if (existing) throw makeMockError('لقد أرسلت طلباً مسبقاً لهذا الفريق', 422)

  const req: JoinRequest = {
    id: mockJoinRequests.length + 1,
    teamId,
    userId: mockCurrentUser.id,
    status: 'pending',
    message: message ?? null,
    createdAt: new Date().toISOString(),
    team,
    user: mockCurrentUser,
  }
  mockJoinRequests.push(req)
  return req
}

export async function mockGetMyJoinRequests(): Promise<JoinRequest[]> {
  if (!USE_MOCK) {
    return apiServices.getMyJoinRequestsApi()
  }
  await sleep(300)
  return mockJoinRequests
    .filter((r) => r.userId === mockCurrentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function mockGetTeamJoinRequests(teamId: number): Promise<JoinRequest[]> {
  if (!USE_MOCK) {
    return apiServices.getTeamJoinRequestsApi(teamId)
  }
  await sleep(300)
  return mockJoinRequests
    .filter((r) => r.teamId === teamId && r.status === 'pending')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function mockApproveJoinRequest(teamId: number, joinRequestId: number): Promise<JoinRequest> {
  if (!USE_MOCK) {
    return apiServices.approveJoinRequestApi(teamId, joinRequestId)
  }
  await sleep(500)
  const team = mockTeams.find((t) => t.id === teamId)
  if (!team) throw new Error('Team not found')
  const req = mockJoinRequests.find((r) => r.id === joinRequestId && r.teamId === teamId)
  if (!req || req.status !== 'pending') throw makeMockError('الطلب لم يعد قيد المراجعة', 422)
  if (!req.user) throw makeMockError('الطلب لم يعد متاحاً', 422)
  // أضِف العضو للفريق
  team.teamMembers.push({
    id: Date.now(),
    teamId,
    userId: req.userId,
    isLeader: false,
    user: req.user,
  })
  req.status = 'approved'
  return req
}

export async function mockRejectJoinRequest(teamId: number, joinRequestId: number): Promise<JoinRequest> {
  if (!USE_MOCK) {
    return apiServices.rejectJoinRequestApi(teamId, joinRequestId)
  }
  await sleep(400)
  const req = mockJoinRequests.find((r) => r.id === joinRequestId && r.teamId === teamId)
  if (!req || req.status !== 'pending') throw makeMockError('الطلب لم يعد قيد المراجعة', 422)
  req.status = 'rejected'
  return req
}

// =====================================================
// ✨ P1-5: Auth helpers — توحيد Facade لصفحات forgot/reset password
// =====================================================

/**
 * إعادة تعيين كلمة المرور — يعمل في الحالتين (mock + real API)
 */
export async function mockForgotPassword(email: string): Promise<{ message: string }> {
  if (!USE_MOCK) {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  }
  await sleep(500)
  // ✨ نفس رسالة الـ backend لمنع enumeration
  return {
    message: 'إذا كان البريد الإلكتروني مسجّلاً لدينا، ستستقبل رسالة لإعادة تعيين كلمة المرور خلال دقائق.',
  }
}

/**
 * تعيين كلمة مرور جديدة — يعمل في الحالتين (mock + real API)
 */
export async function mockResetPassword(payload: {
  token: string
  email: string
  password: string
  password_confirmation: string
}): Promise<{ message: string }> {
  if (!USE_MOCK) {
    const { data } = await api.post('/auth/reset-password', payload)
    return data
  }
  await sleep(500)
  if (!payload.token || !payload.email || !payload.password) {
    throw new Error('بيانات غير صالحة')
  }
  return { message: 'تم تغيير كلمة المرور بنجاح. سجّل الدخول بكلمة المرور الجديدة.' }
}

/**
 * تغيير كلمة المرور (من صفحة Settings) — يعمل في الحالتين
 */
export async function mockChangePassword(payload: {
  current_password: string
  password: string
  password_confirmation: string
}): Promise<{ message: string }> {
  if (!USE_MOCK) {
    const { data } = await api.put('/auth/password', payload)
    return data
  }
  await sleep(500)
  return { message: 'تم تغيير كلمة المرور بنجاح' }
}

// =====================================================
// ✨ B6: Email Verification helpers — Facade لصفحة VerifyEmailPage
// =====================================================

/**
 * تأكيد البريد الإلكتروني — يعمل في الحالتين (mock + real API).
 *
 * endpoint عام (لا يتطلب auth). يُستدعى:
 * - تلقائياً عند القدوم من رابط الإيميل (?token=xxx&email=yyy)
 * - يدوياً من نموذج VerifyEmailPage
 */
export async function mockVerifyEmail(payload: {
  token: string
  email: string
}): Promise<{ message: string }> {
  if (!USE_MOCK) {
    const { data } = await api.post('/auth/verify-email', payload)
    return data
  }
  await sleep(700)
  // ✨ محاكاة واقعية: الرمز غير الفارغ يُعتبَر صالحاً في mock
  if (!payload.token || !payload.email) {
    throw makeMockError('رمز غير صالح أو البريد مُتحقَّق بالفعل', 422)
  }
  // ✨ محاكاة تحديث حالة المستخدم في mock
  if (mockCurrentUser.email === payload.email) {
    mockCurrentUser.emailVerifiedAt = new Date().toISOString()
  }
  return { message: 'تم تأكيد بريدك الإلكتروني بنجاح' }
}

/**
 * إعادة إرسال رمز التحقق — يعمل في الحالتين.
 * يتطلب auth (Bearer token) — يستدعيه المستخدم المسجّل دخول فقط.
 */
export async function mockResendVerification(): Promise<{ message: string }> {
  if (!USE_MOCK) {
    const { data } = await api.post('/auth/resend-verification')
    return data
  }
  await sleep(600)
  return { message: 'تمت إعادة إرسال رمز التحقق إلى بريدك.' }
}
