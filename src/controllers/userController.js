import User from "../models/User.js";
import { generateAccessToken, revokeToken, revokeAllUserTokens } from "../utils/tokenUtils.js";

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
        error: "MISSING_REQUIRED_FIELDS"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
        error: "USER_EXISTS"
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: role || "user",
    });

    await user.save();

    // Generate token using tokenUtils
    const tokenData = await generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      type: "access"
    }, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: tokenData.token,
      tokenExpiry: new Date(tokenData.expiresAt)
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// @desc    Register new brand account
// @route   POST /api/users/register-brand
// @access  Public
export const registerBrand = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      brandDetails = {} // Extract brandDetails object from request body with default empty object
    } = req.body;

    // Extract brand-specific fields from brandDetails
    const {
      website,
      industry,
      companySize,
      foundedYear,
      location,
      description,
      logo,
      companyName,
      size,
      contactPhone,
      address
    } = brandDetails;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
        error: "MISSING_REQUIRED_FIELDS"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists with this email",
        error: "USER_EXISTS"
      });
    }

    // Create brand user with proper brandDetails structure
    const brandUser = new User({
      name,
      email,
      password,
      role: "brand",
      phone,
      brandDetails: {
        companyName: companyName || name,
        website,
        industry,
        size: size || companySize,
        companySize,
        foundedYear,
        location,
        description,
        logo,
        contactPhone: contactPhone || phone,
        address
      },
      isActive: true,
      isEmailVerified: false
    });

    await brandUser.save();

    // Generate token using tokenUtils
    const tokenData = await generateAccessToken({
      userId: brandUser._id,
      email: brandUser.email,
      role: brandUser.role,
      type: "access"
    }, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: "Brand registered successfully",
      user: {
        id: brandUser._id,
        name: brandUser.name,
        email: brandUser.email,
        role: brandUser.role,
        brandDetails: {
          website: brandUser.brandDetails?.website,
          industry: brandUser.brandDetails?.industry,
          companySize: brandUser.brandDetails?.companySize,
          foundedYear: brandUser.brandDetails?.foundedYear,
          location: brandUser.brandDetails?.location,
          logo: brandUser.brandDetails?.logo
        }
      },
      token: tokenData.token,
      tokenExpiry: new Date(tokenData.expiresAt)
    });
  } catch (error) {
    console.error("Brand registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during brand registration",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
        error: "MISSING_CREDENTIALS"
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "INVALID_CREDENTIALS"
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "INVALID_CREDENTIALS"
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token using tokenUtils
    const tokenData = await generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      type: "access"
    }, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      token: tokenData.token,
      tokenExpiry: tokenData.expiresAt
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get brand profile with detailed information
// @route   GET /api/users/brand-profile
// @access  Private (Brand only)
export const getBrandProfile = async (req, res) => {
  try {
    // Check if user is a brand
    if (req.user.role !== 'brand') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only brand accounts can access this endpoint.",
        error: "NOT_A_BRAND"
      });
    }

    // Get detailed brand information from database
    const brandUser = await User.findById(req.userId)
      .select('-password')
      .select('-__v');

    if (!brandUser) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found",
        error: "PROFILE_NOT_FOUND"
      });
    }

    // Return formatted brand profile
    res.json({
      success: true,
      brand: {
        id: brandUser._id,
        name: brandUser.name,
        email: brandUser.email,
        role: brandUser.role,
        isActive: brandUser.isActive,
        isEmailVerified: brandUser.isEmailVerified,
        lastLogin: brandUser.lastLogin,
        brandDetails: brandUser.brandDetails,
        preferences: brandUser.preferences,
        createdAt: brandUser.createdAt,
        updatedAt: brandUser.updatedAt
      }
    });
  } catch (error) {
    console.error("Brand profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching brand profile",
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, preferences },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update brand profile with detailed information
// @route   PUT /api/users/brand-profile
// @access  Private (Brand only)
export const updateBrandProfile = async (req, res) => {
  try {
    // Check if user is a brand
    if (req.user.role !== 'brand') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only brand accounts can update brand profiles.",
        error: "NOT_A_BRAND"
      });
    }

    const { 
      name, 
      preferences,
      brandDetails = {} 
    } = req.body;

    // First, get the current brand profile to properly merge fields
    const currentBrand = await User.findById(req.userId);
    if (!currentBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found",
        error: "PROFILE_NOT_FOUND"
      });
    }

    // Create update object with proper merging of nested objects
    const updateData = {};
    
    // Update basic fields if provided
    if (name) updateData.name = name;
    
    // Handle preferences - merge with existing preferences
    if (preferences) {
      updateData.preferences = {
        ...currentBrand.preferences?.toObject() || {},
        ...preferences
      };
    }
    
    // Handle brandDetails - merge with existing brandDetails
    if (Object.keys(brandDetails).length > 0) {
      // Start with existing brand details - fix potential toObject() issues
      let updatedBrandDetails = {};
      
      // Safely convert mongoose document to plain object
      if (currentBrand.brandDetails) {
        updatedBrandDetails = typeof currentBrand.brandDetails.toObject === 'function' 
          ? currentBrand.brandDetails.toObject() 
          : currentBrand.brandDetails;
      }
      
      console.log("Original brand details:", updatedBrandDetails);
      console.log("Incoming brand details:", brandDetails);
      
      // Update individual fields from the request
      const {
        companyName,
        website,
        industry,
        size,
        companySize,
        foundedYear,
        location,
        description,
        logo,
        contactPhone,
        address
      } = brandDetails;
      
      // Update with direct assignment for clear visibility
      updatedBrandDetails.companyName = companyName || updatedBrandDetails.companyName;
      updatedBrandDetails.website = website || updatedBrandDetails.website;
      updatedBrandDetails.industry = industry || updatedBrandDetails.industry;
      updatedBrandDetails.size = size || updatedBrandDetails.size;
      updatedBrandDetails.companySize = companySize || updatedBrandDetails.companySize;
      updatedBrandDetails.foundedYear = foundedYear || updatedBrandDetails.foundedYear;
      updatedBrandDetails.location = location || updatedBrandDetails.location;
      updatedBrandDetails.description = description || updatedBrandDetails.description;
      updatedBrandDetails.logo = logo || updatedBrandDetails.logo;
      updatedBrandDetails.contactPhone = contactPhone || updatedBrandDetails.contactPhone;
      
      // Handle the nested address object
      if (address) {
        updatedBrandDetails.address = updatedBrandDetails.address || {};
        
        // Explicitly assign each address field
        if (address.street) updatedBrandDetails.address.street = address.street;
        if (address.city) updatedBrandDetails.address.city = address.city;
        if (address.state) updatedBrandDetails.address.state = address.state;
        if (address.country) updatedBrandDetails.address.country = address.country;
        if (address.zipCode) updatedBrandDetails.address.zipCode = address.zipCode;
      }
      
      console.log("Final brand details to save:", updatedBrandDetails);
      
      // Set the updated brand details
      updateData.brandDetails = updatedBrandDetails;
    }

    // Use findByIdAndUpdate with proper options
    const updatedBrand = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { 
        new: true, // Return the updated document
        runValidators: true // Run schema validation
      }
    ).select('-password -__v');

    if (!updatedBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand profile not found or could not be updated",
        error: "UPDATE_FAILED"
      });
    }

    // Add debug logging to see what's being saved
    console.log("Updated brand profile:", updatedBrand);

    res.json({
      success: true,
      message: "Brand profile updated successfully",
      brand: {
        id: updatedBrand._id,
        name: updatedBrand.name,
        email: updatedBrand.email,
        role: updatedBrand.role,
        isActive: updatedBrand.isActive,
        isEmailVerified: updatedBrand.isEmailVerified,
        lastLogin: updatedBrand.lastLogin,
        brandDetails: updatedBrand.brandDetails,
        preferences: updatedBrand.preferences,
        updatedAt: updatedBrand.updatedAt
      }
    });
  } catch (error) {
    console.error("Brand profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during brand profile update",
      error: error.message,
    });
  }
};

