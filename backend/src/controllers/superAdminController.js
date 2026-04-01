const { createUser, listUsers } = require('../services/userService');
const { success, error } = require('../utils/response');

// POST /api/super-admin/create-admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const admin = await createUser({ name, email, password, role: 'ADMIN', createdBy: req.user.id });
    success(res, admin, 'Admin created successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// GET /api/super-admin/admins
const getAdmins = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await listUsers({
      role: 'ADMIN',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search: search || '',
    });
    success(res, result);
  } catch (err) {
    error(res, err.message);
  }
};

module.exports = { createAdmin, getAdmins };
