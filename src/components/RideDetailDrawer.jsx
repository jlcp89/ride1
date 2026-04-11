import { useEffect, useState } from 'react'
import { fetchRide, deleteRide } from '../services/api'
import DrawerShell from './DrawerShell'
import RideDetailBody from './RideDetailBody'
import RideEditPanel from './RideEditPanel'
import { CloseIcon, SpinnerIcon } from './icons'

const STATUS_CLASS = {
  'en-route': 'status-chip--en-route',
  'to-pickup': 'status-chip--to-pickup',
  dropoff: 'status-chip--dropoff',
}

export default function RideDetailDrawer({
  rideId,
  initialRide,
  users,
  onClose,
  onRideSaved,
  onRideDeleted,
}) {
  const [ride, setRide] = useState(initialRide || null)
  const [loading, setLoading] = useState(!initialRide)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('view') // 'view' | 'edit' | 'confirm-delete'
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Fetch the full ride record on mount / rideId change.
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchRide(rideId)
        if (!cancelled) setRide(data)
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load ride.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [rideId])

  // Edit mode: swap the shell contents for RideEditPanel, which has its own
  // header + body + footer.
  if (mode === 'edit') {
    return (
      <DrawerShell onClose={() => setMode('view')} ariaLabelledBy="drawer-title">
        <RideEditPanel
          mode="edit"
          initialRide={ride}
          users={users}
          onCancel={() => setMode('view')}
          onSaved={(saved) => {
            setRide(saved)
            onRideSaved?.(saved)
            setMode('view')
          }}
        />
      </DrawerShell>
    )
  }

  const statusClass = ride?.status ? STATUS_CLASS[ride.status] || '' : ''
  const canEditOrDelete = !loading && !error && ride

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteRide(rideId)
      onRideDeleted?.(rideId)
      onClose()
    } catch (e) {
      setDeleteError(e.message || 'Could not delete ride.')
      setDeleting(false)
    }
  }

  return (
    <DrawerShell onClose={onClose} ariaLabelledBy="drawer-title">
      <header className="drawer__header">
        <h2 id="drawer-title" className="drawer__title">
          Ride <span className="drawer__title-id">#{rideId}</span>
          {ride?.status && (
            <span className={`status-chip ${statusClass}`}>{ride.status}</span>
          )}
        </h2>
        <button
          type="button"
          className="drawer__close"
          onClick={onClose}
          aria-label="Close detail drawer"
        >
          <CloseIcon size={14} />
        </button>
      </header>

      <div className="drawer__body">
        <RideDetailBody ride={ride} loading={loading} error={error} />
      </div>

      {canEditOrDelete && mode === 'view' && (
        <footer className="drawer__actions">
          <button
            type="button"
            className="btn btn--danger-ghost"
            onClick={() => setMode('confirm-delete')}
          >
            Delete
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setMode('edit')}
          >
            Edit
          </button>
        </footer>
      )}

      {canEditOrDelete && mode === 'confirm-delete' && (
        <footer className="drawer__actions drawer__actions--stack">
          <div className="drawer__confirm" role="alert">
            <strong>Delete ride #{rideId}?</strong>
            <span>
              This permanently removes the ride and all of its events. This
              action cannot be undone.
            </span>
            {deleteError && (
              <span className="drawer__confirm-error">{deleteError}</span>
            )}
          </div>
          <div className="drawer__actions__row">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setMode('view')
                setDeleteError('')
              }}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <SpinnerIcon size={14} />}
              {deleting ? 'Deleting…' : 'Delete ride'}
            </button>
          </div>
        </footer>
      )}
    </DrawerShell>
  )
}
