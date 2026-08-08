const express = require('express')
const protectRoute = require('../middleware/auth')
const { createProfile, deleteProfile, getProfile, updateProfile, updateProfileImage } = require('../controllers/profileController')

const router = express.Router()

router.get('/', protectRoute, getProfile)
router.post('/', protectRoute, createProfile)
router.put('/', protectRoute, updateProfile)
router.patch('/image', protectRoute, updateProfileImage)
router.delete('/', protectRoute, deleteProfile)

module.exports = router
