const router = require('express').Router();
const { createUserHandler, getUsers, updateUserHandler, deleteUserHandler } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { validate, createUserSchema, updateUserSchema } = require('../utils/validators');

router.use(authMiddleware, allowRoles('ADMIN', 'SUPER_ADMIN'));

router.post('/create-user', validate(createUserSchema), createUserHandler);
router.get('/users', getUsers);
router.put('/user/:id', validate(updateUserSchema), updateUserHandler);
router.delete('/user/:id', deleteUserHandler);

module.exports = router;
