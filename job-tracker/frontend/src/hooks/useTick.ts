import { useEffect, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Counts a numeral up to `target`. The one animation in this interface that
 * isn't a cut — justified because the number IS the subject: how long you have
 * been waiting.
 *
 * Under reduced motion it returns the final value immediately. The number is
 * never withheld from anyone; only the settling is optional.
 */
export function useTick(target: number, ms = 600): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()

    const step = (now: number) => {
      const progress = Math.min((now - start) / ms, 1)
      // easeOutQuad — decelerates like a mechanical counter settling.
      setValue(Math.round(target * (1 - (1 - progress) * (1 - progress))))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, ms])

  return value
}
