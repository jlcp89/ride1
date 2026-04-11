import { useState } from 'react'
import { CloseIcon, MapPinIcon } from './icons'

function countActive({ status, riderEmail, sortBy, latitude, longitude }) {
  let n = 0
  if (status) n++
  if (riderEmail) n++
  if (sortBy) n++
  if (latitude || longitude) n++
  return n
}

function ActiveChips({
  status,
  riderEmail,
  sortBy,
  onClearStatus,
  onClearRider,
  onClearSort,
}) {
  if (!status && !riderEmail && !sortBy) return null
  return (
    <div className="chip-row" aria-label="Active filters">
      {status && (
        <button type="button" className="chip" onClick={onClearStatus}>
          status: {status}
          <span className="chip__x" aria-hidden="true">
            <CloseIcon size={12} />
          </span>
          <span className="sr-only">Remove status filter</span>
        </button>
      )}
      {riderEmail && (
        <button type="button" className="chip" onClick={onClearRider}>
          rider: {riderEmail}
          <span className="chip__x" aria-hidden="true">
            <CloseIcon size={12} />
          </span>
          <span className="sr-only">Remove rider email filter</span>
        </button>
      )}
      {sortBy && (
        <button type="button" className="chip" onClick={onClearSort}>
          sort: {sortBy === 'pickup_time' ? 'pickup time' : sortBy}
          <span className="chip__x" aria-hidden="true">
            <CloseIcon size={12} />
          </span>
          <span className="sr-only">Remove sort</span>
        </button>
      )}
    </div>
  )
}

export default function FilterBar({
  values,
  setters,
  onClearAll,
  loading,
}) {
  const {
    status,
    riderEmailRaw,
    sortBy,
    latitude,
    longitude,
    pageSize,
  } = values
  const {
    setStatus,
    setRiderEmailRaw,
    setSortBy,
    setLatitude,
    setLongitude,
    setPageStr,
    setPageSizeStr,
  } = setters

  const [geoError, setGeoError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)

  const active = countActive({
    status,
    riderEmail: riderEmailRaw,
    sortBy,
    latitude,
    longitude,
  })

  function changeStatus(e) {
    setStatus(e.target.value)
    setPageStr('1')
  }
  function changeRider(e) {
    setRiderEmailRaw(e.target.value, { push: false })
    setPageStr('1', { push: false })
  }
  function changeSort(e) {
    setSortBy(e.target.value)
    setPageStr('1')
  }
  function changePageSize(e) {
    setPageSizeStr(e.target.value)
    setPageStr('1')
  }

  async function useMyLocation() {
    setGeoError('')
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not available in this browser.')
      return
    }
    const insecure =
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    if (insecure) {
      setGeoError('Geolocation requires HTTPS. Enter coordinates manually.')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(5))
        setLongitude(pos.coords.longitude.toFixed(5))
        setPageStr('1')
        setGeoLoading(false)
      },
      (err) => {
        setGeoError(err.message || 'Location permission denied.')
        setGeoLoading(false)
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }

  return (
    <>
      <section className="filter-bar" aria-label="Ride filters">
        <label className="filter-bar__field">
          <span className="filter-bar__label">
            Status
            {active > 0 && (
              <span className="filter-bar__label-count"> · {active} active</span>
            )}
          </span>
          <select
            value={status}
            onChange={changeStatus}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="en-route">en-route</option>
            <option value="pickup">pickup</option>
            <option value="dropoff">dropoff</option>
          </select>
        </label>

        <label className="filter-bar__field">
          <span className="filter-bar__label">Rider email</span>
          <input
            type="search"
            placeholder="alice@example.com"
            value={riderEmailRaw}
            onChange={changeRider}
            aria-label="Filter by rider email"
          />
        </label>

        <div className="filter-bar__actions">
          {active > 0 && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onClearAll}
              disabled={loading}
            >
              Clear all
            </button>
          )}
        </div>

        <div className="filter-bar__row-2">
          <label className="filter-bar__field">
            <span className="filter-bar__label">Sort by</span>
            <select
              value={sortBy}
              onChange={changeSort}
              aria-label="Sort rides by"
            >
              <option value="">Default</option>
              <option value="pickup_time">Pickup time</option>
              <option value="distance">Distance from point</option>
            </select>
          </label>

          {sortBy === 'distance' ? (
            <>
              <label className="filter-bar__field">
                <span className="filter-bar__label">Latitude</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00000"
                  value={latitude}
                  onChange={(e) =>
                    setLatitude(e.target.value, { push: false })
                  }
                  aria-label="Latitude"
                />
              </label>
              <label className="filter-bar__field">
                <span className="filter-bar__label">Longitude</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00000"
                  value={longitude}
                  onChange={(e) =>
                    setLongitude(e.target.value, { push: false })
                  }
                  aria-label="Longitude"
                />
              </label>
              <div className="filter-bar__field">
                <span className="filter-bar__label">&nbsp;</span>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={useMyLocation}
                  disabled={geoLoading}
                >
                  <MapPinIcon size={14} />
                  {geoLoading ? 'Locating…' : 'Use my location'}
                </button>
              </div>
            </>
          ) : (
            <>
              <span />
              <span />
              <span />
            </>
          )}

          <label className="filter-bar__field">
            <span className="filter-bar__label">Per page</span>
            <select
              value={String(pageSize)}
              onChange={changePageSize}
              aria-label="Rides per page"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>

          {geoError && (
            <p className="filter-bar__geo-error" role="status">
              {geoError}
            </p>
          )}
        </div>
      </section>

      <ActiveChips
        status={status}
        riderEmail={riderEmailRaw}
        sortBy={sortBy}
        onClearStatus={() => {
          setStatus('')
          setPageStr('1')
        }}
        onClearRider={() => {
          setRiderEmailRaw('')
          setPageStr('1')
        }}
        onClearSort={() => {
          setSortBy('')
          setPageStr('1')
        }}
      />
    </>
  )
}
