import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

const MAX_IMAGE_BYTES = 7 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])

export function VaultPortrait({
  src = '/profile/profile.jpg',
  alt = 'Jace Joseph portrait',
  allowLocalOverride = false,
  onImageChange,
}) {
  const [hovered, setHovered] = useState(false)
  const customImage = Boolean(src && src !== '/profile/profile.jpg')
  const [unlockUpload, setUnlockUpload] = useState(!customImage)
  const [tapTimes, setTapTimes] = useState([])
  const [failedSrc, setFailedSrc] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pointer, setPointer] = useState({ x: 50, y: 50, rx: 0, ry: 0 })
  const fileInputRef = useRef(null)
  const displayedImageSrc = src

  const handleMove = (event) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * 100
    const y = ((event.clientY - box.top) / box.height) * 100

    const rotateY = ((x - 50) / 50) * 5.5
    const rotateX = ((50 - y) / 50) * 5.5

    setPointer({ x, y, rx: rotateX, ry: rotateY })
  }

  const resetPointer = () => {
    setPointer({ x: 50, y: 50, rx: 0, ry: 0 })
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  const handlePortraitClick = () => {
    if (!allowLocalOverride || !customImage) {
      return
    }

    const now = Date.now()
    const recent = tapTimes.filter((timestamp) => now - timestamp < 1300)
    const next = [...recent, now]
    setTapTimes(next)

    if (next.length >= 3) {
      setUnlockUpload(true)
      setTapTimes([])
      setUploadError('')
    }
  }

  const handleFileChange = (event) => {
    const [file] = Array.from(event.target.files || [])
    if (!file) {
      return
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setUploadError('Use PNG, JPG, JPEG, or WEBP for your portrait.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError('Portrait image must be 7MB or smaller.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const nextSrc = typeof reader.result === 'string' ? reader.result : ''
      if (!nextSrc) {
        setUploadError('Unable to read this image. Try another file.')
        return
      }

      setSaving(true)
      try {
        if (onImageChange) {
          await onImageChange(nextSrc)
        }

        setUnlockUpload(false)
        setFailedSrc('')
        setUploadError('')

      } catch (error) {
        setUploadError(error.message || 'Unable to save this profile picture. Please try again.')
      } finally {
        setSaving(false)
      }
    }

    reader.onerror = () => {
      setUploadError('Unable to read this image. Try another file.')
    }

    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <motion.div
      className={`vault-portrait-shell ${hovered ? 'is-hovered' : ''}`.trim()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        resetPointer()
      }}
      onMouseMove={handleMove}
      animate={{
        rotateX: pointer.rx,
        rotateY: pointer.ry,
        scale: hovered ? 1.02 : 1,
      }}
      transition={{ type: 'spring', stiffness: 170, damping: 18, mass: 0.7 }}
      style={{
        '--vault-light-x': `${pointer.x}%`,
        '--vault-light-y': `${pointer.y}%`,
      }}
    >
      <div className="vault-portrait-border" aria-hidden="true" />
      <div className="vault-portrait-glow" aria-hidden="true" />
      <div className="vault-portrait-light" aria-hidden="true" />

      {allowLocalOverride ? (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="vault-portrait-input"
          onChange={handleFileChange}
        />
      ) : null}

      <div
        className={`vault-portrait-frame ${customImage ? 'vault-portrait-frame--clickable' : ''}`.trim()}
        onClick={handlePortraitClick}
      >
        {failedSrc === displayedImageSrc ? (
          <div className="vault-portrait-fallback">
            <p>Jace Joseph</p>
            <span>Developer Workspace Artifact</span>
          </div>
        ) : (
          <img
            src={displayedImageSrc}
            alt={alt}
            className="vault-portrait-image"
            loading="eager"
            onError={() => setFailedSrc(displayedImageSrc)}
          />
        )}
      </div>

      {allowLocalOverride && (!customImage || unlockUpload) ? (
        <div className="vault-portrait-controls">
          <button type="button" className="vault-portrait-control-button" onClick={triggerUpload} disabled={saving}>
            {saving ? 'Saving…' : customImage ? 'Replace photo' : 'Upload photo'}
          </button>
        </div>
      ) : null}

      {uploadError ? <p className="vault-portrait-upload-error">{uploadError}</p> : null}
    </motion.div>
  )
}
