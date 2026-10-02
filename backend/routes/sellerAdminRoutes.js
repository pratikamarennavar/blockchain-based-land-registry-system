const express = require('express');

const {
  getSellers,
  updateSellerVerification
} = require('../controllers/sellerAdminController');

const adminAuth = require('../middleware/authMiddleware');

const router = express.Router();


// Get all sellers
router.get(
  '/',
  adminAuth,
  getSellers
);


// Approve / Reject seller
router.put(
  '/:id/verification',
  adminAuth,
  updateSellerVerification
);


module.exports = router;