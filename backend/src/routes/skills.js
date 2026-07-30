const express = require('express')
const protectRoute = require('../middleware/auth')
const {
  getSkills,
  getSkill,
  createSkillHandler,
  updateSkillHandler,
  deleteSkillHandler,
} = require('../controllers/skillsController')

const router = express.Router()

router.get('/', protectRoute, getSkills)
router.get('/:skillId', protectRoute, getSkill)
router.post('/', protectRoute, createSkillHandler)
router.put('/:skillId', protectRoute, updateSkillHandler)
router.delete('/:skillId', protectRoute, deleteSkillHandler)

module.exports = router