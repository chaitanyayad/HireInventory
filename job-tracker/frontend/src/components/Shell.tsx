import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useApplications } from '@/hooks/useApplications'
import { MonoStamp } from './ui'

const NAV = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/applications', label: 'Applications', end: false },
  { to: '/app/new', label: 'Add', end: false },
  { to: '/app/insights', label: 'Insights', end: false },
  { to: '/app/settings', label: 'Account', end: false },
]

/**
 * The camera position.
 *
 * A fixed left frame that never scrolls and never changes width. Content moves
 * past it; it does not move. Everything else in the app is composed inside the
 * region to its right.
 */
export function Shell() {
  const { user, logout } = useAuth()
  const { socket } = useApplications()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-18 flex-col justify-between border-r border-rule bg-paper py-6">
        <div>
          <div className="px-4">
            {/* The mark: a filed record, not a logo. */}
            <div className="h-6 w-6 border border-ink">
              <div className="mt-2 h-px w-full bg-ink" />
              <div className="mt-1 h-px w-2/3 bg-ink" />
            </div>
          </div>

          <nav className="mt-10 flex flex-col">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    // Active is a rule on the left edge, never a filled pill.
                    'relative py-3 pl-4 pr-2 transition-colors',
                    isActive
                      ? 'text-ink before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-airmail-blue'
                      : 'text-muted hover:text-ink'
                  )
                }
                title={item.label}
              >
                <span className="type-mono [writing-mode:vertical-rl]">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-4 px-2">
          {/* Live indicator. A dot and a mono word — no pulse animation. */}
          <span
            className="flex flex-col items-center gap-2"
            title={
              socket === 'live'
                ? 'Live: status changes appear without refreshing'
                : socket === 'connecting'
                  ? 'Connecting to the live channel'
                  : 'Offline: status changes need a refresh'
            }
          >
            <span
              className={cn(
                'h-2 w-2',
                socket === 'live'
                  ? 'bg-airmail-blue'
                  : socket === 'connecting'
                    ? 'bg-rule'
                    : 'bg-airmail-red'
              )}
              aria-hidden
            />
            <MonoStamp className="[writing-mode:vertical-rl]">
              {socket}
            </MonoStamp>
          </span>

          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="type-mono text-muted transition-colors hover:text-ink [writing-mode:vertical-rl]"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="pl-18">
        <div className="flex items-center justify-between border-b border-rule px-8 py-4">
          <MonoStamp>{user?.email}</MonoStamp>
          <MonoStamp>
            {new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </MonoStamp>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
