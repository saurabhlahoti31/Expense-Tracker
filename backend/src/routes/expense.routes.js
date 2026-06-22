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

// Protect all routes
router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);

router.get('/reports/monthly', getMonthlyReport);
router.get('/export', exportExpensesCSV);
router.post('/email-list', emailExpensesList);

module.exports = router;
