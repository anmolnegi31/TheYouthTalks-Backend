import express from "express";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import {
  submitResponse,
  getResponsesBySurvey,
  getResponseById,
  getMyResponses,
  getResponseAnalytics,
  exportResponses,
} from "../controllers/responseController.js";

const router = express.Router();

// @desc    Submit survey response
// @route   POST /api/responses
// @access  Public with optional authentication
router.post("/", optionalAuth, submitResponse);

// @desc    Get user's own responses
// @route   GET /api/responses/my-responses
// @access  Private (requires authentication)
router.get("/my-responses", authenticate, getMyResponses);

// @desc    Get responses for a survey
// @route   GET /api/responses/survey/:surveyId
// @access  Private (requires form ownership or admin)
router.get("/survey/:surveyId", authenticate, getResponsesBySurvey);

// @desc    Get response analytics for a survey
// @route   GET /api/responses/analytics/:surveyId
// @access  Private (requires form ownership or admin)
router.get("/analytics/:surveyId", authenticate, getResponseAnalytics);

// @desc    Export responses as CSV
// @route   GET /api/responses/export/:surveyId
// @access  Private (requires form ownership or admin)
router.get("/export/:surveyId", authenticate, exportResponses);

// @desc    Get single response details
// @route   GET /api/responses/:id
// @access  Private (requires form ownership, response ownership, or admin)
router.get("/:id", authenticate, getResponseById);

export default router;
