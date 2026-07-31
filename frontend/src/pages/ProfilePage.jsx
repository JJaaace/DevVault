import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'sonner'
import { authenticatedRequest } from '../lib/api'
import { ProfileForm } from '../components/ProfileForm'
import { SectionHeader } from '../components/SectionHeader'
import { readStoredProfile, saveStoredProfile } from '../lib/profileStorage'
import { buildGitHubProfilePayload, extractGitHubUsername, fetchGitHubProfile } from '../lib/githubApi'

export function ProfilePage() {
  const navigate = useNavigate()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [syncingGitHub, setSyncingGitHub] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const cached = readStoredProfile()
      if (cached) {
        setProfile(cached)
      }

      if (!isLoaded || !isSignedIn) {
        setLoading(false)
        return
      }

      try {
        const data = await authenticatedRequest('/api/profile', {}, getToken)
        const nextProfile = data || cached
        setProfile(nextProfile)
        if (nextProfile) {
          saveStoredProfile(nextProfile)
        }
      } catch (err) {
        const message = err?.message || ''
        const cachedProfile = readStoredProfile()
        if (message.includes('404')) {
          setProfile(cachedProfile || null)
        } else if (message.includes('403') || message.includes('Unauthorized') || message.includes('auth')) {
          setProfile(cachedProfile || null)
          setError('')
        } else {
          setProfile(cachedProfile || null)
          setError('')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [getToken, isLoaded, isSignedIn])

  const parseErrorPayload = (payload) => {
    if (!payload) {
      return { message: 'Unable to save profile.' }
    }

    try {
      const parsed = JSON.parse(payload)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    } catch {
      // fall back to treating the payload as plain text
    }

    return { message: payload }
  }

  const publicPortfolioUrl = profile?.username && typeof window !== 'undefined'
    ? `${window.location.origin}/portfolio/${profile.username}`
    : ''

  const resumeUrl = profile?.username && typeof window !== 'undefined'
    ? `${window.location.origin}/resume/${profile.username}?print=1`
    : ''

  const handleSyncFromGitHub = async () => {
    if (!profile) {
      return
    }

    const githubUsername = extractGitHubUsername(profile.githubUrl)
    if (!githubUsername) {
      toast.error('Add your GitHub URL first so DevVault knows which account to sync.')
      return
    }

    setSyncingGitHub(true)
    setError('')
    const loadingToast = toast.loading('Syncing your GitHub profile...')

    try {
      const githubUser = await fetchGitHubProfile(githubUsername)
      const payload = buildGitHubProfilePayload(profile, githubUser)
      const method = profile ? 'PUT' : 'POST'
      const savedProfile = await authenticatedRequest('/api/profile', {
        method,
        body: JSON.stringify(payload),
      }, getToken)

      setProfile(savedProfile)
      saveStoredProfile(savedProfile)
      toast.success('GitHub profile synced into DevVault.', { id: loadingToast })
    } catch (err) {
      toast.error(err.message || 'Unable to sync from GitHub.', { id: loadingToast })
    } finally {
      setSyncingGitHub(false)
    }
  }

  const handleCopyPortfolioLink = async () => {
    if (!publicPortfolioUrl || !navigator.clipboard) {
      return
    }

    try {
      await navigator.clipboard.writeText(publicPortfolioUrl)
      toast.success('Portfolio link copied.')
    } catch {
      toast.error('Unable to copy automatically. Use the link below.')
    }
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    setError('')
    setErrors({})

    const optimisticProfile = {
      ...profile,
      ...formData,
      savedAt: new Date().toISOString(),
    }
    setProfile(optimisticProfile)
    saveStoredProfile(optimisticProfile)

    try {
      if (!isLoaded || !isSignedIn) {
        const fallbackProfile = saveStoredProfile(optimisticProfile)
        setProfile(fallbackProfile)
        toast.success('Profile saved locally. Your dashboard will show it as soon as you return.')
        return
      }

      const method = profile ? 'PUT' : 'POST'
      const response = await authenticatedRequest('/api/profile', { method, body: JSON.stringify(formData) }, getToken)
      const savedProfile = response || optimisticProfile
      setProfile(savedProfile)
      saveStoredProfile(savedProfile)
      toast.success(profile ? 'Profile updated successfully.' : 'Profile created successfully.')
      setTimeout(() => navigate('/dashboard'), 900)
    } catch (err) {
      const message = err?.message || ''
      const parsed = parseErrorPayload(message)

      const fallbackProfile = saveStoredProfile(optimisticProfile)
      setProfile(fallbackProfile)

      if (message.includes('403') || message.includes('Unauthorized') || message.includes('auth')) {
        toast.success('Profile saved locally for now. Your dashboard will show it right away.')
      } else if (parsed.errors) {
        setErrors(parsed.errors)
        toast.error('Please fix the highlighted fields and try again.')
      } else {
        toast.success('Profile saved locally for now. Your dashboard will show it right away.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell page-shell--wide page-stack pb-14">
      <div className="flex flex-col gap-6">
        <SectionHeader
          eyebrow="Profile"
          title={profile ? 'Edit your developer profile' : 'Create your developer profile'}
          description="Build a polished profile that will become the foundation of your DevVault experience."
        />

        {loading ? (
          <div className="widget-card p-8 text-sm text-[var(--color-text-soft)]">Loading profile...</div>
        ) : null}

        {error ? (
          <div className="widget-card border border-[rgba(185,56,28,0.18)] bg-[rgba(255,242,236,0.9)] p-4 text-sm text-[#a83f1d]">
            {error}
          </div>
        ) : null}

        {profile ? (
          <div className="widget-card widget-card--accent p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="section-eyebrow">Public portfolio</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">Share a read-only view of your work</h3>
                <p className="mt-2 text-sm text-[var(--color-text-soft)]">Anyone with this link can view your portfolio, but they cannot edit your data.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to={`/portfolio/${profile.username}`} className="button-primary px-4 py-2 text-sm" target="_blank" rel="noreferrer">
                  View portfolio
                </Link>
                <Link to={`/resume/${profile.username}?print=1`} target="_blank" rel="noreferrer" className="button-secondary px-4 py-2 text-sm">
                  Print / Save PDF
                </Link>
                <button type="button" onClick={handleSyncFromGitHub} disabled={syncingGitHub} className="button-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                  {syncingGitHub ? 'Syncing GitHub...' : 'Sync from GitHub'}
                </button>
                <button type="button" onClick={handleCopyPortfolioLink} className="button-secondary px-4 py-2 text-sm">
                  Copy link
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-[1.1rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm text-[var(--color-text-soft)]">
              {publicPortfolioUrl}
            </div>

            {resumeUrl ? <div className="mt-3 rounded-[1.1rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-xs text-[var(--color-text-muted)]">Resume preview: {resumeUrl}</div> : null}

          </div>
        ) : null}

        <ProfileForm
          key={profile?.id || profile?.updatedAt || profile?.savedAt || profile?.username || 'new-profile'}
          profile={profile}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/dashboard')}
          submitting={submitting}
          errors={errors}
        />
      </div>
    </div>
  )
}
