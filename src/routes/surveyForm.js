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
  changeFormStatus,
  publishForm,
  unpublishForm,
  closeForm,
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

// @desc    Change form status
// @route   PATCH /api/forms/:id/status
// @access  Private (requires ownership or admin)
router.patch("/:id/status", authenticate, isBrand, changeFormStatus);

// @desc    Publish form
// @route   PATCH /api/forms/:id/publish
// @access  Private (requires ownership or admin)
router.patch("/:id/publish", authenticate, isBrand, publishForm);

// @desc    Unpublish form (set to draft)
// @route   PATCH /api/forms/:id/unpublish
// @access  Private (requires ownership or admin)
router.patch("/:id/unpublish", authenticate, isBrand, unpublishForm);

// @desc    Close form
// @route   PATCH /api/forms/:id/close
// @access  Private (requires ownership or admin)
router.patch("/:id/close", authenticate, isBrand, closeForm);

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