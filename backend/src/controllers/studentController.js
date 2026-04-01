const supabase = require('../config/supabase');
const { success, error } = require('../utils/response');

// GET /api/students?page=1&limit=10&search=
const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('users')
      .select('id, name, email, is_active, created_at, students(id, age)', { count: 'exact' })
      .eq('role', 'USER')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error: dbErr, count } = await query;
    if (dbErr) throw new Error(dbErr.message);

    success(res, {
      data,
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (err) {
    error(res, err.message);
  }
};

// GET /api/students/:id  (with marks)
const getStudentById = async (req, res) => {
  try {
    const { data: user, error: uErr } = await supabase
      .from('users')
      .select('id, name, email, created_at, students(id, age, enrollment_date)')
      .eq('id', req.params.id)
      .eq('role', 'USER')
      .single();
    if (uErr) throw new Error('Student not found');

    const { data: marks, error: mErr } = await supabase
      .from('marks')
      .select('score, grade, remarks, subjects(name, code)')
      .eq('student_id', user.students?.id);
    if (mErr) throw new Error(mErr.message);

    success(res, { ...user, marks });
  } catch (err) {
    error(res, err.message, 404);
  }
};

// GET /api/students/subjects
const getSubjects = async (req, res) => {
  try {
    const { data, error: dbErr } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    if (dbErr) throw new Error(dbErr.message);
    success(res, data);
  } catch (err) {
    error(res, err.message);
  }
};

module.exports = { getStudents, getStudentById, getSubjects };
