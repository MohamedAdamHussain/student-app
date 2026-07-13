# GradShow API Contract

> **الغرض:** مرجع واحد لربط الـ frontend (React + TS) بالـ backend. يصف كل الـ endpoints، الأدوار المطلوبة، وحقول كل استجابة.
>
> **آخر تحديث:** المرحلة 6 (بعد B4/B6 + الدفعات أ/ب). يعكس حالة `routes/api.php` و`app/Http/Resources/*` المُلتزمة.

---

## 1. القواعد العامة

### Base URL
```
https://<api-domain>/api
```
الـ frontend على دومين/ساب دومين منفصل. جميع المسارات أدناه نسبةً إلى `/api`.

### المصادقة (Auth)
- **Scheme:** `Authorization: Bearer <token>` (Sanctum).
- التوكين يُعاد في `register`/`login` كـ `token` (string).
- كل المسارات محمية بـ `auth:sanctum` إلا ما ذُكر أنه "عام".

### الـ Roles
| القيمة | الوصف |
|------|------|
| `student` | طالب |
| `company` | شركة |
| `admin` | مسؤول |

### الـ Pagination
القوائم (20/صفحة) ترجع بصيغة Laravel:
```json
{ "data": [...], "links": {...}, "meta": {...} }
```
بعض القوائم ترجع مصفوفة خاماً (مثل `proposals` — محدودة العدد).

### الأدوار المتوقعة من الـ HTTP
| الحالة | المعنى |
|------|------|
| `200` | نجاح |
| `201` | إنشاء |
| `204` | حذف (لا body) |
| `401` | غير مصادَق |
| `403` | ممنوع (دور/ملكية) |
| `404` | غير موجود |
| `422` | خطأ تحقق / منطق أعمال |
| `429` | تجاوز rate limit |

### Rate Limiting
- **قراءة عامة:** 120/دقيقة لكل مستخدم (أو IP للمجهول).
- **كتابة حسّاسة:** submissions 10/د، teams 15/د، proposals 10/د.
- **auth:** login 5/د، register 3/د، forgot-password 3/د.

---

## 2. المسارات حسب المجموعة

### 2.1 Auth (عام + مصادَق)

| Method | Path | الدور | الشرح |
|--------|------|------|------|
| POST | `/auth/register` | عام | تسجيل. يرجع `{user, token}`. throttle 3/د |
| POST | `/auth/login` | عام | `{email, password}` → `{user, token}`. throttle 5/د |
| POST | `/auth/forgot-password` | عام | `{email}` — يرسل رابط إعادة التعيين. throttle 3/د |
| POST | `/auth/reset-password` | عام | `{token, email, password, password_confirmation}`. throttle 5/د |
| POST | `/auth/verify-email` | عام | `{token, email}` — تحقق البريد. throttle 5/د |
| POST | `/auth/resend-verification` | عام | `{email}` — إعادة إرسال رابط التحقق. throttle 3/د |
| GET | `/auth/me` | مصادَق | المستخدم الحالي |
| POST | `/auth/logout` | مصادَق | يُبطل التوكين الحالي |
| PUT | `/auth/password` | مصادَق | `{current_password, password, password_confirmation}`. throttle 5/د |

> **سياسة البريد (B6):** تذكيرية — المستخدم غير المُتحقَّق لا يُحجب، يُشجَّع فقط. الحقل `email_verified_at` في `UserResource` يحدد الحالة (null = غير مُتحقَّق).

### 2.2 Reference Data (مصادَق، أي دور)

| Method | Path | الدور | الشرح |
|--------|------|------|------|
| GET | `/skills` | أي | قائمة المهارات |
| GET | `/tracks` | أي | قائمة المسارات |
| GET | `/batches` | أي | قائمة الدفعات |
| GET | `/tasks` | أي | قائمة المهام (مفلترة بالدفعة للطالب) |
| GET | `/tasks/{task}` | أي | تفاصيل مهمة |
| GET | `/hackathons` | أي | قائمة الهاكاثونات |
| GET | `/hackathons/{hackathon}` | أي | تفاصيل هاكاثون |
| GET | `/hackathons/{hackathon}/proposals` | أي | اقتراحات الهاكاثون (مع قيود حسب الدور) |
| GET | `/proposals/{proposal}` | أي | تفاصيل اقتراح |

