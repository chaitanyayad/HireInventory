import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApplications } from '@/hooks/useApplications'
import {
  Button,
  ErrorNote,
  Field,
  Input,
  MonoStamp,
  Textarea,
} from '@/components/ui'
import { todayISO } from '@/lib/utils'

export function NewApplication() {
  const { create } = useApplications()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    company_name: '',
    role: '',
    job_link: '',
    date_applied: todayISO(),
    interview_date: '',
    notes: '',
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await create({
        company_name: form.company_name.trim(),
        role: form.role.trim(),
        // The backend validates this as HttpUrl, so an empty string would be
        // rejected — send null instead of "".
        job_link: form.job_link.trim() || null,
        date_applied: form.date_applied,
        interview_date: form.interview_date || null,
        notes: form.notes.trim() || null,
      })
      navigate(`/app/applications/${created.id}`)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save the record.'
      )
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12">
      <section className="border-rule lg:col-span-5 lg:border-r">
        <div className="p-8">
          <MonoStamp>New record</MonoStamp>
          <h1 className="type-display-l mt-3 max-w-[14ch]">
            Log what you sent.
          </h1>
          <p className="mt-6 max-w-[40ch] text-muted">
            The date you applied is what the silence is measured from, so it is
            the one field worth getting right.
          </p>
        </div>
      </section>

      <section className="lg:col-span-7">
        <form onSubmit={onSubmit} className="e-hold max-w-[520px] space-y-8 p-8">
          <Field label="Company">
            <Input
              value={form.company_name}
              onChange={(event) => set('company_name', event.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Role">
            <Input
              value={form.role}
              onChange={(event) => set('role', event.target.value)}
              required
            />
          </Field>

          <Field label="Job link" hint="Optional — must be a full URL">
            <Input
              type="url"
              value={form.job_link}
              onChange={(event) => set('job_link', event.target.value)}
              placeholder="https://"
            />
          </Field>

          <Field label="Date applied">
            <Input
              type="date"
              value={form.date_applied}
              onChange={(event) => set('date_applied', event.target.value)}
              required
            />
          </Field>

          <Field
            label="Interview date"
            hint="Optional — a reminder email is queued as this approaches"
          >
            <Input
              type="date"
              value={form.interview_date}
              onChange={(event) => set('interview_date', event.target.value)}
            />
          </Field>

          <Field label="Notes" hint="Cannot be edited later — the API has no update endpoint">
            <Textarea
              rows={5}
              value={form.notes}
              onChange={(event) => set('notes', event.target.value)}
              placeholder="Referral, recruiter name, what the listing asked for…"
            />
          </Field>

          <ErrorNote>{error}</ErrorNote>

          <div className="flex items-center gap-4">
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? 'Saving…' : 'Save record'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
