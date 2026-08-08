import { useState } from 'react'
import {
  PROJECT_STATUS_OPTIONS,
  listToTextarea,
  textareaToList,
  toDateInputValue,
} from '../lib/projectUtils'

function fieldClass(error) {
  return `field-input ${error ? 'border-[#b83a1c] ring-2 ring-[rgba(185,56,28,0.12)]' : ''}`.trim()
}

function textareaClass(error) {
  return `field-textarea ${error ? 'border-[#b83a1c] ring-2 ring-[rgba(185,56,28,0.12)]' : ''}`.trim()
}

function normalizeImageInput(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) {
    return ''
  }

  if (/^(https?:\/\/|data:|blob:|\/)/i.test(trimmed)) {
    return trimmed
  }

  // Treat bare local asset paths as app-public paths.
  return `/${trimmed.replace(/^\/+/, '')}`
}

function isImageSource(value) {
  const normalized = String(value || '').trim()
  return /^(https?:\/\/|data:image\/|blob:|\/)/i.test(normalized)
}

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function Field({ label, name, value, onChange, placeholder, error, type = 'text', rows, helpText, required = false, min, max, step }) {
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
    displayOrder: project?.displayOrder ?? '',
    title: project?.title ?? '',
    description: project?.description ?? '',
    githubUrl: project?.githubUrl ?? '',
    liveDemoUrl: project?.liveDemoUrl ?? '',
    image: project?.image || project?.bannerImageUrl || '',
    techStack: listToTextarea(project?.techStack),
    keyFeatures: listToTextarea(project?.keyFeatures),
    accentTone: project?.accentTone ?? '',
    status: project?.status ?? 'PLANNING',
    dateStarted: toDateInputValue(project?.dateStarted),
    targetCompletion: toDateInputValue(project?.targetCompletion),
    challenges: project?.challenges ?? '',
    lessonsLearned: project?.lessonsLearned ?? '',
    publicVisible: project?.publicVisible ?? true,
    featured: project?.featured ?? false,
  }
}

