import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MonoStamp } from '@/components/ui'

/**
 * Composition: off-centre threshold. Shared by Login and Register.
 *
 * The form sits in a 380px column at 38% from the left — deliberately not
 * centred. The remaining space is empty paper carrying one mono line, bottom
 * aligned. Centre this card and it becomes every login page ever shipped; the
 * off-centre placement is the entire scene.
 */
export function Threshold({
  children,
  caption,
}: {
  children: ReactNode
  caption: string
}) {
  return (
    <div className="flex min-h-screen bg-paper">
      <div className="e-rule hidden w-[38%] border-r border-rule lg:flex lg:flex-col lg:justify-between">
        <div className="p-8">
          <Link to="/" className="type-mono text-muted hover:text-ink">
            ← Job Tracker
          </Link>
        </div>
        <div className="p-8">
          <MonoStamp>{caption}</MonoStamp>
        </div>
      </div>

      <div className="flex flex-1 items-center px-8">
        <div className="e-hold w-full max-w-[380px] py-16">{children}</div>
      </div>
    </div>
  )
}
