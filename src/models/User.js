import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Check if the model already exists
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Keep this for unique constraint
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
        },
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "user", "brand"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      marketingEmails: {
        type: Boolean,
        default: false,
      },
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      language: {
        type: String,
        default: "en",
      },
    },
    // Brand-specific fields (only populated for brand users)
    brandDetails: {
      companyName: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
      industry: {
        type: String,
        trim: true,
      },
      logo: {
        type: String,
        trim: true,
      },
      size: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      },
      // Add these fields
      companySize: {
        type: String,
        trim: true,
      },
      foundedYear: {
        type: Number,
      },
      location: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      contactPhone: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// Index for better performance (remove duplicate email index)
userSchema.index({ role: 1, isActive: 1 });

const User = mongoose.model("User", userSchema);
export default User;
