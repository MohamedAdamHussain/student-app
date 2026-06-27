# GradShow — Student App

تطبيق طالب منصة GradShow، مبني بـ React 19 + Vite + TypeScript. يقدم تجربة احترافية وإبداعية للطالب لإدارة ملفه الشخصي، المهام، الهاكاثونات، التقديمات، والفرق.

## ✨ الميزات الرئيسية

### 🎨 تجربة بصرية احترافية
- **Design System كامل** مبني على Tailwind CSS مع tokens مخصصة
- **Dark Mode** كامل (Light/Dark) مع حفظ التفضيل
- **RTL عربي** كامل بخط Tajawal
- **Animations** عبر Framer Motion (page transitions, micro-interactions)
- **Skeleton loaders** أثناء تحميل البيانات
- **Toast notifications** عبر Sonner
- **Empty states** أنيقة لكل الصفحات

### ⚡ ميزات إبداعية
- **Command Palette (Cmd+K)** للتنقل السريع بين كل الصفحات
- **Animated counters** في الـ StatCards (تُحسب من 0 إلى القيمة)
- **Page transitions** سلسة عند التنقل
- **Mobile Nav** كامل مع animations
- **Audit Log** timeline في صفحة تفاصيل التقديم
- **Profile completion indicator** يحسب نسبة إكمال الملف

### 🔌 جاهز للربط مع Laravel
- **Axios + interceptors** لإرفاق Sanctum token تلقائياً
- **Smart Facade** يُبدّل بين Mock Data و Laravel API تلقائياً
- **Type-safe** بالكامل (TypeScript strict mode)
- **TanStack Query** لإدارة الـ server state + caching
- **Pagination support** (Laravel paginate shape handled)

## 🛠️ Tech Stack

| الفئة | المكتبة |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 8 |
| Language | TypeScript 6 |
| Routing | React Router v7 |
| Server State | TanStack Query v5 |
| Styling | Tailwind CSS 3 + custom tokens |
| Animations | Framer Motion |
| Icons | lucide-react |
| HTTP Client | Axios + interceptors |
| Toasts | Sonner |
| Utilities | clsx, tailwind-merge, class-variance-authority |

## 📂 بنية المشروع

```
student-app/
├── src/
│   ├── components/
│   │   ├── ui/              # Button, Card, Badge, Input, Avatar, Progress, Skeleton, EmptyState, Logo
│   │   ├── layout/          # AppShell, Sidebar, Topbar, CommandPalette, MobileNav
│   │   └── common/          # PageHeader, StatCard
│   ├── context/
│   │   ├── AuthContext.tsx  # Auth state + Sanctum token management
│   │   └── ThemeContext.tsx # Light/Dark theme
│   ├── lib/
│   │   ├── api.ts           # Axios instance + interceptors + pagination helper
│   │   ├── mockData.ts      # Smart facade: mock أو real API تلقائياً
│   │   ├── queryClient.ts   # TanStack Query setup + keys
│   │   └── utils.ts         # cn, formatDate, gradientFor, ...
│   ├── services/
│   │   └── index.ts         # ✨ Real API calls (Laravel endpoints)
│   ├── pages/
│   │   ├── auth/            # LoginPage, RegisterPage
│   │   ├── DashboardPage.tsx
│   │   ├── profile/         # ProfilePage, ProfileEditPage
│   │   ├── tasks/           # TasksListPage, TaskDetailsPage
│   │   ├── hackathons/      # HackathonsListPage, HackathonDetailsPage
│   │   ├── submissions/     # SubmissionsListPage, SubmissionNewPage, SubmissionDetailsPage
│   │   └── teams/           # TeamsListPage, TeamDetailsPage
│   ├── types/               # TypeScript domain types (matching Laravel)
│   ├── App.tsx              # Routes + Protected/Public routing
│   ├── main.tsx
│   └── index.css            # Tailwind + custom design tokens
├── .env.example             # ✨ متغيرات البيئة
├── tailwind.config.js       # Custom theme (colors, animations, shadows)
├── tsconfig.app.json        # Path alias @/* → ./src/*
└── vite.config.ts           # @ alias + server config
```

## 🚀 التشغيل

### 1. تثبيت الـ dependencies

```bash
npm install
```

### 2. إعداد متغيرات البيئة

```bash
cp .env.example .env
```

عدّل ملف `.env` حسب احتياجك:

```env
# رابط Laravel API
VITE_API_URL=http://localhost:8000/api

# true  = استخدم بيانات وهمية (للتطوير بدون Laravel)
# false = استخدم Laravel API الحقيقي
VITE_USE_MOCK=false
```

### 3. التشغيل

```bash
# بيئة التطوير
npm run dev

# بناء للإنتاج
npm run build

# معاينة نسخة الإنتاج
npm run preview
```

افتح المتصفح على: **http://localhost:5173**

## 🔌 الربط مع Laravel Backend

### الطريقة 1: استخدام Laravel API الحقيقي (الموصى به)

1. **في Laravel**: طبّق الـ patches الموجودة في `laravel-patches/` (مجلد منفصل)
2. **شغّل Laravel**:
   ```bash
   php artisan serve  # يعمل على http://localhost:8000
   ```
