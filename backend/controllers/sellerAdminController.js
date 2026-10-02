const db = require('../config/db');


// GET PENDING / ALL SELLERS
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

    res.json({
      success: true,
      sellers: rows
    });

  } catch (error) {
    console.error('Get sellers error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load sellers'
    });
  }
};


// VERIFY / REJECT SELLER
const updateSellerVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'VERIFIED',
      'REJECTED'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status'
      });
    }

    const [result] = await db.execute(
      `
      UPDATE users
      SET verification_status = ?
      WHERE id = ?
      AND role = 'SELLER'
      `,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      message: `Seller ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Update seller verification error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update seller verification'
    });
  }
};


module.exports = {
  getSellers,
  updateSellerVerification
};