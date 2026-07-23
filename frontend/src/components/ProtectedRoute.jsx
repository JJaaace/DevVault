import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  )
}
