/**
 * @file auth.routes.js
 * @description Express routing definition for user authentication, registration, OTP verification, profile retrieval, and password management.
 */

const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and initiate email OTP verification
 * @access  Public
 */
router.post('/register', registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials, verify OTP status, and issue JWT token
 * @access  Public
 */
router.post('/login', loginUser);

/**
 * @route   POST /api/auth/google-login
 * @desc    Register or Login a user via Google Auth
 * @access  Public
 */
router.post('/google-login', googleLogin);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify the email registration OTP code
 * @access  Public
 */
router.post('/verify-otp', verifyOtp);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend registration email OTP code
 * @access  Public
 */
router.post('/resend-otp', resendOtp);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request a password reset OTP code via email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using an OTP verification code
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password for currently authenticated user
 * @access  Private
 */
router.put('/change-password', protect, changePassword);

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve profile details of the currently authenticated user
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/auth/income
 * @desc    Update the monthly income setting of the authenticated user
 * @access  Private
 */
router.put('/income', protect, updateIncome);

module.exports = router;

