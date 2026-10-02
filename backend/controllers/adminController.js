const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/adminModel");
const db = require("../config/db");

// ======================================================
// ADMIN LOGIN
// ======================================================

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findByEmail(email);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    if (admin.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    return res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// ADMIN PROFILE
// ======================================================

const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (admin.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    return res.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    console.error("Get admin profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ======================================================
// ADMIN DASHBOARD
// ======================================================

const getAdminDashboard = async (req, res) => {
  try {
    const [userStats] = await db.execute(`
      SELECT
        COUNT(*) AS totalUsers,
        SUM(role = 'SELLER') AS totalSellers,
        SUM(role = 'BUYER') AS totalBuyers
      FROM users
    `);

    const [landStats] = await db.execute(`
      SELECT
        COUNT(*) AS totalLands,
        SUM(verification_status = 'PENDING') AS pendingLands,
        SUM(verification_status = 'VERIFIED') AS verifiedLands,
        SUM(verification_status = 'REJECTED') AS rejectedLands
      FROM lands
    `);

    const [sellerStats] = await db.execute(`
      SELECT
        SUM(verification_status = 'PENDING') AS pendingSellers,
        SUM(verification_status = 'VERIFIED') AS verifiedSellers,
        SUM(verification_status = 'REJECTED') AS rejectedSellers
      FROM users
      WHERE role = 'SELLER'
    `);

    const [buyerStats] = await db.execute(`
      SELECT
        SUM(verification_status = 'PENDING') AS pendingBuyers,
        SUM(verification_status = 'VERIFIED') AS verifiedBuyers,
        SUM(verification_status = 'REJECTED') AS rejectedBuyers
      FROM users
      WHERE role = 'BUYER'
    `);

    const [requestStats] = await db.execute(`
      SELECT
        COUNT(*) AS totalRequests,
        SUM(request_status = 'PENDING') AS pendingRequests,
        SUM(request_status = 'APPROVED') AS approvedRequests,
        SUM(request_status = 'REJECTED') AS rejectedRequests,
        SUM(request_status = 'CANCELLED') AS cancelledRequests
      FROM buyer_requests
    `);

    return res.json({
      success: true,

      statistics: {
        totalUsers: Number(userStats[0].totalUsers || 0),
        totalSellers: Number(userStats[0].totalSellers || 0),
        totalBuyers: Number(userStats[0].totalBuyers || 0),

        totalLands: Number(landStats[0].totalLands || 0),
        pendingLands: Number(landStats[0].pendingLands || 0),
        verifiedLands: Number(landStats[0].verifiedLands || 0),
        rejectedLands: Number(landStats[0].rejectedLands || 0),

        pendingSellers: Number(sellerStats[0].pendingSellers || 0),
        verifiedSellers: Number(sellerStats[0].verifiedSellers || 0),
        rejectedSellers: Number(sellerStats[0].rejectedSellers || 0),

        pendingBuyers: Number(buyerStats[0].pendingBuyers || 0),
        verifiedBuyers: Number(buyerStats[0].verifiedBuyers || 0),
        rejectedBuyers: Number(buyerStats[0].rejectedBuyers || 0),

        totalRequests: Number(requestStats[0].totalRequests || 0),
        pendingRequests: Number(requestStats[0].pendingRequests || 0),
        approvedRequests: Number(requestStats[0].approvedRequests || 0),
        rejectedRequests: Number(requestStats[0].rejectedRequests || 0),
        cancelledRequests: Number(requestStats[0].cancelledRequests || 0),
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
};

// ======================================================
// SELLERS - GET
// ======================================================

const getSellers = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id,
        name,
        email,
        mobile,
        role,
        verification_status,
        wallet_address,
        created_at
      FROM users
      WHERE role = 'SELLER'
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      sellers: rows,
    });
  } catch (error) {
    console.error("Get sellers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load sellers",
    });
  }
};

// ======================================================
// SELLER - VERIFY
// ======================================================

const verifySeller = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `
      UPDATE users
      SET
        verification_status = 'VERIFIED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND role = 'SELLER'
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    return res.json({
      success: true,
      message: "Seller verified successfully",
    });
  } catch (error) {
    console.error("Verify seller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify seller",
    });
  }
};

// ======================================================
// SELLER - REJECT
// ======================================================

const rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `
      UPDATE users
      SET
        verification_status = 'REJECTED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND role = 'SELLER'
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    return res.json({
      success: true,
      message: "Seller rejected successfully",
    });
  } catch (error) {
    console.error("Reject seller error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject seller",
    });
  }
};

// ======================================================
// BUYERS - GET
// ======================================================

