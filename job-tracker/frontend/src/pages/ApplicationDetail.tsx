import { ArrowLeft, CalendarDays, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApplications } from '@/hooks/useApplications'
import { applications as applicationsApi } from '@/services/api'
import { Counter, STATUS_STYLE, StatusBadge } from '@/components/status'
import {
  Button,
  Card,
  ErrorNote,
  PageTransition,
  Select,
  Skeleton,
} from '@/components/ui'
import { daysSince, formatStamp } from '@/lib/utils'
import { STATUSES, type Application, type Status } from '@/services/types'

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
        setError(cause instanceof Error ? cause.message : 'Could not load this application.')
      )
  }, [cached, id])

  const application = cached ?? fetched

  if (error) {
    return (
      <PageTransition>
        <ErrorNote>{error}</ErrorNote>
        <Link
          to="/app/applications"
          className="mt-4 inline-flex items-center gap-2 text-sm text-cyan hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to applications
        </Link>
      </PageTransition>
    )
  }

  if (!application) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56" />
      </div>
    )
  }

  const silent = daysSince(application.date_applied)
  const resolved = application.status === 'offer' || application.status === 'rejected'

  async function onStatusChange(next: Status) {
    if (!application) return
    setBusy(true)
    setError(null)
    try {
      await updateStatus(application.id, next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not change the status.')
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
      setError(cause instanceof Error ? cause.message : 'Could not delete this application.')
      setBusy(false)
    }
  }

  const facts: [string, string][] = [
    ['Applied', formatStamp(application.date_applied)],
    [
      'Interview',
      application.interview_date ? formatStamp(application.interview_date) : 'Not scheduled',
    ],
    ['Created', formatStamp(application.created_at)],
    ['Last change', formatStamp(application.updated_at)],
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        <Link
          to="/app/applications"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Applications
        </Link>

        {/* Hero — the elapsed wait is the largest thing on the page. */}
        <Card className="relative overflow-hidden p-7">
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-25"
            style={{ background: STATUS_STYLE[application.status].bar }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <StatusBadge status={application.status} />
              <h1 className="type-display mt-3 text-4xl">{application.company_name}</h1>
              <p className="mt-1.5 text-muted">{application.role}</p>

              {application.job_link ? (
                <a
                  href={application.job_link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm text-cyan hover:underline"
                >
                  View listing <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}

              <div className="mt-5">
                <Link to={`/app/applications/${application.id}/edit`}>
                  <Button variant="glass" size="sm">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit details
                  </Button>
                </Link>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs tracking-wide text-muted uppercase">
                {resolved ? 'Resolved after' : 'Silent for'}
              </p>
              <p className="type-display mt-1 text-5xl">
                <Counter value={silent} />
                <span className="ml-1 text-2xl text-muted">days</span>
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <Card className="p-6">
              <h2 className="type-display mb-4 text-lg">Status</h2>
              <div className="flex flex-wrap items-center gap-4">
                <Select
                  value={application.status}
                  disabled={busy}
                  onChange={(event) => onStatusChange(event.target.value as Status)}
                  className="w-52"
                  aria-label="Change status"
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_STYLE[value].label}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-faint">
                  Changing this updates every tab you have open, instantly.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="type-display mb-3 text-lg">Notes</h2>
              {application.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted">
                  {application.notes}
                </p>
              ) : (
                <p className="text-sm text-faint">
                  Nothing recorded yet. Use{' '}
                  <Link
                    to={`/app/applications/${application.id}/edit`}
                    className="text-cyan hover:underline"
                  >
                    Edit details
                  </Link>{' '}
                  to add notes.
                </p>
              )}
            </Card>
          </div>

          <div className="space-y-5 lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-4">
                <CalendarDays className="h-4 w-4 text-cyan" />
                <h2 className="type-display text-lg">Timeline</h2>
              </div>
              <dl>
                {facts.map(([term, value], index) => (
                  <motion.div
                    key={term}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="flex items-baseline justify-between border-b border-white/[0.05] px-5 py-3.5 last:border-0"
                  >
                    <dt className="text-xs text-muted">{term}</dt>
                    <dd className="type-mono text-sm">{value}</dd>
                  </motion.div>
                ))}
              </dl>
            </Card>

            <Card className="p-5">
              <ErrorNote>{error}</ErrorNote>
              <div className="mt-1 flex items-center gap-3">
                {confirming ? (
                  <>
                    <Button variant="danger" size="sm" onClick={onDelete} disabled={busy}>
                      Yes, delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirming(false)}
                      disabled={busy}
                    >
                      Keep it
                    </Button>
                  </>
                ) : (
                  <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
                    <Trash2 className="h-4 w-4" />
                    Delete application
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
