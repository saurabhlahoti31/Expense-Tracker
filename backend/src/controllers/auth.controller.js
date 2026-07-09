/**
 * @file auth.controller.js
 * @description Controllers managing user authentication lifecycle: registration, login, OTP verification, password recovery, profile fetch, and income update.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { sendOtpEmail, sendResetPasswordEmail } = require('../utils/email');

/**
 * Generates a JSON Web Token (JWT) for user authentication.
 *
 * @param {string} id - The MongoDB user document ID
 * @returns {string} Signed JWT token string
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_for_local_dev', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user (creates unverified account & triggers email OTP)
 * @route   POST /api/auth/register
 * @access  Public
 *
 * @param {import('express').Request} req - Express request with body {name, email, password, monthlyIncome}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} HTTP response with success status and details
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required payload parameters
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Password strength check (min 8 characters, both letters and numbers)
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({ success: false, message: 'Password must contain both letters and numbers' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }
      // Update existing unverified user profile if they re-register before verifying
      user.name = name;
      user.password = password;
      user.monthlyIncome = req.body.monthlyIncome !== undefined ? Number(req.body.monthlyIncome) : 5500;
    } else {
      // Create new unverified user (pre-save hook hashes password automatically)
      user = new User({
        name,
        email,
        password,
        monthlyIncome: req.body.monthlyIncome !== undefined ? Number(req.body.monthlyIncome) : 5500,
        isVerified: false
      });
    }

    // Generate 6-digit random verification OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    await user.save();

    // Trigger OTP email dispatch
    await sendOtpEmail(email, name, otp);

    return res.status(200).json({
      success: true,
      message: 'OTP sent to email. Please verify to complete registration.',
      email: email
    });
  } catch (error) {
    console.error('Register Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Authenticate a user & return JWT token (handles unverified accounts gracefully)
 * @route   POST /api/auth/login
 * @access  Public
 *
 * @param {import('express').Request} req - Express request with body {email, password}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} HTTP response with authorization token or error details
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Fetch user profile from database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Require email verification check
    if (user.isVerified === false) {
      // Regenerate OTP and send
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendOtpEmail(user.email, user.name, otp);

      return res.status(403).json({
        success: false,
        message: 'Your email address is not verified. A new verification OTP has been sent to your email.',
        isUnverified: true,
        email: user.email
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        linkedBank: user.linkedBank,
        monthlyIncome: user.monthlyIncome,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Verify OTP for email registration completion
 * @route   POST /api/auth/verify-otp
 * @access  Public
 *
 * @param {import('express').Request} req - Express request with body {email, otp}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} HTTP response with verification status
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    // Verify code match
    if (!user.otp || user.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Verify expiration timestamp
    if (new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Verification code has expired' });
    }

    // Mark user status as verified and clear temporary OTP fields
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        linkedBank: user.linkedBank,
        monthlyIncome: user.monthlyIncome,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Resend OTP code for unverified accounts
 * @route   POST /api/auth/resend-otp
 * @access  Public
 *
 * @param {import('express').Request} req - Express request with body {email}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} HTTP response
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    // Generate new OTP and update expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    await sendOtpEmail(email, user.name, otp);

    return res.status(200).json({
      success: true,
      message: 'Verification code resent successfully'
    });
  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Get logged-in user profile info
 * @route   GET /api/auth/me
 * @access  Private
 *
 * @param {import('express').Request} req - Express request decorated with req.user from auth middleware
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} User profile without password hash
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Update user's monthly income budget
 * @route   PUT /api/auth/income
 * @access  Private
 *
 * @param {import('express').Request} req - Express request with body {income}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} Response containing updated monthlyIncome
 */
const updateIncome = async (req, res) => {
  try {
    const { income } = req.body;

    if (income === undefined || isNaN(parseFloat(income))) {
      return res.status(400).json({ success: false, message: 'Please provide a valid income amount' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.monthlyIncome = parseFloat(income);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Monthly income updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        linkedBank: user.linkedBank,
        monthlyIncome: user.monthlyIncome,
      },
    });
  } catch (error) {
    console.error('Update Income Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Request a password reset OTP code
 * @route   POST /api/auth/forgot-password
 * @access  Public
 *
 * @param {import('express').Request} req - Express request with body {email}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} HTTP response
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email does not exist' });
    }

    // Generate 6-digit password recovery OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    // Send OTP via email
    await sendResetPasswordEmail(email, user.name, otp);

    return res.status(200).json({
      success: true,
      message: 'Reset OTP code has been sent to your email.',
      email: email
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Reset password using recovery OTP code
 * @route   POST /api/auth/reset-password
 * @access  Public
 *
 * @param {import('express').Request} req - Express request with body {email, otp, newPassword}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} HTTP response
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP code, and new password' });
    }

    // Password strength check (min 8 characters, both letters and numbers)
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({ success: false, message: 'Password must contain both letters and numbers' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify recovery code
    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid reset code' });
    }

    // Verify recovery code expiry
    if (new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({ success: false, message: 'Reset code has expired' });
    }

    // Update password (pre-save hook hashes password)
    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;

    // Automatically mark email as verified since they authenticated successfully via OTP code
    if (!user.isVerified) {
      user.isVerified = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        linkedBank: user.linkedBank,
        monthlyIncome: user.monthlyIncome,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Change password (for currently authenticated/logged-in user)
 * @route   PUT /api/auth/change-password
 * @access  Private
 *
 * @param {import('express').Request} req - Express request with body {currentPassword, newPassword} and decorated req.user
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} HTTP response
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    // Password strength check (min 8 characters, both letters and numbers)
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({ success: false, message: 'New password must contain both letters and numbers' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify user entered current password correctly
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    // Update password (pre-save hook hashes password)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (error) {
    console.error('Change Password Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

/**
 * @desc    Authenticate/Register user via Google Sign-In
 * @route   POST /api/auth/google-login
 * @access  Public
 *
 * @param {import('express').Request} req - Express request with body {email, name, googleId}
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} HTTP response with authorization token or error details
 */
const googleLogin = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ success: false, message: 'Please provide email and googleId' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
      }
      // If user registered with email previously but wasn't verified, mark as verified now since Google verified it
      if (!user.isVerified) {
        user.isVerified = true;
      }
      await user.save();
    } else {
      // Create new user
      user = new User({
        name: name || email.split('@')[0],
        email,
        googleId,
        isVerified: true, // Google accounts are pre-verified
        monthlyIncome: 5500 // Default income
      });
      await user.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        linkedBank: user.linkedBank,
        monthlyIncome: user.monthlyIncome,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Google Login Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateIncome,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  changePassword,
  googleLogin
};
