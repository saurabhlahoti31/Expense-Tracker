/**
 * @file auth.middleware.js
 * @description Middleware for protecting private routes by verifying JSON Web Tokens (JWT) in request headers.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware function to protect routes by validating bearer token.
 * Extracted user profile from database (excluding password) is decorated onto the `req.user` object.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {Promise<void|import('express').Response>} Returns HTTP 401 response if authentication fails, otherwise calls next()
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in standard Authorization header (formatted as "Bearer <token>")
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token string from "Bearer <token>" split array
      token = req.headers.authorization.split(' ')[1];

      // Verify signature of the JWT using environment secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_local_dev');

      // Retrieve user information corresponding to decoded id, excluding password hash
      req.user = await User.findById(decoded.id).select('-password');

      // Handle rare edge-case where active token exists but user account has been deleted
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      // Proceed to the next middleware/controller handler
      return next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  // Handle case where Bearer token was completely omitted from the headers
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };

