import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler — only redirect if NOT on the login endpoint
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Super Admin
export const createAdmin = (data) => api.post('/super-admin/create-admin', data);
export const getAdmins = (params) => api.get('/super-admin/admins', { params });

// Admin
export const createUser = (data) => api.post('/admin/create-user', data);
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const updateAdminUser = (id, data) => api.put(`/admin/user/${id}`, data);
export const deleteAdminUser = (id) => api.delete(`/admin/user/${id}`);
export const getAdminTeachers = () => api.get('/admin/users', { params: { role: 'TEACHER', limit: 100 } });

// User (shared)
export const getProfile = () => api.get('/profile');

// Student
export const getMyMarks = (params = {}) => api.get('/student/marks', { params });

// Teacher
export const getMyStudents = (params = {}) => api.get('/teacher/students', { params });
export const getAvailableStudents = () => api.get('/teacher/unassigned-students');
export const assignStudent = (student_id) => api.post('/teacher/assign-student', { student_id });
export const unassignStudent = (studentId) => api.delete(`/teacher/unassign-student/${studentId}`);
export const saveMark = (data) => api.post('/teacher/marks', data);
export const deleteMark = (markId) => api.delete(`/teacher/marks/${markId}`);
export const getEnteredMarks = (params = {}) => api.get('/teacher/marks', { params });

// Teacher — create a new student and auto-assign to self (with optional initial marks)
export const createStudentAsTeacher = (data) => api.post('/teacher/create-student', data);
export const getStudents = (page = 1, limit = 10, search = '') =>
  api.get(`/students?page=${page}&limit=${limit}&search=${search}`);
export const getStudentById = (id) => api.get(`/students/${id}`);

// Subjects — accessible by any authenticated user
export const getSubjects = () => api.get('/subjects');
