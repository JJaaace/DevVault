const timelineItems = [
  { year: '2023', title: 'Started coding intentionally', detail: 'Moved from curiosity to consistent project-building habits.' },
  { year: '2024', title: 'Built full-stack momentum', detail: 'Shipped apps with React, Node, and database-backed workflows.' },
  { year: '2025', title: 'Focused on product quality', detail: 'Prioritized UI polish, workflow clarity, and recruiter-ready storytelling.' },
  { year: 'Now', title: 'Scaling DevVault', detail: 'Turning portfolio systems into a personal developer workspace product.' },
]

const principles = [
  'Clarity over complexity. A clean workflow beats clever noise.',
  'Proof over claims. Projects should demonstrate impact, not just intent.',
  'Consistency compounds. Small daily improvements create durable progress.',
]

export function InsideVaultPage() {
  return (
    <div className="page-shell page-shell--wide page-stack pb-14 inside-vault-page">
      <section className="surface-card surface-card--hero px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <p className="section-eyebrow">Inside the Vault</p>
        <h2 className="section-title mt-3 text-4xl md:text-5xl">The developer behind DevVault.</h2>
        <p className="section-copy mt-4 max-w-3xl text-sm leading-7 md:text-base">
          This is the personal layer of DevVault: how I think, what I am building toward, and the systems I use to grow as an engineer.
        </p>
      </section>

      <section className="inside-vault-grid">
        <article className="widget-card p-6 inside-vault-card">
          <p className="section-eyebrow">Who I Am</p>
          <h3 className="inside-vault-title">Builder-first developer</h3>
          <p className="inside-vault-copy">
            I enjoy building practical software that blends technical rigor with clean product experience. I care about architecture, but I care just as much about how fast someone can understand and use what I build.
          </p>
        </article>

        <article className="widget-card p-6 inside-vault-card">
          <p className="section-eyebrow">How I Got Into Programming</p>
          <h3 className="inside-vault-title">Curiosity turned into craft</h3>
          <p className="inside-vault-copy">
            I started by experimenting with small scripts, then progressively built full products that solved problems I actually faced. Shipping projects taught me more than tutorials ever could.
          </p>
        </article>

        <article className="widget-card p-6 inside-vault-card">
          <p className="section-eyebrow">Current Interests</p>
          <h3 className="inside-vault-title">Developer workflows and AI-assisted tools</h3>
          <p className="inside-vault-copy">
            I am currently focused on frontend systems design, backend reliability, and smarter developer tooling that shortens feedback loops without sacrificing quality.
          </p>
        </article>

        <article className="widget-card p-6 inside-vault-card">
          <p className="section-eyebrow">Career Goals</p>
          <h3 className="inside-vault-title">Impactful software engineering roles</h3>
          <p className="inside-vault-copy">
            My goal is to contribute to products where user experience, technical quality, and measurable outcomes all matter. I want to be known for dependable execution and thoughtful design decisions.
          </p>
        </article>
      </section>

      <section className="inside-vault-grid inside-vault-grid--wide">
        <article className="widget-card p-6 inside-vault-card">
          <p className="section-eyebrow">What I am Learning Right Now</p>
          <ul className="inside-vault-list">
            <li>Designing resilient API layers for iterative product growth</li>
            <li>Refining animation systems that feel premium but stay performant</li>
            <li>Building clearer technical narratives for recruiters and teams</li>
          </ul>
        </article>

        <article className="widget-card p-6 inside-vault-card">
          <p className="section-eyebrow">Favorite Technologies</p>
          <div className="inside-vault-chip-row">
            <span className="chip chip--accent">React</span>
            <span className="chip">Node.js</span>
            <span className="chip">PostgreSQL</span>
            <span className="chip">Prisma</span>
            <span className="chip">Python</span>
            <span className="chip">AWS</span>
          </div>
        </article>
      </section>

      <section className="inside-vault-grid inside-vault-grid--wide">
        <article className="widget-card p-6 inside-vault-card">
          <p className="section-eyebrow">Current Workspace</p>
          <p className="inside-vault-copy">
            DevVault itself is my active command center. I track projects, skill evolution, deadlines, and resume assets in one place so I can present my growth with precision.
          </p>
        </article>

        <article className="widget-card p-6 inside-vault-card">
          <p className="section-eyebrow">Philosophy on Building Software</p>
          <ul className="inside-vault-list">
            {principles.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="widget-card p-6 inside-vault-card">
        <p className="section-eyebrow">Timeline of Growth</p>
        <div className="inside-vault-timeline">
          {timelineItems.map((item) => (
            <div key={item.year} className="inside-vault-timeline-item">
              <div className="inside-vault-timeline-year">{item.year}</div>
              <div>
                <h3 className="inside-vault-title">{item.title}</h3>
                <p className="inside-vault-copy">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
