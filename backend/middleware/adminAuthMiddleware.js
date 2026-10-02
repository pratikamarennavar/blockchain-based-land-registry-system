const jwt = require('jsonwebtoken');


// ======================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// ======================================================

const adminAuth = (req, res, next) => {
  try {

    // --------------------------------------------------
    // GET AUTHORIZATION HEADER
    // --------------------------------------------------

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required'
      });
    }


    // --------------------------------------------------
    // CHECK BEARER FORMAT
    // --------------------------------------------------

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format'
      });
    }


    // --------------------------------------------------
    // EXTRACT TOKEN
    // --------------------------------------------------

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing'
      });
    }


    // --------------------------------------------------
    // VERIFY TOKEN
    // --------------------------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    // --------------------------------------------------
    // CHECK ADMIN ROLE
    // --------------------------------------------------

    if (
      !decoded.role ||
      decoded.role.toUpperCase() !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }


    // --------------------------------------------------
    // STORE USER DATA
    // --------------------------------------------------

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    // Some of your controller code also checks req.admin.
    req.admin = {
      id: decoded.id,
      role: decoded.role
    };


    // --------------------------------------------------
    // CONTINUE
    // --------------------------------------------------

    next();

  } catch (error) {

    console.error(
      'Admin authentication error:',
      error
    );


    // --------------------------------------------------
    // EXPIRED TOKEN
    // --------------------------------------------------

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Admin session expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }


    // --------------------------------------------------
    // INVALID TOKEN
    // --------------------------------------------------

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin authentication token',
        code: 'INVALID_TOKEN'
      });
    }


    // --------------------------------------------------
    // OTHER ERROR
    // --------------------------------------------------

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};


module.exports = adminAuth;