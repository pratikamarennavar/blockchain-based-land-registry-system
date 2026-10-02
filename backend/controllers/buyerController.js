const db = require("../config/db");

// ==========================================================
// GET AVAILABLE PROPERTIES
// GET /api/buyer/properties
// ==========================================================

const getAvailableProperties = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const [properties] = await db.query(
      `
      SELECT
        l.id,
        l.land_id,

        l.seller_id,
        l.current_owner_id,

        l.owner_name,
        l.owner_mobile,
        l.owner_count,

        l.district,
        l.state,
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

        l.sale_amount,
        l.land_amount,

        l.land_type,
        l.usage_type,

        l.latitude,
        l.longitude,

        l.document_hash,
        l.document_path,

        l.verification_status,

        l.description,
        l.owner_names,
        l.wallet_address,

        l.blockchain_land_id,
        l.blockchain_tx_hash,
        l.blockchain_block_number,
        l.blockchain_network,

        l.created_at,
        l.updated_at,

        owner_user.name AS current_owner_name,
        owner_user.email AS current_owner_email,
        owner_user.mobile AS current_owner_mobile,

        seller_user.name AS seller_name,
        seller_user.email AS seller_email,
        seller_user.mobile AS seller_mobile

      FROM lands l

      LEFT JOIN users owner_user
        ON l.current_owner_id = owner_user.id

      LEFT JOIN users seller_user
        ON l.seller_id = seller_user.id

      WHERE
        l.verification_status = 'VERIFIED'

        AND (
          l.current_owner_id IS NULL
          OR l.current_owner_id <> ?
        )

        AND NOT EXISTS (
          SELECT 1
          FROM buyer_requests br
          WHERE br.land_id = l.id
            AND br.request_status = 'APPROVED'
        )

      ORDER BY l.created_at DESC
      `,
      [buyerId]
    );

    const formattedProperties = properties.map((property) => {
      let ownerNames = property.owner_names;

      if (typeof ownerNames === "string") {
        try {
          ownerNames = JSON.parse(ownerNames);
        } catch (error) {
          ownerNames = [];
        }
      }

      if (!Array.isArray(ownerNames)) {
        ownerNames = [];
      }

      return {
        ...property,

        usage: property.usage_type,

        expected_sale_amount:
          property.sale_amount ??
          property.land_amount ??
          null,

        seller: {
          id: property.seller_id,
          name: property.seller_name,
          email: property.seller_email,
          mobile: property.seller_mobile
        },

        current_owner: {
          id: property.current_owner_id,

          name:
            property.current_owner_name ||
            property.owner_name ||
            null,

          email:
            property.current_owner_email ||
            null,

          mobile:
            property.current_owner_mobile ||
            property.owner_mobile ||
            null
        },

        owner_names: ownerNames,

        document_url: property.document_path
          ? `/uploads/land-documents/${property.document_path
              .split("/")
              .pop()}`
          : null,

        blockchain: {
          land_id: property.blockchain_land_id,

          transaction_hash:
            property.blockchain_tx_hash,

          block_number:
            property.blockchain_block_number,

          network:
            property.blockchain_network
        }
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedProperties.length,
      properties: formattedProperties
    });

  } catch (error) {
    console.error(
      "Get buyer properties error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load available properties",
      error: error.message
    });
  }
};


// ==========================================================
// GET PROPERTY DETAILS
// GET /api/buyer/properties/:landId
//
// IMPORTANT:
// Accepts BOTH:
// /api/buyer/properties/3
// /api/buyer/properties/LAND-KA-BGM-0002
// ==========================================================

