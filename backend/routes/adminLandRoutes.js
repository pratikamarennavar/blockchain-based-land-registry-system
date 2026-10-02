const express = require('express');

const {
  getLands,
  verifyLand,
  rejectLand
} = require('./controllers/adminLandController');

const adminAuth = require('../middleware/authMiddleware');

const router = express.Router();


// ======================================================
// GET ALL LANDS
// GET /api/admin/lands
// ======================================================

router.get(
  '/',
  adminAuth,
  getLands
);


// ======================================================
// VERIFY LAND
// PUT /api/admin/lands/:id/verify
// ======================================================

router.put(
  '/:id/verify',
  adminAuth,
  verifyLand
);


// ======================================================
// REJECT LAND
// PUT /api/admin/lands/:id/reject
// ======================================================

router.put(
  '/:id/reject',
  adminAuth,
  rejectLand
);


module.exports = router;