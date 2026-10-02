const express = require('express');

const router = express.Router();

const {
  sellerRegister,
  sellerLogin,
  buyerRegister,
  buyerLogin,
  getBuyerProfile,
  updateBuyerProfile
} = require('../controllers/userController');

const buyerAuth = require('../middleware/buyerAuth');

// ======================================================
// SELLER
// ======================================================

router.post(
  '/seller/register',
  sellerRegister
);

router.post(
  '/seller/login',
  sellerLogin
);

// ======================================================
// BUYER
// ======================================================

router.post(
  '/buyer/register',
  buyerRegister
);

router.post(
  '/buyer/login',
  buyerLogin
);

router.get(
  '/buyer/profile',
  buyerAuth,
  getBuyerProfile
);

router.put(
  '/buyer/profile',
  buyerAuth,
  updateBuyerProfile
);

module.exports = router;