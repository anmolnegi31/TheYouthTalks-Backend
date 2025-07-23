import SurveyForm from "../models/SurveyForm.js";
import SurveyResponse from "../models/SurveyResponse.js";

// @desc    Get all forms (public - for display)
// @route   GET /api/forms
// @access  Public with optional authentication
export const getAllForms = async (req, res) => {
  try {
    const { status, category, author, limit = 50, page = 1, myForms } = req.query;

    let query = { isActive: true };

    // If user is authenticated and requests their own forms
    if (myForms === "true" && req.userId) {
      query.authorId = req.userId;
    }

    if (status) query.status = status;
    if (category && category !== "all") query.category = category;
    if (author) query.author = new RegExp(author, "i");

    const skip = (page - 1) * limit;

    const forms = await SurveyForm.find(query)
      .select("-questions") // Don't include questions in list view
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("authorId", "name email");

    const total = await SurveyForm.countDocuments(query);

    res.json({
      success: true,
      data: forms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      user: req.user ? { id: req.user._id, name: req.user.name, role: req.user.role } : null
    });
  } catch (error) {
    console.error("Get forms error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get single form with questions
// @route   GET /api/forms/:id
// @access  Public with optional authentication
export const getFormById = async (req, res) => {
  try {
    const form = await SurveyForm.findById(req.params.id).populate(
      "authorId",
      "name email",
    );

    if (!form || !form.isActive) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
        error: "FORM_NOT_FOUND"
      });
    }

    // Check if user can view this form (if it's private)
    if (form.status === "draft" && (!req.userId || (req.userId.toString() !== form.authorId?.toString() && req.user?.role !== "admin"))) {
      return res.status(403).json({
        success: false,
        message: "This form is in draft mode and not publicly accessible.",
        error: "DRAFT_ACCESS_DENIED"
      });
    }

    // Increment view count
    await form.incrementViews();

    res.json({
      success: true,
      data: form,
      permissions: {
        canEdit: req.userId && (req.userId.toString() === form.authorId?.toString() || req.user?.role === "admin"),
        canDelete: req.userId && (req.userId.toString() === form.authorId?.toString() || req.user?.role === "admin"),
        canViewAnalytics: req.userId && (req.userId.toString() === form.authorId?.toString() || req.user?.role === "admin")
      }
    });
  } catch (error) {
    console.error("Get form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Create new form
// @route   POST /api/forms
// @access  Private (requires authentication)
export const createForm = async (req, res) => {
  try {
    const formData = {
      ...req.body,
      authorId: req.userId,
      author: req.user.name
    };

    // If category is "Others", use customCategory
    if (formData.category === "Others" && formData.customCategory) {
      formData.category = formData.customCategory;
      delete formData.customCategory;
    }

    const form = new SurveyForm(formData);
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
};

// @desc    Update form
// @route   PUT /api/forms/:id
// @access  Private (requires ownership or admin)
export const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if form exists and get ownership info
    const existingForm = await SurveyForm.findById(id);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
        error: "FORM_NOT_FOUND"
      });
    }

    // Check ownership or admin privilege
    if (existingForm.authorId?.toString() !== req.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own forms.",
        error: "OWNERSHIP_REQUIRED"
      });
    }

    const updateData = { ...req.body };

    // If category is "Others", use customCategory
    if (updateData.category === "Others" && updateData.customCategory) {
      updateData.category = updateData.customCategory;
      delete updateData.customCategory;
    }

    const form = await SurveyForm.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

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
};

// @desc    Delete form
// @route   DELETE /api/forms/:id
// @access  Private (requires ownership or admin)
export const deleteForm = async (req, res) => {
  try {
    const existingForm = await SurveyForm.findById(req.params.id);

    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
        error: "FORM_NOT_FOUND"
      });
    }

    // Add detailed logging for debugging
    console.log("Delete form attempt:");
    console.log("- Form ID:", req.params.id);
    console.log("- Form author ID:", existingForm.authorId);
    console.log("- User ID from request:", req.userId);
    console.log("- User role:", req.user.role);

    const formAuthorId = existingForm.authorId?.toString();
    const requestUserId = req.userId?.toString();
    
    console.log("- String comparison:", formAuthorId === requestUserId);

    // Check ownership or admin privilege with more robust comparison
    const isOwner = formAuthorId && requestUserId && formAuthorId === requestUserId;
    const isAdmin = req.user && req.user.role === "admin";
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own forms.",
        error: "OWNERSHIP_REQUIRED"
      });
    }

    await SurveyForm.findByIdAndDelete(req.params.id);

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
};

// @desc    Get forms by status
// @route   GET /api/forms/status/:status
// @access  Public with optional authentication
export const getFormsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 20, page = 1, myForms } = req.query;

    let query = { status, isActive: true };
    
    // If user is authenticated and requests their own forms
    if (myForms === "true" && req.userId) {
      query.authorId = req.userId;
    }

    const skip = (page - 1) * limit;

    const forms = await SurveyForm.find(query)
      .select("-questions")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("authorId", "name email");

    const total = await SurveyForm.countDocuments(query);

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
};

