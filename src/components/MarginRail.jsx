// The Margin. See docs/UI.md "The Margin" (v3). Holds the raw transcript.
// Phrase-to-line-item linking (tap an item, its source phrase lights up)
// ships Day 2 with real extraction; Day 1 shows the plain transcript.

import { Waveform, LockKey } from '@phosphor-icons/react'

export default function MarginRail({ transcript }) {
  return (
    <div
      className="no-print shrink-0 border-b p-3 md:w-[252px] md:flex md:flex-col md:gap-2.5 md:border-b-0 md:border-r md:p-[18px]"
      style={{
        borderColor: 'var(--line)',
        background:
          'linear-gradient(rgba(244,245,247,.92),rgba(244,245,247,.92)), repeating-linear-gradient(0deg, transparent 0 11px, rgba(43,75,215,.07) 11px 12px), repeating-linear-gradient(90deg, transparent 0 11px, rgba(43,75,215,.07) 11px 12px)',
      }}
    >
      <div
        className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--muted)' }}
      >
        You said
        <Waveform size={14} />
      </div>
      <div
        className="mt-1.5 line-clamp-2 font-mono text-[12.5px] leading-[1.9] md:line-clamp-none"
        style={{ color: 'var(--muted)' }}
      >
        {transcript ? transcript : 'Nothing yet. Your words land here, and every quote line will point back to them.'}
      </div>
      <div
        className="mt-auto hidden items-start gap-1.5 pt-6 text-xs leading-relaxed md:flex"
        style={{ color: 'var(--muted)' }}
      >
        <LockKey size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
        Processed on this device. Nothing was uploaded.
      </div>
    </div>
  )
}
