import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'

const CERTIFICATIONS_STORAGE_KEY = 'devvault.certifications.collection.v2'
const CERTIFICATIONS_PINNED_STORAGE_KEY = 'devvault.certifications.pinned.v2'
const CERTIFICATIONS_ROADMAP_STORAGE_KEY = 'devvault.certifications.roadmap.v2'

const INITIAL_CERTIFICATIONS = [
  {
    id: 'github-foundations',
    name: 'GitHub Foundations',
    organization: 'GitHub',
    provider: 'GitHub',
    status: 'earned',
    issueDate: '2026-03-14',
    year: 2026,
    credentialId: 'GHF-2026-1148',
    credentialUrl: 'https://www.credly.com/',
    verifyUrl: 'https://www.credly.com/',
    logo: '🐙',
    skillsGained: ['GitHub', 'Git', 'Collaboration', 'Workflow Automation'],
    technologies: ['GitHub', 'Git', 'DevOps', 'Automation'],
    associatedProjects: ['DevVault', 'Portfolio Site'],
    notes: 'A foundation in modern repository workflows, collaboration, and developer productivity.',
    featured: true,
  },
  {
    id: 'intro-to-apis',
    name: 'Introduction to APIs',
    organization: 'Postman',
    provider: 'Postman',
    status: 'earned',
    issueDate: '2026-05-11',
    year: 2026,
    credentialId: 'API-2026-3391',
    credentialUrl: 'https://www.postman.com/',
    verifyUrl: 'https://www.postman.com/',
    logo: '↗',
    skillsGained: ['REST APIs', 'HTTP', 'JSON', 'API Testing'],
    technologies: ['REST APIs', 'HTTP', 'JSON', 'Node.js'],
    associatedProjects: ['DevVault', 'Project APIs'],
    notes: 'Strengthened how I design and inspect API contracts for real product work.',
    featured: true,
  },
  {
    id: 'aws-cloud-practitioner',
    name: 'AWS Cloud Practitioner',
    organization: 'Amazon Web Services',
    provider: 'AWS',
    status: 'in-progress',
    issueDate: null,
    year: 2026,
    credentialId: null,
    credentialUrl: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
    verifyUrl: 'https://aws.amazon.com/certification/',
    logo: '☁',
    skillsGained: ['AWS', 'Cloud Computing', 'IAM', 'EC2', 'S3'],
    technologies: ['AWS', 'IAM', 'EC2', 'S3', 'Networking'],
    associatedProjects: ['Cloud Cost Budget Tracker'],
    notes: 'Currently building comfort with the language of cloud architecture and delivery.',
    featured: true,
  },
  {
    id: 'google-cybersecurity',
    name: 'Google Cybersecurity Certificate',
    organization: 'Google',
    provider: 'Google',
    status: 'earned',
    issueDate: '2026-05-11',
    year: 2026,
    credentialId: 'GCS-2026-8812',
    credentialUrl: 'https://www.coursera.org/',
    verifyUrl: 'https://www.coursera.org/',
    logo: '🛡',
    skillsGained: ['Security Fundamentals', 'Risk Awareness', 'Threat Analysis'],
    technologies: ['Security', 'Networking', 'Linux', 'IAM'],
    associatedProjects: ['DevVault'],
    notes: 'Useful for strengthening a security-minded approach to modern application design.',
  },
  {
    id: 'security-plus',
    name: 'Security+',
    organization: 'CompTIA',
    provider: 'CompTIA',
    status: 'planned',
    issueDate: null,
    year: 2027,
    credentialId: null,
    credentialUrl: 'https://www.comptia.org/certifications/security',
    verifyUrl: 'https://www.comptia.org/certifications/security',
    logo: '🔒',
    skillsGained: ['Security Operations', 'Threat Modeling', 'Access Control'],
    technologies: ['Security', 'IAM', 'Networking'],
    associatedProjects: ['DevVault'],
    notes: 'A next step toward deeper security literacy and stronger system design judgment.',
  },
  {
    id: 'aws-solutions-architect',
    name: 'AWS Solutions Architect',
    organization: 'Amazon Web Services',
    provider: 'AWS',
    status: 'planned',
    issueDate: null,
    year: 2027,
    credentialId: null,
    credentialUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
    verifyUrl: 'https://aws.amazon.com/certification/',
    logo: '🏗',
    skillsGained: ['Architecture', 'Scalability', 'Reliability'],
    technologies: ['AWS', 'EC2', 'S3', 'Networking', 'IAM'],
    associatedProjects: ['Cloud Cost Budget Tracker'],
    notes: 'Targets the design side of cloud computing and real-world deployment decisions.',
  },
  {
    id: 'terraform-associate',
    name: 'Terraform Associate',
    organization: 'HashiCorp',
    provider: 'HashiCorp',
    status: 'planned',
    issueDate: null,
    year: 2028,
    credentialId: null,
    credentialUrl: 'https://www.hashicorp.com/certification/terraform-associate',
    verifyUrl: 'https://www.hashicorp.com/certification/terraform-associate',
    logo: '⬢',
    skillsGained: ['Infrastructure as Code', 'Provisioning', 'Automation'],
    technologies: ['Terraform', 'AWS', 'DevOps'],
    associatedProjects: ['Cloud Cost Budget Tracker'],
    notes: 'Would help make cloud environments more repeatable and professional.',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    organization: 'CNCF',
    provider: 'CNCF',
    status: 'planned',
    issueDate: null,
    year: 2028,
    credentialId: null,
    credentialUrl: 'https://www.cncf.io/training/certification/',
    verifyUrl: 'https://www.cncf.io/training/certification/',
    logo: '☸',
    skillsGained: ['Containers', 'Orchestration', 'Scaling'],
    technologies: ['Kubernetes', 'Docker', 'Cloud'],
    associatedProjects: ['DevVault'],
    notes: 'Reserved for the later cloud architecture chapter of my roadmap.',
  },
  {
    id: 'jpmorgan-ccb-excel-2026',
    name: 'J.P. Morgan CCB Fellowship – Excel Training 2026',
    organization: 'Consumer & Community Banking (CCB)',
    provider: 'JPMorgan Chase & Co.',
    status: 'earned',
    issueDate: null,
    year: 2026,
    credentialId: null,
    credentialUrl: '',
    verifyUrl: '',
    logo: '🏦',
    accentColor: '#8C6A2B',
    skillsGained: ['Microsoft Excel', 'Spreadsheet Analysis', 'Data Organization', 'Formulas & Functions', 'Business Reporting', 'Data Analysis', 'Professional Productivity'],
    technologies: ['Microsoft Excel', 'Microsoft 365'],
    associatedProjects: [],
    notes: 'Completed Excel training through the JPMorgan Chase Consumer & Community Banking (CCB) Fellowship. Strengthened practical spreadsheet skills including formulas, data organization, business reporting, and data analysis used in professional business environments.',
    featured: false,
  },
  {
    id: 'excel-2019-introductory',
    name: 'Microsoft Excel 2019 Introductory',
    organization: 'Pearson Higher Education',
    provider: 'Pearson Higher Education',
    status: 'earned',
    issueDate: '2025-07-04',
    year: 2025,
    credentialId: null,
    credentialUrl: '',
    verifyUrl: '',
    logo: '📊',
    accentColor: '#217346',
    skillsGained: ['Microsoft Excel', 'Spreadsheet Fundamentals', 'Formatting', 'Charts', 'Basic Formulas', 'Data Organization'],
    technologies: ['Microsoft Excel', 'Microsoft 365'],
    associatedProjects: [],
    notes: 'Completed introductory Microsoft Excel training covering spreadsheet fundamentals, formulas, formatting, data organization, charts, and core productivity features.',
    featured: false,
  },
  {
    id: 'powerpoint-2019-introductory',
    name: 'Microsoft PowerPoint 2019 Introductory',
    organization: 'Pearson Higher Education',
    provider: 'Pearson Higher Education',
    status: 'earned',
    issueDate: '2025-07-24',
    year: 2025,
    credentialId: null,
    credentialUrl: '',
    verifyUrl: '',
    logo: '📽',
    accentColor: '#D24726',
    skillsGained: ['Microsoft PowerPoint', 'Presentation Design', 'Layouts', 'Animations', 'Professional Communication', 'Visual Storytelling'],
    technologies: ['Microsoft PowerPoint', 'Microsoft 365'],
    associatedProjects: [],
    notes: 'Completed introductory Microsoft PowerPoint training covering professional presentations, layouts, themes, animations, transitions, and presentation design best practices.',
    featured: false,
  },
  {
    id: 'word-2019-introductory',
    name: 'Microsoft Word 2019 Introductory',
    organization: 'Pearson Higher Education',
    provider: 'Pearson Higher Education',
    status: 'earned',
    issueDate: '2025-06-23',
    year: 2025,
    credentialId: null,
    credentialUrl: '',
    verifyUrl: '',
    logo: '📝',
    accentColor: '#185ABD',
    skillsGained: ['Microsoft Word', 'Document Formatting', 'Professional Documents', 'Page Layout', 'Tables', 'Styles'],
    technologies: ['Microsoft Word', 'Microsoft 365'],
    associatedProjects: [],
    notes: 'Completed introductory Microsoft Word training covering document creation, formatting, page layouts, styles, tables, and professional document design.',
    featured: false,
  },
]

