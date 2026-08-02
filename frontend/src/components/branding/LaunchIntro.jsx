import { useEffect, useMemo, useRef, useState } from 'react'
import { DevVaultLogo } from './DevVaultLogo'

const INTRO_STORAGE_PREFIX = 'devvault-intro-session:'
const INTRO_PRESETS = {
  cinematic: {
    particleCount: 34,
    particleStepMs: 136,
    mergeMs: 1680,
    burstLeadMs: 320,
    burstTailMs: 980,
    floatDurationMs: 5400,
    logoGrowthPerParticle: 0.0062,
    burstScale: 1.42,
  },
  snappy: {
    particleCount: 38,
    particleStepMs: 68,
    mergeMs: 820,
    burstLeadMs: 120,
    burstTailMs: 560,
    floatDurationMs: 3600,
    logoGrowthPerParticle: 0.0065,
    burstScale: 1.22,
  },
}

// Switch to 'snappy' for a faster feel.
const ACTIVE_INTRO_PRESET = 'cinematic'

function buildParticleSpecs(particleCount, particleStepMs) {
  return Array.from({ length: particleCount }).map((_, index) => {
    const top = 4 + ((index * 29) % 92)
    const left = 4 + ((index * 47) % 92)
    const centerDistance = Math.abs(top - 50) + Math.abs(left - 50)
    const normalizedTop = centerDistance < 16 ? Math.min(96, top + 14) : top
    const normalizedLeft = centerDistance < 16 ? Math.max(4, left - 12) : left
    const floatX = ((index % 2 === 0 ? 1 : -1) * (6 + ((index * 7) % 10)))
    const floatY = ((index % 3 === 0 ? -1 : 1) * (7 + ((index * 11) % 12)))

    return {
      id: index,
      top: `${normalizedTop}%`,
      left: `${normalizedLeft}%`,
      floatX: `${floatX}px`,
      floatY: `${floatY}px`,
      delay: index * particleStepMs,
    }
  })
}

function getBrowserSessionId() {
  if (typeof window === 'undefined') {
    return ''
  }

  if (!window.name || !window.name.startsWith('devvault-session-')) {
    window.name = `devvault-session-${Math.random().toString(36).slice(2, 10)}`
  }

  return window.name
}

export function LaunchIntro() {
  const preset = INTRO_PRESETS[ACTIVE_INTRO_PRESET] || INTRO_PRESETS.cinematic
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [absorbedCount, setAbsorbedCount] = useState(0)
  const [burst, setBurst] = useState(false)
  const [hidden, setHidden] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    const sessionId = getBrowserSessionId()
    if (!sessionId) {
      return false
    }

    return window.localStorage.getItem(`${INTRO_STORAGE_PREFIX}${sessionId}`) === '1'
  })
  const particles = useMemo(() => buildParticleSpecs(preset.particleCount, preset.particleStepMs), [preset.particleCount, preset.particleStepMs])
  const absorbIntervalRef = useRef(null)
  const burstTimerRef = useRef(null)
  const hideTimerRef = useRef(null)

  useEffect(() => {
    if (hidden) {
      return
    }

    const showTimer = window.setTimeout(() => {
      setVisible(true)
    }, 90)

    return () => {
      window.clearTimeout(showTimer)
    }
  }, [hidden])

  useEffect(() => () => {
    if (absorbIntervalRef.current) {
      window.clearInterval(absorbIntervalRef.current)
    }
    if (burstTimerRef.current) {
      window.clearTimeout(burstTimerRef.current)
    }
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  const handleEnter = () => {
    if (hidden || exiting) {
      return
    }

    const sessionId = getBrowserSessionId()
    if (sessionId) {
      window.localStorage.setItem(`${INTRO_STORAGE_PREFIX}${sessionId}`, '1')
    }

    setExiting(true)
    setAbsorbedCount(0)

    absorbIntervalRef.current = window.setInterval(() => {
      setAbsorbedCount((current) => {
        const next = current + 1
        if (next >= preset.particleCount) {
          if (absorbIntervalRef.current) {
            window.clearInterval(absorbIntervalRef.current)
            absorbIntervalRef.current = null
          }
          setBurst(true)
        }
        return Math.min(next, preset.particleCount)
      })
    }, preset.particleStepMs)

    burstTimerRef.current = window.setTimeout(() => {
      setBurst(true)
    }, preset.particleCount * preset.particleStepMs + preset.burstLeadMs)

    hideTimerRef.current = window.setTimeout(() => {
      setHidden(true)
    }, preset.particleCount * preset.particleStepMs + preset.mergeMs + preset.burstTailMs)
  }

  if (hidden) {
    return null
  }

  return (
    <button
      type="button"
      className={`launch-intro ${visible ? 'launch-intro--visible' : 'launch-intro--exit'} ${exiting ? 'launch-intro--exiting' : ''}`}
      onClick={handleEnter}
      aria-label="Enter DevVault"
      style={{
        '--intro-float-duration': `${preset.floatDurationMs}ms`,
        '--intro-merge-duration': `${preset.mergeMs}ms`,
        '--intro-logo-burst-scale': String(preset.burstScale),
      }}
    >
      <div className="launch-intro-grid" />
      <div className="launch-intro-vignette" />
      <div className="launch-intro-noise" />
      <div className={`launch-intro-flash ${burst ? 'launch-intro-flash--active' : ''}`} />
      <div className="launch-intro-particles" aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="launch-intro-particle"
            style={{
              '--start-top': particle.top,
              '--start-left': particle.left,
              '--float-x': particle.floatX,
              '--float-y': particle.floatY,
              '--particle-delay': `${particle.delay}ms`,
            }}
          />
        ))}
      </div>
      <div className={`launch-intro-content ${exiting ? 'launch-intro-content--exiting' : ''}`.trim()}>
        <div
          className={`launch-intro-logo ${exiting ? 'launch-intro-logo--focus' : ''} ${burst ? 'launch-intro-logo--burst' : ''}`.trim()}
          style={{ '--logo-growth': `${1 + absorbedCount * preset.logoGrowthPerParticle}` }}
        >
          <DevVaultLogo size="xl" compact />
        </div>
        <p className="launch-intro-subtitle">Jace Joseph</p>
        <p className="launch-intro-message">Developer portfolio workspace</p>
        <p className="launch-intro-cta">Click anywhere to enter DevVault</p>
      </div>
    </button>
  )
}
