import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'

export function GoalsPage() {
  return (
    <section className="surface-card p-6 md:p-8 fade-in-up">
      <SectionHeader
        eyebrow="Goals"
        title="Keep daily, weekly, monthly, and career goals in one place."
        description="Use goals to turn project work and skill growth into a clear routine with real progress signals."
        action={<Link to="/dashboard" className="button-secondary px-4 py-2 text-sm">Back to dashboard</Link>}
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="widget-card p-6">
          <p className="section-eyebrow">Current status</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">No goals created yet</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-soft)]">
            Start with one goal tied to a project, certification, or skill so your dashboard can surface a meaningful next step.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/projects" className="button-secondary px-4 py-2 text-sm">Open projects</Link>
            <Link to="/skills" className="button-primary px-4 py-2 text-sm">Open skills</Link>
          </div>
        </div>

        <div className="widget-card widget-card--accent p-6">
          <p className="section-eyebrow">Goal types</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {['Daily Goals', 'Weekly Goals', 'Monthly Goals', 'Career Goals'].map((label) => (
              <div key={label} className="rounded-[1.15rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
                <p className="font-medium text-[var(--color-text)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}