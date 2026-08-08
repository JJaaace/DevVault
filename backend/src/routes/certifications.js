const express = require('express')
const protectRoute = require('../middleware/auth')
const controller = require('../controllers/certificationsController')

const router = express.Router()
router.use(protectRoute)
router.get('/', controller.list)
router.post('/', controller.create)
router.post('/import-legacy', controller.importLegacy)
router.put('/reorder', controller.reorder)
router.put('/featured', controller.featured)
router.get('/roadmap', controller.roadmap)
router.put('/roadmap', controller.replaceRoadmap)
router.get('/:certificationId/asset', controller.asset)
router.put('/:certificationId', controller.update)
router.delete('/:certificationId', controller.remove)

module.exports = router
