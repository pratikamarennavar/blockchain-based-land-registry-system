const db = require('../config/db');

// ======================================================
// GET ALL LAND RECORDS FOR ADMIN
// ======================================================

const getLands = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        l.id,
        l.seller_id,
        l.land_id,
        l.district,
        l.taluk,
        l.village,
        l.survey_number,
        l.subdivision_number,
        l.area,
        l.area_unit,
        l.land_type,
        l.usage_type,
        l.latitude,
        l.longitude,
        l.document_hash,
        l.verification_status,
        l.verified_by,
        l.verified_at,
        l.current_owner_id,
        l.created_at,
        l.updated_at,

        seller.name AS seller_name,
        seller.email AS seller_email,
        seller.mobile AS seller_mobile,
        seller.wallet_address AS seller_wallet_address,

        owner.name AS owner_name,
        owner.email AS owner_email,
        owner.mobile AS owner_mobile,
        owner.wallet_address AS owner_wallet_address

      FROM lands l

      LEFT JOIN users seller
        ON l.seller_id = seller.id

      LEFT JOIN users owner
        ON l.current_owner_id = owner.id

      ORDER BY l.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: rows.length,
      lands: rows
    });

  } catch (error) {
    console.error('Get admin lands error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load land records',
      error: error.message
    });
  }
};


// ======================================================
// VERIFY LAND
// ======================================================

const verifyLand = async (req, res) => {
  try {
    const { id } = req.params;

    const adminId = req.admin?.id || req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    const [lands] = await db.execute(
      `
      SELECT
        id,
        land_id,
        seller_id,
        verification_status
      FROM lands
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (lands.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Land record not found'
      });
    }

    const land = lands[0];

    if (land.verification_status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'Land is already verified'
      });
    }

    const [result] = await db.execute(
      `
      UPDATE lands
      SET
        verification_status = 'VERIFIED',
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [adminId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Land verification failed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Land verified successfully'
    });

  } catch (error) {
    console.error('Verify land error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to verify land',
      error: error.message
    });
  }
};


// ======================================================
// REJECT LAND
// ======================================================

const rejectLand = async (req, res) => {
  try {
    const { id } = req.params;

    const adminId = req.admin?.id || req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    const [lands] = await db.execute(
      `
      SELECT
        id,
        land_id,
        verification_status
      FROM lands
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (lands.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Land record not found'
      });
    }

    const [result] = await db.execute(
      `
      UPDATE lands
      SET
        verification_status = 'REJECTED',
        verified_by = ?,
        verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [adminId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Land rejection failed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Land rejected successfully'
    });

  } catch (error) {
    console.error('Reject land error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to reject land',
      error: error.message
    });
  }
};


module.exports = {
  getLands,
  verifyLand,
  rejectLand
};