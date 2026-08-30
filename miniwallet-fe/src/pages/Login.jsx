import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { Alert } from '../components/Alert.jsx'
import { SubmitButton } from '../components/SubmitButton.jsx'
import { TextField } from '../components/TextField.jsx'
import { validateEmail, validatePassword } from '../lib/validation.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  const canSubmit = !emailError && !passwordError

  async function handleSubmit(event) {
    event.preventDefault()

    // Guard against a double submit from Enter plus a click.
    if (submitting || !canSubmit) return

    setSubmitting(true)
    setFormError('')
    setErrors({})

    try {
      await login({ email: email.trim(), password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrors(error.fieldErrors ?? {})
      setFormError(error.fieldError?.('email') ?? error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Mini Wallet</h1>
          <p>Masuk untuk melihat saldo dan mutasi Anda.</p>
        </header>

        <Alert onDismiss={() => setFormError('')}>{formError}</Alert>

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error={errors.email?.[0]}
            autoComplete="email"
            placeholder="nama@example.com"
            disabled={submitting}
          />

          <TextField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            error={errors.password?.[0]}
            autoComplete="current-password"
            disabled={submitting}
          />

          <SubmitButton
            loading={submitting}
            disabled={!canSubmit}
            loadingText="Masuk…"
          >
            Masuk
          </SubmitButton>
        </form>

        <p className="auth-footer">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
      </div>
    </div>
  )
}
