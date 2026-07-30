import { useState } from 'react'
import {
  PROJECT_STATUS_OPTIONS,
  listToTextarea,
  textareaToList,
  toDateInputValue,
} from '../lib/projectUtils'

function normalizeNumberInput(value) {
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

function Field({ label, name, value, onChange, placeholder, error, type = 'text', rows, helpText, required = false, min, max, step, options = [] }) {
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
        <select {...sharedProps} className={`field-select ${error ? 'border-[#b83a1c] ring-2 ring-[rgba(185,56,28,0.12)]' : ''}`.trim()}>
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input {...sharedProps} type={type} min={min} max={max} step={step} className={fieldClass(error)} />
      )}
      {helpText ? <p className="mt-2 text-xs text-[var(--color-text-muted)]">{helpText}</p> : null}
      {error ? <p className="mt-2 text-sm text-[#b83a1c]">{error}</p> : null}
    </label>
  )
}

function buildInitialState(project) {
  return {
    title: project?.title ?? '',
    description: project?.description ?? '',
    githubUrl: project?.githubUrl ?? '',
    liveDemoUrl: project?.liveDemoUrl ?? '',
    bannerImageUrl: project?.bannerImageUrl ?? '',
    techStack: listToTextarea(project?.techStack),
    status: project?.status ?? 'PLANNING',
    completionPercentage: project?.completionPercentage ?? 0,
    dateStarted: toDateInputValue(project?.dateStarted),
    targetCompletion: toDateInputValue(project?.targetCompletion),
    challenges: project?.challenges ?? '',
    lessonsLearned: project?.lessonsLearned ?? '',
  }
}

export function ProjectForm({ project, onSubmit, onCancel, submitting = false, errors = {}, submitLabel = 'Save project' }) {
  const [formData, setFormData] = useState(() => buildInitialState(project))

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      githubUrl: formData.githubUrl.trim(),
      liveDemoUrl: formData.liveDemoUrl.trim(),
      bannerImageUrl: formData.bannerImageUrl.trim(),
      techStack: textareaToList(formData.techStack),
      status: formData.status,
      completionPercentage: normalizeNumberInput(formData.completionPercentage),
      dateStarted: formData.dateStarted || null,
      targetCompletion: formData.targetCompletion || null,
      challenges: formData.challenges.trim(),
      lessonsLearned: formData.lessonsLearned.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card surface-card--strong space-y-6 px-6 py-6 md:px-8 md:py-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Project title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="LaunchPad"
          error={errors.title}
          required
        />
        <Field
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          type="select"
          options={PROJECT_STATUS_OPTIONS}
          required
        />
      </div>

      <Field
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="A polished platform for managing developer goals and portfolio projects."
        error={errors.description}
        type="textarea"
        rows={4}
        required
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="GitHub URL" name="githubUrl" value={formData.githubUrl} onChange={handleChange} placeholder="https://github.com/username/project" error={errors.githubUrl} />
        <Field label="Live demo URL" name="liveDemoUrl" value={formData.liveDemoUrl} onChange={handleChange} placeholder="https://project.dev" error={errors.liveDemoUrl} />
        <Field label="Banner image URL" name="bannerImageUrl" value={formData.bannerImageUrl} onChange={handleChange} placeholder="https://images.example.com/banner.jpg" error={errors.bannerImageUrl} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Date started" name="dateStarted" value={formData.dateStarted} onChange={handleChange} type="date" error={errors.dateStarted} />
        <Field label="Target completion" name="targetCompletion" value={formData.targetCompletion} onChange={handleChange} type="date" error={errors.targetCompletion} />
        <Field label="Completion percentage" name="completionPercentage" value={formData.completionPercentage} onChange={handleChange} type="range" min="0" max="100" step="1" helpText={`${formData.completionPercentage}% complete`} error={errors.completionPercentage} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Tech stack"
          name="techStack"
          value={formData.techStack}
          onChange={handleChange}
          placeholder="Next.js\nTailwind CSS\nPrisma"
          type="textarea"
          rows={4}
          helpText="Separate entries with commas or new lines."
        />
        <Field
          label="Challenges"
          name="challenges"
          value={formData.challenges}
          onChange={handleChange}
          placeholder="Handling auth flow and responsive data tables."
          type="textarea"
          rows={4}
        />
      </div>

      <Field
        label="Lessons learned"
        name="lessonsLearned"
        value={formData.lessonsLearned}
        onChange={handleChange}
        placeholder="I learned how to structure a feature around reusable primitives."
        type="textarea"
        rows={4}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="button-secondary px-4 py-2 text-sm">
            Cancel
          </button>
        ) : null}
        <button type="submit" disabled={submitting} className="button-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}