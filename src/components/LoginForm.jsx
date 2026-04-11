import { useState } from 'react'
import { login } from '../services/api'
import { LogoMark, SpinnerIcon } from './icons'

export default function LoginForm({ onLoginSuccess, flash }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(email, password)
      onLoginSuccess(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="login-form__logo" aria-hidden="true">
          <LogoMark size={22} />
        </div>
        <h1 className="login-form__title">Sign in to Wingz</h1>
        <p className="login-form__subtitle">
          Use your admin account to manage rides.
        </p>

        {flash && <p className="login-form__flash">{flash}</p>}

        <label className="login-form__field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="admin@wingz.com"
          />
        </label>

        <label className="login-form__field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p className="error login-form__error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="login-form__submit"
          disabled={loading || !email || !password}
        >
          {loading && <SpinnerIcon size={16} />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
