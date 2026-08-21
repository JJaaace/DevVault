import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const source = fs.readFileSync(path.join(currentDirectory, '..', 'pages', 'WorkspaceResumePage.jsx'), 'utf8')

test('Guest Resume open and download actions use the loaded PDF blob', () => {
  const actionUrlUses = source.match(/const url = displayedResumePdfUrl \|\| \(isGuestMode \? '' : await loadResumePdf\(\)\)/g) || []

  assert.equal(actionUrlUses.length, 2)
  assert.match(source, /disabled=\{loadingPdf \|\| \(isGuestMode && !displayedResumePdfUrl\)\}/)
  assert.doesNotMatch(source, /const url = resumePdfUrl \|\| await loadResumePdf\(\)/)
})
