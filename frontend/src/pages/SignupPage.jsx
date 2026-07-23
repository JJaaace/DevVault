import { SignUp } from '@clerk/clerk-react'

export function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <h2 className="mb-2 text-2xl font-semibold text-white">Create your account</h2>
        <p className="mb-6 text-sm text-slate-400">
          Start your developer portfolio in just a few steps.
        </p>
        <SignUp routing="path" path="/signup" signInUrl="/login" />
      </div>
    </div>
  )
}
