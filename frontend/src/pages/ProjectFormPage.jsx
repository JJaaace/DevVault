import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ProjectForm } from '../components/ProjectForm'
import { SectionHeader } from '../components/SectionHeader'
import { createProject, fetchProject, updateProject } from '../lib/projectsApi'

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
        await updateProject(projectId, formData, getToken)
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