const API_BASE = '/api'
const ACCESS_KEY = 'wingz_access_token'
const REFRESH_KEY = 'wingz_refresh_token'

// --- token storage -------------------------------------------------------

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(ACCESS_KEY, access_token)
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function isAuthenticated() {
  return !!getAccessToken()
}

// --- auth endpoints ------------------------------------------------------

async function parseOrThrow(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || data.detail || `HTTP ${res.status}`)
  }
  return data
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await parseOrThrow(res)
  setTokens(data)
  return data.user
}

async function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) throw new Error('No refresh token')
  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!res.ok) throw new Error('Refresh failed')
  const data = await res.json()
  localStorage.setItem(ACCESS_KEY, data.access_token)
  return data.access_token
}

export async function logout() {
  const token = getAccessToken()
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // best-effort — we drop tokens either way
    }
  }
  clearTokens()
}

export async function getCurrentUser() {
  const res = await apiFetch('/auth/me/')
  return res.json()
}

// --- authenticated fetch wrapper -----------------------------------------

// Injects Bearer token from localStorage. On 401, tries exactly one refresh
// round-trip. If that also fails, clears tokens and throws 'Session expired'
// so App.jsx can route back to the login form.
async function apiFetch(path, options = {}) {
  const build = (token) => ({
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  let res = await fetch(`${API_BASE}${path}`, build(getAccessToken()))

  if (res.status === 401 && getRefreshToken()) {
    try {
      const fresh = await refreshAccessToken()
      res = await fetch(`${API_BASE}${path}`, build(fresh))
    } catch {
      clearTokens()
      throw new Error('Session expired')
    }
  }

  if (res.status === 401) {
    clearTokens()
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || data.detail || `HTTP ${res.status}`)
  }

  return res
}

// --- public endpoints ----------------------------------------------------

export async function fetchRides(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.append(k, v)
  })
  const res = await apiFetch(`/rides/?${query}`)
  return res.json()
}

export async function fetchRide(id) {
  const res = await apiFetch(`/rides/${id}/`)
  return res.json()
}

export async function fetchTripsReport() {
  const res = await apiFetch('/reports/trips-over-hour/')
  return res.json()
}

// --- users directory (for rider/driver pickers in the CRUD form) --------

export async function fetchUsers() {
  const res = await apiFetch('/users/?page_size=100')
  return res.json() // { count, next, previous, results: [...] }
}

// --- ride CRUD write paths ------------------------------------------------

export async function createRide(body) {
  const res = await apiFetch('/rides/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function updateRide(id, body) {
  const res = await apiFetch(`/rides/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function deleteRide(id) {
  await apiFetch(`/rides/${id}/`, { method: 'DELETE' })
}

// Backend's custom exception handler flattens DRF ValidationError into
//   { "error": "pickup_latitude: Ensure ...; id_driver: Rider and driver ..." }
// (see ride0 rides/exceptions.py::_flatten_validation). apiFetch throws an
// Error whose message is that flattened string. This helper splits it back
// into a per-field map so the form can highlight individual inputs. Anything
// that doesn't start with a known write-field prefix falls back to a banner.
const WRITE_FIELDS = new Set([
  'status',
  'id_rider',
  'id_driver',
  'pickup_latitude',
  'pickup_longitude',
  'dropoff_latitude',
  'dropoff_longitude',
  'pickup_time',
])

export function parseValidationError(message) {
  if (!message) return { fieldErrors: {}, banner: null }
  const fieldErrors = {}
  const banners = []
  for (const part of message.split('; ')) {
    const idx = part.indexOf(': ')
    if (idx === -1) {
      banners.push(part)
      continue
    }
    const field = part.slice(0, idx).trim()
    const msg = part.slice(idx + 2).trim()
    if (WRITE_FIELDS.has(field)) {
      fieldErrors[field] = msg
    } else {
      banners.push(part)
    }
  }
  return {
    fieldErrors,
    banner: banners.length ? banners.join('; ') : null,
  }
}
