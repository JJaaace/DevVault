import { memo, useEffect, useRef } from 'react'

const PARTICLE_COUNT = 58
const LINK_DISTANCE = 150

function createParticles(width, height) {
  return Array.from({ length: PARTICLE_COUNT }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    radius: 0.75 + Math.random() * 1.5,
    glow: 0.3 + Math.random() * 0.6,
  }))
}

function VaultParticleFieldComponent() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return undefined
    }

    let frameId = null
    let particles = []
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let pageVisible = !document.hidden
    const cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false }

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      particles = createParticles(width, height)
    }

    const handleMove = (event) => {
      cursor.x = event.clientX
      cursor.y = event.clientY
      cursor.active = true
    }

    const handleLeave = () => {
      cursor.active = false
    }

    const draw = (timestamp) => {
      frameId = null
      const width = window.innerWidth
      const height = window.innerHeight

      context.clearRect(0, 0, width, height)

      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x <= -30) particle.x = width + 30
        if (particle.x >= width + 30) particle.x = -30
        if (particle.y <= -30) particle.y = height + 30
        if (particle.y >= height + 30) particle.y = -30

        if (cursor.active) {
          const dx = particle.x - cursor.x
          const dy = particle.y - cursor.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 110 && distance > 0) {
            const force = (110 - distance) / 110
            particle.x += (dx / distance) * force * 0.9
            particle.y += (dy / distance) * force * 0.9
          }
        }
      })

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < LINK_DISTANCE) {
            const alpha = (1 - distance / LINK_DISTANCE) * 0.09
            const pulse = 0.6 + 0.4 * Math.sin((timestamp / 1300) + i * 0.3 + j * 0.42)
            context.strokeStyle = `rgba(247, 204, 129, ${(alpha * pulse).toFixed(4)})`
            context.lineWidth = 0.55
            context.beginPath()
            context.moveTo(a.x, a.y)
            context.lineTo(b.x, b.y)
            context.stroke()
          }
        }
      }

      particles.forEach((particle, index) => {
        const pulse = 0.68 + 0.32 * Math.sin((timestamp / 950) + index * 0.47)
        context.fillStyle = `rgba(255, 213, 142, ${(particle.glow * pulse * 0.5).toFixed(4)})`
        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fill()
      })

      if (!reducedMotion && pageVisible) frameId = window.requestAnimationFrame(draw)
    }

    const handleVisibility = () => {
      pageVisible = !document.hidden
      if (pageVisible && !reducedMotion && !frameId) frameId = window.requestAnimationFrame(draw)
      if (!pageVisible && frameId) {
        window.cancelAnimationFrame(frameId)
        frameId = null
      }
    }

    resize()
    if (reducedMotion) draw(0)
    else frameId = window.requestAnimationFrame(draw)

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseleave', handleLeave)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseleave', handleLeave)
      document.removeEventListener('visibilitychange', handleVisibility)

      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="inside-vault-ambient-canvas" aria-hidden="true" />
}

export const VaultParticleField = memo(VaultParticleFieldComponent)
