import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getProfile, getMyMarks, addMark, getSubjects } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [marks, setMarks] = useState([]);
  const [summary, setSummary] = useState({ total: 0, average: 0 });
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ subject_id: '', score: '', remarks: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProfile().then((r) => setProfile(r.data.data));
    fetchMarks();
    getSubjects().then((r) => setSubjects(r.data));
  }, []);

  const fetchMarks = async () => {
    try {
      const res = await getMyMarks();
      setMarks(res.data.data.marks);
      setSummary(res.data.data.summary);
    } catch { }
  };

  const handleAddMark = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addMark({ subject_id: parseInt(form.subject_id), score: parseFloat(form.score), remarks: form.remarks });
      Swal.fire({ icon: 'success', title: 'Mark saved!', timer: 1500, showConfirmButton: false });
      setForm({ subject_id: '', score: '', remarks: '' });
      fetchMarks();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save mark', 'error');
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = (g) => ({ 'A+': 'success', A: 'success', B: 'primary', C: 'warning', D: 'warning', F: 'danger' }[g] || 'secondary');

  return (
    <div className="min-vh-100" style={{ background: '#f0f2f5' }}>
      <nav className="navbar navbar-dark px-4 py-3" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
        <span className="navbar-brand fw-bold">Student Dashboard</span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white small">{user?.name}</span>
          <button className="btn btn-sm btn-outline-light" onClick={() => { logoutUser(); navigate('/login'); }}>Logout</button>
        </div>
      </nav>

      <div className="container py-4">
        <div className="row g-4">
          {/* Profile Card */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3">My Profile</h6>
                {profile ? (
                  <div>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: 50, height: 50, fontSize: 20 }}>
                        {profile.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-semibold">{profile.name}</div>
                        <div className="text-muted small">{profile.email}</div>
                      </div>
                    </div>
                    <div className="small text-muted">
                      <div>Role: <span className="badge bg-info text-dark">{profile.roles?.name}</span></div>
                      {profile.students && <div className="mt-1">Age: {profile.students.age}</div>}
                    </div>
                  </div>
                ) : <div className="text-muted small">Loading...</div>}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="col-md-8">
            <div className="row g-3 mb-4">
              <div className="col-6">
                <div className="card border-0 shadow-sm rounded-4 text-center p-3">
                  <div className="fs-2 fw-bold text-primary">{summary.total}</div>
                  <div className="text-muted small">Subjects Attempted</div>
                </div>
              </div>
              <div className="col-6">
                <div className="card border-0 shadow-sm rounded-4 text-center p-3">
                  <div className="fs-2 fw-bold text-success">{summary.average}</div>
                  <div className="text-muted small">Average Score</div>
                </div>
              </div>
            </div>

            {/* Add Mark Form */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3">Add / Update Mark</h6>
                <form onSubmit={handleAddMark} className="row g-2">
                  <div className="col-md-4">
                    <select className="form-select form-select-sm" required value={form.subject_id}
                      onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}>
                      <option value="">Select Subject</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input type="number" className="form-control form-control-sm" placeholder="Score (0-100)"
                      required min={0} max={100} value={form.score}
                      onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))} />
                  </div>
                  <div className="col-md-3">
                    <input className="form-control form-control-sm" placeholder="Remarks (optional)" value={form.remarks}
                      onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
                  </div>
                  <div className="col-md-2">
                    <button type="submit" className="btn btn-primary btn-sm w-100" disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm" /> : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 pt-4 px-4">
                <h6 className="fw-bold mb-0">My Marks</h6>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Subject</th>
                      <th>Code</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-4 text-muted">No marks yet</td></tr>
                    ) : marks.map((m) => (
                      <tr key={m.id}>
                        <td className="ps-4 fw-semibold">{m.subjects?.name}</td>
                        <td className="text-muted small">{m.subjects?.code}</td>
                        <td>{m.score}</td>
                        <td><span className={`badge bg-${gradeColor(m.grade)}`}>{m.grade}</span></td>
                        <td className="text-muted small">{m.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
