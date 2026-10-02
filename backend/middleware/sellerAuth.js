const jwt = require('jsonwebtoken');

const sellerAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Make sure user is a seller
    if (
      !decoded.role ||
      decoded.role.toUpperCase() !== 'SELLER'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Seller access required'
      });
    }

    // Store authenticated seller information
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };

    next();

  } catch (error) {
    console.error(
      'Seller authentication error:',
      error
    );

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Seller session expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid seller authentication token',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = sellerAuth;