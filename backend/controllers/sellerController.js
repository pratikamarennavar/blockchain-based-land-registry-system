const db = require('../config/db');

// ======================================================
// GET LOGGED-IN SELLER PROFILE
// ======================================================

const getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const [rows] = await db.execute(
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
        wallet_address,
        created_at
      FROM users
      WHERE id = ?
        AND role = 'SELLER'
      LIMIT 1
      `,
      [sellerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    return res.json({
      success: true,
      seller: rows[0]
    });

  } catch (error) {
    console.error('Get seller profile error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load seller profile'
    });
  }
};


// ======================================================
// UPDATE SELLER PROFILE
// ======================================================

const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const {
      name,
      mobile,
      address
    } = req.body;

    if (!name || !mobile || !address) {
      return res.status(400).json({
        success: false,
        message: 'Name, mobile and address are required'
      });
    }

    const normalizedName = name.trim();
    const normalizedMobile = mobile.trim();
    const normalizedAddress = address.trim();

    if (normalizedName.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid full name'
      });
    }

    if (!/^[6-9][0-9]{9}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid 10-digit Indian mobile number'
      });
    }

    if (normalizedAddress.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a complete address'
      });
    }

    const [result] = await db.execute(
      `
      UPDATE users
      SET
        name = ?,
        mobile = ?,
        address = ?
      WHERE id = ?
        AND role = 'SELLER'
      `,
      [
        normalizedName,
        normalizedMobile,
        normalizedAddress,
        sellerId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const [rows] = await db.execute(
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
        wallet_address,
        created_at
      FROM users
      WHERE id = ?
        AND role = 'SELLER'
      LIMIT 1
      `,
      [sellerId]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      seller: rows[0]
    });

  } catch (error) {
    console.error('Update seller profile error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update seller profile'
    });
  }
};


// ======================================================
// GET SELLER'S BUYER REQUESTS
// ======================================================

const getSellerRequests = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const [rows] = await db.execute(
      `
      SELECT
        br.id AS request_id,
        br.land_id AS database_land_id,
        br.buyer_id,
        br.seller_id,
        br.request_status,
        br.requested_at,
        br.updated_at,

        l.land_id AS public_land_id,
        l.owner_name,
        l.owner_mobile,
        l.district,
        l.state,
        l.taluk,
        l.village,
        l.survey_number,
        l.subdivision_number,
        l.area,
        l.area_unit,
        l.land_type,
        l.usage_type,
        l.sale_amount,
        l.land_amount,
        l.address,
        l.pincode,
        l.description,
        l.document_hash,
        l.document_path,
        l.verification_status,

        l.blockchain_land_id,
        l.blockchain_tx_hash,
        l.blockchain_block_number,
        l.blockchain_network,
        l.wallet_address AS seller_wallet_address,
        l.current_owner_id,

        b.name AS buyer_name,
        b.email AS buyer_email,
        b.mobile AS buyer_mobile,
        b.address AS buyer_address,
        b.verification_status AS buyer_verification_status,
        b.wallet_address AS buyer_wallet_address

      FROM buyer_requests br

      INNER JOIN lands l
        ON l.id = br.land_id

      INNER JOIN users b
        ON b.id = br.buyer_id

      WHERE br.seller_id = ?

      ORDER BY
        CASE
          WHEN br.request_status = 'PENDING' THEN 0
          WHEN br.request_status = 'APPROVED' THEN 1
          WHEN br.request_status = 'REJECTED' THEN 2
          WHEN br.request_status = 'CANCELLED' THEN 3
          ELSE 4
        END,
        br.requested_at DESC
      `,
      [sellerId]
    );

    return res.json({
      success: true,
      requests: rows
    });

  } catch (error) {
    console.error('Get seller buyer requests error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load buyer requests'
    });
  }
};


// ======================================================
// GET SINGLE SELLER BUYER REQUEST
// ======================================================

