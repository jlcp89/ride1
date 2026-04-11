import { useEffect, useState } from 'react'

/**
 * Returns `value` after it stops changing for `delay` ms. Used to debounce
 * rider-email filter so we don't fire an API request on every keystroke.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
