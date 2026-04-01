const { error } = require('../utils/response');

/**
 * Usage: allowRoles('SUPER_ADMIN', 'ADMIN')
 * Must be used AFTER authMiddleware (req.user must exist)
 */
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return error(res, 'Unauthorized', 401);

  if (!roles.includes(req.user.role)) {
    return error(
      res,
      `Access denied. Required: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      403
    );
  }
  next();
};

module.exports = { allowRoles };
