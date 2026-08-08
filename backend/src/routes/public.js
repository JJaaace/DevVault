const express = require('express')
const { getPublicCertificationAsset, getPublicPortfolio, getPublicProfileImage, getPublicProjectArtwork, getPublicResume } = require('../controllers/profileController')

const router = express.Router()

router.get('/portfolio/:username', getPublicPortfolio)
router.get('/portfolio/:username/overview', getPublicPortfolio)
router.get('/portfolio/:username/profile-image', getPublicProfileImage)
router.get('/portfolio/:username/projects/:projectId/artwork', getPublicProjectArtwork)
router.get('/portfolio/:username/certifications/:certificationId/asset', getPublicCertificationAsset)
router.get('/portfolio/:username/resume', getPublicResume)

module.exports = router
