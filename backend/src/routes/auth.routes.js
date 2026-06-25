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
  changePassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);
router.get('/me', protect, getMe);
router.put('/income', protect, updateIncome);

module.exports = router;
