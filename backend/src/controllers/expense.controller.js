/**
 * @file expense.controller.js
 * @description Controllers managing expense lifecycle: listing with dynamic search filters, pagination, creation, updates, removal, CSV exports, reporting aggregations, and email reports.
 */

const Expense = require('../models/expense.model');
const { sendExpenseListEmail } = require('../utils/email');

/**
 * @desc    Get user expenses with filters (category, date range, search query) and pagination
 * @route   GET /api/expenses
 * @access  Private
 *
 * @param {import('express').Request} req - Express request object with query parameters {category, search, startDate, endDate, limit, page}
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<import('express').Response>} Paginated array of matching expense records
 */
const getExpenses = async (req, res) => {
  try {
    const { category, search, startDate, endDate, limit, page } = req.query;
    const query = { userId: req.user.id };

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search by title (case-insensitive regex match)
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Filter by date range (parsed into ISO dates)
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Configure pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skipNum = (pageNum - 1) * limitNum;

    // Execute query with sorting, pagination skip, and page limit constraints
    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    // Count total matches ignoring pagination limits
    const total = await Expense.countDocuments(query);

    return res.status(200).json({
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
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Create a new expense record
 * @route   POST /api/expenses
 * @access  Private
 *
 * @param {import('express').Request} req - Express request with body {title, amount, category, date, source}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} Created expense record document
 */
const createExpense = async (req, res) => {
  try {
    const { title, amount, category, date, source } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({ success: false, message: 'Please provide title, amount and category' });
    }

    // Instantiate and store new transaction record
    const expense = await Expense.create({
      userId: req.user.id,
      title,
      amount: parseFloat(amount),
      category,
      date: date ? new Date(date) : undefined,
      source: source || 'Manual',
    });

    return res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Create Expense Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Update fields of an existing expense record
 * @route   PUT /api/expenses/:id
 * @access  Private
 *
 * @param {import('express').Request} req - Express request with params {id} and body {title, amount, category, date, source}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} Updated expense record document
 */
const updateExpense = async (req, res) => {
  try {
    const { title, amount, category, date, source } = req.body;

    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Ensure authorization by checking that the resource belongs to the requesting user
    if (expense.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to edit this expense' });
    }

    // Perform partial/full updates while falling back to existing values where parameters are omitted
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

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error('Update Expense Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Delete an expense record
 * @route   DELETE /api/expenses/:id
 * @access  Private
 *
 * @param {import('express').Request} req - Express request with params {id}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} Success confirmation code
 */
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Ensure authorization by checking that the resource belongs to the requesting user
    if (expense.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      data: {},
      message: 'Expense removed successfully',
    });
  } catch (error) {
    console.error('Delete Expense Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Generate monthly report grouped by category
 * @route   GET /api/expenses/reports/monthly
 * @access  Private
 *
 * @param {import('express').Request} req - Express request with query params {month, year}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} Summed expenses group aggregation data
 */
const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Use current year and month (1-indexed) if not specified in request query parameters
    const targetYear = parseInt(year, 10) || new Date().getFullYear();
    const targetMonth = parseInt(month, 10) || (new Date().getMonth() + 1);

    // Compute boundary timestamps for start and end of target month
    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // Execute aggregation grouping matched expenses by category
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

    // Format aggregation results cleanly
    const formatted = report.map((item) => ({
      category: item._id,
      amount: parseFloat(item.totalAmount.toFixed(2)),
      count: item.count,
    }));

    // Sum overall outflows for the month
    const totalSpent = formatted.reduce((acc, curr) => acc + curr.amount, 0);

    return res.status(200).json({
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
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Export user's entire expense log to downloadable CSV file format
 * @route   GET /api/expenses/export
 * @access  Private
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {Promise<void>} Sends CSV text directly as attachment response stream
 */
const exportExpensesCSV = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });

    // Set HTTP response headers to trigger file download dialog in user's browser
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses_export.csv');

    // Build CSV header line (changed from Source to Mode of Payment)
    let csv = 'ID,Title,Amount,Category,Date,Mode of Payment,Created At\n';

    // Append record rows, escaping double quotes to prevent syntax parsing issues in spreadsheet software
    expenses.forEach((exp) => {
      const id = exp._id.toString();
      const title = `"${exp.title.replace(/"/g, '""')}"`;
      const amount = exp.amount;
      const category = exp.category;
      const date = exp.date.toISOString().split('T')[0];
      
      // Determine user-friendly Mode of Payment based on transaction source
      let modeOfPayment = exp.source || 'Manual';
      if (modeOfPayment.startsWith('Bank Sync (')) {
        const match = modeOfPayment.match(/Bank Sync \(([^)]+)\)/);
        if (match) {
          const bankId = match[1];
          // Map legacy bank IDs to the new, updated bank names
          const bankMap = {
            'Chase': 'Kotak Mahindra Bank',
            'BofA': 'State Bank of India',
            'CapitalOne': 'Card',
            'WellsFargo': 'Bank of Maharashtra',
            'Kotak Mahindra Bank': 'Kotak Mahindra Bank',
            'State Bank of India': 'State Bank of India',
            'Card': 'Card',
            'Bank of Maharashtra': 'Bank of Maharashtra'
          };
          modeOfPayment = bankMap[bankId] || bankId;
        }
      }
      
      const createdAt = exp.createdAt.toISOString();

      csv += `${id},${title},${amount},${category},${date},${modeOfPayment},${createdAt}\n`;
    });

    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export CSV Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Send comprehensive expense list to user email with HTML report + CSV attachment
 * @route   POST /api/expenses/email-list
 * @access  Private
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} Success confirmation status payload
 */
const emailExpensesList = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });

    if (!expenses || expenses.length === 0) {
      return res.status(400).json({ success: false, message: 'You do not have any expenses to email yet.' });
    }

    // Trigger email dispatch utility function
    await sendExpenseListEmail(req.user.email, req.user.name, expenses);

    return res.status(200).json({
      success: true,
      message: `Your complete expense sheet (${expenses.length} records) has been emailed successfully to ${req.user.email}!`,
    });
  } catch (error) {
    console.error('Email Expense List Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to send email: ' + error.message });
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
