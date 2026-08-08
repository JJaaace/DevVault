import { DashboardCard } from '../DashboardCard'

function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function Section({ title, children, eyebrow }) {
  return (
    <section className="resume-section">
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function ResumeTagList({ items = [] }) {
  if (!items.length) {
    return null
  }

  return (
    <div className="resume-tag-list">
      {items.map((item) => (
        <span key={item} className="resume-tag">
          {item}
        </span>
      ))}
    </div>
  )
}

export function ResumeDocument({ profile, projects = [], skills = [], certifications = [], onPrint, publicMode = false }) {
  if (!profile) {
    return null
  }

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username
  const headline = [profile.currentRole, profile.location].filter(Boolean).join(' · ')
  const sortedProjects = [...projects].sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
  const sortedSkills = [...skills].sort((left, right) => {
    const yearsDelta = Number(right.yearsExperience || 0) - Number(left.yearsExperience || 0)
    if (yearsDelta !== 0) {
      return yearsDelta
    }

    return Number(right.projectsBuilt || 0) - Number(left.projectsBuilt || 0)
  })

  return (
    <div className="resume-page">
      <div className="resume-toolbar no-print">
        <DashboardCard title="Print-ready resume" description="Use your browser's print dialog to save this as a PDF." className="resume-toolbar-card">
          <div className="flex flex-wrap gap-3">
            {onPrint ? (
              <button type="button" onClick={onPrint} className="button-primary px-4 py-2 text-sm">
                Print / Save PDF
              </button>
            ) : null}
            {publicMode ? null : <span className="chip chip--accent">Private workspace version</span>}
          </div>
        </DashboardCard>
      </div>

      <article className="resume-sheet">
        <header className="resume-header">
          <div>
            <p className="section-eyebrow">DevVault Resume</p>
            <h1>{fullName}</h1>
            {headline ? <p className="resume-headline">{headline}</p> : null}
          </div>

          <div className="resume-meta">
            {profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a> : null}
            {profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}
            {profile.websiteUrl ? <a href={profile.websiteUrl} target="_blank" rel="noreferrer">Website</a> : null}
          </div>
        </header>

        <div className="resume-grid">
          <div className="resume-main">
            <Section eyebrow="Summary" title="Profile summary">
              <p>{profile.bio || 'Add a short summary in DevVault to populate this section.'}</p>
            </Section>

            <Section eyebrow="Projects" title="Selected projects">
              <div className="resume-list">
                {sortedProjects.length ? sortedProjects.slice(0, 6).map((project) => (
                  <div key={project.id} className="resume-item">
                    <div className="resume-item-header">
                      <h3>{project.title}</h3>
                      <span>{project.status?.replace(/_/g, ' ') || 'PLANNING'}</span>
                    </div>
                    <p className="resume-muted">
                      {[project.status?.replace(/_/g, ' '), project.targetCompletion ? `Target ${formatDate(project.targetCompletion)}` : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {project.description ? <p>{project.description}</p> : null}
                    {project.techStack?.length ? <ResumeTagList items={project.techStack} /> : null}
                  </div>
                )) : <p className="resume-muted">No projects yet.</p>}
              </div>
            </Section>
          </div>

          <aside className="resume-aside">
            <Section eyebrow="Highlights" title="Core details">
              <dl className="resume-facts">
                {profile.username ? <><dt>Username</dt><dd>@{profile.username}</dd></> : null}
                {profile.currentRole ? <><dt>Role</dt><dd>{profile.currentRole}</dd></> : null}
                {profile.school || profile.university ? <><dt>School</dt><dd>{profile.school || profile.university}</dd></> : null}
                {profile.major ? <><dt>Major</dt><dd>{profile.major}</dd></> : null}
                {profile.graduationYear ? <><dt>Graduation</dt><dd>{profile.graduationYear}</dd></> : null}
                {profile.yearsCoding !== null && profile.yearsCoding !== undefined && profile.yearsCoding !== '' ? <><dt>Experience</dt><dd>{profile.yearsCoding} years coding</dd></> : null}
              </dl>
            </Section>

            <Section eyebrow="Skills" title="Strongest skills">
              <div className="resume-list">
                {sortedSkills.length ? sortedSkills.slice(0, 8).map((skill) => (
                  <div key={skill.id} className="resume-item">
                    <div className="resume-item-header">
                      <h3>{skill.name}</h3>
                      <span>{skill.yearsExperience || 0}y</span>
                    </div>
                    <p className="resume-muted">{[skill.category, skill.experienceLevel, skill.projectsBuilt !== undefined ? `${skill.projectsBuilt} projects` : ''].filter(Boolean).join(' · ')}</p>
                    {skill.notes ? <p>{skill.notes}</p> : null}
                  </div>
                )) : <p className="resume-muted">No skills yet.</p>}
              </div>
            </Section>

            <Section eyebrow="Links" title="Contact links">
              <div className="resume-links">
                {profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer">GitHub</a> : null}
                {profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}
                {profile.websiteUrl ? <a href={profile.websiteUrl} target="_blank" rel="noreferrer">Website</a> : null}
              </div>
            </Section>

            {certifications.length ? (
              <Section eyebrow="Credentials" title="Certifications">
                <div className="resume-list">
                  {certifications.slice(0, 6).map((certification) => (
                    <div key={certification.id} className="resume-item">
                      <div className="resume-item-header">
                        <h3>{certification.name}</h3>
                        <span>{certification.year}</span>
                      </div>
                      <p className="resume-muted">{certification.provider} · {certification.status.replace('-', ' ')}</p>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}
          </aside>
        </div>
      </article>
    </div>
  )
}
