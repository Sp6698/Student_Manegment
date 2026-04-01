const supabase = require('../config/supabase');

const calcGrade = (score) => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
};

const getStudentByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .single();
  if (error || !data) throw new Error('Student profile not found');
  return data;
};

const getTeacherByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .single();
  if (error || !data) throw new Error('Teacher profile not found');
  return data;
};

// Get students assigned to a specific teacher (with their marks) — excludes soft-deleted users
const getAssignedStudents = async (teacherId) => {
  const { data, error } = await supabase
    .from('teacher_students')
    .select(`
      student_id,
      students (
        id,
        age,
        enrollment_date,
        user_id,
        users ( id, name, email, deleted_at )
      )
    `)
    .eq('teacher_id', teacherId)
    .order('assigned_at');
  if (error) throw new Error(error.message);
  // Filter out students whose user account was soft-deleted
  return data
    .map((r) => r.students)
    .filter((s) => s && s.users && !s.users.deleted_at);
};

// Get marks for a specific student — excludes soft-deleted
const getMarksByStudentId = async (studentId) => {
  const { data, error } = await supabase
    .from('marks')
    .select('id, score, grade, remarks, updated_at, subjects(id, name, code), teachers(users(name))')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('subjects(name)');
  if (error) throw new Error(error.message);
  return data;
};

// Get all marks entered by a teacher — excludes soft-deleted
const getMarksByTeacherId = async (teacherId) => {
  const { data, error } = await supabase
    .from('marks')
    .select('id, score, grade, remarks, updated_at, subjects(name, code), students(users(name, email))')
    .eq('entered_by', teacherId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

// Upsert (add or update) a mark
const upsertMark = async ({ studentId, subjectId, score, remarks = '', teacherId }) => {
  const grade = calcGrade(score);
  const { data, error } = await supabase
    .from('marks')
    .upsert(
      [{ student_id: studentId, subject_id: subjectId, entered_by: teacherId, score, grade, remarks, updated_at: new Date() }],
      { onConflict: 'student_id,subject_id' }
    )
    .select('id, score, grade, remarks, subjects(id, name, code)')
    .single();
  if (error) throw new Error(error.message);
  return data;
};

// Soft delete a mark (teacher can only delete their own)
const deleteMark = async (markId, teacherId) => {
  const { data: mark, error: fetchErr } = await supabase
    .from('marks')
    .select('id, entered_by')
    .eq('id', markId)
    .is('deleted_at', null)
    .single();
  if (fetchErr || !mark) throw new Error('Mark not found');
  if (mark.entered_by !== teacherId) throw new Error('You can only delete marks you entered');

  const { error } = await supabase
    .from('marks')
    .update({ deleted_at: new Date() })
    .eq('id', markId);
  if (error) throw new Error(error.message);
};

// Assign a student to a teacher
const assignStudentToTeacher = async (teacherId, studentId) => {
  const { error } = await supabase
    .from('teacher_students')
    .insert([{ teacher_id: teacherId, student_id: studentId }]);
  if (error) {
    if (error.code === '23505') throw new Error('Student already assigned to this teacher');
    throw new Error(error.message);
  }
};

// Remove student assignment from teacher
const unassignStudent = async (teacherId, studentId) => {
  const { error } = await supabase
    .from('teacher_students')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId);
  if (error) throw new Error(error.message);
};

// Get all students NOT yet assigned to a given teacher — excludes soft-deleted
const getUnassignedStudents = async (teacherId) => {
  const { data: assigned } = await supabase
    .from('teacher_students')
    .select('student_id')
    .eq('teacher_id', teacherId);

  const assignedIds = (assigned || []).map((r) => r.student_id);

  let query = supabase
    .from('students')
    .select('id, age, users!inner(id, name, email, deleted_at)')
    .is('users.deleted_at', null)
    .order('id');

  if (assignedIds.length > 0) {
    query = query.not('id', 'in', `(${assignedIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
};

module.exports = {
  getStudentByUserId,
  getTeacherByUserId,
  getAssignedStudents,
  getMarksByStudentId,
  getMarksByTeacherId,
  upsertMark,
  deleteMark,
  assignStudentToTeacher,
  unassignStudent,
  getUnassignedStudents,
};