const getSellerRequestById = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { requestId } = req.params;

    const [rows] = await db.execute(
      `
      SELECT
        br.id AS request_id,
        br.land_id AS database_land_id,
        br.buyer_id,
        br.seller_id,
        br.request_status,
        br.requested_at,
        br.updated_at,

        l.land_id AS public_land_id,
        l.owner_name,
        l.owner_mobile,
        l.district,
        l.state,
        l.taluk,
        l.village,
        l.survey_number,
        l.subdivision_number,
        l.area,
        l.area_unit,
        l.land_type,
        l.usage_type,
        l.sale_amount,
        l.land_amount,
        l.address,
        l.pincode,
        l.description,
        l.document_hash,
        l.document_path,
        l.verification_status,

        l.blockchain_land_id,
        l.blockchain_tx_hash,
        l.blockchain_block_number,
        l.blockchain_network,
        l.wallet_address AS seller_wallet_address,
        l.current_owner_id,

        b.name AS buyer_name,
        b.email AS buyer_email,
        b.mobile AS buyer_mobile,
        b.address AS buyer_address,
        b.verification_status AS buyer_verification_status,
        b.wallet_address AS buyer_wallet_address

      FROM buyer_requests br

      INNER JOIN lands l
        ON l.id = br.land_id

      INNER JOIN users b
        ON b.id = br.buyer_id

      WHERE br.id = ?
        AND br.seller_id = ?

      LIMIT 1
      `,
      [requestId, sellerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Buyer request not found'
      });
    }

    return res.json({
      success: true,
      request: rows[0]
    });

  } catch (error) {
    console.error('Get seller buyer request error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load buyer request'
    });
  }
};


// ======================================================
// REJECT BUYER REQUEST
// ======================================================

