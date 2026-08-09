import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { validateFrontendEnvironment } from './config/environment.js'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '.', ''), ...(globalThis.process?.env || {}) }
  validateFrontendEnvironment(env, { production: mode === 'production' })

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
    },
  }
})
