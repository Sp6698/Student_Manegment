const router = require('express').Router();
const { getStudents, getStudentById, getSubjects } = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');

router.use(authMiddleware, allowRoles('ADMIN', 'SUPER_ADMIN'));

router.get('/subjects', getSubjects);
router.get('/', getStudents);
router.get('/:id', getStudentById);

module.exports = router;
