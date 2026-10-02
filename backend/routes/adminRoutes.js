const express = require("express");

const {
  adminLogin,
  getAdminProfile,
  getAdminDashboard,

  getSellers,
  verifySeller,
  rejectSeller,

  getBuyers,
  verifyBuyer,
  rejectBuyer,

  getLands,
  verifyLand,
  rejectLand,
  getLandDetails,

  getAllUsers,

  getBuyerRequests,
  approveBuyerRequest,
  rejectBuyerRequest,
} = require("../controllers/adminController");

const adminAuth = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// ======================================================
// ADMIN LOGIN
// ======================================================

router.post(
  "/login",
  adminLogin
);

// ======================================================
// ADMIN PROFILE
// ======================================================

router.get(
  "/profile",
  adminAuth,
  getAdminProfile
);

// ======================================================
// ADMIN DASHBOARD
// ======================================================

router.get(
  "/dashboard",
  adminAuth,
  getAdminDashboard
);

// ======================================================
// SELLER MANAGEMENT
// ======================================================

router.get(
  "/sellers",
  adminAuth,
  getSellers
);

router.put(
  "/sellers/:id/verify",
  adminAuth,
  verifySeller
);

router.put(
  "/sellers/:id/reject",
  adminAuth,
  rejectSeller
);

// ======================================================
// BUYER MANAGEMENT
// ======================================================

router.get(
  "/buyers",
  adminAuth,
  getBuyers
);

router.put(
  "/buyers/:id/verify",
  adminAuth,
  verifyBuyer
);

router.put(
  "/buyers/:id/reject",
  adminAuth,
  rejectBuyer
);

// ======================================================
// LAND MANAGEMENT
// ======================================================

router.get(
  "/lands",
  adminAuth,
  getLands
);

router.get(
  "/lands/:id",
  adminAuth,
  getLandDetails
);

router.put(
  "/lands/:id/verify",
  adminAuth,
  verifyLand
);

router.put(
  "/lands/:id/reject",
  adminAuth,
  rejectLand
);

// ======================================================
// ALL USERS
// ======================================================

router.get(
  "/users",
  adminAuth,
  getAllUsers
);

// ======================================================
// BUYER PURCHASE REQUESTS
// ======================================================

// Get all buyer requests
router.get(
  "/buyer-requests",
  adminAuth,
  getBuyerRequests
);

// Approve buyer request
router.put(
  "/buyer-requests/:id/approve",
  adminAuth,
  approveBuyerRequest
);

// Reject buyer request
router.put(
  "/buyer-requests/:id/reject",
  adminAuth,
  rejectBuyerRequest
);

// ======================================================

module.exports = router;