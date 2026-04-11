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
  return `${name} (${u.role}) — ${u.email}`
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

function CoordInput({ id, label, value, onChange, disabled, error, min, max }) {
  return (
    <label className="drawer__form-field">
      <span>{label}</span>
      <input
        id={id}
        type="number"
        step="any"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
      />
      <FieldError msg={error} />
    </label>
  )
}

export default function RideFormFields({
  values,
  onChange,
  users,
  errors = {},
  disabled = false,
}) {
  const field = (name) => (v) => onChange(name, v)

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
        users={users}
        disabled={disabled}
        error={errors.id_rider}
      />

      <UserSelect
        id="ride-form-driver"
        label="Driver"
        value={values.id_driver}
        onChange={field('id_driver')}
        users={users}
        disabled={disabled}
        error={errors.id_driver}
      />

      <label className="drawer__form-field">
        <span>Pickup time</span>
        <input
          type="datetime-local"
          value={values.pickup_time || ''}
          onChange={(e) => field('pickup_time')(e.target.value)}
          disabled={disabled}
          required
        />
        <FieldError msg={errors.pickup_time} />
      </label>

      <div className="drawer__form-section-title">Pickup location</div>
      <div className="drawer__form-grid">
        <CoordInput
          id="ride-form-pickup-lat"
          label="Latitude"
          value={values.pickup_latitude}
          onChange={field('pickup_latitude')}
          disabled={disabled}
          error={errors.pickup_latitude}
          min={-90}
          max={90}
        />
        <CoordInput
          id="ride-form-pickup-lng"
          label="Longitude"
          value={values.pickup_longitude}
          onChange={field('pickup_longitude')}
          disabled={disabled}
          error={errors.pickup_longitude}
          min={-180}
          max={180}
        />
      </div>

      <div className="drawer__form-section-title">Dropoff location</div>
      <div className="drawer__form-grid">
        <CoordInput
          id="ride-form-dropoff-lat"
          label="Latitude"
          value={values.dropoff_latitude}
          onChange={field('dropoff_latitude')}
          disabled={disabled}
          error={errors.dropoff_latitude}
          min={-90}
          max={90}
        />
        <CoordInput
          id="ride-form-dropoff-lng"
          label="Longitude"
          value={values.dropoff_longitude}
          onChange={field('dropoff_longitude')}
          disabled={disabled}
          error={errors.dropoff_longitude}
          min={-180}
          max={180}
        />
      </div>
    </div>
  )
}
