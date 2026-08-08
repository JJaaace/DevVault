const { sendSuccess, sendCreated, sendNoContent, sendError } = require('../utils/http')
const service = require('../services/certificationService')

async function list(req, res) { try { return sendSuccess(res, await service.listCertifications(req.auth.userId)) } catch (error) { return sendError(res, error, 'CERTIFICATIONS_LIST_FAILED', 'Unable to load certifications.') } }
async function create(req, res) { try { return sendCreated(res, await service.createCertification(req.auth.userId, req.body || {})) } catch (error) { return sendError(res, error, 'CERTIFICATION_CREATE_FAILED', 'Unable to create certification.') } }
async function update(req, res) { try { return sendSuccess(res, await service.updateCertification(req.auth.userId, req.params.certificationId, req.body || {})) } catch (error) { return sendError(res, error, 'CERTIFICATION_UPDATE_FAILED', 'Unable to update certification.') } }
async function remove(req, res) { try { await service.deleteCertification(req.auth.userId, req.params.certificationId); return sendNoContent(res) } catch (error) { return sendError(res, error, 'CERTIFICATION_DELETE_FAILED', 'Unable to delete certification.') } }
async function reorder(req, res) { try { return sendSuccess(res, await service.reorderCertifications(req.auth.userId, req.body?.orderedIds)) } catch (error) { return sendError(res, error, 'CERTIFICATIONS_REORDER_FAILED', 'Unable to reorder certifications.') } }
async function featured(req, res) { try { return sendSuccess(res, await service.setFeaturedCertifications(req.auth.userId, req.body?.featuredIds)) } catch (error) { return sendError(res, error, 'CERTIFICATIONS_FEATURED_FAILED', 'Unable to update featured certifications.') } }
async function roadmap(req, res) { try { return sendSuccess(res, await service.listRoadmap(req.auth.userId)) } catch (error) { return sendError(res, error, 'CERTIFICATION_ROADMAP_GET_FAILED', 'Unable to load certification roadmap.') } }
async function replaceRoadmap(req, res) { try { return sendSuccess(res, await service.replaceRoadmap(req.auth.userId, req.body?.items)) } catch (error) { return sendError(res, error, 'CERTIFICATION_ROADMAP_UPDATE_FAILED', 'Unable to update certification roadmap.') } }
async function importLegacy(req, res) { try { return sendSuccess(res, await service.importLegacyCertifications(req.auth.userId, req.body || {})) } catch (error) { return sendError(res, error, 'CERTIFICATION_IMPORT_FAILED', 'Unable to import local certifications.') } }
async function asset(req, res) {
  try {
    const file = await service.getCertificationAsset(req.auth.userId, req.params.certificationId)
    const canPreviewInline = file.mimeType === 'application/pdf' || /^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.mimeType)
    res.setHeader('Content-Type', file.mimeType)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Length', String(file.content.length))
    res.setHeader('Content-Disposition', `${canPreviewInline ? 'inline' : 'attachment'}; filename="${String(file.fileName).replace(/[\r\n"]/g, '')}"`)
    return res.status(200).send(file.content)
  } catch (error) { return sendError(res, error, 'CERTIFICATION_ASSET_GET_FAILED', 'Unable to load certificate asset.') }
}

module.exports = { list, create, update, remove, reorder, featured, roadmap, replaceRoadmap, importLegacy, asset }
