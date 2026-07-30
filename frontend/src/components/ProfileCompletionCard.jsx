import { Link } from 'react-router-dom'

export function ProfileCompletionCard({ profile, actionTo = '/profile/edit', actionLabel = 'Refine profile' }) {
  const requiredFields = [
    ['firstName', profile?.firstName],
    ['lastName', profile?.lastName],
    ['username', profile?.username],
    ['bio', profile?.bio],
    ['profileImageUrl', profile?.profileImageUrl || profile?.profileImage],
    ['school', profile?.school || profile?.university],
    ['major', profile?.major],
    ['location', profile?.location || [profile?.state, profile?.country].filter(Boolean).join(', ')],
    ['currentRole', profile?.currentRole],
    ['favoriteLanguage', profile?.favoriteLanguage],
    ['favoriteFramework', profile?.favoriteFramework],
    ['yearsCoding', profile?.yearsCoding !== null && profile?.yearsCoding !== undefined && profile?.yearsCoding !== ''],
    ['dreamCompanies', (profile?.dreamCompanies || []).length > 0],
    ['interests', (profile?.interests || []).length > 0],
  ]

  const completed = requiredFields.filter(([, value]) => Boolean(value)).length
  const percentage = Math.round((completed / requiredFields.length) * 100)

  return (
    <div className="widget-card widget-card--accent p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-eyebrow">Profile completion</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--color-text)]">{percentage}% complete</h3>
        </div>
        <div className="chip chip--accent">
          {completed}/{requiredFields.length} details
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(126,89,45,0.12)]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#f9c96e] via-[#ea8b21] to-[#d96a16] transition-all" style={{ width: `${percentage}%` }} />
      </div>

      <p className="mt-4 text-sm text-[var(--color-text-soft)]">
        {profile ? 'Your profile is ready to shine and will appear on your dashboard as soon as it is saved.' : 'Add the details to make your DevVault profile feel polished and ready for future opportunities.'}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Profile health</p>
        <Link to={actionTo} className="button-secondary px-4 py-2 text-sm">
          {profile ? actionLabel : 'Create profile'}
        </Link>
      </div>
    </div>
  )
}
