const {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject,
} = require('../services/projectService')

function sendError(res, error, fallbackMessage) {
  return res.status(error.statusCode || 500).json({
    message: error.message || fallbackMessage,
    ...(error.details ? { errors: error.details } : {}),
  })
}

async function getProjects(req, res) {
  try {
    const projects = await listProjects(req.auth.userId)
    return res.json(projects)
  } catch (error) {
    return sendError(res, error, 'Unable to load projects.')
  }
}

async function getProject(req, res) {
  try {
    const project = await getProjectById(req.auth.userId, req.params.projectId)
    return res.json(project)
  } catch (error) {
    return sendError(res, error, 'Unable to load project.')
  }
}

async function createProjectHandler(req, res) {
  try {
    const project = await createProject(req.auth.userId, req.body)
    return res.status(201).json(project)
  } catch (error) {
    return sendError(res, error, 'Unable to create project.')
  }
}

async function updateProjectHandler(req, res) {
  try {
    const project = await updateProject(req.auth.userId, req.params.projectId, req.body)
    return res.json(project)
  } catch (error) {
    return sendError(res, error, 'Unable to update project.')
  }
}

async function deleteProjectHandler(req, res) {
  try {
    await deleteProject(req.auth.userId, req.params.projectId)
    return res.status(204).send()
  } catch (error) {
    return sendError(res, error, 'Unable to delete project.')
  }
}

module.exports = {
  getProjects,
  getProject,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
}