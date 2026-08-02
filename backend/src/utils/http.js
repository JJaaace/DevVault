function createError(code, message, statusCode = 400, details) {
  const error = new Error(message)
  error.code = code
  error.statusCode = statusCode
  if (details) {
    error.details = details
  }
  return error
}

function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  })
}

function sendCreated(res, data) {
  return sendSuccess(res, data, 201)
}

function sendNoContent(res) {
  return res.status(204).send()
}

function sendError(res, error, fallbackCode = 'INTERNAL_ERROR', fallbackMessage = 'Request failed.') {
  const statusCode = error.statusCode || 500
  return res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || fallbackCode,
      message: error.message || fallbackMessage,
      ...(error.details ? { details: error.details } : {}),
    },
  })
}

module.exports = {
  createError,
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendError,
}
