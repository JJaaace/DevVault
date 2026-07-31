import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export function Root() {
  if (!clerkPubKey) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-6 text-center text-[var(--color-text)]">
        <div className="surface-card surface-card--strong max-w-md px-8 py-10">
          <h1 className="mb-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">Clerk configuration needed</h1>
          <p className="text-sm text-[var(--color-text-soft)]">
            Set your Clerk publishable key in the frontend environment file to enable sign-up and login.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <Root />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            borderRadius: '1rem',
            border: '1px solid rgba(126, 89, 45, 0.16)',
            background: 'rgba(255, 255, 255, 0.96)',
            color: 'var(--color-text)',
            boxShadow: '0 24px 60px rgba(37, 24, 12, 0.14)',
          },
        }}
      />
    </>
  </StrictMode>,
)
