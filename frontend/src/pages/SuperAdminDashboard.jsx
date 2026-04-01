import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getAdmins, createAdmin } from '../services/api';
import MainLayout from '../components/MainLayout';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';

import Pagination from '../components/Pagination';

const blank = { name: '', email: '', password: '' };

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchAdmins = async (page = 1) => {
    setFetching(true);
    try {
      const res = await getAdmins({ page, limit: 10 });
      setAdmins(res.data.data.data || []);
      setMeta(res.data.data.meta);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to load', 'error');
    } finally { setFetching(false); }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 8) e.password = 'Min 8 chars';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await createAdmin(form);
      Swal.fire({ icon: 'success', title: 'Principal Created!', timer: 1800, showConfirmButton: false });
      setForm(blank); setErrors({}); setShowForm(false);
      fetchAdmins();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed';
      if (msg.toLowerCase().includes('email')) setErrors((er) => ({ ...er, email: 'Email already exists' }));
      else Swal.fire('Error', msg, 'error');
    } finally { setLoading(false); }
  };

  return (
    <MainLayout>
      <PageHeader
        title="IT Admin Dashboard"
        subtitle="Manage school principals and system access"
        action={
          <button
            onClick={() => { setShowForm(!showForm); setForm(blank); setErrors({}); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <PersonAddIcon fontSize="small" />
            {showForm ? 'Cancel' : 'Add Principal'}
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard label="Total Principals" value={meta.total} icon={<GroupIcon />} color="indigo" />
        <StatCard label="Active Accounts" value={admins.filter(a => a.is_active).length} icon={<AdminPanelSettingsIcon />} color="green" />
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">New Principal Account</h3>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { field: 'name', label: 'Full Name', type: 'text', placeholder: 'Principal Name' },
                { field: 'email', label: 'Email', type: 'email', placeholder: 'principal@school.com' },
                { field: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters' },
              ].map(({ field, label, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    type={type}
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all
                      ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                    placeholder={placeholder}
                    value={form[field]}
                    onChange={(e) => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(er => ({ ...er, [field]: '' })); }}
                  />
                  {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
                {loading ? 'Creating...' : 'Create Principal'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">All Principals</h3>
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
                  {['#', 'Name', 'Email', 'Status', 'Created'].map(h => (
                    <th key={h} className="px-6 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {admins.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400">No principals yet.</td></tr>
                ) : admins.map((a, i) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-400">{(meta.page - 1) * meta.limit + i + 1}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{a.name}</td>
                    <td className="px-6 py-4 text-slate-500">{a.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100">
            <Pagination
              meta={meta}
              onPageChange={(p) => fetchAdmins(p)}
              onLimitChange={(l) => { setMeta(m => ({ ...m, limit: l, page: 1 })); fetchAdmins(1); }}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
