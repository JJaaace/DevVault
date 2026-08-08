import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'sonner'
import { authenticatedRequest } from '../lib/api'
import { getPublicAppUrl } from '../lib/portfolioApi'
import { ProfileForm } from '../components/ProfileForm'
import { SectionHeader } from '../components/SectionHeader'
import { readStoredProfile, saveStoredProfile } from '../lib/profileStorage'

export function ProfilePage() {
  const navigate = useNavigate()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [serverProfileStatus, setServerProfileStatus] = useState('unknown')

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
        setServerProfileStatus('exists')
        if (nextProfile) {
          saveStoredProfile(nextProfile)
        }
      } catch (err) {
        const cachedProfile = readStoredProfile()
        if (err?.status === 404 || err?.code === 'PROFILE_NOT_FOUND') {
          setProfile(cachedProfile || null)
          setServerProfileStatus('missing')
        } else {
          setProfile(cachedProfile || null)
          setServerProfileStatus('unknown')
          setError(err?.message || 'Unable to load your profile from the server.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [getToken, isLoaded, isSignedIn])

  const publicPortfolioUrl = profile?.username && typeof window !== 'undefined'
    ? `${getPublicAppUrl()}/portfolio/${profile.username}`
    : ''

  const resumeUrl = profile?.username && typeof window !== 'undefined'
    ? `${getPublicAppUrl()}/portfolio/${profile.username}/vault/resume`
    : ''

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

    try {
      if (!isLoaded || !isSignedIn) {
        throw new Error('You must be signed in to save your profile.')
      }
      if (serverProfileStatus === 'unknown') {
        throw new Error('The server profile status is unknown. Refresh the page before saving.')
      }

      const method = serverProfileStatus === 'exists' ? 'PUT' : 'POST'
      const response = await authenticatedRequest('/api/profile', { method, body: JSON.stringify(formData) }, getToken)
      const savedProfile = response
      setProfile(savedProfile)
      saveStoredProfile(savedProfile)
      setServerProfileStatus('exists')
      toast.success(method === 'PUT' ? 'Profile updated successfully.' : 'Profile created successfully.')
      setTimeout(() => navigate('/dashboard'), 900)
    } catch (err) {
      const message = err?.message || 'Unable to save profile.'
      if (err?.details && typeof err.details === 'object') {
        setErrors(err.details)
        toast.error('Please fix the highlighted fields and try again.')
      } else {
        setError(message)
        toast.error(message)
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
                  Preview Guest Mode
                </Link>
                <Link to={`/portfolio/${profile.username}/vault/resume`} target="_blank" rel="noreferrer" className="button-secondary px-4 py-2 text-sm">
                  Print / Save PDF
                </Link>
                <button type="button" onClick={handleCopyPortfolioLink} className="button-secondary px-4 py-2 text-sm">
                  Copy link
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-[1.1rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3 text-sm text-[var(--color-text-soft)]">
              {publicPortfolioUrl}
            </div>

            {resumeUrl ? <div className="mt-3 rounded-[1.1rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3 text-xs text-[var(--color-text-muted)]">Resume preview: {resumeUrl}</div> : null}
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
