import { Link } from 'react-router-dom'
import { SocialLinks } from './SocialLinks'

export function ProfileCard({ profile, onEdit }) {
  if (!profile) {
    return null
  }

  const imageUrl = profile.profileImageUrl || profile.profileImage
  const school = profile.school || profile.university
  const location = profile.location || [profile.state, profile.country].filter(Boolean).join(', ')
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  const companyTags = profile.dreamCompanies || []
  const interestTags = profile.interests || []

  const renderTags = (items) => {
    if (!items.length) {
      return null
    }

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
            {item}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="widget-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${fullName || profile.username} profile`}
              className="h-16 w-16 rounded-2xl border border-[rgba(126,89,45,0.16)] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(126,89,45,0.16)] bg-[rgba(255,255,255,0.7)] text-lg font-semibold text-[var(--color-brand-ink)]">
              {(fullName || profile.username || '?').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <p className="section-eyebrow">Developer profile</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{fullName}</h3>
            <p className="mt-2 text-sm font-medium text-[var(--color-brand-ink)]">@{profile.username}</p>
            {profile.currentRole ? <p className="mt-2 text-sm text-[var(--color-text-soft)]">{profile.currentRole}</p> : null}
          </div>
        </div>
        {onEdit ? (
          <Link
            to="/profile/edit"
            className="button-secondary px-4 py-2 text-sm"
          >
            Edit profile
          </Link>
        ) : null}
      </div>

      <p className="mt-6 text-sm leading-7 text-[var(--color-text-soft)]">{profile.bio}</p>

      <div className="mt-6 grid gap-4 text-sm text-[var(--color-text-soft)] md:grid-cols-2">
        {school ? (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Education</p>
            <p className="mt-2 font-medium text-[var(--color-text)]">{school}</p>
            {profile.major ? <p className="text-[var(--color-text-soft)]">{profile.major}</p> : null}
            {profile.graduationYear ? <p className="text-[var(--color-text-soft)]">Graduated {profile.graduationYear}</p> : null}
          </div>
        ) : null}
        {(location || profile.currentRole) ? (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Career</p>
            {profile.currentRole ? <p className="mt-2 font-medium text-[var(--color-text)]">{profile.currentRole}</p> : null}
            {location ? <p className="text-[var(--color-text-soft)]">{location}</p> : null}
          </div>
        ) : null}
        {profile.favoriteLanguage || profile.favoriteFramework ? (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Tech stack</p>
            {profile.favoriteLanguage ? <p className="mt-2 font-medium text-[var(--color-text)]">{profile.favoriteLanguage}</p> : null}
            {profile.favoriteFramework ? <p className="text-[var(--color-text-soft)]">{profile.favoriteFramework}</p> : null}
          </div>
        ) : null}
        {profile.yearsCoding !== null && profile.yearsCoding !== undefined && profile.yearsCoding !== '' ? (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Experience</p>
            <p className="mt-2 font-medium text-[var(--color-text)]">{profile.yearsCoding} years coding</p>
          </div>
        ) : null}
      </div>

      {companyTags.length ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Dream companies</p>
          {renderTags(companyTags)}
        </div>
      ) : null}

      {interestTags.length ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Interests</p>
          {renderTags(interestTags)}
        </div>
      ) : null}

      <div className="mt-6">
        <SocialLinks profile={profile} />
      </div>
    </div>
  )
}
