import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * The shared primitives. Written in the shadcn idiom (cva variants, forwarded
 * refs, `cn` merging) but authored against this project's tokens — the shadcn
 * generator ships rounded corners and shadows, both of which are banned here.
 *
 * Nothing in this file introduces a colour outside the seven tokens, a border
 * radius, or a shadow.
 */

/* ── Button ─────────────────────────────────────────────────────────────── */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap type-label transition-colors disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        // The one filled control on any given screen.
        solid: 'bg-ink text-paper hover:bg-airmail-blue',
        outline: 'border border-rule text-ink hover:border-ink',
        ghost: 'text-muted hover:text-ink',
        danger: 'border border-rule text-airmail-red hover:border-airmail-red',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-5',
        lg: 'h-12 px-7',
      },
    },
    defaultVariants: { variant: 'solid', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'

/* ── Field primitives ───────────────────────────────────────────────────── */

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full border-b border-rule bg-transparent px-0 text-ink outline-none transition-colors',
      'placeholder:text-muted focus:border-airmail-blue',
      className
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full resize-none border border-rule bg-transparent p-3 text-ink outline-none transition-colors',
      'placeholder:text-muted focus:border-airmail-blue',
      className
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-10 w-full border-b border-rule bg-transparent px-0 text-ink outline-none transition-colors focus:border-airmail-blue',
      className
    )}
    {...props}
  />
))
Select.displayName = 'Select'

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('type-mono block text-muted', className)} {...props} />
  )
}

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
      <Label>{label}</Label>
      {children}
      {hint ? <p className="type-mono text-muted">{hint}</p> : null}
    </div>
  )
}

/* ── Direction-specific ─────────────────────────────────────────────────── */

/** A hairline frame. Siblings butt against each other — shared edges, no gaps. */
export function Frame({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border border-rule', className)} {...props}>
      {children}
    </div>
  )
}

/** The signature. Two per page, maximum. */
export function AirmailEdge({ className }: { className?: string }) {
  return <div className={cn('airmail-edge', className)} aria-hidden />
}

export function Rule({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-rule', className)} aria-hidden />
}

/** Evidence: a timestamp, a code, a count. Always mono. */
export function MonoStamp({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span className={cn('type-mono text-muted', className)}>{children}</span>
  )
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null
  // Errors state what happened and what to do; they do not apologise.
  return (
    <p
      role="alert"
      className="type-mono border-l-2 border-airmail-red pl-3 text-airmail-red"
    >
      {children}
    </p>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  // No spinning graphic — a mono word is quieter and never animates against
  // the reduced-motion rule.
  return <MonoStamp className="animate-pulse">{label}…</MonoStamp>
}
