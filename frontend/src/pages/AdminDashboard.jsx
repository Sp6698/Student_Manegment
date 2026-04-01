import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getAdminUsers, createUser, updateAdminUser, deleteAdminUser, getAdminTeachers } from '../services/api';
import MainLayout from '../components/MainLayout';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import Pagination from '../components/Pagination';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const blank = { name: '', email: '', password: '', age: '', role: 'TEACHER', teacher_id: '' };

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(blank);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [teachers, setTeachers] = useState([]);

  const fetchUsers = async (page = 1, q = search, role = roleFilter, lim = meta.limit) => {
    setFetching(true);
    try {
      const res = await getAdminUsers({ page, limit: lim, search: q, role });
      setUsers(res.data.data.data || []);
      setMeta(res.data.data.meta);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to load', 'error');
    } finally { setFetching(false); }
  };

  useEffect(() => { fetchUsers(meta.page, search, roleFilter, meta.limit); }, [meta.page, meta.limit, search, roleFilter]);

  // Load teachers list for the student assignment dropdown
  useEffect(() => {
    getAdminTeachers().then(res => setTeachers(res.data.data.data || [])).catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!editUser) {
      if (!form.email.trim()) e.email = 'Required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
      if (!form.password) e.password = 'Required';
      else if (form.password.length < 6) e.password = 'Min 6 chars';
    }
    if (form.role === 'STUDENT' || editUser?.role === 'STUDENT') {
      if (!form.age) e.age = 'Required';
    }
    return e;
  };

  const openCreate = () => { setEditUser(null); setForm(blank); setFormErrors({}); setShowForm(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', age: '', role: u.role, teacher_id: '' }); setFormErrors({}); setShowForm(true); };
  const cancelForm = () => { setShowForm(false); setEditUser(null); setForm(blank); setFormErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setLoading(true);
    try {
      if (editUser) {
        const payload = { name: form.name };
        if (editUser.role === 'STUDENT' && form.age) payload.age = parseInt(form.age);
        await updateAdminUser(editUser.id, payload);
        Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
      } else {
        const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
        if (form.role === 'STUDENT') {
          payload.age = parseInt(form.age);
          if (form.teacher_id) payload.teacher_id = form.teacher_id;
        }
        await createUser(payload);
        Swal.fire({ icon: 'success', title: `${form.role === 'STUDENT' ? 'Student' : 'Teacher'} Added!`, timer: 1500, showConfirmButton: false });
      }
      cancelForm(); fetchUsers(1);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed';
      if (msg.toLowerCase().includes('email')) setFormErrors(er => ({ ...er, email: 'Email already exists' }));
      else Swal.fire('Error', msg, 'error');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, name, role) => {
    const result = await Swal.fire({
      title: 'Delete user?',
      html: `Remove <strong>${name}</strong> (${role})? All their data will be permanently deleted.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', focusCancel: true,
    });
    if (!result.isConfirmed) return;
    try {
      await deleteAdminUser(id);
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, showConfirmButton: false });
      fetchUsers(1);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const teacherCount = users.filter(u => u.role === 'TEACHER').length;
  const studentCount = users.filter(u => u.role === 'STUDENT').length;

  return (
    <MainLayout>
      <PageHeader
        title="Principal Dashboard"
        subtitle="Manage teachers and students"
        action={
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <PersonAddIcon fontSize="small" /> Add User
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Users" value={meta.total} icon={<PeopleIcon />} color="indigo" />
        <StatCard label="Teachers" value={teacherCount} icon={<PeopleIcon />} color="blue" />
        <StatCard label="Students" value={studentCount} icon={<SchoolIcon />} color="orange" />
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            {editUser ? `Edit — ${editUser.name}` : 'Create New User'}
          </h3>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                <input className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${formErrors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                  placeholder="Full name" value={form.name}
                  onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(er => ({ ...er, name: '' })); }} />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              {!editUser && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400"
                    value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                  </select>
                </div>
              )}

              {!editUser && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input type="email" className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${formErrors.email ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                    placeholder="email@school.com" value={form.email}
                    onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(er => ({ ...er, email: '' })); }} />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>
              )}

              {!editUser && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                  <input type="password" className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${formErrors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                    placeholder="Min 6 chars" value={form.password}
                    onChange={(e) => { setForm(f => ({ ...f, password: e.target.value })); setFormErrors(er => ({ ...er, password: '' })); }} />
                  {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                </div>
              )}

              {(form.role === 'STUDENT' || editUser?.role === 'STUDENT') && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                  <input type="number" className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${formErrors.age ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                    placeholder="Age" min={1} max={120} value={form.age}
                    onChange={(e) => { setForm(f => ({ ...f, age: e.target.value })); setFormErrors(er => ({ ...er, age: '' })); }} />
                  {formErrors.age && <p className="text-red-500 text-xs mt-1">{formErrors.age}</p>}
                </div>
              )}

              {/* Teacher assignment — only when creating a student */}
              {!editUser && form.role === 'STUDENT' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Assign to Teacher <span className="text-slate-400">(optional)</span>
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400"
                    value={form.teacher_id}
                    onChange={(e) => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                  >
                    <option value="">— No teacher assigned —</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>👨‍🏫 {t.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Student will appear in the selected teacher's class</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors">
                {loading ? 'Saving...' : editUser ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={cancelForm}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-800">Users</h3>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">{meta.total}</span>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden ml-2">
              {[['', 'All'], ['TEACHER', 'Teachers'], ['STUDENT', 'Students']].map(([val, label]) => (
                <button key={val}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${roleFilter === val ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  onClick={() => { setRoleFilter(val); setMeta(m => ({ ...m, page: 1 })); }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <input
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 w-52"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setMeta(m => ({ ...m, page: 1 })); }}
          />
        </div>

        {fetching ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  {['#', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">No users found.</td></tr>
                ) : users.map((u, i) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-400">{(meta.page - 1) * meta.limit + i + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{u.name}</td>
                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {u.role === 'TEACHER' ? '👨‍🏫 Teacher' : '🎓 Student'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
                          <EditIcon fontSize="small" />
                        </button>
                        <button onClick={() => handleDelete(u.id, u.name, u.role)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3 border-t border-slate-100">
          <Pagination
            meta={meta}
            onPageChange={(p) => setMeta(m => ({ ...m, page: p }))}
            onLimitChange={(l) => setMeta(m => ({ ...m, limit: l, page: 1 }))}
          />
        </div>
      </div>
    </MainLayout>
  );
}
