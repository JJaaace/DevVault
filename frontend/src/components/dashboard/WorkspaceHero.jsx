import { Link } from 'react-router-dom'
import { MiniSparkline } from './MiniSparkline'
import { MetricTile } from './MetricTile'
import { ProgressRing } from './ProgressRing'

function getActionClass(tone) {
  if (tone === 'primary') {
    return 'button-primary'
  }

  if (tone === 'accent') {
    return 'button-secondary border-[rgba(234,139,33,0.2)] bg-[rgba(255,247,236,0.95)] text-[var(--color-brand-ink)]'
  }

  return 'button-secondary'
}

export function WorkspaceHero({
  greeting,
  userName,
  activitySeries,
  currentStreak,
  currentFocus,
  upcomingDeadline,
  quickStats = [],
  quickActions = [],
  progress = [],
}) {
  const momentum = progress.length
    ? Math.round(progress.reduce((sum, item) => sum + Number(item.value || 0), 0) / progress.length)
    : 0

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
            <p className="section-eyebrow">{greeting}</p>
            <h2 className="text-4xl font-semibold tracking-tight text-[var(--color-text)] md:text-5xl">
              {userName ? `${userName}, your workspace is live.` : 'Your workspace is live.'}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-[var(--color-text-soft)]">
              {currentFocus?.title ? `Focus: ${currentFocus.title}.` : 'Everything you need is ready in one place.'}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="widget-card widget-card--accent border border-[rgba(255,255,255,0.55)] p-5 shadow-[0_24px_50px_rgba(110,76,34,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-eyebrow">{currentFocus?.eyebrow || 'Current focus'}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{currentFocus?.title || 'Ready for your next move'}</h3>
                  {currentFocus?.detail ? <p className="mt-2 text-sm text-[var(--color-text-soft)]">{currentFocus.detail}</p> : null}
                  {currentFocus?.meta ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-text-muted)]">{currentFocus.meta}</p> : null}
                </div>
                {currentFocus?.href ? (
                  <Link to={currentFocus.href} className="button-secondary shrink-0 px-4 py-2 text-sm">
                    {currentFocus?.actionLabel || 'Open'}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="widget-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-eyebrow">{upcomingDeadline?.label || 'Upcoming deadline'}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{upcomingDeadline?.title || 'No deadline added'}</h3>
                  {upcomingDeadline?.detail ? <p className="mt-2 text-sm text-[var(--color-text-soft)]">{upcomingDeadline.detail}</p> : null}
                </div>
                {upcomingDeadline?.href ? (
                  <Link to={upcomingDeadline.href} className="button-primary shrink-0 px-4 py-2 text-sm">
                    {upcomingDeadline?.actionLabel || 'Open'}
                  </Link>
                ) : null}
              </div>
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
              <div className="rounded-[1.35rem] border border-white/80 bg-[rgba(255,255,255,0.72)] p-3 shadow-[0_18px_35px_rgba(110,76,34,0.08)]">
                <MiniSparkline values={activitySeries} color="#d96a16" className="h-14 w-[190px] max-w-full" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {progress.map((item) => (
                <div key={item.label} className="rounded-[1.15rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.7)] p-4">
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
            <div className="mt-4 rounded-[1.35rem] border border-white/70 bg-[rgba(255,255,255,0.68)] p-3">
              <MiniSparkline values={activitySeries} color="#d96a16" className="h-14 w-full" />
            </div>
          </div>

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