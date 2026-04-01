import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { createStudent, updateStudent, getStudentById, getSubjects } from '../services/api';

const emptyForm = { name: '', email: '', age: '', marks: [] };

export default function StudentModal({ student, onClose }) {
  const isEdit = !!student;
  const [form, setForm] = useState(emptyForm);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getSubjects().then((res) => setSubjects(res.data));

    if (isEdit) {
      getStudentById(student.id).then((res) => {
        const s = res.data;
        setForm({
          name: s.name,
          email: s.email,
          age: s.age,
          marks: (s.marks || []).map((m) => ({
            subject_id: m.subjects?.id || '',
            subject_name: m.subjects?.name || '',
            score: m.score,
          })),
        });
      });
    }
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.age) e.age = 'Age is required';
    else if (form.age < 1 || form.age > 120) e.age = 'Enter a valid age';
    form.marks.forEach((m, i) => {
      if (!m.subject_id) e[`mark_subject_${i}`] = 'Select subject';
      if (m.score === '' || m.score < 0 || m.score > 100) e[`mark_score_${i}`] = 'Score 0-100';
    });
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const addMark = () => {
    setForm((f) => ({ ...f, marks: [...f.marks, { subject_id: '', score: '' }] }));
  };

  const removeMark = (i) => {
    setForm((f) => ({ ...f, marks: f.marks.filter((_, idx) => idx !== i) }));
  };

  const handleMarkChange = (i, field, value) => {
    setForm((f) => {
      const marks = [...f.marks];
      marks[i] = { ...marks[i], [field]: value };
      return { ...f, marks };
    });
    setErrors((er) => ({ ...er, [`mark_${field}_${i}`]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        age: parseInt(form.age),
        marks: form.marks.map((m) => ({ subject_id: parseInt(m.subject_id), score: parseFloat(m.score) })),
      };

      if (isEdit) {
        await updateStudent(student.id, payload);
        Swal.fire({ icon: 'success', title: 'Updated!', text: 'Student updated successfully.', timer: 1800, showConfirmButton: false });
      } else {
        await createStudent(payload);
        Swal.fire({ icon: 'success', title: 'Created!', text: 'Student added successfully.', timer: 1800, showConfirmButton: false });
      }
      onClose(true);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.error || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <h5 className="modal-title fw-bold">{isEdit ? '✏️ Edit Student' : '➕ Add New Student'}</h5>
            <button type="button" className="btn-close" onClick={() => onClose(false)} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 py-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                  <input
                    name="name"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    placeholder="Enter student name"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                  <input
                    name="email"
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Age <span className="text-danger">*</span></label>
                  <input
                    name="age"
                    type="number"
                    className={`form-control ${errors.age ? 'is-invalid' : ''}`}
                    placeholder="Age"
                    value={form.age}
                    onChange={handleChange}
                    min={1}
                    max={120}
                  />
                  {errors.age && <div className="invalid-feedback">{errors.age}</div>}
                </div>
              </div>

              {/* Marks Section */}
              <div className="mt-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label fw-semibold mb-0">Marks (optional)</label>
                  <button type="button" className="btn btn-sm btn-outline-success" onClick={addMark}>
                    + Add Subject
                  </button>
                </div>
                {form.marks.length === 0 && (
                  <p className="text-muted small">No marks added yet.</p>
                )}
                {form.marks.map((m, i) => (
                  <div key={i} className="row g-2 align-items-start mb-2">
                    <div className="col-6">
                      <select
                        className={`form-select form-select-sm ${errors[`mark_subject_${i}`] ? 'is-invalid' : ''}`}
                        value={m.subject_id}
                        onChange={(e) => handleMarkChange(i, 'subject_id', e.target.value)}
                      >
                        <option value="">Select subject</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {errors[`mark_subject_${i}`] && <div className="invalid-feedback">{errors[`mark_subject_${i}`]}</div>}
                    </div>
                    <div className="col-4">
                      <input
                        type="number"
                        className={`form-control form-control-sm ${errors[`mark_score_${i}`] ? 'is-invalid' : ''}`}
                        placeholder="Score (0-100)"
                        value={m.score}
                        onChange={(e) => handleMarkChange(i, 'score', e.target.value)}
                        min={0}
                        max={100}
                      />
                      {errors[`mark_score_${i}`] && <div className="invalid-feedback">{errors[`mark_score_${i}`]}</div>}
                    </div>
                    <div className="col-2">
                      <button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => removeMark(i)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer border-0 px-4 pb-4">
              <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {isEdit ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
