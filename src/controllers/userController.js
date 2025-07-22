import User from "../models/User.js";
import { generateAccessToken } from "../utils/tokenUtils.js";

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
        error: "MISSING_REQUIRED_FIELDS"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
        error: "USER_EXISTS"
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: role || "user",
    });

    await user.save();

    // Generate token using tokenUtils
    const tokenData = await generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      type: "access"
    }, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: tokenData.token,
      tokenExpiry: new Date(tokenData.expiresAt)
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
        error: "MISSING_CREDENTIALS"
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "INVALID_CREDENTIALS"
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "INVALID_CREDENTIALS"
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token using tokenUtils
    const tokenData = await generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      type: "access"
    }, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      token: tokenData.token,
      tokenExpiry: tokenData.expiresAt
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, preferences },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Refresh token
// @route   POST /api/users/refresh-token
// @access  Private
export const refreshToken = async (req, res) => {
  try {
    // Generate new token using tokenUtils
    const tokenData = await generateAccessToken({
      userId: req.userId,
      email: req.user.email,
      role: req.user.role
    }, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: "Token refreshed successfully",
      token: tokenData.token,
      tokenExpiry: tokenData.expiresAt,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      }
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token refresh",
      error: error.message,
    });
  }
};

// @desc    Verify token
// @route   GET /api/users/verify-token
// @access  Private
export const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Token is valid",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token verification",
      error: error.message,
    });
  }
};