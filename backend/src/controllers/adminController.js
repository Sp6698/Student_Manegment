const {
  createUser, createStudentProfile, createTeacherProfile,
  listSchoolUsers, updateUser, updateStudentAge, deleteUser,
} = require('../services/userService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

// POST /api/admin/create-user
const createUserHandler = async (req, res) => {
  try {
    const { name, email, password, role, age, teacher_id } = req.body;

    const user = await createUser({ name, email, password, role, createdBy: req.user.id });

    if (role === 'STUDENT') {
      const student = await createStudentProfile(user.id, age);
      // If a teacher is selected, assign this student to them
      if (teacher_id) {
        const supabase = require('../config/supabase');
        const { data: teacher } = await supabase
          .from('teachers').select('id').eq('user_id', teacher_id).single();
        if (teacher) {
          await supabase.from('teacher_students')
            .insert([{ teacher_id: teacher.id, student_id: student.id }]);
        }
      }
    } else if (role === 'TEACHER') {
      await createTeacherProfile(user.id);
    }

    success(res, { ...user, ...(age && { age }) }, `${role} created successfully`, 201);
  } catch (err) {
    logger.error('createUser error: ' + err.message);
    error(res, err.message, 400);
  }
};

// GET /api/admin/users?role=STUDENT|TEACHER&page=1&limit=10&search=
const getUsers = async (req, res) => {
  try {
    const { page, limit, search, role } = req.query;
    const result = await listSchoolUsers({
      role: role || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search: search || '',
    });
    success(res, result);
  } catch (err) {
    error(res, err.message);
  }
};

// PUT /api/admin/user/:id
const updateUserHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, is_active, teacher_id } = req.body;

    const fields = {};
    if (name !== undefined) fields.name = name;
    if (is_active !== undefined) fields.is_active = is_active;

    const user = await updateUser(id, fields);
    if (age !== undefined) await updateStudentAge(id, age);

    // If teacher_id provided, assign this student to that teacher
    if (teacher_id) {
      const supabase = require('../config/supabase');
      // Get student profile id
      const { data: student } = await supabase
        .from('students').select('id').eq('user_id', id).single();
      const { data: teacher } = await supabase
        .from('teachers').select('id').eq('user_id', teacher_id).single();
      if (student && teacher) {
        await supabase.from('teacher_students')
          .upsert([{ teacher_id: teacher.id, student_id: student.id }],
            { onConflict: 'teacher_id,student_id' });
      }
    }

    success(res, user, 'Updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

// DELETE /api/admin/user/:id
const deleteUserHandler = async (req, res) => {
  try {
    await deleteUser(req.params.id);
    success(res, null, 'User deleted successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = { createUserHandler, getUsers, updateUserHandler, deleteUserHandler };
