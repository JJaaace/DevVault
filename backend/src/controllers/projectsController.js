const {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject,
  serializeOwnerProject,
} = require('../services/projectService')
const { sendSuccess, sendCreated, sendNoContent, sendError } = require('../utils/http')

async function getProjects(req, res) {
  try {
    const projects = await listProjects(req.auth.userId)
    return sendSuccess(res, projects.map(serializeOwnerProject))
  } catch (error) {
    return sendError(res, error, 'PROJECTS_LIST_FAILED', 'Unable to load projects.')
  }
}

async function getProject(req, res) {
  try {
    const project = await getProjectById(req.auth.userId, req.params.projectId)
    return sendSuccess(res, serializeOwnerProject(project))
  } catch (error) {
    return sendError(res, error, 'PROJECT_GET_FAILED', 'Unable to load project.')
  }
}

async function createProjectHandler(req, res) {
  try {
    const project = await createProject(req.auth.userId, req.body)
    return sendCreated(res, serializeOwnerProject(project))
  } catch (error) {
    return sendError(res, error, 'PROJECT_CREATE_FAILED', 'Unable to create project.')
  }
}

async function updateProjectHandler(req, res) {
  try {
    const project = await updateProject(req.auth.userId, req.params.projectId, req.body)
    return sendSuccess(res, serializeOwnerProject(project))
  } catch (error) {
    return sendError(res, error, 'PROJECT_UPDATE_FAILED', 'Unable to update project.')
  }
}

async function getProjectArtworkHandler(req, res) {
  try {
    const project = await getProjectById(req.auth.userId, req.params.projectId)
    const match = String(project.bannerImageUrl || '').match(/^data:(image\/(?:png|jpe?g|webp|gif|avif));base64,([A-Za-z0-9+/=\s]+)$/i)
    if (!match) return sendError(res, { statusCode: 404, message: 'Project artwork not found.' }, 'PROJECT_ARTWORK_NOT_FOUND', 'Project artwork not found.')
    const content = Buffer.from(match[2].replace(/\s+/g, ''), 'base64')
    res.setHeader('Content-Type', match[1].toLowerCase())
    res.setHeader('Content-Length', String(content.length))
    res.setHeader('Content-Disposition', `inline; filename="project-${project.id}"`)
    res.setHeader('Cache-Control', 'private, max-age=300')
    return res.status(200).send(content)
  } catch (error) {
    return sendError(res, error, 'PROJECT_ARTWORK_GET_FAILED', 'Unable to load project artwork.')
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
  getProjectArtworkHandler,
}
