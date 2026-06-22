const mongoose = require('mongoose');

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

    // Auto-migrate existing users who don't have isVerified field yet
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
    // Do not crash the application so that the user can still run it and see error messages in logs
  }
};

module.exports = connectDB;
