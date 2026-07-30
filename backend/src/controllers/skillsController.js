const {
  createSkill,
  deleteSkill,
  getSkillById,
  listSkills,
  updateSkill,
} = require('../services/skillService')

function sendError(res, error, fallbackMessage) {
  return res.status(error.statusCode || 500).json({
    message: error.message || fallbackMessage,
    ...(error.details ? { errors: error.details } : {}),
  })
}

async function getSkills(req, res) {
  try {
    const skills = await listSkills(req.auth.userId)
    return res.json(skills)
  } catch (error) {
    return sendError(res, error, 'Unable to load skills.')
  }
}

async function getSkill(req, res) {
  try {
    const skill = await getSkillById(req.auth.userId, req.params.skillId)
    return res.json(skill)
  } catch (error) {
    return sendError(res, error, 'Unable to load skill.')
  }
}

async function createSkillHandler(req, res) {
  try {
    const skill = await createSkill(req.auth.userId, req.body)
    return res.status(201).json(skill)
  } catch (error) {
    return sendError(res, error, 'Unable to create skill.')
  }
}

async function updateSkillHandler(req, res) {
  try {
    const skill = await updateSkill(req.auth.userId, req.params.skillId, req.body)
    return res.json(skill)
  } catch (error) {
    return sendError(res, error, 'Unable to update skill.')
  }
}

async function deleteSkillHandler(req, res) {
  try {
    await deleteSkill(req.auth.userId, req.params.skillId)
    return res.status(204).send()
  } catch (error) {
    return sendError(res, error, 'Unable to delete skill.')
  }
}

module.exports = {
  getSkills,
  getSkill,
  createSkillHandler,
  updateSkillHandler,
  deleteSkillHandler,
}