const getBuyers = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        id,
        name,
        email,
        mobile,
        role,
        verification_status,
        wallet_address,
        created_at
      FROM users
      WHERE role = 'BUYER'
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      buyers: rows,
    });
  } catch (error) {
    console.error("Get buyers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load buyers",
    });
  }
};

// ======================================================
// BUYER - VERIFY
// ======================================================

const verifyBuyer = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `
      UPDATE users
      SET
        verification_status = 'VERIFIED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND role = 'BUYER'
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Buyer not found",
      });
    }

    return res.json({
      success: true,
      message: "Buyer verified successfully",
    });
  } catch (error) {
    console.error("Verify buyer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify buyer",
    });
  }
};

// ======================================================
// BUYER - REJECT
// ======================================================

const rejectBuyer = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      `
      UPDATE users
      SET
        verification_status = 'REJECTED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND role = 'BUYER'
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Buyer not found",
      });
    }

    return res.json({
      success: true,
      message: "Buyer rejected successfully",
    });
  } catch (error) {
    console.error("Reject buyer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject buyer",
    });
  }
};

// ======================================================
// LANDS - GET ALL
// ======================================================

const getLands = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        l.id,
        l.land_id,
        l.seller_id,

        l.state,
        l.district,
        l.taluk,
        l.village,
        l.pincode,
        l.address,

        l.survey_number,
        l.subdivision_number,
        l.registration_number,
        l.registration_date,
        l.area,
        l.area_unit,
        l.land_type,

        l.usage_type AS \`usage\`,
        l.usage_type,

        l.land_amount,
        l.sale_amount,
        l.sale_amount AS expected_sale_amount,

        l.latitude,
        l.longitude,

        l.owner_count,
        l.owner_names,
        l.owner_name,
        l.current_owner_id,
        l.wallet_address,

        owner_user.mobile AS primary_owner_mobile,
        owner_user.email AS primary_owner_email,
        owner_user.verification_status AS primary_owner_verification_status,

        l.document_path,
        l.document_hash,

        l.verification_status,
        l.verified_by,
        l.verified_at,

        l.blockchain_land_id,
        l.blockchain_tx_hash,
        l.blockchain_block_number AS block_number,
        l.blockchain_block_number,
        l.blockchain_network,

        NULL AS previous_owner,
        NULL AS new_owner,

        l.created_at,
        l.updated_at,

        u.name AS seller_name,
        u.email AS seller_email,
        u.mobile AS seller_mobile,
        u.address AS seller_address,
        u.government_id AS seller_government_id,
        u.verification_status AS seller_verification_status,
        u.wallet_address AS seller_wallet_address

      FROM lands l

      LEFT JOIN users u
        ON l.seller_id = u.id

      LEFT JOIN users owner_user
        ON l.current_owner_id = owner_user.id

      ORDER BY l.created_at DESC
    `);

    const formattedLands = rows.map((land) => {
      let ownerNames = [];

      if (land.owner_names) {
        try {
          ownerNames =
            typeof land.owner_names === "string"
              ? JSON.parse(land.owner_names)
              : land.owner_names;

          if (!Array.isArray(ownerNames)) {
            ownerNames = [ownerNames];
          }
        } catch {
          ownerNames = [land.owner_names];
        }
      }

      let documentUrl = null;

      if (land.document_path) {
        const cleanPath = String(land.document_path)
          .replace(/\\/g, "/")
          .replace(/^\/+/, "");

        documentUrl =
          `${req.protocol}://${req.get("host")}/${cleanPath}`;
      }

      return {
        ...land,

        owner_names: ownerNames,

        document_url: documentUrl,

        transaction_hash:
          land.blockchain_tx_hash || null,

        block_number:
          land.blockchain_block_number || null,

        blockchain_status:
          land.blockchain_tx_hash
            ? "RECORDED"
            : "NOT_RECORDED",
      };
    });

    return res.json({
      success: true,
      lands: formattedLands,
    });
  } catch (error) {
    console.error("Get lands error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load land records",
      error: error.message,
    });
  }
};

// ======================================================
// LAND - VERIFY
// ======================================================

const verifyLand = async (req, res) => {
  try {
    const { id } = req.params;

    const adminId =
      req.admin?.id ||
      req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    const [result] = await db.execute(
      `
      UPDATE lands
      SET
        verification_status = 'VERIFIED',
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND verification_status = 'PENDING'
      `,
      [adminId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Pending land record not found",
      });
    }

    return res.json({
      success: true,
      message: "Land verified successfully",
    });
  } catch (error) {
    console.error("Verify land error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify land",
      error: error.message,
    });
  }
};

// ======================================================
// LAND - REJECT
// ======================================================

