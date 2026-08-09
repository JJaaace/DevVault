import { useState } from 'react'
import { SKILL_LEVEL_OPTIONS, DEFAULT_SKILL_COLOR, normalizeSkillDate } from '../lib/skillUtils'
import { getTechnologyOptions } from '../lib/technologyCatalog'

function normalizeOptionalInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

function normalizeTechnologyKey(value, name) {
  if (!value || value === 'custom') {
    if (!name) {
      return null
    }

    return name.toLowerCase().replace(/\s+/g, '-')
  }

  return value
}

function normalizeExperienceYears(value) {
  if (value === '' || value === null || value === undefined) {
    return 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function fieldClass(error) {
  return `field-input ${error ? 'border-[#b83a1c] ring-2 ring-[rgba(185,56,28,0.12)]' : ''}`.trim()
}

function textareaClass(error) {
  return `field-textarea ${error ? 'border-[#b83a1c] ring-2 ring-[rgba(185,56,28,0.12)]' : ''}`.trim()
}

function Field({ label, name, value, onChange, placeholder, error, type = 'text', rows, helpText, required = false, options = [], min, max, step }) {
  const sharedProps = {
    name,
    value,
    onChange,
    placeholder,
    required,
  }

  return (
    <label className="field-label">
      <strong>{label}</strong>
      {type === 'textarea' ? (
        <textarea {...sharedProps} rows={rows || 4} className={textareaClass(error)} />
      ) : type === 'select' ? (
        <select {...sharedProps} className={fieldClass(error)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <input {...sharedProps} type="checkbox" checked={Boolean(value)} className="h-4 w-4 rounded border-[rgba(126,89,45,0.24)] text-[var(--color-brand-strong)] focus:ring-[rgba(234,139,33,0.18)]" />
      ) : (
        <input {...sharedProps} type={type} min={min} max={max} step={step} className={fieldClass(error)} />
      )}
      {helpText ? <p className="mt-2 text-xs text-[var(--color-text-muted)]">{helpText}</p> : null}
      {error ? <p className="mt-2 text-sm text-[#b83a1c]">{error}</p> : null}
    </label>
  )
}

function buildInitialState(skill) {
  return {
    name: skill?.name ?? '',
    technologyKey: skill?.technologyKey ?? 'custom',
    category: skill?.category ?? '',
    experienceLevel: skill?.experienceLevel ?? 'BEGINNER',
    yearsExperience: skill?.yearsExperience ?? 0,
    firstUsedYear: skill?.firstUsedYear ?? new Date().getFullYear(),
    color: skill?.color ?? DEFAULT_SKILL_COLOR,
    lastUsed: skill?.lastUsed ? new Date(skill.lastUsed).toISOString().slice(0, 10) : '',
    notes: skill?.notes ?? '',
    favorite: Boolean(skill?.favorite),
    relatedProjectIds: (skill?.relatedProjects || []).map((project) => String(project.id)),
    publicVisible: skill?.publicVisible ?? true,
  }
}

export function SkillFormModal({ skill, projects, onSubmit, onClose, submitting = false, errors = {}, errorMessage = '' }) {
  const [formData, setFormData] = useState(() => buildInitialState(skill))
  const technologyOptions = [{ value: 'custom', label: 'Custom / not listed' }, ...getTechnologyOptions()]

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const toggleProject = (projectId) => {
    setFormData((current) => {
      const exists = current.relatedProjectIds.includes(String(projectId))
      return {
        ...current,
        relatedProjectIds: exists
          ? current.relatedProjectIds.filter((id) => id !== String(projectId))
          : [...current.relatedProjectIds, String(projectId)],
      }
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      name: formData.name.trim(),
      technologyKey: normalizeTechnologyKey(formData.technologyKey, formData.name.trim()),
      category: formData.category.trim(),
      experienceLevel: formData.experienceLevel,
      yearsExperience: normalizeExperienceYears(formData.yearsExperience),
      firstUsedYear: normalizeOptionalInteger(formData.firstUsedYear),
      color: formData.color.trim(),
      lastUsed: normalizeSkillDate(formData.lastUsed),
      notes: formData.notes.trim(),
      favorite: formData.favorite,
      relatedProjectIds: formData.relatedProjectIds.map((id) => Number(id)),
      publicVisible: formData.publicVisible,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(37,24,12,0.32)] px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="surface-card surface-card--strong w-full max-w-4xl max-h-[90vh] overflow-y-auto px-6 py-6 md:px-8 md:py-8 fade-in-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">Skills</p>
            <h3 className="section-title mt-2 text-2xl">{skill ? 'Edit skill' : 'Add a new skill'}</h3>
            <p className="section-copy mt-2 text-sm">
              Track practical experience with levels, years, project count, and related work.
            </p>
          </div>
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">
            Close
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-[1.15rem] border border-[rgba(185,56,28,0.3)] bg-[rgba(74,31,21,0.86)] p-4 text-sm text-[#f6c9bb]">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Name" name="name" value={formData.name} onChange={handleChange} placeholder="React" error={errors.name} required />
            <Field label="Category" name="category" value={formData.category} onChange={handleChange} placeholder="Frontend" error={errors.category} required />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Technology logo"
              name="technologyKey"
              value={formData.technologyKey}
              onChange={handleChange}
              type="select"
              options={technologyOptions}
            />
            <Field label="Color" name="color" value={formData.color} onChange={handleChange} type="color" helpText="Accent used on the skill card edge and highlights." error={errors.color} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Experience level" name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} type="select" options={SKILL_LEVEL_OPTIONS} required />
            <Field label="Last used" name="lastUsed" value={formData.lastUsed} onChange={handleChange} type="date" error={errors.lastUsed} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Years of experience" name="yearsExperience" value={formData.yearsExperience} onChange={handleChange} type="number" min="0" max="60" step="1" error={errors.yearsExperience} />
            <Field label="First used year" name="firstUsedYear" value={formData.firstUsedYear} onChange={handleChange} type="number" min="1980" max="2100" step="1" error={errors.firstUsedYear} />
          </div>

          <Field label="Notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="How this skill is being used right now." type="textarea" rows={4} />

          <label className="flex cursor-pointer items-center gap-3 rounded-[1.15rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
            <input type="checkbox" checked={formData.publicVisible} onChange={(event) => setFormData((current) => ({ ...current, publicVisible: event.target.checked }))} className="h-4 w-4 accent-[var(--color-brand)]" />
            <span className="text-sm text-[var(--color-text-soft)]">Visible on public portfolio</span>
          </label>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Related projects</p>
            <div className="grid gap-3 md:grid-cols-2">
              {projects.length ? projects.map((project) => {
                const checked = formData.relatedProjectIds.includes(String(project.id))

                return (
                  <label
                    key={project.id}
                    className={`flex items-center gap-3 rounded-[1.15rem] border px-4 py-3 text-sm transition ${checked ? 'border-[rgba(234,139,33,0.32)] bg-[rgba(63,45,30,0.86)]' : 'border-[rgba(214,160,89,0.2)] bg-[rgba(46,34,25,0.82)] hover:bg-[rgba(60,43,30,0.88)]'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProject(project.id)}
                      className="h-4 w-4 rounded border-[rgba(126,89,45,0.24)] text-[var(--color-brand-strong)] focus:ring-[rgba(234,139,33,0.18)]"
                    />
                    <span className="font-medium text-[var(--color-text)]">{project.title}</span>
                  </label>
                )
              }) : (
                <div className="rounded-[1.15rem] border border-dashed border-[rgba(214,160,89,0.24)] bg-[rgba(43,32,24,0.8)] px-4 py-4 text-sm text-[var(--color-text-soft)]">
                  Create a project first so you can link it here.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="button-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Saving...' : skill ? 'Update skill' : 'Create skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
