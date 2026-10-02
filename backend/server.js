const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/*
==========================================================
STATIC UPLOADS
==========================================================
*/
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


/*
==========================================================
ROUTES
==========================================================
*/

const adminRoutes = require("./routes/adminRoutes");
const landRoutes = require("./routes/landRoutes");
const userRoutes = require("./routes/userRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const buyerRoutes = require("./routes/buyerRoutes");


app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/lands",
  landRoutes
);

app.use(
  "/api/auth",
  userRoutes
);

app.use(
  "/api/seller",
  sellerRoutes
);

app.use(
  "/api/buyer",
  buyerRoutes
);


/*
==========================================================
ROOT
==========================================================
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TN Land Registry Backend is running"
  });
});


/*
==========================================================
404
==========================================================
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});


/*
==========================================================
SERVER
==========================================================
*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Backend running on http://localhost:${PORT}`
  );
});