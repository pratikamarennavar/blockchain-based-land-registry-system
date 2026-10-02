

// ======================================================
// SELLER REGISTER
// ======================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../config/db');

// ======================================================
// PASSWORD VALIDATION
// ======================================================

const isStrongPassword = (password) => {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`';]/.test(password)
  );
};

// ======================================================
// SELLER REGISTER - MODULE 1
// ======================================================

const sellerRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      address,
      government_id,
      password,
      wallet_address
    } = req.body;

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (
      !name ||
      !email ||
      !mobile ||
      !address ||
      !government_id ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email, mobile, address, government ID and password are required'
      });
    }

    // --------------------------------------------------
    // NAME VALIDATION
    // --------------------------------------------------

    if (name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid full name'
      });
    }

    // --------------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------------

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address'
      });
    }

    // --------------------------------------------------
    // MOBILE VALIDATION
    // --------------------------------------------------

    const normalizedMobile = mobile.trim();

    if (!/^[6-9][0-9]{9}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message:
          'Enter a valid 10-digit Indian mobile number'
      });
    }

    // --------------------------------------------------
    // PASSWORD VALIDATION
    // --------------------------------------------------

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters and contain uppercase, lowercase, number and special character'
      });
    }

    // --------------------------------------------------
    // GOVERNMENT ID VALIDATION
    // --------------------------------------------------

    const normalizedGovernmentId =
      government_id.trim();

    if (normalizedGovernmentId.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid government ID'
      });
    }

    // --------------------------------------------------
    // ADDRESS VALIDATION
    // --------------------------------------------------

    const normalizedAddress = address.trim();

    if (normalizedAddress.length < 10) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a complete address'
      });
    }

    // --------------------------------------------------
    // WALLET VALIDATION
    // --------------------------------------------------

    let normalizedWallet = null;

    if (wallet_address) {
      normalizedWallet =
        wallet_address.trim();

      if (
        !/^0x[a-fA-F0-9]{40}$/.test(
          normalizedWallet
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid Ethereum wallet address'
        });
      }
    }

    // --------------------------------------------------
    // CHECK EXISTING EMAIL
    // --------------------------------------------------

    const [existingUsers] =
      await db.execute(
        `
        SELECT id
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [normalizedEmail]
      );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          'Email already registered'
      });
    }

    // --------------------------------------------------
    // CHECK EXISTING WALLET
    // --------------------------------------------------

    if (normalizedWallet) {
      const [existingWallet] =
        await db.execute(
          `
          SELECT id
          FROM users
          WHERE wallet_address = ?
          LIMIT 1
          `,
          [normalizedWallet]
        );

      if (existingWallet.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            'This wallet address is already registered'
        });
      }
    }

    // --------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------

    const passwordHash =
      await bcrypt.hash(password, 12);

    // --------------------------------------------------
    // CREATE SELLER
    // --------------------------------------------------

    const [result] =
      await db.execute(
        `
        INSERT INTO users
        (
          name,
          email,
          mobile,
          address,
          government_id,
          kyc_status,
          password_hash,
          role,
          verification_status,
          wallet_address
        )
        VALUES
        (?, ?, ?, ?, ?, 'PENDING', ?, 'SELLER', 'PENDING', ?)
        `,
        [
          name.trim(),
          normalizedEmail,
          normalizedMobile,
          normalizedAddress,
          normalizedGovernmentId,
          passwordHash,
          normalizedWallet
        ]
      );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        'Seller registration successful. KYC and seller verification are pending admin approval.',

      seller: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        mobile: normalizedMobile,
        address: normalizedAddress,
        government_id:
          normalizedGovernmentId,
        kyc_status: 'PENDING',
        role: 'SELLER',
        verification_status: 'PENDING',
        wallet_address:
          normalizedWallet
      }
    });

  } catch (error) {
    console.error(
      'Seller registration error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ======================================================
// SELLER LOGIN
// ======================================================

const sellerLogin = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Email and password are required'
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const [users] =
      await db.execute(
        `
        SELECT
          id,
          name,
          email,
          mobile,
          address,
          government_id,
          kyc_status,
          password_hash,
          role,
          verification_status,
          wallet_address
        FROM users
        WHERE email = ?
          AND role = 'SELLER'
        LIMIT 1
        `,
        [normalizedEmail]
      );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid seller credentials'
      });
    }

    const seller = users[0];

    const passwordMatch =
      await bcrypt.compare(
        password,
        seller.password_hash
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid seller credentials'
      });
    }

    // --------------------------------------------------
    // SELLER VERIFICATION
    // --------------------------------------------------

    if (
      seller.verification_status !==
      'VERIFIED'
    ) {
      return res.status(403).json({
        success: false,
        message:
          `Seller account is ${seller.verification_status}. Admin verification is required before login.`
      });
    }

    // --------------------------------------------------
    // JWT
    // --------------------------------------------------

    const token = jwt.sign(
      {
        id: seller.id,
        role: seller.role,
        email: seller.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return res.json({
      success: true,

      message:
        'Seller login successful',

      token,

      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        mobile: seller.mobile,
        address: seller.address,
        government_id:
          seller.government_id,
        kyc_status:
          seller.kyc_status,
        role: seller.role,
        verification_status:
          seller.verification_status,
        wallet_address:
          seller.wallet_address
      }
    });

  } catch (error) {
    console.error(
      'Seller login error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ======================================================
// BUYER REGISTER
// ======================================================

const buyerRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      wallet_address
    } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email, mobile and password are required'
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters and contain uppercase, lowercase, number and special character'
      });
    }

    if (!/^[6-9][0-9]{9}$/.test(mobile.trim())) {
      return res.status(400).json({
        success: false,
        message:
          'Enter a valid 10-digit Indian mobile number'
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const [existingUsers] =
      await db.execute(
        `
        SELECT id
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [normalizedEmail]
      );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          'Email already registered'
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const [result] =
      await db.execute(
        `
        INSERT INTO users
        (
          name,
          email,
          mobile,
          password_hash,
          role,
          verification_status,
          wallet_address
        )
        VALUES
        (?, ?, ?, ?, 'BUYER', 'PENDING', ?)
        `,
        [
          name.trim(),
          normalizedEmail,
          mobile.trim(),
          passwordHash,
          wallet_address || null
        ]
      );

    return res.status(201).json({
      success: true,

      message:
        'Buyer registration successful. Waiting for admin verification.',

      buyer: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        mobile: mobile.trim(),
        role: 'BUYER',
        verification_status:
          'PENDING',
        wallet_address:
          wallet_address || null
      }
    });

  } catch (error) {
    console.error(
      'Buyer registration error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ======================================================
// BUYER LOGIN
// ======================================================

const buyerLogin = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    // --------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // --------------------------------------------------
    // NORMALIZE EMAIL
    // --------------------------------------------------

    const normalizedEmail =
      email.trim().toLowerCase();

    // --------------------------------------------------
    // FIND BUYER
    // --------------------------------------------------

    const [users] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        mobile,
        address,
        government_id,
        kyc_status,
        password_hash,
        role,
        verification_status,
        wallet_address
      FROM users
      WHERE email = ?
        AND role = 'BUYER'
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid buyer credentials'
      });
    }

    const buyer = users[0];

    // --------------------------------------------------
    // PASSWORD CHECK
    // --------------------------------------------------

    const passwordMatch =
      await bcrypt.compare(
        password,
        buyer.password_hash
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid buyer credentials'
      });
    }

    // --------------------------------------------------
    // BUYER VERIFICATION
    // --------------------------------------------------

    if (
      buyer.verification_status !== 'VERIFIED'
    ) {
      return res.status(403).json({
        success: false,
        message:
          `Buyer account is ${buyer.verification_status}. Admin verification is required before login.`
      });
    }

    // --------------------------------------------------
    // JWT
    // --------------------------------------------------

    const token = jwt.sign(
      {
        id: buyer.id,
        role: buyer.role,
        email: buyer.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return res.json({
      success: true,
      message: 'Buyer login successful',
      token,

      buyer: {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email,
        mobile: buyer.mobile,
        address: buyer.address,
        government_id: buyer.government_id,
        kyc_status: buyer.kyc_status,
        role: buyer.role,
        verification_status:
          buyer.verification_status,
        wallet_address:
          buyer.wallet_address
      }
    });

  } catch (error) {

    console.error(
      'Buyer login error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ======================================================
// BUYER PROFILE - GET
// ======================================================

const getBuyerProfile = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const [users] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        mobile,
        address,
        government_id,
        kyc_status,
        role,
        verification_status,
        wallet_address
      FROM users
      WHERE id = ?
        AND role = 'BUYER'
      LIMIT 1
      `,
      [buyerId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Buyer profile not found'
      });
    }

    return res.json({
      success: true,
      buyer: users[0]
    });

  } catch (error) {
    console.error('Get buyer profile error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// ======================================================
// BUYER PROFILE - UPDATE
// ======================================================

const updateBuyerProfile = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const {
      name,
      mobile,
      address,
      wallet_address
    } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Name and mobile are required'
      });
    }

    const normalizedName = name.trim();
    const normalizedMobile = mobile.trim();
    const normalizedAddress = address
      ? address.trim()
      : '';

    // Validate mobile
    if (!/^[6-9][0-9]{9}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid 10-digit Indian mobile number'
      });
    }

    // Validate wallet if provided
    let normalizedWallet = null;

    if (wallet_address) {
      normalizedWallet = wallet_address.trim();

      if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedWallet)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Ethereum wallet address'
        });
      }

      // Make sure another user is not using this wallet
      const [existingWallet] = await db.execute(
        `
        SELECT id
        FROM users
        WHERE wallet_address = ?
          AND id != ?
        LIMIT 1
        `,
        [normalizedWallet, buyerId]
      );

      if (existingWallet.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This wallet address is already registered to another user'
        });
      }
    }

    await db.execute(
      `
      UPDATE users
      SET
        name = ?,
        mobile = ?,
        address = ?,
        wallet_address = ?
      WHERE id = ?
        AND role = 'BUYER'
      `,
      [
        normalizedName,
        normalizedMobile,
        normalizedAddress,
        normalizedWallet,
        buyerId
      ]
    );

    const [updatedUsers] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        mobile,
        address,
        government_id,
        kyc_status,
        role,
        verification_status,
        wallet_address
      FROM users
      WHERE id = ?
        AND role = 'BUYER'
      LIMIT 1
      `,
      [buyerId]
    );

    return res.json({
      success: true,
      message: 'Buyer profile updated successfully',
      buyer: updatedUsers[0]
    });

  } catch (error) {
    console.error('Update buyer profile error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  sellerRegister,
  sellerLogin,
  buyerRegister,
  buyerLogin,
  updateBuyerProfile,
  getBuyerProfile
};