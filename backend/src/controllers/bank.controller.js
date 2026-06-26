/**
 * @file bank.controller.js
 * @description Controllers and mock data sets simulating integration with Plaid-like bank providers and automatic syncs.
 */

const User = require('../models/user.model');
const Expense = require('../models/expense.model');

/**
 * Mock transactional dataset for simulating realistic bank statements.
 * Categorized and ranged appropriately to mock user spending habits.
 * 
 * @type {Array<{title: string, minAmount: number, maxAmount: number, category: string}>}
 */
const MOCK_MERCHANTS = [
  { title: 'Starbucks Coffee', minAmount: 4.5, maxAmount: 12.0, category: 'Food' },
  { title: 'Whole Foods Market', minAmount: 45.0, maxAmount: 150.0, category: 'Food' },
  { title: 'Uber Trip', minAmount: 12.5, maxAmount: 45.0, category: 'Transport' },
  { title: 'Shell Gas Station', minAmount: 30.0, maxAmount: 60.0, category: 'Transport' },
  { title: 'Netflix Subscription', minAmount: 15.49, maxAmount: 22.99, category: 'Entertainment' },
  { title: 'Steam Games Store', minAmount: 10.0, maxAmount: 80.0, category: 'Entertainment' },
  { title: 'Target Department Store', minAmount: 25.0, maxAmount: 180.0, category: 'Shopping' },
  { title: 'Amazon Online Retail', minAmount: 15.0, maxAmount: 250.0, category: 'Shopping' },
  { title: 'City Water District', minAmount: 35.0, maxAmount: 75.0, category: 'Utilities' },
  { title: 'Power & Light Electric', minAmount: 85.0, maxAmount: 160.0, category: 'Utilities' },
  { title: 'Metropolitan Housing Rent', minAmount: 1200.0, maxAmount: 1200.0, category: 'Housing' },
  { title: 'Walgreens Pharmacy', minAmount: 8.0, maxAmount: 45.0, category: 'Healthcare' },
];

/**
 * Generates a random timestamp/date representing an event in the past 30 days.
 * Used to randomize mock bank transaction logs.
 *
 * @returns {Date} Random Date object
 */
const getRandomDate = () => {
  const now = new Date();
  const pastDays = Math.floor(Math.random() * 28); // 0 to 27 days ago
  const randomHour = Math.floor(Math.random() * 24);
  const randomMinute = Math.floor(Math.random() * 60);

  const date = new Date(now);
  date.setDate(now.getDate() - pastDays);
  date.setHours(randomHour, randomMinute, 0, 0);
  return date;
};

/**
 * Generates a random float value rounded to two decimal places between minimum and maximum bounds.
 *
 * @param {number} min - Lower limit
 * @param {number} max - Upper limit
 * @returns {number} Random float representing currency amount
 */
const getRandomAmount = (min, max) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

/**
 * @desc    Simulate connecting to a bank provider and importing transaction history
 * @route   POST /api/bank/sync
 * @access  Private
 *
 * @param {import('express').Request} req - Express request with body {provider}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} Import confirmation payload with list of synced expenses
 */
const syncBank = async (req, res) => {
  try {
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, message: 'Please specify a bank provider to connect' });
    }

    // Update the authenticated user's linked bank status
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.linkedBank = {
      provider,
      lastSync: new Date(),
      connected: true,
    };
    await user.save();

    // Determine how many random transactions to create for the mock sync process (6 to 10)
    const numTransactions = Math.floor(Math.random() * 5) + 6;
    const syncedExpenses = [];

    // Shuffle merchants to randomize transactional selections
    const shuffled = [...MOCK_MERCHANTS].sort(() => 0.5 - Math.random());
    const selectedMerchants = shuffled.slice(0, numTransactions);

    // Create Mongoose Expense document logs for each selected merchant
    for (const merchant of selectedMerchants) {
      const amount = getRandomAmount(merchant.minAmount, merchant.maxAmount);
      const date = getRandomDate();

      const expense = await Expense.create({
        userId: user._id,
        title: merchant.title,
        amount,
        category: merchant.category,
        date,
        source: `Bank Sync (${provider})`,
      });

      syncedExpenses.push(expense);
    }

    // Sort transactions chronologically descending (newest first) before sending response
    syncedExpenses.sort((a, b) => b.date - a.date);

    return res.status(200).json({
      success: true,
      message: `Successfully connected to ${provider} and imported ${numTransactions} transactions automatically!`,
      data: {
        linkedBank: user.linkedBank,
        importedCount: numTransactions,
        transactions: syncedExpenses,
      },
    });
  } catch (error) {
    console.error('Bank Sync Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Disconnect the linked bank provider
 * @route   DELETE /api/bank/disconnect
 * @access  Private
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} Success confirmation payload with cleared bank properties
 */
const disconnectBank = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clear linkedBank sub-document variables
    user.linkedBank = {
      provider: null,
      lastSync: null,
      connected: false,
    };
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Bank connection disconnected successfully.',
      data: {
        linkedBank: user.linkedBank,
      },
    });
  } catch (error) {
    console.error('Bank Disconnect Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  syncBank,
  disconnectBank,
};
