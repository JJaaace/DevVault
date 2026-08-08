import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'
import { AppToaster } from './components/ui/AppToaster'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export function Root() {
  const isPublicGuestRoute = typeof window !== 'undefined'
    && (window.location.pathname.startsWith('/portfolio/') || window.location.pathname.startsWith('/resume/'))

  if (!clerkPubKey) {
    if (isPublicGuestRoute) {
      return <BrowserRouter><App /></BrowserRouter>
    }

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
      <AppToaster />
    </>
  </StrictMode>,
)
