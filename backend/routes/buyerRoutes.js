const express = require("express");

const buyerAuth = require("../middleware/buyerAuth");

const {
  getAvailableProperties,
  getPropertyDetails,
  sendPurchaseRequest,
  getMyRequests,
  getMyProperties
} = require("../controllers/buyerController");

const router = express.Router();


// ==========================================================
// BROWSE VERIFIED PROPERTIES
// GET /api/buyer/properties
// ==========================================================

router.get(
  "/properties",
  buyerAuth,
  getAvailableProperties
);


// ==========================================================
// VIEW PROPERTY DETAILS
// GET /api/buyer/properties/:landId
// ==========================================================

router.get(
  "/properties/:landId",
  buyerAuth,
  getPropertyDetails
);


// ==========================================================
// SEND PURCHASE REQUEST
// POST /api/buyer/properties/:landId/request
// ==========================================================

router.post(
  "/properties/:landId/request",
  buyerAuth,
  sendPurchaseRequest
);


// ==========================================================
// MY PURCHASE REQUESTS
// GET /api/buyer/requests
// ==========================================================

router.get(
  "/requests",
  buyerAuth,
  getMyRequests
);


// ==========================================================
// MY PROPERTIES
// GET /api/buyer/my-properties
// ==========================================================

router.get(
  "/my-properties",
  buyerAuth,
  getMyProperties
);


module.exports = router;