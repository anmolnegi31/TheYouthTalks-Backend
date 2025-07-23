import SurveyResponse from "../models/SurveyResponse.js";
import SurveyForm from "../models/surveyForm.js";

// @desc    Submit survey response
// @route   POST /api/responses
// @access  Public with optional authentication
export const submitResponse = async (req, res) => {
  try {
    const {
      surveyId,
      respondentEmail,
      respondentName,
      responses,
      timeTaken,
      deviceInfo,
    } = req.body;

    // Validate required fields
    if (!surveyId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: "Survey ID and responses are required",
        error: "MISSING_REQUIRED_FIELDS"
      });
    }
    
    // Validate survey exists and is active
    const survey = await SurveyForm.findById(surveyId);
    if (!survey || !survey.isActive) {
      return res.status(404).json({
        success: false,
        message: "Survey not found or inactive",
        error: "SURVEY_NOT_FOUND"
      });
    }

    // Check if survey is currently published
    if (survey.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Survey is not currently accepting responses",
        error: "SURVEY_NOT_LIVE"
      });
    }

    // Check for duplicate responses if not allowed
    if (!survey.settings.allowMultipleSubmissions) {
      const duplicateQuery = { surveyId };
      
      // Build query based on available identifiers
      const orConditions = [];
      
      if (req.userId) {
        orConditions.push({ respondentId: req.userId });
      }
      
      if (respondentEmail) {
        orConditions.push({ respondentEmail: respondentEmail });
      }
      
      // Only check for duplicates if we have some way to identify the user
      if (orConditions.length > 0) {
        duplicateQuery.$or = orConditions;
        
        const existingResponse = await SurveyResponse.findOne(duplicateQuery);
        
        if (existingResponse) {
          return res.status(400).json({
            success: false,
            message: "You have already responded to this survey",
            error: "DUPLICATE_RESPONSE"
          });
        }
      }
    }

    // Prepare response data - handle both authenticated and anonymous users
    const responseData = {
      surveyId,
      responses,
      timeTaken,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      deviceInfo,
    };

    // Add user information if available (authenticated user)
    if (req.userId && req.user) {
      responseData.respondentId = req.userId;
      responseData.respondentEmail = respondentEmail || req.user.email;
      responseData.respondentName = respondentName || req.user.name;
    } else {
      // Anonymous user - require email and name in request body
      if (!respondentEmail || !respondentName) {
        return res.status(400).json({
          success: false,
          message: "Email and name are required for anonymous responses",
          error: "ANONYMOUS_USER_INFO_REQUIRED"
        });
      }
      responseData.respondentEmail = respondentEmail;
      responseData.respondentName = respondentName;
      responseData.respondentId = null;
    }

    // Create response
    const surveyResponse = new SurveyResponse(responseData);
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
};

// @desc    Get responses for a survey
// @route   GET /api/responses/survey/:surveyId
// @access  Private (requires form ownership or admin)
export const getResponsesBySurvey = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { limit = 50, page = 1, includeDetails = false } = req.query;

    // Check if user owns the form or is admin
    const form = await SurveyForm.findById(surveyId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
        error: "SURVEY_NOT_FOUND"
      });
    }

    if (form.authorId?.toString() !== req.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view responses for your own surveys.",
        error: "OWNERSHIP_REQUIRED"
      });
    }

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
};

// @desc    Get single response details
// @route   GET /api/responses/:id
// @access  Private (requires form ownership, response ownership, or admin)
export const getResponseById = async (req, res) => {
  try {
    const response = await SurveyResponse.findById(req.params.id)
      .populate("surveyId", "title questions authorId")
      .populate("respondentId", "name email");

    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Response not found",
        error: "RESPONSE_NOT_FOUND"
      });
    }

    // Check permissions: form owner, response owner, or admin
    const isFormOwner = response.surveyId.authorId?.toString() === req.userId.toString();
    const isResponseOwner = response.respondentId?.toString() === req.userId.toString();
    const isAdmin = req.user.role === "admin";

    if (!isFormOwner && !isResponseOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own responses or responses to your surveys.",
        error: "OWNERSHIP_REQUIRED"
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
};

// @desc    Get user's own responses
// @route   GET /api/responses/my-responses
// @access  Private (requires authentication)
export const getMyResponses = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const responses = await SurveyResponse.find({ 
      $or: [
        { respondentId: req.userId },
        { respondentEmail: req.user.email }
      ]
    })
      .select("surveyId submittedAt timeTaken isComplete")
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("surveyId", "title description category status");

    const total = await SurveyResponse.countDocuments({ 
      $or: [
        { respondentId: req.userId },
        { respondentEmail: req.user.email }
      ]
    });

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
    console.error("Get user responses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get response analytics for a survey
// @route   GET /api/responses/analytics/:surveyId
// @access  Private (requires form ownership or admin)
export const getResponseAnalytics = async (req, res) => {
  try {
    const { surveyId } = req.params;

    // Check if user owns the form or is admin
    const survey = await SurveyForm.findById(surveyId).select("questions title authorId");
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
        error: "SURVEY_NOT_FOUND"
      });
    }

    if (survey.authorId?.toString() !== req.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view analytics for your own surveys.",
        error: "OWNERSHIP_REQUIRED"
      });
    }

    // Get basic analytics
    const analytics = await SurveyResponse.getAnalytics(surveyId);

    // Get question-wise analysis
    const responses = await SurveyResponse.find({ surveyId }).select(
      "responses submittedAt timeTaken",
    );

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

      if (question.type === "multiple-choice" || question.type === "dropdown") {
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
};

