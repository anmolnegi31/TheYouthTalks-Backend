import express from "express";
import { authenticate, isAdmin } from "../middleware/auth.js";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryFormCount
} from "../controllers/categoryController.js";

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get("/", getAllCategories);

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
router.get("/:id", getCategoryById);

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin only)
router.post("/", authenticate, isAdmin, createCategory);

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
router.put("/:id", authenticate, isAdmin, updateCategory);

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
router.delete("/:id", authenticate, isAdmin, deleteCategory);

// @desc    Update category form count
// @route   PATCH /api/categories/:id/form-count
// @access  Private (Admin only)
router.patch("/:id/form-count", authenticate, isAdmin, updateCategoryFormCount);

export default router;