### 2.3 Student (مصادَق + student)

| Method | Path | الشرح |
|--------|------|------|
| GET | `/dashboard/stats` | إحصائيات لوحة الطالب |
| GET | `/student/profile` | الملف الشخصي |
| PUT | `/student/profile` | تحديث (`bio, tagline, github_url, linkedin_url, portfolio_url, tracks[]`) |
| POST | `/student/profile/avatar` | رفع صورة (`avatar` multipart) |
| DELETE | `/student/profile/avatar` | حذف الصورة |
| DELETE | `/student/profile/cv` | حذف CV |
| GET | `/submissions` | تقديماتي فقط |
| POST | `/submissions` | إنشاء (throttle 10/د) |
| GET | `/submissions/{submission}` | عرض (ملكيتي فقط) |
| PUT | `/submissions/{submission}` | تعديل (فقط pending) (throttle 10/د) |
| DELETE | `/submissions/{submission}` | حذف |
| GET | `/submissions/{submission}/audit-log` | سجل تدقيقي (ملكيتي) |
| POST | `/teams` | إنشاء فريق (throttle 15/د) |
| GET | `/teams/{team}` | عرض (يجب أن تكون عضواً أو أدمن) |
| POST | `/teams/{team}/members` | إضافة عضو (throttle 15/د) |
| DELETE | `/teams/{team}/members/{user}` | إزالة عضو |
| GET | `/my-teams` | فرقي |
| GET | `/my-proposals` | اقتراحاتي |
| POST | `/hackathons/{hackathon}/proposals` | إنشاء اقتراح (throttle 10/د، max 3/هاكاثون، فحص deadline) |
| PUT | `/proposals/{proposal}` | تعديل (فقط إن editable) |
| DELETE | `/proposals/{proposal}` | حذف (فقط pending) |

### 2.4 Company (مصادَق + company,admin)

| Method | Path | الشرح |
|--------|------|------|
| GET | `/company/students` | قائمة الطلاب (فilter `track_id`, `batch_id`, `page`) |
| GET | `/company/students/{studentProfile}` | تفاصيل طالب (accepted submissions فقط) |
| GET | `/company/students/{studentId}/proposals` | اقتراحات طالب مقبولة |
| GET | `/company/hackathons` | هاكاثونات |
| GET | `/company/showcase` | تقديمات مميزة |
| GET | `/company/leaderboard` | لوحة المتصدّرين |
| GET | `/company/dashboard/stats` | إحصائيات الشركة |
| GET | `/company/profile` | ملف الشركة (B1) |
| PUT | `/company/profile` | تحديث ملف الشركة (`company_name, website`) (B1) |
| POST | `/company/profile/logo` | رفع شعار (B1) |
| DELETE | `/company/profile/logo` | حذف شعار (B1) |

### 2.5 Admin (مصادَق + admin)

