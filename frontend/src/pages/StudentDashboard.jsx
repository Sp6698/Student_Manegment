import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { getProfile, getMyMarks } from '../services/api';
import MainLayout from '../components/MainLayout';
import StatCard from '../components/StatCard';
import GradeBadge from '../components/GradeBadge';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const SUBJECT_ICONS = {
  'Mathematics': '📐', 'Science': '🔬', 'English': '📖',
  'History': '🏛️', 'Computer Science': '💻',
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [marks, setMarks] = useState([]);
  const [summary, setSummary] = useState({ total: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getProfile(), getMyMarks()])
      .then(([p, m]) => {
        setProfile(p.data.data);
        setMarks(m.data.data.marks || []);
        setSummary(m.data.data.summary);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const getPerf = (avg) => {
    if (avg >= 90) return { label: 'Excellent', emoji: '🏆', color: 'text-emerald-600', bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200' };
    if (avg >= 75) return { label: 'Good', emoji: '⭐', color: 'text-blue-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200' };
    if (avg >= 60) return { label: 'Average', emoji: '📈', color: 'text-yellow-600', bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-200' };
    return { label: 'Needs Improvement', emoji: '💪', color: 'text-red-500', bg: 'from-red-50 to-rose-50', border: 'border-red-200' };
  };

  const bestSubject = marks.length > 0
    ? marks.reduce((best, m) => (!best || parseFloat(m.score) > parseFloat(best.score)) ? m : best, null)
    : null;

  if (loading) return (
    <MainLayout>
      <div className="space-y-6">
        <div className="h-32 bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </MainLayout>
  );

  if (error) return (
    <MainLayout>
      <div className="text-center py-20">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
          Retry
        </button>
      </div>
    </MainLayout>
  );

  const perf = summary.total > 0 ? getPerf(summary.average) : null;

  return (
    <MainLayout>
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl mb-6"
        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)' }}>
        <div className="absolute inset-0 opacity-10 text-8xl flex items-center justify-end pr-8">🎓</div>
        <div className="relative px-8 py-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-orange-100 text-sm font-medium mb-1">Student Portal 🎓</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{user?.name}</h1>
            <p className="text-orange-100 text-sm">
              {summary.total > 0
                ? `${summary.total} subjects graded · Average score: ${summary.average}`
                : 'Your marks will appear here once your teacher enters them'}
            </p>
          </div>
          {perf && (
            <div className={`px-5 py-3 rounded-xl bg-white/20 backdrop-blur text-center`}>
              <div className="text-3xl">{perf.emoji}</div>
              <div className="text-white font-bold text-sm mt-1">{perf.label}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — profile + stats */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                {profile?.name?.[0]?.toUpperCase()}
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{profile?.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{profile?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                🎓 Student
              </span>
            </div>
            {profile?.students && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Age</span>
                  <span className="font-semibold text-slate-800">{profile.students.age}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Enrolled</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(profile.students.enrollment_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <StatCard label="Subjects Graded" value={summary.total} icon={<SchoolIcon />} color="orange" />
          <StatCard label="Average Score" value={summary.average || '—'} icon={<TrendingUpIcon />} color="green" />

          {/* Best subject */}
          {bestSubject && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <EmojiEventsIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Best Subject</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{SUBJECT_ICONS[bestSubject.subjects?.name] || '📝'}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{bestSubject.subjects?.name}</p>
                  <p className="text-xs text-slate-500">{bestSubject.subjects?.code}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-2xl font-black text-amber-600">{bestSubject.score}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — report card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h3 className="font-semibold text-slate-800">My Report Card</h3>
                {marks.length > 0 && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{marks.length}</span>
                )}
              </div>
              <button onClick={() => navigate('/dashboard/marks')}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                Full report <ArrowForwardIcon sx={{ fontSize: 14 }} />
              </button>
            </div>

            {marks.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-slate-500 font-medium">No marks yet</p>
                <p className="text-slate-400 text-sm mt-1">Your teacher will enter your marks soon</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {marks.map(m => {
                  const score = parseFloat(m.score);
                  const pct = score;
                  const barColor = score >= 90 ? '#10b981' : score >= 75 ? '#3b82f6' : score >= 60 ? '#f59e0b' : '#ef4444';

                  return (
                    <div key={m.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl flex-shrink-0">
                          {SUBJECT_ICONS[m.subjects?.name] || '📝'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <span className="text-sm font-semibold text-slate-800">{m.subjects?.name}</span>
                              <span className="ml-2 text-xs text-slate-400">{m.subjects?.code}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-slate-800">{m.score}</span>
                              <GradeBadge grade={m.grade} />
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          {m.remarks && (
                            <p className="text-xs text-slate-400 mt-1 italic">"{m.remarks}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {marks.length > 0 && (
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500">{marks.length} subjects · Class average</span>
                <span className="text-sm font-bold text-indigo-600">{summary.average}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
