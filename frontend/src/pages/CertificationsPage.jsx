import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'

export function CertificationsPage() {
  return (
    <section className="surface-card p-6 md:p-8 fade-in-up">
      <SectionHeader
        eyebrow="Certifications"
        title="Track credentials with the rest of your workspace."
        description="Store exam progress, credential IDs, renewal dates, and badges here once you start adding certifications."
        action={<Link to="/dashboard" className="button-secondary px-4 py-2 text-sm">Back to dashboard</Link>}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="widget-card p-6">
          <p className="section-eyebrow">Current status</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">No certifications tracked yet</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-soft)]">
            Add a certification to begin tracking provider, progress, exam date, expiration, and credential details.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/skills" className="button-secondary px-4 py-2 text-sm">Review skills</Link>
            <Link to="/profile/edit" className="button-primary px-4 py-2 text-sm">Update profile</Link>
          </div>
        </div>

        <div className="widget-card widget-card--accent p-6">
          <p className="section-eyebrow">Useful next step</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">Capture your first credential</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-soft)]">
            When the module is ready, this area will hold your certification history and renewal reminders.
          </p>
        </div>
      </div>
    </section>
  )
}