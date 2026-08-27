import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from '@/hooks/useAuth'
import { ApplicationsProvider } from '@/hooks/useApplications'
import { Backdrop } from '@/components/ui'
import { Shell } from '@/components/Shell'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { Applications } from '@/pages/Applications'
import { ApplicationDetail } from '@/pages/ApplicationDetail'
import { ApplicationForm } from '@/pages/ApplicationForm'
import { Insights } from '@/pages/Insights'
import { Settings } from '@/pages/Settings'

export function App() {
  return (
    <AuthProvider>
      {/* Inside AuthProvider because it reads the session, and outside the
          routes because the socket must survive navigation. */}
      <ApplicationsProvider>
        {/* One ambient gradient field for the whole app, behind every route. */}
        <Backdrop />

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Shell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="applications" element={<Applications />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="new" element={<ApplicationForm />} />
            <Route path="applications/:id/edit" element={<ApplicationForm />} />
            <Route path="insights" element={<Insights />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ApplicationsProvider>
    </AuthProvider>
  )
}
