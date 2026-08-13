import { Link } from 'react-router-dom'
import { AirmailEdge, Button, MonoStamp, Rule } from '@/components/ui'
import { DayCounter } from '@/components/status'

/**
 * Composition: correspondence wall.
 *
 * One oversized record in columns 1–7, a receding stack in 8–12. Off-centre by
 * design — optical weight sits left and the right column runs past the fold
 * without resolving. Reduced to a card grid, the *accumulation* idea dies,
 * which is the only idea this page has.
 */

// Illustrative records for the establishing shot. Not fetched: the landing
// page is public, and inventing a logged-out API call to decorate a hero is
// the kind of thing that breaks in a demo.
const ARCHIVE = [
  { company: 'Cloudflare', role: 'Software Engineer, Intern', days: 41 },
  { company: 'Zerodha', role: 'Backend Engineer', days: 33 },
  { company: 'Postman', role: 'Platform Engineer', days: 28 },
  { company: 'Razorpay', role: 'SDE-1', days: 22 },
  { company: 'Atlassian', role: 'Graduate Engineer', days: 16 },
  { company: 'Freshworks', role: 'Associate SDE', days: 9 },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <AirmailEdge />

      <header className="flex items-center justify-between px-8 py-5">
        <span className="type-mono text-ink">Job Tracker</span>
        <nav className="flex items-center gap-6">
          <Link to="/login" className="type-mono text-muted hover:text-ink">
            Sign in
          </Link>
          <Link to="/register">
            <Button size="sm">Start a record</Button>
          </Link>
        </nav>
      </header>

      <Rule />

      <main className="grid grid-cols-1 lg:grid-cols-12">
        {/* The artifact — one record at monumental scale. */}
        <section className="e-hold border-rule lg:col-span-7 lg:border-r">
          <div className="flex min-h-[60vh] flex-col justify-between p-8 lg:p-14">
            <div>
              <MonoStamp>Application 001 · sent 14 may 2026</MonoStamp>
              <h1 className="type-display-xl mt-8 max-w-[12ch]">
                No reply yet.
              </h1>
              <p className="mt-8 max-w-[46ch] text-muted">
                Every application you send is a letter into an institution that
                answers on its own schedule. This keeps the record: what you
                sent, when you sent it, and exactly how long it has been quiet.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap items-end justify-between gap-8">
              <div>
                <MonoStamp>Silence</MonoStamp>
                <div className="mt-2">
                  <DayCounter days={41} />
                </div>
              </div>
              <Link to="/register">
                <Button size="lg">Start a record</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* The accumulation — the archive receding. */}
        <section className="e-cut lg:col-span-5">
          <div className="flex items-center justify-between border-b border-rule px-8 py-4">
            <MonoStamp>The archive</MonoStamp>
            <MonoStamp>{ARCHIVE.length} sent</MonoStamp>
          </div>

          {ARCHIVE.map((record, index) => (
            <article
              key={record.company}
              className="flex items-baseline justify-between border-b border-rule px-8 py-5"
              // Opacity recession: the further down the wall, the further back
              // in the room. This is the page's one heavy interaction budget
              // spent statically rather than on scroll.
              style={{ opacity: 1 - index * 0.13 }}
            >
              <div className="min-w-0">
                <p className="type-display-m truncate">{record.company}</p>
                <p className="type-mono mt-1 truncate text-muted">
                  {record.role}
                </p>
              </div>
              <MonoStamp className="shrink-0 pl-6 text-ink">
                {record.days}d
              </MonoStamp>
            </article>
          ))}
        </section>
      </main>

      {/* The mechanism. */}
      <section className="border-t border-rule">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {[
            {
              title: 'Every change, live',
              body: 'Move an application to Interview and every tab you have open updates. No refresh, no stale number.',
            },
            {
              title: 'The wait, measured',
              body: 'Applications sort by silence, so the one that has gone longest without an answer is the one you see first.',
            },
            {
              title: 'Read your own history',
              body: 'Ask for an analysis of everything you have sent and get plain sentences about what is actually happening.',
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className={index > 0 ? 'border-rule md:border-l' : undefined}
            >
              <div className="p-8">
                <div className="e-rule mb-6 h-px w-full bg-ink" />
                <h2 className="type-display-m">{item.title}</h2>
                <p className="mt-3 max-w-[38ch] text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The single door. */}
      <section className="e-hold border-t border-rule">
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-14">
          <p className="type-display-l max-w-[16ch]">
            Start the record today.
          </p>
          <Link to="/register">
            <Button size="lg">Create an account</Button>
          </Link>
        </div>
      </section>

      <footer className="flex items-center justify-between border-t border-rule px-8 py-5">
        <MonoStamp>Job Tracker</MonoStamp>
        <MonoStamp>FastAPI · Postgres · Redis · RabbitMQ · React</MonoStamp>
      </footer>
    </div>
  )
}
