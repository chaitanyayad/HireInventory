import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button, ErrorNote, Field, Input } from '@/components/ui'
import { AuthLayout } from './AuthLayout'

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
      setError(cause instanceof Error ? cause.message : 'Could not create the account.')
    }
  }

  return (
    <AuthLayout
      title="Start tracking"
      subtitle="One account, every application, in one place."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-cyan hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            autoFocus
          />
        </Field>

        <Field label="Password" hint="At least 8 characters">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </Field>

        <Field label="Confirm password">
          <Input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </Field>

        <ErrorNote>{error}</ErrorNote>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-xs text-faint">
          Registration is limited to 5 attempts per minute.
        </p>
      </form>
    </AuthLayout>
  )
}
