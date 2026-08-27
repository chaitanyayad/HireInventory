import { ArrowRight, Bell, Radio, Sparkles, Timer } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Button, Card, staggerItem, staggerParent } from '@/components/ui'
import { STATUS_STYLE } from '@/components/status'
import type { Status } from '@/services/types'

// Illustrative rows for the hero preview. Deliberately not fetched — the
// landing page is public, and inventing a logged-out API call to decorate a
// hero is the kind of thing that breaks in a demo.
const PREVIEW: { company: string; role: string; days: number; status: Status }[] = [
  { company: 'Cloudflare', role: 'Software Engineer', days: 41, status: 'interview' },
  { company: 'Zerodha', role: 'Backend Engineer', days: 33, status: 'screening' },
  { company: 'Postman', role: 'Platform Engineer', days: 28, status: 'applied' },
  { company: 'Razorpay', role: 'SDE-1', days: 12, status: 'offer' },
]

const FEATURES = [
  {
    icon: Radio,
    title: 'Live everywhere',
    body: 'Move an application to Interview and every open tab updates instantly — Redis pub/sub fanned out over WebSockets.',
  },
  {
    icon: Timer,
    title: 'Silence, measured',
    body: 'Applications rank by how long they have gone unanswered, so the one that needs a follow-up is always on top.',
  },
  {
    icon: Sparkles,
    title: 'AI that reads your history',
    body: 'Gemini analyses every application you have logged, drafts cover letters, and preps you per interview.',
  },
  {
    icon: Bell,
    title: 'Reminders that arrive',
    body: 'A RabbitMQ worker queues interview reminder emails with manual acks — a crash redelivers, never drops.',
  },
]

export function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <span className="type-display text-lg">HireInventory</span>
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <Link to="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-20 sm:px-8 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="glass-subtle inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-muted">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
              </span>
              Real-time status tracking
            </span>

            <h1 className="type-display mt-6 text-5xl sm:text-6xl">
              Every application.
              <br />
              <span className="grad-text">Every silence.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              A job tracker that measures what actually hurts — how long you have been waiting, and
              on what. Live updates, cached stats, and AI that reads your own history back to you.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/register">
                <Button size="lg">
                  Start tracking
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="glass">
                  Sign in
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-faint">
              {['FastAPI', 'PostgreSQL', 'Redis', 'RabbitMQ', 'WebSockets', 'React'].map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          </motion.div>

          {/* Preview card — a real slice of the product, not a stock mockup. */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: 1200 }}
          >
            <div className="glass-strong overflow-hidden rounded-3xl p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-muted uppercase">Waiting longest</p>
                  <p className="type-display mt-1 text-2xl">4 open</p>
                </div>
                <span className="glass-subtle rounded-full px-3 py-1.5 text-xs text-emerald">
                  ● Live
                </span>
              </div>

              <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-2">
                {PREVIEW.map((row) => (
                  <motion.div
                    key={row.company}
                    variants={staggerItem}
                    className="glass-subtle flex items-center gap-3 rounded-xl p-3.5"
                  >
                    <span
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ background: STATUS_STYLE[row.status].bar }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.company}</p>
                      <p className="truncate text-xs text-muted">{row.role}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${STATUS_STYLE[row.status].chip}`}
                    >
                      {STATUS_STYLE[row.status].label}
                    </span>
                    <span className="type-mono w-9 text-right text-xs text-amber">{row.days}d</span>
                  </motion.div>
                ))}
              </motion.div>

              <div className="mt-5 flex h-2 gap-1.5">
                <div className="flex-[3] rounded-full" style={{ background: STATUS_STYLE.applied.bar }} />
                <div className="flex-[2] rounded-full" style={{ background: STATUS_STYLE.screening.bar }} />
                <div className="flex-[2] rounded-full" style={{ background: STATUS_STYLE.interview.bar }} />
                <div className="flex-1 rounded-full" style={{ background: STATUS_STYLE.offer.bar }} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div key={feature.title} variants={staggerItem}>
                <Card hover className="h-full p-6">
                  <div className="glass-subtle mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                    <Icon className="h-5 w-5 text-cyan" />
                  </div>
                  <h3 className="type-display text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-strong relative overflow-hidden rounded-3xl px-8 py-14 text-center"
        >
          <div className="grad-primary pointer-events-none absolute inset-x-0 top-0 h-1 opacity-80" />
          <h2 className="type-display text-3xl sm:text-4xl">
            Stop guessing where you <span className="grad-text">stand</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">
            Log the first application in under a minute. The clock starts immediately.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/register">
              <Button size="lg">
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-faint sm:px-8">
          <span>HireInventory</span>
          <span>Built by Chaitanya Yadav</span>
        </div>
      </footer>
    </div>
  )
}
