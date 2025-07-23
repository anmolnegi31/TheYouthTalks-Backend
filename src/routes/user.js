import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  registerUser,
  login,
  getUserProfile,
  getBrandProfile,
  updateUserProfile,
  refreshToken,
  verifyToken,
  registerBrand,
  logout,
  logoutAll,
  changePassword,
  updateBrandProfile
} from "../controllers/userController.js";

const router = express.Router();

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
router.post("/register", registerUser);

// @desc    Register new brand
// @route   POST /api/users/register-brand
// @access  Public
router.post("/register-brand", registerBrand);

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
router.post("/login", login);

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", authenticate, getUserProfile);

// @desc    Get brand profile
// @route   GET /api/users/brand-profile
// @access  Private
router.get("/brand-profile", authenticate, getBrandProfile);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", authenticate, updateUserProfile);

// @desc    Update brand profile
// @route   PUT /api/users/brand-profile
// @access  Private (Brand only)
router.put("/brand-profile", authenticate, updateBrandProfile);

// @desc    Logout user (revoke current token)
// @route   POST /api/users/logout
// @access  Private
router.post("/logout", authenticate, logout);

// @desc    Logout from all devices (revoke all user tokens)
// @route   POST /api/users/logout-all
// @access  Private
router.post("/logout-all", authenticate, logoutAll);

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put("/change-password", authenticate, changePassword);

// @desc    Refresh token
// @route   POST /api/users/refresh-token
// @access  Private
router.post("/refresh-token", authenticate, refreshToken);

// @desc    Verify token
// @route   GET /api/users/verify-token
// @access  Private
router.get("/verify-token", authenticate, verifyToken);

router.get("/debug-token", authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    tokenId: req.tokenId
  });
});

export default router;
