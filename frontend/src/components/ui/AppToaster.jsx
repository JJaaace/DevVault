import { Toaster } from 'sonner'

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: '1rem',
          border: '1px solid rgba(214, 160, 89, 0.22)',
          background: 'rgba(44, 33, 24, 0.94)',
          color: 'var(--color-text)',
          boxShadow: '0 24px 60px rgba(18, 12, 8, 0.38)',
        },
      }}
    />
  )
}
