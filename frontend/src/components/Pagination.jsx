import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';

export default function Pagination({ meta, onPageChange, onLimitChange, showLimitSelector = true }) {
  if (!meta || meta.totalPages <= 0) return null;

  const { page, totalPages, total, limit } = meta;

  // Build page numbers to show (max 5 around current)
  const getPages = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2">
      {/* Left — info + limit */}
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Showing <span className="font-semibold text-slate-700">{Math.min((page - 1) * limit + 1, total)}</span>
          {' – '}
          <span className="font-semibold text-slate-700">{Math.min(page * limit, total)}</span>
          {' of '}
          <span className="font-semibold text-slate-700">{total}</span>
        </span>
        {showLimitSelector && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange?.(parseInt(e.target.value))}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-400 bg-white text-slate-700"
            >
              {[5, 10, 20, 50].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right — page buttons */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="First page"
        >
          <FirstPageIcon fontSize="small" />
        </button>

        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <NavigateBeforeIcon fontSize="small" />
        </button>

        {/* Left ellipsis */}
        {pages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)}
              className="w-8 h-8 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              1
            </button>
            {pages[0] > 2 && <span className="text-slate-400 text-xs px-1">…</span>}
          </>
        )}

        {/* Page numbers */}
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all
              ${p === page
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            {p}
          </button>
        ))}

        {/* Right ellipsis */}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-slate-400 text-xs px-1">…</span>}
            <button onClick={() => onPageChange(totalPages)}
              className="w-8 h-8 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              {totalPages}
            </button>
          </>
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <NavigateNextIcon fontSize="small" />
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Last page"
        >
          <LastPageIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
}
