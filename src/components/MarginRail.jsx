// The Margin. See docs/UI.md "The Margin" (v3). Holds the raw transcript.
// Phrase-to-line-item linking (tap an item, its source phrase lights up)
// is a later polish pass; Day 2 shows the plain transcript plus the
// model's state in plain words, per docs/UI.md rule 3.

import { Waveform, LockKey } from '@phosphor-icons/react'
import { useModel } from '../context/ModelContext'

export default function MarginRail({ transcript, hint }) {
  const { status } = useModel()

  return (
    <div
      className="no-print shrink-0 border-b p-3 md:w-[252px] md:flex md:flex-col md:gap-2.5 md:border-b-0 md:border-r md:p-[18px]"
      style={{
        borderColor: 'var(--line)',
        background:
          'linear-gradient(var(--rail-wash),var(--rail-wash)), repeating-linear-gradient(0deg, transparent 0 11px, rgba(43,75,215,.07) 11px 12px), repeating-linear-gradient(90deg, transparent 0 11px, rgba(43,75,215,.07) 11px 12px)',
      }}
    >
      <div
        className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--muted)' }}
      >
        {status === 'busy' ? 'Thinking' : 'You said'}
        <Waveform
          size={14}
          className={status === 'busy' ? 'animate-thinking-glow' : undefined}
          style={status === 'busy' ? { color: 'var(--accent)' } : undefined}
        />
      </div>
      <div
        className="mt-1.5 line-clamp-2 font-mono text-[12.5px] leading-[1.9] md:line-clamp-none"
        style={{ color: 'var(--muted)' }}
      >
        {transcript ? transcript : 'Nothing yet. Your words land here, and every quote line will point back to them.'}
      </div>
      {hint && (
        <div className="mt-2 text-[12.5px] font-medium" style={{ color: 'var(--accent)' }}>
          {hint}
        </div>
      )}
      <div
        className="mt-auto hidden items-start gap-1.5 pt-6 text-xs leading-relaxed md:flex"
        style={{ color: 'var(--muted)' }}
      >
        <LockKey size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
        Processed on this device. Nothing was uploaded.
      </div>
      <a
        href="https://github.com/ibrahim-iqbal/hushquote"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden text-[11px] motion-safe:transition-opacity hover:opacity-70 md:block"
        style={{ color: 'var(--muted)' }}
      >
        Built by Ibrahim Iqbal
      </a>
    </div>
  )
}
