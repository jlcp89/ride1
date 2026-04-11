import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'

// Default center: Guatemala City (matches seed_db.py coordinates around 14.6,-90.51).
const DEFAULT_CENTER = [14.6349, -90.5069]
const DEFAULT_ZOOM = 13

// Build a colored circle DivIcon. Avoids leaflet's default PNG marker, which
// has bundler-path issues with Vite and looks generic.
function colorIcon(color, label) {
  return L.divIcon({
    className: 'map-pin',
    html: `<div class="map-pin__dot" style="background:${color}">${label || ''}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

const PICKUP_ICON = colorIcon('#2563eb', 'P')
const DROPOFF_ICON = colorIcon('#047857', 'D')
const SINGLE_ICON = colorIcon('#b91c1c', '')

function isValidLatLng(p) {
  return (
    p &&
    typeof p.lat === 'number' &&
    typeof p.lng === 'number' &&
    !Number.isNaN(p.lat) &&
    !Number.isNaN(p.lng)
  )
}

// Re-centers the map when the points change from the outside (e.g. after
// "use my location" populates the value, or when an existing ride opens in
// edit mode and we need to fit the view to its coordinates).
function FitBoundsOnce({ points }) {
  const map = useMap()
  useEffect(() => {
    const valid = points.filter(isValidLatLng)
    if (valid.length === 0) return
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], map.getZoom() || DEFAULT_ZOOM)
      return
    }
    const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
    // we intentionally only re-fit when the points identity changes, not on
    // every render — depending on the actual lat/lng values would fight the
    // user's pan/zoom interactions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map((p) => `${p?.lat},${p?.lng}`).join('|')])
  return null
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

/**
 * Reusable interactive map picker. Two modes:
 *
 *   mode="single"  → one marker. Click anywhere or drag the marker.
 *                    `value`: { lat, lng } | null
 *                    `onChange(point)`
 *
 *   mode="dual"    → pickup + dropoff markers. Toggle which one the next
 *                    click sets via the pill buttons above the map. Drag
 *                    either marker once placed.
 *                    `pickup`: { lat, lng } | null
 *                    `dropoff`: { lat, lng } | null
 *                    `onChange(field, point)` — field is 'pickup' or 'dropoff'
 */
export default function MapPointPicker({
  mode = 'single',
  value = null,
  pickup = null,
  dropoff = null,
  onChange,
  height = 240,
  disabled = false,
}) {
  // In dual mode, which marker the next click writes to.
  // After placing pickup, auto-advances to dropoff so first-time use is
  // "click pickup → click dropoff" with no extra UI taps.
  const [activeField, setActiveField] = useState(() => {
    if (mode !== 'dual') return null
    if (!isValidLatLng(pickup)) return 'pickup'
    if (!isValidLatLng(dropoff)) return 'dropoff'
    return 'pickup'
  })

  function handleMapClick(point) {
    if (disabled) return
    if (mode === 'single') {
      onChange?.(point)
      return
    }
    onChange?.(activeField, point)
    if (activeField === 'pickup' && !isValidLatLng(dropoff)) {
      setActiveField('dropoff')
    }
  }

  function handleDrag(field, e) {
    if (disabled) return
    const { lat, lng } = e.target.getLatLng()
    if (mode === 'single') {
      onChange?.({ lat, lng })
    } else {
      onChange?.(field, { lat, lng })
    }
  }

  const points = useMemo(() => {
    if (mode === 'single') return [value].filter(Boolean)
    return [pickup, dropoff].filter(Boolean)
  }, [mode, value, pickup, dropoff])

  return (
    <div
      className={`map-picker${disabled ? ' is-disabled' : ''}`}
      aria-disabled={disabled}
    >
      {mode === 'dual' && (
        <div className="map-picker__toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeField === 'pickup'}
            className={`map-picker__toggle-btn${activeField === 'pickup' ? ' is-active' : ''}`}
            onClick={() => setActiveField('pickup')}
            disabled={disabled}
          >
            <span className="map-picker__toggle-dot map-picker__toggle-dot--pickup" />
            Pickup
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeField === 'dropoff'}
            className={`map-picker__toggle-btn${activeField === 'dropoff' ? ' is-active' : ''}`}
            onClick={() => setActiveField('dropoff')}
            disabled={disabled}
          >
            <span className="map-picker__toggle-dot map-picker__toggle-dot--dropoff" />
            Dropoff
          </button>
        </div>
      )}

      <div
        className="map-picker__canvas"
        style={{ height }}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <ClickHandler onMapClick={handleMapClick} />
          <FitBoundsOnce points={points} />

          {mode === 'single' && isValidLatLng(value) && (
            <Marker
              position={[value.lat, value.lng]}
              icon={SINGLE_ICON}
              draggable={!disabled}
              eventHandlers={{ dragend: (e) => handleDrag(null, e) }}
            />
          )}

          {mode === 'dual' && isValidLatLng(pickup) && (
            <Marker
              position={[pickup.lat, pickup.lng]}
              icon={PICKUP_ICON}
              draggable={!disabled}
              eventHandlers={{ dragend: (e) => handleDrag('pickup', e) }}
            />
          )}

          {mode === 'dual' && isValidLatLng(dropoff) && (
            <Marker
              position={[dropoff.lat, dropoff.lng]}
              icon={DROPOFF_ICON}
              draggable={!disabled}
              eventHandlers={{ dragend: (e) => handleDrag('dropoff', e) }}
            />
          )}

          {mode === 'dual' &&
            isValidLatLng(pickup) &&
            isValidLatLng(dropoff) && (
              <Polyline
                positions={[
                  [pickup.lat, pickup.lng],
                  [dropoff.lat, dropoff.lng],
                ]}
                pathOptions={{ color: '#475569', weight: 2, dashArray: '4 6' }}
              />
            )}
        </MapContainer>
      </div>

      <p className="map-picker__hint">
        {mode === 'single'
          ? 'Click on the map or drag the marker to set the location.'
          : `Click on the map to set the ${activeField}. Drag markers to refine.`}
      </p>
    </div>
  )
}
