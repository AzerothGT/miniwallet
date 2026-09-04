import { EnvelopeIcon as Envelope, LockIcon as Lock } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.js'
import { Alert } from '../../components/Alert.jsx'
import { AuthLayout } from '../../components/AuthLayout.jsx'
import { PillButton } from '../../components/PillButton.jsx'
import { TextField } from '../../components/TextField.jsx'
import { validateEmail, validatePassword } from '../../lib/validation.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = !validateEmail(email) && !validatePassword(password)

  async function handleSubmit(event) {
    event.preventDefault()

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
    <AuthLayout
      title="Masuk ke akun Anda"
      subtitle="Lihat saldo dan kelola transaksi."
      footer={
        <>
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </>
      }
    >
      <Alert onDismiss={() => setFormError('')}>{formError}</Alert>

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="email"
          label="Email"
          type="email"
          icon={Envelope}
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
          icon={Lock}
          value={password}
          onChange={setPassword}
          error={errors.password?.[0]}
          autoComplete="current-password"
          disabled={submitting}
        />

        <div className="mt-6">
          <PillButton
            tone="lime"
            loading={submitting}
            disabled={!canSubmit}
            loadingText="Masuk…"
          >
            Masuk
          </PillButton>
        </div>
      </form>
    </AuthLayout>
  )
}
