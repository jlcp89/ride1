const STATUS_COLORS = {
  'en-route': '#2563eb', // blue
  pickup: '#d97706', // amber
  dropoff: '#059669', // green
}

function StatusBadge({ status }) {
  const background = STATUS_COLORS[status] || '#6b7280'
  return (
    <span
      className="status-badge"
      style={{ backgroundColor: background }}
    >
      {status}
    </span>
  )
}

function formatPickupTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function EventsCell({ events }) {
  if (!events?.length) return '0'
  return (
    <details className="events-details">
      <summary>{events.length}</summary>
      <ul className="events-list">
        {events.map((ev, i) => (
          <li key={i}>
            <span className="events-list__desc">{ev.description}</span>
            <span className="events-list__time">
              {formatPickupTime(ev.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function fullName(user) {
  if (!user) return '—'
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || '—'
}

export default function RideTable({ rides }) {
  if (!rides.length) {
    return <p className="empty">No rides match these filters.</p>
  }

  return (
    <table className="ride-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Rider</th>
          <th>Driver</th>
          <th>Pickup Time</th>
          <th>Events</th>
        </tr>
      </thead>
      <tbody>
        {rides.map((ride) => (
          <tr key={ride.id_ride}>
            <td>{ride.id_ride}</td>
            <td>
              <StatusBadge status={ride.status} />
            </td>
            <td>
              <div>{fullName(ride.id_rider)}</div>
              <div className="subtle">{ride.id_rider?.email}</div>
            </td>
            <td>{fullName(ride.id_driver)}</td>
            <td>{formatPickupTime(ride.pickup_time)}</td>
            <td>
              <EventsCell events={ride.todays_ride_events} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
