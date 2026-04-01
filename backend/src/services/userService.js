const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const hashPassword = (pw) => bcrypt.hash(pw, 12);

// Create any user (ADMIN, TEACHER, STUDENT)
const createUser = async ({ name, email, password, role, createdBy = null }) => {
  const hashed = await hashPassword(password);
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password: hashed, role, created_by: createdBy }])
    .select('id, name, email, role, is_active, created_at')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('Email already exists');
    throw new Error(error.message);
  }
  return data;
};

// Create student profile
const createStudentProfile = async (userId, age) => {
  const { data, error } = await supabase
    .from('students')
    .insert([{ user_id: userId, age }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

// Create teacher profile
const createTeacherProfile = async (userId) => {
  const { data, error } = await supabase
    .from('teachers')
    .insert([{ user_id: userId }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

// List users by role with pagination — excludes soft-deleted
const listUsers = async ({ role, page = 1, limit = 10, search = '' }) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('id, name, email, role, is_active, created_at', { count: 'exact' })
    .eq('role', role)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data,
    meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
};

// List both teachers and students (for admin overview) — excludes soft-deleted
const listSchoolUsers = async ({ page = 1, limit = 10, search = '', role = null }) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('id, name, email, role, is_active, created_at', { count: 'exact' })
    .in('role', role ? [role] : ['TEACHER', 'STUDENT'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data,
    meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  };
};

const getUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, is_active, created_at, students(id, age, enrollment_date), teachers(id)')
    .eq('id', id)
    .single();
  if (error) throw new Error('User not found');
  return data;
};

const updateUser = async (id, fields) => {
  const { data, error } = await supabase
    .from('users')
    .update({ ...fields, updated_at: new Date() })
    .eq('id', id)
    .select('id, name, email, role, is_active')
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const updateStudentAge = async (userId, age) => {
  await supabase
    .from('students')
    .update({ age, updated_at: new Date() })
    .eq('user_id', userId);
};

// Soft delete user (sets deleted_at, does NOT remove from DB)
const deleteUser = async (id) => {
  // First deactivate + soft delete
  const { error } = await supabase
    .from('users')
    .update({ is_active: false, deleted_at: new Date(), updated_at: new Date() })
    .eq('id', id);
  if (error) throw new Error(error.message);
};

module.exports = {
  createUser,
  createStudentProfile,
  createTeacherProfile,
  listUsers,
  listSchoolUsers,
  getUserById,
  updateUser,
  updateStudentAge,
  deleteUser,
};
