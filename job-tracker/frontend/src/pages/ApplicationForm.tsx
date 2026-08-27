import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApplications } from '@/hooks/useApplications'
import { applications as applicationsApi } from '@/services/api'
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  PageHeader,
  PageTransition,
  Skeleton,
  Textarea,
} from '@/components/ui'
import { todayISO } from '@/lib/utils'

const EMPTY = {
  company_name: '',
  role: '',
  job_link: '',
  date_applied: todayISO(),
  interview_date: '',
  notes: '',
}

/**
 * One form for both creating and editing.
 *
 * Mode comes from the route: /app/new has no :id, /app/applications/:id/edit
 * does. Keeping it as a single component means the two can't drift apart in
 * validation or field set.
 *
 * Status is absent by design — it moves only through the detail page's status
 * control, which is the path that fires the live WebSocket and email events.
 */
export function ApplicationForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const { create, update, items } = useApplications()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [loaded, setLoaded] = useState(!isEdit)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefer the cached row; fall back to a fetch so a deep link works.
  useEffect(() => {
    if (!isEdit || !id) return

    const cached = items.find((item) => item.id === id)
    const fill = (a: NonNullable<typeof cached>) => {
      setForm({
        company_name: a.company_name,
        role: a.role,
        job_link: a.job_link ?? '',
        date_applied: a.date_applied,
        interview_date: a.interview_date ?? '',
        notes: a.notes ?? '',
      })
      setLoaded(true)
    }

    if (cached) {
      fill(cached)
      return
    }
    applicationsApi
      .get(id)
      .then(fill)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Could not load this application.')
        setLoaded(true)
      })
  }, [isEdit, id, items])

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const payload = {
      company_name: form.company_name.trim(),
      role: form.role.trim(),
      // The backend validates this as a URL, so an empty string is rejected.
      job_link: form.job_link.trim() || null,
      date_applied: form.date_applied,
      interview_date: form.interview_date || null,
      notes: form.notes.trim() || null,
    }

    try {
      if (isEdit && id) {
        await update(id, payload)
        navigate(`/app/applications/${id}`)
      } else {
        const created = await create(payload)
        navigate(`/app/applications/${created.id}`)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this application.')
      setBusy(false)
    }
  }

  const backTo = isEdit && id ? `/app/applications/${id}` : '/app/applications'

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEdit ? 'Back to application' : 'Applications'}
        </Link>

        <PageHeader
          eyebrow={isEdit ? 'Edit' : 'New entry'}
          title={isEdit ? 'Edit application' : 'Log an application'}
        />

        <Card className="p-7">
          {!loaded ? (
            <div className="space-y-5">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-28" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Company">
                  <Input
                    value={form.company_name}
                    onChange={(event) => set('company_name', event.target.value)}
                    placeholder="Cloudflare"
                    required
                    autoFocus
                  />
                </Field>

                <Field label="Role">
                  <Input
                    value={form.role}
                    onChange={(event) => set('role', event.target.value)}
                    placeholder="Software Engineer"
                    required
                  />
                </Field>
              </div>

              <Field label="Job link" hint="Optional — must be a full URL">
                <Input
                  type="url"
                  value={form.job_link}
                  onChange={(event) => set('job_link', event.target.value)}
                  placeholder="https://…"
                />
              </Field>

              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Date applied" hint="Silence is measured from this date">
                  <Input
                    type="date"
                    value={form.date_applied}
                    onChange={(event) => set('date_applied', event.target.value)}
                    required
                  />
                </Field>

                <Field label="Interview date" hint="Optional — queues a reminder email">
                  <Input
                    type="date"
                    value={form.interview_date}
                    onChange={(event) => set('interview_date', event.target.value)}
                  />
                </Field>
              </div>

              <Field label="Notes">
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) => set('notes', event.target.value)}
                  placeholder="Referral, recruiter name, what the listing asked for…"
                />
              </Field>

              <ErrorNote>{error}</ErrorNote>

              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" size="lg" disabled={busy}>
                  {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Save application'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate(backTo)}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </PageTransition>
  )
}
