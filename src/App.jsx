import { useState, useEffect } from 'react'
import {
  fetchRides,
  getCurrentUser,
  logout,
  clearTokens,
  isAuthenticated,
} from './services/api'
import RideTable from './components/RideTable'
import Pagination from './components/Pagination'
import LoginForm from './components/LoginForm'
import './App.css'

const PAGE_SIZE = 10

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authChecking, setAuthChecking] = useState(true)

  const [rides, setRides] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [status, setStatus] = useState('')
  const [riderEmail, setRiderEmail] = useState('')
  const [sortBy, setSortBy] = useState('')

  // Validate any token we have sitting in localStorage when the app mounts.
  useEffect(() => {
    async function check() {
      if (!isAuthenticated()) {
        setAuthChecking(false)
        return
      }
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
      } catch {
        clearTokens()
        setCurrentUser(null)
      } finally {
        setAuthChecking(false)
      }
    }
    check()
  }, [])

  // Load rides whenever we have a logged-in user (initial login and refresh).
  useEffect(() => {
    if (currentUser) load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

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
      if (e.message === 'Session expired') {
        clearTokens()
        setCurrentUser(null)
        return
      }
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setPage(1)
    load(1)
  }

  async function handleLogout() {
    await logout()
    setCurrentUser(null)
    setRides([])
    setCount(0)
    setPage(1)
  }

  if (authChecking) {
    return (
      <div className="app">
        <p className="loading">Loading…</p>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginForm onLoginSuccess={setCurrentUser} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Wingz Ride Management</h1>
        <div className="app-header__user">
          <span className="app-header__email">{currentUser.email}</span>
          <button
            type="button"
            className="app-header__logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

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
