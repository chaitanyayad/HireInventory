import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Whole days between a date and today. The product's central number: how long
 * something has been quiet.
 *
 * Both sides are floored to local midnight first, so "yesterday" is always 1
 * regardless of the time of day — comparing raw timestamps would make it 0 or
 * 1 depending on when you looked, which reads as a bug.
 */
export function daysSince(dateString: string): number {
  const then = new Date(dateString)
  if (Number.isNaN(then.getTime())) return 0
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  const now = new Date()
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000))
}

/** Signed day delta — negative means the date is still ahead of us. */
export function daysUntil(dateString: string): number {
  return -daysSince(dateString)
}

/** 2026-08-13 → 13 AUG 2026. Mono, uppercase, unambiguous across locales. */
export function formatStamp(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = date
    .toLocaleString('en-GB', { month: 'short' })
    .toUpperCase()
  return `${day} ${month} ${date.getFullYear()}`
}

/** Today as yyyy-mm-dd in LOCAL time — `toISOString` would shift the date. */
export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
