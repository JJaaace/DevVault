import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import './App.css'
import { Layout } from './components/Layout'
import { WorkspaceNavigation } from './components/WorkspaceNavigation'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { PortfolioPage } from './pages/PortfolioPage'
import { EditProfilePage } from './pages/EditProfilePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectFormPage } from './pages/ProjectFormPage'
import { SkillsPage } from './pages/SkillsPage'
import { CertificationsPage } from './pages/CertificationsPage'
import { GoalsPage } from './pages/GoalsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ResumePage } from './pages/ResumePage'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Layout>
      <header className="sticky top-0 z-30 px-4 pt-4">
        <div className="nav-shell nav-shell--workspace mx-auto max-w-6xl gap-4">
          <div className="nav-brand">
            <div className="nav-brand-mark text-sm font-semibold">DV</div>
            <div>
              <p className="nav-kicker">DevVault</p>
              <h1 className="nav-title">Workspace</h1>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <SignedIn>
              <WorkspaceNavigation />
              <div className="rounded-full border border-[rgba(126,89,45,0.14)] bg-white/70 p-1 shadow-sm">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <Link to="/login" className="button-secondary px-4 py-2 text-sm">
                Sign in
              </Link>
              <Link to="/signup" className="button-primary px-4 py-2 text-sm">
                Sign up
              </Link>
            </SignedOut>
          </div>
        </div>
      </header>

      <main className="page-shell page-shell--wide page-stack pb-14 pt-6 md:pt-8">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/login" replace />
                </SignedOut>
              </>
            }
          />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/portfolio/:username" element={<PortfolioPage />} />
          <Route path="/resume/:username" element={<ResumePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <ProjectFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/edit"
            element={
              <ProtectedRoute>
                <ProjectFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <ProtectedRoute>
                <SkillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certifications"
            element={
              <ProtectedRoute>
                <CertificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <GoalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </Layout>
  )
}

export default App
