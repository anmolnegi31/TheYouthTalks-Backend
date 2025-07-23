import mongoose from "mongoose";

// Check if the model already exists
if (mongoose.models.Token) {
  delete mongoose.models.Token;
}

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true, // This already creates an index, so no need for explicit index below
    },
    hashedToken: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["access", "password_reset", "email_verification"],
      default: "access",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    deviceInfo: {
      type: String,
      trim: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
      enum: ["logout", "security", "expired", "manual", "password_change"],
    },
  },
  {
    timestamps: true,
    collection: "tokens",
  },
);

// Compound indexes for better performance
tokenSchema.index({ userId: 1, type: 1, isActive: 1 });
// Remove this line: tokenSchema.index({ token: 1 }); // Duplicate because of unique: true above
tokenSchema.index({ hashedToken: 1 });
tokenSchema.index({ isActive: 1 });

// TTL index for automatic expiration
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
tokenSchema.methods.revoke = function (reason = "manual") {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

tokenSchema.methods.updateLastUsed = function () {
  this.lastUsedAt = new Date();
  this.usageCount += 1;
  return this.save();
};

// Static methods
tokenSchema.statics.findActiveToken = function (hashedToken) {
  return this.findOne({
    hashedToken,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });
};

tokenSchema.statics.revokeAllUserTokens = function (userId, reason = "manual") {
  return this.updateMany(
    { userId, isActive: true },
    {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason,
    }
  );
};

tokenSchema.statics.cleanExpiredTokens = function () {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isActive: false, revokedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    ]
  });
};

const Token = mongoose.model("Token", tokenSchema);
export default Token;