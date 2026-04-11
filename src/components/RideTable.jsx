import { SortArrow } from './icons'

const STATUS_CLASS = {
  'en-route': 'status-chip--en-route',
  pickup: 'status-chip--pickup',
  dropoff: 'status-chip--dropoff',
}

function formatPickupTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function fullName(user) {
  if (!user) return '—'
  const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
  return name || '—'
}

function StatusChip({ status, onClick }) {
  const klass = STATUS_CLASS[status] || ''
  const className = `status-chip ${klass} ${onClick ? 'status-chip--button' : ''}`.trim()
  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={(e) => {
          e.stopPropagation()
          onClick(status)
        }}
        aria-label={`Filter by status ${status}`}
      >
        {status}
      </button>
    )
  }
  return <span className={className}>{status}</span>
}

function EventsCell({ events, onOpen }) {
  if (!events?.length) {
    return (
      <span
        className="events-none"
        aria-label="No ride events in the last 24 hours"
      >
        —
      </span>
    )
  }
  const preview = events[0]?.description || ''
  return (
    <button
      type="button"
      className="events-pill"
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      title={preview ? `${events.length} events — ${preview}` : `${events.length} events`}
      aria-label={`${events.length} events in the last 24 hours. Open details`}
    >
      {events.length}
    </button>
  )
}

function SortHeader({ label, columnKey, sortBy, onSortBy, ariaLabel }) {
  const active = sortBy === columnKey
  return (
    <th
      scope="col"
      className={active ? 'th-sort th-sort--active' : 'th-sort'}
      aria-sort={active ? 'ascending' : 'none'}
    >
      <button
        type="button"
        className="th-sort__btn"
        onClick={() => onSortBy(active ? '' : columnKey)}
        aria-label={ariaLabel || `Sort by ${label}`}
      >
        {label}
        <span className="th-sort__arrow" aria-hidden="true">
          <SortArrow />
        </span>
      </button>
    </th>
  )
}

export default function RideTable({
  rides,
  sortBy,
  onSortBy,
  onFilterStatus,
  onFilterRider,
  onOpenDrawer,
  selectedId,
}) {
  return (
    <div className="table-wrap">
      <div className="table-scroll">
        <table className="ride-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Status</th>
              <th scope="col">Rider</th>
              <th scope="col">Driver</th>
              <SortHeader
                label="Pickup time"
                columnKey="pickup_time"
                sortBy={sortBy}
                onSortBy={onSortBy}
              />
              <th
                scope="col"
                aria-label="Ride events in the last 24 hours"
              >
                Events 24h
              </th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => {
              const isSelected = ride.id_ride === selectedId
              const openDrawer = () => onOpenDrawer?.(ride)
              const onRowKey = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDrawer()
                }
              }
              return (
                <tr
                  key={ride.id_ride}
                  className={isSelected ? 'is-selected' : undefined}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ride ${ride.id_ride} — ${ride.status} — ${fullName(ride.id_rider)}. Open details`}
                  onClick={openDrawer}
                  onKeyDown={onRowKey}
                >
                  <td className="ride-table__mono">#{ride.id_ride}</td>
                  <td>
                    <StatusChip
                      status={ride.status}
                      onClick={onFilterStatus}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ride-table__rider"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (ride.id_rider?.email) {
                          onFilterRider?.(ride.id_rider.email)
                        }
                      }}
                      aria-label={`Filter by rider ${ride.id_rider?.email || fullName(ride.id_rider)}`}
                    >
                      <span className="ride-table__rider-name">
                        {fullName(ride.id_rider)}
                      </span>
                      {ride.id_rider?.email && (
                        <span className="ride-table__rider-email">
                          {ride.id_rider.email}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="ride-table__driver">
                    {fullName(ride.id_driver)}
                  </td>
                  <td>
                    <span className="ride-table__time">
                      {formatPickupTime(ride.pickup_time)}
                    </span>
                  </td>
                  <td>
                    <EventsCell
                      events={ride.todays_ride_events}
                      onOpen={openDrawer}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
