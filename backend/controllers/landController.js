const db = require('../config/db');
const fs = require('fs');
const crypto = require('crypto');

// ======================================================
// REGISTER LAND
// ======================================================

const registerLand = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const {
      owner_name,
      owner_mobile,
      owner_count,

      land_id,

      district,
      state,
      taluk,
      village,
      pincode,
      address,

      survey_number,
      subdivision_number,

      registration_number,
      registration_date,

      area,
      area_unit,

      sale_amount,
      land_amount,

      land_type,
      usage_type,

      latitude,
      longitude,

      description,

      owner_names,
      wallet_address
    } = req.body;

    // ==================================================
    // REQUIRED FIELD VALIDATION
    // ==================================================

    if (
      !owner_name ||
      !owner_mobile ||
      !owner_count ||
      !land_id ||
      !district ||
      !state ||
      !taluk ||
      !village ||
      !survey_number ||
      !area ||
      !land_type ||
      !usage_type
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required land details'
      });
    }

    // ==================================================
    // OWNER COUNT
    // ==================================================

    const ownerCountNumber = Number(owner_count);

    if (
      !Number.isInteger(ownerCountNumber) ||
      ownerCountNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Number of owners must be at least 1'
      });
    }

    // ==================================================
    // AREA
    // ==================================================

    const areaNumber = Number(area);

    if (
      Number.isNaN(areaNumber) ||
      areaNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid land area'
      });
    }

    // ==================================================
    // SALE AMOUNT
    // ==================================================

    let saleAmountNumber = null;

    if (
      sale_amount !== undefined &&
      sale_amount !== null &&
      String(sale_amount).trim() !== ''
    ) {
      saleAmountNumber = Number(sale_amount);

      if (
        Number.isNaN(saleAmountNumber) ||
        saleAmountNumber < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid sale amount'
        });
      }
    }

    // ==================================================
    // LAND AMOUNT
    // ==================================================

    let landAmountNumber = null;

    if (
      land_amount !== undefined &&
      land_amount !== null &&
      String(land_amount).trim() !== ''
    ) {
      landAmountNumber = Number(land_amount);

      if (
        Number.isNaN(landAmountNumber) ||
        landAmountNumber < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid land amount'
        });
      }
    }

    // If land amount is not supplied,
    // use sale amount.
    if (
      landAmountNumber === null &&
      saleAmountNumber !== null
    ) {
      landAmountNumber = saleAmountNumber;
    }

    // ==================================================
    // PDF REQUIRED
    // ==================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Land document PDF is required'
      });
    }

    // ==================================================
    // CHECK SELLER
    // ==================================================

    const [sellerRows] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        mobile,
        role,
        verification_status,
        wallet_address
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [sellerId]
    );

    if (sellerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller account not found'
      });
    }

    const seller = sellerRows[0];

    // ==================================================
    // ROLE CHECK
    // ==================================================

    if (seller.role !== 'SELLER') {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can register land'
      });
    }

    // ==================================================
    // SELLER VERIFICATION
    // ==================================================

    if (seller.verification_status !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        message:
          'Your seller account must be verified by admin before registering land'
      });
    }

    // ==================================================
    // DUPLICATE LAND ID
    // ==================================================

    const normalizedLandId = String(land_id).trim();

    const [existingLand] = await db.execute(
      `
      SELECT id
      FROM lands
      WHERE land_id = ?
      LIMIT 1
      `,
      [normalizedLandId]
    );

    if (existingLand.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Land ID already exists'
      });
    }

    // ==================================================
    // CHECK UPLOADED PDF
    // ==================================================

    if (!fs.existsSync(req.file.path)) {
      return res.status(400).json({
        success: false,
        message: 'Uploaded land document could not be found'
      });
    }

    // ==================================================
    // CREATE SHA-256 HASH OF PDF
    // ==================================================

    const fileBuffer = fs.readFileSync(req.file.path);

    const documentHash = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    // ==================================================
    // DOCUMENT PATH
    // ==================================================

    const documentPath =
      `/uploads/land-documents/${req.file.filename}`;

    // ==================================================
    // OWNER NAMES
    // ==================================================

    let ownerNamesValue = null;

    if (
      owner_names !== undefined &&
      owner_names !== null &&
      String(owner_names).trim() !== ''
    ) {
      try {
        const parsedOwnerNames =
          typeof owner_names === 'string'
            ? JSON.parse(owner_names)
            : owner_names;

        ownerNamesValue =
          JSON.stringify(parsedOwnerNames);
      } catch (error) {
        ownerNamesValue =
          JSON.stringify([
            String(owner_names).trim()
          ]);
      }
    } else {
      ownerNamesValue =
        JSON.stringify([
          String(owner_name).trim()
        ]);
    }

    // ==================================================
    // WALLET ADDRESS
    // ==================================================

    const walletAddressValue =
      wallet_address &&
      String(wallet_address).trim() !== ''
        ? String(wallet_address).trim()
        : seller.wallet_address || null;

    // ==================================================
    // LATITUDE
    // ==================================================

    let latitudeValue = null;

    if (
      latitude !== undefined &&
      latitude !== null &&
      String(latitude).trim() !== ''
    ) {
      latitudeValue = Number(latitude);

      if (
        Number.isNaN(latitudeValue) ||
        latitudeValue < -90 ||
        latitudeValue > 90
      ) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid latitude'
        });
      }
    }

    // ==================================================
    // LONGITUDE
    // ==================================================

    let longitudeValue = null;

    if (
      longitude !== undefined &&
      longitude !== null &&
      String(longitude).trim() !== ''
    ) {
      longitudeValue = Number(longitude);

      if (
        Number.isNaN(longitudeValue) ||
        longitudeValue < -180 ||
        longitudeValue > 180
      ) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid longitude'
        });
      }
    }

    // ==================================================
    // INSERT LAND
    // ==================================================

    const [result] = await db.execute(
      `
      INSERT INTO lands
      (
        seller_id,
        owner_name,
        owner_mobile,
        owner_count,
        land_id,
        district,
        state,
        taluk,
        village,
        pincode,
        address,
        survey_number,
        subdivision_number,
        registration_number,
        registration_date,
        area,
        area_unit,
        sale_amount,
        land_amount,
        land_type,
        usage_type,
        latitude,
        longitude,
        description,
        document_hash,
        document_path,
        verification_status,
        current_owner_id,
        number_of_owners,
        owner_names,
        wallet_address
      )
      VALUES
      (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        'PENDING',
        ?,
        ?,
        ?,
        ?
      )
      `,
      [
        // 1. seller_id
        sellerId,

        // 2. owner_name
        String(owner_name).trim(),

        // 3. owner_mobile
        String(owner_mobile).trim(),

        // 4. owner_count
        ownerCountNumber,

        // 5. land_id
        normalizedLandId,

        // 6. district
        String(district).trim(),

        // 7. state
        String(state).trim(),

        // 8. taluk
        String(taluk).trim(),

        // 9. village
        String(village).trim(),

        // 10. pincode
        pincode
          ? String(pincode).trim()
          : null,

        // 11. address
        address
          ? String(address).trim()
          : null,

        // 12. survey_number
        String(survey_number).trim(),

        // 13. subdivision_number
        subdivision_number
          ? String(subdivision_number).trim()
          : null,

        // 14. registration_number
        registration_number
          ? String(registration_number).trim()
          : null,

        // 15. registration_date
        registration_date || null,

        // 16. area
        areaNumber,

        // 17. area_unit
        area_unit || 'ACRES',

        // 18. sale_amount
        saleAmountNumber,

        // 19. land_amount
        landAmountNumber,

        // 20. land_type
        String(land_type).trim(),

        // 21. usage_type
        String(usage_type).trim(),

        // 22. latitude
        latitudeValue,

        // 23. longitude
        longitudeValue,

        // 24. description
        description
          ? String(description).trim()
          : null,

        // 25. document_hash
        documentHash,

        // 26. document_path
        documentPath,

        // 27. verification_status
        // 'PENDING' is written directly in SQL

        // 28. current_owner_id
        sellerId,

        // 29. number_of_owners
        ownerCountNumber,

        // 30. owner_names
        ownerNamesValue,

        // 31. wallet_address
        walletAddressValue
      ]
    );

    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        'Land registered successfully. Waiting for admin verification.',

      land: {
        id: result.insertId,

        seller_id: sellerId,

        owner_name:
          String(owner_name).trim(),

        owner_mobile:
          String(owner_mobile).trim(),

        owner_count:
          ownerCountNumber,

        land_id:
          normalizedLandId,

        district:
          String(district).trim(),

        state:
          String(state).trim(),

        taluk:
          String(taluk).trim(),

        village:
          String(village).trim(),

        pincode:
          pincode
            ? String(pincode).trim()
            : null,

        address:
          address
            ? String(address).trim()
            : null,

        survey_number:
          String(survey_number).trim(),

        subdivision_number:
          subdivision_number || null,

        registration_number:
          registration_number || null,

        registration_date:
          registration_date || null,

        area:
          areaNumber,

        area_unit:
          area_unit || 'ACRES',

        sale_amount:
          saleAmountNumber,

        land_amount:
          landAmountNumber,

        land_type:
          String(land_type).trim(),

        usage_type:
          String(usage_type).trim(),

        latitude:
          latitudeValue,

        longitude:
          longitudeValue,

        description:
          description
            ? String(description).trim()
            : null,

        document_hash:
          documentHash,

        document_path:
          documentPath,

        verification_status:
          'PENDING',

        current_owner_id:
          sellerId,

        number_of_owners:
          ownerCountNumber,

        owner_names:
          ownerNamesValue,

        wallet_address:
          walletAddressValue
      }
    });

  } catch (error) {
    console.error(
      'Register land error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to register land',
      error: error.message
    });
  }
};


