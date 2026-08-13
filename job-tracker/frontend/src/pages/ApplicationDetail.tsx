import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApplications } from '@/hooks/useApplications'
import { applications as applicationsApi } from '@/services/api'
import { DayCounter, StatusBadge } from '@/components/status'
import {
  Button,
  ErrorNote,
  MonoStamp,
  Select,
  Spinner,
} from '@/components/ui'
import { daysSince, formatStamp } from '@/lib/utils'
import { STATUSES, type Application, type Status } from '@/services/types'

/**
 * Composition: the record.
 *
 * Unequal 5/7 split. The biggest thing on the page is how long you have been
 * waiting — flattened into stacked cards, that emphasis disappears and it
 * becomes a generic detail view.
 */
export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, updateStatus, remove } = useApplications()

  // Prefer the cached row so socket updates flow straight through; fall back
  // to a fetch so the page survives a deep link or a hard refresh.
  const cached = items.find((item) => item.id === id)
  const [fetched, setFetched] = useState<Application | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (cached || !id) return
    applicationsApi
      .get(id)
      .then(setFetched)
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : 'Could not load the record.'
        )
      )
  }, [cached, id])

  const application = cached ?? fetched

  if (error) {
    return (
      <div className="p-8">
        <ErrorNote>{error}</ErrorNote>
        <Link to="/app/applications" className="type-mono mt-4 inline-block underline">
          Back to applications
        </Link>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="p-8">
        <Spinner label="Opening the record" />
      </div>
    )
  }

  const silent = daysSince(application.date_applied)
  const resolved =
    application.status === 'offer' || application.status === 'rejected'

  async function onStatusChange(next: Status) {
    if (!application) return
    setBusy(true)
    setError(null)
    try {
      await updateStatus(application.id, next)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not change the status.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!application) return
    setBusy(true)
    try {
      await remove(application.id)
      navigate('/app/applications', { replace: true })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not delete the record.'
      )
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-rule px-8 py-4">
        <Link to="/app/applications" className="type-mono text-muted hover:text-ink">
          ← Applications
        </Link>
        <MonoStamp>Record {application.id.slice(0, 8)}</MonoStamp>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <section className="border-rule lg:col-span-5 lg:border-r">
          <div className="p-8">
            <MonoStamp>{resolved ? 'Resolved after' : 'Silent for'}</MonoStamp>
            <div className="mt-3">
              <DayCounter days={silent} />
            </div>

            <h1 className="type-display-l mt-10">{application.company_name}</h1>
            <p className="mt-2 text-muted">{application.role}</p>
          </div>

          <dl className="e-cut border-t border-rule">
            {[
              ['Applied', formatStamp(application.date_applied)],
              [
                'Interview',
                application.interview_date
                  ? formatStamp(application.interview_date)
                  : 'Not scheduled',
              ],
              ['Created', formatStamp(application.created_at)],
              ['Last change', formatStamp(application.updated_at)],
            ].map(([term, value]) => (
              <div
                key={term}
                className="flex items-baseline justify-between border-b border-rule px-8 py-4"
              >
                <dt className="type-mono text-muted">{term}</dt>
                <dd className="type-mono text-ink">{value}</dd>
              </div>
            ))}

            {application.job_link ? (
              <div className="flex items-baseline justify-between border-b border-rule px-8 py-4">
                <dt className="type-mono text-muted">Listing</dt>
                <dd className="type-mono">
                  <a
                    href={application.job_link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-airmail-blue underline"
                  >
                    Open ↗
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="lg:col-span-7">
          <div className="border-b border-rule p-8">
            <MonoStamp>Status</MonoStamp>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <StatusBadge status={application.status} />
              <div className="w-48">
                <Select
                  value={application.status}
                  disabled={busy}
                  onChange={(event) =>
                    onStatusChange(event.target.value as Status)
                  }
                  aria-label="Change status"
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <p className="type-mono mt-3 text-muted">
              Changing this updates every tab you have open.
            </p>
          </div>

          <div className="e-hold border-b border-rule p-8">
            <MonoStamp>Notes</MonoStamp>
            {application.notes ? (
              <p className="mt-4 whitespace-pre-wrap">{application.notes}</p>
            ) : (
              <p className="mt-4 text-muted">
                Nothing recorded. Notes are set when the application is created —
                the API exposes no endpoint to edit them afterwards.
              </p>
            )}
          </div>

          <div className="p-8">
            <ErrorNote>{error}</ErrorNote>
            <div className="mt-4 flex items-center gap-4">
              {confirming ? (
                <>
                  <MonoStamp className="text-airmail-red">
                    Delete permanently?
                  </MonoStamp>
                  <Button variant="danger" onClick={onDelete} disabled={busy}>
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirming(false)}
                    disabled={busy}
                  >
                    Keep
                  </Button>
                </>
              ) : (
                <Button variant="danger" onClick={() => setConfirming(true)}>
                  Delete this record
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
