import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Suspense, lazy, type JSX } from 'react'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { getPageTitle } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ConfirmProvider } from '@/components/common/ConfirmDialog'
import type { UserRole } from '@/types'

// =====================================================
// ✨ P0-D PATCH: Code splitting عبر React.lazy
// =====================================================
// قبل: كل الصفحات (18+) تُحمّل في الـ bundle الإنتاجي. الحجم: ~800KB+
// بعد: كل صفحة في chunk منفصل، يُحمّل عند الزيارة فقط. الـ bundle الأولي
// يقل بـ 60-70% (المستخدم يرى login page أسرع بكثير).
//
// الصفحات العامة (login/register/forgot/reset/verify) تبقى eager لأنها
// صغيرة وزوارها جدد. الباقي lazy.

// --- Public pages (eager — صغيرة وزوارها جدد) ---
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'

// --- Protected pages (lazy — تُحمّل عند الزيارة) ---
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const ProfileEditPage = lazy(() =>
  import('@/pages/profile/ProfileEditPage').then((m) => ({ default: m.ProfileEditPage })),
)
const TasksListPage = lazy(() =>
  import('@/pages/tasks/TasksListPage').then((m) => ({ default: m.TasksListPage })),
)
const TaskDetailsPage = lazy(() =>
  import('@/pages/tasks/TaskDetailsPage').then((m) => ({ default: m.TaskDetailsPage })),
)
const HackathonsListPage = lazy(() =>
  import('@/pages/hackathons/HackathonsListPage').then((m) => ({ default: m.HackathonsListPage })),
)
const HackathonDetailsPage = lazy(() =>
  import('@/pages/hackathons/HackathonDetailsPage').then((m) => ({ default: m.HackathonDetailsPage })),
)
const SubmissionsListPage = lazy(() =>
  import('@/pages/submissions/SubmissionsListPage').then((m) => ({ default: m.SubmissionsListPage })),
)
const SubmissionNewPage = lazy(() =>
  import('@/pages/submissions/SubmissionNewPage').then((m) => ({ default: m.SubmissionNewPage })),
)
const SubmissionDetailsPage = lazy(() =>
  import('@/pages/submissions/SubmissionDetailsPage').then((m) => ({ default: m.SubmissionDetailsPage })),
)
const SubmissionEditPage = lazy(() =>
  import('@/pages/submissions/SubmissionEditPage').then((m) => ({ default: m.SubmissionEditPage })),
)
const TeamsListPage = lazy(() =>
  import('@/pages/teams/TeamsListPage').then((m) => ({ default: m.TeamsListPage })),
)
const TeamDetailsPage = lazy(() =>
  import('@/pages/teams/TeamDetailsPage').then((m) => ({ default: m.TeamDetailsPage })),
)
const FeatureProposalBuilderPage = lazy(() =>
  import('@/pages/proposals/FeatureProposalBuilderPage').then((m) => ({ default: m.FeatureProposalBuilderPage })),
)
const FeatureProposalDetailsPage = lazy(() =>
  import('@/pages/proposals/FeatureProposalDetailsPage').then((m) => ({ default: m.FeatureProposalDetailsPage })),
)
const FeatureProposalEditPage = lazy(() =>
  import('@/pages/proposals/FeatureProposalEditPage').then((m) => ({ default: m.FeatureProposalEditPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)

// =====================================================
// ✨ Role-based Route Protection
// =====================================================

interface ProtectedRouteProps {
  children: JSX.Element
  allowedRoles?: UserRole[]
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-400">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  // غير مسجل دخول → صفحة login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ✨ مسجل دخول لكن ليس الدور المطلوب → صفحة "غير مصرح"
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <UnauthorizedPage requiredRole={allowedRoles[0]} />
  }

  return children
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ✨ Suspense fallback موحّد لكل الصفحات lazy
function PageLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-ink-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ink-400">جاري تحميل الصفحة...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  document.title = `${getPageTitle(location.pathname)} · GradShow`

  // ✨ P2: ErrorBoundary لكل صفحة على حدة — لو تعطلت صفحة، لا تسقط التطبيق كله
  const withBoundary = (element: JSX.Element) => (
    <ErrorBoundary key={location.pathname}>{element}</ErrorBoundary>
  )

  return (
    <Routes>
      {/* --- Public --- */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* --- Protected (student only, lazy + Suspense + ErrorBoundary) --- */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<DashboardPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<ProfilePage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/profile/edit" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<ProfileEditPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<TasksListPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/tasks/:id" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<TaskDetailsPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/hackathons" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<HackathonsListPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/hackathons/:id" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<HackathonDetailsPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/submissions" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<SubmissionsListPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/submissions/new" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<SubmissionNewPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/submissions/:id" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<SubmissionDetailsPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/submissions/:id/edit" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<SubmissionEditPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/teams" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<TeamsListPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/teams/:id" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<TeamDetailsPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/hackathons/:id/propose" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<FeatureProposalBuilderPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/proposals/:id" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<FeatureProposalDetailsPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/proposals/:id/edit" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<FeatureProposalEditPage />)}
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Suspense fallback={<PageLoader />}>
            {withBoundary(<SettingsPage />)}
          </Suspense>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ConfirmProvider>
              {/* ✨ ErrorBoundary outer — يلتقط أخطاء الـ providers نفسها */}
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
              <Toaster
                position="top-center"
                dir="rtl"
                richColors
                toastOptions={{
                  style: {
                    fontFamily: 'Tajawal, Inter, sans-serif',
                    direction: 'rtl',
                  },
                }}
              />
            </ConfirmProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
