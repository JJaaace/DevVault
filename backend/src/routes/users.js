const express = require('express')
const { sendSuccess } = require('../utils/http')

const router = express.Router()

router.get('/', (req, res) => {
  return sendSuccess(res, {
    message: 'Users endpoint is ready for future authentication and profile work.',
  })
})

module.exports = router
