/**
 * @file expense.routes.js
 * @description Express routing definition for managing expenses, including CRUD operations, generating reports, exporting to CSV, and emailing expense spreadsheets.
 */

const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getMonthlyReport,
  exportExpensesCSV,
  emailExpensesList,
} = require('../controllers/expense.controller');
const { protect } = require('../middleware/auth.middleware');

// Apply auth middleware to protect all routes in this router
router.use(protect);

/**
 * @route   GET /api/expenses
 * @desc    Get user expenses with filters (category, date range, search term) and pagination
 * @access  Private
 *
 * @route   POST /api/expenses
 * @desc    Create a new expense transaction record
 * @access  Private
 */
router.route('/')
  .get(getExpenses)
  .post(createExpense);

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update an existing expense transaction record by its database ID
 * @access  Private
 *
 * @route   DELETE /api/expenses/:id
 * @desc    Remove an expense transaction record by its database ID
 * @access  Private
 */
router.route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);

/**
 * @route   GET /api/expenses/reports/monthly
 * @desc    Get monthly expense statistics and category-based outflows aggregation
 * @access  Private
 */
router.get('/reports/monthly', getMonthlyReport);

/**
 * @route   GET /api/expenses/export
 * @desc    Download all user expenses formatted as a raw CSV file
 * @access  Private
 */
router.get('/export', exportExpensesCSV);

/**
 * @route   POST /api/expenses/email-list
 * @desc    Generate and send a detailed expense summary HTML table and CSV attachment to user's email
 * @access  Private
 */
router.post('/email-list', emailExpensesList);

module.exports = router;

