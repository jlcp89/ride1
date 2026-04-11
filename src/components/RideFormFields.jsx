import DateTimeField from './DateTimeField'
import MapPointPicker from './MapPointPicker'

/**
 * Pure presentation for the ride CRUD form. No API calls, no submission
 * state — just controlled inputs + per-field error display.
 *
 * Props:
 *   values   — { status, id_rider, id_driver, pickup_latitude, pickup_longitude,
 *                dropoff_latitude, dropoff_longitude, pickup_time }
 *   onChange — (field, value) => void
 *   users    — array of { id_user, role, first_name, last_name, email, ... }
 *   errors   — { field: msg } map from parseValidationError()
 *   disabled — bool, disables every input (used during submit)
 */

// Matches RIDE_STATUS_CHOICES in ride0/backend/rides/serializers.py
const STATUS_OPTIONS = [
  { value: 'to-pickup', label: 'To Pickup' },
  { value: 'en-route', label: 'En Route' },
  { value: 'dropoff', label: 'Dropoff' },
]

function userLabel(u) {
  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email
  return `${name} — ${u.email}`
}

function FieldError({ msg }) {
  if (!msg) return null
  return <span className="drawer__form-error">{msg}</span>
}

function UserSelect({ id, label, value, onChange, users, disabled, error }) {
  return (
    <label className="drawer__form-field">
      <span>{label}</span>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
      >
        <option value="">— select a user —</option>
        {users.map((u) => (
          <option key={u.id_user} value={u.id_user}>
            {userLabel(u)}
          </option>
        ))}
      </select>
      <FieldError msg={error} />
    </label>
  )
}

// Convert form-state strings → MapPointPicker { lat, lng } | null.
function pointFromValues(latStr, lngStr) {
  if (latStr === '' || latStr == null || lngStr === '' || lngStr == null) {
    return null
  }
  const lat = Number(latStr)
  const lng = Number(lngStr)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null
  return { lat, lng }
}

export default function RideFormFields({
  values,
  onChange,
  users,
  errors = {},
  disabled = false,
}) {
  const field = (name) => (v) => onChange(name, v)

  // Map's onChange unpacks {lat, lng} into the form's two scalar fields.
  // React 19 batches these so both apply in a single render.
  function handleMapChange(which, point) {
    if (which === 'pickup') {
      onChange('pickup_latitude', String(point.lat))
      onChange('pickup_longitude', String(point.lng))
    } else if (which === 'dropoff') {
      onChange('dropoff_latitude', String(point.lat))
      onChange('dropoff_longitude', String(point.lng))
    }
  }

  const pickup = pointFromValues(values.pickup_latitude, values.pickup_longitude)
  const dropoff = pointFromValues(values.dropoff_latitude, values.dropoff_longitude)

  // Aggregate any backend per-field error from the four coordinate fields
  // into a single message under the map (the map itself doesn't have a
  // single "field" prefix the backend can target).
  const coordError =
    errors.pickup_latitude ||
    errors.pickup_longitude ||
    errors.dropoff_latitude ||
    errors.dropoff_longitude ||
    null

  return (
    <div className="drawer__form">
      <label className="drawer__form-field">
        <span>Status</span>
        <select
          value={values.status || 'to-pickup'}
          onChange={(e) => field('status')(e.target.value)}
          disabled={disabled}
          required
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <FieldError msg={errors.status} />
      </label>

      <UserSelect
        id="ride-form-rider"
        label="Rider"
        value={values.id_rider}
        onChange={field('id_rider')}
        users={users.filter((u) => u.role === 'rider')}
        disabled={disabled}
        error={errors.id_rider}
      />

      <UserSelect
        id="ride-form-driver"
        label="Driver"
        value={values.id_driver}
        onChange={field('id_driver')}
        users={users.filter((u) => u.role === 'driver')}
        disabled={disabled}
        error={errors.id_driver}
      />

      <DateTimeField
        id="ride-form-pickup-time"
        label="Pickup time"
        value={values.pickup_time}
        onChange={field('pickup_time')}
        disabled={disabled}
        error={errors.pickup_time}
      />

      <div className="drawer__form-field">
        <span>Pickup &amp; Dropoff locations</span>
        <MapPointPicker
          mode="dual"
          pickup={pickup}
          dropoff={dropoff}
          onChange={handleMapChange}
          disabled={disabled}
          height={260}
        />
        <FieldError msg={coordError} />
      </div>
    </div>
  )
}
