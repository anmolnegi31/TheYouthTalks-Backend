import mongoose from "mongoose";

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

const questionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["short", "long", "mcq", "rating", "checkbox", "dropdown"],
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
    required: {
      type: Boolean,
      default: false,
    },
    options: [optionSchema], // For mcq, checkbox, dropdown
    maxRating: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
  },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    allowMultipleResponses: {
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
    thankYouMessage: {
      type: String,
      default: "Thank you for your response! We appreciate your time.",
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    dailyReports: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const formSchema = new mongoose.Schema(
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
    author: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (endDate) {
          return endDate > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    status: {
      type: String,
      enum: ["draft", "live", "upcoming", "closed"],
      default: "draft",
    },
    questions: [questionSchema],
    settings: {
      type: settingsSchema,
      default: {},
    },
    responseCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Auto-update status based on dates
formSchema.pre("save", function (next) {
  const now = new Date();

  if (this.startDate && this.endDate) {
    if (now >= this.startDate && now <= this.endDate) {
      this.status = "live";
    } else if (now < this.startDate) {
      this.status = "upcoming";
    } else if (now > this.endDate) {
      this.status = "closed";
    }
  }

  next();
});

// Virtual for responses count
formSchema.virtual("responses", {
  ref: "SurveyResponse",
  localField: "_id",
  foreignField: "surveyId",
  count: true,
});

// Virtual for views count
formSchema.virtual("views").get(function () {
  return this.viewCount;
});

// Method to increment view count
formSchema.methods.incrementViews = function () {
  this.viewCount += 1;
  return this.save();
};

// Method to increment response count
formSchema.methods.incrementResponses = function () {
  this.responseCount += 1;
  return this.save();
};

// Index for better performance
formSchema.index({ status: 1, startDate: 1 });
formSchema.index({ authorId: 1, createdAt: -1 });
formSchema.index({ category: 1, status: 1 });

const Form = mongoose.model("Form", formSchema);
export default Form;
