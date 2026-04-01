const {
  getStudentByUserId, getTeacherByUserId,
  getAssignedStudents, getMarksByStudentId, getMarksByTeacherId,
  upsertMark, deleteMark, assignStudentToTeacher, unassignStudent, getUnassignedStudents,
} = require('../services/marksService');
const { createUser, createStudentProfile } = require('../services/userService');
const { success, error } = require('../utils/response');
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

// GET /api/profile
const getProfile = async (req, res) => {
  try {
    const { data, error: dbErr } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, students(age, enrollment_date), teachers(id)')
      .eq('id', req.user.id)
      .single();
    if (dbErr) throw new Error(dbErr.message);
    success(res, data);
  } catch (err) {
    error(res, err.message);
  }
};

// ─── STUDENT ─────────────────────────────────────────────────

// GET /api/student/marks?page=1&limit=10
const getMyMarks = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20; // default higher for report card

    const student = await getStudentByUserId(req.user.id);
    const allMarks = await getMarksByStudentId(student.id);

    const total = allMarks.length;
    const avg = total > 0
      ? (allMarks.reduce((s, m) => s + parseFloat(m.score), 0) / total).toFixed(2)
      : 0;

    const offset = (page - 1) * limit;
    const paginated = allMarks.slice(offset, offset + limit);

    success(res, {
      marks: paginated,
      summary: { total, average: parseFloat(avg) },
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    error(res, err.message);
  }
};

// ─── TEACHER ─────────────────────────────────────────────────

// GET /api/teacher/students?page=1&limit=10&search=
const getMyStudents = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || '').toLowerCase();

    const teacher = await getTeacherByUserId(req.user.id);
    const allStudents = await getAssignedStudents(teacher.id);

    // Attach marks + average
    const withMarks = await Promise.all(
      allStudents.map(async (s) => {
        const marks = await getMarksByStudentId(s.id);
        const avg = marks.length > 0
          ? (marks.reduce((sum, m) => sum + parseFloat(m.score), 0) / marks.length).toFixed(2)
          : null;
        return { ...s, marks, average: avg ? parseFloat(avg) : null };
      })
    );

    // Search filter (in-memory — assigned students list is small)
    const filtered = search
      ? withMarks.filter(s =>
          s.users?.name?.toLowerCase().includes(search) ||
          s.users?.email?.toLowerCase().includes(search)
        )
      : withMarks;

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    success(res, {
      data: paginated,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    logger.error('getMyStudents: ' + err.message);
    error(res, err.message);
  }
};

// GET /api/teacher/unassigned-students
const getAvailableStudents = async (req, res) => {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    const students = await getUnassignedStudents(teacher.id);
    success(res, students);
  } catch (err) {
    error(res, err.message);
  }
};

// POST /api/teacher/assign-student
const assignStudent = async (req, res) => {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    await assignStudentToTeacher(teacher.id, req.body.student_id);
    success(res, null, 'Student assigned successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// DELETE /api/teacher/unassign-student/:studentId
const removeStudent = async (req, res) => {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    await unassignStudent(teacher.id, req.params.studentId);
    success(res, null, 'Student removed from your list');
  } catch (err) {
    error(res, err.message, 400);
  }
};

// POST /api/teacher/create-student — create new student + auto-assign to this teacher
const createStudentAsTeacher = async (req, res) => {
  try {
    const { name, email, password, age, marks = [] } = req.body;
    const teacher = await getTeacherByUserId(req.user.id);

    const newUser = await createUser({ name, email, password, role: 'STUDENT', createdBy: req.user.id });
    const student = await createStudentProfile(newUser.id, age);
    await assignStudentToTeacher(teacher.id, student.id);

    // Save initial marks if provided
    if (marks.length > 0) {
      await Promise.all(marks.map(m =>
        upsertMark({
          studentId: student.id,
          subjectId: m.subject_id,
          score: m.score,
          remarks: m.remarks || '',
          teacherId: teacher.id,
        })
      ));
    }

    success(res, { ...newUser, age: student.age }, 'Student created and assigned to your class', 201);
  } catch (err) {
    logger.error('createStudentAsTeacher: ' + err.message);
    error(res, err.message, 400);
  }
};

// POST /api/teacher/marks
const saveMark = async (req, res) => {
  try {
    const { student_id, subject_id, score, remarks } = req.body;
    const teacher = await getTeacherByUserId(req.user.id);
    const mark = await upsertMark({ studentId: student_id, subjectId: subject_id, score, remarks, teacherId: teacher.id });
    success(res, mark, 'Mark saved', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

// DELETE /api/teacher/marks/:markId
const removeMark = async (req, res) => {
  try {
    const teacher = await getTeacherByUserId(req.user.id);
    await deleteMark(parseInt(req.params.markId), teacher.id);
    success(res, null, 'Mark deleted');
  } catch (err) {
    error(res, err.message, 400);
  }
};

// GET /api/teacher/marks?page=1&limit=10&search=&subject_id=
const getEnteredMarks = async (req, res) => {
  try {
    const page      = parseInt(req.query.page)       || 1;
    const limit     = parseInt(req.query.limit)      || 10;
    const search    = (req.query.search || '').toLowerCase();
    const subjectId = req.query.subject_id ? parseInt(req.query.subject_id) : null;

    const teacher = await getTeacherByUserId(req.user.id);
    const allMarks = await getMarksByTeacherId(teacher.id);

    // Filter
    let filtered = allMarks;
    if (search) {
      filtered = filtered.filter(m =>
        m.students?.users?.name?.toLowerCase().includes(search) ||
        m.subjects?.name?.toLowerCase().includes(search)
      );
    }
    if (subjectId) {
      filtered = filtered.filter(m => m.subjects?.id === subjectId);
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    success(res, {
      data: paginated,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    error(res, err.message);
  }
};

module.exports = {
  getProfile, getMyMarks,
  getMyStudents, getAvailableStudents, assignStudent, removeStudent,
  createStudentAsTeacher, saveMark, removeMark, getEnteredMarks,
};
