/**
 * @file db.js
 * @description Configures and establishes connection to the MongoDB database using Mongoose. Includes auto-migration routines.
 */

const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB.
 * Uses environment variable `MONGODB_URI` if present; otherwise, falls back to local host.
 * Also performs an auto-migration to set `isVerified: true` for legacy user profiles.
 * 
 * @async
 * @returns {Promise<void>} Resolves when connection succeeds or handles the failure gracefully.
 */
const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI;
    if (!connString) {
      console.warn('⚠️ WARNING: MONGODB_URI is not defined in the environment variables! Please configure it in your .env file.');
      console.log('Attempting to connect to default local MongoDB: mongodb://127.0.0.1:27017/expense_tracker');
    }

    const dbURI = connString || 'mongodb://127.0.0.1:27017/expense_tracker';
    const conn = await mongoose.connect(dbURI);

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);

    // Auto-migrate legacy user database documents that lack the 'isVerified' attribute
    try {
      const User = require('../models/user.model');
      const unmigratedCount = await User.countDocuments({ isVerified: { $exists: false } });
      if (unmigratedCount > 0) {
        console.log(`🔄 Migrating ${unmigratedCount} existing users to verified status...`);
        const result = await User.updateMany({ isVerified: { $exists: false } }, { $set: { isVerified: true } });
        console.log(`✅ Successfully migrated ${result.modifiedCount} users.`);
      }
    } catch (migrateErr) {
      console.error(`⚠️ Auto-migration failed: ${migrateErr.message}`);
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️ Application is running, but database connection could not be established. Ensure MongoDB is running or the Atlas URL is correct.');
    // Do not crash/terminate the backend process so that developers can check application diagnostics/logs.
  }
};

module.exports = connectDB;

