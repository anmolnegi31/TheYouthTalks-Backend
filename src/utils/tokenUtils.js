import jwt from "jsonwebtoken";
import crypto from "crypto";
import Token from "../models/token.js";

/**
 * Simplified Token Utilities for JWT management with MongoDB storage
 * No refresh tokens, issuer, or audience - just simple access tokens
 */

// Token configuration
const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "1h",
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key",
  PASSWORD_RESET_EXPIRY: process.env.PASSWORD_RESET_EXPIRY || "15m",
  EMAIL_VERIFICATION_EXPIRY: process.env.EMAIL_VERIFICATION_EXPIRY || "1h",
};

/**
 * Generate access token and store in database
 * @param {Object} payload - Token payload
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @param {Object} options - Token options
 * @returns {Object} Token data with database record
 */
export const generateAccessToken = async (payload, options = {}) => {
  try {
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      type: "access",
      iat: Math.floor(Date.now() / 1000),
    };

    const expiresIn = options.expiresIn || TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY;
    const tokenOptions = {
      expiresIn,
      subject: payload.userId.toString(),
    };

    const token = jwt.sign(tokenPayload, TOKEN_CONFIG.JWT_SECRET, tokenOptions);
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    
    // Calculate expiry date
    const expiryMs = parseExpiry(expiresIn);
    const expiresAt = new Date(Date.now() + expiryMs);

    // Store token in database
    const tokenRecord = new Token({
      userId: payload.userId,
      token: token.substring(token.length - 10), // Store last 10 chars for identification
      hashedToken,
      type: "access",
      expiresAt,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      deviceInfo: options.deviceInfo,
    });

    await tokenRecord.save();

    return {
      token,
      tokenId: tokenRecord._id,
      expiresAt: expiresAt.toISOString(),
      expiresIn: Math.floor(expiryMs / 1000),
    };
  } catch (error) {
    throw new Error(`Failed to generate access token: ${error.message}`);
  }
};

/**
 * Verify access token against database
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload with database info
 */
export const verifyAccessToken = async (token) => {
  try {
    if (!token) {
      throw new Error("No token provided");
    }

    // Verify JWT first
    const decoded = jwt.verify(token, TOKEN_CONFIG.JWT_SECRET);

    if (decoded.type !== undefined && decoded.type !== "access") {
      throw new Error("Invalid token type");
    }

    // Check token in database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const tokenRecord = await Token.findOne({
      hashedToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).populate("userId", "name email role isActive");

    if (!tokenRecord) {
      throw new Error("Token not found or expired");
    }

    if (!tokenRecord.userId || !tokenRecord.userId.isActive) {
      throw new Error("User not found or inactive");
    }

    // Update last used time
    await tokenRecord.updateLastUsed();

    return {
      ...decoded,
      tokenId: tokenRecord._id,
      user: tokenRecord.userId,
    };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Access token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid access token");
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Generate password reset token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Object} Reset token data
 */
