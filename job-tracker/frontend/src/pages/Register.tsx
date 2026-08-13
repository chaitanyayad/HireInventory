import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button, ErrorNote, Field, Input, MonoStamp } from '@/components/ui'
import { Threshold } from './Threshold'

export function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }

    try {
      await register(email, password)
      navigate('/app', { replace: true })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not create the account.'
      )
    }
  }

  return (
    <Threshold caption="Registration is capped at 5 attempts per minute.">
      <form onSubmit={onSubmit} className="space-y-8">
        <div>
          <MonoStamp>Job Tracker</MonoStamp>
          <h1 className="type-display-l mt-3">Register</h1>
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

        <Field label="Password" hint="8 characters minimum">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>

        <Field label="Confirm password">
          <Input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>

        <ErrorNote>{error}</ErrorNote>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>

        <p className="type-mono text-muted">
          Already registered?{' '}
          <Link to="/login" className="text-ink underline">
            Sign in
          </Link>
        </p>
      </form>
    </Threshold>
  )
}
