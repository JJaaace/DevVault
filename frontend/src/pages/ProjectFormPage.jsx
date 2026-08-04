import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ProjectForm } from '../components/ProjectForm'
import { SectionHeader } from '../components/SectionHeader'
import { createProject, fetchProject, updateProject } from '../lib/projectsApi'

function normalizeComparableDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function normalizeComparableList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

function buildProjectUpdatePatch(existingProject, nextPayload) {
  if (!existingProject) {
    return { ...nextPayload }
  }

  const patch = {}
  const listKeys = new Set(['techStack', 'keyFeatures'])
  const dateKeys = new Set(['dateStarted', 'targetCompletion'])

  for (const [key, value] of Object.entries(nextPayload)) {
    if (key === 'image') {
      const previousImage = existingProject.image || existingProject.bannerImageUrl || null
      const incomingImage = value || null
      if (previousImage !== incomingImage) {
        patch[key] = value
      }
      continue
    }

    if (listKeys.has(key)) {
      const previous = normalizeComparableList(existingProject[key])
      const incoming = normalizeComparableList(value)
      if (JSON.stringify(previous) !== JSON.stringify(incoming)) {
        patch[key] = incoming
      }
      continue
    }

    if (dateKeys.has(key)) {
      const previous = normalizeComparableDate(existingProject[key])
      const incoming = normalizeComparableDate(value)
      if (previous !== incoming) {
        patch[key] = value
      }
      continue
    }

    const previous = existingProject[key] ?? null
    const incoming = value ?? null
    if (previous !== incoming) {
      patch[key] = value
    }
  }

  return patch
}

function parseErrorPayload(message) {
  if (!message) {
    return { message: 'Unable to save project.' }
  }

  try {
    const parsed = JSON.parse(message)
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch {
    // fall back to plain text
  }

  return { message }
}

export function ProjectFormPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { getToken } = useAuth()
  const isEditing = Boolean(projectId)

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    async function loadProject() {
      if (!isEditing) {
        setLoading(false)
        return
      }

      try {
        const data = await fetchProject(projectId, getToken)
        setProject(data)
      } catch (err) {
        setError(err.message || 'Unable to load project.')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [getToken, isEditing, projectId])

  const handleSubmit = async (formData) => {
    setSubmitting(true)
    setError('')
    setErrors({})

    try {
      if (isEditing) {
        const patch = buildProjectUpdatePatch(project, formData)

        if (!Object.keys(patch).length) {
          toast.info('No changes detected.')
          navigate('/projects')
          return
        }

        await updateProject(projectId, patch, getToken)
      } else {
        await createProject(formData, getToken)
      }

      toast.success(isEditing ? 'Project updated successfully.' : 'Project created successfully.')
      navigate('/projects')
    } catch (err) {
      if (err?.details && typeof err.details === 'object') {
        setErrors(err.details)
        toast.error('Please fix the highlighted fields and try again.')
        return
      }

      const parsed = parseErrorPayload(err.message || '')
      if (parsed.errors) {
        setErrors(parsed.errors)
        toast.error('Please fix the highlighted fields and try again.')
      } else {
        toast.error(parsed.message || 'Unable to save project.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell page-shell--wide page-stack pb-14">
      <SectionHeader
        eyebrow="Projects"
        title={isEditing ? 'Edit project' : 'New project'}
        description="Capture your project like a polished product launch, with the details recruiters actually care about."
      />

      {loading ? <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">Loading project...</div> : null}

      {error ? <div className="widget-card border border-[rgba(185,56,28,0.18)] bg-[rgba(255,242,236,0.9)] p-4 text-sm text-[#a83f1d]">{error}</div> : null}

      {!loading ? (
        <ProjectForm
          key={project?.id || 'new-project'}
          project={project}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/projects')}
          submitting={submitting}
          errors={errors}
          submitLabel={isEditing ? 'Update project' : 'Create project'}
        />
      ) : null}
    </div>
  )
}