// ======================================================
// UPDATE BLOCKCHAIN RECORD
// ======================================================

const updateBlockchainRecord = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const {
      blockchain_land_id,
      blockchain_tx_hash,
      blockchain_block_number,
      blockchain_network
    } = req.body;

    if (!blockchain_tx_hash) {
      return res.status(400).json({
        success: false,
        message: "Blockchain transaction hash is required"
      });
    }

    const [lands] = await db.execute(
      `
      SELECT
        id,
        seller_id,
        land_id,
        verification_status
      FROM lands
      WHERE (id = ? OR land_id = ?)
      AND seller_id = ?
      LIMIT 1
      `,
      [id, id, sellerId]
    );

    if (lands.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Land record not found"
      });
    }

    const land = lands[0];

    if (land.verification_status !== "VERIFIED") {
      return res.status(400).json({
        success: false,
        message:
          "Land must be verified by admin before blockchain registration"
      });
    }

    const [result] = await db.execute(
      `
      UPDATE lands
      SET
        blockchain_land_id = ?,
        blockchain_tx_hash = ?,
        blockchain_block_number = ?,
        blockchain_network = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      AND seller_id = ?
      `,
      [
        blockchain_land_id || null,
        blockchain_tx_hash,
        blockchain_block_number || null,
        blockchain_network || "Ganache Local",
        land.id,
        sellerId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Blockchain record update failed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blockchain record saved successfully",
      blockchain: {
        land_id: blockchain_land_id || null,
        transaction_hash: blockchain_tx_hash,
        block_number: blockchain_block_number || null,
        network: blockchain_network || "Ganache Local"
      }
    });

  } catch (error) {
    console.error(
      "Update blockchain record error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save blockchain record",
      error: error.message
    });
  }
};