const INITIAL_ROADMAP = [
  { year: 2025, status: 'complete', title: 'Microsoft Word 2019 Introductory' },
  { year: 2025, status: 'complete', title: 'Microsoft Excel 2019 Introductory' },
  { year: 2025, status: 'complete', title: 'Microsoft PowerPoint 2019 Introductory' },
  { year: 2026, status: 'complete', title: 'GitHub Foundations' },
  { year: 2026, status: 'complete', title: 'Introduction to APIs' },
  { year: 2026, status: 'complete', title: 'J.P. Morgan CCB Fellowship – Excel Training' },
  { year: 2026, status: 'current', title: 'AWS Cloud Practitioner' },
  { year: 2027, status: 'future', title: 'Security+' },
  { year: 2027, status: 'future', title: 'AWS Solutions Architect' },
  { year: 2028, status: 'future', title: 'Terraform Associate' },
  { year: 2028, status: 'future', title: 'Kubernetes' },
]

const statusMeta = {
  earned: {
    label: 'Completed',
    chipClass: 'border-[rgba(247,204,129,0.44)] bg-[rgba(73,50,30,0.88)] text-[var(--color-brand-ink)]',
    glowClass: 'shadow-[0_18px_42px_rgba(196,113,44,0.28)]',
  },
  'in-progress': {
    label: 'In Progress',
    chipClass: 'border-[rgba(231,155,63,0.42)] bg-[rgba(69,44,24,0.84)] text-[var(--color-brand-ink)]',
    glowClass: 'shadow-[0_18px_42px_rgba(207,121,50,0.24)]',
  },
  planned: {
    label: 'Planned',
    chipClass: 'border-[rgba(200,145,84,0.34)] bg-[rgba(56,40,26,0.78)] text-[var(--color-text-soft)]',
    glowClass: 'shadow-[0_18px_34px_rgba(18,12,8,0.2)]',
  },
}

function formatDate(value) {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function formatRoadmapLine(item) {
  return `${item.status}|${item.year}|${item.title}`
}

function parseRoadmapText(text) {
  return String(text || '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status = 'future', year = '2026', ...rest] = line.split('|')
      return {
        status: ['complete', 'current', 'future'].includes(status.trim()) ? status.trim() : 'future',
        year: Number(year) || new Date().getFullYear(),
        title: rest.join('|').trim() || 'Untitled certification',
      }
    })
}

function parseTextList(value) {
  return String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Unable to read file.'))
    reader.readAsDataURL(file)
  })
}

function inferAssetType(assetUrl, fallbackType) {
  if (fallbackType === 'pdf' || fallbackType === 'image') {
    return fallbackType
  }

  if (typeof assetUrl !== 'string') {
    return null
  }

  if (assetUrl.startsWith('data:application/pdf')) {
    return 'pdf'
  }

  if (assetUrl.startsWith('data:image/')) {
    return 'image'
  }

  return null
}

