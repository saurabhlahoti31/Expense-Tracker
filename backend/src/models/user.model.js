/**
 * @file user.model.js
 * @description Mongoose schema definition, validators, hooks, and instance methods for the User collection.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * User Schema definition containing personal registration information,
 * bank link settings, verification OTP codes, and budget stats.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    linkedBank: {
      provider: {
        type: String,
        default: null,
      },
      lastSync: {
        type: Date,
        default: null,
      },
      connected: {
        type: Boolean,
        default: false,
      },
    },
    monthlyIncome: {
      type: Number,
      default: 5500,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    resetPasswordOtp: {
      type: String,
      default: null,
    },
    resetPasswordOtpExpires: {
      type: Date,
      default: null,
    },
  },
  {
    // Auto-generate createdAt and updatedAt timestamps
    timestamps: true,
  }
);

/**
 * Pre-save Mongoose hook to automatically hash user passwords using bcrypt
 * when the password attribute is modified or newly initialized.
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compares an incoming plain-text password with the saved password hash.
 *
 * @async
 * @param {string} enteredPassword - Raw input password to compare
 * @returns {Promise<boolean>} True if match, otherwise false
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