const getPropertyDetails = async (req, res) => {
  try {
    const { landId } = req.params;
    const buyerId = req.user.id;

    console.log("====================================");
    console.log("GET PROPERTY DETAILS");
    console.log("Received landId:", landId);
    console.log("Buyer ID:", buyerId);
    console.log("====================================");

    if (!buyerId) {
      return res.status(401).json({
        success: false,
        message: "Buyer information not found"
      });
    }

    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "Land ID is required"
      });
    }

    let properties;

    // ------------------------------------------------------
    // NUMERIC ID
    // Example:
    // /buyer/properties/3
    //
    // Search l.id
    // ------------------------------------------------------

    if (/^\d+$/.test(String(landId))) {

      console.log(
        "Numeric ID detected. Searching lands.id:",
        Number(landId)
      );

      [properties] = await db.query(
        `
        SELECT
          l.*,

          owner_user.name AS current_owner_name,
          owner_user.email AS current_owner_email,
          owner_user.mobile AS current_owner_mobile,

          seller_user.name AS seller_name,
          seller_user.email AS seller_email,
          seller_user.mobile AS seller_mobile,

          br.id AS request_id,
          br.request_status AS buyer_request_status,
          br.requested_at AS buyer_request_requested_at,
          br.updated_at AS buyer_request_updated_at

        FROM lands l

        LEFT JOIN users owner_user
          ON l.current_owner_id = owner_user.id

        LEFT JOIN users seller_user
          ON l.seller_id = seller_user.id

        LEFT JOIN buyer_requests br
          ON br.land_id = l.id
          AND br.buyer_id = ?
          AND br.id = (
            SELECT MAX(br2.id)
            FROM buyer_requests br2
            WHERE br2.land_id = l.id
              AND br2.buyer_id = ?
          )

        WHERE
          l.id = ?
          AND l.verification_status = 'VERIFIED'

        LIMIT 1
        `,
        [
          buyerId,
          buyerId,
          Number(landId)
        ]
      );

    } else {

      // ----------------------------------------------------
      // PUBLIC LAND ID
      // Example:
      // /buyer/properties/LAND-KA-BGM-0002
      //
      // Search l.land_id
      // ----------------------------------------------------

      console.log(
        "Public Land ID detected. Searching lands.land_id:",
        landId
      );

      [properties] = await db.query(
        `
        SELECT
          l.*,

          owner_user.name AS current_owner_name,
          owner_user.email AS current_owner_email,
          owner_user.mobile AS current_owner_mobile,

          seller_user.name AS seller_name,
          seller_user.email AS seller_email,
          seller_user.mobile AS seller_mobile,

          br.id AS request_id,
          br.request_status AS buyer_request_status,
          br.requested_at AS buyer_request_requested_at,
          br.updated_at AS buyer_request_updated_at

        FROM lands l

        LEFT JOIN users owner_user
          ON l.current_owner_id = owner_user.id

        LEFT JOIN users seller_user
          ON l.seller_id = seller_user.id

        LEFT JOIN buyer_requests br
          ON br.land_id = l.id
          AND br.buyer_id = ?
          AND br.id = (
            SELECT MAX(br2.id)
            FROM buyer_requests br2
            WHERE br2.land_id = l.id
              AND br2.buyer_id = ?
          )

        WHERE
          l.land_id = ?
          AND l.verification_status = 'VERIFIED'

        LIMIT 1
        `,
        [
          buyerId,
          buyerId,
          landId
        ]
      );
    }

    // ------------------------------------------------------
    // PROPERTY NOT FOUND
    // ------------------------------------------------------

    if (!properties || properties.length === 0) {

      console.error(
        "PROPERTY NOT FOUND FOR LAND ID:",
        landId
      );

      return res.status(404).json({
        success: false,
        message: "Property not found or not verified"
      });
    }

    const property = properties[0];

    console.log("====================================");
    console.log("PROPERTY FOUND");
    console.log("MySQL ID:", property.id);
    console.log("PUBLIC LAND ID:", property.land_id);
    console.log(
      "Verification:",
      property.verification_status
    );
    console.log("====================================");

    // ------------------------------------------------------
    // OWNER NAMES
    // ------------------------------------------------------

    let ownerNames = property.owner_names;

    if (typeof ownerNames === "string") {
      try {
        ownerNames = JSON.parse(
          ownerNames
        );
      } catch (error) {
        ownerNames = [];
      }
    }

    if (!Array.isArray(ownerNames)) {
      ownerNames = [];
    }

    // ------------------------------------------------------
    // CHECK CURRENT BUYER OWNERSHIP
    // ------------------------------------------------------

    const isCurrentBuyerOwner =
      Number(property.current_owner_id) ===
      Number(buyerId);

    // ------------------------------------------------------
    // BUYER REQUEST STATUS
    // ------------------------------------------------------

    const buyerRequestStatus =
      property.buyer_request_status ||
      null;

    // ------------------------------------------------------
    // DOCUMENT URL
    // ------------------------------------------------------

    const documentUrl =
      property.document_path
        ? `/uploads/land-documents/${property.document_path
            .split("/")
            .pop()}`
        : null;

    // ------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------

    return res.status(200).json({

      success: true,

      property: {

        ...property,

        // --------------------------------------------------
        // PUBLIC LAND ID
        // --------------------------------------------------

        land_id:
          property.land_id,

        // --------------------------------------------------
        // USAGE
        // --------------------------------------------------

        usage:
          property.usage_type,

        // --------------------------------------------------
        // SALE AMOUNT
        // --------------------------------------------------

        expected_sale_amount:
          property.sale_amount ??
          property.land_amount ??
          null,

        // --------------------------------------------------
        // OWNER NAMES
        // --------------------------------------------------

        owner_names:
          ownerNames,

        // --------------------------------------------------
        // BUYER OWNERSHIP
        // --------------------------------------------------

        is_current_buyer_owner:
          isCurrentBuyerOwner,

        // --------------------------------------------------
        // BUYER REQUEST
        // --------------------------------------------------

        buyer_request: {

          request_id:
            property.request_id ||
            null,

          status:
            buyerRequestStatus,

          requested_at:
            property.buyer_request_requested_at ||
            null,

          updated_at:
            property.buyer_request_updated_at ||
            null
        },

        request_id:
          property.request_id ||
          null,

        request_status:
          buyerRequestStatus,

        // --------------------------------------------------
        // CURRENT OWNER
        // --------------------------------------------------

        current_owner: {

          id:
            property.current_owner_id,

          name:
            property.current_owner_name ||
            property.owner_name ||
            null,

          email:
            property.current_owner_email ||
            null,

          mobile:
            property.current_owner_mobile ||
            property.owner_mobile ||
            null
        },

        // --------------------------------------------------
        // ORIGINAL SELLER
        // --------------------------------------------------

        seller: {

          id:
            property.seller_id,

          name:
            property.seller_name ||
            property.owner_name ||
            null,

          email:
            property.seller_email ||
            null,

          mobile:
            property.seller_mobile ||
            property.owner_mobile ||
            null
        },

        // --------------------------------------------------
        // DOCUMENT
        // --------------------------------------------------

        document_url:
          documentUrl,

        // --------------------------------------------------
        // BLOCKCHAIN
        // --------------------------------------------------

        blockchain: {

          land_id:
            property.blockchain_land_id,

          transaction_hash:
            property.blockchain_tx_hash,

          block_number:
            property.blockchain_block_number,

          network:
            property.blockchain_network
        }
      }
    });

  } catch (error) {

    console.error(
      "Get property details error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to load property details",

      error:
        error.message
    });
  }
};


