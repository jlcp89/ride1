import { useState, useEffect } from 'react'
import { fetchRides } from './services/api'
import RideTable from './components/RideTable'
import Pagination from './components/Pagination'
import './App.css'

const PAGE_SIZE = 10

export default function App() {
  const [rides, setRides] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [status, setStatus] = useState('')
  const [riderEmail, setRiderEmail] = useState('')
  const [sortBy, setSortBy] = useState('')

  async function load(p = page) {
    setLoading(true)
    setError('')
    try {
      const params = { page: p, page_size: PAGE_SIZE }
      if (status) params.status = status
      if (riderEmail) params.rider_email = riderEmail
      if (sortBy) params.sort_by = sortBy
      const data = await fetchRides(params)
      setRides(data.results || [])
      setCount(data.count || 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setPage(1)
    load(1)
  }

  return (
    <div className="app">
      <h1>Wingz Ride Management</h1>
      <form onSubmit={handleSubmit} className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="en-route">en-route</option>
          <option value="pickup">pickup</option>
          <option value="dropoff">dropoff</option>
        </select>
        <input
          placeholder="Rider email"
          value={riderEmail}
          onChange={(e) => setRiderEmail(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">No sorting</option>
          <option value="pickup_time">Pickup Time</option>
        </select>
        <button type="submit" disabled={loading}>
          Search
        </button>
      </form>

      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <>
          <RideTable rides={rides} />
          <Pagination
            count={count}
            page={page}
            pageSize={PAGE_SIZE}
            onChange={(p) => {
              setPage(p)
              load(p)
            }}
          />
        </>
      )}
    </div>
  )
}
