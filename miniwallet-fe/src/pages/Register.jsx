import {
  At,
  Envelope,
  IdentificationCard,
  Lock,
  Phone,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { Alert } from '../components/Alert.jsx'
import { AuthLayout } from '../components/AuthLayout.jsx'
import { PillButton } from '../components/PillButton.jsx'
import { TextField } from '../components/TextField.jsx'
import { validateEmail, validatePassword } from '../lib/validation.js'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function setField(field) {
    return (value) => setForm((current) => ({ ...current, [field]: value }))
  }

  const localErrors = {
    name: form.name.trim() ? null : 'Nama tidak boleh kosong.',
    username: /^[\w-]{3,30}$/.test(form.username)
      ? null
      : 'Username 3-30 karakter, hanya huruf, angka, - dan _.',
    email: validateEmail(form.email),
    phone: /^08\d{8,12}$/.test(form.phone)
      ? null
      : 'Nomor HP harus diawali 08 dan terdiri dari 10-14 angka.',
    password: validatePassword(form.password),
    password_confirmation:
      form.password_confirmation === form.password
        ? null
        : 'Konfirmasi password tidak cocok.',
  }

  const canSubmit = Object.values(localErrors).every((error) => error === null)

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting || !canSubmit) return

    setSubmitting(true)
    setFormError('')
    setErrors({})

    try {
      await register({
        ...form,
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrors(error.fieldErrors ?? {})

      // Field-level messages render under their inputs; the banner is for
      // anything not attributable to a single field.
      if (Object.keys(error.fieldErrors ?? {}).length === 0) {
        setFormError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Buat akun baru"
      subtitle="Gratis, dan wallet Anda langsung aktif."
      footer={
        <>
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </>
      }
    >
      <Alert onDismiss={() => setFormError('')}>{formError}</Alert>

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="name"
          label="Nama Lengkap"
          icon={IdentificationCard}
          value={form.name}
          onChange={setField('name')}
          error={errors.name?.[0]}
          autoComplete="name"
          disabled={submitting}
        />

        <TextField
          id="username"
          label="Username"
          icon={At}
          value={form.username}
          onChange={setField('username')}
          error={errors.username?.[0]}
          hint="3-30 karakter, tanpa spasi."
          autoComplete="username"
          disabled={submitting}
        />

        <TextField
          id="email"
          label="Email"
          type="email"
          icon={Envelope}
          value={form.email}
          onChange={setField('email')}
          error={errors.email?.[0]}
          autoComplete="email"
          placeholder="nama@example.com"
          disabled={submitting}
        />

        <TextField
          id="phone"
          label="Nomor HP"
          icon={Phone}
          value={form.phone}
          onChange={setField('phone')}
          error={errors.phone?.[0]}
          hint="Contoh: 081234567890"
          autoComplete="tel"
          disabled={submitting}
        />

        <div className="grid gap-x-3 sm:grid-cols-2">
          <TextField
            id="password"
            label="Password"
            type="password"
            icon={Lock}
            value={form.password}
            onChange={setField('password')}
            error={errors.password?.[0]}
            hint="Minimal 8 karakter."
            autoComplete="new-password"
            disabled={submitting}
          />

          <TextField
            id="password_confirmation"
            label="Konfirmasi Password"
            type="password"
            icon={Lock}
            value={form.password_confirmation}
            onChange={setField('password_confirmation')}
            error={
              errors.password_confirmation?.[0] ??
              (form.password_confirmation
                ? localErrors.password_confirmation
                : undefined)
            }
            autoComplete="new-password"
            disabled={submitting}
          />
        </div>

        <div className="mt-6">
          <PillButton
            tone="lime"
            loading={submitting}
            disabled={!canSubmit}
            loadingText="Mendaftarkan…"
          >
            Daftar Sekarang
          </PillButton>
        </div>
      </form>
    </AuthLayout>
  )
}
