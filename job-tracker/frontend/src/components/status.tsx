import { cn } from '@/lib/utils'
import { STATUS_ORDER, type DashboardStats, type Status } from '@/services/types'
import { useTick } from '@/hooks/useTick'
import { MonoStamp } from './ui'

/**
 * Status treatment. Derived entirely from the two airmail inks plus muted —
 * the status system never introduces a sixth hue.
 */
const STATUS_STYLE: Record<Status, { marker: string; text: string }> = {
  applied: { marker: 'bg-rule', text: 'text-muted' },
  screening: { marker: 'bg-airmail-blue/40', text: 'text-ink' },
  interview: { marker: 'bg-airmail-blue', text: 'text-ink' },
  offer: { marker: 'bg-airmail-blue', text: 'text-ink' },
  rejected: { marker: 'bg-airmail-red', text: 'text-muted' },
}

export function StatusBadge({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  const style = STATUS_STYLE[status]
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('h-2 w-2 shrink-0', style.marker)} aria-hidden />
      <span className={cn('type-mono', style.text)}>{status}</span>
    </span>
  )
}

/**
 * The dashboard's signature composition: one continuous band segmented by
 * status, so the *shape* of a search reads as a single object instead of four
 * numbers you have to compare in your head.
 *
 * Deliberately not a chart library — hairline dividers landing exactly on
 * segment boundaries is the whole point, and recharts fights that.
 */
export function ProportionBand({ stats }: { stats: DashboardStats }) {
  const total = stats.total

  if (total === 0) {
    return (
      <div className="flex h-24 items-center justify-center border border-rule">
        <MonoStamp>No applications recorded</MonoStamp>
      </div>
    )
  }

  const segments = STATUS_ORDER.map((status) => ({
    status,
    count: stats.by_status[status] ?? 0,
  })).filter((segment) => segment.count > 0)

  return (
    <div>
      <div className="flex h-24 w-full border border-rule">
        {segments.map((segment, index) => {
          const share = (segment.count / total) * 100
          return (
            <div
              key={segment.status}
              className={cn(
                'group relative flex items-end overflow-hidden transition-colors',
                index > 0 && 'border-l border-rule',
                segment.status === 'offer'
                  ? 'bg-airmail-blue'
                  : segment.status === 'interview'
                    ? 'bg-airmail-blue/25'
                    : segment.status === 'screening'
                      ? 'bg-airmail-blue/10'
                      : segment.status === 'rejected'
                        ? 'bg-paper-deep'
                        : 'bg-transparent'
              )}
              style={{ width: `${share}%` }}
              title={`${segment.status}: ${segment.count} of ${total}`}
            >
              <span
                className={cn(
                  'type-mono truncate p-2',
                  segment.status === 'offer' ? 'text-paper' : 'text-muted'
                )}
              >
                {segment.count}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend sits under the band rather than inside it, so narrow segments
          stay readable at any proportion. */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        {STATUS_ORDER.map((status) => (
          <span key={status} className="flex items-center gap-2">
            <StatusBadge status={status} />
            <MonoStamp className="text-ink">
              {stats.by_status[status] ?? 0}
            </MonoStamp>
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Duration made visible. The product's central number — how long something has
 * been quiet — rendered at whatever scale the composition calls for.
 */
export function DayCounter({
  days,
  suffix = 'days',
  className,
  animate = true,
}: {
  days: number
  suffix?: string
  className?: string
  animate?: boolean
}) {
  const ticked = useTick(animate ? days : 0)
  const value = animate ? ticked : days
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className="type-mono-l text-ink">{value}</span>
      <MonoStamp>{suffix}</MonoStamp>
    </span>
  )
}
