import { useState } from 'react'

function listToText(value) {
  if (!value) {
    return ''
  }

  return Array.isArray(value) ? value.join('\n') : String(value)
}

function normalizeListInput(value) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeNumberInput(value) {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isImageSource(value) {
  return typeof value === 'string' && value.length > 0
}

function fieldClass(error) {
  return `field-input ${error ? 'border-[#b83a1c] ring-2 ring-[rgba(185,56,28,0.12)]' : ''}`.trim()
}

function textareaClass(error) {
  return `field-textarea ${error ? 'border-[#b83a1c] ring-2 ring-[rgba(185,56,28,0.12)]' : ''}`.trim()
}

function Field({ label, name, value, onChange, placeholder, error, type = 'text', rows, min, helpText, required = false }) {
  const inputProps = {
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
        <textarea {...inputProps} rows={rows || 4} className={textareaClass(error)} />
      ) : (
        <input {...inputProps} type={type} min={min} className={fieldClass(error)} />
      )}
      {helpText ? <p className="mt-2 text-xs text-[var(--color-text-muted)]">{helpText}</p> : null}
      {error ? <p className="mt-2 text-sm text-[#b83a1c]">{error}</p> : null}
    </label>
  )
}

export function ProfileForm({ profile, onSubmit, onCancel, submitting = false, errors = {} }) {
  const initialImageUrl = profile?.profileImageUrl ?? profile?.profileImage ?? ''
  const [formData, setFormData] = useState(() => ({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    username: profile?.username ?? '',
    bio: profile?.bio ?? '',
    profileImageUrl: initialImageUrl,
    school: profile?.school ?? profile?.university ?? '',
    graduationYear: profile?.graduationYear ?? '',
    major: profile?.major ?? '',
    location: profile?.location ?? [profile?.state, profile?.country].filter(Boolean).join(', '),
    dreamCompanies: listToText(profile?.dreamCompanies),
    currentRole: profile?.currentRole ?? '',
    favoriteLanguage: profile?.favoriteLanguage ?? '',
    favoriteFramework: profile?.favoriteFramework ?? '',
    yearsCoding: profile?.yearsCoding ?? '',
    interests: listToText(profile?.interests),
    githubUrl: profile?.githubUrl ?? '',
    linkedinUrl: profile?.linkedinUrl ?? '',
    websiteUrl: profile?.websiteUrl ?? '',
  }))
  const [imagePreview, setImagePreview] = useState(initialImageUrl)
  const [uploadError, setUploadError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.')
      return
    }

    setUploadError('')

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setFormData((current) => ({ ...current, profileImageUrl: result }))
      setImagePreview(result)
    }
    reader.onerror = () => {
      setUploadError('Unable to read that image. Please try another file.')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setFormData((current) => ({ ...current, profileImageUrl: '' }))
    setImagePreview('')
    setUploadError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      ...formData,
      profileImageUrl: formData.profileImageUrl.trim(),
      school: formData.school.trim(),
      major: formData.major.trim(),
      location: formData.location.trim(),
      dreamCompanies: normalizeListInput(formData.dreamCompanies),
      currentRole: formData.currentRole.trim(),
      favoriteLanguage: formData.favoriteLanguage.trim(),
      favoriteFramework: formData.favoriteFramework.trim(),
      interests: normalizeListInput(formData.interests),
      githubUrl: formData.githubUrl.trim(),
      linkedinUrl: formData.linkedinUrl.trim(),
      websiteUrl: formData.websiteUrl.trim(),
      graduationYear: normalizeNumberInput(formData.graduationYear),
      yearsCoding: normalizeNumberInput(formData.yearsCoding),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card surface-card--strong space-y-6 px-6 py-6 md:px-8 md:py-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="First name" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Alex" error={errors.firstName} required />
        <Field label="Last name" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Morgan" error={errors.lastName} required />
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <Field label="Username" name="username" value={formData.username} onChange={handleChange} placeholder="alexm" error={errors.username} required />
        <div className="field-label">
          <strong>Profile picture</strong>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="field-input file:mr-4 file:rounded-full file:border-0 file:bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand),var(--color-brand-strong))] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:cursor-pointer" />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Upload an image from your device. It will be saved with your profile and used across your workspace.</p>
          {uploadError ? <p className="mt-2 text-sm text-[#b83a1c]">{uploadError}</p> : null}
          {errors.profileImageUrl ? <p className="mt-2 text-sm text-[#b83a1c]">{errors.profileImageUrl}</p> : null}
          {isImageSource(imagePreview) ? (
            <div className="mt-3 flex items-center gap-3 rounded-[1.15rem] border border-[rgba(126,89,45,0.12)] bg-[rgba(255,255,255,0.72)] p-3">
              <img src={imagePreview} alt="Profile preview" className="h-14 w-14 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">Image ready</p>
                <p className="truncate text-xs text-[var(--color-text-soft)]">This image will be saved with your profile.</p>
              </div>
              <button type="button" onClick={handleRemoveImage} className="button-secondary px-3 py-2 text-xs">
                Remove
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Field label="Bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Software engineer focused on building reliable user experiences." error={errors.bio} type="textarea" rows={4} required />

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="School" name="school" value={formData.school} onChange={handleChange} placeholder="University of Washington" />
        <Field label="Major" name="major" value={formData.major} onChange={handleChange} placeholder="Computer Science" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Graduation year" name="graduationYear" value={formData.graduationYear} onChange={handleChange} placeholder="2025" type="number" />
        <Field label="Years coding" name="yearsCoding" value={formData.yearsCoding} onChange={handleChange} placeholder="5" type="number" min="0" error={errors.yearsCoding} />
        <Field label="Location" name="location" value={formData.location} onChange={handleChange} placeholder="Seattle, WA, USA" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="Current role" name="currentRole" value={formData.currentRole} onChange={handleChange} placeholder="Frontend engineer" />
        <Field label="Favorite language" name="favoriteLanguage" value={formData.favoriteLanguage} onChange={handleChange} placeholder="TypeScript" />
        <Field label="Favorite framework" name="favoriteFramework" value={formData.favoriteFramework} onChange={handleChange} placeholder="React" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Dream companies"
          name="dreamCompanies"
          value={formData.dreamCompanies}
          onChange={handleChange}
          placeholder="Google\nStripe\nFigma"
          type="textarea"
          rows={4}
          helpText="Separate entries with commas or new lines."
        />
        <Field
          label="Interests"
          name="interests"
          value={formData.interests}
          onChange={handleChange}
          placeholder="AI\nDesign systems\nOpen source"
          type="textarea"
          rows={4}
          helpText="Separate entries with commas or new lines."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Field label="GitHub URL" name="githubUrl" value={formData.githubUrl} onChange={handleChange} placeholder="https://github.com/username" error={errors.githubUrl} />
        <Field label="LinkedIn URL" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/username" error={errors.linkedinUrl} />
        <Field label="Website URL" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} placeholder="https://your-site.com" error={errors.websiteUrl} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="button-secondary px-4 py-2 text-sm">
            Cancel
          </button>
        ) : null}
        <button type="submit" disabled={submitting} className="button-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Saving...' : 'Save profile'}
        </button>
      </div>
    </form>
  )
}
