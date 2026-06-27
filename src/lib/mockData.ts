import type {
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
  batch_id: 1,
  created_at: '2026-01-15T10:00:00Z',
  studentProfile: {
    id: 1,
    user_id: 1,
    name: 'أحمد علي محمد',
    bio: 'طالب علوم حاسوب شغوف ببناء أنظمة backend قابلة للتوسع. خبرة في Laravel و PostgreSQL، وأعمل حالياً على إتقان الـ microservices. أبحث عن فرصة تطوير حقيقية.',
    tagline: 'Backend Developer في طور التعلم',
    github_url: 'https://github.com/ahmed-ali',
    linkedin_url: 'https://linkedin.com/in/ahmed-ali',
    portfolio_url: null,
    cv_path: 'cvs/ahmed_cv.pdf',
    featured_project_id: 2,
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
    is_team: false,
    max_team_size: null,
    video_required: true,
    batch_id: 1,
    created_by: 2,
    skills: [mockSkills[0], mockSkills[2], mockSkills[4], mockSkills[8]],
    tracks: [mockTracks[0], mockTracks[4]],
    batch: mockBatches[0],
    submissions_count: 18,
    my_submission_status: null,
    created_at: '2026-06-15T10:00:00Z',
  },
  {
    id: 2,
    title: 'HW #4 — Authentication & Authorization',
    description:
      'بناء نظام مصادقة كامل باستخدام Laravel Sanctum + Role Middleware. يجب دعم 3 أدوار على الأقل (admin, student, company) مع Endpoints منفصلة لكل دور.',
    type: 'hw',
    is_team: false,
    max_team_size: null,
    video_required: false,
    batch_id: 1,
    created_by: 2,
    skills: [mockSkills[0], mockSkills[2], mockSkills[4]],
    tracks: [mockTracks[0]],
    batch: mockBatches[0],
    submissions_count: 22,
    my_submission_status: 'pending',
    created_at: '2026-06-20T10:00:00Z',
  },
  {
    id: 3,
    title: 'HW #3 — E-commerce API',
    description:
      'بناء RESTful API لإدارة متجر إلكتروني مع المنتجات، السلة، الطلبات. يشمل migrations, models, controllers, و API documentation.',
    type: 'hw',
    is_team: false,
    max_team_size: null,
    video_required: false,
    batch_id: 1,
    created_by: 2,
    skills: [mockSkills[0], mockSkills[2], mockSkills[4]],
    tracks: [mockTracks[0]],
    batch: mockBatches[0],
    submissions_count: 20,
    my_submission_status: 'accepted',
    created_at: '2026-06-10T10:00:00Z',
  },
  {
    id: 4,
    title: 'Final Project v1 — REST API Design',
    description:
      'تصميم REST API كامل لنظام مدونات. يشمل authentication, pagination, error handling, و rate limiting.',
    type: 'final',
    is_team: false,
    max_team_size: null,
    video_required: true,
    batch_id: 1,
    created_by: 2,
    skills: [mockSkills[0], mockSkills[2], mockSkills[4]],
    tracks: [mockTracks[0]],
    batch: mockBatches[0],
    submissions_count: 19,
    my_submission_status: 'accepted',
    created_at: '2026-05-25T10:00:00Z',
  },
  {
    id: 5,
    title: 'HW #5 — Database Optimization',
    description:
      'تحسين استعلامات N+1 + إضافة indexes على الجداول الحرجة. تحليل الـ EXPLAIN لـ 5 استعلامات بطيئة.',
    type: 'hw',
    is_team: false,
    max_team_size: null,
    video_required: false,
    batch_id: 1,
    created_by: 2,
    skills: [mockSkills[2], mockSkills[1]],
    tracks: [mockTracks[0]],
    batch: mockBatches[0],
    submissions_count: 12,
    my_submission_status: null,
    created_at: '2026-06-25T10:00:00Z',
  },
]

export const mockHackathons: Hackathon[] = [
  {
    id: 1,
    title: '90Soft Hackathon #2 — Car Rental System',
    description:
      'بناء نظام تأجير سيارات كامل في 48 ساعة. يجب أن يشمل بحث، حجز، دفع، وإدارة fleet. الحلول الإبداعية للـ UX والـ performance تحسب لها نقاط إضافية.',
    is_team: true,
    max_team_size: 4,
    deadline: '2026-07-10T23:59:00Z',
    batch_id: 1,
    created_by: 2,
    batch: mockBatches[0],
    submissions_count: 8,
    my_team: null,
  },
  {
    id: 2,
    title: 'AI Challenge Hackathon',
    description:
      'بناء تطبيق ذكاء اصطناعي يحل مشكلة حقيقية في 24 ساعة. يمكن استخدام أي LLM أو نموذج AI.',
    is_team: false,
    max_team_size: null,
    deadline: '2026-07-20T23:59:00Z',
    batch_id: 1,
    created_by: 2,
    batch: mockBatches[0],
    submissions_count: 15,
    my_team: null,
  },
  {
    id: 3,
    title: '90Soft Hackathon #1 — EduPlatform',
    description:
      'بناء منصة تعليمية في 48 ساعة. شارك 6 فرق، وفاز فريق "Null Pointers" بالمركز الثاني.',
    is_team: true,
    max_team_size: 4,
    deadline: '2026-06-15T23:59:00Z',
    batch_id: 1,
    created_by: 2,
    batch: mockBatches[0],
    submissions_count: 6,
    my_team: null,
    my_rank: 2,
    my_score: 85,
  },
]