// ==========================================================
// SEND PURCHASE REQUEST
// POST /api/buyer/properties/:landId/request
//
// Accepts BOTH:
// /buyer/properties/3/request
// /buyer/properties/LAND-KA-BGM-0002/request
// ==========================================================

const sendPurchaseRequest = async (req, res) => {
  try {

    const { landId } = req.params;
    const buyerId = req.user.id;

    if (!buyerId) {
      return res.status(401).json({
        success: false,
        message: "Buyer information not found"
      });
    }

    if (!landId) {
      return res.status(400).json({
        success: false,
        message: "Land ID is required"
      });
    }

    // ------------------------------------------------------
    // FIND PROPERTY
    // Accept numeric MySQL ID OR public land_id
    // ------------------------------------------------------

    let properties;

    if (/^\d+$/.test(String(landId))) {

      [properties] = await db.query(
        `
        SELECT
          id,
          land_id,
          seller_id,
          current_owner_id,
          owner_name,
          verification_status,
          sale_amount,
          land_amount

        FROM lands

        WHERE
          id = ?
          AND verification_status = 'VERIFIED'

        LIMIT 1
        `,
        [Number(landId)]
      );

    } else {

      [properties] = await db.query(
        `
        SELECT
          id,
          land_id,
          seller_id,
          current_owner_id,
          owner_name,
          verification_status,
          sale_amount,
          land_amount

        FROM lands

        WHERE
          land_id = ?
          AND verification_status = 'VERIFIED'

        LIMIT 1
        `,
        [landId]
      );
    }

    // ------------------------------------------------------
    // PROPERTY NOT FOUND
    // ------------------------------------------------------

    if (!properties || properties.length === 0) {

      console.error(
        "Purchase request property not found:",
        landId
      );

      return res.status(404).json({
        success: false,
        message:
          "Property not found or not verified"
      });
    }

    const property = properties[0];

    // ------------------------------------------------------
    // BUYER CANNOT BUY OWN PROPERTY
    // ------------------------------------------------------

    if (
      Number(property.current_owner_id) ===
      Number(buyerId)
    ) {

      return res.status(400).json({
        success: false,
        message:
          "You cannot request to purchase your own property"
      });
    }

    // ------------------------------------------------------
    // CHECK APPROVED REQUEST
    // ------------------------------------------------------

    const [approvedRequests] =
      await db.query(
        `
        SELECT
          id

        FROM buyer_requests

        WHERE
          land_id = ?
          AND request_status = 'APPROVED'

        LIMIT 1
        `,
        [property.id]
      );

    if (
      approvedRequests &&
      approvedRequests.length > 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          "This property has already been sold"
      });
    }

    // ------------------------------------------------------
    // CHECK EXISTING PENDING REQUEST
    // ------------------------------------------------------

    const [existingRequests] =
      await db.query(
        `
        SELECT
          id,
          request_status

        FROM buyer_requests

        WHERE
          land_id = ?
          AND buyer_id = ?
          AND request_status = 'PENDING'

        LIMIT 1
        `,
        [
          property.id,
          buyerId
        ]
      );

    if (
      existingRequests &&
      existingRequests.length > 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "You have already sent a purchase request for this property",

        request_id:
          existingRequests[0].id,

        request_status:
          existingRequests[0].request_status
      });
    }

    // ------------------------------------------------------
    // CHECK ALREADY APPROVED FOR THIS BUYER
    // ------------------------------------------------------

    const [buyerApprovedRequests] =
      await db.query(
        `
        SELECT
          id,
          request_status

        FROM buyer_requests

        WHERE
          land_id = ?
          AND buyer_id = ?
          AND request_status = 'APPROVED'

        LIMIT 1
        `,
        [
          property.id,
          buyerId
        ]
      );

    if (
      buyerApprovedRequests &&
      buyerApprovedRequests.length > 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Your purchase request for this property is already approved",

        request_id:
          buyerApprovedRequests[0].id
      });
    }

    // ------------------------------------------------------
    // INSERT PURCHASE REQUEST
    // ------------------------------------------------------

    const [result] =
      await db.query(
        `
        INSERT INTO buyer_requests
        (
          land_id,
          buyer_id,
          seller_id,
          request_status
        )

        VALUES
        (
          ?,
          ?,
          ?,
          'PENDING'
        )
        `,
        [
          property.id,
          buyerId,
          property.current_owner_id
        ]
      );

    // ------------------------------------------------------
    // SUCCESS
    // ------------------------------------------------------

    console.log(
      "Purchase request created:",
      result.insertId
    );

    return res.status(201).json({

      success: true,

      message:
        "Purchase request sent successfully",

      request: {

        id:
          result.insertId,

        // Internal MySQL ID
        land_id:
          property.id,

        // Public Land Registry ID
        land_identifier:
          property.land_id,

        buyer_id:
          buyerId,

        seller_id:
          property.current_owner_id,

        request_status:
          "PENDING",

        expected_sale_amount:
          property.sale_amount ??
          property.land_amount ??
          null
      }
    });

  } catch (error) {

    console.error(
      "Send purchase request error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to send purchase request",

      error:
        error.message
    });
  }
};


