/**
 * The one place that talks to the API.
 *
 * The token lives in memory only (see hooks/useAuth.tsx for why), so it is
 * handed to this module rather than read from storage. `setToken` is called by
 * the auth provider on login and with null on logout.
 */

const BASE = import.meta.env.VITE_API_URL ?? '/api'

let token: string | null = null
let onUnauthorized: (() => void) | null = null

export function setToken(next: string | null) {
  token = next
}

export function getToken() {
  return token
}

/** The auth provider registers a callback so a 401 anywhere can end the session. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  status: number
  /** FastAPI's `detail`, which is a string for HTTPException and an array for 422. */
  detail: unknown

  constructor(status: number, message: string, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

/**
 * FastAPI reports validation failures as a list of objects, not a string.
 * Flattening it here means every caller can just render `error.message`.
 */
function readDetail(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string; loc?: unknown[] } | undefined
    if (first?.msg) {
      const field = Array.isArray(first.loc) ? first.loc.at(-1) : undefined
      return field ? `${String(field)}: ${first.msg}` : first.msg
    }
  }
  return fallback
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, { ...init, headers })
  } catch {
    // fetch only rejects on network failure, never on a non-2xx status.
    throw new ApiError(0, 'Cannot reach the server. Is the API running?')
  }

  if (response.status === 204) return undefined as T

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json')
  const body = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    if (response.status === 401) {
      // Expired or revoked. Ending the session here means every caller doesn't
      // have to check — the JWT expires after 60 min and this WILL happen.
      onUnauthorized?.()
      throw new ApiError(401, 'Your session expired. Sign in again.')
    }
    if (response.status === 429) {
      // Two separate limiters exist: per-IP-per-minute on auth, and a much
      // tighter per-user-per-hour budget on /ai. The message differs because
      // the recovery time does.
      const isAi = path.startsWith('/ai')
      throw new ApiError(
        429,
        isAi
          ? 'AI request limit reached. The budget resets hourly.'
          : 'Too many requests. Wait a moment and try again.',
        body?.detail
      )
    }
    throw new ApiError(
      response.status,
      readDetail(body?.detail, `Request failed (${response.status})`),
      body?.detail
    )
  }

  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
