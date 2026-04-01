const router = require('express').Router();
const {
  getProfile, getMyMarks,
  getMyStudents, getAvailableStudents, assignStudent, removeStudent,
  createStudentAsTeacher, saveMark, removeMark, getEnteredMarks,
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const { validate, markSchema, createUserSchema } = require('../utils/validators');

// Shared
router.get('/profile', authMiddleware, getProfile);

// Student
router.get('/student/marks', authMiddleware, allowRoles('STUDENT'), getMyMarks);

// Teacher
const teacher = [authMiddleware, allowRoles('TEACHER')];
router.get('/teacher/students',                       ...teacher, getMyStudents);
router.get('/teacher/unassigned-students',            ...teacher, getAvailableStudents);
router.post('/teacher/assign-student',                ...teacher, assignStudent);
router.delete('/teacher/unassign-student/:studentId', ...teacher, removeStudent);
router.post('/teacher/create-student',                ...teacher, validate(createUserSchema), createStudentAsTeacher);
router.post('/teacher/marks',                         ...teacher, validate(markSchema), saveMark);
router.delete('/teacher/marks/:markId',               ...teacher, removeMark);
router.get('/teacher/marks',                          ...teacher, getEnteredMarks);

module.exports = router;
