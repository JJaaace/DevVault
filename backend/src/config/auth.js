const isProduction = process.env.NODE_ENV === 'production'

const clerkSecretKey = String(process.env.CLERK_SECRET_KEY || '').trim()
const clerkPublishableKey = String(process.env.CLERK_PUBLISHABLE_KEY || '').trim()
const hasClerkConfig = Boolean(
  clerkSecretKey
  && clerkPublishableKey
  && !clerkSecretKey.includes('your_clerk')
  && !clerkPublishableKey.includes('your_clerk'),
)

if (isProduction && !hasClerkConfig) {
  throw new Error('CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY are required in production.')
}

module.exports = {
  hasClerkConfig,
  allowDevAuth: !isProduction && !hasClerkConfig,
}
