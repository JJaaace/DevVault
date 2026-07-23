import { useAuth, useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authenticatedRequest } from '../lib/api'
import { DashboardCard } from '../components/DashboardCard'
import { ProfileCard } from '../components/ProfileCard'
import { ProfileCompletionCard } from '../components/ProfileCompletionCard'
import { SectionHeader } from '../components/SectionHeader'
import { readStoredProfile, saveStoredProfile } from '../lib/profileStorage'

export function DashboardPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const cached = readStoredProfile()
        if (cached) {
          setProfile(cached)
          saveStoredProfile(cached)
        }

        const response = await authenticatedRequest('/api/profile', {}, getToken)
        const nextProfile = response || cached
        setProfile(nextProfile)
        if (nextProfile) {
          saveStoredProfile(nextProfile)
        }
      } catch (err) {
        const cached = readStoredProfile()
        if (err.message && err.message.includes('404')) {
          setProfile(cached || null)
        } else {
          setError(err.message || 'Unable to load profile.')
          if (cached) {
            setProfile(cached)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [getToken])

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Dashboard</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                Welcome{user?.firstName ? `, ${user.firstName}` : ''}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Your DevVault workspace is now a central place for your professional profile, growth goals, and future portfolio content.
              </p>
            </div>
            <Link
              to={profile ? '/profile/edit' : '/profile'}
              className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              {profile ? 'Edit profile' : 'Create profile'}
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <ProfileCompletionCard profile={profile} />
            {loading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-400">Loading your profile...</div>
            ) : profile ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  Profile saved{profile.savedAt ? ` • ${new Date(profile.savedAt).toLocaleString()}` : ''}
                </div>
                <ProfileCard profile={profile} onEdit />
              </div>
            ) : (
              <DashboardCard title="Profile status" description="You have not created a profile yet. Start with your core details to make your workspace feel complete.">
                <Link to="/profile" className="inline-flex rounded-lg border border-cyan-500 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/10">
                  Create your profile
                </Link>
              </DashboardCard>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <DashboardCard title="Quick navigation" description="Use these shortcuts to move through your workspace.">
              <div className="flex flex-col gap-3">
                <Link to="/profile" className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300">
                  Manage profile
                </Link>
                <Link to="/profile/edit" className="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300">
                  Update details
                </Link>
              </div>
            </DashboardCard>

            <DashboardCard title="Upcoming sections" description="These areas are placeholders for the next phase of the experience.">
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Projects</li>
                <li>• Skills</li>
                <li>• Certifications</li>
                <li>• GitHub</li>
                <li>• Recent activity</li>
              </ul>
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  )
}
