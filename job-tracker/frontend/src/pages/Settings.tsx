import { useAuth } from '@/hooks/useAuth'
import { useApplications } from '@/hooks/useApplications'
import { Button, MonoStamp, Rule } from '@/components/ui'

/**
 * Account.
 *
 * The project plan lists email/password changes and notification preferences.
 * The API has no endpoints for any of them — there is no PATCH /auth/me, no
 * password route, and no preferences table. Rather than render controls that
 * silently do nothing, each is shown disabled with the reason stated.
 */
export function Settings() {
  const { user, logout } = useAuth()
  const { items, socket } = useApplications()

  return (
    <div className="max-w-[720px] p-8">
      <MonoStamp>Account</MonoStamp>
      <h1 className="type-display-l mt-3">{user?.email}</h1>

      <dl className="mt-10 border-t border-rule">
        {[
          ['User ID', user?.id ?? '—'],
          ['Applications recorded', String(items.length)],
          ['Live channel', socket],
        ].map(([term, value]) => (
          <div
            key={term}
            className="flex items-baseline justify-between border-b border-rule py-4"
          >
            <dt className="type-mono text-muted">{term}</dt>
            <dd className="type-mono text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <MonoStamp>Not available</MonoStamp>
        <Rule className="mt-3" />
        <ul className="mt-4 space-y-4">
          {[
            [
              'Change email',
              'The API exposes no endpoint to update a user record.',
            ],
            [
              'Change password',
              'No password-change route exists on the backend.',
            ],
            [
              'Email notification preferences',
              'The notification worker reads no per-user preference; interview reminders are sent whenever EMAILS_ENABLED is on.',
            ],
            [
              'Edit an application',
              'Only PATCH /applications/{id}/status exists. Company, role, dates, and notes are fixed once created.',
            ],
          ].map(([title, reason]) => (
            <li key={title} className="flex items-baseline justify-between gap-6">
              <div>
                <p className="text-ink">{title}</p>
                <p className="type-mono mt-1 text-muted">{reason}</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Unavailable
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <Rule />
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-ink">Sign out</p>
            <p className="type-mono mt-1 text-muted">
              The token is held in memory, so closing the tab signs you out too.
            </p>
          </div>
          <Button variant="danger" onClick={logout}>
            Sign out
          </Button>
        </div>
      </section>
    </div>
  )
}
