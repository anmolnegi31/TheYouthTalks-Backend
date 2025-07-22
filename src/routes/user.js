import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  refreshToken,
  verifyToken
} from "../controllers/userController.js";
import { revokeToken } from "../utils/tokenUtils.js";

const router = express.Router();

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
router.post("/register", registerUser);

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
router.post("/login", loginUser);

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", authenticate, getUserProfile);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", authenticate, updateUserProfile);

// @desc    Logout user (revoke current token)
// @route   POST /api/users/logout
// @access  Private
router.post("/logout", authenticate, async (req, res) => {
  try {
    // Revoke the current token
    const revoked = await revokeToken(req.token, "logout");
    
    if (revoked) {
      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Token not found or already revoked",
        error: "TOKEN_NOT_FOUND"
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message,
    });
  }
});

// @desc    Logout from all devices (revoke all user tokens)
// @route   POST /api/users/logout-all
// @access  Private
router.post("/logout-all", authenticate, async (req, res) => {
  try {
    // Revoke all user tokens
    const revokedCount = await revokeAllUserTokens(req.userId, "logout_all");
    
    res.json({
      success: true,
      message: "Logged out from all devices successfully",
      data: {
        revokedTokens: revokedCount,
      },
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout from all devices",
      error: error.message,
    });
  }
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Get user with password
    const user = await user.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
        error: "INVALID_CURRENT_PASSWORD"
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Revoke all tokens (force re-login on all devices)
    await revokeAllUserTokens(req.userId, "password_change");

    res.json({
      success: true,
      message: "Password changed successfully. Please login again on all devices.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password change",
      error: error.message,
    });
  }
});

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
