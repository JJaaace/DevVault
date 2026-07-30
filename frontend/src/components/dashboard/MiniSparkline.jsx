export function MiniSparkline({ values = [], color = '#ea8b21', className = '' }) {
  const width = 180
  const height = 56
  const padding = 6

  const safeValues = values.length ? values : [0, 0, 0, 0, 0, 0, 0]
  const max = Math.max(1, ...safeValues)
  const stepX = (width - padding * 2) / Math.max(1, safeValues.length - 1)

  const points = safeValues.map((value, index) => {
    const x = padding + index * stepX
    const y = height - padding - (value / max) * (height - padding * 2)
    return `${x},${y}`
  })

  const area = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className}>
      <defs>
        <linearGradient id="sparkline-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkline-fill)" />
      <polyline
        fill="none"
        points={points.join(' ')}
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}