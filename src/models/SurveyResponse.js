import mongoose from "mongoose";

const responseAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      required: true,
      enum: ["short", "long", "mcq", "rating", "checkbox", "dropdown"],
    },
    answer: {
      type: mongoose.Schema.Types.Mixed, // Can be String, Number, or Array
      required: true,
    },
  },
  { _id: false },
);

const surveyResponseSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    respondentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for anonymous responses
    },
    respondentEmail: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          if (!email) return true; // Optional field
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: "Please enter a valid email",
      },
    },
    respondentName: {
      type: String,
      trim: true,
    },
    responses: [responseAnswerSchema],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    timeTaken: {
      type: Number, // in minutes
      min: 0,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    isComplete: {
      type: Boolean,
      default: true,
    },
    deviceInfo: {
      type: {
        type: String,
        enum: ["desktop", "mobile", "tablet"],
        default: "desktop",
      },
      browser: String,
      os: String,
    },
  },
  {
    timestamps: true,
  },
);

// Validate that response matches survey structure
surveyResponseSchema.pre("save", async function (next) {
  try {
    const Form = mongoose.model("Form");
    const survey = await Form.findById(this.surveyId).select("questions");

    if (!survey) {
      return next(new Error("Survey not found"));
    }

    // Validate required questions are answered
    const requiredQuestions = survey.questions.filter((q) => q.required);
    const answeredQuestionIds = this.responses.map((r) => r.questionId);

    for (const requiredQ of requiredQuestions) {
      if (!answeredQuestionIds.includes(requiredQ.id)) {
        return next(
          new Error(`Required question "${requiredQ.title}" not answered`),
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Index for better performance
surveyResponseSchema.index({ surveyId: 1, submittedAt: -1 });
surveyResponseSchema.index({ respondentId: 1, submittedAt: -1 });
surveyResponseSchema.index({ respondentEmail: 1 });
surveyResponseSchema.index({ submittedAt: -1 });

// Static method to get analytics
surveyResponseSchema.statics.getAnalytics = function (surveyId) {
  return this.aggregate([
    { $match: { surveyId: new mongoose.Types.ObjectId(surveyId) } },
    {
      $group: {
        _id: null,
        totalResponses: { $sum: 1 },
        avgTimeTaken: { $avg: "$timeTaken" },
        completionRate: {
          $avg: { $cond: ["$isComplete", 1, 0] },
        },
        responsesByDate: {
          $push: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" },
            },
            responses: 1,
          },
        },
      },
    },
  ]);
};

const SurveyResponse = mongoose.model("SurveyResponse", surveyResponseSchema);
export default SurveyResponse;
