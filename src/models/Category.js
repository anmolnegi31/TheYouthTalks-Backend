import mongoose from "mongoose";

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
  },
);

// Index for better performance
categorySchema.index({ isActive: 1, sortOrder: 1 });

// Method to get form count
categorySchema.methods.updateFormCount = async function () {
  const Form = mongoose.model("Form");
  this.formCount = await Form.countDocuments({
    category: this.name,
    isActive: true,
  });
  return this.save();
};

const Category = mongoose.model("Category", categorySchema);
export default Category;
