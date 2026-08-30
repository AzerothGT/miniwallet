import axios from 'axios'

/**
 * Shared HTTP client.
 *
 * `withCredentials` is what lets the browser send the httpOnly auth cookie to
 * the API on a different origin. The token is never read or stored by this code,
 * which is the whole point: JavaScript cannot leak what it cannot see.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

/**
 * Normalises every failure into one predictable shape so components never have
 * to dig through axios internals.
 *
 * - `fieldErrors` mirrors Laravel's 422 payload, keyed by field name.
 * - `message` is always safe to show to the user.
 */
export class ApiError extends Error {
  constructor({ message, status, code, fieldErrors, details }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors ?? {}
    this.details = details ?? {}
  }

  /** First error message for a given field, if any. */
  fieldError(field) {
    return this.fieldErrors[field]?.[0]
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new ApiError({
          message:
            'Tidak dapat menghubungi server. Periksa koneksi internet Anda.',
          status: 0,
          code: 'network_error',
        }),
      )
    }

    const { status, data } = error.response

    return Promise.reject(
      new ApiError({
        message: data?.message ?? 'Terjadi kesalahan pada server.',
        status,
        code: data?.code,
        fieldErrors: data?.errors,
        details: data,
      }),
    )
  },
)

export default api
