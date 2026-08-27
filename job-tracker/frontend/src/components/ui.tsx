import { cva, type VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'motion/react'
import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Shared primitives for the glass UI.
 *
 * Motion (motion.dev) drives entrance and interaction animation. Anything
 * continuous and ambient (the floating mesh, skeleton shimmer) stays in CSS —
 * it shouldn't occupy a React render loop for the life of the page.
 */

/* ── Ambient background ───────────────────────────────────────────────────
   Rendered once at the app root. Fixed and behind everything, so content
   scrolls over a lit surface rather than dragging the gradient with it. */
export function Backdrop() {
  return (
    <>
      <div className="mesh-bg">
        <div
          className="mesh-blob animate-float-slow"
          style={{ background: '#14b8a6', width: 620, height: 620, top: '-14%', left: '-8%' }}
        />
        <div
          className="mesh-blob animate-float-slower"
          style={{ background: '#3b82f6', width: 700, height: 700, top: '18%', right: '-14%' }}
        />
        <div
          className="mesh-blob animate-float-slow"
          style={{
            background: '#22d3ee',
            width: 520,
            height: 520,
            bottom: '-16%',
            left: '28%',
            opacity: 0.18,
          }}
        />
        <div className="mesh-scrim" />
      </div>
      <div className="grid-overlay" />
    </>
  )
}

/* ── Button ───────────────────────────────────────────────────────────────── */

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        // The one filled control per view. The inner top highlight keeps it
        // from reading as a flat gradient rectangle.
        primary:
          'grad-primary text-[#04121a] font-semibold shadow-[0_6px_24px_-6px_rgba(34,211,238,0.55)] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/25 before:to-transparent before:opacity-60',
        glass: 'glass text-ink hover:bg-white/10',
        ghost: 'text-muted hover:bg-white/5 hover:text-ink',
        danger: 'glass border-rose/30 text-rose hover:bg-rose/10',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-7 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

// Motion defines its own onDrag / onAnimationStart handlers, which collide
// with the React DOM ones. HTMLMotionProps already resolves that conflict.
export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  // Motion widens children to allow a MotionValue; this button renders them
  // inside a span, so narrow it back to plain ReactNode.
  children?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <motion.button
      ref={ref}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  )
)
Button.displayName = 'Button'

/* ── Surfaces ─────────────────────────────────────────────────────────────── */

export function Card({
  className,
  children,
  hover = false,
  ...props
}: HTMLMotionProps<'div'> & { hover?: boolean }) {
  return (
    <motion.div
      className={cn(
        'glass rounded-2xl',
        hover && 'transition-colors hover:bg-white/[0.07]',
        className
      )}
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function Panel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn('glass-strong rounded-2xl', className)}>{children}</div>
}

/* ── Form controls ────────────────────────────────────────────────────────── */

const fieldBase =
  'w-full rounded-xl glass-subtle px-4 text-ink outline-none transition-colors placeholder:text-faint focus:border-cyan/50 focus:bg-white/[0.05]'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, 'h-12', className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, 'resize-none py-3 leading-relaxed', className)}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  // The options list is rendered by the OS, so it can't inherit the glass
  // styling — the explicit dark background stops it flashing white.
  <select
    ref={ref}
    className={cn(fieldBase, 'h-12 [&>option]:bg-[#071e2a]', className)}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-faint">{hint}</p> : null}
    </div>
  )
}

/* ── Feedback ─────────────────────────────────────────────────────────────── */

export function ErrorNote({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-rose/25 bg-rose/10 px-4 py-3 text-sm text-rose"
    >
      {children}
    </motion.p>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <motion.span
        className="block h-4 w-4 rounded-full border-2 border-white/15 border-t-cyan"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      {label}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="grad-primary mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-[#04121a] opacity-90">
        ◇
      </div>
      <h3 className="type-display text-xl">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

/* ── Layout helpers ───────────────────────────────────────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string
  title: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-medium tracking-[0.14em] text-cyan uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="type-display text-3xl sm:text-4xl">{title}</h1>
      </div>
      {action}
    </motion.div>
  )
}

/** Fades and lifts a page in on mount. Wraps each routed page's root. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Parent for staggered lists — children use `staggerItem`. */
export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}
