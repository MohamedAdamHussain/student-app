import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { ProfileEditPage } from '@/pages/profile/ProfileEditPage'
import { TasksListPage } from '@/pages/tasks/TasksListPage'
import { TaskDetailsPage } from '@/pages/tasks/TaskDetailsPage'
import { HackathonsListPage } from '@/pages/hackathons/HackathonsListPage'
import { HackathonDetailsPage } from '@/pages/hackathons/HackathonDetailsPage'
import { SubmissionsListPage } from '@/pages/submissions/SubmissionsListPage'
import { SubmissionNewPage } from '@/pages/submissions/SubmissionNewPage'
import { SubmissionDetailsPage } from '@/pages/submissions/SubmissionDetailsPage'
import { SubmissionEditPage } from '@/pages/submissions/SubmissionEditPage'
import { TeamsListPage } from '@/pages/teams/TeamsListPage'
import { TeamDetailsPage } from '@/pages/teams/TeamDetailsPage'
import { FeatureProposalBuilderPage } from '@/pages/proposals/FeatureProposalBuilderPage'
import { FeatureProposalDetailsPage } from '@/pages/proposals/FeatureProposalDetailsPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { getPageTitle } from '@/components/layout/AppShell'
import type { JSX } from 'react'
import type { UserRole } from '@/types'

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
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return null

  // ✨ توجيه ذكي حسب الدور بعد login
  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AppRoutes() {
  const location = useLocation()
  document.title = `${getPageTitle(location.pathname)} · GradShow`

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* ✨ كل صفحات الطالب محمية بـ role:student */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['student']}><ProfilePage /></ProtectedRoute>
      } />
      <Route path="/profile/edit" element={
        <ProtectedRoute allowedRoles={['student']}><ProfileEditPage /></ProtectedRoute>
      } />

      <Route path="/tasks" element={
        <ProtectedRoute allowedRoles={['student']}><TasksListPage /></ProtectedRoute>
      } />
      <Route path="/tasks/:id" element={
        <ProtectedRoute allowedRoles={['student']}><TaskDetailsPage /></ProtectedRoute>
      } />

      <Route path="/hackathons" element={
        <ProtectedRoute allowedRoles={['student']}><HackathonsListPage /></ProtectedRoute>
      } />
      <Route path="/hackathons/:id" element={
        <ProtectedRoute allowedRoles={['student']}><HackathonDetailsPage /></ProtectedRoute>
      } />

      <Route path="/submissions" element={
        <ProtectedRoute allowedRoles={['student']}><SubmissionsListPage /></ProtectedRoute>
      } />
      <Route path="/submissions/new" element={
        <ProtectedRoute allowedRoles={['student']}><SubmissionNewPage /></ProtectedRoute>
      } />
      <Route path="/submissions/:id" element={
        <ProtectedRoute allowedRoles={['student']}><SubmissionDetailsPage /></ProtectedRoute>
      } />
      <Route path="/submissions/:id/edit" element={
        <ProtectedRoute allowedRoles={['student']}><SubmissionEditPage /></ProtectedRoute>
      } />

      <Route path="/teams" element={
        <ProtectedRoute allowedRoles={['student']}><TeamsListPage /></ProtectedRoute>
      } />
      <Route path="/teams/:id" element={
        <ProtectedRoute allowedRoles={['student']}><TeamDetailsPage /></ProtectedRoute>
      } />

      <Route path="/hackathons/:id/propose" element={
        <ProtectedRoute allowedRoles={['student']}><FeatureProposalBuilderPage /></ProtectedRoute>
      } />
      <Route path="/proposals/:id" element={
        <ProtectedRoute allowedRoles={['student']}><FeatureProposalDetailsPage /></ProtectedRoute>
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
            <AppRoutes />
            <Toaster
              position="top-center"
              dir="rtl"
              toastOptions={{
                style: {
                  fontFamily: 'Tajawal, Inter, sans-serif',
                  direction: 'rtl',
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
