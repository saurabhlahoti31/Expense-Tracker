/**
 * @file bank.routes.js
 * @description Express routing definition for bank integration, supporting simulated bank sync operations and disconnections.
 */

const express = require('express');
const router = express.Router();
const { syncBank, disconnectBank } = require('../controllers/bank.controller');
const { protect } = require('../middleware/auth.middleware');

// Apply auth middleware to protect all routes in this router
router.use(protect);

/**
 * @route   POST /api/bank/sync
 * @desc    Simulate linking a bank provider and importing recent transaction history
 * @access  Private
 */
router.post('/sync', syncBank);

/**
 * @route   DELETE /api/bank/disconnect
 * @desc    Disconnect the currently linked bank account
 * @access  Private
 */
router.delete('/disconnect', disconnectBank);

module.exports = router;