| Method | Path | الشرح |
|--------|------|------|
| GET | `/admin/dashboard/stats` | إحصائيات شاملة |
| GET | `/admin/students` | قائمة الطلاب (`search`, `page`) |
| GET | `/admin/submissions` | كل التقديمات (`status`, `page`) |
| GET | `/admin/submissions/{submission}` | تفاصيل تقديم واحد (B5) |
| GET | `/admin/proposals` | كل الاقتراحات (`status`, `page`) |
| GET | `/admin/recent-activity` | آخر النشاطات |
| POST | `/admin/proposals/{proposal}/review` | مراجعة اقتراح |
| POST | `/submissions/{submission}/review` | مراجعة تقديم (store) |
| PUT | `/submissions/{submission}/review` | تعديل مراجعة (requires reopen) |
| POST | `/submissions/{submission}/reopen` | إعادة فتح للتقييم |
| GET | `/batches/{batch}` | عرض دفعة |
| POST | `/batches` | إنشاء دفعة |
| PUT | `/batches/{batch}` | تحديث |
| DELETE | `/batches/{batch}` | حذف (لا يمكن إن فيها مستخدمين) |
| POST | `/tasks` | إنشاء مهمة (`skills[]`, `tracks[]` pivots) |
| PUT | `/tasks/{task}` | تحديث |
| DELETE | `/tasks/{task}` | حذف |
| POST | `/hackathons` | إنشاء |
| PUT | `/hackathons/{hackathon}` | تحديث |
| DELETE | `/hackathons/{hackathon}` | حذف |
| POST | `/skills` | إنشاء مهارة (الدفعة ب) |
| PUT | `/skills/{skill}` | تحديث |
| DELETE | `/skills/{skill}` | حذف |
| POST | `/tracks` | إنشاء مسار (الدفعة ب) |
| PUT | `/tracks/{track}` | تحديث |
| DELETE | `/tracks/{track}` | حذف |
| GET | `/admin/users` | قائمة المستخدمين (B4) |
| GET | `/admin/users/{user}` | تفاصيل مستخدم (B4) |
| PATCH | `/admin/users/{user}/toggle-active` | تعطيل/تفعيل (يُبطل tokens فوراً) (B4) |
| PATCH | `/admin/users/{user}/batch` | نقل طالب لدفعة (`batch_id`) (B4) |
| DELETE | `/admin/users/{user}` | حذف مستخدم (B4) |

### 2.6 عام (مصادَق)

| Method | Path | الشرح |
|--------|------|------|
| GET | `/user` | المستخدم الحالي (خام، بدون Resource) |

---

## 3. Schemas (Resources)

> كل المواقيت بصيغة ISO 8601. العلاقات تظهر فقط عند `whenLoaded` (الـ backend يُحمّلها حسب الـ endpoint).

### UserResource
```ts
{
  id: number
  name: string
  email: string
  role: "student" | "company" | "admin"
  avatar: string | null
  batch_id: number | null
  email_verified_at: string | null   // B6 — null = غير مُتحقَّق
  created_at: string
  student_profile?: StudentProfileResource  // whenLoaded
  company_profile?: CompanyProfileResource  // whenLoaded
  batch?: BatchResource                     // whenLoaded
}
```

### StudentProfileResource
```ts
{
  id: number
  user_id: number
  name?: string          // whenLoaded('user')
  avatar?: string       // whenLoaded('user')
  bio: string | null
  tagline: string | null
  github_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  cv_path: string | null
  cv_url: string | null     // Storage::url(cv_path)
  featured_project_id: number | null
  tracks: TrackResource[]
  featured_project?: SubmissionResource
  created_at: string
}
```

### CompanyProfileResource (B1)
```ts
{
  id: number
  user_id: number
  company_name: string
  website: string | null
  logo: string | null
  created_at: string
}
```

### BatchResource
```ts
{
  id: number
  name: string
  status: "active" | "completed"
  start_date: string
  end_date: string
  is_registration_open: boolean | null
  is_default_for_new_students: boolean | null
  users_count?: number       // whenLoaded
  tasks_count?: number
  hackathons_count?: number
  created_at: string
}
```

### TaskResource
```ts
{
  id: number
  title: string
  description: string | null
  type: "hw" | "final"
  is_team: boolean
  max_team_size: number | null
  video_required: boolean
  batch_id: number
  created_by: number | null    // nullable بعد nullOnDelete
  batch?: BatchResource
  skills: SkillResource[]
  tracks: TrackResource[]
  submissions_count?: number
  my_submission_status?: "pending" | "accepted" | "rejected" | null
  created_at: string
}
```

### HackathonResource
```ts
{
  id: number
  title: string
  description: string | null
  is_team: boolean
  max_team_size: number | null
  deadline: string            // ISO datetime
  batch_id: number
  created_by: number | null
  batch?: BatchResource
  feature_proposals_count?: number
  submissions_count?: number
  my_team?: TeamResource      // للطالب في الـ index
  my_rank?: number
  my_score?: number
  created_at: string
}
```

