import { Link } from 'react-router-dom'
import { SocialLinks } from './SocialLinks'

export function ProfileCard({ profile, onEdit }) {
  if (!profile) {
    return null
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Developer profile</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{fullName}</h3>
          <p className="mt-2 text-sm text-cyan-300">@{profile.username}</p>
        </div>
        {onEdit ? (
          <Link
            to="/profile/edit"
            className="rounded-lg border border-cyan-500 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/10"
          >
            Edit profile
          </Link>
        ) : null}
      </div>

      <p className="mt-6 text-sm leading-7 text-slate-300">{profile.bio}</p>

      <div className="mt-6 grid gap-4 text-sm text-slate-300 md:grid-cols-2">
        {profile.university ? (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Education</p>
            <p className="mt-2 font-medium text-white">{profile.university}</p>
            {profile.graduationYear ? <p className="text-slate-400">Graduated {profile.graduationYear}</p> : null}
          </div>
        ) : null}
        {(profile.country || profile.state) ? (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Location</p>
            <p className="mt-2 font-medium text-white">{[profile.state, profile.country].filter(Boolean).join(', ')}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <SocialLinks profile={profile} />
      </div>
    </div>
  )
}
