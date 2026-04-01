const router = require('express').Router();
const { createAdmin, getAdmins } = require('../controllers/superAdminController');
const authMiddleware = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { validate, createAdminSchema } = require('../utils/validators');

router.use(authMiddleware, allowRoles('SUPER_ADMIN'));

router.post('/create-admin', validate(createAdminSchema), createAdmin);
router.get('/admins', getAdmins);

module.exports = router;
