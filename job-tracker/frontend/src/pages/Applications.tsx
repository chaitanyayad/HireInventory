import { Plus, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApplications } from '@/hooks/useApplications'
import { DaysBadge, STATUS_STYLE, StatusBadge } from '@/components/status'
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Input,
  PageHeader,
  PageTransition,
  Select,
  Skeleton,
  staggerItem,
  staggerParent,
} from '@/components/ui'
import { cn, daysSince, formatStamp } from '@/lib/utils'
import { STATUSES, type Status } from '@/services/types'

type SortKey = 'silence' | 'applied' | 'company' | 'status'

export function Applications() {
  const { items, loading, error } = useApplications()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('silence')

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()

    const filtered = items.filter((item) => {
      if (status !== 'all' && item.status !== status) return false
      if (!needle) return true
      return (
        item.company_name.toLowerCase().includes(needle) ||
        item.role.toLowerCase().includes(needle)
      )
    })

    return filtered.sort((a, b) => {
      switch (sort) {
        case 'silence':
          return daysSince(b.date_applied) - daysSince(a.date_applied)
        case 'applied':
          return new Date(b.date_applied).getTime() - new Date(a.date_applied).getTime()
        case 'company':
          return a.company_name.localeCompare(b.company_name)
        case 'status':
          return a.status.localeCompare(b.status)
      }
    })
  }, [items, query, status, sort])

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Archive"
          title="Applications"
          action={
            <Link to="/app/new">
              <Button>
                <Plus className="h-4 w-4" />
                Add application
              </Button>
            </Link>
          }
        />

        {/* Filter bar */}
        <Card className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-faint" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search company or role…"
                className="pl-11"
                aria-label="Search applications"
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="w-44"
                aria-label="Sort"
              >
                <option value="silence">Longest silence</option>
                <option value="applied">Most recent</option>
                <option value="company">Company A–Z</option>
                <option value="status">Status</option>
              </Select>
            </div>
          </div>

          {/* Status filter pills — faster than a dropdown for five values. */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatus('all')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                status === 'all'
                  ? 'border-cyan/40 bg-cyan/15 text-cyan'
                  : 'border-white/10 text-muted hover:border-white/20 hover:text-ink'
              )}
            >
              All ({items.length})
            </button>
            {STATUSES.map((value) => {
              const count = items.filter((item) => item.status === value).length
              const active = status === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? STATUS_STYLE[value].chip
                      : 'border-white/10 text-muted hover:border-white/20 hover:text-ink'
                  )}
                >
                  {STATUS_STYLE[value].label} ({count})
                </button>
              )
            })}
          </div>
        </Card>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-16" />
            ))}
          </div>
        ) : error ? (
          <ErrorNote>{error}</ErrorNote>
        ) : rows.length === 0 ? (
          <Card>
            <EmptyState
              title={items.length === 0 ? 'No applications yet' : 'Nothing matches'}
              body={
                items.length === 0
                  ? 'Add the first one and the clock starts running on it.'
                  : 'Try a different search or clear the status filter.'
              }
              action={
                items.length === 0 ? (
                  <Link to="/app/new">
                    <Button size="sm">Add application</Button>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    variant="glass"
                    onClick={() => {
                      setQuery('')
                      setStatus('all')
                    }}
                  >
                    Clear filters
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 text-xs text-faint">
              <span>
                {rows.length} of {items.length} shown
              </span>
              {items.length >= 50 ? (
                <span>Showing the 50 most recent — the API returns no more</span>
              ) : null}
            </div>

            <motion.div
              variants={staggerParent}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {rows.map((item) => {
                const resolved = item.status === 'offer' || item.status === 'rejected'
                return (
                  <motion.div key={item.id} variants={staggerItem}>
                    <Link to={`/app/applications/${item.id}`}>
                      <Card hover className="flex items-center gap-4 p-4">
                        {/* Status rail — lets you scan state down the column
                            without reading a single badge. */}
                        <span
                          className="h-10 w-1 shrink-0 rounded-full"
                          style={{ background: STATUS_STYLE[item.status].bar }}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.company_name}</p>
                          <p className="truncate text-sm text-muted">{item.role}</p>
                        </div>

                        <div className="hidden text-right sm:block">
                          <p className="type-mono text-xs text-muted">
                            {formatStamp(item.date_applied)}
                          </p>
                          <p className="text-[11px] text-faint">applied</p>
                        </div>

                        <StatusBadge status={item.status} />

                        <div className="w-12 text-right">
                          <DaysBadge days={daysSince(item.date_applied)} resolved={resolved} />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </>
        )}
      </div>
    </PageTransition>
  )
}
