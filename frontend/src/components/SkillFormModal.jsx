import { useState } from 'react'
import { SKILL_LEVEL_OPTIONS, DEFAULT_SKILL_COLOR, normalizeSkillDate } from '../lib/skillUtils'

function normalizePercentage(value) {
  if (value === '' || value === null || value === undefined) {
    return 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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
    category: skill?.category ?? '',
    experienceLevel: skill?.experienceLevel ?? 'BEGINNER',
    percentage: skill?.percentage ?? 0,
    color: skill?.color ?? DEFAULT_SKILL_COLOR,
    lastUsed: skill?.lastUsed ? new Date(skill.lastUsed).toISOString().slice(0, 10) : '',
    notes: skill?.notes ?? '',
    relatedProjectIds: (skill?.relatedProjects || []).map((project) => String(project.id)),
  }
}

export function SkillFormModal({ skill, projects, onSubmit, onClose, submitting = false, errors = {}, errorMessage = '' }) {
  const [formData, setFormData] = useState(() => buildInitialState(skill))

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
      category: formData.category.trim(),
      experienceLevel: formData.experienceLevel,
      percentage: normalizePercentage(formData.percentage),
      color: formData.color.trim(),
      lastUsed: normalizeSkillDate(formData.lastUsed),
      notes: formData.notes.trim(),
      relatedProjectIds: formData.relatedProjectIds.map((id) => Number(id)),
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
              Track progress like a premium learning dashboard, with levels, percentages, and related projects.
            </p>
          </div>
          <button type="button" onClick={onClose} className="button-secondary px-4 py-2 text-sm">
            Close
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-[1.15rem] border border-[rgba(185,56,28,0.18)] bg-[rgba(255,242,236,0.9)] p-4 text-sm text-[#a83f1d]">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Name" name="name" value={formData.name} onChange={handleChange} placeholder="React" error={errors.name} required />
            <Field label="Category" name="category" value={formData.category} onChange={handleChange} placeholder="Frontend" error={errors.category} required />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Experience level" name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} type="select" options={SKILL_LEVEL_OPTIONS} required />
            <Field label="Color" name="color" value={formData.color} onChange={handleChange} type="color" helpText="Use a warm or vivid accent color for the ring." error={errors.color} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Percentage" name="percentage" value={formData.percentage} onChange={handleChange} type="range" min="0" max="100" step="1" helpText={`${formData.percentage}% complete`} error={errors.percentage} />
            <Field label="Last used" name="lastUsed" value={formData.lastUsed} onChange={handleChange} type="date" error={errors.lastUsed} />
          </div>

          <Field label="Notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="How this skill is being used right now." type="textarea" rows={4} />

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Related projects</p>
            <div className="grid gap-3 md:grid-cols-2">
              {projects.length ? projects.map((project) => {
                const checked = formData.relatedProjectIds.includes(String(project.id))

                return (
                  <label
                    key={project.id}
                    className={`flex items-center gap-3 rounded-[1.15rem] border px-4 py-3 text-sm transition ${checked ? 'border-[rgba(234,139,33,0.26)] bg-[rgba(255,247,233,0.88)]' : 'border-[rgba(126,89,45,0.12)] bg-white/70 hover:bg-white/90'}`}
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
                <div className="rounded-[1.15rem] border border-dashed border-[rgba(126,89,45,0.14)] bg-[rgba(255,255,255,0.58)] px-4 py-4 text-sm text-[var(--color-text-soft)]">
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