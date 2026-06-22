const express = require('express');
const router = express.Router();
const { syncBank, disconnectBank } = require('../controllers/bank.controller');
const { protect } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

router.post('/sync', syncBank);
router.delete('/disconnect', disconnectBank);

module.exports = router;
