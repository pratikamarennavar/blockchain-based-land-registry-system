const jwt = require("jsonwebtoken");

const buyerAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.role || decoded.role.toUpperCase() !== "BUYER") {
      return res.status(403).json({
        success: false,
        message: "Buyer access required"
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };

    next();

  } catch (error) {
    console.error("Buyer authentication error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Buyer session expired. Please login again.",
        code: "TOKEN_EXPIRED"
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid buyer authentication token",
        code: "INVALID_TOKEN"
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

module.exports = buyerAuth;