const express = require('express')
const protectRoute = require('../middleware/auth')
const { createProfile, deleteProfile, getProfile, updateProfile } = require('../controllers/profileController')

const router = express.Router()

router.get('/', protectRoute, getProfile)
router.post('/', protectRoute, createProfile)
router.put('/', protectRoute, updateProfile)
router.delete('/', protectRoute, deleteProfile)

module.exports = router