// ==========================================================
// GET MY PURCHASE REQUESTS
// GET /api/buyer/requests
// ==========================================================

const getMyRequests = async (req, res) => {
  try {

    const buyerId = req.user.id;

    if (!buyerId) {
      return res.status(401).json({
        success: false,
        message:
          "Buyer information not found"
      });
    }

    const [requests] = await db.query(
      `
      SELECT

        br.id AS request_id,
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
        l.pincode,
        l.address,

        l.survey_number,
        l.subdivision_number,

        l.registration_number,
        l.registration_date,

        l.area,
        l.area_unit,

        l.land_type,
        l.usage_type,

        l.sale_amount,
        l.land_amount,

        l.document_path,
        l.document_hash,

        l.verification_status
          AS land_verification_status,

        l.blockchain_land_id,
        l.blockchain_tx_hash,
        l.blockchain_block_number,
        l.blockchain_network,

        seller.name AS seller_name,
        seller.email AS seller_email,
        seller.mobile AS seller_mobile,

        seller.wallet_address
          AS seller_wallet_address,

        buyer.name AS buyer_name,
        buyer.email AS buyer_email,
        buyer.mobile AS buyer_mobile

      FROM buyer_requests br

      LEFT JOIN lands l
        ON br.land_id = l.id

      LEFT JOIN users seller
        ON br.seller_id = seller.id

      LEFT JOIN users buyer
        ON br.buyer_id = buyer.id

      WHERE
        br.buyer_id = ?

      ORDER BY
        br.requested_at DESC
      `,
      [buyerId]
    );

    const formattedRequests =
      requests.map((request) => ({
        ...request,

        // --------------------------------------------------
        // PUBLIC LAND ID
        // --------------------------------------------------

        land_identifier:
          request.land_code,

        // --------------------------------------------------
        // FULL LOCATION
        // --------------------------------------------------

        location:
          [
            request.address,
            request.village,
            request.taluk,
            request.district,
            request.state
          ]
            .filter(Boolean)
            .join(", ") || "-",

        usage:
          request.usage_type,

        expected_sale_amount:
          request.sale_amount ??
          request.land_amount ??
          null,

        // --------------------------------------------------
        // DOCUMENT
        // --------------------------------------------------

        document_url:
          request.document_path
            ? `/uploads/land-documents/${request.document_path
                .split("/")
                .pop()}`
            : null,

        // --------------------------------------------------
        // BLOCKCHAIN
        // --------------------------------------------------

        blockchain: {

          land_id:
            request.blockchain_land_id,

          transaction_hash:
            request.blockchain_tx_hash,

          block_number:
            request.blockchain_block_number,

          network:
            request.blockchain_network
        }
      }));

    return res.status(200).json({

      success: true,

      count:
        formattedRequests.length,

      requests:
        formattedRequests
    });

  } catch (error) {

    console.error(
      "Get my buyer requests error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to load your purchase requests",

      error:
        error.message
    });
  }
};


