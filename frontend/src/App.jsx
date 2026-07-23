import { Link, Route, Routes } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import './App.css'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { EditProfilePage } from './pages/EditProfilePage'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
              DevVault
            </p>
            <h1 className="text-2xl font-bold">Developer Growth Dashboard</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <Link to="/about" className="transition hover:text-white">
              About
            </Link>
            <SignedOut>
              <Link to="/login" className="transition hover:text-white">
                Sign in
              </Link>
              <Link to="/signup" className="rounded-lg border border-cyan-500 px-3 py-2 text-cyan-300 transition hover:bg-cyan-500/10 hover:text-white">
                Sign up
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="transition hover:text-white">
                Dashboard
              </Link>
              <Link to="/profile" className="transition hover:text-white">
                Profile
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-black/20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Phase 3 · Dashboard & Profile
          </p>
          <h2 className="mb-4 text-4xl font-semibold text-white">
            A professional hub for your developer identity and growth.
          </h2>
          <p className="max-w-2xl text-lg text-slate-300">
            Signed-in users now get a dashboard and a profile experience designed to feel polished and portfolio-ready.
          </p>
        </section>

        <Routes>
          <Route
            path="/"
            element={
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
                <h3 className="mb-3 text-2xl font-semibold text-white">Current milestone</h3>
                <p className="text-slate-400">
                  The app is now centered around a dashboard experience with profile creation and editing for authenticated users.
                </p>
              </section>
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
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
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
          <Route
            path="/about"
            element={
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
                <h3 className="mb-3 text-2xl font-semibold text-white">Why this structure?</h3>
                <p className="text-slate-400">
                  The dashboard and profile system are intentionally separated so the experience stays clear, scalable, and easy to extend later.
                </p>
              </section>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
