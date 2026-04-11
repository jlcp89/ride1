import { useCallback, useEffect, useState } from 'react'
import { fetchTripsReport, clearTokens } from '../services/api'
import SkeletonTable from './SkeletonRow'
import EmptyState from './EmptyState'

/**
 * Renders the bonus "trips over 1 hour" report as a table: month, driver,
 * count. Data comes from `GET /api/reports/trips-over-hour/` which runs
 * the same SQL as `ride0/backend/sql/bonus_report.sql`.
 */
export default function TripsReport({ onSessionExpired }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchTripsReport()
      setRows(data.results || [])
    } catch (e) {
      if (e.message === 'Session expired') {
        clearTokens()
        onSessionExpired?.()
        return
      }
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [onSessionExpired])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <SkeletonTable count={6} />
  }

  if (error) {
    return (
      <div className="banner-error" role="alert">
        <span>{error}</span>
        <div className="banner-error__actions">
          <button type="button" onClick={load}>
            Retry
          </button>
          <button type="button" onClick={() => setError('')}>
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No trips over 1 hour yet"
        hint="Once a driver completes a trip longer than 60 minutes, it will show up here grouped by month and driver."
      />
    )
  }

  return (
    <div className="table-wrap">
      <div className="table-scroll">
        <table className="ride-table">
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Driver</th>
              <th scope="col" className="ride-table__num">
                Count of Trips &gt; 1 hr
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.month}-${row.driver}`}>
                <td className="ride-table__mono">{row.month}</td>
                <td>{row.driver}</td>
                <td className="ride-table__num">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
