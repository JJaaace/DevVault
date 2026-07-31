import { useAuth } from '@clerk/clerk-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DashboardCard } from '../components/DashboardCard'
import { SkillCard } from '../components/SkillCard'
import { SkillFormModal } from '../components/SkillFormModal'
import { SkillsEmptyState } from '../components/SkillsEmptyState'
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

  const filteredSkills = useMemo(() => {
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
      .sort((left, right) => right.percentage - left.percentage)
  }, [skills, search, category])

  const totalSkills = skills.length
  const averageProgress = totalSkills ? Math.round(skills.reduce((sum, skill) => sum + (skill.percentage || 0), 0) / totalSkills) : 0

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
      <div className="max-w-sm rounded-[1.15rem] border border-[rgba(126,89,45,0.16)] bg-white px-4 py-4 shadow-[0_24px_60px_rgba(37,24,12,0.14)]">
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
      <section className="surface-card surface-card--hero px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-eyebrow">Skills</p>
            <h2 className="section-title mt-3 text-4xl md:text-5xl">Track your growth like a premium health app.</h2>
            <p className="section-copy mt-4 max-w-2xl text-sm leading-7 md:text-base">
              Measure progress, connect skills to projects, and keep your learning momentum visible at a glance.
            </p>
          </div>
          <button type="button" onClick={openCreateModal} className="button-primary px-5 py-3 text-sm md:text-base">
            Add Skill
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="widget-card bg-[rgba(255,255,255,0.76)] p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Total skills</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{totalSkills}</p>
          </div>
          <div className="widget-card bg-[rgba(255,255,255,0.76)] p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Average progress</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{averageProgress}%</p>
          </div>
          <div className="widget-card bg-[rgba(255,255,255,0.76)] p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Categories</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{categoryOptions.length - 1}</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="widget-card border border-[rgba(185,56,28,0.18)] bg-[rgba(255,242,236,0.9)] p-4 text-sm text-[#a83f1d]">
          {error}
        </div>
      ) : null}

      <div className="surface-card surface-card--strong p-4 md:p-5">
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
      </div>

      {loading ? (
        <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">Loading skills...</div>
      ) : filteredSkills.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredSkills.map((skill, index) => (
            <div key={skill.id} className={`fade-in-up stagger-${Math.min(index + 1, 4)}`}>
              <SkillCard skill={skill} onEdit={() => openEditModal(skill)} onDelete={() => handleDelete(skill)} />
            </div>
          ))}
        </div>
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