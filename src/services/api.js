const API_BASE = '/api'

const email = import.meta.env.VITE_ADMIN_EMAIL || 'admin@wingz.com'
const password = import.meta.env.VITE_ADMIN_PASSWORD || 'adminpass123'
const AUTH_HEADER = 'Basic ' + btoa(`${email}:${password}`)

export async function fetchRides(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) query.append(k, v)
  })
  const res = await fetch(`${API_BASE}/rides/?${query}`, {
    headers: { Authorization: AUTH_HEADER },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || data.detail || `HTTP ${res.status}`)
  }
  return res.json()
}
