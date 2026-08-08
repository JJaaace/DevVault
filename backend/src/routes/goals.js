const express = require('express')
const protectRoute = require('../middleware/auth')
const controller = require('../controllers/goalsController')

const router = express.Router()
router.use(protectRoute)
router.get('/', controller.list)
router.post('/', controller.create)
router.put('/reorder', controller.reorder)
router.put('/:goalId', controller.update)
router.delete('/:goalId', controller.remove)

module.exports = router
