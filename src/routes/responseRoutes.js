import express from "express";
import SurveyResponse from "../models/SurveyResponse.js";
import Form from "../models/Form.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to extract user from token (optional)
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

// @desc    Submit survey response
// @route   POST /api/responses
// @access  Public
router.post("/", extractUser, async (req, res) => {
  try {
    const {
      surveyId,
      respondentEmail,
      respondentName,
      responses,
      timeTaken,
      deviceInfo,
    } = req.body;

    // Validate survey exists and is active
    const survey = await Form.findById(surveyId);
    if (!survey || !survey.isActive) {
      return res.status(404).json({
        success: false,
        message: "Survey not found or inactive",
      });
    }

    // Check if survey is currently live
    if (survey.status !== "live") {
      return res.status(400).json({
        success: false,
        message: "Survey is not currently accepting responses",
      });
    }

    // Check for duplicate responses if not allowed
    if (
      !survey.settings.allowMultipleResponses &&
      (req.userId || respondentEmail)
    ) {
      const existingResponse = await SurveyResponse.findOne({
        surveyId,
        $or: [
          { respondentId: req.userId },
          { respondentEmail: respondentEmail },
        ],
      });

      if (existingResponse) {
        return res.status(400).json({
          success: false,
          message: "You have already responded to this survey",
        });
      }
    }

    // Create response
    const surveyResponse = new SurveyResponse({
      surveyId,
      respondentId: req.userId || null,
      respondentEmail,
      respondentName,
      responses,
      timeTaken,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      deviceInfo,
    });

    await surveyResponse.save();

    // Increment form response count
    await survey.incrementResponses();

    res.status(201).json({
      success: true,
      message: "Response submitted successfully",
      data: {
        responseId: surveyResponse._id,
        submittedAt: surveyResponse.submittedAt,
      },
    });
  } catch (error) {
    console.error("Submit response error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get responses for a survey
// @route   GET /api/responses/survey/:surveyId
// @access  Public (for demo - should be private in production)
router.get("/survey/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { limit = 50, page = 1, includeDetails = false } = req.query;

    const skip = (page - 1) * limit;

    let selectFields =
      "respondentEmail respondentName submittedAt timeTaken isComplete";
    if (includeDetails === "true") {
      selectFields += " responses deviceInfo";
    }

    const responses = await SurveyResponse.find({ surveyId })
      .select(selectFields)
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("respondentId", "name email");

    const total = await SurveyResponse.countDocuments({ surveyId });

    res.json({
      success: true,
      data: responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get responses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get single response details
// @route   GET /api/responses/:id
// @access  Public (for demo - should be private in production)
router.get("/:id", async (req, res) => {
  try {
    const response = await SurveyResponse.findById(req.params.id)
      .populate("surveyId", "title questions")
      .populate("respondentId", "name email");

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Response not found",
      });
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Get response error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get response analytics for a survey
// @route   GET /api/responses/analytics/:surveyId
// @access  Public (for demo - should be private in production)
router.get("/analytics/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;

    // Get basic analytics
    const analytics = await SurveyResponse.getAnalytics(surveyId);

    // Get question-wise analysis
    const responses = await SurveyResponse.find({ surveyId }).select(
      "responses submittedAt timeTaken",
    );

    const survey = await Form.findById(surveyId).select("questions title");

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
      });
    }

    // Analyze each question
    const questionAnalysis = survey.questions.map((question) => {
      const questionResponses = responses
        .map((r) => r.responses.find((resp) => resp.questionId === question.id))
        .filter(Boolean);

      const analysis = {
        questionId: question.id,
        questionTitle: question.title,
        questionType: question.type,
        totalResponses: questionResponses.length,
      };

      if (question.type === "mcq" || question.type === "dropdown") {
        // Count option frequencies
        const optionCounts = {};
        questionResponses.forEach((resp) => {
          const answer = resp.answer;
          optionCounts[answer] = (optionCounts[answer] || 0) + 1;
        });
        analysis.optionCounts = optionCounts;
      } else if (question.type === "checkbox") {
        // Count each checkbox option
        const optionCounts = {};
        questionResponses.forEach((resp) => {
          const answers = Array.isArray(resp.answer)
            ? resp.answer
            : [resp.answer];
          answers.forEach((answer) => {
            optionCounts[answer] = (optionCounts[answer] || 0) + 1;
          });
        });
        analysis.optionCounts = optionCounts;
      } else if (question.type === "rating") {
        // Calculate rating statistics
        const ratings = questionResponses
          .map((resp) => Number(resp.answer))
          .filter((r) => !isNaN(r));
        if (ratings.length > 0) {
          analysis.averageRating =
            ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          analysis.ratingDistribution = {};
          ratings.forEach((rating) => {
            analysis.ratingDistribution[rating] =
              (analysis.ratingDistribution[rating] || 0) + 1;
          });
        }
      }

      return analysis;
    });

    res.json({
      success: true,
      data: {
        surveyTitle: survey.title,
        surveyId,
        summary: analytics[0] || {
          totalResponses: 0,
          avgTimeTaken: 0,
          completionRate: 0,
        },
        questionAnalysis,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Export responses as CSV
// @route   GET /api/responses/export/:surveyId
// @access  Public (for demo - should be private in production)
router.get("/export/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;

    const survey = await Form.findById(surveyId).select("title questions");
    const responses = await SurveyResponse.find({ surveyId })
      .populate("respondentId", "name email")
      .sort({ submittedAt: -1 });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
      });
    }

    // Create CSV header
    const headers = [
      "Response ID",
      "Respondent Name",
      "Respondent Email",
      "Submitted At",
      "Time Taken (minutes)",
      ...survey.questions.map((q) => q.title),
    ];

    // Create CSV rows
    const rows = responses.map((response) => {
      const row = [
        response._id,
        response.respondentName || response.respondentId?.name || "Anonymous",
        response.respondentEmail || response.respondentId?.email || "",
        response.submittedAt.toISOString(),
        response.timeTaken || 0,
      ];

      // Add answers for each question
      survey.questions.forEach((question) => {
        const answer = response.responses.find(
          (r) => r.questionId === question.id,
        );
        if (answer) {
          if (Array.isArray(answer.answer)) {
            row.push(answer.answer.join("; "));
          } else {
            row.push(answer.answer);
          }
        } else {
          row.push("");
        }
      });

      return row;
    });

    // Convert to CSV string
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${survey.title}-responses.csv"`,
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Export responses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