### SubmissionResource
```ts
{
  id: number
  task_id: number | null
  hackathon_id: number | null
  user_id: number
  team_id: number | null
  github_url: string | null
  live_url: string | null
  file_path: string | null
  file_url: string | null     // Storage::url(file_path)
  video_url: string | null
  status: "pending" | "accepted" | "rejected"
  score: number | null        // 0-10
  is_featured: boolean
  is_reopened: boolean
  notes: string | null
  task?: TaskResource
  hackathon?: HackathonResource
  user?: UserResource
  team?: TeamResource
  skill_scores: SkillScoreResource[]
  audit_logs: ScoreAuditLogResource[]
  created_at: string
  updated_at: string
}
```

### TeamResource
```ts
{
  id: number
  name: string
  teamable_type: "task" | "hackathon"   // morph map key
  teamable_id: number
  batch_id: number
  team_members: TeamMemberResource[]
  teamable: TaskResource | HackathonResource   // polymorphic
  created_at: string
}
```

### TeamMemberResource
```ts
{
  id: number
  team_id: number
  user_id: number
  is_leader: boolean
  user?: UserResource
  created_at: string
}
```

### FeatureProposalResource
```ts
{
  id: number
  hackathon_id: number
  user_id: number | null       // nullable بعد nullOnDelete
  team_id: number | null
  title: string
  problem_statement: string
  proposed_solution: string
  added_value: string
  github_url: string | null
  live_url: string | null
  video_url: string | null
  implementation_notes: string | null
  status: "pending" | "accepted_merged" | "accepted_showcase" | "needs_revision" | "rejected"
  admin_feedback: string | null
  impact_score: number | null     // 1-10
  innovation_score: number | null
  execution_score: number | null
  reviewed_by: number | null
  reviewed_at: string | null
  hackathon?: HackathonResource
  user?: UserResource
  team?: TeamResource
  reviewed_by_user?: UserResource
  created_at: string
  updated_at: string
}
```

### SkillResource
```ts
{ id: number, name: string, type: string, created_at: string }
```

### TrackResource
```ts
{ id: number, name: string, created_at: string }
```

### SkillScoreResource
```ts
{
  id: number
  submission_id: number
  skill_id: number
  score: number        // 1-10
  skill?: SkillResource
  created_at: string
}
```

### ScoreAuditLogResource
```ts
{
  id: number
  submission_id: number
  changed_by: number | null      // nullable بعد nullOnDelete
  changed_by_user?: UserResource
  action: "reviewed" | "reopened" | "score_updated" | "submitted"
  old_status: string | null
  new_status: string | null
  old_score: number | null
  new_score: number | null
  notes: string | null
  created_at: string
}
```

---

## 4. ملاحظات للـ frontend

### حقول جديدة قد تكسر أنواع TS الموجودة (مهمة عند refactoring)
- `UserResource.email_verified_at` (B6) — حقل جديد.
- `UserResource.role` — قد تحتاج `UserRole` union type.
- `BatchResource.is_registration_open` / `is_default_for_new_students` (B3).
- `CompanyProfileResource` — تأكد أنه مُستهلك في `company/profile` (B1).
- مسارات B4 الجديدة على `/admin/users/*` — يلزم إضافتها لـ layer الـ API للأدمن.

### ملاحظات سلوكية
- **`teamable_type`** يستخدم morph map key (`"task"`/`"hackathon"`) لا FQCN.
- **الدرجات** على مقياس 0-10 (tasks via skill_scores: 1-10).
- **`file_path`/`cv_path`** هي المسار الخام؛ `file_url`/`cv_url` هي URL جاهزة للاستخدام. استخدم الـ URL في الـ UI.
- **GET `/student/profile`** قد يكتب (auto-featured assignment) — لا تستخدمه في polling مكثّف.
- **`/submissions/{submission}/review`** PUT يتطلب `is_reopened=true` أولاً.
- **proposals** max 3 لكل طالب في كل هاكاثون؛ deadline يُفرَض على الإنشاء.

### ملاحظة على حالة git
- `AdminController.php` لديه تعديلات محلية غير ملتزمة (refactoring CacheService). الـ contract الخارجي (المسارات/الحقول) لم يتغيّر، لكن تحقّق من الإصدار النهائي قبل الاعتماد النهائي.
