const express = require('express');

const {
  getSellerProfile,
  updateSellerProfile,
  updateSellerWallet,
  getSellerRequests,
  getSellerRequestById,
  rejectPurchaseRequest,
  approvePurchaseRequest
} = require('../controllers/sellerController');

const sellerAuth = require('../middleware/sellerAuth');

const router = express.Router();


// ======================================================
// SELLER PROFILE
// ======================================================

router.get(
  '/profile',
  sellerAuth,
  getSellerProfile
);

router.put(
  '/profile',
  sellerAuth,
  updateSellerProfile
);


// ======================================================
// BUYER REQUESTS
// ======================================================

// Get all buyer requests for logged-in seller
router.get(
  '/requests',
  sellerAuth,
  getSellerRequests
);


// Get one buyer request
router.get(
  '/requests/:requestId',
  sellerAuth,
  getSellerRequestById
);


// Reject buyer request
router.post(
  '/requests/:requestId/reject',
  sellerAuth,
  rejectPurchaseRequest
);


// Approve buyer request
router.post(
  '/requests/:requestId/approve',
  sellerAuth,
  approvePurchaseRequest
);

router.put(
  '/wallet',
  sellerAuth,
  updateSellerWallet
);

module.exports = router;