// @desc    Refresh token
// @route   POST /api/users/refresh-token
// @access  Private
export const refreshToken = async (req, res) => {
  try {
    // Generate new token using tokenUtils
    const tokenData = await generateAccessToken({
      userId: req.userId,
      email: req.user.email,
      role: req.user.role
    }, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: "Token refreshed successfully",
      token: tokenData.token,
      tokenExpiry: tokenData.expiresAt,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      }
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token refresh",
      error: error.message,
    });
  }
};

// @desc    Verify token
// @route   GET /api/users/verify-token
// @access  Private
export const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Token is valid",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token verification",
      error: error.message,
    });
  }
};

// @desc    Logout user (revoke current token)
// @route   POST /api/users/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // Revoke the current token
    const revoked = await revokeToken(req.token, "logout");

    if (revoked) {
      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Token not found or already revoked",
        error: "TOKEN_NOT_FOUND"
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message,
    });
  }
};

// @desc    Logout from all devices (revoke all user tokens)
// @route   POST /api/users/logout-all
// @access  Private
export const logoutAll = async (req, res) => {
  try {
    // Revoke all user tokens
    const revokedCount = await revokeAllUserTokens(req.userId, "logout_all");

    res.json({
      success: true,
      message: "Logged out from all devices successfully",
      data: {
        revokedTokens: revokedCount,
      },
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout from all devices",
      error: error.message,
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
        error: "MISSING_REQUIRED_FIELDS"
      });
    }

    // Get user with password
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
        error: "INVALID_CURRENT_PASSWORD"
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Revoke all tokens (force re-login on all devices)
    await revokeAllUserTokens(req.userId, "password_change");

    res.json({
      success: true,
      message: "Password changed successfully. Please login again on all devices.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password change",
      error: error.message,
    });
  }
};