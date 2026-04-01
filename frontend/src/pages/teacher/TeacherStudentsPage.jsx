import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  getMyStudents, getAvailableStudents, assignStudent, unassignStudent,
  createStudentAsTeacher, getSubjects,
} from '../../services/api';
import MainLayout from '../../components/MainLayout';
import PageHeader from '../../components/PageHeader';
import GradeBadge from '../../components/GradeBadge';
import SchoolIcon from '@mui/icons-material/School';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import GradeIcon from '@mui/icons-material/Grade';
import { useNavigate } from 'react-router-dom';

import Pagination from '../../components/Pagination';

const blankInfo = { name: '', email: '', password: '', age: '' };
const blankInfoErr = { name: '', email: '', password: '', age: '' };
const blankMarkRow = () => ({ id: Date.now() + Math.random(), subject_id: '', score: '', remarks: '' });

export default function TeacherStudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 9, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'create' | 'assign' | 'settings'
  const [settingsStudent, setSettingsStudent] = useState(null);

  // Assign existing
  const [available, setAvailable] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Create new student
  const [info, setInfo] = useState(blankInfo);
  const [infoErr, setInfoErr] = useState(blankInfoErr);
  const [markRows, setMarkRows] = useState([]);
  const [creating, setCreating] = useState(false);

  const load = async (page = meta.page, lim = meta.limit, q = search) => {
    setLoading(true);
    try {
      const [s, sub] = await Promise.all([
        getMyStudents({ page, limit: lim, search: q }),
        getSubjects(),
      ]);
      setStudents(s.data.data.data || []);
      setMeta(s.data.data.meta);
      setSubjects(sub.data.data || []);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to load', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(1, meta.limit, search); }, []);

  const handleSearch = (q) => { setSearch(q); load(1, meta.limit, q); };
  const handlePageChange = (p) => { setMeta(m => ({ ...m, page: p })); load(p, meta.limit, search); };
  const handleLimitChange = (l) => { setMeta(m => ({ ...m, limit: l, page: 1 })); load(1, l, search); };

  // ── Assign existing ──────────────────────────────────────────
  const openAssign = async () => {
    const res = await getAvailableStudents();
    setAvailable(res.data.data || []);
    setSelectedId('');
    setModal('assign');
  };

  const handleAssign = async () => {
    if (!selectedId) return;
    setAssigning(true);
    try {
      await assignStudent(selectedId);
      Swal.fire({ icon: 'success', title: 'Student Added!', timer: 1500, showConfirmButton: false });
      setModal(null); load(1, meta.limit, search);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    } finally { setAssigning(false); }
  };

  // ── Create new student ───────────────────────────────────────
  const openCreate = () => {
    setInfo(blankInfo); setInfoErr(blankInfoErr); setMarkRows([]); setModal('create');
  };

  const setField = (field) => (e) => {
    setInfo(f => ({ ...f, [field]: e.target.value }));
    setInfoErr(er => ({ ...er, [field]: '' }));
  };

  const updateMarkRow = (idx, field, val) =>
    setMarkRows(rows => rows.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const validateCreate = () => {
    const e = {};
    if (!info.name.trim()) e.name = 'Required';
    if (!info.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(info.email)) e.email = 'Invalid email';
    if (!info.password) e.password = 'Required';
    else if (info.password.length < 6) e.password = 'Min 6 chars';
    if (!info.age) e.age = 'Required';
    else if (info.age < 1 || info.age > 120) e.age = 'Invalid';
    return e;
  };

  const validateMarkRows = () => {
    let ok = true;
    const updated = markRows.map(r => {
      const e = { ...r };
      if (!r.subject_id) { e.err_sub = 'Select subject'; ok = false; } else { e.err_sub = ''; }
      if (r.score === '') { e.err_score = 'Required'; ok = false; }
      else if (r.score < 0 || r.score > 100) { e.err_score = '0–100'; ok = false; }
      else { e.err_score = ''; }
      return e;
    });
    const ids = updated.map(r => r.subject_id).filter(Boolean);
    if (new Set(ids).size !== ids.length) {
      Swal.fire('Duplicate Subject', 'Each subject can only appear once.', 'warning');
      ok = false;
    }
    setMarkRows(updated);
    return ok;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = validateCreate();
    if (Object.keys(errs).some(k => errs[k])) { setInfoErr(errs); return; }
    if (markRows.length > 0 && !validateMarkRows()) return;

    setCreating(true);
    try {
      const payload = {
        name: info.name.trim(),
        email: info.email.trim(),
        password: info.password,
        age: parseInt(info.age),
        marks: markRows
          .filter(r => r.subject_id && r.score !== '')
          .map(r => ({ subject_id: parseInt(r.subject_id), score: parseFloat(r.score), remarks: r.remarks.trim() })),
      };
      await createStudentAsTeacher(payload);
      Swal.fire({
        icon: 'success',
        title: 'Student Created!',
        text: `${info.name} has been added to your class${payload.marks.length > 0 ? ` with ${payload.marks.length} mark(s)` : ''}.`,
        timer: 2000,
        showConfirmButton: false,
      });
      setModal(null); load(1, meta.limit, search);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed';
      if (msg.toLowerCase().includes('email')) setInfoErr(er => ({ ...er, email: 'Email already exists' }));
      else Swal.fire('Error', msg, 'error');
    } finally { setCreating(false); }
  };

  // ── Unassign ─────────────────────────────────────────────────
  const handleUnassign = async (student) => {
    const r = await Swal.fire({
      title: 'Remove from class?',
      html: `Remove <strong>${student.users?.name}</strong>?<br/><small class="text-slate-500">Their marks will not be deleted.</small>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Remove', focusCancel: true,
    });
    if (!r.isConfirmed) return;
    try {
      await unassignStudent(student.id);
      setModal(null); setSettingsStudent(null); load(1, meta.limit, search);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    }
  };

  // Already-selected subject IDs in the mark rows (to disable duplicates)
  const selectedSubIds = markRows.map(r => String(r.subject_id)).filter(Boolean);

  return (
    <MainLayout>
      <PageHeader
        title="My Students"
        subtitle="Students assigned to your class"
        action={
          <div className="flex gap-2">
            <button onClick={openAssign}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
              <LinkIcon fontSize="small" /> Assign Existing
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
              <PersonAddIcon fontSize="small" /> Add New Student
            </button>
          </div>
        }
      />

      {/* ── Create student modal ── */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">Create New Student</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600"><CloseIcon /></button>
            </div>

            <form onSubmit={handleCreate} noValidate>
              {/* Basic info */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Student Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                    <input type="text"
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all
                        ${infoErr.name ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                      placeholder="Student full name" value={info.name} onChange={setField('name')} />
                    {infoErr.name && <p className="text-red-500 text-xs mt-1">{infoErr.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                    <input type="email"
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all
                        ${infoErr.email ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                      placeholder="student@school.com" value={info.email} onChange={setField('email')} />
                    {infoErr.email && <p className="text-red-500 text-xs mt-1">{infoErr.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
                    <input type="number" min={1} max={120}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all
                        ${infoErr.age ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                      placeholder="e.g. 16" value={info.age} onChange={setField('age')} />
                    {infoErr.age && <p className="text-red-500 text-xs mt-1">{infoErr.age}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                    <input type="password"
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all
                        ${infoErr.password ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                      placeholder="Min 6 characters" value={info.password} onChange={setField('password')} />
                    {infoErr.password && <p className="text-red-500 text-xs mt-1">{infoErr.password}</p>}
                  </div>
                </div>
              </div>

              {/* Marks section */}
              <div className="px-6 pb-5 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <GradeIcon fontSize="small" className="text-slate-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Initial Marks</p>
                    <span className="text-xs text-slate-400">(optional)</span>
                  </div>
                  <button type="button"
                    onClick={() => setMarkRows(r => [...r, blankMarkRow()])}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                    <AddIcon fontSize="small" /> Add Subject
                  </button>
                </div>

                {markRows.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-xl">
                    No marks added. You can add them later from the Marks page.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* Column headers */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">
                      <div className="col-span-5">Subject</div>
                      <div className="col-span-3">Score</div>
                      <div className="col-span-3">Remarks</div>
                      <div className="col-span-1" />
                    </div>
                    {markRows.map((row, idx) => (
                      <div key={row.id} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-5">
                          <select
                            className={`w-full px-2.5 py-2 rounded-lg border text-sm outline-none
                              ${row.err_sub ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400'}`}
                            value={row.subject_id}
                            onChange={(e) => updateMarkRow(idx, 'subject_id', e.target.value)}>
                            <option value="">— Subject —</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}
                                disabled={selectedSubIds.includes(String(s.id)) && String(s.id) !== String(row.subject_id)}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          {row.err_sub && <p className="text-red-500 text-xs mt-0.5">{row.err_sub}</p>}
                        </div>
                        <div className="col-span-3">
                          <input type="number" min={0} max={100}
                            className={`w-full px-2.5 py-2 rounded-lg border text-sm outline-none
                              ${row.err_score ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400'}`}
                            placeholder="0–100" value={row.score}
                            onChange={(e) => updateMarkRow(idx, 'score', e.target.value)} />
                          {row.err_score && <p className="text-red-500 text-xs mt-0.5">{row.err_score}</p>}
                        </div>
                        <div className="col-span-3">
                          <input className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400"
                            placeholder="Optional" value={row.remarks}
                            onChange={(e) => updateMarkRow(idx, 'remarks', e.target.value)} />
                        </div>
                        <div className="col-span-1 flex justify-center pt-2">
                          <button type="button"
                            onClick={() => setMarkRows(r => r.filter((_, i) => i !== idx))}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <CloseIcon fontSize="small" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-2">
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors">
                  {creating ? 'Creating...' : `Create Student${markRows.length > 0 ? ` + ${markRows.length} Mark(s)` : ''}`}
                </button>
                <button type="button" onClick={() => setModal(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign existing modal ── */}
      {modal === 'assign' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-slate-800">Assign Existing Student</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600"><CloseIcon /></button>
            </div>
            {available.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No unassigned students available.</p>
            ) : (
              <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 mb-5"
                value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                <option value="">— Select a student —</option>
                {available.map(s => <option key={s.id} value={s.id}>{s.users?.name} ({s.users?.email})</option>)}
              </select>
            )}
            <div className="flex gap-2">
              <button disabled={!selectedId || assigning} onClick={handleAssign}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors">
                {assigning ? 'Assigning...' : 'Assign to My Class'}
              </button>
              <button onClick={() => setModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student settings modal ── */}
      {modal === 'settings' && settingsStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-slate-800">Student Settings</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600"><CloseIcon /></button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold">
                {settingsStudent.users?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{settingsStudent.users?.name}</p>
                <p className="text-xs text-slate-400">{settingsStudent.users?.email}</p>
              </div>
            </div>
            <div className="space-y-0 text-sm mb-5">
              {[
                ['Age', settingsStudent.age],
                ['Marks entered', settingsStudent.marks?.length || 0],
                ['Average score', settingsStudent.average ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-slate-100">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => { setModal(null); navigate(`/teacher/marks/${settingsStudent.id}`); }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
                View / Manage Marks
              </button>
              <button onClick={() => handleUnassign(settingsStudent)}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors border border-red-200">
                Remove from My Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student grid ── */}
      {/* Search bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            placeholder="Search students..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        </div>
        <span className="text-sm text-slate-500">{meta.total} student{meta.total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16">
          <SchoolIcon sx={{ fontSize: 56, color: '#cbd5e1' }} />
          <h3 className="text-slate-600 font-semibold mt-3">No students yet</h3>
          <p className="text-slate-400 text-sm mt-1">Create a new student or assign an existing one.</p>
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={openAssign}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Assign Existing
            </button>
            <button onClick={openCreate}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              Add New Student
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold text-lg">
                    {s.users?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{s.users?.name}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[140px]">{s.users?.email}</p>
                  </div>
                </div>
                <button onClick={() => { setSettingsStudent(s); setModal('settings'); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  <SettingsIcon fontSize="small" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-slate-800">{s.age}</p>
                  <p className="text-xs text-slate-400">Age</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-indigo-600">{s.marks?.length || 0}</p>
                  <p className="text-xs text-slate-400">Marks</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-600">{s.average ?? '—'}</p>
                  <p className="text-xs text-slate-400">Avg</p>
                </div>
              </div>

              {/* Mark badges */}
              {s.marks?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {s.marks.slice(0, 3).map(m => (
                    <div key={m.id} className="flex items-center gap-1 bg-slate-50 rounded-lg px-2 py-1">
                      <span className="text-xs text-slate-500">{m.subjects?.code}</span>
                      <GradeBadge grade={m.grade} />
                    </div>
                  ))}
                  {s.marks.length > 3 && (
                    <span className="text-xs text-slate-400 px-2 py-1">+{s.marks.length - 3} more</span>
                  )}
                </div>
              )}

              {/* Manage marks button */}
              <button
                onClick={() => navigate(`/teacher/marks/${s.id}`)}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors border border-indigo-100">
                {s.marks?.length > 0 ? 'View / Edit Marks' : 'Add Marks'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
          <Pagination
            meta={meta}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      )}
    </MainLayout>
  );
}
