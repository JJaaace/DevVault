import { validateFrontendEnvironment } from '../../config/environment.js'

const validated = validateFrontendEnvironment(import.meta.env, { production: import.meta.env.PROD })

export const frontendEnvironment = Object.freeze({
  ...validated,
  apiBaseUrl: validated.apiBaseUrl || 'http://localhost:5001',
  publicAppUrl: validated.publicAppUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
})
