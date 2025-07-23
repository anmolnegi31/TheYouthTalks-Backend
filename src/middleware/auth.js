import {
  verifyAccessToken,
  extractTokenFromHeader
} from "../utils/tokenUtils.js";

/**
 * Authentication middleware - requires valid access token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    // console.log("Auth header received:", authHeader);
    
    const token = extractTokenFromHeader(authHeader);
    // console.log("Extracted token:", token ? `${token.substring(0, 10)}...` : "null");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
        error: "NO_TOKEN",
      });
    }

    // Verify token against database
    const decoded = await verifyAccessToken(token);

    // Add user data to request
    req.user = decoded.user;
    req.userId = decoded.user._id;
    req.token = token;
    req.tokenId = decoded.tokenId;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    if (error.message.includes("expired")) {
      return res.status(401).json({
        success: false,
        message: "Access token has expired.",
        error: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token.",
      error: "INVALID_TOKEN",
    });
  }
};

/**
 * Optional authentication middleware
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = await verifyAccessToken(token);
        req.user = decoded.user;
        req.userId = decoded.user._id;
        req.token = token;
        req.tokenId = decoded.tokenId;
      } catch (error) {
        // Silently ignore token errors in optional auth
        console.log("Optional auth token invalid:", error.message);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication required.",
        error: "AUTHENTICATION_REQUIRED",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${roles.join(", ")}`,
        error: "INSUFFICIENT_PERMISSIONS",
        required: roles,
        current: req.user.role,
      });
    }

    next();
  };
};

export const isAdmin = authorize("admin");

export const isUser = authorize("user");

export const isBrand = authorize("brand");

export default {
  authenticate,
  optionalAuth,
  authorize,
};