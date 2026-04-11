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