// @desc    Export responses as CSV
// @route   GET /api/responses/export/:surveyId
// @access  Private (requires form ownership or admin)
export const exportResponses = async (req, res) => {
  try {
    const { surveyId } = req.params;

    const survey = await SurveyForm.findById(surveyId).select("title questions authorId");
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found",
        error: "SURVEY_NOT_FOUND"
      });
    }

    // Check ownership or admin privilege
    if (survey.authorId?.toString() !== req.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only export responses for your own surveys.",
        error: "OWNERSHIP_REQUIRED"
      });
    }

    const responses = await SurveyResponse.find({ surveyId })
      .populate("respondentId", "name email")
      .sort({ submittedAt: -1 });

    if (responses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No responses found for this survey",
        error: "NO_RESPONSES_FOUND"
      });
    }

    // Create comprehensive CSV headers
    const baseHeaders = [
      "Response ID",
      "Respondent Name",
      "Respondent Email",
      "Submitted At",
      "Time Taken (minutes)",
      "Completion Status",
      "Device Type",
      "Browser",
      "IP Address"
    ];

    // Add question headers with question type info
    const questionHeaders = survey.questions.map((q, index) => {
      const questionNumber = `Q${index + 1}`;
      const questionTitle = q.title.replace(/[,"\r\n]/g, ' ').trim();
      const questionType = `[${q.type.toUpperCase()}]`;
      return `${questionNumber}: ${questionTitle} ${questionType}`;
    });

    const headers = [...baseHeaders, ...questionHeaders];

    // Create CSV rows with enhanced data
    const rows = responses.map((response) => {
      const row = [
        response._id,
        response.respondentName || response.respondentId?.name || "Anonymous",
        response.respondentEmail || response.respondentId?.email || "Not provided",
        new Date(response.submittedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'UTC'
        }),
        response.timeTaken ? Math.round(response.timeTaken * 100) / 100 : 0,
        response.isComplete ? "Complete" : "Incomplete",
        response.deviceInfo?.type || "Unknown",
        response.deviceInfo?.browser || "Unknown",
        response.ipAddress || "Not recorded"
      ];

      // Add answers for each question in order
      survey.questions.forEach((question) => {
        const responseAnswer = response.responses.find(
          (r) => r.questionId === question.id
        );

        if (responseAnswer && responseAnswer.answer !== null && responseAnswer.answer !== undefined) {
          let formattedAnswer = "";
          
          // Handle different question types appropriately
          switch (question.type) {
            case "checkbox":
              if (Array.isArray(responseAnswer.answer)) {
                formattedAnswer = responseAnswer.answer.join("; ");
              } else {
                formattedAnswer = String(responseAnswer.answer);
              }
              break;
              
            case "rating":
              formattedAnswer = `${responseAnswer.answer}/10`;
              break;
              
            case "multiple-choice":
            case "dropdown":
              formattedAnswer = String(responseAnswer.answer);
              break;
              
            case "text":
            case "email":
            case "number":
              formattedAnswer = String(responseAnswer.answer);
              break;
              
            case "paragraph":
              // Clean up paragraph text for CSV
              formattedAnswer = String(responseAnswer.answer)
                .replace(/[\r\n]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              break;
              
            case "date":
              if (responseAnswer.answer) {
                try {
                  formattedAnswer = new Date(responseAnswer.answer).toLocaleDateString();
                } catch (e) {
                  formattedAnswer = String(responseAnswer.answer);
                }
              }
              break;
              
            default:
              formattedAnswer = String(responseAnswer.answer);
          }
          
          row.push(formattedAnswer);
        } else {
          row.push("No response");
        }
      });

      return row;
    });

    // Convert to CSV string with proper escaping
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((field) => {
          const stringField = String(field || "");
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        }).join(",")
      )
      .join("\n");

    // Add BOM for proper UTF-8 encoding in Excel
    const csvWithBOM = '\uFEFF' + csvContent;

    // Set response headers for file download
    const fileName = `${survey.title.replace(/[^a-zA-Z0-9]/g, '_')}_responses_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", Buffer.byteLength(csvWithBOM, 'utf8'));
    
    res.send(csvWithBOM);
  } catch (error) {
    console.error("Export responses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};