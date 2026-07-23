export function ProfileCompletionCard({ profile }) {
  const requiredFields = [
    ['firstName', profile?.firstName],
    ['lastName', profile?.lastName],
    ['username', profile?.username],
    ['bio', profile?.bio],
  ]

  const completed = requiredFields.filter(([, value]) => Boolean(value)).length
  const percentage = Math.round((completed / requiredFields.length) * 100)

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Profile completion</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{percentage}% complete</h3>
        </div>
        <div className="rounded-full border border-cyan-500/30 bg-slate-950/70 px-3 py-2 text-sm font-semibold text-cyan-300">
          {completed}/{requiredFields.length} essentials
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900/80">
        <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${percentage}%` }} />
      </div>

      <p className="mt-4 text-sm text-slate-300">
        {profile ? 'Your profile is ready to shine and will appear on your dashboard as soon as it is saved.' : 'Add the essentials to make your DevVault profile feel polished and ready for future opportunities.'}
      </p>
    </div>
  )
}