// @desc    Get form statistics
// @route   GET /api/forms/:id/stats
// @access  Private (requires ownership or admin)
export const getFormStats = async (req, res) => {
  try {
    const form = await SurveyForm.findById(req.params.id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
        error: "FORM_NOT_FOUND"
      });
    }

    // Check ownership or admin privilege
    if (form.authorId?.toString() !== req.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view statistics for your own forms.",
        error: "OWNERSHIP_REQUIRED"
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
          submissionCount: form.submissionCount,
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
};

// @desc    Get all forms of a brand
// @route   GET /api/forms/brand-forms
// @access  Private (requires brand role)
export const getBrandForms = async (req, res) => {
  try {
    // Assuming you have a method to get all forms by brand ID
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const query = { 
      authorId: req.userId,
      isActive: true 
    };

    const forms = await SurveyForm.find(query)
      .select("-questions") // Optional: exclude questions for performance
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("authorId", "name email");

    const total = await SurveyForm.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: forms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Error fetching brand forms:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Change form status
// @route   PATCH /api/forms/:id/status
// @access  Private (requires ownership or admin)
export const changeFormStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["draft", "published", "scheduled", "closed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: draft, published, scheduled, closed",
        error: "INVALID_STATUS"
      });
    }

    // Check if form exists
    const existingForm = await SurveyForm.findById(id);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
        error: "FORM_NOT_FOUND"
      });
    }

    // Check ownership or admin privilege
    if (existingForm.authorId?.toString() !== req.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only change status of your own forms.",
        error: "OWNERSHIP_REQUIRED"
      });
    }

    // Additional validation for status changes
    if (status === "published") {
      const now = new Date();
      if (existingForm.publishDate > now) {
        return res.status(400).json({
          success: false,
          message: "Cannot publish form before its publish date",
          error: "PUBLISH_DATE_NOT_REACHED"
        });
      }
      if (existingForm.expiryDate <= now) {
        return res.status(400).json({
          success: false,
          message: "Cannot publish form after its expiry date",
          error: "FORM_EXPIRED"
        });
      }
    }

    // Update the form status
    const updatedForm = await SurveyForm.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select("-questions"); // Don't return questions for performance

    res.json({
      success: true,
      message: `Form status changed to ${status} successfully`,
      data: {
        id: updatedForm._id,
        title: updatedForm.title,
        status: updatedForm.status,
        publishDate: updatedForm.publishDate,
        expiryDate: updatedForm.expiryDate,
        updatedAt: updatedForm.updatedAt
      }
    });
  } catch (error) {
    console.error("Change form status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Publish form (shortcut for status change)
// @route   PATCH /api/forms/:id/publish
// @access  Private (requires ownership or admin)
export const publishForm = async (req, res) => {
  try {
    const { id } = req.params;

    const existingForm = await SurveyForm.findById(id);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
        error: "FORM_NOT_FOUND"
      });
    }

    // Check ownership
    if (existingForm.authorId?.toString() !== req.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only publish your own forms.",
        error: "OWNERSHIP_REQUIRED"
      });
    }

    // Validate dates
    const now = new Date();
    if (existingForm.publishDate > now) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish form before its publish date",
        error: "PUBLISH_DATE_NOT_REACHED"
      });
    }
    if (existingForm.expiryDate <= now) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish form after its expiry date",
        error: "FORM_EXPIRED"
      });
    }

    const updatedForm = await SurveyForm.findByIdAndUpdate(
      id,
      { status: "published" },
      { new: true }
    ).select("title status publishDate expiryDate updatedAt");

    res.json({
      success: true,
      message: "Form published successfully",
      data: updatedForm
    });
  } catch (error) {
    console.error("Publish form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Unpublish form (set to draft)
// @route   PATCH /api/forms/:id/unpublish
// @access  Private (requires ownership or admin)
export const unpublishForm = async (req, res) => {
  try {
    const { id } = req.params;

    const existingForm = await SurveyForm.findById(id);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
        error: "FORM_NOT_FOUND"
      });
    }

    // Check ownership
    if (existingForm.authorId?.toString() !== req.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only unpublish your own forms.",
        error: "OWNERSHIP_REQUIRED"
      });
    }

    const updatedForm = await SurveyForm.findByIdAndUpdate(
      id,
      { status: "draft" },
      { new: true }
    ).select("title status publishDate expiryDate updatedAt");

    res.json({
      success: true,
      message: "Form unpublished successfully (set to draft)",
      data: updatedForm
    });
  } catch (error) {
    console.error("Unpublish form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Close form (set to closed)
// @route   PATCH /api/forms/:id/close
// @access  Private (requires ownership or admin)
export const closeForm = async (req, res) => {
  try {
    const { id } = req.params;

    const existingForm = await SurveyForm.findById(id);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
        error: "FORM_NOT_FOUND"
      });
    }

    // Check ownership
    if (existingForm.authorId?.toString() !== req.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only close your own forms.",
        error: "OWNERSHIP_REQUIRED"
      });
    }

    const updatedForm = await SurveyForm.findByIdAndUpdate(
      id,
      { status: "closed" },
      { new: true }
    ).select("title status publishDate expiryDate updatedAt");

    res.json({
      success: true,
      message: "Form closed successfully",
      data: updatedForm
    });
  } catch (error) {
    console.error("Close form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};