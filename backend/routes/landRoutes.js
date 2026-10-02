const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  registerLand,
  getMyLands,
  getLandById,
  updateBlockchainRecord
} = require("../controllers/landController");

const sellerAuth = require("../middleware/sellerAuth");

const router = express.Router();

// ======================================================
// LAND DOCUMENT UPLOAD DIRECTORY
// ======================================================

const uploadDirectory = path.join(
  __dirname,
  "../uploads/land-documents"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true
  });
}

// ======================================================
// MULTER STORAGE
// ======================================================

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {

    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1000000
      )}.pdf`;

    cb(null, uniqueName);
  }

});

// ======================================================
// MULTER CONFIGURATION
// ======================================================

const upload = multer({

  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    const extension =
      path.extname(file.originalname)
        .toLowerCase();

    if (
      extension === ".pdf" &&
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF documents are allowed"
        )
      );
    }

  }

});

// ======================================================
// REGISTER LAND
// ======================================================

router.post(
  "/register",
  sellerAuth,
  upload.single("land_document"),
  registerLand
);

// ======================================================
// GET SELLER'S LAND
// ======================================================

router.get(
  "/my-lands",
  sellerAuth,
  getMyLands
);

// ======================================================
// GET SINGLE LAND
// ======================================================

router.get(
  "/:id",
  sellerAuth,
  getLandById
);

// ======================================================
// UPDATE BLOCKCHAIN RECORD
// ======================================================

router.put(
  "/:id/blockchain",
  sellerAuth,
  updateBlockchainRecord
);

module.exports = router;