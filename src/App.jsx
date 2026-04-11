import { useCallback, useEffect, useState } from 'react'
import {
  fetchRides,
  fetchUsers,
  getCurrentUser,
  logout,
  clearTokens,
  isAuthenticated,
} from './services/api'
import RideTable from './components/RideTable'
import Pagination from './components/Pagination'
import LoginForm from './components/LoginForm'
import FilterBar from './components/FilterBar'
import SkeletonTable from './components/SkeletonRow'
import EmptyState from './components/EmptyState'
import RideDetailDrawer from './components/RideDetailDrawer'
import RideCreateDrawer from './components/RideCreateDrawer'
import TripsReport from './components/TripsReport'
import { LogoMark } from './components/icons'
import { useSearchParamsState } from './hooks/useSearchParamsState'
import { useDebouncedValue } from './hooks/useDebouncedValue'

function initials(user) {
  if (!user) return '?'
  const first = (user.first_name || '').trim()
  const last = (user.last_name || '').trim()
  const pair = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
  if (pair) return pair
  return (user.email || '?').charAt(0).toUpperCase()
}

function AppHeader({ user, onLogout, section }) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__logo" aria-hidden="true">
          <LogoMark size={20} />
        </div>
        <div className="app-header__wordmark">
          <span className="app-header__title">Wingz Admin</span>
          <span className="app-header__section">{section}</span>
        </div>
      </div>
      <div className="app-header__user">
        <div className="app-header__avatar" aria-hidden="true">
          {initials(user)}
        </div>
        <div className="app-header__identity">
          <span className="app-header__email">{user?.email}</span>
          <span className="app-header__role">{user?.role || 'user'}</span>
        </div>
        <button
          type="button"
          className="app-header__logout"
          onClick={onLogout}
        >
          Log out
        </button>
      </div>
    </header>
  )
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [sessionFlash, setSessionFlash] = useState('')

  // URL-synced filter state.
  const [status, setStatus] = useSearchParamsState('status', '')
  const [riderEmailRaw, setRiderEmailRaw] = useSearchParamsState('rider_email', '')
  const riderEmail = useDebouncedValue(riderEmailRaw, 300)
  const [sortBy, setSortBy] = useSearchParamsState('sort_by', '')
  const [latitude, setLatitude] = useSearchParamsState('lat', '')
  const [longitude, setLongitude] = useSearchParamsState('lng', '')
  const [pageStr, setPageStr] = useSearchParamsState('page', '1')
  const [pageSizeStr, setPageSizeStr] = useSearchParamsState('page_size', '10')

  const page = Number(pageStr) || 1
  const pageSize = Number(pageSizeStr) || 10

  const [rides, setRides] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drawerRideId, setDrawerRideId] = useState(null)
  const [view, setView] = useState('rides')
  const [users, setUsers] = useState([])
  const [createOpen, setCreateOpen] = useState(false)

  // Auth bootstrap on mount.
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

  // Load the users directory once after login — populates the rider/driver
  // dropdowns in the CRUD form. Errors are swallowed (create/edit stays
  // disabled until users are available).
  useEffect(() => {
    if (!currentUser) return
    let cancelled = false
    fetchUsers()
      .then((data) => {
        if (!cancelled) setUsers(data.results || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [currentUser])

  // Main load: runs whenever any filter/sort/page/page_size changes.
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, page_size: pageSize }
      if (status) params.status = status
      if (riderEmail) params.rider_email = riderEmail
      if (sortBy) params.sort_by = sortBy
      if (sortBy === 'distance') {
        if (latitude !== '') params.latitude = latitude
        if (longitude !== '') params.longitude = longitude
      }
      const data = await fetchRides(params)
      setRides(data.results || [])
      setCount(data.count || 0)
    } catch (e) {
      if (e.message === 'Session expired') {
        clearTokens()
        setCurrentUser(null)
        setSessionFlash('Your session expired — please sign in again.')
        return
      }
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, status, riderEmail, sortBy, latitude, longitude])

  // Distance sort needs both lat and lng to fire the request; gate the load.
  const distanceReady =
    sortBy !== 'distance' || (latitude !== '' && longitude !== '')

  useEffect(() => {
    if (!currentUser) return
    if (!distanceReady) return
    load()
  }, [currentUser, load, distanceReady])

  const clearAll = useCallback(() => {
    setStatus('')
    setRiderEmailRaw('')
    setSortBy('')
    setLatitude('')
    setLongitude('')
    setPageStr('1')
  }, [setStatus, setRiderEmailRaw, setSortBy, setLatitude, setLongitude, setPageStr])

  async function handleLogout() {
    await logout()
    setCurrentUser(null)
    setRides([])
    setCount(0)
    clearAll()
  }

  function handlePageChange(p) {
    setPageStr(String(p))
  }

  const handleSessionExpired = useCallback(() => {
    setCurrentUser(null)
    setSessionFlash('Your session expired — please sign in again.')
  }, [])

  if (authChecking) {
    return (
      <div className="app">
        <p className="loading">Loading…</p>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <LoginForm
        onLoginSuccess={(u) => {
          setCurrentUser(u)
          setSessionFlash('')
        }}
        flash={sessionFlash}
      />
    )
  }

  return (
    <div className="app">
      <AppHeader
        user={currentUser}
        onLogout={handleLogout}
        section={view === 'rides' ? 'Rides' : 'Reports'}
      />

      <nav className="app-nav" aria-label="Primary">
        <button
          type="button"
          className={`app-nav__tab${view === 'rides' ? ' is-active' : ''}`}
          onClick={() => setView('rides')}
          aria-pressed={view === 'rides'}
        >
          Rides
        </button>
        <button
          type="button"
          className={`app-nav__tab${view === 'reports' ? ' is-active' : ''}`}
          onClick={() => setView('reports')}
          aria-pressed={view === 'reports'}
        >
          Reports
        </button>
      </nav>

      {view === 'rides' ? (
        <>
          <FilterBar
            values={{
              status,
              riderEmailRaw,
              sortBy,
              latitude,
              longitude,
              pageSize,
            }}
            setters={{
              setStatus,
              setRiderEmailRaw,
              setSortBy,
              setLatitude,
              setLongitude,
              setPageStr,
              setPageSizeStr,
            }}
            onClearAll={clearAll}
            loading={loading}
          />

          <div className="table-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setCreateOpen(true)}
              disabled={users.length === 0}
              title={
                users.length === 0
                  ? 'Users directory unavailable'
                  : 'Create a new ride'
              }
            >
              + New ride
            </button>
          </div>

          {error && (
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
          )}

          {loading ? (
            <SkeletonTable count={pageSize} />
          ) : rides.length === 0 && !error ? (
            <EmptyState
              actionLabel={
                status || riderEmailRaw || sortBy ? 'Clear filters' : undefined
              }
              onAction={status || riderEmailRaw || sortBy ? clearAll : undefined}
            />
          ) : (
            <>
              <RideTable
                rides={rides}
                sortBy={sortBy}
                onSortBy={(v) => {
                  setSortBy(v)
                  setPageStr('1')
                }}
                onFilterStatus={(v) => {
                  setStatus(v)
                  setPageStr('1')
                }}
                onFilterRider={(v) => {
                  setRiderEmailRaw(v)
                  setPageStr('1')
                }}
                onOpenDrawer={(ride) => setDrawerRideId(ride.id_ride)}
                selectedId={drawerRideId}
              />
              <Pagination
                count={count}
                page={page}
                pageSize={pageSize}
                onChange={handlePageChange}
              />
            </>
          )}

          {drawerRideId !== null && (
            <RideDetailDrawer
              rideId={drawerRideId}
              initialRide={rides.find((r) => r.id_ride === drawerRideId)}
              users={users}
              onClose={() => setDrawerRideId(null)}
              onRideSaved={() => {
                load()
              }}
              onRideDeleted={() => {
                setDrawerRideId(null)
                load()
              }}
            />
          )}

          {createOpen && (
            <RideCreateDrawer
              users={users}
              onClose={() => setCreateOpen(false)}
              onCreated={() => load()}
            />
          )}
        </>
      ) : (
        <TripsReport onSessionExpired={handleSessionExpired} />
      )}
    </div>
  )
}
