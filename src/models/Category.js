import mongoose from "mongoose";

// Check if the model already exists
if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    icon: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, // Hex color validation
    },
    slug: {
      type: String,
      unique: true, // Keep this for unique constraint
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    formCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "categories",
  },
);

// Generate slug before saving
categorySchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
  next();
});

// Index for better performance (remove duplicate slug index)
categorySchema.index({ isActive: 1, sortOrder: 1 });

// Method to get form count
categorySchema.methods.updateFormCount = async function () {
  const SurveyForm = mongoose.model("SurveyForm");
  this.formCount = await SurveyForm.countDocuments({
    category: this.name,
    isActive: true,
  });
  return this.save();
};

const Category = mongoose.model("Category", categorySchema);
export default Category;
