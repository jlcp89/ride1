import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from './icons'

function pageWindow(page, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const out = [1]
  if (page > 3) out.push('ellipsis-left')
  const from = Math.max(2, page - 1)
  const to = Math.min(total - 1, page + 1)
  for (let p = from; p <= to; p++) out.push(p)
  if (page < total - 2) out.push('ellipsis-right')
  out.push(total)
  return out
}

export default function Pagination({ count, page, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, count)

  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' && canPrev) {
      e.preventDefault()
      onChange(page - 1)
    } else if (e.key === 'ArrowRight' && canNext) {
      e.preventDefault()
      onChange(page + 1)
    }
  }

  if (count === 0) return null

  return (
    <nav
      className="pagination"
      aria-label="Pagination"
      onKeyDown={handleKeyDown}
    >
      <span className="pagination__summary">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of{' '}
        <strong>{count}</strong> rides
      </span>

      <ul className="pagination__list">
        <li>
          <button
            type="button"
            className="pagination__btn"
            onClick={() => onChange(1)}
            disabled={!canPrev}
            aria-label="First page"
          >
            <ChevronsLeft />
          </button>
        </li>
        <li>
          <button
            type="button"
            className="pagination__btn"
            onClick={() => onChange(page - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </button>
        </li>

        {pageWindow(page, totalPages).map((item) => {
          if (typeof item === 'string') {
            return (
              <li key={item}>
                <span className="pagination__ellipsis" aria-hidden="true">
                  …
                </span>
              </li>
            )
          }
          const active = item === page
          return (
            <li key={item}>
              <button
                type="button"
                className="pagination__btn"
                onClick={() => onChange(item)}
                aria-label={`Page ${item}`}
                aria-current={active ? 'page' : undefined}
              >
                {item}
              </button>
            </li>
          )
        })}

        <li>
          <button
            type="button"
            className="pagination__btn"
            onClick={() => onChange(page + 1)}
            disabled={!canNext}
            aria-label="Next page"
          >
            <ChevronRight />
          </button>
        </li>
        <li>
          <button
            type="button"
            className="pagination__btn"
            onClick={() => onChange(totalPages)}
            disabled={!canNext}
            aria-label="Last page"
          >
            <ChevronsRight />
          </button>
        </li>
      </ul>
    </nav>
  )
}
