const {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject,
} = require('../services/projectService')
const { sendSuccess, sendCreated, sendNoContent, sendError } = require('../utils/http')

async function getProjects(req, res) {
  try {
    const projects = await listProjects(req.auth.userId)
    return sendSuccess(res, projects)
  } catch (error) {
    return sendError(res, error, 'PROJECTS_LIST_FAILED', 'Unable to load projects.')
  }
}

async function getProject(req, res) {
  try {
    const project = await getProjectById(req.auth.userId, req.params.projectId)
    return sendSuccess(res, project)
  } catch (error) {
    return sendError(res, error, 'PROJECT_GET_FAILED', 'Unable to load project.')
  }
}

async function createProjectHandler(req, res) {
  try {
    const project = await createProject(req.auth.userId, req.body)
    return sendCreated(res, project)
  } catch (error) {
    return sendError(res, error, 'PROJECT_CREATE_FAILED', 'Unable to create project.')
  }
}

async function updateProjectHandler(req, res) {
  try {
    const project = await updateProject(req.auth.userId, req.params.projectId, req.body)
    return sendSuccess(res, project)
  } catch (error) {
    return sendError(res, error, 'PROJECT_UPDATE_FAILED', 'Unable to update project.')
  }
}

async function deleteProjectHandler(req, res) {
  try {
    await deleteProject(req.auth.userId, req.params.projectId)
    return sendNoContent(res)
  } catch (error) {
    return sendError(res, error, 'PROJECT_DELETE_FAILED', 'Unable to delete project.')
  }
}

module.exports = {
  getProjects,
  getProject,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
}