const rejectPurchaseRequest = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { requestId } = req.params;

    const [rows] = await db.execute(
      `
      SELECT
        br.id,
        br.land_id,
        br.buyer_id,
        br.seller_id,
        br.request_status,
        l.current_owner_id
      FROM buyer_requests br

      INNER JOIN lands l
        ON l.id = br.land_id

      WHERE br.id = ?
        AND br.seller_id = ?

      LIMIT 1
      `,
      [requestId, sellerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Buyer request not found'
      });
    }

    const request = rows[0];

    if (request.request_status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.request_status.toLowerCase()}`
      });
    }

    if (
      request.current_owner_id !== null &&
      Number(request.current_owner_id) !== Number(sellerId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are no longer the current owner of this land'
      });
    }

    const [result] = await db.execute(
      `
      UPDATE buyer_requests
      SET request_status = 'REJECTED'
      WHERE id = ?
        AND seller_id = ?
        AND request_status = 'PENDING'
      `,
      [requestId, sellerId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Unable to reject this request'
      });
    }

    return res.json({
      success: true,
      message: 'Buyer request rejected successfully'
    });

  } catch (error) {
    console.error('Reject buyer request error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to reject buyer request'
    });
  }
};


// ======================================================
// APPROVE BUYER REQUEST
// ======================================================
//
// IMPORTANT:
// The frontend should first execute the blockchain
// approveSale() transaction through MetaMask.
//
// Only after that transaction succeeds and wait() returns,
// the frontend should call this backend endpoint with the
// successful transaction hash.
//
// This endpoint then updates MySQL ownership data.
// ======================================================

const approvePurchaseRequest = async (req, res) => {
  let connection;

  try {
    const sellerId = req.user.id;
    const { requestId } = req.params;

    const blockchainTxHash =
      req.body.blockchainTxHash ||
      req.body.blockchain_tx_hash ||
      '';

    const blockchainBlockNumber =
      req.body.blockchainBlockNumber ||
      req.body.blockchain_block_number ||
      null;

    const blockchainNetwork =
      req.body.blockchainNetwork ||
      req.body.blockchain_network ||
      null;

    if (!blockchainTxHash) {
      return res.status(400).json({
        success: false,
        message: 'Successful blockchain transaction hash is required'
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    // --------------------------------------------------
    // LOCK REQUEST ROW
    // --------------------------------------------------

    const [requestRows] = await connection.execute(
      `
      SELECT
        br.id,
        br.land_id,
        br.buyer_id,
        br.seller_id,
        br.request_status,

        l.current_owner_id,
        l.owner_name,
        l.wallet_address AS land_wallet_address,
        l.blockchain_land_id

      FROM buyer_requests br

      INNER JOIN lands l
        ON l.id = br.land_id

      WHERE br.id = ?
        AND br.seller_id = ?

      LIMIT 1

      FOR UPDATE
      `,
      [requestId, sellerId]
    );

    if (requestRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Buyer request not found'
      });
    }

    const request = requestRows[0];

    // --------------------------------------------------
    // REQUEST MUST BE PENDING
    // --------------------------------------------------

    if (request.request_status !== 'PENDING') {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `Request is already ${request.request_status.toLowerCase()}`
      });
    }

    // --------------------------------------------------
    // SELLER MUST STILL BE CURRENT OWNER
    // --------------------------------------------------

    if (
      request.current_owner_id !== null &&
      Number(request.current_owner_id) !== Number(sellerId)
    ) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message: 'You are no longer the current owner of this land'
      });
    }

    // --------------------------------------------------
    // GET BUYER
    // --------------------------------------------------

    const [buyerRows] = await connection.execute(
      `
      SELECT
        id,
        name,
        email,
        mobile,
        address,
        verification_status,
        wallet_address
      FROM users
      WHERE id = ?
        AND role = 'BUYER'
      LIMIT 1
      `,
      [request.buyer_id]
    );

    if (buyerRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    const buyer = buyerRows[0];

    // --------------------------------------------------
    // BUYER MUST BE VERIFIED
    // --------------------------------------------------

    if (buyer.verification_status !== 'VERIFIED') {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: 'Buyer is not verified'
      });
    }

    // --------------------------------------------------
    // UPDATE BUYER REQUEST
    // --------------------------------------------------

    await connection.execute(
      `
      UPDATE buyer_requests
      SET request_status = 'APPROVED'
      WHERE id = ?
        AND seller_id = ?
        AND request_status = 'PENDING'
      `,
      [requestId, sellerId]
    );

    // --------------------------------------------------
    // REJECT OTHER PENDING REQUESTS FOR SAME LAND
    // --------------------------------------------------

    await connection.execute(
      `
      UPDATE buyer_requests
      SET request_status = 'REJECTED'
      WHERE land_id = ?
        AND id <> ?
        AND request_status = 'PENDING'
      `,
      [request.land_id, requestId]
    );

    // --------------------------------------------------
    // TRANSFER CURRENT OWNERSHIP
    // --------------------------------------------------

    await connection.execute(
      `
      UPDATE lands
      SET
        current_owner_id = ?,
        owner_name = ?,
        wallet_address = ?,
        blockchain_tx_hash = ?,
        blockchain_block_number = ?,
        blockchain_network = ?
      WHERE id = ?
      `,
      [
        buyer.id,
        buyer.name,
        buyer.wallet_address || null,
        blockchainTxHash,
        blockchainBlockNumber,
        blockchainNetwork,
        request.land_id
      ]
    );

    await connection.commit();

    // --------------------------------------------------
    // RETURN UPDATED DATA
    // --------------------------------------------------

    const [updatedRows] = await db.execute(
      `
      SELECT
        br.id AS request_id,
        br.land_id AS database_land_id,
        br.buyer_id,
        br.seller_id,
        br.request_status,
        br.requested_at,
        br.updated_at,

        l.land_id AS public_land_id,
        l.owner_name,
        l.current_owner_id,
        l.wallet_address,
        l.blockchain_land_id,
        l.blockchain_tx_hash,
        l.blockchain_block_number,
        l.blockchain_network,

        b.name AS buyer_name,
        b.email AS buyer_email,
        b.wallet_address AS buyer_wallet_address

      FROM buyer_requests br

      INNER JOIN lands l
        ON l.id = br.land_id

      INNER JOIN users b
        ON b.id = br.buyer_id

      WHERE br.id = ?

      LIMIT 1
      `,
      [requestId]
    );

    return res.json({
      success: true,
      message: 'Buyer request approved and land ownership updated successfully',
      request: updatedRows[0] || null
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }

    console.error('Approve buyer request error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to approve buyer request'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
// ======================================================
// SAVE SELLER BLOCKCHAIN WALLET
// ======================================================

const updateSellerWallet = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required"
      });
    }

    const normalizedWallet = wallet_address.trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedWallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet address"
      });
    }

    const [existingRows] = await db.execute(
      `
      SELECT id
      FROM users
      WHERE wallet_address = ?
        AND id <> ?
      LIMIT 1
      `,
      [normalizedWallet, sellerId]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This wallet address is already assigned to another account"
      });
    }

    const [result] = await db.execute(
      `
      UPDATE users
      SET wallet_address = ?
      WHERE id = ?
        AND role = 'SELLER'
      `,
      [normalizedWallet, sellerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    const [rows] = await db.execute(
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
        wallet_address,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [sellerId]
    );

    return res.json({
      success: true,
      message: "Seller wallet saved successfully",
      seller: rows[0]
    });

  } catch (error) {
    console.error("Update seller wallet error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save seller wallet"
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  getSellerProfile,
  updateSellerProfile,
  updateSellerWallet,

  getSellerRequests,
  getSellerRequestById,
  rejectPurchaseRequest,
  approvePurchaseRequest
};