const router = require('express').Router();
const { loginHandler, me } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, loginSchema } = require('../utils/validators');

router.post('/login', validate(loginSchema), loginHandler);
router.get('/me', authMiddleware, me);

module.exports = router;
