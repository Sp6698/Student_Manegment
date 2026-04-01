const router = require('express').Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { success, error } = require('../utils/response');

// GET /api/subjects — any logged-in user (teacher, student, admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error: dbErr } = await supabase
      .from('subjects')
      .select('id, name, code, description')
      .order('name');
    if (dbErr) throw new Error(dbErr.message);
    success(res, data);
  } catch (err) {
    error(res, err.message);
  }
});

module.exports = router;
