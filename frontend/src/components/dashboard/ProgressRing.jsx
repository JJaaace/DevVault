export function ProgressRing({ value = 0, color = '#ea8b21', label = 'progress', size = 120, strokeWidth = 10, children }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const normalized = Math.max(0, Math.min(100, Number(value) || 0))
  const dashOffset = normalized >= 100 ? 0 : (circumference - (normalized / 100) * circumference)
  const innerSize = Math.max(40, size - (strokeWidth * 2) - 4)
  const progressLineCap = normalized >= 100 ? 'butt' : 'round'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(126,89,45,0.12)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap={progressLineCap}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>

      <div
        className="relative flex flex-col items-center justify-center rounded-full border border-[rgba(214,160,89,0.24)] bg-[rgba(45,34,25,0.88)] text-center shadow-[0_18px_35px_rgba(18,12,8,0.3)]"
        style={{ width: innerSize, height: innerSize }}
      >
        {children || <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">{normalized}%</span>}
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">{label}</span>
      </div>
    </div>
  )
}