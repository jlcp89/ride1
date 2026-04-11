import { useCallback, useEffect, useState } from 'react'

/**
 * Bookmarkable URL-synced state. Each call owns one query param; multiple
 * hook instances coexist on the same page. On back/forward navigation, every
 * subscribed instance re-reads its param from the URL.
 *
 * Pass `{ push: false }` to the setter when you want to collapse rapid
 * changes (e.g. debounced typing) into the current history entry instead of
 * creating a new one per keystroke.
 */
function read(key, fallback) {
  if (typeof window === 'undefined') return fallback
  const v = new URLSearchParams(window.location.search).get(key)
  return v === null ? fallback : v
}

export function useSearchParamsState(key, fallback = '') {
  const [value, setValue] = useState(() => read(key, fallback))

  useEffect(() => {
    function onPop() {
      setValue(read(key, fallback))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [key, fallback])

  const update = useCallback(
    (next, { push = true } = {}) => {
      setValue(next)
      const url = new URL(window.location.href)
      if (next === '' || next === null || next === undefined || next === fallback) {
        url.searchParams.delete(key)
      } else {
        url.searchParams.set(key, String(next))
      }
      const method = push ? 'pushState' : 'replaceState'
      window.history[method]({}, '', url.toString())
    },
    [key, fallback]
  )

  return [value, update]
}
