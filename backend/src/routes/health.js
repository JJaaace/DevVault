const express = require('express')
const { sendSuccess } = require('../utils/http')

const router = express.Router()

router.get('/', (req, res) => {
  return sendSuccess(res, { status: 'ok', message: 'DevVault API health check passed' })
})

module.exports = router
