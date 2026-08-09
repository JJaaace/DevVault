const {
  createSkill,
  deleteSkill,
  getSkillById,
  listSkills,
  updateSkill,
} = require('../services/skillService')
const { sendSuccess, sendCreated, sendNoContent, sendError } = require('../utils/http')

async function getSkills(req, res) {
  try {
    res.set('Cache-Control', 'no-store')
    const skills = await listSkills(req.auth.userId)
    return sendSuccess(res, skills)
  } catch (error) {
    return sendError(res, error, 'SKILLS_LIST_FAILED', 'Unable to load skills.')
  }
}

async function getSkill(req, res) {
  try {
    res.set('Cache-Control', 'no-store')
    const skill = await getSkillById(req.auth.userId, req.params.skillId)
    return sendSuccess(res, skill)
  } catch (error) {
    return sendError(res, error, 'SKILL_GET_FAILED', 'Unable to load skill.')
  }
}

async function createSkillHandler(req, res) {
  try {
    res.set('Cache-Control', 'no-store')
    const skill = await createSkill(req.auth.userId, req.body)
    return sendCreated(res, skill)
  } catch (error) {
    return sendError(res, error, 'SKILL_CREATE_FAILED', 'Unable to create skill.')
  }
}

async function updateSkillHandler(req, res) {
  try {
    res.set('Cache-Control', 'no-store')
    const skill = await updateSkill(req.auth.userId, req.params.skillId, req.body)
    return sendSuccess(res, skill)
  } catch (error) {
    return sendError(res, error, 'SKILL_UPDATE_FAILED', 'Unable to update skill.')
  }
}

async function deleteSkillHandler(req, res) {
  try {
    await deleteSkill(req.auth.userId, req.params.skillId)
    return sendNoContent(res)
  } catch (error) {
    return sendError(res, error, 'SKILL_DELETE_FAILED', 'Unable to delete skill.')
  }
}

module.exports = {
  getSkills,
  getSkill,
  createSkillHandler,
  updateSkillHandler,
  deleteSkillHandler,
}
