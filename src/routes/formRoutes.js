import express from "express";
import Form from "../models/Form.js";
import SurveyResponse from "../models/SurveyResponse.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to extract user from token (optional for some routes)
const extractUser = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key",
      );
      req.userId = decoded.userId;
    } catch (error) {
      // Token invalid, but continue without user
    }
  }
  next();
};

// @desc    Get all forms (public - for display)
// @route   GET /api/forms
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { status, category, author, limit = 50, page = 1 } = req.query;

    const query = { isActive: true };

    if (status) query.status = status;
    if (category && category !== "all") query.category = category;
    if (author) query.author = new RegExp(author, "i");

    const skip = (page - 1) * limit;

    const forms = await Form.find(query)
      .select("-questions") // Don't include questions in list view
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("authorId", "name email");

    const total = await Form.countDocuments(query);

    res.json({
      success: true,
      data: forms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get forms error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get single form with questions
// @route   GET /api/forms/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const form = await Form.findById(req.params.id).populate(
      "authorId",
      "name email",
    );

    if (!form || !form.isActive) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Increment view count
    await form.incrementViews();

    res.json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.error("Get form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Create new form
// @route   POST /api/forms
// @access  Private (optional - can be public for demo)
router.post("/", extractUser, async (req, res) => {
  try {
    const formData = {
      ...req.body,
      authorId: req.userId || null,
    };

    // If category is "Others", use customCategory
    if (formData.category === "Others" && formData.customCategory) {
      formData.category = formData.customCategory;
      delete formData.customCategory;
    }

    const form = new Form(formData);
    await form.save();

    res.status(201).json({
      success: true,
      message: "Form created successfully",
      data: form,
    });
  } catch (error) {
    console.error("Create form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Update form
// @route   PUT /api/forms/:id
// @access  Private (optional - can be public for demo)
router.put("/:id", extractUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If category is "Others", use customCategory
    if (updateData.category === "Others" && updateData.customCategory) {
      updateData.category = updateData.customCategory;
      delete updateData.customCategory;
    }

    const form = await Form.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    res.json({
      success: true,
      message: "Form updated successfully",
      data: form,
    });
  } catch (error) {
    console.error("Update form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Delete form
// @route   DELETE /api/forms/:id
// @access  Private (optional - can be public for demo)
router.delete("/:id", extractUser, async (req, res) => {
  try {
    const form = await Form.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    res.json({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    console.error("Delete form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get forms by status
// @route   GET /api/forms/status/:status
// @access  Public
router.get("/status/:status", async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const query = { status, isActive: true };
    const skip = (page - 1) * limit;

    const forms = await Form.find(query)
      .select("-questions")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Form.countDocuments(query);

    res.json({
      success: true,
      data: forms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get forms by status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get form statistics
// @route   GET /api/forms/:id/stats
// @access  Public
router.get("/:id/stats", async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    const analytics = await SurveyResponse.getAnalytics(req.params.id);

    res.json({
      success: true,
      data: {
        form: {
          id: form._id,
          title: form.title,
          status: form.status,
          responseCount: form.responseCount,
          viewCount: form.viewCount,
        },
        analytics: analytics[0] || {
          totalResponses: 0,
          avgTimeTaken: 0,
          completionRate: 0,
          responsesByDate: [],
        },
      },
    });
  } catch (error) {
    console.error("Get form stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
