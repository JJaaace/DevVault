export function GitHubSyncStatusCard({ syncState }) {
  if (!syncState) {
    return null
  }

  const isRunning = syncState.status === 'queued' || syncState.status === 'running'
  const isFailed = syncState.status === 'failed'
  const isComplete = syncState.status === 'completed'
  const errors = Array.isArray(syncState.errors) ? syncState.errors : []

  if (!isRunning && !isFailed && !isComplete) {
    return null
  }

  const progress = typeof syncState.progress === 'number' ? syncState.progress : 0
  const summary = syncState.summary || {}
  const importCandidates = Array.isArray(syncState.result?.importCandidates) ? syncState.result.importCandidates : []

  return (
    <div className={`widget-card p-5 ${isFailed ? 'border border-[rgba(185,56,28,0.18)] bg-[rgba(255,242,236,0.9)]' : 'border border-[rgba(234,139,33,0.18)] bg-[rgba(255,247,233,0.92)]'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="section-eyebrow">GitHub projects</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">{isFailed ? 'Project sync failed' : isComplete ? 'Project sync complete' : 'Project sync in progress'}</h3>
          <p className="mt-2 text-sm text-[var(--color-text-soft)]">{syncState.message || syncState.step}</p>
          {syncState.completedAt ? <p className="mt-2 text-xs text-[var(--color-text-muted)]">Last project sync: {new Date(syncState.completedAt).toLocaleString()}</p> : null}
        </div>

        <div className="rounded-full border border-[rgba(214,160,89,0.24)] bg-[rgba(48,36,26,0.86)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
          {progress}%
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(126,89,45,0.1)]">
        <div
          className={`h-full rounded-full ${isFailed ? 'bg-gradient-to-r from-[#f49b7b] via-[#d96a16] to-[#b83a1c]' : 'bg-gradient-to-r from-[#f9c96e] via-[#ea8b21] to-[#d96a16]'}`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Refreshed</p>
          <p className="mt-1 font-semibold text-[var(--color-text)]">{summary.refreshed ?? 0}</p>
        </div>
        <div className="rounded-[1rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Unchanged</p>
          <p className="mt-1 font-semibold text-[var(--color-text)]">{summary.unchanged ?? 0}</p>
        </div>
        <div className="rounded-[1rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Available to import</p>
          <p className="mt-1 font-semibold text-[var(--color-text)]">{summary.available ?? 0}</p>
        </div>
      </div>

      {isComplete && importCandidates.length ? (
        <div className="mt-4 rounded-[1rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3 text-sm text-[var(--color-text-soft)]">
          <p className="font-semibold text-[var(--color-text)]">Repositories available to import</p>
          <p className="mt-1 text-xs leading-5">These repositories were detected but were not added to your portfolio. Create a project manually when you want to include one.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {importCandidates.slice(0, 8).map((candidate) => (
              <a key={candidate.githubRepoId || candidate.githubFullName} href={candidate.githubUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[rgba(214,160,89,0.24)] px-3 py-1.5 text-xs text-[var(--color-text)] hover:border-[rgba(234,139,33,0.5)]">
                {candidate.githubFullName || candidate.name}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {errors.length ? (
        <div className="mt-4 rounded-[1rem] border border-[rgba(185,56,28,0.28)] bg-[rgba(58,28,18,0.88)] px-4 py-3 text-sm text-[#f2b39a]">
          <p className="font-semibold text-[var(--color-text)]">Detailed errors</p>
          <ul className="mt-2 space-y-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