const rejectLand = async (req, res) => {
  try {
    const { id } = req.params;

    const adminId =
      req.admin?.id ||
      req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    const [result] = await db.execute(
      `
      UPDATE lands
      SET
        verification_status = 'REJECTED',
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND verification_status = 'PENDING'
      `,
      [adminId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Pending land record not found",
      });
    }

    return res.json({
      success: true,
      message: "Land rejected successfully",
    });
  } catch (error) {
    console.error("Reject land error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject land",
      error: error.message,
    });
  }
};

// ======================================================
// LAND - GET DETAILS
// ======================================================

const getLandDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        l.id,
        l.land_id,
        l.seller_id,

        l.state,
        l.district,
        l.taluk,
        l.village,
        l.pincode,
        l.address,

        l.survey_number,
        l.subdivision_number,
        l.registration_number,
        l.registration_date,
        l.area,
        l.area_unit,
        l.land_type,

        l.usage_type AS \`usage\`,
        l.usage_type,

        l.land_amount,
        l.sale_amount,
        l.sale_amount AS expected_sale_amount,

        l.latitude,
        l.longitude,

        l.owner_count,
        l.owner_names,
        l.owner_name,
        l.current_owner_id,
        l.wallet_address,

        owner_user.mobile AS primary_owner_mobile,
        owner_user.email AS primary_owner_email,
        owner_user.verification_status AS primary_owner_verification_status,

        l.document_path,
        l.document_hash,

        l.verification_status,
        l.verified_by,
        l.verified_at,

        l.blockchain_land_id,
        l.blockchain_tx_hash,
        l.blockchain_block_number AS block_number,
        l.blockchain_block_number,
        l.blockchain_network,

        NULL AS previous_owner,
        NULL AS new_owner,

        l.created_at,
        l.updated_at,

        u.name AS seller_name,
        u.email AS seller_email,
        u.mobile AS seller_mobile,
        u.address AS seller_address,
        u.government_id AS seller_government_id,
        u.verification_status AS seller_verification_status,
        u.wallet_address AS seller_wallet_address

      FROM lands l

      LEFT JOIN users u
        ON l.seller_id = u.id

      LEFT JOIN users owner_user
        ON l.current_owner_id = owner_user.id

      WHERE l.id = ?

      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Land record not found",
      });
    }

    const land = rows[0];

    if (land.owner_names) {
      try {
        land.owner_names =
          typeof land.owner_names === "string"
            ? JSON.parse(land.owner_names)
            : land.owner_names;

        if (!Array.isArray(land.owner_names)) {
          land.owner_names = [land.owner_names];
        }
      } catch {
        land.owner_names = [land.owner_names];
      }
    } else {
      land.owner_names = [];
    }

    if (land.document_path) {
      const cleanPath = String(land.document_path)
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

      land.document_url =
        `${req.protocol}://${req.get("host")}/${cleanPath}`;
    } else {
      land.document_url = null;
    }

    land.transaction_hash =
      land.blockchain_tx_hash || null;

    land.block_number =
      land.blockchain_block_number || null;

    land.blockchain_status =
      land.blockchain_tx_hash
        ? "RECORDED"
        : "NOT_RECORDED";

    return res.json({
      success: true,
      land,
    });
  } catch (error) {
    console.error("GET LAND DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch land details",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL USERS
// ======================================================

const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT
        id,
        name,
        email,
        mobile,
        role,
        verification_status,
        wallet_address,
        created_at,
        updated_at
      FROM users
      WHERE UPPER(role) IN ('SELLER', 'BUYER')
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// ======================================================
// GET BUYER REQUESTS
// ======================================================

const getBuyerRequests = async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT

        br.id,
        br.land_id,
        br.buyer_id,
        br.seller_id,
        br.request_status,
        br.requested_at,
        br.updated_at,

        l.land_id AS land_code,
        l.owner_name,
        l.district,
        l.state,
        l.taluk,
        l.village,
        l.survey_number,
        l.subdivision_number,
        l.area,
        l.area_unit,
        l.sale_amount,
        l.land_type,
        l.usage_type,
        l.verification_status AS land_verification_status,

        buyer.name AS buyer_name,
        buyer.email AS buyer_email,
        buyer.mobile AS buyer_mobile,
        buyer.wallet_address AS buyer_wallet_address,
        buyer.verification_status AS buyer_verification_status,

        seller.name AS seller_name,
        seller.email AS seller_email,
        seller.mobile AS seller_mobile,
        seller.wallet_address AS seller_wallet_address,
        seller.verification_status AS seller_verification_status

      FROM buyer_requests br

      LEFT JOIN lands l
        ON br.land_id = l.id

      LEFT JOIN users buyer
        ON br.buyer_id = buyer.id

      LEFT JOIN users seller
        ON br.seller_id = seller.id

      ORDER BY br.requested_at DESC
    `);

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get buyer requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch buyer requests",
      error: error.message,
    });
  }
};

// ======================================================
// APPROVE BUYER REQUEST
// ======================================================
//
// IMPORTANT:
// This approves the request in the ADMIN workflow only.
// It does NOT transfer land ownership.
// Seller approval + blockchain transaction will happen later.
// ======================================================

const approveBuyerRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Request ID is required",
      });
    }

    // --------------------------------------------------
    // GET REQUEST + RELATED USERS + LAND
    // --------------------------------------------------

    const [requests] = await db.query(
      `
      SELECT
        br.id,
        br.land_id,
        br.buyer_id,
        br.seller_id,
        br.request_status,

        l.land_id AS land_code,
        l.current_owner_id,
        l.verification_status AS land_verification_status,

        buyer.verification_status AS buyer_verification_status,

        seller.verification_status AS seller_verification_status

      FROM buyer_requests br

      LEFT JOIN lands l
        ON br.land_id = l.id

      LEFT JOIN users buyer
        ON br.buyer_id = buyer.id

      LEFT JOIN users seller
        ON br.seller_id = seller.id

      WHERE br.id = ?

      LIMIT 1
      `,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Buyer request not found",
      });
    }

    const request = requests[0];

    // --------------------------------------------------
    // ONLY PENDING REQUEST CAN BE APPROVED
    // --------------------------------------------------

    if (
      String(request.request_status).toUpperCase() !==
      "PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `This request is already ${request.request_status}`,
      });
    }

    // --------------------------------------------------
    // LAND MUST BE VERIFIED
    // --------------------------------------------------

    if (
      String(request.land_verification_status).toUpperCase() !==
      "VERIFIED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The property must be verified before approving the purchase request",
      });
    }

    // --------------------------------------------------
    // BUYER MUST BE VERIFIED
    // --------------------------------------------------

    if (
      String(request.buyer_verification_status).toUpperCase() !==
      "VERIFIED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The buyer must be verified before approving the purchase request",
      });
    }

    // --------------------------------------------------
    // SELLER MUST BE VERIFIED
    // --------------------------------------------------

    if (
      String(request.seller_verification_status).toUpperCase() !==
      "VERIFIED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The seller must be verified before approving the purchase request",
      });
    }

    // --------------------------------------------------
    // CURRENT OWNER MUST MATCH SELLER
    // --------------------------------------------------

    if (
      Number(request.current_owner_id) !==
      Number(request.seller_id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The request seller is not the current owner of this property",
      });
    }

    // --------------------------------------------------
    // CHECK IF ANOTHER REQUEST WAS ALREADY APPROVED
    // --------------------------------------------------

    const [approvedRequests] = await db.query(
      `
      SELECT id
      FROM buyer_requests
      WHERE land_id = ?
        AND request_status = 'APPROVED'
        AND id <> ?
      LIMIT 1
      `,
      [request.land_id, id]
    );

    if (approvedRequests.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Another purchase request for this property has already been approved",
      });
    }

    // --------------------------------------------------
    // APPROVE REQUEST
    // --------------------------------------------------

    const [result] = await db.execute(
      `
      UPDATE buyer_requests
      SET
        request_status = 'APPROVED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND request_status = 'PENDING'
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Request could not be approved because its status has changed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Buyer purchase request approved successfully",
      request: {
        id: request.id,
        land_id: request.land_id,
        land_code: request.land_code,
        buyer_id: request.buyer_id,
        seller_id: request.seller_id,
        request_status: "APPROVED",
      },
    });
  } catch (error) {
    console.error(
      "Approve buyer request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to approve buyer request",
      error: error.message,
    });
  }
};

// ======================================================
// REJECT BUYER REQUEST
// ======================================================

const rejectBuyerRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Request ID is required",
      });
    }

    const [requests] = await db.query(
      `
      SELECT
        br.id,
        br.request_status
      FROM buyer_requests br
      WHERE br.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Buyer request not found",
      });
    }

    const request = requests[0];

    if (
      String(request.request_status).toUpperCase() !==
      "PENDING"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `This request is already ${request.request_status}`,
      });
    }

    const [result] = await db.execute(
      `
      UPDATE buyer_requests
      SET
        request_status = 'REJECTED',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND request_status = 'PENDING'
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Request could not be rejected because its status has changed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Buyer purchase request rejected successfully",
      request: {
        id: Number(id),
        request_status: "REJECTED",
      },
    });
  } catch (error) {
    console.error(
      "Reject buyer request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to reject buyer request",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
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
};