import { Link } from 'react-router-dom'
import { MiniSparkline } from './MiniSparkline'
import { MetricTile } from './MetricTile'
import { ProgressRing } from './ProgressRing'

function getActionClass(tone) {
  if (tone === 'primary') {
    return 'button-primary'
  }

  if (tone === 'accent') {
    return 'button-secondary border-[rgba(234,139,33,0.28)] bg-[rgba(63,45,30,0.9)] text-[var(--color-brand-ink)] shadow-[0_16px_28px_rgba(18,12,8,0.3)]'
  }

  return 'button-secondary'
}

export function WorkspaceHero({
  greeting,
  userName,
  activitySeries,
  currentStreak,
  showCodingStreak = true,
  upcomingDeadline,
  quickStats = [],
  quickActions = [],
  progress = [],
  syncState = null,
}) {
  const momentum = progress.length
    ? Math.round(progress.reduce((sum, item) => sum + Number(item.value || 0), 0) / progress.length)
    : 0
  const isSyncing = syncState?.status === 'running' || syncState?.status === 'queued'
  const deadlineActionClass = upcomingDeadline?.actionLabel?.toLowerCase() === 'set deadline'
    ? 'button-primary deadline-cta'
    : 'button-primary'

  return (
    <section className="surface-card surface-card--hero relative overflow-hidden px-6 py-8 md:px-8 md:py-10 fade-in-up">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(249,201,110,0.38),rgba(249,201,110,0)_72%)] blur-3xl" />
        <div className="absolute right-0 top-[-3rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(234,139,33,0.28),rgba(234,139,33,0)_72%)] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(217,106,22,0.18),rgba(217,106,22,0)_72%)] blur-3xl" />
      </div>

      <div className="relative grid gap-8 xl:grid-cols-[1.12fr_0.88fr] xl:items-stretch">
        <div className="flex flex-col gap-6">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="section-eyebrow">{greeting}</p>
              {isSyncing ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(234,139,33,0.18)] bg-[rgba(255,247,233,0.92)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-ink)]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-brand-strong)]" />
                  Syncing...
                </span>
              ) : null}
            </div>
            <h2 className="text-4xl font-semibold tracking-tight text-[var(--color-text)] md:text-5xl">
              {userName ? `${userName}, your workspace is live.` : 'Your workspace is live.'}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-[var(--color-text-soft)]">
              Everything you need is ready in one place.
            </p>
          </div>

          <div className="widget-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="section-eyebrow">{upcomingDeadline?.label || 'Upcoming deadline'}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{upcomingDeadline?.title || 'No deadline added'}</h3>
                {upcomingDeadline?.detail ? <p className="mt-2 text-sm text-[var(--color-text-soft)]">{upcomingDeadline.detail}</p> : null}
              </div>
              {upcomingDeadline?.href ? (
                <Link to={upcomingDeadline.href} className={`${deadlineActionClass} w-fit shrink-0 px-4 py-2 text-sm`}>
                  {upcomingDeadline?.actionLabel || 'Open'}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Link key={`${action.label}-${action.href}`} to={action.href} className={`${getActionClass(action.tone)} px-5 py-3 text-sm`}>
                {action.label}
              </Link>
            ))}
          </div>

          <div className="widget-card p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="section-eyebrow">Motivational progress</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">{momentum}% workspace momentum</h3>
                <p className="mt-2 text-sm text-[var(--color-text-soft)]">Profile, projects, and skills are all advancing from your real workspace data.</p>
              </div>
              <div className="rounded-[1.35rem] border border-[rgba(214,160,89,0.24)] bg-[rgba(44,33,24,0.82)] p-3 shadow-[0_18px_35px_rgba(18,12,8,0.3)]">
                <MiniSparkline values={activitySeries} color="#d96a16" className="h-14 w-[190px] max-w-full" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {progress.map((item) => (
                <div key={item.label} className="rounded-[1.15rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{item.value}%</p>
                    </div>
                    <ProgressRing value={item.value} label={item.label.toLowerCase()} color="#ea8b21" size={74} strokeWidth={8} />
                  </div>
                  {item.note ? <p className="mt-3 text-xs text-[var(--color-text-soft)]">{item.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickStats.slice(0, 4).map((stat) => (
              <MetricTile key={stat.label} label={stat.label} value={stat.value} note={stat.note} />
            ))}
          </div>

          {showCodingStreak ? (
            <div className="widget-card widget-card--accent p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-eyebrow">Current coding streak</p>
                  <h3 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--color-text)]">{currentStreak} days</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-soft)]">Derived from your latest profile, project, and skill updates.</p>
                </div>
                <ProgressRing value={Math.min(100, currentStreak * 12.5)} label="streak" color="#ea8b21" size={112}>
                  <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">{currentStreak}</span>
                </ProgressRing>
              </div>
              <div className="mt-4 rounded-[1.35rem] border border-[rgba(214,160,89,0.22)] bg-[rgba(44,33,24,0.82)] p-3">
                <MiniSparkline values={activitySeries} color="#d96a16" className="h-14 w-full" />
              </div>
            </div>
          ) : null}

          <div className="widget-card p-5">
            <p className="section-eyebrow">Quick stats</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quickStats.slice(4).map((stat) => (
                <MetricTile key={stat.label} label={stat.label} value={stat.value} note={stat.note} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}