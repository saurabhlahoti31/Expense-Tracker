/**
 * @file expense.model.js
 * @description Mongoose schema definition and validators for the Expense collection.
 */

const mongoose = require('mongoose');

/**
 * Expense Schema definition for storing details about transaction records.
 */
const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Food', 'Utilities', 'Entertainment', 'Transport', 'Shopping', 'Healthcare', 'Housing', 'Other'],
        message: '{VALUE} is not a supported category',
      },
      default: 'Other',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
      default: 'Manual', // Can be 'Manual', or 'Bank Sync (Chase)', etc.
    },
  },
  {
    // Auto-generate createdAt and updatedAt timestamps
    timestamps: true,
  }
);

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
