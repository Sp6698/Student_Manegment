const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT using our own secret — no Supabase Auth involved
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return error(res, 'Invalid or expired token', 401);
    }

    // Fetch fresh user from DB — exclude soft-deleted
    const { data: user, error: dbErr } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, deleted_at')
      .eq('id', decoded.id)
      .is('deleted_at', null)
      .single();

    if (dbErr || !user) return error(res, 'User not found', 401);
    if (!user.is_active) return error(res, 'Account is deactivated', 403);

    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Authentication error', 500);
  }
};

module.exports = authMiddleware;
