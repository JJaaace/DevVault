const express = require('express')
const protectRoute = require('../middleware/auth')
const {
  getProjects,
  getProject,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  getProjectArtworkHandler,
} = require('../controllers/projectsController')

const router = express.Router()

router.get('/', protectRoute, getProjects)
router.get('/:projectId/artwork', protectRoute, getProjectArtworkHandler)
router.get('/:projectId', protectRoute, getProject)
router.post('/', protectRoute, createProjectHandler)
router.put('/:projectId', protectRoute, updateProjectHandler)
router.delete('/:projectId', protectRoute, deleteProjectHandler)

module.exports = router
