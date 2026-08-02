import { useAuth } from '@clerk/clerk-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DashboardCard } from '../components/DashboardCard'
import { SkillFormModal } from '../components/SkillFormModal'
import { SkillsEmptyState } from '../components/SkillsEmptyState'
import { TechnologyMap } from '../components/skills/TechnologyMap'
import { fetchProjects } from '../lib/projectsApi'
import { createSkill, deleteSkill, fetchSkills, updateSkill } from '../lib/skillsApi'

const ALL_CATEGORY = 'All'

export function SkillsPage() {
  const { getToken } = useAuth()
  const [skills, setSkills] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORY)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalErrors, setModalErrors] = useState({})

  useEffect(() => {
    async function loadData() {
      try {
        const [skillData, projectData] = await Promise.all([
          fetchSkills(getToken),
          fetchProjects(getToken),
        ])

        setSkills(Array.isArray(skillData) ? skillData : [])
        setProjects(Array.isArray(projectData) ? projectData : [])
      } catch (err) {
        setError(err.message || 'Unable to load skills.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [getToken])

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(skills.map((skill) => skill.category).filter(Boolean))].sort((left, right) => left.localeCompare(right))
    return [ALL_CATEGORY, ...categories]
  }, [skills])

  const visibleSkills = useMemo(() => {
    const term = search.trim().toLowerCase()

    return skills
      .filter((skill) => (category === ALL_CATEGORY ? true : skill.category === category))
      .filter((skill) => {
        if (!term) {
          return true
        }

        const haystack = [
          skill.name,
          skill.category,
          skill.notes,
          skill.experienceLevel,
          ...(skill.relatedProjects || []).map((project) => project.title),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(term)
      })
      .sort((left, right) => {
        const yearsDelta = Number(right.yearsExperience || 0) - Number(left.yearsExperience || 0)
        if (yearsDelta !== 0) {
          return yearsDelta
        }

        const projectsDelta = Number(right.projectsBuilt || 0) - Number(left.projectsBuilt || 0)
        if (projectsDelta !== 0) {
          return projectsDelta
        }

        return left.name.localeCompare(right.name)
      })
  }, [skills, search, category])

  const totalSkills = skills.length
  const totalYears = skills.reduce((sum, skill) => sum + Number(skill.yearsExperience || 0), 0)
  const totalProjectsBuilt = skills.reduce((sum, skill) => sum + Number(skill.projectsBuilt || 0), 0)
  const averageYears = totalSkills ? (totalYears / totalSkills).toFixed(1) : '0.0'

  const refreshSkills = async () => {
    const data = await fetchSkills(getToken)
    setSkills(Array.isArray(data) ? data : [])
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
      // fall through to plain text message
    }

    return { message }
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
      toast.success(editingSkill ? 'Skill updated successfully.' : 'Skill created successfully.')
    } catch (err) {
      if (err?.details && typeof err.details === 'object') {
        setModalErrors(err.details)
        toast.error('Please fix the highlighted fields and try again.')
        return
      }

      const parsed = parseErrorPayload(err.message || '')
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
        <p className="mt-1 text-sm text-[var(--color-text-soft)]">This removes the skill from DevVault permanently.</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(id)
              try {
                await deleteSkill(skill.id, getToken)
                await refreshSkills()
                toast.success(`${skill.name} deleted.`)
              } catch (err) {
                toast.error(err.message || 'Unable to delete skill.')
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

  return (
    <div className="page-shell page-shell--wide page-stack pb-14">
      <section className="surface-card surface-card--hero skills-hero px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow">Skills</p>
            <h2 className="section-title mt-3 text-4xl md:text-5xl">Engineer your capability graph.</h2>
            <p className="section-copy mt-4 max-w-2xl text-sm leading-7 md:text-base">
              Showcase years of depth, first-use timeline, and production project coverage in one recruiter-ready skills cockpit.
            </p>
          </div>
          <button type="button" onClick={openCreateModal} className="button-primary px-5 py-3 text-sm md:text-base">
            Add Skill
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="widget-card skills-stat p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Total skills</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{totalSkills}</p>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">Core technologies tracked</p>
          </div>
          <div className="widget-card skills-stat p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Average years</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{averageYears}y</p>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">Experience maturity signal</p>
          </div>
          <div className="widget-card skills-stat p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Projects represented</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{totalProjectsBuilt}</p>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">Proof-of-work count</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="widget-card border border-[rgba(185,56,28,0.3)] bg-[rgba(74,31,21,0.86)] p-4 text-sm text-[#f6c9bb]">
          {error}
        </div>
      ) : null}

      <div className="surface-card surface-card--strong skills-toolbar p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="field-label flex-1">
            <strong>Search skills</strong>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, category, or related project..."
              className="field-input"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`chip transition ${category === option ? 'chip--accent' : ''}`.trim()}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          <span>{visibleSkills.length} visible</span>
          <span>•</span>
          <span>{category === ALL_CATEGORY ? 'All categories' : category}</span>
        </div>
      </div>

      {loading ? (
        <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">Loading skills...</div>
      ) : visibleSkills.length ? (
        <>
          <TechnologyMap skills={visibleSkills} />

          <div className="surface-card surface-card--strong p-5 md:p-6">
            <p className="section-eyebrow">Skill Actions</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)]">Quick management lane</h3>
            <p className="mt-2 text-sm text-[var(--color-text-soft)]">Update notes, levels, and project links while keeping the map as your main view.</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleSkills.map((skill) => (
                <article key={skill.id} className="rounded-[1.15rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{skill.category || 'Technology'}</p>
                  <h4 className="mt-2 text-lg font-semibold tracking-tight text-[var(--color-text)]">{skill.name}</h4>
                  <p className="mt-1 text-xs text-[var(--color-text-soft)]">{skill.experienceLevel?.replace('_', ' ').toLowerCase()} • {skill.yearsExperience || 0}y</p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => openEditModal(skill)} className="button-secondary px-3 py-2 text-xs">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(skill)} className="button-secondary px-3 py-2 text-xs">
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      ) : (
        <SkillsEmptyState onCreate={openCreateModal} />
      )}

      <DashboardCard title="Momentum board" description="Use this space to celebrate progress without losing sight of the next step.">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <span className="chip chip--accent">Learning streaks</span>
          <span className="chip">Skill gaps</span>
          <span className="chip">Project links</span>
          <span className="chip">Career readiness</span>
        </div>
      </DashboardCard>

      {isModalOpen ? (
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