export function ProjectForm({ project, onSubmit, onCancel, submitting = false, errors = {}, submitLabel = 'Save project' }) {
  const [formData, setFormData] = useState(() => buildInitialState(project))
  const [imageUploadError, setImageUploadError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleImageUpload = (event) => {
    const [file] = Array.from(event.target.files || [])
    if (!file) {
      return
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setImageUploadError('Please upload a PNG, JPG, JPEG, or WEBP image.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setImageUploadError('Image file must be 5MB or smaller.')
      event.target.value = ''
      return
    }

    setImageUploadError('')
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setFormData((current) => ({ ...current, image: result }))
      event.target.value = ''
    }
    reader.onerror = () => {
      setImageUploadError('Unable to read that image file. Please try another one.')
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageUploadError('')
    setFormData((current) => ({ ...current, image: '' }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const resolvedTitle = formData.title.trim() || project?.title || ''
    const resolvedDescription = formData.description.trim() || project?.description || ''
    const resolvedStatus = formData.status || project?.status || 'PLANNING'
    const resolvedImage = normalizeImageInput(formData.image) || normalizeImageInput(project?.image || project?.bannerImageUrl || '')

    onSubmit({
      displayOrder: formData.displayOrder === '' ? null : Number(formData.displayOrder),
      title: resolvedTitle,
      description: resolvedDescription,
      githubUrl: formData.githubUrl.trim(),
      liveDemoUrl: formData.liveDemoUrl.trim(),
      image: resolvedImage,
      bannerImageUrl: resolvedImage,
      techStack: textareaToList(formData.techStack),
      keyFeatures: textareaToList(formData.keyFeatures),
      accentTone: formData.accentTone.trim(),
      status: resolvedStatus,
      dateStarted: formData.dateStarted || null,
      targetCompletion: formData.targetCompletion || null,
      challenges: formData.challenges.trim(),
      lessonsLearned: formData.lessonsLearned.trim(),
      publicVisible: formData.publicVisible,
      featured: formData.featured,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card surface-card--strong space-y-6 px-6 py-6 md:px-8 md:py-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Display order"
          name="displayOrder"
          value={formData.displayOrder}
          onChange={handleChange}
          placeholder="1"
          error={errors.displayOrder}
          type="number"
          min="0"
          step="1"
          helpText="Lower numbers appear first in your project showcase."
        />
        <Field
          label="Project title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="LaunchPad"
          error={errors.title}
        />
        <label className="field-label">
          <strong>Status</strong>
          <div className={`mt-2 grid grid-cols-2 gap-2 rounded-[1.05rem] border border-[rgba(214,160,89,0.22)] bg-[rgba(42,31,23,0.84)] p-2 ${errors.status ? 'border-[#b83a1c] ring-2 ring-[rgba(185,56,28,0.12)]' : ''}`.trim()}>
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData((current) => ({ ...current, status: option.value }))}
                className={`rounded-[0.9rem] px-3 py-2 text-sm font-medium transition ${formData.status === option.value
                  ? 'bg-[linear-gradient(135deg,#f9c96e,#ea8b21,#d96a16)] text-white shadow-[0_10px_24px_rgba(217,106,22,0.24)]'
                    : 'bg-[rgba(56,41,30,0.8)] text-[var(--color-text-soft)] hover:bg-[rgba(69,50,35,0.9)] hover:text-[var(--color-text)]'}`.trim()}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.status ? <p className="mt-2 text-sm text-[#b83a1c]">{errors.status}</p> : null}
        </label>
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
      />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-[1.15rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
          <input type="checkbox" checked={formData.publicVisible} onChange={(event) => setFormData((current) => ({ ...current, publicVisible: event.target.checked }))} className="h-4 w-4 accent-[var(--color-brand)]" />
          <span className="text-sm text-[var(--color-text-soft)]">Visible on public portfolio</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-[1.15rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] px-4 py-3">
          <input type="checkbox" checked={formData.featured} onChange={(event) => setFormData((current) => ({ ...current, featured: event.target.checked }))} className="h-4 w-4 accent-[var(--color-brand)]" />
          <span className="text-sm text-[var(--color-text-soft)]">Featured project (replaces the current selection)</span>
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="GitHub URL" name="githubUrl" value={formData.githubUrl} onChange={handleChange} placeholder="https://github.com/username/project" error={errors.githubUrl} />
        <Field label="Live demo URL" name="liveDemoUrl" value={formData.liveDemoUrl} onChange={handleChange} placeholder="https://project.dev" error={errors.liveDemoUrl} />
        <Field label="Project image URL" name="image" value={formData.image} onChange={handleChange} placeholder="/project-showcase/devvault.svg" error={errors.bannerImageUrl || errors.image} helpText="Editable banner artwork path for the project showcase card." />
      </div>

      <div className="rounded-[1.15rem] border border-[rgba(214,160,89,0.2)] bg-[rgba(44,33,24,0.82)] p-4">
        <p className="text-sm font-semibold text-[var(--color-text)]">Project banner upload</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">Upload PNG/JPG/JPEG/WEBP up to 5MB. Uploaded images are embedded directly into the project record.</p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleImageUpload}
          className="field-input mt-3 file:mr-4 file:rounded-full file:border-0 file:bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand),var(--color-brand-strong))] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:cursor-pointer"
        />
        {imageUploadError ? <p className="mt-2 text-sm text-[#b83a1c]">{imageUploadError}</p> : null}
        {(errors.bannerImageUrl || errors.image) ? <p className="mt-2 text-sm text-[#b83a1c]">{errors.bannerImageUrl || errors.image}</p> : null}

        {isImageSource(formData.image) ? (
          <div className="mt-3 flex items-center gap-3 rounded-[1.05rem] border border-[rgba(214,160,89,0.24)] bg-[rgba(38,28,20,0.84)] p-3">
            <img src={formData.image} alt="Project banner preview" className="h-16 w-24 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text)]">Banner preview ready</p>
              <p className="text-xs text-[var(--color-text-muted)]">This image will appear on project showcase cards after save.</p>
            </div>
            <button type="button" onClick={clearImage} className="button-secondary px-3 py-2 text-xs">Remove</button>
          </div>
        ) : null}
      </div>

      <Field label="Accent tone" name="accentTone" value={formData.accentTone} onChange={handleChange} placeholder="security, cloud, product, ai" error={errors.accentTone} helpText="Optional aesthetic hint used for visual treatment." />

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Date started" name="dateStarted" value={formData.dateStarted} onChange={handleChange} type="date" error={errors.dateStarted} />
        <Field label="Target completion" name="targetCompletion" value={formData.targetCompletion} onChange={handleChange} type="date" error={errors.targetCompletion} />
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
          error={errors.techStack}
          helpText="Separate entries with commas or new lines."
        />
        <Field
          label="Key features"
          name="keyFeatures"
          value={formData.keyFeatures}
          onChange={handleChange}
          placeholder="Realtime validation\nThreat scoring\nAdaptive suggestions"
          type="textarea"
          rows={4}
          error={errors.keyFeatures}
          helpText="Separate entries with commas or new lines."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