export const mockSubmissions: Submission[] = [
  {
    id: 1,
    task_id: 1,
    hackathon_id: null,
    user_id: 1,
    team_id: null,
    github_url: 'https://github.com/ahmed-ali/saas-dashboard',
    live_url: 'https://saas-dashboard.demo.com',
    file_path: null,
    video_url: 'https://youtube.com/watch?v=abc123',
    status: 'pending',
    score: null,
    is_featured: false,
    is_reopened: false,
    notes: 'ركّزت على الـ architecture والـ UX. أبرز التحديات كان الـ real-time updates.',
    task: mockTasks[0],
    user: mockCurrentUser,
    skillScores: [],
    created_at: '2026-06-25T16:45:00Z',
  },
  {
    id: 2,
    task_id: 3,
    hackathon_id: null,
    user_id: 1,
    team_id: null,
    github_url: 'https://github.com/ahmed-ali/ecommerce-api',
    live_url: 'https://ecommerce-api.demo.com',
    file_path: 'submissions/ecommerce-api-docs.pdf',
    video_url: 'https://youtube.com/watch?v=def456',
    status: 'accepted',
    score: 90,
    is_featured: true,
    is_reopened: false,
    notes: 'ركّزت في هذا التسليم على البنية المعمارية النظيفة (Clean Architecture). أبرز ما أضفته: نظام Roles & Permissions، Custom Form Requests لكل endpoint، و API docs كاملة عبر Scribe.',
    task: mockTasks[2],
    user: mockCurrentUser,
    skillScores: [
      { id: 1, submission_id: 2, skill_id: 1, score: 9, skill: mockSkills[0] },
      { id: 2, submission_id: 2, skill_id: 3, score: 8.5, skill: mockSkills[2] },
      { id: 3, submission_id: 2, skill_id: 5, score: 9.5, skill: mockSkills[4] },
      { id: 4, submission_id: 2, skill_id: 2, score: 9, skill: mockSkills[1] },
    ],
    auditLogs: [
      {
        id: 1,
        submission_id: 2,
        changed_by: 2,
        action: 'reviewed',
        old_status: 'pending',
        new_status: 'accepted',
        old_score: null,
        new_score: 90,
        notes: 'عمل ممتاز! الكود نظيف جداً والـ API docs احترافية. ⭐',
        changedBy: {
          id: 2,
          name: '90Soft Admin',
          email: 'admin@90soft.com',
          role: 'admin',
          avatar: null,
          batch_id: null,
          created_at: '2026-01-01T00:00:00Z',
        },
        created_at: '2026-06-22T14:30:00Z',
      },
      {
        id: 2,
        submission_id: 2,
        changed_by: 1,
        action: 'submitted',
        old_status: null,
        new_status: 'pending',
        old_score: null,
        new_score: null,
        notes: null,
        changedBy: mockCurrentUser,
        created_at: '2026-06-20T16:45:00Z',
      },
    ],
    created_at: '2026-06-20T16:45:00Z',
  },
  {
    id: 3,
    task_id: 4,
    hackathon_id: null,
    user_id: 1,
    team_id: null,
    github_url: 'https://github.com/ahmed-ali/rest-api-design',
    live_url: null,
    file_path: null,
    video_url: 'https://youtube.com/watch?v=ghi789',
    status: 'accepted',
    score: 90,
    is_featured: true,
    is_reopened: false,
    notes: 'تصميم REST API كامل لنظام مدونات مع rate limiting.',
    task: mockTasks[3],
    user: mockCurrentUser,
    skillScores: [
      { id: 5, submission_id: 3, skill_id: 1, score: 9, skill: mockSkills[0] },
      { id: 6, submission_id: 3, skill_id: 2, score: 8.5, skill: mockSkills[1] },
    ],
    created_at: '2026-06-10T11:20:00Z',
  },
  {
    id: 4,
    task_id: 2,
    hackathon_id: null,
    user_id: 1,
    team_id: null,
    github_url: 'https://github.com/ahmed-ali/laravel-auth',
    live_url: null,
    file_path: null,
    video_url: null,
    status: 'pending',
    score: null,
    is_featured: false,
    is_reopened: false,
    notes: null,
    task: mockTasks[1],
    user: mockCurrentUser,
    skillScores: [],
    created_at: '2026-06-26T09:15:00Z',
  },
  {
    id: 5,
    hackathon_id: 3,
    task_id: null,
    user_id: null,
    team_id: 1,
    github_url: 'https://github.com/code-wizards/eduplatform',
    live_url: 'https://eduplatform.demo.com',
    file_path: null,
    video_url: 'https://youtube.com/watch?v=jkl012',
    status: 'accepted',
    score: 85,
    is_featured: false,
    is_reopened: false,
    notes: 'منصة تعليمية بميزات بحث، تسجيل، ولوحة تحكم للمعلم.',
    hackathon: mockHackathons[2],
    user: null,
    team: null,
    skillScores: [],
    created_at: '2026-06-15T22:00:00Z',
  },
]

