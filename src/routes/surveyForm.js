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
  getBrandForms,
} from "../controllers/formController.js";

const router = express.Router();

// @desc    Get all forms (public - for display)
// @route   GET /api/forms
// @access  Public with optional authentication
router.get("/", optionalAuth, getAllForms);

// @desc    Get all forms of brand
// @route   GET /api/forms/brand-forms
// @access  Private (requires brand role)
router.get("/brand-forms", authenticate, isBrand, getBrandForms);

// @desc    Get forms by status
// @route   GET /api/forms/status/:status
// @access  Public with optional authentication
router.get("/status/:status", optionalAuth, getFormsByStatus);

// @desc    Get form statistics
// @route   GET /api/forms/:id/stats
// @access  Private (requires ownership or admin)
router.get("/:id/stats", authenticate, isBrand, getFormStats);

// @desc    Get single form with questions
// @route   GET /api/forms/:id
// @access  Public with optional authentication
router.get("/:id", optionalAuth, getFormById);

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

export default router;