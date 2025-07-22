import express from "express";
import { authenticate, optionalAuth, isBrand } from "../middleware/auth.js";
import {
  getAllForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  getFormsByStatus,
  getFormStats,
} from "../controllers/formController.js";

const router = express.Router();

// @desc    Get all forms (public - for display)
// @route   GET /api/forms
// @access  Public with optional authentication
router.get("/", optionalAuth, getAllForms);

// @desc    Get single form with questions
// @route   GET /api/forms/:id
// @access  Public with optional authentication
router.get("/:id", optionalAuth, getFormById);

// @desc    Get all form with questions of brand, use id from auth middleware
// @route   GET /api/forms
// @access  Public with optional authentication

router.get("/brand", optionalAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.brandId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
        error: "UNAUTHORIZED",
      });
    }
    const forms = await getAllForms(req.user.brandId);
    res.json({
      success: true,
      forms,
    });
  } catch (error) {
    console.error("Error fetching brand forms:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Create new form
// @route   POST /api/forms
// @access  Private (requires authentication)
router.post("/", authenticate, isBrand, createForm);

// @desc    Update form
// @route   PUT /api/forms/:id
// @access  Private (requires ownership or admin)
router.put("/:id", authenticate, isBrand, updateForm);

// @desc    Delete form
// @route   DELETE /api/forms/:id
// @access  Private (requires ownership or admin)
router.delete("/:id", authenticate, isBrand, deleteForm);

// @desc    Get forms by status
// @route   GET /api/forms/status/:status
// @access  Public with optional authentication
router.get("/status/:status", optionalAuth, getFormsByStatus);

// @desc    Get form statistics
// @route   GET /api/forms/:id/stats
// @access  Private (requires ownership or admin)
router.get("/:id/stats", authenticate, isBrand, getFormStats);

export default router;