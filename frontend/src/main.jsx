import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function Root() {
  if (!clerkPubKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-slate-200">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="mb-3 text-2xl font-semibold text-white">Clerk configuration needed</h1>
          <p className="text-sm text-slate-400">
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
    <Root />
  </StrictMode>,
)