// ======================================================
// GET SELLER'S LANDS
// ======================================================

const getMyLands = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const [rows] = await db.execute(
      `
      SELECT
        id,
        seller_id,

        owner_name,
        owner_mobile,
        owner_count,

        land_id,

        district,
        state,
        taluk,
        village,

        survey_number,
        subdivision_number,

        registration_number,
        registration_date,

        area,
        area_unit,

        sale_amount,
        land_amount,

        land_type,
        usage_type,

        latitude,
        longitude,

        address,
        pincode,
        description,

        document_hash,
        document_path,

        verification_status,
        verified_by,
        verified_at,

        current_owner_id,
        number_of_owners,

        owner_names,
        wallet_address,

        blockchain_land_id,
        blockchain_tx_hash,
        blockchain_block_number,
        blockchain_network,

        created_at,
        updated_at

      FROM lands

      WHERE seller_id = ?

      ORDER BY created_at DESC
      `,
      [sellerId]
    );

    return res.status(200).json({
      success: true,
      lands: rows
    });

  } catch (error) {
    console.error(
      'Get my lands error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to load your lands',
      error: error.message
    });
  }
};


// ======================================================
// GET SINGLE LAND
// ======================================================

const getLandById = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const [rows] = await db.execute(
      `
      SELECT
        id,
        seller_id,

        owner_name,
        owner_mobile,
        owner_count,

        land_id,

        district,
        state,
        taluk,
        village,
        pincode,
        address,

        survey_number,
        subdivision_number,

        registration_number,
        registration_date,

        area,
        area_unit,

        sale_amount,
        land_amount,

        land_type,
        usage_type,

        latitude,
        longitude,

        description,

        document_hash,
        document_path,

        verification_status,
        verified_by,
        verified_at,

        current_owner_id,
        number_of_owners,

        owner_names,
        wallet_address,

        blockchain_land_id,
        blockchain_tx_hash,
        blockchain_block_number,
        blockchain_network,

        created_at,
        updated_at

      FROM lands

      WHERE (id = ? OR land_id = ?)
      AND seller_id = ?

      LIMIT 1
      `,
      [id, id, sellerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Land record not found"
      });
    }

    return res.status(200).json({
      success: true,
      land: rows[0]
    });

  } catch (error) {
    console.error(
      "Get land error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load land",
      error: error.message
    });
  }
};
// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  registerLand,
  updateBlockchainRecord,
  getMyLands,
  getLandById
};