import { Check, KeyRound, LogOut, Mail, ShieldAlert } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useApplications } from '@/hooks/useApplications'
import { auth as authApi } from '@/services/api'
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  PageHeader,
  PageTransition,
} from '@/components/ui'

/**
 * Account page.
 *
 * Email and password are editable now that PATCH /auth/me and
 * POST /auth/me/password exist. Notification preferences remain unavailable —
 * the worker reads no per-user setting, so a toggle here would do nothing.
 */
export function Settings() {
  const { user, logout, applyUser } = useAuth()
  const { items, socket } = useApplications()

  const [email, setEmail] = useState(user?.email ?? '')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailDone, setEmailDone] = useState(false)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwDone, setPwDone] = useState(false)

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase()

  async function onEmailSubmit(event: FormEvent) {
    event.preventDefault()
    setEmailBusy(true)
    setEmailError(null)
    setEmailDone(false)
    try {
      applyUser(await authApi.updateEmail(email.trim()))
      setEmailDone(true)
    } catch (cause) {
      setEmailError(cause instanceof Error ? cause.message : 'Could not update the email.')
    } finally {
      setEmailBusy(false)
    }
  }

  async function onPasswordSubmit(event: FormEvent) {
    event.preventDefault()
    setPwError(null)
    setPwDone(false)

    if (pw.next !== pw.confirm) {
      setPwError('The two new passwords do not match.')
      return
    }
    if (pw.next.length < 8) {
      setPwError('Use at least 8 characters.')
      return
    }

    setPwBusy(true)
    try {
      await authApi.changePassword(pw.current, pw.next)
      setPw({ current: '', next: '', confirm: '' })
      setPwDone(true)
    } catch (cause) {
      setPwError(cause instanceof Error ? cause.message : 'Could not change the password.')
    } finally {
      setPwBusy(false)
    }
  }

  return (
    <PageTransition>
      <div className="max-w-3xl space-y-6">
        <PageHeader eyebrow="Account" title="Settings" />

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="grad-primary flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-[#04121a]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{user?.email}</p>
              <p className="type-mono mt-0.5 text-xs text-faint">{user?.id}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="glass-subtle rounded-xl p-4">
              <p className="text-xs text-muted uppercase">Applications</p>
              <p className="type-display mt-1 text-2xl">{items.length}</p>
            </div>
            <div className="glass-subtle rounded-xl p-4">
              <p className="text-xs text-muted uppercase">Live channel</p>
              <p className="type-display mt-1 text-2xl capitalize">{socket}</p>
            </div>
          </div>
        </Card>

        {/* Change email */}
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Mail className="h-4 w-4 text-cyan" />
            <h2 className="type-display text-lg">Email address</h2>
          </div>
          <form onSubmit={onEmailSubmit} className="space-y-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setEmailDone(false)
                }}
                required
              />
            </Field>
            <ErrorNote>{emailError}</ErrorNote>
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={emailBusy || email === user?.email}>
                {emailBusy ? 'Saving…' : 'Update email'}
              </Button>
              {emailDone ? (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald"
                >
                  <Check className="h-3.5 w-3.5" /> Updated
                </motion.span>
              ) : null}
            </div>
          </form>
        </Card>

        {/* Change password */}
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-cyan" />
            <h2 className="type-display text-lg">Password</h2>
          </div>
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <Field label="Current password">
              <Input
                type="password"
                value={pw.current}
                onChange={(event) => setPw((s) => ({ ...s, current: event.target.value }))}
                autoComplete="current-password"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" hint="At least 8 characters">
                <Input
                  type="password"
                  value={pw.next}
                  onChange={(event) => setPw((s) => ({ ...s, next: event.target.value }))}
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field label="Confirm new password">
                <Input
                  type="password"
                  value={pw.confirm}
                  onChange={(event) => setPw((s) => ({ ...s, confirm: event.target.value }))}
                  autoComplete="new-password"
                  required
                />
              </Field>
            </div>
            <ErrorNote>{pwError}</ErrorNote>
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={pwBusy}>
                {pwBusy ? 'Changing…' : 'Change password'}
              </Button>
              {pwDone ? (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald"
                >
                  <Check className="h-3.5 w-3.5" /> Password changed
                </motion.span>
              ) : null}
            </div>
            <p className="text-xs text-faint">
              Sessions on other devices stay signed in until their token expires — there is no
              token revocation list.
            </p>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-6 py-4">
            <ShieldAlert className="h-4 w-4 text-amber" />
            <h2 className="type-display text-lg">Not available yet</h2>
          </div>
          <div className="flex items-start justify-between gap-6 px-6 py-4">
            <div>
              <p className="text-sm font-medium">Email notification preferences</p>
              <p className="mt-1 text-xs leading-relaxed text-faint">
                The worker reads no per-user setting — interview reminders send whenever
                EMAILS_ENABLED is on. A toggle here would not change anything.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-faint">
              No endpoint
            </span>
          </div>
        </Card>

        <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="font-medium">Sign out</p>
            <p className="mt-1 text-xs text-faint">
              The token is held in memory, so closing the tab signs you out too.
            </p>
          </div>
          <Button variant="danger" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </Card>
      </div>
    </PageTransition>
  )
}
