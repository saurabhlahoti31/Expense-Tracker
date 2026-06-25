const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  resetPasswordOtp: String,
  resetPasswordOtpExpires: Date
});

const User = mongoose.model('User', userSchema);

async function startMocking() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Mock OTP script connected to MongoDB.');
    
    const interval = setInterval(async () => {
      try {
        const res = await User.updateOne(
          { email: 'test@example.com', resetPasswordOtp: { $ne: null } },
          { 
            $set: { 
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

    // Keep running for 5 minutes max
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
