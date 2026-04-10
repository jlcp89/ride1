export default function Pagination({ count, page, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="pagination">
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => onChange(page - 1)}
      >
        ← Prev
      </button>
      <span className="page-info">
        Page {page} of {totalPages} ({count} total)
      </span>
      <button
        type="button"
        disabled={!canNext}
        onClick={() => onChange(page + 1)}
      >
        Next →
      </button>
    </div>
  )
}