3. **في React**: تأكد أن `.env` يحتوي:
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_USE_MOCK=false
   ```
4. **اختبر**: سجّل دخول بأي حساب من Laravel database

### الطريقة 2: استخدام Mock Data (للتطوير السريع بدون Laravel)

1. **في React**: تأكد أن `.env` يحتوي:
   ```env
   VITE_USE_MOCK=true
   ```
2. **اختبر**: سجّل دخول بأي بيانات (مثل `ahmed.ali@student.com` / `password123`)

### كيف يعمل الـ Smart Facade؟

ملف `src/lib/mockData.ts` يعمل كـ "واجهة" ذكية:

```typescript
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function mockGetTasks() {
  if (!USE_MOCK) {
    return apiServices.getTasksApi()  // استدعاء Laravel الحقيقي
  }
  // وإلا استخدم البيانات الوهمية
  await sleep(400)
  return mockTasks
}
```

**الميزة**: الصفحات لا تتغير إطلاقاً — فقط غيّر قيمة `VITE_USE_MOCK` في `.env` وكل شيء يعمل تلقائياً.

## 📋 الـ API Endpoints المتصلة

| React Page | Laravel Endpoint | الحالة |
|---|---|---|
| LoginPage | `POST /auth/login` | ✅ |
| RegisterPage | `POST /auth/register` | ✅ |
| DashboardPage | `GET /dashboard/stats` | ✅ |
| ProfilePage | `GET /student/profile` | ✅ |
| ProfileEditPage | `PUT /student/profile` (مع FormData للـ CV) | ✅ |
| TasksListPage | `GET /tasks` | ✅ |
| TaskDetailsPage | `GET /tasks/{id}` | ✅ |
| HackathonsListPage | `GET /hackathons` | ✅ |
| HackathonDetailsPage | `GET /hackathons/{id}` | ✅ |
| SubmissionsListPage | `GET /submissions` | ✅ |
| SubmissionNewPage | `POST /submissions` (مع FormData للملفات) | ✅ |
| SubmissionDetailsPage | `GET /submissions/{id}` | ✅ |
| TeamsListPage | `GET /my-teams` | ✅ |
| TeamDetailsPage | `GET /teams/{id}` | ✅ |
| TeamsListPage (Modal) | `POST /teams` | ✅ |

## 🔑 بيانات الدخول

### عند استخدام Mock Data
```
Email:    ahmed.ali@student.com
Password: password123 (أي password يعمل)
```

### عند استخدام Laravel API
استخدم أي حساب موجود في قاعدة بيانات Laravel. الـ AdminSeeder يُنشئ:
```
Email:    admin@90soft.com
Password: password123
```

## 🎯 ميزات الصيانة

### إضافة endpoint جديد

1. **أضف الدالة في `src/services/index.ts`**:
   ```typescript
   export async function getSomethingApi(id: number): Promise<Something> {
     const { data } = await api.get<Something>(`/something/${id}`)
     return data
   }
   ```

2. **أضف facade logic في `src/lib/mockData.ts`** (اختياري):
   ```typescript
   export async function mockGetSomething(id: number) {
     if (!USE_MOCK) return apiServices.getSomethingApi(id)
     // mock logic...
   }
   ```

3. **استخدم في الصفحة**:
   ```typescript
   const { data } = useQuery({
     queryKey: ['something', id],
     queryFn: () => mockGetSomething(id),
   })
   ```

### معالجة الـ Pagination

Laravel يرجع pagination بشكل `{data: [], meta: {...}, links: {...}}`. الدالة المساعدة `extractPaginatedData` تستخرج `.data` فقط:

```typescript
import { extractPaginatedData } from '@/lib/api'

export async function getTasksApi() {
  const { data } = await api.get('/tasks')
  return extractPaginatedData<Task>(data)
}
```

## 🎨 الـ Design System

نفس الـ design tokens المستخدمة في HTML prototype:

| Token | Value |
|---|---|
| Primary (brand) | `#4F46E5` Indigo |
| Background | `#F8FAFC` Slate-50 |
| Surface | `#FFFFFF` White |
| Border | `#E2E8F0` Slate-200 |
| Success | `#10B981` Emerald |
| Warning | `#F59E0B` Amber |
| Danger | `#EF4444` Red |
| Info | `#3B82F6` Blue |

## 📱 Responsive

- **Mobile** (< 768px): Sidebar يتحول لـ drawer مع زر menu، Grids تصبح عمودية
- **Tablet** (768-1024px): Sidebar ظاهر، Grids متعددة الأعمدة
- **Desktop** (> 1024px): تخطيط كامل بكل الميزات

## 🐛 استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| `CORS error` في المتصفح | تأكد من `config/cors.php` في Laravel يسمح بـ `localhost:5173` |
| `401 Unauthorized` | تأكد أن `VITE_USE_MOCK=false` وأن Laravel يعمل |
| `Network Error` | تحقق أن `VITE_API_URL` صحيح وLaravel يعمل |
| `Class not found` في Laravel | شغّل `composer dump-autoload` بعد تطبيق الـ patches |
| البيانات لا تُحدّث بعد التعديل | TanStack Query يحتاج `invalidateQueries` (موجود في الـ mutations) |

## 📦 Build & Deploy

```bash
# بناء للإنتاج
npm run build

# معاينة محلية للبناء
npm run preview
```

الناتج في `dist/` جاهز للنشر على أي static host (Vercel, Netlify, Nginx, ...).

للنشر على sub-path (مثل `/app/`), عدّل `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/app/',
  // ...
})
```