function hydrateCert(cert, index) {
  const assetUrl = cert.assetUrl || cert.pdfUrl || null
  return {
    ...cert,
    displayOrder: cert.displayOrder ?? index ?? 0,
    assetUrl,
    assetType: inferAssetType(assetUrl, cert.assetType || (cert.pdfUrl ? 'pdf' : null)),
    assetName: cert.assetName || cert.pdfName || '',
  }
}

function createInitialCertifications() {
  return INITIAL_CERTIFICATIONS.map((cert, index) => hydrateCert(cert, index))
}

// merge any seeded certs not yet present in the persisted list
function mergeSeededCertifications(persisted) {
  const existingIds = new Set(persisted.map((cert) => cert.id))
  const missing = INITIAL_CERTIFICATIONS
    .filter((cert) => !existingIds.has(cert.id))
    .map((cert, index) => hydrateCert(cert, persisted.length + index))
  return [...persisted, ...missing]
}

function loadPersistedJson(key) {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return null
    }
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function createCertificationId(name) {
  const slug = String(name || 'certification')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return `${slug || 'certification'}-${Date.now()}`
}

function CertReorderModal({ certifications, onSave, onClose }) {
  const [items, setItems] = useState(() =>
    [...certifications].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
  )

  const move = (index, direction) => {
    setItems((current) => {
      const next = [...current]
      const target = index + direction
      if (target < 0 || target >= next.length) {
        return current
      }
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(25,16,10,0.72)] px-4 py-6 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flex max-h-[calc(100vh-2.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.8rem] border border-[rgba(247,204,129,0.24)] bg-[rgba(29,21,15,0.96)] shadow-[0_30px_90px_rgba(9,6,4,0.54)]"
        initial={{ y: 20, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 16, scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(214,160,89,0.18)] bg-[rgba(39,29,20,0.9)] px-6 py-5">
          <div>
            <p className="section-eyebrow">Reorder Certifications</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">Set the order for the gallery</h3>
          </div>
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Close</button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-6">
          {items.map((cert, index) => (
            <div
              key={cert.id}
              className="flex items-center gap-4 rounded-[1.2rem] border border-[rgba(214,160,89,0.18)] bg-[rgba(24,17,12,0.84)] px-4 py-3"
            >
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-[rgba(214,160,89,0.2)] bg-[rgba(40,29,20,0.8)] text-xs text-[var(--color-text-muted)]">
                {index + 1}
              </span>
              <div
                className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-[0.8rem] text-lg"
                style={cert.accentColor ? { background: `color-mix(in srgb, ${cert.accentColor} 22%, rgba(63,43,27,0.9))` } : { background: 'rgba(63,43,27,0.9)' }}
              >
                {cert.logo}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-text)]">{cert.name}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{cert.provider} · {cert.year}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="grid h-8 w-8 place-items-center rounded-[0.7rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(40,29,20,0.7)] text-sm text-[var(--color-text-soft)] transition hover:bg-[rgba(60,43,28,0.9)] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  className="grid h-8 w-8 place-items-center rounded-[0.7rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(40,29,20,0.7)] text-sm text-[var(--color-text-soft)] transition hover:bg-[rgba(60,43,28,0.9)] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[rgba(214,160,89,0.18)] px-6 py-5">
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Cancel</button>
          <button
            type="button"
            onClick={() => onSave(items.map((cert, index) => ({ ...cert, displayOrder: index })))}
            className="button-primary px-4 py-2 text-sm"
          >
            Save order
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatTile({ icon, label, value, note }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className="rounded-[1.4rem] border border-[rgba(214,160,89,0.22)] bg-[linear-gradient(145deg,rgba(49,35,25,0.9),rgba(36,27,20,0.84))] p-4 shadow-[0_18px_34px_rgba(18,12,8,0.26)]"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-[1rem] border border-[rgba(247,204,129,0.28)] bg-[rgba(64,44,28,0.82)] text-lg text-[var(--color-brand-ink)] shadow-[0_10px_24px_rgba(14,10,7,0.24)]">
          {icon}
        </div>
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p>
        </div>
      </div>
      {note ? <p className="mt-3 text-sm leading-6 text-[var(--color-text-soft)]">{note}</p> : null}
    </motion.div>
  )
}

function CertificationModal({ cert, onClose }) {
  const hasAsset = Boolean(cert?.assetUrl)
  const isPdf = cert?.assetType === 'pdf'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(25,16,10,0.72)] px-4 py-6 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-5xl overflow-hidden rounded-[1.8rem] border border-[rgba(247,204,129,0.24)] bg-[rgba(29,21,15,0.96)] shadow-[0_30px_90px_rgba(9,6,4,0.54)]"
        initial={{ y: 20, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 16, scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(214,160,89,0.18)] bg-[rgba(39,29,20,0.9)] px-6 py-5">
          <div>
            <p className="section-eyebrow">Certificate Preview</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{cert.name}</h3>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">{cert.organization}</p>
          </div>
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Close</button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-h-[34rem] overflow-hidden rounded-[1.4rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(18,13,10,0.92)] p-3">
            {hasAsset ? (
              isPdf ? (
                <iframe
                  src={cert.assetUrl}
                  title={`${cert.name} PDF preview`}
                  className="h-[32rem] w-full rounded-[1.1rem] bg-black/30"
                />
              ) : (
                <img
                  src={cert.assetUrl}
                  alt={`${cert.name} certificate`}
                  className="h-[32rem] w-full rounded-[1.1rem] object-contain bg-black/30"
                />
              )
            ) : (
              <div className="grid h-[32rem] place-items-center rounded-[1.1rem] border border-dashed border-[rgba(214,160,89,0.24)] bg-[rgba(42,31,23,0.7)] text-sm text-[var(--color-text-soft)]">
                Upload a certificate image or PDF to preview it here.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.35rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(47,35,25,0.82)] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Details</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--color-text-muted)]">Issue date</dt>
                  <dd className="text-[var(--color-text)]">{formatDate(cert.issueDate)}</dd>
                </div>
                {cert.credentialId ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--color-text-muted)]">Credential ID</dt>
                    <dd className="text-[var(--color-text)]">{cert.credentialId}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[var(--color-text-muted)]">Provider</dt>
                  <dd className="text-[var(--color-text)]">{cert.provider}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[1.35rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(47,35,25,0.82)] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Skills gained</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cert.skillsGained.map((skill) => (
                  <span key={skill} className="chip chip--accent">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {cert.credentialUrl ? <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="button-secondary px-4 py-2 text-sm">Open Source</a> : null}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function CertificationEditorModal({ cert, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    name: cert?.name || '',
    organization: cert?.organization || '',
    provider: cert?.provider || '',
    status: cert?.status || 'planned',
    issueDate: cert?.issueDate || '',
    year: String(cert?.year || new Date().getFullYear()),
    credentialId: cert?.credentialId || '',
    credentialUrl: cert?.credentialUrl || '',
    verifyUrl: cert?.verifyUrl || '',
    logo: cert?.logo || '🏆',
    notes: cert?.notes || '',
    skillsGainedText: (cert?.skillsGained || []).join('\n'),
    technologiesText: (cert?.technologies || []).join('\n'),
    associatedProjectsText: (cert?.associatedProjects || []).join('\n'),
  }))

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(25,16,10,0.72)] px-4 py-6 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="flex max-h-[calc(100vh-2.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[1.8rem] border border-[rgba(247,204,129,0.24)] bg-[rgba(29,21,15,0.96)] shadow-[0_30px_90px_rgba(9,6,4,0.54)]"
        initial={{ y: 20, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 16, scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(214,160,89,0.18)] bg-[rgba(39,29,20,0.9)] px-6 py-5">
          <div>
            <p className="section-eyebrow">{cert ? 'Edit Certificate' : 'Add Certificate'}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{cert ? cert.name : 'Create a new certification entry'}</h3>
          </div>
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Close</button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-6 lg:grid-cols-2">
          <label className="field-label">
            <strong>Name</strong>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label">
            <strong>Provider</strong>
            <input value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label">
            <strong>Organization</strong>
            <input value={form.organization} onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label">
            <strong>Status</strong>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="field-select">
              <option value="earned">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="planned">Planned</option>
            </select>
          </label>
          <label className="field-label">
            <strong>Issue Date</strong>
            <input type="date" value={form.issueDate} onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label">
            <strong>Year</strong>
            <input value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label">
            <strong>Credential ID</strong>
            <input value={form.credentialId} onChange={(event) => setForm((current) => ({ ...current, credentialId: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label">
            <strong>Logo / Emoji</strong>
            <input value={form.logo} onChange={(event) => setForm((current) => ({ ...current, logo: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label lg:col-span-2">
            <strong>Notes</strong>
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="field-textarea" />
          </label>
          <label className="field-label">
            <strong>Credential URL</strong>
            <input value={form.credentialUrl} onChange={(event) => setForm((current) => ({ ...current, credentialUrl: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label">
            <strong>Verify URL</strong>
            <input value={form.verifyUrl} onChange={(event) => setForm((current) => ({ ...current, verifyUrl: event.target.value }))} className="field-input" />
          </label>
          <label className="field-label">
            <strong>Skills Gained</strong>
            <textarea value={form.skillsGainedText} onChange={(event) => setForm((current) => ({ ...current, skillsGainedText: event.target.value }))} rows={4} className="field-textarea" placeholder="One skill per line" />
          </label>
          <label className="field-label">
            <strong>Technologies</strong>
            <textarea value={form.technologiesText} onChange={(event) => setForm((current) => ({ ...current, technologiesText: event.target.value }))} rows={4} className="field-textarea" placeholder="One technology per line" />
          </label>
          <label className="field-label lg:col-span-2">
            <strong>Associated Projects</strong>
            <textarea value={form.associatedProjectsText} onChange={(event) => setForm((current) => ({ ...current, associatedProjectsText: event.target.value }))} rows={3} className="field-textarea" placeholder="One project per line" />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[rgba(214,160,89,0.18)] px-6 py-5">
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Cancel</button>
          <button
            type="button"
            onClick={() => {
              const parsedYear = Number(form.year) || (form.issueDate ? new Date(form.issueDate).getFullYear() : new Date().getFullYear())

              onSave({
                ...cert,
                name: form.name.trim() || 'Untitled Certification',
                organization: form.organization.trim() || form.provider.trim() || 'Unknown Organization',
                provider: form.provider.trim() || 'Unknown Provider',
                status: ['earned', 'in-progress', 'planned'].includes(form.status) ? form.status : 'planned',
                issueDate: form.issueDate || null,
                year: parsedYear,
                credentialId: form.credentialId.trim() || null,
                credentialUrl: form.credentialUrl.trim() || '',
                verifyUrl: form.verifyUrl.trim() || form.credentialUrl.trim() || '',
                logo: form.logo.trim() || '🏆',
                notes: form.notes.trim(),
                skillsGained: parseTextList(form.skillsGainedText),
                technologies: parseTextList(form.technologiesText),
                associatedProjects: parseTextList(form.associatedProjectsText),
              })
            }}
            className="button-primary px-4 py-2 text-sm"
          >
            Save Certificate
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function RoadmapEditorModal({ value, onSave, onClose }) {
  const [text, setText] = useState(() => value.map(formatRoadmapLine).join('\n'))

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(25,16,10,0.72)] px-4 py-6 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-2xl overflow-hidden rounded-[1.8rem] border border-[rgba(247,204,129,0.24)] bg-[rgba(29,21,15,0.96)] shadow-[0_30px_90px_rgba(9,6,4,0.54)]"
        initial={{ y: 20, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 16, scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(214,160,89,0.18)] bg-[rgba(39,29,20,0.9)] px-6 py-5">
          <div>
            <p className="section-eyebrow">Roadmap Editor</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">Edit your certification roadmap</h3>
          </div>
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Close</button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm text-[var(--color-text-soft)]">
            Use one item per line in the format <span className="font-mono">status|year|title</span>. Valid statuses are <span className="font-mono">complete</span>, <span className="font-mono">current</span>, and <span className="font-mono">future</span>.
          </p>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="min-h-64 w-full rounded-[1.25rem] border border-[rgba(214,160,89,0.22)] bg-[rgba(20,15,11,0.86)] p-4 text-sm text-[var(--color-text)] outline-none focus:border-[rgba(247,204,129,0.48)]"
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => onSave(parseRoadmapText(text))} className="button-primary px-4 py-2 text-sm">Save roadmap</button>
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">Cancel</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function CertificationsPage() {
  const navigate = useNavigate()
  const [certifications, setCertifications] = useState(() => {
    const persisted = loadPersistedJson(CERTIFICATIONS_STORAGE_KEY)
    if (Array.isArray(persisted)) {
      return mergeSeededCertifications(persisted.map((cert) => hydrateCert(cert)))
    }
    return createInitialCertifications()
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [yearFilter, setYearFilter] = useState('All')
  const [pinnedIds, setPinnedIds] = useState(() => {
    const persisted = loadPersistedJson(CERTIFICATIONS_PINNED_STORAGE_KEY)
    if (Array.isArray(persisted)) {
      return persisted
    }
    return INITIAL_CERTIFICATIONS.filter((cert) => cert.featured).slice(0, 3).map((cert) => cert.id)
  })
  const [selectedCertification, setSelectedCertification] = useState(null)
  const [editingCertification, setEditingCertification] = useState(null)
  const [isCertificationEditorOpen, setIsCertificationEditorOpen] = useState(false)
  const [isReorderOpen, setIsReorderOpen] = useState(false)
  const [isRoadmapEditorOpen, setIsRoadmapEditorOpen] = useState(false)
  const [roadmapItems, setRoadmapItems] = useState(() => {
    const persisted = loadPersistedJson(CERTIFICATIONS_ROADMAP_STORAGE_KEY)
    return Array.isArray(persisted) ? persisted : INITIAL_ROADMAP
  })
  const [activeUploadId, setActiveUploadId] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(CERTIFICATIONS_STORAGE_KEY, JSON.stringify(certifications))
  }, [certifications])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(CERTIFICATIONS_PINNED_STORAGE_KEY, JSON.stringify(pinnedIds))
  }, [pinnedIds])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(CERTIFICATIONS_ROADMAP_STORAGE_KEY, JSON.stringify(roadmapItems))
  }, [roadmapItems])

  // derive valid pinned IDs without a state-syncing effect
  const validPinnedIds = useMemo(
    () => pinnedIds.filter((id) => certifications.some((cert) => cert.id === id)).slice(0, 3),
    [pinnedIds, certifications],
  )

  const years = useMemo(() => ['All', ...new Set(certifications.map((cert) => String(cert.year)))], [certifications])

  const totalEarned = certifications.filter((cert) => cert.status === 'earned').length
  const currentlyLearning = certifications.filter((cert) => cert.status === 'in-progress').length
  const nextCertification = certifications.find((cert) => cert.status === 'in-progress' || cert.status === 'planned')
  const providerCount = new Set(certifications.map((cert) => cert.provider)).size

  const filteredCertifications = useMemo(() => {
    const term = search.trim().toLowerCase()

    return certifications.filter((cert) => {
      if (statusFilter !== 'All' && cert.status !== statusFilter) {
        return false
      }

      if (yearFilter !== 'All' && String(cert.year) !== yearFilter) {
        return false
      }

      if (!term) {
        return true
      }

      const haystack = [
        cert.name,
        cert.organization,
        cert.provider,
        cert.credentialId,
        cert.notes,
        cert.issueDate,
        cert.technologies.join(' '),
        cert.associatedProjects.join(' '),
      ].join(' ').toLowerCase()

      return haystack.includes(term)
    })
  }, [certifications, search, statusFilter, yearFilter])

  const featuredCertifications = useMemo(
    () => validPinnedIds.map((id) => certifications.find((cert) => cert.id === id)).filter(Boolean),
    [certifications, validPinnedIds],
  )

  const galleryCertifications = useMemo(
    () => [...filteredCertifications].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [filteredCertifications],
  )

  const timelineByYear = useMemo(() => {
    const groups = new Map()
    certifications.forEach((cert) => {
      if (!groups.has(cert.year)) {
        groups.set(cert.year, [])
      }
      groups.get(cert.year).push(cert)
    })

    return [...groups.entries()].sort((left, right) => left[0] - right[0])
  }, [certifications])

  const roadmapByYear = useMemo(() => {
    const groups = new Map()
    roadmapItems.forEach((item) => {
      if (!groups.has(item.year)) {
        groups.set(item.year, [])
      }
      groups.get(item.year).push(item)
    })
    return [...groups.entries()].sort((left, right) => left[0] - right[0])
  }, [roadmapItems])

  const handleCertificateUpload = (certId) => {
    setActiveUploadId(certId)
    fileInputRef.current?.click()
  }

  const handleUploadChange = async (event) => {
    const [file] = Array.from(event.target.files || [])
    if (!file || !activeUploadId) {
      event.target.value = ''
      return
    }

    const isPdf = String(file.type || '').toLowerCase().includes('pdf') || /\.pdf$/i.test(file.name)
    const isImage = String(file.type || '').toLowerCase().startsWith('image/')
    if (!isPdf && !isImage) {
      event.target.value = ''
      return
    }

    try {
      const assetUrl = await readFileAsDataUrl(file)
      const assetType = isPdf ? 'pdf' : 'image'

      setCertifications((current) => current.map((cert) => (
        cert.id === activeUploadId
          ? { ...cert, assetUrl, assetType, assetName: file.name }
          : cert
      )))
      setSelectedCertification((current) => (current?.id === activeUploadId ? { ...current, assetUrl, assetType, assetName: file.name } : current))
    } finally {
      setActiveUploadId(null)
      event.target.value = ''
    }
  }

  const togglePin = (certId) => {
    setPinnedIds((current) => {
      if (current.includes(certId)) {
        return current.filter((id) => id !== certId)
      }

      if (current.length >= 3) {
        return [...current.slice(1), certId]
      }

      return [...current, certId]
    })
  }

  const saveReorder = (reordered) => {
    setCertifications((current) => {
      const orderMap = new Map(reordered.map((cert, index) => [cert.id, index]))
      return current.map((cert) => ({ ...cert, displayOrder: orderMap.has(cert.id) ? orderMap.get(cert.id) : cert.displayOrder }))
    })
    setIsReorderOpen(false)
  }

  const openTechnology = (technology) => {
    navigate(`/skills?technology=${encodeURIComponent(technology)}`)
  }

  const openAddCertification = () => {
    setEditingCertification(null)
    setIsCertificationEditorOpen(true)
  }

  const openEditCertification = (certId) => {
    const cert = certifications.find((item) => item.id === certId)
    if (!cert) {
      return
    }

    setEditingCertification(cert)
    setIsCertificationEditorOpen(true)
  }

  const saveCertification = (nextCert) => {
    setCertifications((current) => {
      if (nextCert.id) {
        return current.map((cert) => (cert.id === nextCert.id ? { ...cert, ...nextCert } : cert))
      }

      const created = {
        ...nextCert,
        id: createCertificationId(nextCert.name),
        featured: false,
        displayOrder: current.length,
        assetUrl: null,
        assetType: null,
        assetName: '',
      }

      return [created, ...current]
    })

    setSelectedCertification((current) => {
      if (current?.id === nextCert.id) {
        return { ...current, ...nextCert }
      }
      return current
    })

    setIsCertificationEditorOpen(false)
    setEditingCertification(null)
  }

  const deleteCertification = (certId) => {
    const certToDelete = certifications.find((cert) => cert.id === certId)
    if (!certToDelete) {
      return
    }

    const shouldDelete = window.confirm(`Delete ${certToDelete.name}? This will remove it from featured cards, timeline, and gallery.`)
    if (!shouldDelete) {
      return
    }

    setCertifications((current) => current.filter((cert) => cert.id !== certId))
    setPinnedIds((current) => current.filter((id) => id !== certId))
    setSelectedCertification((current) => (current?.id === certId ? null : current))
    setActiveUploadId((current) => (current === certId ? null : current))
  }

  return (
    <div className="page-shell page-shell--wide page-stack pb-14 certifications-page">
      <section className="surface-card surface-card--hero certifications-hero overflow-hidden px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(247,204,129,0.2),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(231,155,63,0.18),transparent_24%),radial-gradient(circle_at_50%_86%,rgba(207,121,50,0.12),transparent_34%)]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow">Achievement Gallery</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--color-text)] md:text-6xl">🏆 Certifications</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-text-soft)] md:text-lg">
              A collection of certifications, technical learning, and milestones that represent my continued growth as a software engineer.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard" className="button-secondary px-4 py-2 text-sm">Back to dashboard</Link>
            <button type="button" onClick={openAddCertification} className="button-secondary px-4 py-2 text-sm">Add certification</button>
            <button type="button" onClick={() => setIsRoadmapEditorOpen(true)} className="button-primary px-4 py-2 text-sm">Edit roadmap</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon="🏆" label="Certifications Earned" value={totalEarned} note="Completed credentials with warm, visible confidence." />
        <StatTile icon="📚" label="Currently Learning" value={currentlyLearning} note="Active study lanes that are in motion right now." />
        <StatTile icon="🎯" label="Next Certification" value={nextCertification ? nextCertification.name : 'None'} note={nextCertification ? `${nextCertification.provider} • ${nextCertification.year}` : 'No upcoming target set yet.'} />
        <StatTile icon="🏢" label="Learning Providers" value={providerCount} note="Distinct organizations shaping the learning roadmap." />
      </section>

      <section className="surface-card surface-card--strong p-5 md:p-6">
        <SectionHeader
          eyebrow="Collection Controls"
          title="Search and filter your achievement gallery"
          description="Keep the page recruiter-friendly while narrowing down the certifications you want to spotlight."
        />

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.5fr_repeat(2,minmax(0,1fr))]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search certifications, providers, technologies, or projects"
            className="w-full rounded-[1.25rem] border border-[rgba(214,160,89,0.22)] bg-[rgba(20,15,11,0.86)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[rgba(247,204,129,0.48)]"
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-[1.25rem] border border-[rgba(214,160,89,0.22)] bg-[rgba(20,15,11,0.86)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[rgba(247,204,129,0.48)]">
            <option>All</option>
            <option value="earned">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="planned">Planned</option>
          </select>
          <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)} className="rounded-[1.25rem] border border-[rgba(214,160,89,0.22)] bg-[rgba(20,15,11,0.86)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[rgba(247,204,129,0.48)]">
            {years.map((year) => <option key={year}>{year}</option>)}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={openAddCertification} className="button-primary px-4 py-2 text-sm">Add certification</button>
          <button type="button" onClick={() => setIsReorderOpen(true)} className="button-secondary px-4 py-2 text-sm">Reorder</button>
          <p className="self-center text-sm text-[var(--color-text-soft)]">Add new certifications, edit current ones, and remove entries you no longer need.</p>
        </div>
      </section>

      <section className="surface-card surface-card--strong p-5 md:p-6">
        <SectionHeader
          eyebrow="Featured Achievements"
          title="Pinned certifications"
          description="Choose up to three credentials to live at the top like framed trophies."
        />

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {featuredCertifications.map((cert, index) => {
            const meta = statusMeta[cert.status]
            return (
              <motion.article
                key={cert.id}
                layout
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className={`group relative overflow-hidden rounded-[1.6rem] border border-[rgba(247,204,129,0.24)] bg-[linear-gradient(148deg,rgba(53,38,27,0.94),rgba(31,23,17,0.92))] p-5 shadow-[0_26px_60px_rgba(12,8,6,0.4)] ${meta.glowClass}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(247,204,129,0.18),transparent_35%),radial-gradient(circle_at_86%_8%,rgba(231,155,63,0.12),transparent_25%)] opacity-80" />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-[1.4rem] border border-[rgba(247,204,129,0.3)] bg-[rgba(64,44,28,0.88)] text-2xl shadow-[0_14px_28px_rgba(14,10,7,0.28)] transition-transform duration-300 group-hover:scale-110"
                      style={cert.accentColor ? { background: `color-mix(in srgb, ${cert.accentColor} 22%, rgba(64,44,28,0.92))`, borderColor: `color-mix(in srgb, ${cert.accentColor} 44%, rgba(247,204,129,0.3))` } : undefined}
                    >
                      {cert.logo}
                    </div>
                    <div>
                      <p className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] ${meta.chipClass}`}>{meta.label}</p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{cert.name}</h3>
                      <p className="mt-1 text-sm text-[var(--color-text-soft)]">{cert.organization}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => togglePin(cert.id)} className="button-secondary px-3 py-2 text-xs">
                    {validPinnedIds.includes(cert.id) ? 'Unpin' : 'Pin'}
                  </button>
                </div>

                <div className="relative z-10 mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-3">
                    <div className="rounded-[1.35rem] border border-[rgba(214,160,89,0.18)] bg-[rgba(23,17,12,0.82)] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Issue date</p>
                      <p className="mt-2 text-sm text-[var(--color-text)]">{formatDate(cert.issueDate)}</p>
                    </div>
                    {cert.credentialId ? (
                      <div className="rounded-[1.35rem] border border-[rgba(214,160,89,0.18)] bg-[rgba(23,17,12,0.82)] p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Credential ID</p>
                        <p className="mt-2 text-sm text-[var(--color-text)]">{cert.credentialId}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.45rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(18,13,10,0.9)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      {cert.assetUrl ? (
                        <button type="button" onClick={() => setSelectedCertification(cert)} className="group relative block w-full overflow-hidden rounded-[1.15rem] border border-[rgba(247,204,129,0.22)] bg-black/20 text-left">
                          {cert.assetType === 'pdf' ? (
                            <iframe src={cert.assetUrl} title={`${cert.name} thumbnail`} className="certification-thumb h-56 w-full transition-transform duration-300 group-hover:scale-[1.03]" />
                          ) : (
                            <img src={cert.assetUrl} alt={`${cert.name} certificate`} className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                          )}
                          <span className="absolute left-3 top-3 rounded-full border border-[rgba(247,204,129,0.24)] bg-[rgba(30,21,15,0.86)] px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-[var(--color-brand-ink)]">
                            {cert.assetType === 'pdf' ? 'PDF Preview' : 'Image Preview'}
                          </span>
                        </button>
                      ) : (
                        <button type="button" onClick={() => handleCertificateUpload(cert.id)} className="grid h-56 w-full place-items-center rounded-[1.15rem] border border-dashed border-[rgba(214,160,89,0.26)] bg-[rgba(30,21,15,0.84)] text-sm text-[var(--color-text-soft)]">
                          Upload a certificate image or PDF
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {cert.skillsGained.slice(0, 4).map((skill) => (
                        <span key={skill} className="chip chip--accent">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEditCertification(cert.id)} className="button-secondary px-4 py-2 text-xs">Edit</button>
                      <button type="button" onClick={() => deleteCertification(cert.id)} className="button-secondary px-4 py-2 text-xs">Delete</button>
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </section>

      <section className="surface-card surface-card--strong p-5 md:p-6">
        <SectionHeader
          eyebrow="Certifications Gallery"
          title="Every credential in a premium grid"
          description="Hover to lift a card, reveal the action, and keep the whole collection organized like an achievement wall."
        />

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {galleryCertifications.map((cert, index) => {
            const meta = statusMeta[cert.status]
            const isPinned = validPinnedIds.includes(cert.id)

            return (
              <motion.article
                key={cert.id}
                layout
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
                whileHover={{ y: -8, scale: 1.01 }}
                className={`group relative overflow-hidden rounded-[1.5rem] border border-[rgba(214,160,89,0.22)] bg-[linear-gradient(145deg,rgba(48,35,24,0.92),rgba(31,23,17,0.88))] p-4 shadow-[0_20px_46px_rgba(12,8,6,0.34)] ${meta.glowClass}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(247,204,129,0.12),transparent_30%),radial-gradient(circle_at_86%_16%,rgba(231,155,63,0.1),transparent_24%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-[1.1rem] border border-[rgba(247,204,129,0.24)] bg-[rgba(63,43,27,0.86)] text-xl text-[var(--color-brand-ink)] transition-transform duration-300 group-hover:scale-110"
                      style={cert.accentColor ? { background: `color-mix(in srgb, ${cert.accentColor} 22%, rgba(63,43,27,0.9))`, borderColor: `color-mix(in srgb, ${cert.accentColor} 44%, rgba(247,204,129,0.24))` } : undefined}
                    >
                      {cert.logo}
                    </div>
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">{cert.provider}</p>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--color-text)]">{cert.name}</h3>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] ${meta.chipClass}`}>{meta.label}</span>
                </div>

                <div className="relative z-10 mt-4 space-y-2.5 text-sm">
                  <p className="text-[var(--color-text-soft)]">{cert.notes}</p>
                  <dl className="grid gap-2 rounded-[1.2rem] border border-[rgba(214,160,89,0.16)] bg-[rgba(22,16,11,0.78)] p-3 text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    <div className="flex items-center justify-between gap-3"><dt>Issue</dt><dd className="text-[var(--color-text)]">{formatDate(cert.issueDate)}</dd></div>
                    {cert.credentialId ? <div className="flex items-center justify-between gap-3"><dt>Credential</dt><dd className="text-[var(--color-text)]">{cert.credentialId}</dd></div> : null}
                  </dl>

                  <div className="rounded-[1.05rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(18,13,10,0.84)] p-2.5">
                    {cert.assetUrl ? (
                      <button type="button" onClick={() => setSelectedCertification(cert)} className="group relative block w-full overflow-hidden rounded-[0.9rem] border border-[rgba(247,204,129,0.2)] bg-black/20 text-left">
                        {cert.assetType === 'pdf' ? (
                          <iframe src={cert.assetUrl} title={`${cert.name} preview`} className="h-32 w-full transition-transform duration-300 group-hover:scale-[1.02]" />
                        ) : (
                          <img src={cert.assetUrl} alt={`${cert.name} certificate`} className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                        )}
                        <span className="absolute left-2 top-2 rounded-full border border-[rgba(247,204,129,0.24)] bg-[rgba(30,21,15,0.86)] px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-[var(--color-brand-ink)]">
                          {cert.assetType === 'pdf' ? 'PDF' : 'Image'}
                        </span>
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleCertificateUpload(cert.id)} className="grid h-32 w-full place-items-center rounded-[0.9rem] border border-dashed border-[rgba(214,160,89,0.28)] bg-[rgba(30,21,15,0.84)] text-xs text-[var(--color-text-soft)]">
                        Upload image or PDF
                      </button>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Related technologies</p>
                    <div className="flex flex-wrap gap-2">
                      {cert.technologies.slice(0, 4).map((technology) => (
                        <button key={technology} type="button" onClick={() => openTechnology(technology)} className="chip chip--accent">
                          {technology}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-[0.68rem] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Associated projects</p>
                    <div className="flex flex-wrap gap-2">
                      {cert.associatedProjects.map((project) => (
                        <Link key={project} to="/projects" className="chip">
                          {project}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <button type="button" onClick={() => setSelectedCertification(cert)} className="button-primary px-4 py-2 text-xs">
                      View Certificate
                    </button>
                    <button type="button" onClick={() => openEditCertification(cert.id)} className="button-secondary px-4 py-2 text-xs">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleCertificateUpload(cert.id)} className="button-secondary px-4 py-2 text-xs">
                      {cert.assetUrl ? 'Replace Media' : 'Upload Media'}
                    </button>
                    <button type="button" onClick={() => togglePin(cert.id)} className="button-secondary px-4 py-2 text-xs">
                      {isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button type="button" onClick={() => deleteCertification(cert.id)} className="button-secondary px-4 py-2 text-xs">
                      Delete
                    </button>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </section>

      <section className="surface-card surface-card--strong p-5 md:p-6">
        <SectionHeader
          eyebrow="Technologies Gained"
          title="Each certification feeds the Skills page"
          description="Click any technology to open it directly inside your skills dashboard."
        />
        <div className="mt-5 flex flex-wrap gap-2">
          {[...new Set(certifications.flatMap((cert) => cert.technologies))].map((technology) => (
            <button key={technology} type="button" onClick={() => openTechnology(technology)} className="chip chip--accent px-4 py-2 text-sm">
              {technology}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card surface-card--strong p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Learning Roadmap"
            title="A growth path instead of a percentage bar"
            description="Completed items glow warmly, the current certification pulses subtly, and future steps stay dim until they move up."
          />
          <button type="button" onClick={() => setIsRoadmapEditorOpen(true)} className="button-secondary px-4 py-2 text-sm">Edit roadmap</button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {roadmapByYear.map(([year, items], index) => (
            <motion.div
              key={year}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="rounded-[1.5rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(43,31,22,0.86)] p-5 shadow-[0_18px_40px_rgba(15,10,7,0.28)]"
            >
              <p className="section-eyebrow">{year}</p>
              <div className="mt-4 space-y-3">
                {items.map((item) => {
                  const badge =
                    item.status === 'complete'
                      ? '✓'
                      : item.status === 'current'
                        ? '●'
                        : '○'

                  return (
                    <div key={`${year}-${item.title}`} className="flex items-center gap-3 rounded-[1.15rem] border border-[rgba(214,160,89,0.16)] bg-[rgba(23,17,12,0.76)] px-4 py-3">
                      <span className={`grid h-9 w-9 place-items-center rounded-full border text-sm ${item.status === 'complete' ? 'border-[rgba(247,204,129,0.36)] bg-[rgba(74,50,30,0.9)] text-[var(--color-brand-ink)]' : item.status === 'current' ? 'border-[rgba(231,155,63,0.42)] bg-[rgba(68,43,24,0.9)] text-[var(--color-brand-ink)]' : 'border-[rgba(214,160,89,0.22)] bg-[rgba(44,32,23,0.76)] text-[var(--color-text-soft)]'}`}>{badge}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-text)]">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{item.status === 'complete' ? 'Completed' : item.status === 'current' ? 'Current certification' : 'Future certification'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="surface-card surface-card--strong p-5 md:p-6">
        <SectionHeader
          eyebrow="Timeline"
          title="Milestones by year"
          description="Each certification animates into view as the timeline unfolds across your learning journey."
        />
        <div className="mt-5 space-y-4">
          {timelineByYear.map(([year, items], yearIndex) => (
            <div key={year} className="relative overflow-hidden rounded-[1.55rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,31,22,0.86)] p-5">
              <div className="absolute left-6 top-0 h-full w-px bg-[linear-gradient(180deg,rgba(247,204,129,0.38),transparent)]" />
              <div className="relative z-10 pl-10">
                <p className="section-eyebrow">{year}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((cert, index) => {
                    const meta = statusMeta[cert.status]
                    return (
                      <motion.div
                        key={cert.id}
                        initial={{ opacity: 0, x: -10, y: 12 }}
                        whileInView={{ opacity: 1, x: 0, y: 0 }}
                        viewport={{ once: true, amount: 0.18 }}
                        transition={{ duration: 0.35, delay: yearIndex * 0.05 + index * 0.04 }}
                        className={`rounded-[1.2rem] border border-[rgba(214,160,89,0.18)] bg-[rgba(22,16,11,0.78)] p-4 ${meta.glowClass}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-[var(--color-text)]">{cert.name}</p>
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{cert.provider}</span>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                          {cert.status === 'earned' ? 'Completed' : cert.status === 'in-progress' ? 'Current' : 'Future'}
                        </p>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card surface-card--strong p-5 md:p-6">
        <SectionHeader
          eyebrow="Preview Uploads"
          title="Certificate images and PDFs with previews"
          description="Upload any certificate image or PDF to generate preview cards and open full media in a modal."
        />
        <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleUploadChange} />
      </section>

      <AnimatePresence>
        {selectedCertification ? (
          <CertificationModal cert={selectedCertification} onClose={() => setSelectedCertification(null)} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isCertificationEditorOpen ? (
          <CertificationEditorModal
            cert={editingCertification}
            onSave={saveCertification}
            onClose={() => {
              setIsCertificationEditorOpen(false)
              setEditingCertification(null)
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isReorderOpen ? (
          <CertReorderModal
            certifications={certifications}
            onSave={saveReorder}
            onClose={() => setIsReorderOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isRoadmapEditorOpen ? (
          <RoadmapEditorModal value={roadmapItems} onSave={(next) => { setRoadmapItems(next); setIsRoadmapEditorOpen(false) }} onClose={() => setIsRoadmapEditorOpen(false)} />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
