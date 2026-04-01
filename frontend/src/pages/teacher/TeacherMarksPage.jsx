import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getMyStudents, getSubjects, saveMark, deleteMark } from '../../services/api';
import MainLayout from '../../components/MainLayout';
import PageHeader from '../../components/PageHeader';
import GradeBadge from '../../components/GradeBadge';
import GradeIcon from '@mui/icons-material/Grade';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';

import Pagination from '../../components/Pagination';

const blankRow = () => ({ id: Date.now() + Math.random(), subject_id: '', score: '', remarks: '', err_sub: '', err_score: '' });

export default function TeacherMarksPage() {
  const { studentId } = useParams(); // pre-select if coming from student card
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [studentsMeta, setStudentsMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [studentSearch, setStudentSearch] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStudentId, setActiveStudentId] = useState(studentId || '');
  const [markRows, setMarkRows] = useState([blankRow()]);
  const [saving, setSaving] = useState(false);
  const [editingMark, setEditingMark] = useState(null);
  const [editForm, setEditForm] = useState({ score: '', remarks: '' });

  const load = async (page = studentsMeta.page, lim = studentsMeta.limit, q = studentSearch) => {
    setLoading(true);
    try {
      const [s, sub] = await Promise.all([
        getMyStudents({ page, limit: lim, search: q }),
        getSubjects(),
      ]);
      const loadedStudents = s.data.data.data || [];
      setStudents(loadedStudents);
      setStudentsMeta(s.data.data.meta);
      setSubjects(sub.data.data || []);
      if (studentId) {
        const found = loadedStudents.find(st => st.id === studentId);
        if (found) setActiveStudentId(studentId);
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const activeStudent = students.find(s => s.id === activeStudentId) || null;
  const enteredSubIds = (activeStudent?.marks || []).map(m => String(m.subjects?.id));

  const updateRow = (idx, field, val) => setMarkRows(rows =>
    rows.map((r, i) => i === idx ? { ...r, [field]: val, [`err_${field === 'subject_id' ? 'sub' : 'score'}`]: '' } : r)
  );

  const validateRows = () => {
    let ok = true;
    const updated = markRows.map(r => {
      const e = { ...r };
      if (!r.subject_id) { e.err_sub = 'Required'; ok = false; }
      if (r.score === '') { e.err_score = 'Required'; ok = false; }
      else if (r.score < 0 || r.score > 100) { e.err_score = '0–100'; ok = false; }
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeStudentId) { Swal.fire('Select a student first', '', 'warning'); return; }
    if (!validateRows()) return;
    setSaving(true);
    try {
      await Promise.all(markRows.map(r => saveMark({
        student_id: activeStudent.id,
        subject_id: parseInt(r.subject_id),
        score: parseFloat(r.score),
        remarks: r.remarks.trim(),
      })));
      Swal.fire({ icon: 'success', title: `${markRows.length} mark(s) saved!`, timer: 1500, showConfirmButton: false });
      setMarkRows([blankRow()]);
      load();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editForm.score || editForm.score < 0 || editForm.score > 100) return;
    setSaving(true);
    try {
      await saveMark({ student_id: activeStudent.id, subject_id: editingMark.subjects.id, score: parseFloat(editForm.score), remarks: editForm.remarks });
      Swal.fire({ icon: 'success', title: 'Updated!', timer: 1200, showConfirmButton: false });
      setEditingMark(null);
      load();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (mark) => {
    const r = await Swal.fire({
      title: 'Delete mark?', html: `Delete <strong>${mark.subjects?.name}</strong> (${mark.score})?`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', focusCancel: true,
    });
    if (!r.isConfirmed) return;
    try {
      await deleteMark(mark.id);
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
      load();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    }
  };

  if (loading) return (
    <MainLayout>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <PageHeader
        title={studentId && activeStudent ? `Marks — ${activeStudent.users?.name}` : 'Manage Marks'}
        subtitle={studentId && activeStudent ? activeStudent.users?.email : 'Enter and update student marks'}
        action={
          studentId ? (
            <button onClick={() => navigate('/teacher/students')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
              <ArrowBackIcon fontSize="small" /> Back to Students
            </button>
          ) : null
        }
      />

      <div className={`grid gap-6 ${studentId ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Student selector — hidden when coming from a specific student URL */}
        {!studentId && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Select Student</h3>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-slate-50"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => { setStudentSearch(e.target.value); load(1, studentsMeta.limit, e.target.value); }}
                />
              </div>
              <div className="divide-y divide-slate-50">
                {students.map(s => (
                  <button key={s.id} onClick={() => { setActiveStudentId(s.id); setMarkRows([blankRow()]); setEditingMark(null); }}
                    className={`w-full text-left px-5 py-3.5 transition-colors border-l-4
                      ${activeStudentId === s.id ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-slate-50 border-transparent'}`}>
                    <p className={`text-sm font-semibold ${activeStudentId === s.id ? 'text-indigo-700' : 'text-slate-800'}`}>{s.users?.name}</p>
                    <p className="text-xs text-slate-400">{s.marks?.length || 0} marks · Avg {s.average ?? '—'}</p>
                  </button>
                ))}
              </div>
              {studentsMeta.totalPages > 1 && (
                <div className="px-3 py-2 border-t border-slate-100">
                  <Pagination
                    meta={studentsMeta}
                    onPageChange={(p) => load(p, studentsMeta.limit, studentSearch)}
                    onLimitChange={(l) => load(1, l, studentSearch)}
                    showLimitSelector={false}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Marks panel */}
        <div className={studentId ? 'col-span-1' : 'lg:col-span-2'}>
          {!activeStudent ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center h-64">
              <div className="text-center text-slate-400">
                <GradeIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                <p className="mt-2 text-sm">Select a student from the left</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add marks form */}
              {!editingMark && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-slate-800">
                      Add Marks for <span className="text-indigo-600">{activeStudent.users?.name}</span>
                    </h4>
                    <button onClick={() => setMarkRows(r => [...r, blankRow()])}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                      <AddIcon fontSize="small" /> Add Row
                    </button>
                  </div>
                  <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    <div className="col-span-4">Subject</div>
                    <div className="col-span-3">Score</div>
                    <div className="col-span-4">Remarks</div>
                    <div className="col-span-1" />
                  </div>
                  <form onSubmit={handleSave} noValidate className="space-y-2">
                    {markRows.map((row, idx) => (
                      <div key={row.id} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-4">
                          <select className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${row.err_sub ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400'}`}
                            value={row.subject_id} onChange={(e) => updateRow(idx, 'subject_id', e.target.value)}>
                            <option value="">— Subject —</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}
                                disabled={enteredSubIds.includes(String(s.id)) && String(s.id) !== String(row.subject_id)}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          {row.err_sub && <p className="text-red-500 text-xs mt-0.5">{row.err_sub}</p>}
                        </div>
                        <div className="col-span-3">
                          <input type="number" min={0} max={100}
                            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${row.err_score ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400'}`}
                            placeholder="0–100" value={row.score} onChange={(e) => updateRow(idx, 'score', e.target.value)} />
                          {row.err_score && <p className="text-red-500 text-xs mt-0.5">{row.err_score}</p>}
                        </div>
                        <div className="col-span-4">
                          <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400"
                            placeholder="Remarks (optional)" value={row.remarks} onChange={(e) => updateRow(idx, 'remarks', e.target.value)} />
                        </div>
                        <div className="col-span-1 flex justify-center pt-2">
                          {markRows.length > 1 && (
                            <button type="button" onClick={() => setMarkRows(r => r.filter((_, i) => i !== idx))}
                              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <CloseIcon fontSize="small" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-2 mt-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors">
                      <CheckIcon fontSize="small" />
                      {saving ? 'Saving...' : `Save ${markRows.length > 1 ? `${markRows.length} Marks` : 'Mark'}`}
                    </button>
                  </form>
                </div>
              )}

              {/* Edit form */}
              {editingMark && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-amber-800">Editing — {editingMark.subjects?.name}</h4>
                    <button onClick={() => setEditingMark(null)} className="text-amber-500 hover:text-amber-700"><CloseIcon fontSize="small" /></button>
                  </div>
                  <form onSubmit={handleUpdate} noValidate>
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <input disabled value={editingMark.subjects?.name}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-500" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" min={0} max={100}
                          className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm outline-none focus:border-amber-500"
                          value={editForm.score} onChange={(e) => setEditForm(f => ({ ...f, score: e.target.value }))} />
                      </div>
                      <div className="col-span-4">
                        <input className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm outline-none focus:border-amber-500"
                          placeholder="Remarks" value={editForm.remarks} onChange={(e) => setEditForm(f => ({ ...f, remarks: e.target.value }))} />
                      </div>
                      <div className="col-span-1">
                        <button type="submit" disabled={saving}
                          className="w-full p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-60 transition-colors">
                          <CheckIcon fontSize="small" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Marks table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-slate-800">Current Marks</h4>
                  {activeStudent.average !== null && (
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                      Average: {activeStudent.average}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                      <tr>
                        {['Subject', 'Code', 'Score', 'Grade', 'Remarks', ''].map(h => (
                          <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(!activeStudent.marks || activeStudent.marks.length === 0) ? (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">No marks yet.</td></tr>
                      ) : activeStudent.marks.map(m => (
                        <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${editingMark?.id === m.id ? 'bg-amber-50' : ''}`}>
                          <td className="px-5 py-3 font-medium text-slate-800">{m.subjects?.name}</td>
                          <td className="px-5 py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{m.subjects?.code}</span></td>
                          <td className="px-5 py-3 font-bold text-slate-800">{m.score}</td>
                          <td className="px-5 py-3"><GradeBadge grade={m.grade} /></td>
                          <td className="px-5 py-3 text-slate-400 text-xs">{m.remarks || '—'}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingMark(m); setEditForm({ score: m.score, remarks: m.remarks || '' }); }}
                                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"><EditIcon fontSize="small" /></button>
                              <button onClick={() => handleDelete(m)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><DeleteIcon fontSize="small" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
