import React, { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { getStudents, deleteStudent } from '../services/api';
import StudentModal from './StudentModal';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  const fetchStudents = useCallback(async (page = 1, limit = 10, q = '') => {
    setLoading(true);
    try {
      const res = await getStudents(page, limit, q);
      setStudents(res.data.data);
      setMeta(res.data.meta);
    } catch {
      Swal.fire('Error', 'Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(meta.page, meta.limit, search);
  }, [search, meta.page, meta.limit]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setMeta((m) => ({ ...m, page: 1 }));
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete "${name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteStudent(id);
      Swal.fire('Deleted!', 'Student has been deleted.', 'success');
      fetchStudents(meta.page, meta.limit, search);
    } catch {
      Swal.fire('Error', 'Failed to delete student', 'error');
    }
  };

  const handleEdit = (student) => {
    setEditStudent(student);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditStudent(null);
    setShowModal(true);
  };

  const handleModalClose = (refreshed) => {
    setShowModal(false);
    setEditStudent(null);
    if (refreshed) fetchStudents(meta.page, meta.limit, search);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > meta.totalPages) return;
    setMeta((m) => ({ ...m, page: newPage }));
  };

  const handleLimitChange = (e) => {
    setMeta((m) => ({ ...m, limit: parseInt(e.target.value), page: 1 }));
  };

  const renderPagination = () => {
    const pages = [];
    const { page, totalPages } = meta;
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <nav>
        <ul className="pagination pagination-sm mb-0 flex-wrap">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(1)}>First</button>
          </li>
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(page - 1)}>‹</button>
          </li>
          {pages.map((p) => (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(p)}>{p}</button>
            </li>
          ))}
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(page + 1)}>›</button>
          </li>
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(totalPages)}>Last</button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="card shadow-lg border-0 rounded-4">
      <div className="card-header bg-white border-0 rounded-top-4 pt-4 pb-3 px-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h5 className="mb-0 fw-bold text-dark">All Students</h5>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <form onSubmit={handleSearch} className="d-flex gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ minWidth: 220 }}
              />
              <button type="submit" className="btn btn-sm btn-outline-secondary">Search</button>
              {search && (
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setSearch(''); setSearchInput(''); }}>
                  Clear
                </button>
              )}
            </form>
            <button className="btn btn-sm btn-primary px-3" onClick={handleAdd}>
              + Add Student
            </button>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Age</th>
                  <th>Joined</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="ps-4 text-muted">{(meta.page - 1) * meta.limit + idx + 1}</td>
                      <td className="fw-semibold">{s.name}</td>
                      <td className="text-muted">{s.email}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{s.age}</span>
                      </td>
                      <td className="text-muted small">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(s)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(s.id, s.name)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-footer bg-white border-0 px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2 text-muted small">
          <span>Show</span>
          <select className="form-select form-select-sm" style={{ width: 70 }} value={meta.limit} onChange={handleLimitChange}>
            {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>entries &nbsp;|&nbsp; Total: <strong>{meta.total}</strong></span>
        </div>
        {renderPagination()}
      </div>

      {showModal && (
        <StudentModal
          student={editStudent}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
