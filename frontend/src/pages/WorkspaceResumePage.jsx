import { useAuth } from '@clerk/clerk-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchWorkspaceResume, uploadWorkspaceResume } from '../lib/resumeWorkspaceApi'

function formatBytes(size) {
  const bytes = Number(size || 0)
  if (bytes <= 0) {
    return '0 KB'
  }

  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(kb / 1024).toFixed(2)} MB`
}

function formatDate(value) {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function WorkspaceResumePage() {
  const { getToken } = useAuth()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [viewerReady, setViewerReady] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setViewerReady(true)
    }, 120)

    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    async function loadResume() {
      try {
        const data = await fetchWorkspaceResume(getToken)
        setResume(data)
      } catch (error) {
        toast.error(error.message || 'Unable to load resume.')
      } finally {
        setLoading(false)
      }
    }

    loadResume()
  }, [getToken])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const [file] = Array.from(event.target.files || [])
    if (!file) {
      return
    }

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.')
      event.target.value = ''
      return
    }

    setUploading(true)
    try {
      const updated = await uploadWorkspaceResume(file, getToken)
      setResume(updated)
      toast.success('Resume uploaded.')
    } catch (error) {
      toast.error(error.message || 'Unable to upload resume.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const hasResume = Boolean(resume?.uploaded && resume?.fileUrl)
  const viewerKey = useMemo(() => `${resume?.fileUrl || 'empty'}`, [resume?.fileUrl])

  return (
    <div className="page-shell page-shell--wide page-stack pb-14">
      <section className="surface-card surface-card--hero px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <p className="section-eyebrow">Resume Workspace</p>
        <h2 className="section-title mt-3 text-4xl md:text-5xl">Manage your recruiter-ready resume.</h2>
        <p className="section-copy mt-4 max-w-3xl text-sm leading-7 md:text-base">
          Upload, preview, replace, and download your current PDF without leaving DevVault.
        </p>
      </section>

      <section className="surface-card surface-card--strong p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">Status</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              {loading ? 'Loading...' : hasResume ? (resume.fileName || 'Resume.pdf') : 'No resume uploaded'}
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
              Last updated: {formatDate(resume?.lastUpdated)}
              {hasResume ? ` • ${formatBytes(resume?.byteSize)}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleUploadClick} disabled={uploading} className="button-primary px-4 py-2 text-sm disabled:opacity-60">
              {uploading ? 'Uploading...' : hasResume ? 'Replace Resume' : 'Upload Resume'}
            </button>
            {hasResume ? (
              <>
                <a href={resume.fileUrl} target="_blank" rel="noreferrer" className="button-secondary px-4 py-2 text-sm">
                  Open in New Tab
                </a>
                <a href={resume.fileUrl} download className="button-secondary px-4 py-2 text-sm">
                  Download
                </a>
              </>
            ) : null}
            <Link to="/dashboard" className="button-secondary px-4 py-2 text-sm">
              Back to Dashboard
            </Link>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
      </section>

      <section className="surface-card surface-card--strong resume-viewer-shell p-4 md:p-5">
        {hasResume ? (
          viewerReady ? (
            <div className="resume-viewer-frame-wrap">
              <iframe key={viewerKey} src={resume.fileUrl} title="Resume PDF Viewer" className="resume-viewer-frame" />
            </div>
          ) : (
            <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">Preparing secure viewer...</div>
          )
        ) : (
          <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">
            No resume uploaded yet. Upload a PDF to enable preview, download, and quick sharing.
          </div>
        )}
      </section>
    </div>
  )
}
