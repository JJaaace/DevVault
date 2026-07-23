const express = require('express')

const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    message: 'Users endpoint is ready for future authentication and profile work.',
  })
})

module.exports = router
