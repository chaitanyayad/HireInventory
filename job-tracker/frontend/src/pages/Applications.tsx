import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApplications } from '@/hooks/useApplications'
import { StatusBadge } from '@/components/status'
import {
  Button,
  ErrorNote,
  Input,
  MonoStamp,
  Select,
  Spinner,
} from '@/components/ui'
import { cn, daysSince, formatStamp } from '@/lib/utils'
import { STATUSES, type Status } from '@/services/types'

type SortKey = 'silence' | 'applied' | 'company' | 'status'

/**
 * Composition: ledger.
 *
 * A dense table with a mono left gutter carrying the day-count for every row.
 * The filter strip is sticky — the camera holds while the content passes
 * through it. As cards, scanning 60 rows by wait-time is impossible; the mono
 * gutter is what makes silence comparable down the column.
 */
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
          return (
            new Date(b.date_applied).getTime() -
            new Date(a.date_applied).getTime()
          )
        case 'company':
          return a.company_name.localeCompare(b.company_name)
        case 'status':
          return a.status.localeCompare(b.status)
      }
    })
  }, [items, query, status, sort])

  return (
    <div>
      {/* The fixed frame: filters do not scroll away with the rows. */}
      <div className="e-hold sticky top-0 z-10 border-b border-rule bg-paper">
        <div className="flex flex-wrap items-end gap-6 px-8 py-4">
          <div className="min-w-[200px] flex-1">
            <label className="type-mono block text-muted" htmlFor="search">
              Search
            </label>
            <Input
              id="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Company or role"
            />
          </div>

          <div className="w-40">
            <label className="type-mono block text-muted" htmlFor="status">
              Status
            </label>
            <Select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as Status | 'all')
              }
            >
              <option value="all">All</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-40">
            <label className="type-mono block text-muted" htmlFor="sort">
              Sort
            </label>
            <Select
              id="sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            >
              <option value="silence">Longest silence</option>
              <option value="applied">Most recent</option>
              <option value="company">Company A–Z</option>
              <option value="status">Status</option>
            </Select>
          </div>

          <Link to="/app/new">
            <Button>Add application</Button>
          </Link>
        </div>

        <div className="flex items-center justify-between border-t border-rule px-8 py-2">
          <MonoStamp>
            {rows.length} of {items.length} shown
          </MonoStamp>
          {/* Honest about the server-side cap rather than implying completeness. */}
          {items.length >= 50 ? (
            <MonoStamp>
              Showing the 50 most recent — the API returns no more
            </MonoStamp>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="p-8">
          <Spinner label="Reading the record" />
        </div>
      ) : error ? (
        <div className="p-8">
          <ErrorNote>{error}</ErrorNote>
        </div>
      ) : rows.length === 0 ? (
        <div className="px-8 py-16">
          <div className="e-rule mb-6 h-px w-24 bg-ink" />
          <p className="type-display-m">
            {items.length === 0 ? 'The record is empty.' : 'Nothing matches.'}
          </p>
          <p className="mt-2 max-w-[46ch] text-muted">
            {items.length === 0 ? (
              <>
                Add the first application and the wait starts being counted.{' '}
                <Link to="/app/new" className="text-ink underline">
                  Add one
                </Link>
                .
              </>
            ) : (
              'Clear the search or choose a different status.'
            )}
          </p>
        </div>
      ) : (
        <table className="e-cut w-full border-collapse">
          <thead>
            <tr className="border-b border-rule">
              <th className="type-mono w-24 px-8 py-3 text-left text-muted">
                Silent
              </th>
              <th className="type-mono px-4 py-3 text-left text-muted">
                Company
              </th>
              <th className="type-mono px-4 py-3 text-left text-muted">Role</th>
              <th className="type-mono px-4 py-3 text-left text-muted">
                Applied
              </th>
              <th className="type-mono px-4 py-3 text-left text-muted">
                Status
              </th>
              <th className="type-mono px-8 py-3 text-right text-muted">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const silent = daysSince(item.date_applied)
              const resolved =
                item.status === 'offer' || item.status === 'rejected'
              return (
                <tr
                  key={item.id}
                  className="border-b border-rule transition-colors hover:bg-paper-inset"
                >
                  {/* The gutter: tabular mono makes the column scannable. */}
                  <td
                    className={cn(
                      'px-8 py-4 font-mono text-[0.9375rem] tabular-nums',
                      resolved ? 'text-rule' : 'text-ink'
                    )}
                  >
                    {resolved ? '—' : `${silent}d`}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      to={`/app/applications/${item.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {item.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-muted">{item.role}</td>
                  <td className="type-mono px-4 py-4 text-muted">
                    {formatStamp(item.date_applied)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="type-mono px-8 py-4 text-right text-muted">
                    {formatStamp(item.updated_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
