import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/database.js";
import seedDatabase from "./src/config/seedData.js";

// Import routes - using correct file names
import user from "./src/routes/user.js";
import surveyForm from "./src/routes/surveyForm.js";
import surveyResponse from "./src/routes/surveyResponse.js";
import category from "./src/routes/category.js";

dotenv.config();

const app = express();

// Connect to MongoDB
await connectDB();

// Seed database with initial data (only runs if collections are empty)
await seedDatabase();

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:8080",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Youth Talks API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/users", user);
app.use("/api/forms", surveyForm);
app.use("/api/responses", surveyResponse);
app.use("/api/categories", category);

// Legacy endpoints for backward compatibility
app.get("/api/ping", (req, res) => {
  res.json({
    message: "Hello from Youth Talks Express server!",
    timestamp: new Date().toISOString(),
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // MongoDB validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
      error: "VALIDATION_ERROR"
    });
  }

  // MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      error: "DUPLICATE_KEY_ERROR"
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: "INVALID_TOKEN"
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token has expired",
      error: "TOKEN_EXPIRED",
      expiredAt: err.expiredAt
    });
  }

  // Cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
      error: "INVALID_ID"
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "INTERNAL_SERVER_ERROR",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: "ROUTE_NOT_FOUND"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
