import { useEffect, useState } from 'react';
import { getMyMarks } from '../../services/api';
import MainLayout from '../../components/MainLayout';
import PageHeader from '../../components/PageHeader';
import GradeBadge from '../../components/GradeBadge';
import StatCard from '../../components/StatCard';
import GradeIcon from '@mui/icons-material/Grade';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';

export default function StudentMarksPage() {
  const [marks, setMarks] = useState([]);
  const [summary, setSummary] = useState({ total: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyMarks()
      .then(res => { setMarks(res.data.data.marks || []); setSummary(res.data.data.summary); })
      .catch(err => setError(err.response?.data?.message || 'Failed to load marks'))
      .finally(() => setLoading(false));
  }, []);

  const getPerf = (avg) => {
    if (avg >= 90) return { label: 'Excellent', cls: 'bg-emerald-100 text-emerald-700' };
    if (avg >= 75) return { label: 'Good', cls: 'bg-blue-100 text-blue-700' };
    if (avg >= 60) return { label: 'Average', cls: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Needs Improvement', cls: 'bg-red-100 text-red-700' };
  };

  if (loading) return (
    <MainLayout>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    </MainLayout>
  );

  if (error) return (
    <MainLayout>
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">Retry</button>
      </div>
    </MainLayout>
  );

  const perf = summary.total > 0 ? getPerf(summary.average) : null;

  return (
    <MainLayout>
      <PageHeader title="My Report Card" subtitle="Your academic marks and grades" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Subjects Graded" value={summary.total} icon={<SchoolIcon />} color="indigo" />
        <StatCard label="Average Score" value={summary.average} icon={<TrendingUpIcon />} color="green" />
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
            <GradeIcon />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium mb-0.5">Performance</p>
            {perf ? (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${perf.cls}`}>{perf.label}</span>
            ) : (
              <span className="text-slate-400 text-sm">No data yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-800">All Marks</h3>
          <span className="text-xs text-slate-400">{marks.length} subjects</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                {['Subject', 'Code', 'Score', 'Grade', "Teacher's Remarks"].map(h => (
                  <th key={h} className="px-6 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {marks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <GradeIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                    <p className="mt-2 text-sm">No marks yet. Your teacher will enter them soon.</p>
                  </td>
                </tr>
              ) : marks.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{m.subjects?.name}</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{m.subjects?.code}</span></td>
                  <td className="px-6 py-4 font-bold text-slate-800">{m.score}</td>
                  <td className="px-6 py-4"><GradeBadge grade={m.grade} /></td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{m.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
