import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button, ErrorNote, Field, Input, MonoStamp } from '@/components/ui'
import { Threshold } from './Threshold'

export function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in.')
    }
  }

  return (
    <Threshold caption="Sign in to continue the record.">
      <form onSubmit={onSubmit} className="space-y-8">
        <div>
          <MonoStamp>Job Tracker</MonoStamp>
          <h1 className="type-display-l mt-3">Sign in</h1>
        </div>

        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>

        <ErrorNote>{error}</ErrorNote>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="type-mono text-muted">
          No account?{' '}
          <Link to="/register" className="text-ink underline">
            Register
          </Link>
        </p>
      </form>
    </Threshold>
  )
}
