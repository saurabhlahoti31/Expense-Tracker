const Expense = require('../models/expense.model');
const { sendExpenseListEmail } = require('../utils/email');

// @desc    Get user expenses with filters and search
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { category, search, startDate, endDate, limit, page } = req.query;
    const query = { userId: req.user.id };

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search by title (case-insensitive)
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skipNum = (pageNum - 1) * limitNum;

    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    const total = await Expense.countDocuments(query);

    res.status(200).json({
      success: true,
      count: expenses.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
      data: expenses,
    });
  } catch (error) {
    console.error('Get Expenses Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
  try {
    const { title, amount, category, date, source } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ success: false, message: 'Please provide title, amount and category' });
    }

    const expense = await Expense.create({
      userId: req.user.id,
      title,
      amount: parseFloat(amount),
      category,
      date: date ? new Date(date) : undefined,
      source: source || 'Manual',
    });

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Create Expense Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const { title, amount, category, date, source } = req.body;

    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Make sure user owns the expense
    if (expense.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to edit this expense' });
    }

    // Update fields
    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title: title || expense.title,
        amount: amount ? parseFloat(amount) : expense.amount,
        category: category || expense.category,
        date: date ? new Date(date) : expense.date,
        source: source || expense.source,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Update Expense Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Make sure user owns the expense
    if (expense.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: 'Expense removed successfully',
    });
  } catch (error) {
    console.error('Delete Expense Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get monthly reports / aggregation by category
// @route   GET /api/expenses/reports/monthly
// @access  Private
const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Default to current month/year if not provided
    const targetYear = parseInt(year, 10) || new Date().getFullYear();
    const targetMonth = parseInt(month, 10) || (new Date().getMonth() + 1); // 1-12

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const report = await Expense.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    // Format the report response
    const formatted = report.map((item) => ({
      category: item._id,
      amount: parseFloat(item.totalAmount.toFixed(2)),
      count: item.count,
    }));

    // Calculate overall total
    const totalSpent = formatted.reduce((acc, curr) => acc + curr.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        categories: formatted,
      },
    });
  } catch (error) {
    console.error('Get Monthly Report Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Export expenses to CSV
// @route   GET /api/expenses/export
// @access  Private
const exportExpensesCSV = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses_export.csv');

    // Create CSV Header
    let csv = 'ID,Title,Amount,Category,Date,Source,Created At\n';

    // Populate CSV Rows
    expenses.forEach((exp) => {
      const id = exp._id.toString();
      const title = `"${exp.title.replace(/"/g, '""')}"`; // escape quotes
      const amount = exp.amount;
      const category = exp.category;
      const date = exp.date.toISOString().split('T')[0];
      const source = exp.source;
      const createdAt = exp.createdAt.toISOString();

      csv += `${id},${title},${amount},${category},${date},${source},${createdAt}\n`;
    });

    res.status(200).send(csv);
  } catch (error) {
    console.error('Export CSV Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Email complete expenses list as table & CSV attachment
// @route   POST /api/expenses/email-list
// @access  Private
const emailExpensesList = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });

    if (!expenses || expenses.length === 0) {
      return res.status(400).json({ success: false, message: 'You do not have any expenses to email yet.' });
    }

    await sendExpenseListEmail(req.user.email, req.user.name, expenses);

    res.status(200).json({
      success: true,
      message: `Your complete expense sheet (${expenses.length} records) has been emailed successfully to ${req.user.email}!`,
    });
  } catch (error) {
    console.error('Email Expense List Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send email: ' + error.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getMonthlyReport,
  exportExpensesCSV,
  emailExpensesList,
};
