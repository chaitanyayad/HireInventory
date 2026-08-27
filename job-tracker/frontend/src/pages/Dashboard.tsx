import { ArrowRight, Clock, Plus, Send, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useApplications } from '@/hooks/useApplications'
import { DaysBadge, PipelineBar, StatCard, StatusBadge } from '@/components/status'
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  PageHeader,
  PageTransition,
  Skeleton,
  staggerItem,
  staggerParent,
} from '@/components/ui'
import { daysSince, formatStamp } from '@/lib/utils'

export function Dashboard() {
  const { items, stats, loading, error } = useApplications()

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (error) {
    return <ErrorNote>{error}</ErrorNote>
  }

  // Ranked by silence. Resolved applications aren't waiting on anyone.
  const waiting = items
    .filter((item) => item.status !== 'offer' && item.status !== 'rejected')
    .sort((a, b) => daysSince(b.date_applied) - daysSince(a.date_applied))

  const recent = [...items]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  const longest = waiting[0] ? daysSince(waiting[0].date_applied) : 0

  return (
    <PageTransition>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Overview"
          title={
            <>
              Your <span className="grad-text">search</span> at a glance
            </>
          }
          action={
            <Link to="/app/new">
              <Button>
                <Plus className="h-4 w-4" />
                Add application
              </Button>
            </Link>
          }
        />

        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <motion.div variants={staggerItem}>
            <StatCard
              label="Applications sent"
              value={stats?.total ?? 0}
              accent="cyan"
              footnote={
                <span className="inline-flex items-center gap-1">
                  <Send className="h-3 w-3" /> across your whole search
                </span>
              }
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              label="Response rate"
              value={stats?.response_rate ?? 0}
              suffix="%"
              accent="emerald"
              footnote={
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> moved past &ldquo;applied&rdquo;
                </span>
              }
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <StatCard
              label="Longest silence"
              value={longest}
              suffix="d"
              accent={longest >= 30 ? 'amber' : 'teal'}
              footnote={
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {waiting.length} still awaiting a reply
                </span>
              }
            />
          </motion.div>
        </motion.div>

        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="type-display text-lg">Pipeline</h2>
              <p className="mt-0.5 text-xs text-muted">
                The shape of your search, not just the counts
              </p>
            </div>
          </div>
          {stats ? <PipelineBar stats={stats} /> : null}
        </Card>

        <div className="grid gap-5 lg:grid-cols-5">
          {/* Longest silence — the ranking that actually drives follow-ups. */}
          <Card className="overflow-hidden lg:col-span-3">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <h2 className="type-display text-lg">Waiting longest</h2>
              <Link
                to="/app/applications"
                className="inline-flex items-center gap-1 text-xs text-cyan hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {waiting.length === 0 ? (
              <EmptyState
                title="Nothing is waiting"
                body="Every application has been resolved — or you haven't added one yet."
                action={
                  <Link to="/app/new">
                    <Button size="sm">Add your first</Button>
                  </Link>
                }
              />
            ) : (
              <motion.div variants={staggerParent} initial="hidden" animate="show">
                {waiting.slice(0, 5).map((item) => (
                  <motion.div key={item.id} variants={staggerItem}>
                    <Link
                      to={`/app/applications/${item.id}`}
                      className="flex items-center gap-4 border-b border-white/[0.05] px-5 py-4 transition-colors last:border-0 hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.company_name}</p>
                        <p className="truncate text-xs text-muted">{item.role}</p>
                      </div>
                      <StatusBadge status={item.status} />
                      <DaysBadge days={daysSince(item.date_applied)} />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Card>

          <Card className="overflow-hidden lg:col-span-2">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="type-display text-lg">Recent activity</h2>
            </div>

            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-faint">Nothing yet</div>
            ) : (
              <motion.div variants={staggerParent} initial="hidden" animate="show">
                {recent.map((item) => (
                  <motion.div key={item.id} variants={staggerItem}>
                    <Link
                      to={`/app/applications/${item.id}`}
                      className="block border-b border-white/[0.05] px-5 py-3.5 transition-colors last:border-0 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium">{item.company_name}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="type-mono mt-1 text-[11px] text-faint">
                        {formatStamp(item.updated_at)}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
