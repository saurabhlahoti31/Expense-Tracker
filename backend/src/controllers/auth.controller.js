const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { sendOtpEmail } = require('../utils/email');

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_for_local_dev', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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
      // Update existing unverified user
      user.name = name;
      user.password = password;
      user.monthlyIncome = req.body.monthlyIncome !== undefined ? Number(req.body.monthlyIncome) : 5500;
    } else {
      // Create new unverified user (pre-save hook hashes password)
      user = new User({
        name,
        email,
        password,
        monthlyIncome: req.body.monthlyIncome !== undefined ? Number(req.body.monthlyIncome) : 5500,
        isVerified: false
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await user.save();

    // Send OTP via email
    await sendOtpEmail(email, name, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to email. Please verify to complete registration.',
      email: email
    });
  } catch (error) {
    console.error('Register Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check verification status
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

    res.status(200).json({
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
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Verify OTP for email registration
// @route   POST /api/auth/verify-otp
// @access  Public
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

    if (!user.otp || user.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Verification code has expired' });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
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
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Resend OTP for email registration
// @route   POST /api/auth/resend-otp
// @access  Public
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

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    await sendOtpEmail(email, user.name, otp);

    res.status(200).json({
      success: true,
      message: 'Verification code resent successfully'
    });
  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

// @desc    Update user monthly income
// @route   PUT /api/auth/income
// @access  Private
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

    res.status(200).json({
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
    res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateIncome,
  verifyOtp,
  resendOtp,
};
