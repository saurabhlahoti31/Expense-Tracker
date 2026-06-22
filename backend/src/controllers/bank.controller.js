const User = require('../models/user.model');
const Expense = require('../models/expense.model');

// Mock transactions dataset for simulation
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

// Helper to generate a random date in the last 30 days
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

// Helper to generate a realistic random amount
const getRandomAmount = (min, max) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

// @desc    Connect bank and sync transaction history
// @route   POST /api/bank/sync
// @access  Private
const syncBank = async (req, res) => {
  try {
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, message: 'Please specify a bank provider to connect' });
    }

    // 1. Update User bank status
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

    // 2. Generate 6 to 10 simulated transactions
    const numTransactions = Math.floor(Math.random() * 5) + 6; // 6 to 10 transactions
    const syncedExpenses = [];

    // Shuffle merchants to get random selections
    const shuffled = [...MOCK_MERCHANTS].sort(() => 0.5 - Math.random());
    const selectedMerchants = shuffled.slice(0, numTransactions);

    for (const merchant of selectedMerchants) {
      const amount = getRandomAmount(merchant.minAmount, merchant.maxAmount);
      const date = getRandomDate();

      // Create new expense logged under this bank source
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

    // Sort synced transactions by date descending
    syncedExpenses.sort((a, b) => b.date - a.date);

    res.status(200).json({
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
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Disconnect linked bank
// @route   DELETE /api/bank/disconnect
// @access  Private
const disconnectBank = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.linkedBank = {
      provider: null,
      lastSync: null,
      connected: false,
    };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Bank connection disconnected successfully.',
      data: {
        linkedBank: user.linkedBank,
      },
    });
  } catch (error) {
    console.error('Bank Disconnect Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  syncBank,
  disconnectBank,
};
