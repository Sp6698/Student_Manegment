import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  getMyStudents, getAvailableStudents, assignStudent, unassignStudent,
  saveMark, deleteMark, getSubjects,
} from '../services/api';
import MainLayout from '../components/MainLayout';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import GradeBadge from '../components/GradeBadge';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';

// ── Mark row component (one subject per row in the form) ──────
function MarkRow({ subjects, existingSubjectIds, row, onChange, onRemove, isOnly }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <div className="col-span-4">
        <select
          className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all
            ${row.error_subject ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
          value={row.subject_id}
          onChange={(e) => onChange('subject_id', e.target.value)}
        >
          <option value="">— Subject —</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}
              disabled={existingSubjectIds.includes(String(s.id)) && String(s.id) !== String(row.subject_id)}>
              {s.name}
            </option>
          ))}
        </select>
        {row.error_subject && <p className="text-red-500 text-xs mt-0.5">{row.error_subject}</p>}
      </div>
      <div className="col-span-3">
        <input
          type="number" min={0} max={100}
          className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all
            ${row.error_score ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
          placeholder="Score 0–100"
          value={row.score}
          onChange={(e) => onChange('score', e.target.value)}
        />
        {row.error_score && <p className="text-red-500 text-xs mt-0.5">{row.error_score}</p>}
      </div>
      <div className="col-span-4">
        <input
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400"
          placeholder="Remarks (optional)"
          value={row.remarks}
          onChange={(e) => onChange('remarks', e.target.value)}
        />
      </div>
      <div className="col-span-1 flex justify-center pt-1.5">
        {!isOnly && (
          <button type="button" onClick={onRemove}
            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <CloseIcon fontSize="small" />
          </button>
        )}
      </div>
    </div>
  );
}

