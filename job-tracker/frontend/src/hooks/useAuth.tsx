import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { auth as authApi } from '@/services/api'
import { setToken, setUnauthorizedHandler } from '@/services/client'
import type { User } from '@/services/types'

interface AuthValue {
  user: User | null
  /** Distinguishes "checking" from "definitely signed out" on first paint. */
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  /** Apply a user record the server just returned (e.g. after an email change). */
  applyUser: (user: User) => void
}

const AuthContext = createContext<AuthValue | null>(null)

/**
 * The JWT is held in memory only — never localStorage or a cookie.
 *
 * This is the project plan's explicit requirement, and the tradeoff is real:
 * a page refresh signs you out, because there is nowhere to read the token
 * back from and the backend exposes no refresh endpoint. It is a deliberate
 * XSS-surface choice, not a bug. Fixing it properly means adding a
 * refresh-token endpoint server-side.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    // Any 401 from any request ends the session — the 60-minute expiry means
    // this fires during normal use, not just on tampering.
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const token = await authApi.login(email, password)
      setToken(token.access_token)
      // Fetch identity rather than decoding the JWT: the token carries only
      // `sub`, and this also proves the token works before we route anywhere.
      setUser(await authApi.me())
    } catch (error) {
      setToken(null)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        // /auth/register returns the user but no token, so sign in straight
        // after to get one. Two calls, but it keeps the backend honest.
        await authApi.register(email, password)
      } finally {
        setLoading(false)
      }
      await login(email, password)
    },
    [login]
  )

  const applyUser = useCallback((next: User) => setUser(next), [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, applyUser }),
    [user, loading, login, register, logout, applyUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    // `state.from` lets the login page send you back where you were headed.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
