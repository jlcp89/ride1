import { useEffect, useRef } from 'react'

/**
 * Reusable right-side drawer shell.
 *
 * Owns: backdrop, slide-in `aside`, focus trap, Escape to close, body scroll
 * lock, return-focus-to-opener on unmount. Consumers render their own header
 * + body + footer as children. Both RideDetailDrawer (view/edit mode) and
 * RideCreateDrawer (create mode) share this.
 */
export default function DrawerShell({ onClose, ariaLabelledBy, children }) {
  const shellRef = useRef(null)
  const openerRef = useRef(null)

  useEffect(() => {
    openerRef.current = document.activeElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the drawer on mount so keyboard users land inside.
    shellRef.current?.focus()

    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const focusables = shellRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables || !focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        last.focus()
        e.preventDefault()
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus()
        e.preventDefault()
      }
    }
    const node = shellRef.current
    node?.addEventListener('keydown', onKey)
    return () => {
      node?.removeEventListener('keydown', onKey)
      document.body.style.overflow = originalOverflow
      if (openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus()
      }
    }
  }, [onClose])

  return (
    <>
      <div
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={shellRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
      >
        {children}
      </aside>
    </>
  )
}
