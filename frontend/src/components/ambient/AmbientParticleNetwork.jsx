import { memo, useEffect, useRef } from 'react'

const PARTICLE_COUNT = 34
const LINK_DISTANCE = 110

function createParticles(width, height) {
  return Array.from({ length: PARTICLE_COUNT }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    radius: 0.7 + Math.random() * 1.3,
    glow: 0.25 + Math.random() * 0.5,
  }))
}

function AmbientParticleNetworkComponent() {
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

    let animationFrame = null
    let particles = []
    let pageVisible = !document.hidden
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

    const draw = (timestamp) => {
      animationFrame = null
      const width = window.innerWidth
      const height = window.innerHeight

      context.clearRect(0, 0, width, height)

      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x <= -20) particle.x = width + 20
        if (particle.x >= width + 20) particle.x = -20
        if (particle.y <= -20) particle.y = height + 20
        if (particle.y >= height + 20) particle.y = -20
      })

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < LINK_DISTANCE) {
            const baseAlpha = (1 - distance / LINK_DISTANCE) * 0.06
            const pulse = 0.5 + 0.5 * Math.sin((timestamp / 1300) + i * 0.7 + j * 0.4)
            const alpha = baseAlpha * pulse

            context.strokeStyle = `rgba(247, 204, 129, ${alpha.toFixed(4)})`
            context.lineWidth = 0.45
            context.beginPath()
            context.moveTo(a.x, a.y)
            context.lineTo(b.x, b.y)
            context.stroke()
          }
        }
      }

      particles.forEach((particle) => {
        const pulse = 0.65 + 0.35 * Math.sin((timestamp / 1100) + particle.x * 0.01)
        context.fillStyle = `rgba(247, 204, 129, ${(particle.glow * pulse * 0.42).toFixed(4)})`
        context.beginPath()
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        context.fill()
      })

      if (!reducedMotion && pageVisible) {
        animationFrame = window.requestAnimationFrame(draw)
      }
    }

    const handleVisibility = () => {
      pageVisible = !document.hidden
      if (pageVisible && !reducedMotion && !animationFrame) animationFrame = window.requestAnimationFrame(draw)
      if (!pageVisible && animationFrame) {
        window.cancelAnimationFrame(animationFrame)
        animationFrame = null
      }
    }

    const handleResize = () => {
      resize()
      if (reducedMotion) draw(0)
    }

    resize()
    if (reducedMotion) draw(0)
    else animationFrame = window.requestAnimationFrame(draw)
    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="ambient-particle-network" aria-hidden="true" />
}

export const AmbientParticleNetwork = memo(AmbientParticleNetworkComponent)
