import express from "express";
import Category from "../models/Category.js";

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      sortOrder: 1,
      name: 1,
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Public (for demo - should be admin only in production)
router.post("/", async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Public (for demo - should be admin only in production)
router.put("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Public (for demo - should be admin only in production)
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
