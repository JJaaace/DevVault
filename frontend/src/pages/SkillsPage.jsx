import { useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SkillFormModal } from '../components/SkillFormModal'
import { SkillsEmptyState } from '../components/SkillsEmptyState'
import { TechnologyLogo } from '../components/TechnologyLogo'
import { fetchProjects } from '../lib/projectsApi'
import { getSkillLevelMeta } from '../lib/skillUtils'
import { createSkill, deleteSkill, fetchSkills, updateSkill } from '../lib/skillsApi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGuestMode } from '../context/GuestModeContext'

const FAVORITE_SKILL_STORAGE_KEY = 'devvault:favorite-technology'
const DEFAULT_FAVORITE_SKILL_KEY = 'python'

const CATEGORY_CONFIG = [
  { id: 'programming', label: 'Programming Languages', icon: '💻' },
  { id: 'frontend', label: 'Frontend', icon: '🎨' },
  { id: 'backend', label: 'Backend', icon: '⚙️' },
  { id: 'databases', label: 'Databases', icon: '🗄️' },
  { id: 'auth-apis', label: 'Authentication & APIs', icon: '🔐' },
  { id: 'tools', label: 'Developer Tools', icon: '🛠' },
  { id: 'cloud', label: 'Cloud', icon: '☁️' },
]

const CATEGORY_FILTER_OPTIONS = ['All', ...CATEGORY_CONFIG.map((item) => item.label)]
const EXPERIENCE_FILTER_OPTIONS = ['All', '🌱 Learning', '⚡ Comfortable', '🚀 Confident', '🏆 Advanced']

const SORT_OPTIONS = [
  { value: 'most-projects', label: 'Most Projects' },
  { value: 'recently-used', label: 'Recently Used' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'first-used', label: 'First Used' },
]

