const express = require('express')
const protectRoute = require('../middleware/auth')
const { getDashboard } = require('../controllers/dashboardController')

const router = express.Router()

router.get('/', protectRoute, getDashboard)

module.exports = router