export const generatePasswordResetToken = async (userId, email) => {
  try {
    // Revoke any existing password reset tokens
    await Token.updateMany(
      { userId, type: "password_reset", isActive: true },
      { isActive: false, revokedReason: "new_token_generated" }
    );

    const payload = {
      userId,
      email,
      type: "password_reset",
    };

    const token = jwt.sign(payload, TOKEN_CONFIG.JWT_SECRET, {
      expiresIn: TOKEN_CONFIG.PASSWORD_RESET_EXPIRY,
      subject: userId.toString(),
    });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expiryMs = parseExpiry(TOKEN_CONFIG.PASSWORD_RESET_EXPIRY);
    const expiresAt = new Date(Date.now() + expiryMs);

    // Store in database
    const tokenRecord = new Token({
      userId,
      token: token.substring(token.length - 10),
      hashedToken,
      type: "password_reset",
      expiresAt,
    });

    await tokenRecord.save();

    return {
      token,
      tokenId: tokenRecord._id,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to generate password reset token: ${error.message}`);
  }
};

/**
 * Generate email verification token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Object} Verification token data
 */
export const generateEmailVerificationToken = async (userId, email) => {
  try {
    // Revoke any existing email verification tokens
    await Token.updateMany(
      { userId, type: "email_verification", isActive: true },
      { isActive: false, revokedReason: "new_token_generated" }
    );

    const payload = {
      userId,
      email,
      type: "email_verification",
    };

    const token = jwt.sign(payload, TOKEN_CONFIG.JWT_SECRET, {
      expiresIn: TOKEN_CONFIG.EMAIL_VERIFICATION_EXPIRY,
      subject: userId.toString(),
    });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expiryMs = parseExpiry(TOKEN_CONFIG.EMAIL_VERIFICATION_EXPIRY);
    const expiresAt = new Date(Date.now() + expiryMs);

    // Store in database
    const tokenRecord = new Token({
      userId,
      token: token.substring(token.length - 10),
      hashedToken,
      type: "email_verification",
      expiresAt,
    });

    await tokenRecord.save();

    return {
      token,
      tokenId: tokenRecord._id,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    throw new Error(`Failed to generate email verification token: ${error.message}`);
  }
};

/**
 * Verify special purpose token (password reset, email verification)
 * @param {string} token - Token to verify
 * @param {string} expectedType - Expected token type
 * @returns {Object} Decoded token payload with database info
 */
export const verifySpecialToken = async (token, expectedType) => {
  try {
    const decoded = jwt.verify(token, TOKEN_CONFIG.JWT_SECRET);

    if (decoded.type !== expectedType) {
      throw new Error(`Expected token type ${expectedType}, got ${decoded.type}`);
    }

    // Check token in database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const tokenRecord = await Token.findOne({
      hashedToken,
      type: expectedType,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenRecord) {
      throw new Error(`${expectedType} token not found or expired`);
    }

    return {
      ...decoded,
      tokenId: tokenRecord._id,
    };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error(`${expectedType} token has expired`);
    } else if (error.name === "JsonWebTokenError") {
      throw new Error(`Invalid ${expectedType} token`);
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Revoke token by token string
 * @param {string} token - Token to revoke
 * @param {string} reason - Reason for revocation
 * @returns {boolean} Success status
 */
export const revokeToken = async (token, reason = "manual") => {
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const tokenRecord = await Token.findOne({ hashedToken, isActive: true });
    
    if (tokenRecord) {
      await tokenRecord.revoke(reason);
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(`Failed to revoke token: ${error.message}`);
  }
};

/**
 * Revoke all user tokens
 * @param {string} userId - User ID
 * @param {string} reason - Reason for revocation
 * @returns {number} Number of tokens revoked
 */
export const revokeAllUserTokens = async (userId, reason = "manual") => {
  try {
    const result = await Token.revokeAllUserTokens(userId, reason);
    return result.modifiedCount;
  } catch (error) {
    throw new Error(`Failed to revoke user tokens: ${error.message}`);
  }
};

/**
 * Get user active tokens
 * @param {string} userId - User ID
 * @param {string} type - Token type (optional)
 * @returns {Array} Array of active tokens
 */
export const getUserTokens = async (userId, type = null) => {
  try {
    const query = { userId, isActive: true, expiresAt: { $gt: new Date() } };
    if (type) query.type = type;

    return await Token.find(query)
      .select("type expiresAt lastUsedAt ipAddress userAgent deviceInfo createdAt")
      .sort({ lastUsedAt: -1 });
  } catch (error) {
    throw new Error(`Failed to get user tokens: ${error.message}`);
  }
};

/**
 * Clean expired and revoked tokens
 * @returns {number} Number of tokens cleaned
 */
export const cleanupTokens = async () => {
  try {
    const result = await Token.cleanExpiredTokens();
    return result.deletedCount;
  } catch (error) {
    throw new Error(`Failed to cleanup tokens: ${error.message}`);
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    console.log("Extracted token:", parts[1]);
    return parts[1];
  }

  return null;
};

/**
 * Check if token is expired (without database check)
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

/**
 * Decode token without verification
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error(`Failed to decode token: ${error.message}`);
  }
};

/**
 * Generate secure random token for non-JWT purposes
 * @param {number} length - Token length in bytes
 * @returns {string} Random hex token
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

// Helper function to parse expiry string to milliseconds
const parseExpiry = (expiryString) => {
  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = expiryString.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiryString}`);
  }

  const [, amount, unit] = match;
  return parseInt(amount) * units[unit];
};

// Export token configuration for use in other modules
export { TOKEN_CONFIG };

// Default export with all utilities
export default {
  generateAccessToken,
  verifyAccessToken,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  verifySpecialToken,
  revokeToken,
  revokeAllUserTokens,
  getUserTokens,
  cleanupTokens,
  extractTokenFromHeader,
  isTokenExpired,
  decodeToken,
  generateSecureToken,
  TOKEN_CONFIG,
};