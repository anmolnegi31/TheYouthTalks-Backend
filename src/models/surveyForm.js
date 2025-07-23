import mongoose from "mongoose";

// Check if the model already exists
if (mongoose.models.SurveyForm) {
  delete mongoose.models.SurveyForm;
}

const optionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const validationSchema = new mongoose.Schema(
  {
    minLength: {
      type: Number,
      min: 0,
    },
    maxLength: {
      type: Number,
      min: 1,
    },
    minValue: {
      type: Number,
    },
    maxValue: {
      type: Number,
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["paragraph", "multiple-choice", "rating", "checkbox", "number", "dropdown", "email", "phone"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    options: [optionSchema], // For multiple-choice, checkbox, dropdown
    maxRating: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    validation: validationSchema,
  },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    allowMultipleSubmissions: {
      type: Boolean,
      default: false,
    },
    requireEmailVerification: {
      type: Boolean,
      default: false,
    },
    showProgressBar: {
      type: Boolean,
      default: true,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    confirmationMessage: {
      type: String,
      default: "Thank you for your response! We appreciate your time.",
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    generateReports: {
      type: Boolean,
      default: true,
    },
    collectEmail: {
      type: Boolean,
      default: true,
    },
    collectName: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const surveyFormSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    headerImage: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Food and Beverages",
        "Entertainment",
        "Luxury",
        "Logistics",
        "Vehicles",
        "NGO's",
        "Retail",
        "Education",
        "Fashion and Lifestyle",
        "Technology",
        "Marketing",
        "HR",
        "Others",
      ],
    },
    customCategory: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    publishDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "scheduled", "closed"],
      default: "draft",
    },
    questions: [questionSchema],
    settings: {
      type: settingsSchema,
      default: {},
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    averageCompletionTime: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
    },
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "surveyforms",
  },
);

// Auto-update status based on dates
surveyFormSchema.pre("save", function (next) {
  const now = new Date();

  if (this.publishDate && this.expiryDate) {
    if (now >= this.publishDate && now <= this.expiryDate && this.status !== "draft") {
      this.status = "published";
    } else if (now < this.publishDate && this.status !== "draft") {
      this.status = "scheduled";
    } else if (now > this.expiryDate) {
      this.status = "closed";
    }
  }

  next();
});

// Virtual for responses count
surveyFormSchema.virtual("responses", {
  ref: "SurveyResponse",
  localField: "_id",
  foreignField: "surveyId",
  count: true,
});

// Virtual for views count
surveyFormSchema.virtual("views").get(function () {
  return this.viewCount;
});

// Method to increment view count
surveyFormSchema.methods.incrementViews = function () {
  this.viewCount += 1;
  return this.save();
};

// Method to increment response count
surveyFormSchema.methods.incrementResponses = function () {
  this.submissionCount += 1;
  return this.save();
};

// Index for better performance
surveyFormSchema.index({ status: 1, publishDate: 1 });
surveyFormSchema.index({ authorId: 1, createdAt: -1 });
surveyFormSchema.index({ category: 1, status: 1 });
surveyFormSchema.index({ tags: 1 });
surveyFormSchema.index({ isActive: 1, status: 1 });

const SurveyForm = mongoose.model("SurveyForm", surveyFormSchema);
export default SurveyForm;