function normalizeToken(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function mapCategory(skillCategory) {
  const normalized = String(skillCategory || '').toLowerCase()

  if (normalized.includes('programming') || normalized.includes('language')) return 'programming'
  if (normalized.includes('front')) return 'frontend'
  if (normalized.includes('back')) return 'backend'
  if (normalized.includes('database') || normalized.includes('orm') || normalized.includes('sql')) return 'databases'
  if (normalized.includes('auth') || normalized.includes('api')) return 'auth-apis'
  if (normalized.includes('tool') || normalized.includes('platform')) return 'tools'
  if (normalized.includes('cloud')) return 'cloud'

  return 'tools'
}

function formatMonthYear(value) {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

function AnimatedCounter({ value, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(() => Math.max(0, Number(value || 0)))

  useEffect(() => {
    const target = Number(value || 0)
    const duration = 820
    const start = performance.now()
    let frameId = null

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - ((1 - progress) ** 3)
      const next = target <= 0 ? 0 : Math.round(target * eased)
      setDisplayValue(next)

      if (progress < 1) {
        frameId = window.requestAnimationFrame(step)
      }
    }

    frameId = window.requestAnimationFrame(step)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [value])

  return <span>{displayValue}{suffix}</span>
}

function SkillsPageContent({ getToken }) {
  const { isGuestMode, portfolio, resolvePath } = useGuestMode()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [skills, setSkills] = useState(() => isGuestMode ? portfolio.skills || [] : [])
  const [projects, setProjects] = useState(() => isGuestMode ? portfolio.projects || [] : [])
  const [loading, setLoading] = useState(!isGuestMode)
  const [error, setError] = useState('')

  const [search, setSearch] = useState(() => searchParams.get('technology') || '')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [experienceFilter, setExperienceFilter] = useState('All')
  const [sortMode, setSortMode] = useState('most-projects')

  const [expandedCategories, setExpandedCategories] = useState(() => {
    const initial = {}
    CATEGORY_CONFIG.forEach((category) => {
      initial[category.id] = true
    })
    return initial
  })

  const [favoriteSkillKey, setFavoriteSkillKey] = useState(() => {
    if (isGuestMode) return portfolio.profile?.favoriteLanguage || portfolio.profile?.favoriteFramework || DEFAULT_FAVORITE_SKILL_KEY
    if (typeof window === 'undefined') {
      return DEFAULT_FAVORITE_SKILL_KEY
    }

    const stored = window.localStorage.getItem(FAVORITE_SKILL_STORAGE_KEY) || ''
    const normalized = normalizeToken(stored)

    // Migrate the old default favorite from React to Python.
    if (!normalized || normalized === 'react') {
      return DEFAULT_FAVORITE_SKILL_KEY
    }

    return stored
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalErrors, setModalErrors] = useState({})

  useEffect(() => {
    if (isGuestMode) return
    async function loadData() {
      try {
        const [skillData, projectData] = await Promise.all([
          fetchSkills(getToken),
          fetchProjects(getToken),
        ])

        setSkills(Array.isArray(skillData) ? skillData : [])
        setProjects(Array.isArray(projectData) ? projectData : [])
      } catch (loadError) {
        setError(loadError.message || 'Unable to load skills dashboard.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [getToken, isGuestMode])

  const enrichedSkills = useMemo(() => {
    return skills.map((skill) => {
      const levelMeta = getSkillLevelMeta(skill.experienceLevel)
      const relatedProjects = Array.isArray(skill.relatedProjects) ? skill.relatedProjects : []

      return {
        ...skill,
        dashboardCategoryId: mapCategory(skill.category),
        dashboardLevelLabel: levelMeta.label,
        projectsBuiltAuto: relatedProjects.length,
        firstUsedYear: Number(skill.firstUsedYear || 0),
        yearsExperience: Number(skill.yearsExperience || 0),
        lastUsedDate: skill.lastUsed ? new Date(skill.lastUsed) : null,
      }
    })
  }, [skills])

  const favoriteSkill = useMemo(() => {
    if (!enrichedSkills.length) {
      return null
    }

    const normalized = normalizeToken(favoriteSkillKey)
    const exact = enrichedSkills.find((skill) => normalizeToken(skill.technologyKey || skill.name) === normalized)
    if (exact) {
      return exact
    }

    const pythonSkill = enrichedSkills.find((skill) => normalizeToken(skill.technologyKey || skill.name) === DEFAULT_FAVORITE_SKILL_KEY)
    return pythonSkill || enrichedSkills[0]
  }, [enrichedSkills, favoriteSkillKey])

  useEffect(() => {
    if (isGuestMode) return
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(FAVORITE_SKILL_STORAGE_KEY, favoriteSkillKey)
  }, [favoriteSkillKey, isGuestMode])

  const visibleSkills = useMemo(() => {
    const term = search.trim().toLowerCase()

    const filtered = enrichedSkills
      .filter((skill) => {
        if (categoryFilter === 'All') {
          return true
        }

        const config = CATEGORY_CONFIG.find((item) => item.id === skill.dashboardCategoryId)
        return config?.label === categoryFilter
      })
      .filter((skill) => (experienceFilter === 'All' ? true : skill.dashboardLevelLabel === experienceFilter))
      .filter((skill) => {
        if (!term) {
          return true
        }

        const haystack = [
          skill.name,
          skill.category,
          skill.notes,
          skill.dashboardLevelLabel,
          ...(skill.relatedProjects || []).map((project) => project.title),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(term)
      })

    return [...filtered].sort((left, right) => {
      if (sortMode === 'alphabetical') {
        return String(left.name || '').localeCompare(String(right.name || ''))
      }

      if (sortMode === 'first-used') {
        return Number(left.firstUsedYear || 0) - Number(right.firstUsedYear || 0)
      }

      if (sortMode === 'recently-used') {
        const leftTime = left.lastUsedDate ? left.lastUsedDate.getTime() : 0
        const rightTime = right.lastUsedDate ? right.lastUsedDate.getTime() : 0
        return rightTime - leftTime
      }

      const projectsDelta = Number(right.projectsBuiltAuto || 0) - Number(left.projectsBuiltAuto || 0)
      if (projectsDelta !== 0) {
        return projectsDelta
      }

      return String(left.name || '').localeCompare(String(right.name || ''))
    })
  }, [enrichedSkills, search, categoryFilter, experienceFilter, sortMode])

  const groupedSkills = useMemo(() => {
    const groups = {}
    CATEGORY_CONFIG.forEach((category) => {
      groups[category.id] = []
    })

    visibleSkills.forEach((skill) => {
      if (!groups[skill.dashboardCategoryId]) {
        groups[skill.dashboardCategoryId] = []
      }
      groups[skill.dashboardCategoryId].push(skill)
    })

    return groups
  }, [visibleSkills])

  const timelineRows = useMemo(() => {
    const rowsByYear = new Map()

    visibleSkills.forEach((skill) => {
      const year = Number(skill.firstUsedYear || 0)
      if (!year) {
        return
      }

      if (!rowsByYear.has(year)) {
        rowsByYear.set(year, [])
      }

      rowsByYear.get(year).push(skill)
    })

    return [...rowsByYear.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([year, yearSkills]) => ({
        year,
        skills: yearSkills.sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''))),
      }))
  }, [visibleSkills])

  const totalTechnologies = visibleSkills.length
  const programmingLanguagesCount = visibleSkills.filter((skill) => skill.dashboardCategoryId === 'programming').length
  const representedProjectsCount = new Set(visibleSkills.flatMap((skill) => (skill.relatedProjects || []).map((project) => project.id))).size
  const yearsProgramming = visibleSkills.length
    ? Math.max(new Date().getFullYear() - Math.min(...visibleSkills.map((skill) => Number(skill.firstUsedYear || new Date().getFullYear()))), 0)
    : 0

  const refreshSkills = async () => {
    const nextSkills = await fetchSkills(getToken)
    setSkills(Array.isArray(nextSkills) ? nextSkills : [])
  }

  const parseErrorPayload = (message) => {
    if (!message) {
      return { message: 'Unable to save skill.' }
    }

    try {
      const parsed = JSON.parse(message)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    } catch {
      // fall through to plain text
    }

    return { message }
  }

  const openCreateModal = () => {
    setEditingSkill(null)
    setModalErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (skill) => {
    setEditingSkill(skill)
    setModalErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) {
      return
    }

    setIsModalOpen(false)
    setEditingSkill(null)
    setModalErrors({})
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    setModalErrors({})

    try {
      if (editingSkill) {
        await updateSkill(editingSkill.id, formData, getToken)
      } else {
        await createSkill(formData, getToken)
      }

      await refreshSkills()
      closeModal()
      toast.success(editingSkill ? 'Technology updated.' : 'Technology added.')
    } catch (submitError) {
      if (submitError?.details && typeof submitError.details === 'object') {
        setModalErrors(submitError.details)
        toast.error('Please fix the highlighted fields and try again.')
        return
      }

      const parsed = parseErrorPayload(submitError.message || '')
      if (parsed.errors) {
        setModalErrors(parsed.errors)
        toast.error('Please fix the highlighted fields and try again.')
      } else {
        toast.error(parsed.message || 'Unable to save skill.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (skill) => {
    toast.custom((id) => (
      <div className="max-w-sm rounded-[1.15rem] border border-[rgba(214,160,89,0.24)] bg-[rgba(41,30,22,0.96)] px-4 py-4 shadow-[0_24px_60px_rgba(18,12,8,0.42)]">
        <p className="text-sm font-semibold text-[var(--color-text)]">Delete {skill.name}?</p>
        <p className="mt-1 text-sm text-[var(--color-text-soft)]">This removes the technology from your dashboard.</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(id)
              try {
                await deleteSkill(skill.id, getToken)
                await refreshSkills()
                toast.success(`${skill.name} deleted.`)
              } catch (deleteError) {
                toast.error(deleteError.message || 'Unable to delete skill.')
              }
            }}
            className="button-primary px-3 py-2 text-sm"
          >
            Delete
          </button>
          <button type="button" onClick={() => toast.dismiss(id)} className="button-secondary px-3 py-2 text-sm">
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity })
  }

  const setFavoriteTechnology = (skill) => {
    const next = skill.technologyKey || skill.name
    setFavoriteSkillKey(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FAVORITE_SKILL_STORAGE_KEY, next)
    }
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategories((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }))
  }

  if (loading) {
    return (
      <div className="page-shell page-shell--wide page-stack pb-14">
        <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">Loading skills dashboard...</div>
      </div>
    )
  }

  return (
    <div className="page-shell page-shell--wide page-stack pb-14 skills-dashboard-page">
      <section className="surface-card surface-card--hero skills-dashboard-hero px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow">Skills</p>
            <h2 className="section-title mt-3 text-4xl md:text-5xl">Technology command dashboard.</h2>
            <p className="section-copy mt-4 max-w-2xl text-sm leading-7 md:text-base">
              A premium stack overview built around real project usage, growth timeline, and practical confidence.
            </p>
          </div>
          {!isGuestMode ? <button type="button" onClick={openCreateModal} className="button-primary px-5 py-3 text-sm md:text-base">
            Add Technology
          </button> : <span className="guest-read-only-badge">Guest view · Read only</span>}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="widget-card skills-dashboard-stat p-4">
            <p className="skills-dashboard-stat-label">Technologies</p>
            <p className="skills-dashboard-stat-value"><AnimatedCounter value={totalTechnologies} /></p>
          </div>
          <div className="widget-card skills-dashboard-stat p-4">
            <p className="skills-dashboard-stat-label">Programming Languages</p>
            <p className="skills-dashboard-stat-value"><AnimatedCounter value={programmingLanguagesCount} /></p>
          </div>
          <div className="widget-card skills-dashboard-stat p-4">
            <p className="skills-dashboard-stat-label">Projects</p>
            <p className="skills-dashboard-stat-value"><AnimatedCounter value={representedProjectsCount} /></p>
          </div>
          <div className="widget-card skills-dashboard-stat p-4">
            <p className="skills-dashboard-stat-label">Years Programming</p>
            <p className="skills-dashboard-stat-value"><AnimatedCounter value={yearsProgramming} /></p>
          </div>
          <div className="widget-card skills-dashboard-stat p-4">
            <p className="skills-dashboard-stat-label">Favorite Technology</p>
            <p className="skills-dashboard-stat-value skills-dashboard-stat-value--small">{favoriteSkill?.name || 'Not set'}</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="widget-card border border-[rgba(185,56,28,0.3)] bg-[rgba(74,31,21,0.86)] p-4 text-sm text-[#f6c9bb]">
          {error}
        </div>
      ) : null}

      {favoriteSkill ? (
        <motion.section
          className="surface-card surface-card--strong skills-favorite-shell p-5 md:p-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="section-eyebrow">⭐ Favorite Technology</p>
          <div className="mt-3 grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
            <TechnologyLogo technologyKey={favoriteSkill.technologyKey} name={favoriteSkill.name} size="lg" />
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">{favoriteSkill.name}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-soft)]">
                {favoriteSkill.notes || 'This is currently the technology I enjoy working with the most.'}
              </p>
            </div>
            {!isGuestMode ? <button type="button" onClick={() => openEditModal(favoriteSkill)} className="button-secondary px-4 py-2 text-sm">
              Edit
            </button> : null}
          </div>
        </motion.section>
      ) : null}

      <section className="surface-card surface-card--strong skills-dashboard-toolbar p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_auto_auto_auto] lg:items-end">
          <label className="field-label">
            <strong>Search technologies</strong>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search React, API, Cloud..."
              className="field-input"
            />
          </label>

          <label className="field-label">
            <strong>Category</strong>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="field-input">
              {CATEGORY_FILTER_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="field-label">
            <strong>Experience Level</strong>
            <select value={experienceFilter} onChange={(event) => setExperienceFilter(event.target.value)} className="field-input">
              {EXPERIENCE_FILTER_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="field-label">
            <strong>Sort</strong>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="field-input">
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {visibleSkills.length ? (
        <section className="skills-category-grid">
          {CATEGORY_CONFIG.map((category, categoryIndex) => {
            const categorySkills = groupedSkills[category.id] || []
            const expanded = Boolean(expandedCategories[category.id])

            return (
              <motion.article
                key={category.id}
                className="surface-card surface-card--strong skills-category-card p-4 md:p-5"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, delay: categoryIndex * 0.04 }}
              >
                <button type="button" className="skills-category-header" onClick={() => toggleCategory(category.id)}>
                  <div>
                    <p className="section-eyebrow">{category.icon} {category.label}</p>
                    <h3 className="skills-category-title">{categorySkills.length} technologies</h3>
                  </div>
                  <span className={`skills-category-chevron ${expanded ? 'is-open' : ''}`.trim()}>⌄</span>
                </button>

                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }}
                      className="skills-category-content"
                    >
                      {categorySkills.length ? (
                        <div className="skills-tech-grid">
                          {categorySkills.map((skill) => (
                            <motion.article
                              key={skill.id}
                              className={`skills-tech-card ${favoriteSkill && favoriteSkill.id === skill.id ? 'skills-tech-card--favorite' : ''}`.trim()}
                              whileHover={{ y: -6, scale: 1.01, rotateX: 1.6, rotateY: -1.6 }}
                              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            >
                              <div className="skills-tech-card-head">
                                <TechnologyLogo technologyKey={skill.technologyKey} name={skill.name} size="md" />
                                <div>
                                  <p className="skills-tech-category">{skill.category}</p>
                                  <h4 className="skills-tech-name">{skill.name}</h4>
                                </div>
                                {!isGuestMode ? <button
                                  type="button"
                                  onClick={() => setFavoriteTechnology(skill)}
                                  className={`skills-tech-star ${favoriteSkill && favoriteSkill.id === skill.id ? 'is-active' : ''}`.trim()}
                                  aria-label={`Set ${skill.name} as favorite technology`}
                                >
                                  ★
                                </button> : null}
                              </div>

                              <div className="skills-tech-metrics">
                                <div className="skill-metric-card">
                                  <p className="skill-metric-label">Experience Level</p>
                                  <p className="skill-metric-value">{skill.dashboardLevelLabel}</p>
                                </div>
                                <div className="skill-metric-card">
                                  <p className="skill-metric-label">Years of Experience</p>
                                  <p className="skill-metric-value">{skill.yearsExperience} {skill.yearsExperience === 1 ? 'Year' : 'Years'}</p>
                                </div>
                                <div className="skill-metric-card">
                                  <p className="skill-metric-label">Projects Built</p>
                                  <p className="skill-metric-value">{skill.projectsBuiltAuto} {skill.projectsBuiltAuto === 1 ? 'Project' : 'Projects'}</p>
                                </div>
                                <div className="skill-metric-card">
                                  <p className="skill-metric-label">First Used</p>
                                  <p className="skill-metric-value">{skill.firstUsedYear || 'N/A'}</p>
                                </div>
                                <div className="skill-metric-card">
                                  <p className="skill-metric-label">Last Used</p>
                                  <p className="skill-metric-value">{formatMonthYear(skill.lastUsed)}</p>
                                </div>
                              </div>

                              <div className="mt-4">
                                <p className="skill-metric-label">Related Projects</p>
                                {(skill.relatedProjects || []).length ? (
                                  <div className="skills-project-chip-row">
                                    {skill.relatedProjects.slice(0, 3).map((project) => (
                                      <button
                                        key={project.id}
                                        type="button"
                                        onClick={() => navigate(resolvePath(`/projects/${project.id}/edit`))}
                                        className="skills-project-chip"
                                      >
                                        {project.title}
                                      </button>
                                    ))}
                                    {skill.relatedProjects.length > 3 ? (
                                      <span className="skills-project-chip skills-project-chip--count">+{skill.relatedProjects.length - 3} more</span>
                                    ) : null}
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">None yet</p>
                                )}
                              </div>

                              {!isGuestMode ? <div className="mt-4">
                                <p className="skill-metric-label">Personal Notes</p>
                                <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)] skills-note-clamp">{skill.notes || 'No notes added yet.'}</p>
                              </div> : null}

                              {!isGuestMode ? <div className="mt-4 flex gap-2">
                                <button type="button" onClick={() => openEditModal(skill)} className="button-secondary px-3 py-2 text-xs">Edit</button>
                                <button type="button" onClick={() => handleDelete(skill)} className="button-secondary px-3 py-2 text-xs">Delete</button>
                              </div> : null}
                            </motion.article>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-[var(--color-text-soft)]">No matching technologies in this category with current filters.</p>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.article>
            )
          })}
        </section>
      ) : (
        <SkillsEmptyState onCreate={openCreateModal} />
      )}

      <section className="surface-card surface-card--strong skills-timeline-shell p-5 md:p-6">
        <p className="section-eyebrow">Skill Timeline</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">When each technology entered my stack</h3>

        {timelineRows.length ? (
          <div className="skills-timeline-track mt-6">
            {timelineRows.map((row, index) => (
              <motion.article
                key={row.year}
                className="skills-timeline-year-card"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
              >
                <p className="skills-timeline-year">{row.year}</p>
                <div className="skills-timeline-tags">
                  {row.skills.map((skill) => (
                    <span key={skill.id} className="skills-timeline-tag">{skill.name}</span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--color-text-soft)]">Add first-use years to see timeline progression.</p>
        )}
      </section>

      {!isGuestMode && isModalOpen ? (
        <SkillFormModal
          key={editingSkill?.id || 'new-skill'}
          skill={editingSkill}
          projects={projects}
          onSubmit={handleSubmit}
          onClose={closeModal}
          submitting={submitting}
          errors={modalErrors}
        />
      ) : null}
    </div>
  )
}

function AuthenticatedSkillsPage() {
  const { getToken } = useAuth()
  return <SkillsPageContent getToken={getToken} />
}

export function SkillsPage() {
  const { isGuestMode } = useGuestMode()
  return isGuestMode ? <SkillsPageContent getToken={async () => ''} /> : <AuthenticatedSkillsPage />
}
