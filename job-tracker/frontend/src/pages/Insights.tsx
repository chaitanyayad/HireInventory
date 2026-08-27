import { BarChart3, FileText, MessagesSquare, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { useApplications } from '@/hooks/useApplications'
import { ai } from '@/services/api'
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  PageHeader,
  PageTransition,
  Select,
  Spinner,
} from '@/components/ui'
import { cn } from '@/lib/utils'

type Mode = 'analyze' | 'cover' | 'prep'

const MODES = [
  {
    id: 'analyze' as const,
    label: 'Analyse history',
    icon: BarChart3,
    caption: 'Reads every application you have logged and describes the pattern.',
  },
  {
    id: 'cover' as const,
    label: 'Cover letter',
    icon: FileText,
    caption: 'Drafts a tailored letter for one company and role.',
  },
  {
    id: 'prep' as const,
    label: 'Interview prep',
    icon: MessagesSquare,
    caption: 'Prepares you for a specific application in your list.',
  },
]

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
      setError(cause instanceof Error ? cause.message : 'The request did not complete.')
    } finally {
      setBusy(false)
    }
  }

  const canSubmit =
    mode === 'analyze'
      ? items.length > 0
      : mode === 'cover'
        ? Boolean(cover.company_name.trim() && cover.role.trim() && cover.skills.trim())
        : Boolean(prepId)

  const active = MODES.find((m) => m.id === mode)

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Powered by Gemini"
          title={
            <>
              AI <span className="grad-text">insights</span>
            </>
          }
        />

        {/* Mode selector */}
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((item) => {
            const Icon = item.icon
            const selected = mode === item.id
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => switchMode(item.id)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className={cn(
                  'glass relative overflow-hidden rounded-2xl p-5 text-left transition-colors',
                  selected ? 'border-cyan/40 bg-cyan/[0.07]' : 'hover:bg-white/[0.07]'
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId="mode-glow"
                    className="grad-primary pointer-events-none absolute inset-x-0 top-0 h-0.5"
                  />
                ) : null}
                <Icon className={cn('h-5 w-5', selected ? 'text-cyan' : 'text-muted')} />
                <p className="mt-3 font-medium">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{item.caption}</p>
              </motion.button>
            )
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          {/* Input side */}
          <Card className="p-6 lg:col-span-2">
            <form onSubmit={run} className="space-y-5">
              {mode === 'cover' ? (
                <>
                  <Field label="Company">
                    <Input
                      value={cover.company_name}
                      onChange={(event) =>
                        setCover((c) => ({ ...c, company_name: event.target.value }))
                      }
                      placeholder="Cloudflare"
                      required
                    />
                  </Field>
                  <Field label="Role">
                    <Input
                      value={cover.role}
                      onChange={(event) => setCover((c) => ({ ...c, role: event.target.value }))}
                      placeholder="Software Engineer"
                      required
                    />
                  </Field>
                  <Field label="Your skills" hint="Comma separated, or a short paragraph">
                    <Input
                      value={cover.skills}
                      onChange={(event) => setCover((c) => ({ ...c, skills: event.target.value }))}
                      placeholder="FastAPI, Redis, React…"
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

              {mode === 'analyze' ? (
                <p className="text-sm leading-relaxed text-muted">
                  {items.length === 0
                    ? 'There is nothing to analyse yet. Add an application first.'
                    : `Gemini will read all ${items.length} of your applications and describe what is actually happening in your search.`}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={busy || !canSubmit}>
                <Sparkles className="h-4 w-4" />
                {busy ? 'Thinking…' : 'Generate'}
              </Button>

              <p className="text-center text-xs text-faint">
                Shared budget: 10 AI requests per hour.
              </p>
            </form>
          </Card>

          {/* Output side — fixed min height so switching modes doesn't jump. */}
          <Card className="min-h-[26rem] p-6 lg:col-span-3">
            <AnimatePresence mode="wait">
              {busy ? (
                <motion.div
                  key="busy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[22rem] items-center justify-center"
                >
                  <Spinner label="Gemini is reading…" />
                </motion.div>
              ) : error ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ErrorNote>{error}</ErrorNote>
                </motion.div>
              ) : output ? (
                <motion.div
                  key="output"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {meta ? (
                    <p className="mb-4 text-xs tracking-wide text-cyan uppercase">{meta}</p>
                  ) : null}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-ink/90">
                    {output}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full min-h-[22rem] flex-col items-center justify-center text-center"
                >
                  <div className="glass-subtle mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
                    <Sparkles className="h-6 w-6 text-cyan" />
                  </div>
                  <p className="font-medium">{active?.label}</p>
                  <p className="mt-1 max-w-xs text-sm text-muted">{active?.caption}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