const blankRow = () => ({ id: Date.now(), subject_id: '', score: '', remarks: '', error_subject: '', error_score: '' });

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active student for marks panel
  const [activeStudent, setActiveStudent] = useState(null);

  // Multi-row mark form
  const [markRows, setMarkRows] = useState([blankRow()]);
  const [savingMark, setSavingMark] = useState(false);

  // Edit single mark
  const [editingMark, setEditingMark] = useState(null);
  const [editForm, setEditForm] = useState({ score: '', remarks: '' });
  const [editErrors, setEditErrors] = useState({});

  // Add student modal
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Student settings panel
  const [settingsStudent, setSettingsStudent] = useState(null);

  const load = async () => {
    try {
      const [s, sub] = await Promise.all([getMyStudents(), getSubjects()]);
      setStudents(s.data.data || []);
      setSubjects(sub.data.data || []);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to load', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const refreshStudents = async () => {
    const res = await getMyStudents();
    const updated = res.data.data || [];
    setStudents(updated);
    if (activeStudent) setActiveStudent(updated.find(s => s.id === activeStudent.id) || null);
  };

  // ── Student assignment ──────────────────────────────────────

  const openAddStudent = async () => {
    const res = await getAvailableStudents();
    setAvailable(res.data.data || []);
    setSelectedStudentId('');
    setShowAddStudent(true);
  };

  const handleAssign = async () => {
    if (!selectedStudentId) return;
    setAssigning(true);
    try {
      await assignStudent(selectedStudentId);
      Swal.fire({ icon: 'success', title: 'Student Added!', timer: 1500, showConfirmButton: false });
      setShowAddStudent(false);
      load();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    } finally { setAssigning(false); }
  };

  const handleUnassign = async (student) => {
    const r = await Swal.fire({
      title: 'Remove from class?',
      html: `Remove <strong>${student.users?.name}</strong> from your class?<br/><small class="text-slate-500">Their marks will not be deleted.</small>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, remove', focusCancel: true,
    });
    if (!r.isConfirmed) return;
    try {
      await unassignStudent(student.id);
      if (activeStudent?.id === student.id) setActiveStudent(null);
      setSettingsStudent(null);
      load();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    }
  };

  // ── Multi-row mark form ─────────────────────────────────────

  const updateRow = (idx, field, value) => {
    setMarkRows(rows => rows.map((r, i) => i === idx
      ? { ...r, [field]: value, [`error_${field === 'subject_id' ? 'subject' : field}`]: '' }
      : r
    ));
  };

  const addRow = () => setMarkRows(rows => [...rows, blankRow()]);

  const removeRow = (idx) => setMarkRows(rows => rows.filter((_, i) => i !== idx));

  const validateRows = () => {
    let valid = true;
    const updated = markRows.map(r => {
      const e = { ...r };
      if (!r.subject_id) { e.error_subject = 'Required'; valid = false; }
      if (r.score === '') { e.error_score = 'Required'; valid = false; }
      else if (r.score < 0 || r.score > 100) { e.error_score = '0–100'; valid = false; }
      return e;
    });
    // Check duplicate subjects in form
    const ids = updated.map(r => r.subject_id).filter(Boolean);
    if (new Set(ids).size !== ids.length) {
      Swal.fire('Duplicate Subject', 'Each subject can only appear once.', 'warning');
      valid = false;
    }
    setMarkRows(updated);
    return valid;
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!validateRows()) return;
    setSavingMark(true);
    try {
      await Promise.all(markRows.map(r =>
        saveMark({
          student_id: activeStudent.id,
          subject_id: parseInt(r.subject_id),
          score: parseFloat(r.score),
          remarks: r.remarks.trim(),
        })
      ));
      Swal.fire({ icon: 'success', title: `${markRows.length} mark(s) saved!`, timer: 1500, showConfirmButton: false });
      setMarkRows([blankRow()]);
      refreshStudents();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save', 'error');
    } finally { setSavingMark(false); }
  };

  // ── Edit single existing mark ───────────────────────────────

  const startEdit = (mark) => {
    setEditingMark(mark);
    setEditForm({ score: mark.score, remarks: mark.remarks || '' });
    setEditErrors({});
  };

  const handleUpdateMark = async (e) => {
    e.preventDefault();
    const errs = {};
    if (editForm.score === '') errs.score = 'Required';
    else if (editForm.score < 0 || editForm.score > 100) errs.score = '0–100';
    if (Object.keys(errs).length) { setEditErrors(errs); return; }

    setSavingMark(true);
    try {
      await saveMark({
        student_id: activeStudent.id,
        subject_id: editingMark.subjects.id,
        score: parseFloat(editForm.score),
        remarks: editForm.remarks.trim(),
      });
      Swal.fire({ icon: 'success', title: 'Mark Updated!', timer: 1200, showConfirmButton: false });
      setEditingMark(null);
      refreshStudents();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    } finally { setSavingMark(false); }
  };

  const handleDeleteMark = async (mark) => {
    const r = await Swal.fire({
      title: 'Delete mark?',
      html: `Delete <strong>${mark.subjects?.name}</strong> score (${mark.score})?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', focusCancel: true,
    });
    if (!r.isConfirmed) return;
    try {
      await deleteMark(mark.id);
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false });
      refreshStudents();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    }
  };

  const totalMarks = students.reduce((sum, s) => sum + (s.marks?.length || 0), 0);

  // Already-entered subject IDs for active student (to disable in add form)
  const enteredSubjectIds = (activeStudent?.marks || []).map(m => String(m.subjects?.id));
  const selectedInForm = markRows.map(r => String(r.subject_id)).filter(Boolean);

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
        title="Teacher Dashboard"
        subtitle="Manage your students and their marks"
        action={
          <button onClick={openAddStudent}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <PersonAddIcon fontSize="small" /> Add Student
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="My Students" value={students.length} icon={<SchoolIcon />} color="blue" />
        <StatCard label="Marks Entered" value={totalMarks} icon={<GradeIcon />} color="green" />
        <StatCard label="Subjects" value={subjects.length} icon={<GradeIcon />} color="orange" />
      </div>

      {/* Add student modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-slate-800">Add Student to Class</h3>
              <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-slate-600"><CloseIcon /></button>
            </div>
            {available.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">All students are already assigned to a teacher.</p>
            ) : (
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 mb-5"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">— Select a student —</option>
                {available.map(s => (
                  <option key={s.id} value={s.id}>{s.users?.name} ({s.users?.email})</option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <button disabled={!selectedStudentId || assigning} onClick={handleAssign}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors">
                {assigning ? 'Assigning...' : 'Assign to My Class'}
              </button>
              <button onClick={() => setShowAddStudent(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student settings panel */}
      {settingsStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold text-slate-800">Student Settings</h3>
              <button onClick={() => setSettingsStudent(null)} className="text-slate-400 hover:text-slate-600"><CloseIcon /></button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                {settingsStudent.users?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{settingsStudent.users?.name}</p>
                <p className="text-xs text-slate-400">{settingsStudent.users?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500">Age</span>
                <span className="font-medium text-slate-800">{settingsStudent.age}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500">Marks entered</span>
                <span className="font-medium text-slate-800">{settingsStudent.marks?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500">Average score</span>
                <span className="font-medium text-slate-800">{settingsStudent.average ?? '—'}</span>
              </div>
            </div>
            <button
              onClick={() => handleUnassign(settingsStudent)}
              className="w-full mt-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors border border-red-200"
            >
              Remove from My Class
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Student list ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800">My Students ({students.length})</h3>
            </div>
            {students.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <SchoolIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                <p className="mt-2 text-sm">No students yet.</p>
                <button onClick={openAddStudent}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                  Add Student
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {students.map(s => {
                  const isActive = activeStudent?.id === s.id;
                  return (
                    <div key={s.id}
                      onClick={() => { setActiveStudent(s); setMarkRows([blankRow()]); setEditingMark(null); }}
                      className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors
                        ${isActive ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>{s.users?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{s.users?.email}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Age {s.age}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s.marks?.length || 0} marks</span>
                          {s.average !== null && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Avg {s.average}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSettingsStudent(s); }}
                        className={`ml-2 p-1.5 rounded-lg transition-colors flex-shrink-0
                          ${isActive ? 'text-indigo-400 hover:bg-indigo-100' : 'text-slate-400 hover:bg-slate-100'}`}
                        title="Student settings"
                      >
                        <SettingsIcon fontSize="small" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Marks panel ── */}
        <div className="lg:col-span-3">
          {!activeStudent ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center h-64">
              <div className="text-center text-slate-400">
                <GradeIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                <p className="mt-2 text-sm">Select a student to manage their marks</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{activeStudent.users?.name}</h3>
                  <p className="text-xs text-slate-400">{activeStudent.users?.email} · Age {activeStudent.age}</p>
                  {activeStudent.average !== null && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                      Average: {activeStudent.average}
                    </span>
                  )}
                </div>
                <button onClick={() => setActiveStudent(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <CloseIcon fontSize="small" />
                </button>
              </div>

              {/* Add marks form — multi-subject */}
              {!editingMark && (
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add Marks</h4>
                    <button type="button" onClick={addRow}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                      <AddIcon fontSize="small" /> Add Subject
                    </button>
                  </div>
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 mb-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
                    <div className="col-span-4">Subject</div>
                    <div className="col-span-3">Score</div>
                    <div className="col-span-4">Remarks</div>
                    <div className="col-span-1" />
                  </div>
                  <form onSubmit={handleSaveMarks} noValidate className="space-y-2">
                    {markRows.map((row, idx) => (
                      <MarkRow
                        key={row.id}
                        subjects={subjects}
                        existingSubjectIds={[...enteredSubjectIds, ...selectedInForm.filter((_, i) => i !== idx)]}
                        row={row}
                        onChange={(field, val) => updateRow(idx, field, val)}
                        onRemove={() => removeRow(idx)}
                        isOnly={markRows.length === 1}
                      />
                    ))}
                    <div className="pt-2">
                      <button type="submit" disabled={savingMark}
                        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors">
                        <CheckIcon fontSize="small" />
                        {savingMark ? 'Saving...' : `Save ${markRows.length > 1 ? `${markRows.length} Marks` : 'Mark'}`}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Edit single mark form */}
              {editingMark && (
                <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      Editing — {editingMark.subjects?.name}
                    </h4>
                    <button onClick={() => setEditingMark(null)} className="text-amber-500 hover:text-amber-700">
                      <CloseIcon fontSize="small" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateMark} noValidate>
                    <div className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-4">
                        <input disabled value={editingMark.subjects?.name}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-500" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" min={0} max={100}
                          className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${editErrors.score ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-indigo-400'}`}
                          value={editForm.score}
                          onChange={(e) => { setEditForm(f => ({ ...f, score: e.target.value })); setEditErrors({}); }} />
                        {editErrors.score && <p className="text-red-500 text-xs mt-0.5">{editErrors.score}</p>}
                      </div>
                      <div className="col-span-4">
                        <input className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400"
                          placeholder="Remarks" value={editForm.remarks}
                          onChange={(e) => setEditForm(f => ({ ...f, remarks: e.target.value }))} />
                      </div>
                      <div className="col-span-1 pt-1.5">
                        <button type="submit" disabled={savingMark}
                          className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-60 transition-colors">
                          <CheckIcon fontSize="small" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Existing marks table */}
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
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                          No marks yet. Use the form above to add marks.
                        </td>
                      </tr>
                    ) : activeStudent.marks.map(m => (
                      <tr key={m.id}
                        className={`hover:bg-slate-50 transition-colors ${editingMark?.id === m.id ? 'bg-amber-50' : ''}`}>
                        <td className="px-5 py-3 font-medium text-slate-800">{m.subjects?.name}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{m.subjects?.code}</span>
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-800">{m.score}</td>
                        <td className="px-5 py-3"><GradeBadge grade={m.grade} /></td>
                        <td className="px-5 py-3 text-slate-400 text-xs max-w-[120px] truncate">{m.remarks || '—'}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(m)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit">
                              <EditIcon fontSize="small" />
                            </button>
                            <button onClick={() => handleDeleteMark(m)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                              <DeleteIcon fontSize="small" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {activeStudent.marks?.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                  <span>{activeStudent.marks.length} subject(s) graded</span>
                  <span>Average: <strong className="text-slate-600">{activeStudent.average ?? '—'}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
