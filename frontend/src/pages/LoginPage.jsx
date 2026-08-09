import { SignIn } from '@clerk/clerk-react'
import { clerkAppearance } from '../lib/clerkAppearance'

export function LoginPage() {
  return (
    <div className="page-shell flex min-h-[calc(100vh-2rem)] items-center justify-center px-6 py-12">
      <div className="surface-card surface-card--strong w-full max-w-md px-6 py-6 md:px-7 md:py-7">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">Welcome back</h2>
        <p className="mb-6 mt-2 text-sm text-[var(--color-text-soft)]">
          Sign in to continue building your DevVault profile.
        </p>
        <SignIn routing="path" path="/login" signUpUrl="/signup" fallbackRedirectUrl="/dashboard" appearance={clerkAppearance} />
      </div>
    </div>
  )
}
