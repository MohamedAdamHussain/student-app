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
import { TeamsListPage } from '@/pages/teams/TeamsListPage'
import { TeamDetailsPage } from '@/pages/teams/TeamDetailsPage'
import { getPageTitle } from '@/components/layout/AppShell'
import type { JSX } from 'react'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth()
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

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function PublicRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return children
}

function AppRoutes() {
  const location = useLocation()
  // Set document title based on route
  document.title = `${getPageTitle(location.pathname)} · GradShow`

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />

      <Route path="/tasks" element={<ProtectedRoute><TasksListPage /></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetailsPage /></ProtectedRoute>} />

      <Route path="/hackathons" element={<ProtectedRoute><HackathonsListPage /></ProtectedRoute>} />
      <Route path="/hackathons/:id" element={<ProtectedRoute><HackathonDetailsPage /></ProtectedRoute>} />

      <Route path="/submissions" element={<ProtectedRoute><SubmissionsListPage /></ProtectedRoute>} />
      <Route path="/submissions/new" element={<ProtectedRoute><SubmissionNewPage /></ProtectedRoute>} />
      <Route path="/submissions/:id" element={<ProtectedRoute><SubmissionDetailsPage /></ProtectedRoute>} />

      <Route path="/teams" element={<ProtectedRoute><TeamsListPage /></ProtectedRoute>} />
      <Route path="/teams/:id" element={<ProtectedRoute><TeamDetailsPage /></ProtectedRoute>} />

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
