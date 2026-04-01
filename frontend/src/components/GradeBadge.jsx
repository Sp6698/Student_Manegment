const configs = {
  'A+': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  'A':  { bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-200' },
  'B':  { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200' },
  'C':  { bg: 'bg-yellow-100',  text: 'text-yellow-700',  border: 'border-yellow-200' },
  'D':  { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200' },
  'F':  { bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-200' },
};

export default function GradeBadge({ grade }) {
  const c = configs[grade] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
  return (
    <span className={`inline-flex items-center justify-center w-8 h-6 rounded-md text-xs font-black border ${c.bg} ${c.text} ${c.border}`}>
      {grade}
    </span>
  );
}