export const mockTeams: Team[] = [
  {
    id: 1,
    name: 'Code Wizards',
    teamable_type: 'Hackathon',
    teamable_id: 1,
    batch_id: 1,
    teamMembers: [
      {
        id: 1,
        team_id: 1,
        user_id: 1,
        is_leader: true,
        user: mockCurrentUser,
      },
      {
        id: 2,
        team_id: 1,
        user_id: 3,
        is_leader: false,
        user: {
          id: 3,
          name: 'محمد سالم',
          email: 'mohammed@student.com',
          role: 'student',
          avatar: null,
          batch_id: 1,
          created_at: '2026-01-15T10:00:00Z',
        },
      },
      {
        id: 3,
        team_id: 1,
        user_id: 4,
        is_leader: false,
        user: {
          id: 4,
          name: 'سارة المطيري',
          email: 'sara@student.com',
          role: 'student',
          avatar: null,
          batch_id: 1,
          created_at: '2026-01-15T10:00:00Z',
        },
      },
    ],
    teamable: mockHackathons[0],
    created_at: '2026-07-08T09:00:00Z',
  },
  {
    id: 2,
    name: 'Byte Busters',
    teamable_type: 'Hackathon',
    teamable_id: 2,
    batch_id: 1,
    teamMembers: [
      {
        id: 4,
        team_id: 2,
        user_id: 5,
        is_leader: true,
        user: {
          id: 5,
          name: 'فهد الزهراني',
          email: 'fahad@student.com',
          role: 'student',
          avatar: null,
          batch_id: 1,
          created_at: '2026-01-15T10:00:00Z',
        },
      },
      {
        id: 5,
        team_id: 2,
        user_id: 6,
        is_leader: false,
        user: {
          id: 6,
          name: 'خالد العتيبي',
          email: 'khaled@student.com',
          role: 'student',
          avatar: null,
          batch_id: 1,
          created_at: '2026-01-15T10:00:00Z',
        },
      },
      {
        id: 6,
        team_id: 2,
        user_id: 1,
        is_leader: false,
        user: mockCurrentUser,
      },
      {
        id: 7,
        team_id: 2,
        user_id: 7,
        is_leader: false,
        user: {
          id: 7,
          name: 'ليلى الشمري',
          email: 'layla@student.com',
          role: 'student',
          avatar: null,
          batch_id: 1,
          created_at: '2026-01-15T10:00:00Z',
        },
      },
    ],
    teamable: mockHackathons[1],
    created_at: '2026-07-09T15:00:00Z',
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
    batch_id: data.batch_id ?? 1,
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
    task_id: data.task_id ?? null,
    hackathon_id: data.hackathon_id ?? null,
    user_id: mockCurrentUser.id,
    team_id: data.team_id ?? null,
    github_url: data.github_url ?? null,
    live_url: data.live_url ?? null,
    file_path: data.file_path ?? null,
    video_url: data.video_url ?? null,
    status: 'pending',
    score: null,
    is_featured: false,
    is_reopened: false,
    notes: data.notes ?? null,
    task: mockTasks.find((t) => t.id === data.task_id) ?? null,
    hackathon: mockHackathons.find((h) => h.id === data.hackathon_id) ?? null,
    user: mockCurrentUser,
    skillScores: [],
    created_at: new Date().toISOString(),
  }
  mockSubmissions.unshift(newSub)
  return newSub
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

export async function mockCreateTeam(data: { name: string; teamable_id: number; teamable_type: string }) {
  if (!USE_MOCK) {
    // Laravel expects 'task' or 'hackathon' (lowercase)
    const teamableType = data.teamable_type.toLowerCase() === 'hackathon' ? 'hackathon' : 'task'
    return apiServices.createTeamApi({
      name: data.name,
      teamable_id: data.teamable_id,
      teamable_type: teamableType as 'task' | 'hackathon',
    })
  }
  await sleep(700)
  const newTeam: Team = {
    id: mockTeams.length + 1,
    name: data.name,
    teamable_type: data.teamable_type,
    teamable_id: data.teamable_id,
    batch_id: 1,
    teamMembers: [
      {
        id: Date.now(),
        team_id: mockTeams.length + 1,
        user_id: mockCurrentUser.id,
        is_leader: true,
        user: mockCurrentUser,
      },
    ],
    teamable: data.teamable_type === 'Hackathon'
      ? mockHackathons.find((h) => h.id === data.teamable_id)
      : mockTasks.find((t) => t.id === data.teamable_id),
    created_at: new Date().toISOString(),
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
