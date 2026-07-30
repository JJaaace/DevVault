export function SkillProgressRing({ percentage, color, label }) {
  const size = 112
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const normalizedPercentage = Math.max(0, Math.min(100, Number(percentage) || 0))
  const dashOffset = circumference - (normalizedPercentage / 100) * circumference

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(126,89,45,0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>

      <div className="relative flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full border border-white/80 bg-[rgba(255,255,255,0.86)] text-center shadow-[0_18px_35px_rgba(110,76,34,0.08)]">
        <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">{normalizedPercentage}%</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {label}
        </span>
      </div>
    </div>
  )
}