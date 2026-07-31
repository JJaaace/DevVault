import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchPublicPortfolio } from '../lib/portfolioApi'
import { ResumeDocument } from '../components/resume/ResumeDocument'

export function ResumePage() {
  const { username } = useParams()
  const [searchParams] = useSearchParams()
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const autoPrintedRef = useRef(false)

  useEffect(() => {
    async function loadResume() {
      try {
        const data = await fetchPublicPortfolio(username)
        setPortfolio(data)
      } catch (err) {
        setError(err.message || 'Unable to load resume.')
      } finally {
        setLoading(false)
      }
    }

    loadResume()
  }, [username])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  useEffect(() => {
    if (loading || error || !portfolio?.profile || autoPrintedRef.current) {
      return
    }

    if (searchParams.get('print') === '1') {
      autoPrintedRef.current = true
      window.setTimeout(() => {
        window.print()
      }, 250)
    }
  }, [error, loading, portfolio, searchParams])

  if (loading) {
    return <div className="page-shell page-shell--wide page-stack pb-14"><div className="widget-card p-8 text-sm text-[var(--color-text-soft)]">Loading resume...</div></div>
  }

  if (error || !portfolio?.profile) {
    return (
      <div className="page-shell page-shell--wide page-stack pb-14">
        <section className="surface-card p-6 md:p-8">
          <h1 className="section-title text-3xl">Resume unavailable</h1>
          <p className="mt-3 text-sm text-[var(--color-text-soft)]">{error || 'This resume link does not match a portfolio yet.'}</p>
          <div className="mt-6 flex gap-3">
            <Link to="/login" className="button-secondary px-4 py-2 text-sm">Return to DevVault</Link>
            <Link to={`/portfolio/${username}`} className="button-primary px-4 py-2 text-sm">Open portfolio</Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <ResumeDocument
      profile={portfolio.profile}
      projects={portfolio.projects || []}
      skills={portfolio.skills || []}
      onPrint={handlePrint}
      publicMode
    />
  )
}