import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { readWorkspacePreferences, saveWorkspacePreferences } from '../lib/workspacePreferences'

export function SettingsPage() {
  const { user } = useUser()
  const [showCodingStreak, setShowCodingStreak] = useState(() => readWorkspacePreferences().showCodingStreak !== false)

  const handleToggleCodingStreak = () => {
    const nextValue = !showCodingStreak
    setShowCodingStreak(nextValue)
    saveWorkspacePreferences({ showCodingStreak: nextValue })
    window.dispatchEvent(new Event('devvault:workspace-preferences-changed'))
  }

  return (
    <section className="surface-card p-6 md:p-8 fade-in-up">
      <SectionHeader
        eyebrow="Settings"
        title="Manage your account and workspace preferences."
        description="Keep identity, access, and workspace controls in one place."
        action={<Link to="/profile/edit" className="button-secondary px-4 py-2 text-sm">Edit profile</Link>}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="widget-card p-6">
          <p className="section-eyebrow">Account</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--color-text-soft)]">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Name</p>
              <p className="mt-2 font-medium text-[var(--color-text)]">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Account'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Email</p>
              <p className="mt-2 font-medium text-[var(--color-text)]">{user?.primaryEmailAddress?.emailAddress || 'Email not available'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/profile" className="button-secondary px-4 py-2 text-sm">View profile</Link>
            <Link to="/dashboard" className="button-primary px-4 py-2 text-sm">Return home</Link>
          </div>
        </div>

        <div className="widget-card widget-card--accent p-6">
          <p className="section-eyebrow">Access</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium text-[var(--color-text)]">Session controls</p>
              <p className="mt-2 text-sm text-[var(--color-text-soft)]">Use Clerk to manage sign-out and account actions.</p>
            </div>
            <SignedIn>
              <div className="rounded-full border border-[rgba(214,160,89,0.24)] bg-[rgba(48,36,26,0.86)] p-1 shadow-sm">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <Link to="/login" className="button-primary px-4 py-2 text-sm">Sign in</Link>
            </SignedOut>
          </div>
        </div>

        <div className="widget-card p-6">
          <p className="section-eyebrow">Workspace</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium text-[var(--color-text)]">Show coding streak on dashboard</p>
              <p className="mt-2 text-sm text-[var(--color-text-soft)]">Turn this off when preparing a recruiter-facing demo view.</p>
            </div>
            <button
              type="button"
              onClick={handleToggleCodingStreak}
              className={`${showCodingStreak ? 'button-primary' : 'button-secondary'} px-4 py-2 text-sm`}
              aria-pressed={showCodingStreak}
            >
              {showCodingStreak ? 'Visible' : 'Hidden'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
