const { login } = require('../services/authService');
const { success, error } = require('../utils/response');
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

// POST /api/auth/login
const loginHandler = async (req, res) => {
  try {
    const result = await login(req.body.email, req.body.password);
    success(res, result, 'Login successful');
  } catch (err) {
    logger.error(`Login handler caught: "${err.message}"`);
    const authErrors = ['Invalid email or password', 'Account is deactivated'];
    const statusCode = authErrors.includes(err.message) ? 401 : 500;
    error(res, err.message, statusCode);
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const { data, error: dbErr } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at, students(age, enrollment_date), teachers(id)')
      .eq('id', req.user.id)
      .single();

    if (dbErr) throw new Error(dbErr.message);
    success(res, data, 'Profile fetched');
  } catch (err) {
    logger.error(`Me handler error: ${err.message}`);
    error(res, err.message);
  }
};

module.exports = { loginHandler, me };
