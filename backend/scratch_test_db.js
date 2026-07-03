require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Expense = require('./src/models/expense.model');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const users = await User.find({});
    console.log('USERS count:', users.length);
    console.log('USERS:', users.map(u => ({ id: u._id, email: u.email, name: u.name, isVerified: u.isVerified, otp: u.otp })));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
