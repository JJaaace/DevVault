import { useAuth } from '@clerk/clerk-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { fetchWorkspaceResume, fetchWorkspaceResumePdf, uploadWorkspaceResume } from '../lib/resumeWorkspaceApi'
import { useGuestMode } from '../context/GuestModeContext'

const MAX_RESUME_BYTES = 12 * 1024 * 1024

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

function isPdfFile(file) {
  const type = String(file?.type || '').toLowerCase()
  const name = String(file?.name || '')
  return type.includes('pdf') || /\.pdf$/i.test(name)
}

function WorkspaceResumePageContent({ getToken }) {
  const { isGuestMode, portfolio, resolvePath } = useGuestMode()
  const publicResumeFileUrl = portfolio?.resume?.fileUrl || ''
  const [resume, setResume] = useState(() => isGuestMode ? portfolio.resume : null)
  const [resumePdfUrl, setResumePdfUrl] = useState(() => isGuestMode ? portfolio.resume?.fileUrl || '' : '')
  const [resumeLoadError, setResumeLoadError] = useState('')
  const [resumePreviewError, setResumePreviewError] = useState('')
  const [loading, setLoading] = useState(!isGuestMode)
  const [uploading, setUploading] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [viewerReady, setViewerReady] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => {
      if (resumePdfUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(resumePdfUrl)
      }
    }
  }, [resumePdfUrl])

  const loadResumePdf = useCallback(async () => {
    if (isGuestMode) {
      const publicUrl = publicResumeFileUrl
      if (!publicUrl) throw new Error('No public resume is available.')
      setResumePdfUrl(publicUrl)
      return publicUrl
    }
    setLoadingPdf(true)
    setResumePreviewError('')
    try {
      const fileBlob = await fetchWorkspaceResumePdf(getToken)
      const blobUrl = URL.createObjectURL(fileBlob)
      setResumePdfUrl((current) => {
        if (current?.startsWith('blob:')) {
          URL.revokeObjectURL(current)
        }
        return blobUrl
      })
      return blobUrl
    } catch (error) {
      setResumePreviewError(error.message || 'Unable to load resume preview.')
      throw error
    } finally {
      setLoadingPdf(false)
    }
  }, [getToken, isGuestMode, publicResumeFileUrl])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setViewerReady(true)
    }, 120)

    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (isGuestMode) return
    async function loadResume() {
      try {
        setResumeLoadError('')
        const data = await fetchWorkspaceResume(getToken)
        setResume(data)
        if (data?.uploaded) {
          try {
            await loadResumePdf()
          } catch {
            // Keep resume metadata visible even if preview fetch fails.
          }
        } else {
          setResumePreviewError('')
          setResumePdfUrl((current) => {
            if (current?.startsWith('blob:')) {
              URL.revokeObjectURL(current)
            }
            return ''
          })
        }
      } catch (error) {
        setResume(null)
        setResumeLoadError(error.message || 'Unable to load resume workspace right now.')
      } finally {
        setLoading(false)
      }
    }

    loadResume()
  }, [getToken, isGuestMode, loadResumePdf])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const [file] = Array.from(event.target.files || [])
    if (!file) {
      return
    }

    if (!isPdfFile(file)) {
      toast.error('Please upload a PDF file.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_RESUME_BYTES) {
      toast.error('Resume must be 12 MB or smaller.')
      event.target.value = ''
      return
    }

    setUploading(true)
    try {
      const updated = await uploadWorkspaceResume(file, getToken)
      setResumeLoadError('')
      setResume(updated)
      await loadResumePdf()
      toast.success('Resume uploaded.')
    } catch (error) {
      toast.error(error.message || 'Unable to upload resume.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleOpenResume = async () => {
    try {
      const url = resumePdfUrl || await loadResumePdf()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error(error.message || 'Unable to open resume.')
    }
  }

  const handleDownloadResume = async () => {
    try {
      const url = resumePdfUrl || await loadResumePdf()
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = resume?.fileName || 'Resume.pdf'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    } catch (error) {
      toast.error(error.message || 'Unable to download resume.')
    }
  }

  const hasResume = Boolean(resume?.uploaded)
  const viewerKey = useMemo(() => `${resumePdfUrl || 'empty'}`, [resumePdfUrl])
  const canRenderPreview = hasResume && viewerReady && resumePdfUrl

  return (
    <div className="page-shell page-shell--wide page-stack pb-14">
      <section className="surface-card surface-card--hero px-6 py-8 md:px-10 md:py-10 fade-in-up">
        <p className="section-eyebrow">Resume Workspace</p>
        <h2 className="section-title mt-3 text-4xl md:text-5xl">{isGuestMode ? 'Recruiter-ready resume.' : 'Manage your recruiter-ready resume.'}</h2>
        <p className="section-copy mt-4 max-w-3xl text-sm leading-7 md:text-base">
          {isGuestMode ? 'Preview the actual uploaded PDF, open it in a new tab, download it, or print it directly.' : 'Upload, preview, replace, and download your current PDF without leaving DevVault.'}
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
            {resumeLoadError ? (
              <p className="mt-2 text-sm text-[#f3b17d]">{resumeLoadError}</p>
            ) : null}
            {resumePreviewError ? (
              <p className="mt-2 text-sm text-[#f3b17d]">{resumePreviewError}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            {!isGuestMode ? <button type="button" onClick={handleUploadClick} disabled={uploading} className="button-primary px-4 py-2 text-sm disabled:opacity-60">
              {uploading ? 'Uploading...' : hasResume ? 'Replace Resume' : 'Upload Resume'}
            </button> : null}
            {hasResume ? (
              <>
                <button type="button" onClick={handleOpenResume} disabled={loadingPdf} className="button-secondary px-4 py-2 text-sm disabled:opacity-60">
                  Open in New Tab
                </button>
                <button type="button" onClick={handleDownloadResume} disabled={loadingPdf} className="button-secondary px-4 py-2 text-sm disabled:opacity-60">
                  Download
                </button>
                {isGuestMode ? <button type="button" onClick={() => window.print()} className="button-secondary px-4 py-2 text-sm">Print / Save PDF</button> : null}
              </>
            ) : null}
            <Link to={resolvePath('/dashboard')} className="button-secondary px-4 py-2 text-sm">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {!isGuestMode ? <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} /> : null}
      </section>

      <section className="surface-card surface-card--strong resume-viewer-shell p-4 md:p-5">
        {hasResume ? (
          canRenderPreview ? (
            <div className="resume-viewer-frame-wrap resume-viewer-frame-wrap--glow">
              <iframe key={viewerKey} src={resumePdfUrl} title="Resume PDF Viewer" className="resume-viewer-frame" />
            </div>
          ) : resumePreviewError ? (
            <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">
              <p>{resumePreviewError}</p>
              <button type="button" onClick={() => loadResumePdf().catch(() => {})} className="button-secondary mt-4 px-4 py-2 text-sm">
                Retry Preview
              </button>
            </div>
          ) : (
            <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">Preparing secure viewer...</div>
          )
        ) : (
          <div className="widget-card p-6 text-sm text-[var(--color-text-soft)]">
            {isGuestMode ? 'No public resume is currently available.' : 'No resume uploaded yet. Upload a PDF to enable preview, download, and quick sharing.'}
          </div>
        )}
      </section>
    </div>
  )
}

function AuthenticatedWorkspaceResumePage() {
  const { getToken } = useAuth()
  return <WorkspaceResumePageContent getToken={getToken} />
}

export function WorkspaceResumePage() {
  const { isGuestMode } = useGuestMode()
  return isGuestMode ? <WorkspaceResumePageContent getToken={async () => ''} /> : <AuthenticatedWorkspaceResumePage />
}
