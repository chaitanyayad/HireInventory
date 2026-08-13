import { useState, type FormEvent } from 'react'
import { useApplications } from '@/hooks/useApplications'
import { ai } from '@/services/api'
import {
  AirmailEdge,
  Button,
  ErrorNote,
  Field,
  Input,
  MonoStamp,
  Select,
  Spinner,
} from '@/components/ui'

type Mode = 'analyze' | 'cover' | 'prep'

const MODES: { id: Mode; label: string; caption: string }[] = [
  {
    id: 'analyze',
    label: 'Analyse history',
    caption: 'Reads every application you have logged and describes the pattern.',
  },
  {
    id: 'cover',
    label: 'Cover letter',
    caption: 'Drafts a letter for one company and role.',
  },
  {
    id: 'prep',
    label: 'Interview prep',
    caption: 'Prepares for one application, or any company and role.',
  },
]

/**
 * Composition: the reply.
 *
 * Three modes switch inside one panel that never resizes between them —
 * holding the fixed-camera rule. As three separate cards the "one channel,
 * three kinds of letter" idea is lost and it becomes a tool menu.
 */
export function Insights() {
  const { items } = useApplications()
  const [mode, setMode] = useState<Mode>('analyze')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<string | null>(null)
  const [meta, setMeta] = useState<string | null>(null)

  const [cover, setCover] = useState({ company_name: '', role: '', skills: '' })
  const [prepId, setPrepId] = useState('')

  function switchMode(next: Mode) {
    setMode(next)
    setOutput(null)
    setMeta(null)
    setError(null)
  }

  async function run(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setOutput(null)
    setMeta(null)

    try {
      if (mode === 'analyze') {
        const result = await ai.analyze()
        setOutput(result.insight)
        setMeta(`${result.applications_analyzed} applications analysed`)
      } else if (mode === 'cover') {
        const result = await ai.coverLetter({
          company_name: cover.company_name.trim(),
          role: cover.role.trim(),
          skills: cover.skills.trim(),
        })
        setOutput(result.content)
      } else {
        const result = await ai.interviewPrep({ application_id: prepId })
        setOutput(result.prep)
        setMeta(`${result.company_name} · ${result.role}`)
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The request did not complete.'
      )
    } finally {
      setBusy(false)
    }
  }

  const canSubmit =
    mode === 'analyze'
      ? items.length > 0
      : mode === 'cover'
        ? cover.company_name.trim() && cover.role.trim() && cover.skills.trim()
        : Boolean(prepId)

  return (
    <div>
      {/* Mode strip. */}
      <div className="e-cut flex flex-wrap border-b border-rule">
        {MODES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => switchMode(item.id)}
            className={[
              'type-mono px-8 py-4 transition-colors',
              index > 0 ? 'border-l border-rule' : '',
              mode === item.id
                ? 'bg-ink text-paper'
                : 'text-muted hover:text-ink',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        <section className="border-rule lg:col-span-5 lg:border-r">
          <form onSubmit={run} className="space-y-8 p-8">
            <div>
              <MonoStamp>{MODES.find((m) => m.id === mode)?.caption}</MonoStamp>
            </div>

            {mode === 'cover' ? (
              <>
                <Field label="Company">
                  <Input
                    value={cover.company_name}
                    onChange={(event) =>
                      setCover((c) => ({ ...c, company_name: event.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Role">
                  <Input
                    value={cover.role}
                    onChange={(event) =>
                      setCover((c) => ({ ...c, role: event.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Skills" hint="Comma separated, or a short paragraph">
                  <Input
                    value={cover.skills}
                    onChange={(event) =>
                      setCover((c) => ({ ...c, skills: event.target.value }))
                    }
                    required
                  />
                </Field>
              </>
            ) : null}

            {mode === 'prep' ? (
              <Field label="Application">
                <Select
                  value={prepId}
                  onChange={(event) => setPrepId(event.target.value)}
                  required
                >
                  <option value="">Choose one…</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.company_name} — {item.role}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            {mode === 'analyze' && items.length === 0 ? (
              <p className="text-muted">
                There is nothing to analyse yet. Add an application first.
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={busy || !canSubmit}>
              {busy ? 'Writing…' : 'Request'}
            </Button>

            <p className="type-mono text-muted">
              Shared budget: 10 AI requests per hour across all three modes.
            </p>
          </form>
        </section>

        {/* The reply panel. Fixed min-height so switching modes never resizes
            the frame — this is the page's fixed-camera rule. */}
        <section className="lg:col-span-7">
          <div className="p-8">
            <AirmailEdge />
            <div className="e-rule mt-0 min-h-[60vh] border border-t-0 border-rule bg-paper-inset p-8">
              {busy ? (
                <Spinner label="Waiting for the reply" />
              ) : error ? (
                <ErrorNote>{error}</ErrorNote>
              ) : output ? (
                <div className="e-hold">
                  {meta ? <MonoStamp>{meta}</MonoStamp> : null}
                  <p className="mt-6 whitespace-pre-wrap leading-relaxed">
                    {output}
                  </p>
                </div>
              ) : (
                <MonoStamp>Nothing requested yet</MonoStamp>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
