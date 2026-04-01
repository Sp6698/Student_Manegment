import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyStudents, getEnteredMarks, getSubjects } from '../../services/api';
import MainLayout from '../../components/MainLayout';
import StatCard from '../../components/StatCard';
import GradeBadge from '../../components/GradeBadge';
import { useAuth } from '../../context/AuthContext';
import GroupIcon from '@mui/icons-material/Group';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const SUBJECT_ICONS = {
  'Mathematics': '📐', 'Math': '📐',
  'Science': '🔬',
  'English': '📖',
  'History': '🏛️',
  'Computer Science': '💻',
};

export default function TeacherHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [recentMarks, setRecentMarks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyStudents({ page: 1, limit: 100 }), getEnteredMarks({ page: 1, limit: 6 }), getSubjects()])
      .then(([s, m, sub]) => {
        // getMyStudents now returns paginated { data: [...], meta: {} }
        setStudents(s.data.data.data || []);
        // getEnteredMarks now returns paginated { data: [...], meta: {} }
        setRecentMarks(m.data.data.data || []);
        setSubjects(sub.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalMarks = students.reduce((sum, s) => sum + (s.marks?.length || 0), 0);
  const allScores = students.flatMap(s => s.marks || []).map(m => parseFloat(m.score));
  const avgScore = allScores.length > 0
    ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
    : null;

  // Top performer
  const topStudent = students.length > 0
    ? students.reduce((best, s) => (!best || (s.average ?? 0) > (best.average ?? 0)) ? s : best, null)
    : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return (
    <MainLayout>
      <div className="space-y-6">
        <div className="h-32 bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl mb-6"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 text-8xl">🎓</div>
          <div className="absolute bottom-2 right-32 text-5xl">📚</div>
        </div>
        <div className="relative px-8 py-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">{greeting} 👋</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {user?.name}
            </h1>
            <p className="text-indigo-200 text-sm">
              You have <span className="text-white font-bold">{students.length}</span> students and{' '}
              <span className="text-white font-bold">{totalMarks}</span> marks recorded
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/teacher/students')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition-all backdrop-blur">
              <AddIcon fontSize="small" /> Add Student
            </button>
            <button onClick={() => navigate('/teacher/marks')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-all shadow-md">
              <BarChartIcon fontSize="small" /> Enter Marks
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="My Students"
          value={students.length}
          icon={<GroupIcon />}
          color="blue"
          trend="Assigned to your class"
          onClick={() => navigate('/teacher/students')}
        />
        <StatCard
          label="Marks Entered"
          value={totalMarks}
          icon={<BarChartIcon />}
          color="green"
          trend="Across all subjects"
          onClick={() => navigate('/teacher/marks')}
        />
        <StatCard
          label="Class Average"
          value={avgScore ?? '—'}
          icon={<TrendingUpIcon />}
          color="indigo"
          trend={avgScore ? (avgScore >= 75 ? '🟢 Good performance' : '🟡 Needs attention') : 'No marks yet'}
        />
        <StatCard
          label="Subjects"
          value={subjects.length}
          icon={<MenuBookIcon />}
          color="purple"
          trend="Available to grade"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GroupIcon sx={{ color: '#4f46e5', fontSize: 20 }} />
              <h3 className="font-semibold text-slate-800">My Students</h3>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{students.length}</span>
            </div>
            <button onClick={() => navigate('/teacher/students')}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
              View all <ArrowForwardIcon sx={{ fontSize: 14 }} />
            </button>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-5xl mb-3">👥</div>
              <p className="text-slate-500 font-medium">No students assigned yet</p>
              <button onClick={() => navigate('/teacher/students')}
                className="mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                Add Your First Student
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {students.slice(0, 6).map((s, idx) => {
                const perf = s.average >= 90 ? { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excellent' }
                  : s.average >= 75 ? { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Good' }
                  : s.average >= 60 ? { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Average' }
                  : s.average ? { color: 'text-red-500', bg: 'bg-red-50', label: 'Needs Help' }
                  : { color: 'text-slate-400', bg: 'bg-slate-50', label: 'No marks' };

                return (
                  <div key={s.id}
                    onClick={() => navigate(`/teacher/marks/${s.id}`)}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                      style={{ background: `hsl(${(idx * 47) % 360}, 65%, 55%)` }}>
                      {s.users?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {s.users?.name}
                      </p>
                      <p className="text-xs text-slate-400">{s.marks?.length || 0} marks recorded</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.average !== null && (
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${perf.bg} ${perf.color}`}>
                          {s.average}
                        </div>
                      )}
                      <ArrowForwardIcon sx={{ fontSize: 14, color: '#94a3b8' }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Top performer */}
          {topStudent && topStudent.average && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <EmojiEventsIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                <h4 className="text-sm font-bold text-amber-800">Top Performer</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-white flex items-center justify-center font-bold text-lg">
                  {topStudent.users?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{topStudent.users?.name}</p>
                  <p className="text-xs text-slate-500">{topStudent.marks?.length} subjects graded</p>
                </div>
                <div className="ml-auto text-2xl font-black text-amber-600">{topStudent.average}</div>
              </div>
            </div>
          )}

          {/* Recent marks */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BarChartIcon sx={{ color: '#10b981', fontSize: 18 }} />
                <h4 className="text-sm font-semibold text-slate-800">Recent Marks</h4>
              </div>
              <button onClick={() => navigate('/teacher/marks')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                Manage →
              </button>
            </div>
            {recentMarks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm">No marks yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentMarks.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="text-lg flex-shrink-0">
                      {SUBJECT_ICONS[m.subjects?.name] || '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{m.students?.users?.name}</p>
                      <p className="text-xs text-slate-400">{m.subjects?.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-sm font-bold text-slate-700">{m.score}</span>
                      <GradeBadge grade={m.grade} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
