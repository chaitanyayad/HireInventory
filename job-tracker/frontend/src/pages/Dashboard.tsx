import { Link } from 'react-router-dom'
import { useApplications } from '@/hooks/useApplications'
import { DayCounter, ProportionBand, StatusBadge } from '@/components/status'
import { ErrorNote, MonoStamp, Rule, Spinner } from '@/components/ui'
import { daysSince, formatStamp } from '@/lib/utils'

/**
 * Composition: the band.
 *
 * A single full-width proportional bar, then an unequal 7/5 split. Not four
 * KPI tiles — as tiles you read four counts and have to compare them mentally;
 * as one band you see that 80% of your search is still `applied`, which is the
 * actual insight.
 */
export function Dashboard() {
  const { items, stats, loading, error } = useApplications()

  if (loading) {
    return (
      <div className="p-8">
        <Spinner label="Reading the record" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorNote>{error}</ErrorNote>
      </div>
    )
  }

  // Ranked by silence: longest wait first. Anything already resolved is not
  // waiting on anyone, so it is excluded.
  const waiting = items
    .filter(
      (item) => item.status !== 'offer' && item.status !== 'rejected'
    )
    .sort(
      (a, b) => daysSince(b.date_applied) - daysSince(a.date_applied)
    )
    .slice(0, 6)

  const recent = [...items]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 6)

  const longest = waiting[0] ? daysSince(waiting[0].date_applied) : 0

  return (
    <div>
      <section className="e-hold p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <MonoStamp>The shape of your search</MonoStamp>
            <h1 className="type-display-l mt-2">
              {stats?.total ?? 0} sent · {stats?.response_rate ?? 0}% answered
            </h1>
          </div>
          {longest > 0 ? (
            <div className="text-right">
              <MonoStamp>Longest silence</MonoStamp>
              <div className="mt-2">
                <DayCounter days={longest} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          {stats ? <ProportionBand stats={stats} /> : null}
        </div>
      </section>

      <Rule />

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <section className="e-cut border-rule lg:col-span-7 lg:border-r">
          <div className="flex items-center justify-between border-b border-rule px-8 py-4">
            <MonoStamp>Longest silence</MonoStamp>
            <MonoStamp>Awaiting a reply</MonoStamp>
          </div>

          {waiting.length === 0 ? (
            <div className="px-8 py-10">
              <p className="type-display-m">Nothing is waiting.</p>
              <p className="mt-2 text-muted">
                Every application has been resolved, or none has been added yet.{' '}
                <Link to="/app/new" className="text-ink underline">
                  Add one
                </Link>
                .
              </p>
            </div>
          ) : (
            waiting.map((item) => (
              <Link
                key={item.id}
                to={`/app/applications/${item.id}`}
                className="flex items-center justify-between border-b border-rule px-8 py-5 transition-colors hover:bg-paper-inset"
              >
                <div className="min-w-0">
                  <p className="type-display-m truncate">{item.company_name}</p>
                  <p className="type-mono mt-1 truncate text-muted">
                    {item.role}
                  </p>
                </div>
                <div className="shrink-0 pl-6 text-right">
                  <span className="type-mono-l text-ink">
                    {daysSince(item.date_applied)}
                  </span>
                  <MonoStamp className="ml-2">days</MonoStamp>
                </div>
              </Link>
            ))
          )}
        </section>

        <section className="lg:col-span-5">
          <div className="flex items-center justify-between border-b border-rule px-8 py-4">
            <MonoStamp>Recent movement</MonoStamp>
          </div>
          <div className="e-rule h-px w-full bg-rule" />

          {recent.length === 0 ? (
            <div className="px-8 py-10">
              <MonoStamp>No activity recorded</MonoStamp>
            </div>
          ) : (
            recent.map((item) => (
              <Link
                key={item.id}
                to={`/app/applications/${item.id}`}
                className="block border-b border-rule px-8 py-4 transition-colors hover:bg-paper-inset"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="truncate">{item.company_name}</p>
                  <StatusBadge status={item.status} />
                </div>
                <MonoStamp className="mt-1 block">
                  {formatStamp(item.updated_at)}
                </MonoStamp>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
