import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { lazy, Suspense } from 'react'
import './App.css'
import { Layout } from './components/Layout'
import { WorkspaceNavigation } from './components/WorkspaceNavigation'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DevVaultLogo } from './components/branding/DevVaultLogo'
import { LaunchIntro } from './components/branding/LaunchIntro'
import { GuestVaultShell } from './components/guest/GuestVaultShell'
import { RouteMetadata } from './components/RouteMetadata'
import { NotFoundState } from './components/NotFoundState'
import { isPublicPortfolioRoute } from './lib/routeAccess'

const LoginPage = lazy(() => import('./pages/LoginPage').then(({ LoginPage: Page }) => ({ default: Page })))
const SignupPage = lazy(() => import('./pages/SignupPage').then(({ SignupPage: Page }) => ({ default: Page })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(({ DashboardPage: Page }) => ({ default: Page })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(({ ProfilePage: Page }) => ({ default: Page })))
const GuestModePage = lazy(() => import('./pages/GuestModePage').then(({ GuestModePage: Page }) => ({ default: Page })))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage').then(({ EditProfilePage: Page }) => ({ default: Page })))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(({ ProjectsPage: Page }) => ({ default: Page })))
const ProjectFormPage = lazy(() => import('./pages/ProjectFormPage').then(({ ProjectFormPage: Page }) => ({ default: Page })))
const SkillsPage = lazy(() => import('./pages/SkillsPage').then(({ SkillsPage: Page }) => ({ default: Page })))
const CertificationsPage = lazy(() => import('./pages/CertificationsPage').then(({ CertificationsPage: Page }) => ({ default: Page })))
const GoalsPage = lazy(() => import('./pages/GoalsPage').then(({ GoalsPage: Page }) => ({ default: Page })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(({ SettingsPage: Page }) => ({ default: Page })))
const WorkspaceResumePage = lazy(() => import('./pages/WorkspaceResumePage').then(({ WorkspaceResumePage: Page }) => ({ default: Page })))
const InsideVaultPage = lazy(() => import('./pages/InsideVaultPage').then(({ InsideVaultPage: Page }) => ({ default: Page })))

function LegacyResumeRedirect() {
  const { username } = useParams()
  return <Navigate to={`/portfolio/${username}/vault/resume`} replace />
}

function LegacyGuestRedirect({ destination }) {
  const { username } = useParams()
  return <Navigate to={`/portfolio/${username}/vault${destination}`} replace />
}

function GuestRoutes() {
  return (
    <Layout>
      <Suspense fallback={<div className="guest-state">Opening Guest Mode…</div>}>
        <Routes>
          <Route path="/portfolio/:username" element={<GuestModePage view="overview" />} />
          <Route path="/portfolio/:username/about" element={<LegacyGuestRedirect destination="/about" />} />
          <Route path="/portfolio/:username/projects" element={<LegacyGuestRedirect destination="/projects" />} />
          <Route path="/portfolio/:username/projects/:projectId" element={<LegacyGuestRedirect destination="/projects" />} />
          <Route path="/portfolio/:username/skills" element={<LegacyGuestRedirect destination="/skills" />} />
          <Route path="/portfolio/:username/credentials" element={<LegacyGuestRedirect destination="/certifications" />} />
          <Route path="/portfolio/:username/resume" element={<LegacyGuestRedirect destination="/resume" />} />
          <Route path="/portfolio/:username/vault" element={<GuestVaultShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="about" element={<InsideVaultPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="certifications" element={<CertificationsPage />} />
            <Route path="resume" element={<WorkspaceResumePage />} />
          </Route>
          <Route path="/resume/:username" element={<LegacyResumeRedirect />} />
          <Route path="*" element={<NotFoundState publicMode />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

function App() {
  const location = useLocation()
  const isGuestRoute = isPublicPortfolioRoute(location.pathname)

  if (isGuestRoute) return <><RouteMetadata /><GuestRoutes /></>

  return (
    <Layout>
      <RouteMetadata />
      <LaunchIntro />
      <header className="sticky top-0 z-30 px-4 pt-4">
        <div className="nav-shell nav-shell--workspace mx-auto max-w-7xl gap-4">
          <div className="nav-brand">
            <DevVaultLogo compact />
            <div>
              <p className="nav-kicker">DevVault</p>
              <h1 className="nav-title">Workspace</h1>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
            <SignedIn>
              <WorkspaceNavigation />
              <div className="rounded-full border border-[rgba(214,160,89,0.24)] bg-[rgba(48,36,26,0.86)] p-1 shadow-sm">
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

      <main id="main-content" className="page-shell page-shell--wide page-stack pb-14 pt-6 md:pt-8">
        <Suspense fallback={<div className="widget-card p-8 text-sm text-[var(--color-text-soft)]">Opening workspace…</div>}>
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
            path="/inside-vault"
            element={
              <ProtectedRoute>
                <InsideVaultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-workspace"
            element={
              <ProtectedRoute>
                <WorkspaceResumePage />
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
          <Route path="*" element={<NotFoundState />} />
        </Routes>
        </Suspense>
      </main>
    </Layout>
  )
}

export default App
