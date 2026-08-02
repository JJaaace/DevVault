const express = require('express')
const protectRoute = require('../middleware/auth')
const { getResume, uploadResume, deleteResume } = require('../controllers/resumeController')

const router = express.Router()

router.get('/', protectRoute, getResume)
router.put('/', protectRoute, uploadResume)
router.delete('/', protectRoute, deleteResume)

module.exports = router
