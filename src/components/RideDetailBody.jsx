import { useState } from 'react'
import { CopyIcon, CheckIcon, SpinnerIcon } from './icons'

// Read-only ride detail rendering — sections for People, Schedule,
// Coordinates, and Events. Split out of RideDetailDrawer to keep that file
// under the 300-line cap (quality.md). Also reused anywhere the same
// presentation of a ride is needed.

function fullName(u) {
  if (!u) return '—'
  const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
  return name || '—'
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

function relativeTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function CoordinateCell({ label, lat, lng }) {
  const [copied, setCopied] = useState(false)
  const value = lat != null && lng != null ? `${lat}, ${lng}` : '—'

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard API may be unavailable on insecure origins — ignore */
    }
  }

  return (
    <div className="drawer__coord">
      <span className="drawer__coord-label">{label}</span>
      <div className="drawer__coord-value">
        <span>{value}</span>
        <button
          type="button"
          className={`drawer__coord-copy ${copied ? 'is-copied' : ''}`}
          onClick={copy}
          aria-label={`Copy ${label} coordinates`}
          title={copied ? 'Copied' : 'Copy'}
        >
          {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
        </button>
      </div>
    </div>
  )
}

export default function RideDetailBody({ ride, loading, error }) {
  if (loading) {
    return (
      <div className="drawer__loading">
        <SpinnerIcon size={20} />
        <span>Loading ride…</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="drawer__error" role="alert">
        <strong>Could not load ride.</strong>
        <span>{error}</span>
      </div>
    )
  }
  if (!ride) return null

  const events = ride.todays_ride_events || []

  return (
    <>
      <section>
        <h3 className="drawer__section-title">People</h3>
        <dl className="drawer__meta">
          <dt>Rider</dt>
          <dd>
            <strong>{fullName(ride.id_rider)}</strong>
            {ride.id_rider?.email && <span>{ride.id_rider.email}</span>}
            {ride.id_rider?.phone_number && (
              <span>{ride.id_rider.phone_number}</span>
            )}
          </dd>
          <dt>Driver</dt>
          <dd>
            <strong>{fullName(ride.id_driver)}</strong>
            {ride.id_driver?.email && <span>{ride.id_driver.email}</span>}
          </dd>
        </dl>
      </section>

      <section>
        <h3 className="drawer__section-title">Schedule</h3>
        <dl className="drawer__meta">
          <dt>Pickup time</dt>
          <dd>
            <strong>{formatDateTime(ride.pickup_time)}</strong>
          </dd>
        </dl>
      </section>

      <section>
        <h3 className="drawer__section-title">Coordinates</h3>
        <div className="drawer__coords">
          <CoordinateCell
            label="Pickup"
            lat={ride.pickup_latitude}
            lng={ride.pickup_longitude}
          />
          <CoordinateCell
            label="Dropoff"
            lat={ride.dropoff_latitude}
            lng={ride.dropoff_longitude}
          />
        </div>
      </section>

      <section>
        <h3 className="drawer__section-title">Events (last 24 hours)</h3>
        {events.length === 0 ? (
          <div className="drawer__events-empty">
            <strong>No events in the last 24 hours.</strong>
            Older events may exist in the database but aren&apos;t loaded here —
            the ride list endpoint caps the event window at 24 hours so the
            query stays fast on a very large events table.
          </div>
        ) : (
          <div className="drawer__events">
            {events.map((ev) => (
              <div key={ev.id_ride_event} className="drawer__event">
                <div className="drawer__event-bullet" aria-hidden="true" />
                <div className="drawer__event-body">
                  <p className="drawer__event-desc">{ev.description}</p>
                  <p className="drawer__event-time">
                    {formatDateTime(ev.created_at)} ·{' '}
                    {relativeTime(ev.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
