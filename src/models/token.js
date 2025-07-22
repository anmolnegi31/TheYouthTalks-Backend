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
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    hashedToken: {
      type: String,
      required: true,
      index: true,
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
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
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
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Methods
tokenSchema.methods.revoke = function (reason = "manual") {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  return this.save();
};

tokenSchema.methods.updateLastUsed = function () {
  this.lastUsedAt = new Date();
  return this.save();
};

// Static methods
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