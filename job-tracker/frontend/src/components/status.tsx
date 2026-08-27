import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useTick } from '@/hooks/useTick'
import { STATUS_ORDER, type DashboardStats, type Status } from '@/services/types'

/**
 * Status vocabulary and the dashboard's data displays.
 *
 * Five statuses, five hues — cool for in-flight, green for won, red for lost.
 * No purple anywhere, by request.
 */
export const STATUS_STYLE: Record<
  Status,
  { label: string; dot: string; text: string; chip: string; bar: string }
> = {
  applied: {
    label: 'Applied',
    dot: 'bg-steel',
    text: 'text-steel',
    chip: 'bg-steel/12 text-[#a4b4c4] border-steel/25',
    bar: 'linear-gradient(135deg,#64748b,#94a3b8)',
  },
  screening: {
    label: 'Screening',
    dot: 'bg-cyan',
    text: 'text-cyan',
    chip: 'bg-cyan/12 text-cyan border-cyan/30',
    bar: 'linear-gradient(135deg,#06b6d4,#22d3ee)',
  },
  interview: {
    label: 'Interview',
    dot: 'bg-blue',
    text: 'text-blue',
    chip: 'bg-blue/12 text-[#7dabfb] border-blue/30',
    bar: 'linear-gradient(135deg,#2563eb,#3b82f6)',
  },
  offer: {
    label: 'Offer',
    dot: 'bg-emerald',
    text: 'text-emerald',
    chip: 'bg-emerald/12 text-emerald border-emerald/30',
    bar: 'linear-gradient(135deg,#059669,#10b981)',
  },
  rejected: {
    label: 'Rejected',
    dot: 'bg-rose',
    text: 'text-rose',
    chip: 'bg-rose/12 text-rose border-rose/30',
    bar: 'linear-gradient(135deg,#e11d48,#f43f5e)',
  },
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const style = STATUS_STYLE[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        style.chip,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  )
}

/** A number that counts up on mount. Respects reduced motion via useTick. */
export function Counter({ value, className }: { value: number; className?: string }) {
  const shown = useTick(value)
  return <span className={cn('type-mono', className)}>{shown}</span>
}

export function StatCard({
  label,
  value,
  suffix,
  accent = 'cyan',
  footnote,
}: {
  label: string
  value: number
  suffix?: string
  accent?: 'teal' | 'cyan' | 'blue' | 'amber' | 'emerald'
  footnote?: ReactNode
}) {
  const glow: Record<string, string> = {
    teal: 'from-teal/22',
    cyan: 'from-cyan/22',
    blue: 'from-blue/22',
    amber: 'from-amber/22',
    emerald: 'from-emerald/22',
  }
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="glass relative overflow-hidden rounded-2xl p-5"
    >
      {/* Corner light — gives each tile a direction the flat glass alone lacks. */}
      <div
        className={cn(
          'pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br to-transparent blur-2xl',
          glow[accent]
        )}
      />
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="type-display mt-3 flex items-baseline gap-1 text-4xl">
        <Counter value={value} />
        {suffix ? <span className="text-xl text-muted">{suffix}</span> : null}
      </p>
      {footnote ? <p className="mt-2 text-xs text-faint">{footnote}</p> : null}
    </motion.div>
  )
}

/**
 * The pipeline as one proportional bar rather than five separate counts —
 * the shape of a search is the insight, and separate tiles make you compare
 * numbers in your head.
 */
export function PipelineBar({ stats }: { stats: DashboardStats }) {
  const total = stats.total

  if (total === 0) {
    return (
      <div className="glass-subtle flex h-16 items-center justify-center rounded-xl text-sm text-faint">
        No applications yet
      </div>
    )
  }

  const segments = STATUS_ORDER.map((status) => ({
    status,
    count: stats.by_status[status] ?? 0,
  })).filter((s) => s.count > 0)

  return (
    <div>
      <div className="flex h-16 w-full gap-1.5 overflow-hidden">
        {segments.map((segment, index) => {
          const share = (segment.count / total) * 100
          return (
            <motion.div
              key={segment.status}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${share}%`, opacity: 1 }}
              transition={{
                duration: 0.7,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ scaleY: 1.06 }}
              title={`${STATUS_STYLE[segment.status].label}: ${segment.count} of ${total}`}
              className="group relative flex items-end rounded-lg"
              style={{ background: STATUS_STYLE[segment.status].bar }}
            >
              <span className="type-mono truncate p-2 text-xs font-medium text-black/70">
                {segment.count}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Legend under the bar, so narrow segments stay readable at any split. */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {STATUS_ORDER.map((status) => (
          <span key={status} className="flex items-center gap-2 text-xs">
            <span className={cn('h-2 w-2 rounded-full', STATUS_STYLE[status].dot)} />
            <span className="text-muted">{STATUS_STYLE[status].label}</span>
            <span className="type-mono text-ink">{stats.by_status[status] ?? 0}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Elapsed-days pill. Amber past two weeks, rose past a month — silence gets louder. */
export function DaysBadge({ days, resolved = false }: { days: number; resolved?: boolean }) {
  if (resolved) {
    return <span className="type-mono text-sm text-faint">—</span>
  }
  const tone =
    days >= 30 ? 'text-rose' : days >= 14 ? 'text-amber' : days >= 7 ? 'text-cyan' : 'text-muted'
  return (
    <span className={cn('type-mono text-sm font-medium', tone)}>
      {days}d
    </span>
  )
}
