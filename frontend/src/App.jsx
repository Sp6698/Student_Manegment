import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentMarksPage from './pages/student/StudentMarksPage';
import TeacherHomePage from './pages/teacher/TeacherHomePage';
import TeacherStudentsPage from './pages/teacher/TeacherStudentsPage';
import TeacherMarksPage from './pages/teacher/TeacherMarksPage';

const ROLE_HOME = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/dashboard',
};

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
}

const Guard = ({ roles, children }) => (
  <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Super Admin */}
          <Route path="/super-admin" element={<Guard roles={['SUPER_ADMIN']}><SuperAdminDashboard /></Guard>} />

          {/* Admin / Principal */}
          <Route path="/admin" element={<Guard roles={['ADMIN', 'SUPER_ADMIN']}><AdminDashboard /></Guard>} />
          <Route path="/admin/users" element={<Guard roles={['ADMIN', 'SUPER_ADMIN']}><AdminDashboard /></Guard>} />

          {/* Teacher */}
          <Route path="/teacher" element={<Guard roles={['TEACHER']}><TeacherHomePage /></Guard>} />
          <Route path="/teacher/students" element={<Guard roles={['TEACHER']}><TeacherStudentsPage /></Guard>} />
          <Route path="/teacher/marks" element={<Guard roles={['TEACHER']}><TeacherMarksPage /></Guard>} />
          <Route path="/teacher/marks/:studentId" element={<Guard roles={['TEACHER']}><TeacherMarksPage /></Guard>} />

          {/* Student */}
          <Route path="/dashboard" element={<Guard roles={['STUDENT']}><StudentDashboard /></Guard>} />
          <Route path="/dashboard/marks" element={<Guard roles={['STUDENT']}><StudentMarksPage /></Guard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
