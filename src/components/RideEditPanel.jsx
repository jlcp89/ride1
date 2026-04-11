import { useState } from 'react'
import {
  createRide,
  updateRide,
  parseValidationError,
} from '../services/api'
import RideFormFields from './RideFormFields'
import { CloseIcon, SpinnerIcon } from './icons'

const DEFAULT_VALUES = {
  status: 'to-pickup',
  id_rider: '',
  id_driver: '',
  pickup_latitude: '',
  pickup_longitude: '',
  dropoff_latitude: '',
  dropoff_longitude: '',
  pickup_time: '',
}

// "2026-04-11T15:30:00Z" → "2026-04-11T15:30" (local tz, matches
// <input type="datetime-local"> format). Empty input → "".
function toLocalInputValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

// "2026-04-11T15:30" (local) → "2026-04-11T20:30:00.000Z" (UTC ISO).
function fromLocalInputValue(local) {
  if (!local) return ''
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return local
  return d.toISOString()
}

function valuesFromRide(ride) {
  if (!ride) return { ...DEFAULT_VALUES }
  return {
    status: ride.status || 'to-pickup',
    id_rider: ride.id_rider?.id_user ?? '',
    id_driver: ride.id_driver?.id_user ?? '',
    pickup_latitude:
      ride.pickup_latitude != null ? String(ride.pickup_latitude) : '',
    pickup_longitude:
      ride.pickup_longitude != null ? String(ride.pickup_longitude) : '',
    dropoff_latitude:
      ride.dropoff_latitude != null ? String(ride.dropoff_latitude) : '',
    dropoff_longitude:
      ride.dropoff_longitude != null ? String(ride.dropoff_longitude) : '',
    pickup_time: toLocalInputValue(ride.pickup_time),
  }
}

function serialize(values) {
  return {
    status: values.status,
    id_rider: Number(values.id_rider),
    id_driver: Number(values.id_driver),
    pickup_latitude: Number(values.pickup_latitude),
    pickup_longitude: Number(values.pickup_longitude),
    dropoff_latitude: Number(values.dropoff_latitude),
    dropoff_longitude: Number(values.dropoff_longitude),
    pickup_time: fromLocalInputValue(values.pickup_time),
  }
}

/**
 * Owns submission state and calls the API. Renders header + banner +
 * RideFormFields + sticky footer. Used by both RideCreateDrawer (mode='create')
 * and RideDetailDrawer edit-mode (mode='edit').
 */
export default function RideEditPanel({
  mode,
  initialRide,
  users,
  onSaved,
  onCancel,
}) {
  const [values, setValues] = useState(() => valuesFromRide(initialRide))
  const [errors, setErrors] = useState({})
  const [banner, setBanner] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function updateField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setBanner(null)
    try {
      const body = serialize(values)
      const ride =
        mode === 'create'
          ? await createRide(body)
          : await updateRide(initialRide.id_ride, body)
      onSaved(ride)
    } catch (err) {
      const parsed = parseValidationError(err.message)
      setErrors(parsed.fieldErrors)
      setBanner(parsed.banner || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const title =
    mode === 'create'
      ? 'New ride'
      : `Ride #${initialRide?.id_ride} — edit`

  const noUsers = !users || users.length === 0

  return (
    <form className="drawer__form-wrap" onSubmit={handleSubmit} noValidate>
      <header className="drawer__header">
        <h2 id="drawer-title" className="drawer__title">
          {title}
        </h2>
        <button
          type="button"
          className="drawer__close"
          onClick={onCancel}
          aria-label="Close"
          disabled={submitting}
        >
          <CloseIcon size={14} />
        </button>
      </header>

      <div className="drawer__body">
        {banner && (
          <div className="banner-error" role="alert">
            <span>{banner}</span>
          </div>
        )}

        {noUsers && (
          <div className="banner-error" role="alert">
            <span>
              No users available to assign as rider/driver. The users directory
              is empty or could not be loaded.
            </span>
          </div>
        )}

        <RideFormFields
          values={values}
          onChange={updateField}
          users={users || []}
          errors={errors}
          disabled={submitting}
        />
      </div>

      <footer className="drawer__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={submitting || noUsers}
        >
          {submitting && <SpinnerIcon size={14} />}
          {submitting
            ? 'Saving…'
            : mode === 'create'
              ? 'Create ride'
              : 'Save changes'}
        </button>
      </footer>
    </form>
  )
}
