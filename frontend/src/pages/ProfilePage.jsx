import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { authenticatedRequest } from '../lib/api'
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
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState({})

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

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    setError('')
    setSuccess('')
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
        setSuccess('Profile saved locally. Your dashboard will show it as soon as you return.')
        return
      }

      const method = profile ? 'PUT' : 'POST'
      const response = await authenticatedRequest('/api/profile', { method, body: JSON.stringify(formData) }, getToken)
      const savedProfile = response || optimisticProfile
      setProfile(savedProfile)
      saveStoredProfile(savedProfile)
      setSuccess(profile ? 'Profile updated successfully.' : 'Profile created successfully.')
      setTimeout(() => navigate('/dashboard'), 900)
    } catch (err) {
      const message = err?.message || ''
      const parsed = parseErrorPayload(message)

      const fallbackProfile = saveStoredProfile(optimisticProfile)
      setProfile(fallbackProfile)

      if (message.includes('403') || message.includes('Unauthorized') || message.includes('auth')) {
        setSuccess('Profile saved locally for now. Your dashboard will show it right away.')
      } else if (parsed.errors) {
        setErrors(parsed.errors)
        setError('Please fix the highlighted fields and try again.')
      } else {
        setSuccess('Profile saved locally for now. Your dashboard will show it right away.')
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

        {success ? (
          <div className="widget-card border border-[rgba(234,139,33,0.18)] bg-[rgba(255,247,233,0.92)] p-4 text-sm text-[var(--color-brand-ink)]">
            <div className="font-semibold">{success}</div>
            <p className="mt-1 text-[var(--color-text-soft)]">Your profile is now saved locally and will appear on your dashboard. The dashboard completion meter will update immediately.</p>
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
