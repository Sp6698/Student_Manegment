export default function StatCard({ label, value, icon, color = 'indigo', trend, onClick }) {
  const configs = {
    indigo:  { bg: 'bg-indigo-500',  light: 'bg-indigo-50',  text: 'text-indigo-600',  ring: 'ring-indigo-100' },
    green:   { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
    blue:    { bg: 'bg-blue-500',    light: 'bg-blue-50',    text: 'text-blue-600',    ring: 'ring-blue-100' },
    orange:  { bg: 'bg-orange-500',  light: 'bg-orange-50',  text: 'text-orange-600',  ring: 'ring-orange-100' },
    purple:  { bg: 'bg-purple-500',  light: 'bg-purple-50',  text: 'text-purple-600',  ring: 'ring-purple-100' },
    rose:    { bg: 'bg-rose-500',    light: 'bg-rose-50',    text: 'text-rose-600',    ring: 'ring-rose-100' },
  };
  const c = configs[color] || configs.indigo;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4
        hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      <div className={`w-14 h-14 rounded-2xl ${c.light} ${c.ring} ring-1 flex items-center justify-center flex-shrink-0`}>
        <span className={`text-2xl ${c.text}`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-800 leading-none">{value ?? '—'}</p>
        {trend && <p className="text-xs text-slate-400 mt-1.5">{trend}</p>}
      </div>
    </div>
  );
}
