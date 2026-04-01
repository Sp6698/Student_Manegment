import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';

const ROLE_ROUTES = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/dashboard',
};

const DEMO_ACCOUNTS = [
  { role: 'IT Admin', email: 'itadmin@school.com', password: 'itadmin123', color: 'from-purple-500 to-purple-700', icon: '🛡️' },
  { role: 'Principal', email: 'principal@school.com', password: 'principal123', color: 'from-emerald-500 to-emerald-700', icon: '🏫' },
  { role: 'Teacher 1', email: 'john.math@school.com', password: 'teacher123', color: 'from-blue-500 to-blue-700', icon: '👨‍🏫' },
  { role: 'Teacher 2', email: 'lisa.science@school.com', password: 'teacher123', color: 'from-cyan-500 to-cyan-700', icon: '👩‍🏫' },
  { role: 'Teacher 3', email: 'tom.english@school.com', password: 'teacher123', color: 'from-sky-500 to-sky-700', icon: '👨‍🏫' },
  { role: 'Student', email: 'alice@school.com', password: 'student123', color: 'from-orange-500 to-orange-700', icon: '🎓' },
];

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await login(form);
      const { token, user } = res.data.data;
      loginUser(user, token);
      navigate(ROLE_ROUTES[user.role] || '/login');
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors({ password: 'Invalid email or password' });
      } else {
        Swal.fire('Error', err.response?.data?.message || 'Something went wrong', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (account) => {
    setForm({ email: account.email, password: account.password });
    setErrors({});
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Background image panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Unsplash classroom image */}
        <img
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80"
          alt="School classroom"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-indigo-800/70 to-purple-900/80" />
        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <SchoolIcon sx={{ color: '#fff', fontSize: 22 }} />
            </div>
            <span className="text-xl font-bold tracking-tight">EduManage</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Empowering Education<br />Through Technology
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed mb-8">
              A complete school management platform for teachers, students, and administrators.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: '👨‍🏫', label: 'Teachers', desc: 'Manage classes' },
                { icon: '🎓', label: 'Students', desc: 'Track progress' },
                { icon: '📊', label: 'Analytics', desc: 'View insights' },
              ].map(item => (
                <div key={item.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="font-semibold text-sm">{item.label}</div>
                  <div className="text-indigo-300 text-xs">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-indigo-300 text-sm">© 2025 EduManage. Designed & Developed by Shubham Patil. All rights reserved.</p>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center bg-slate-50 px-6 py-10 overflow-y-auto">
        <div className="max-w-md mx-auto w-full">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <SchoolIcon sx={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">EduManage</h1>
              <p className="text-xs text-slate-500">School Management System</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome back 👋</h2>
            <p className="text-slate-500">Sign in to your school portal account</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <EmailIcon fontSize="small" />
                  </div>
                  <input
                    type="email"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all
                      ${errors.email
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    placeholder="you@school.com"
                    value={form.email}
                    onChange={handleChange('email')}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <LockIcon fontSize="small" />
                  </div>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm outline-none transition-all
                      ${errors.password
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange('password')}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white text-sm
                  bg-gradient-to-r from-indigo-600 to-purple-600
                  hover:from-indigo-700 hover:to-purple-700
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-all shadow-md hover:shadow-lg
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LoginIcon fontSize="small" />
                    Sign In to Portal
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Demo Accounts</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc)}
                  className="group relative overflow-hidden rounded-xl p-3 text-left transition-all
                    bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${acc.color}`} />
                  <div className="pl-2">
                    <div className="text-lg mb-0.5">{acc.icon}</div>
                    <div className="text-xs font-bold text-slate-700">{acc.role}</div>
                    <div className="text-xs text-slate-400 truncate">{acc.email.split('@')[0]}</div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">Click any card to auto-fill credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
}