// ==========================================================
// GET MY PROPERTIES
// GET /api/buyer/my-properties
// ==========================================================
//
// Returns properties where the logged-in buyer is the
// current owner.
// ==========================================================

const getMyProperties = async (req, res) => {
  try {

    const buyerId = req.user.id;

    if (!buyerId) {
      return res.status(401).json({
        success: false,
        message:
          "Buyer information not found"
      });
    }

    const [properties] = await db.query(
      `
      SELECT

        l.id,
        l.land_id,

        l.seller_id,
        l.current_owner_id,

        l.owner_name,
        l.owner_mobile,
        l.owner_count,
        l.number_of_owners,

        l.owner_names,

        l.district,
        l.state,
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
        l.usage_type,

        l.latitude,
        l.longitude,

        l.sale_amount,
        l.land_amount,

        l.description,

        l.document_hash,
        l.document_path,

        l.verification_status,
        l.verified_at,

        l.wallet_address,

        l.blockchain_land_id,
        l.blockchain_tx_hash,
        l.blockchain_block_number,
        l.blockchain_network,

        l.created_at,
        l.updated_at,

        owner_user.name AS current_owner_name,
        owner_user.email AS current_owner_email,
        owner_user.mobile AS current_owner_mobile

      FROM lands l

      LEFT JOIN users owner_user
        ON l.current_owner_id = owner_user.id

      WHERE
        l.current_owner_id = ?

      ORDER BY
        l.created_at DESC
      `,
      [buyerId]
    );

    const formattedProperties =
      properties.map((property) => {

        let ownerNames =
          property.owner_names;

        if (typeof ownerNames === "string") {

          try {

            ownerNames =
              JSON.parse(
                ownerNames
              );

          } catch (error) {

            ownerNames = [];
          }
        }

        if (!Array.isArray(ownerNames)) {
          ownerNames = [];
        }

        return {

          ...property,

          usage:
            property.usage_type,

          expected_sale_amount:
            property.sale_amount ??
            property.land_amount ??
            null,

          current_owner_name:
            property.current_owner_name ||
            property.owner_name,

          current_owner_email:
            property.current_owner_email ||
            null,

          current_owner_mobile:
            property.current_owner_mobile ||
            property.owner_mobile ||
            null,

          owner_names:
            ownerNames,

          location:
            [
              property.address,
              property.village,
              property.taluk,
              property.district,
              property.state
            ]
              .filter(Boolean)
              .join(", ") || "-",

          document_url:
            property.document_path
              ? `/uploads/land-documents/${property.document_path
                  .split("/")
                  .pop()}`
              : null,

          blockchain: {

            land_id:
              property.blockchain_land_id,

            transaction_hash:
              property.blockchain_tx_hash,

            block_number:
              property.blockchain_block_number,

            network:
              property.blockchain_network
          }
        };
      });

    return res.status(200).json({

      success: true,

      count:
        formattedProperties.length,

      properties:
        formattedProperties
    });

  } catch (error) {

    console.error(
      "Get my properties error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to load your properties",

      error:
        error.message
    });
  }
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

  getAvailableProperties,

  getPropertyDetails,

  sendPurchaseRequest,

  getMyRequests,

  getMyProperties

};