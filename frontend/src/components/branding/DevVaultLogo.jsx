export function DevVaultLogo({ compact = false, size = 'md' }) {
  const shellSize = size === 'xl' ? 'h-16 w-16' : size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const iconSize = size === 'xl' ? 'h-10 w-10' : size === 'lg' ? 'h-7 w-7' : size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'

  return (
    <div className={`devvault-logo ${compact ? 'devvault-logo--compact' : ''}`.trim()}>
      <div className={`devvault-logo-mark ${shellSize}`.trim()} aria-hidden="true">
        <svg viewBox="0 0 96 96" className={iconSize} role="img" aria-label="DevVault logo mark">
          <defs>
            <linearGradient id="dv-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd78d" />
              <stop offset="55%" stopColor="#f0a84a" />
              <stop offset="100%" stopColor="#e0772f" />
            </linearGradient>
          </defs>
          <path d="M48 8 16 24v24c0 22 13 34 32 40 19-6 32-18 32-40V24L48 8Z" fill="url(#dv-gradient)" />
          <path d="M30 36h36M36 48h24M42 60h12" stroke="#1b0f06" strokeWidth="6" strokeLinecap="round" />
          <path d="M22 30h16l10 10h26" stroke="#fff6dc" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9" />
        </svg>
      </div>
      {compact ? null : (
        <div className="devvault-logo-copy">
          <p className="devvault-logo-kicker">Developer Portfolio OS</p>
          <p className="devvault-logo-wordmark">DevVault</p>
        </div>
      )}
    </div>
  )
}
