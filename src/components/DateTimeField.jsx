import DatePicker from 'react-datepicker'

/**
 * Datetime picker wrapper around react-datepicker that matches the existing
 * .drawer__form-field label/input style. Returns ISO UTC strings via
 * `onChange(iso)` so the form's existing serialize() round-trip stays clean.
 *
 * Props:
 *   label    — visible field label
 *   value    — ISO string ("2026-04-11T15:30:00.000Z") | "" | null
 *   onChange — (iso: string) => void  (passes "" when cleared)
 *   disabled — bool
 *   error    — optional per-field error message
 *   id       — html id for the input (for label association if needed)
 */
export default function DateTimeField({
  label,
  value,
  onChange,
  disabled = false,
  error,
  id,
}) {
  // react-datepicker takes a Date object or null. Convert to/from ISO at the
  // boundary so the rest of the form stays string-based.
  const date = value ? new Date(value) : null
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null

  function handleChange(next) {
    if (!next) {
      onChange?.('')
      return
    }
    onChange?.(next.toISOString())
  }

  return (
    <label className="drawer__form-field" htmlFor={id}>
      <span>{label}</span>
      <DatePicker
        id={id}
        selected={validDate}
        onChange={handleChange}
        showTimeSelect
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="MMM d, yyyy h:mm aa"
        placeholderText="Select a date and time"
        disabled={disabled}
        className="drawer__form-datepicker"
        wrapperClassName="drawer__form-datepicker-wrap"
        popperClassName="drawer__form-datepicker-popper"
        autoComplete="off"
      />
      {error && <span className="drawer__form-error">{error}</span>}
    </label>
  )
}
