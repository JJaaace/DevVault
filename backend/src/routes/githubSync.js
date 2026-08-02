const express = require('express')
const protectRoute = require('../middleware/auth')
const { getGitHubSyncHandler, startGitHubSyncHandler } = require('../controllers/githubSyncController')

const router = express.Router()

router.post('/', protectRoute, startGitHubSyncHandler)
router.get('/:syncId', protectRoute, getGitHubSyncHandler)

module.exports = router