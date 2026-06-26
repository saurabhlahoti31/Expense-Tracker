/**
 * @file mock_otp.js
 * @description Utility script used in local testing environments to mock password reset OTPs.
 * It periodically updates the test user account 'test@example.com' with a deterministic OTP '123456' 
 * whenever a password reset request is initiated, facilitating seamless automation/e2e testing.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Initialize environment configuration from parent backend .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define a minimal User schema slice targeting only the fields relevant to password reset OTP flow
const userSchema = new mongoose.Schema({
  email: String,
  resetPasswordOtp: String,
  resetPasswordOtpExpires: Date
});

const User = mongoose.model('User', userSchema);

/**
 * Connects to the database and polls periodically to update any active password reset attempts
 * for the designated test account ('test@example.com') to a standard mock value.
 *
 * @async
 * @returns {Promise<void>} Resolves when the script starts running the mocking interval.
 */
async function startMocking() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Mock OTP script connected to MongoDB.');

    // Query and update the database at 1-second intervals
    const interval = setInterval(async () => {
      try {
        const res = await User.updateOne(
          { email: 'test@example.com', resetPasswordOtp: { $ne: null } },
          {
            $set: {
              // Standardized verification code for automated testing
              resetPasswordOtp: '123456',
              resetPasswordOtpExpires: new Date(Date.now() + 10 * 60 * 1000)
            }
          }
        );
        if (res.modifiedCount > 0) {
          console.log('Successfully mocked resetPasswordOtp to 123456 for test@example.com');
        }
      } catch (err) {
        console.error('Error during update:', err.message);
      }
    }, 1000);

    // Terminate script execution automatically after 5 minutes (300,000 ms) to prevent process leaks
    setTimeout(() => {
      clearInterval(interval);
      mongoose.disconnect();
      console.log('Mock OTP script stopped.');
      process.exit(0);
    }, 300000);

  } catch (error) {
    console.error('Connection error:', error);
    process.exit(1);
  }
}

startMocking();

