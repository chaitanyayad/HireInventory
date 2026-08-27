import {
  LayoutDashboard,
  ListChecks,
  Plus,
  Sparkles,
  UserRound,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/applications', label: 'Applications', icon: ListChecks, end: false },
  { to: '/app/new', label: 'Add new', icon: Plus, end: false },
  { to: '/app/insights', label: 'AI Insights', icon: Sparkles, end: false },
  { to: '/app/settings', label: 'Account', icon: UserRound, end: false },
]

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="type-display text-lg tracking-tight">HireInventory</span>
    </div>
  )
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}>
            {({ isActive }) => (
              <div
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
                  isActive ? 'text-ink' : 'text-muted hover:bg-white/5 hover:text-ink'
                )}
              >
                {/* Shared layout id animates the active pill between items
                    instead of cross-fading two separate backgrounds. */}
                {isActive ? (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="glass absolute inset-0 rounded-xl"
                  />
                ) : null}
                <Icon className="relative z-10 h-[18px] w-[18px]" strokeWidth={2} />
                <span className="relative z-10 font-medium">{item.label}</span>
                {isActive ? (
                  <span className="grad-primary relative z-10 ml-auto h-1.5 w-1.5 rounded-full" />
                ) : null}
              </div>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

function LiveDot({ state }: { state: 'live' | 'connecting' | 'offline' }) {
  const map = {
    live: { color: 'bg-emerald', label: 'Live', hint: 'Status changes appear without refreshing' },
    connecting: { color: 'bg-amber', label: 'Connecting', hint: 'Opening the live channel' },
    offline: { color: 'bg-rose', label: 'Offline', hint: 'Changes need a refresh' },
  }[state]

  return (
    <span
      title={map.hint}
      className="glass-subtle inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
    >
      <span className="relative flex h-2 w-2">
        {state === 'live' ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" />
        ) : null}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', map.color)} />
      </span>
      <span className="text-muted">{map.label}</span>
    </span>
  )
}

export function Shell() {
  const { user, logout } = useAuth()
  const { socket } = useApplications()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function signOut() {
    logout()
    navigate('/login')
  }

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-white/[0.07] p-5 lg:flex">
        <div>
          <Brand />
          <div className="mt-9">
            <NavItems />
          </div>
        </div>

        <div className="space-y-3">
          <LiveDot state={socket} />
          <div className="glass flex items-center gap-3 rounded-xl p-3">
            <div className="grad-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-[#04121a]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted" title={user?.email}>
                {user?.email}
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              title="Sign out"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-rose"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <LiveDot state={socket} />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-muted hover:text-ink"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="glass-strong fixed inset-y-0 right-0 z-50 w-72 p-5 lg:hidden"
            >
              <div className="mb-8 flex items-center justify-between">
                <Brand />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-muted hover:text-ink"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavItems onNavigate={() => setMobileOpen(false)} />
              <button
                type="button"
                onClick={signOut}
                className="mt-6 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-muted transition-colors hover:bg-white/5 hover:text-rose"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Sign out
              </button>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <main className="px-5 py-8 sm:px-8 lg:ml-64 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
