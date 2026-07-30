import { SignUp } from '@clerk/clerk-react'
import { clerkAppearance } from '../lib/clerkAppearance'

export function SignupPage() {
  return (
    <div className="page-shell flex min-h-[calc(100vh-2rem)] items-center justify-center px-6 py-12">
      <div className="surface-card surface-card--strong w-full max-w-md px-6 py-6 md:px-7 md:py-7">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">Create your account</h2>
        <p className="mb-6 mt-2 text-sm text-[var(--color-text-soft)]">
          Start your developer portfolio in just a few steps.
        </p>
        <SignUp routing="path" path="/signup" signInUrl="/login" appearance={clerkAppearance} />
      </div>
    </div>
  )
}
