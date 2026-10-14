import { useEffect, useState } from 'react'
import { LockKey, DownloadSimple, PencilSimple, SunDim, MoonStars } from '@phosphor-icons/react'
import { useQuote } from '../context/QuoteContext'
import { getEffectiveTheme, setTheme } from '../lib/theme'

export default function TopBar({ onDownloadPdf, onEditProfile }) {
  const quote = useQuote()
  const hasClient = Boolean(quote.client?.name)
  const [theme, setThemeState] = useState(getEffectiveTheme)

  useEffect(() => {
    // Picks up the system preference if the user never touched the toggle -
    // same media query index.css's own fallback uses, kept in sync so the
    // icon shown always matches what's actually rendered.
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setThemeState(getEffectiveTheme())
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <>
      <div className="no-print h-1 shrink-0" style={{ background: 'var(--grad-edge)' }} />
      <div className="no-print flex shrink-0 items-end justify-between gap-2.5 px-4 pt-3 md:px-[26px] md:pt-3.5">
        <div className="flex shrink-0 items-center gap-1.5 pb-2.5 text-[15px] font-semibold">
          <span
            className="flex h-[22px] w-[22px] items-center justify-center rounded-md text-xs text-white"
            style={{ background: 'var(--grad-btn)' }}
          >
            <LockKey size={12} />
          </span>
          HushQuote
        </div>

        <div
          className="hidden items-center gap-2.5 rounded-t-[10px] border border-b-0 px-4 py-2.5 text-[13.5px] font-semibold md:flex"
          style={{ background: 'var(--surface)', borderColor: 'var(--line)', boxShadow: 'var(--shadow)' }}
        >
          <span>{hasClient ? quote.client.name : 'New quote'}</span>
          <small className="font-mono text-xs font-normal" style={{ color: 'var(--muted)' }}>
            {quote.qNumber} &middot; draft
          </small>
        </div>

        <div className="flex gap-2 pb-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex min-h-9 items-center justify-center rounded-lg border px-2.5 motion-safe:transition-[background-color,transform] motion-safe:duration-150 hover:bg-[var(--accent-soft)] motion-safe:active:scale-95"
            style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
          >
            {theme === 'dark' ? <MoonStars size={16} /> : <SunDim size={16} />}
          </button>
          <button
            type="button"
            onClick={onEditProfile}
            aria-label="Edit business profile"
            className="flex min-h-9 items-center justify-center rounded-lg border px-2.5 motion-safe:transition-[background-color,transform] motion-safe:duration-150 hover:bg-[var(--accent-soft)] motion-safe:active:scale-95"
            style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
          >
            <PencilSimple size={16} />
          </button>
          <button
            type="button"
            onClick={onDownloadPdf}
            className="flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white motion-safe:transition-[filter,transform] motion-safe:duration-150 hover:brightness-110 motion-safe:active:scale-95"
            style={{ background: 'var(--grad-btn)' }}
          >
            <DownloadSimple size={16} />
            PDF
          </button>
        </div>
      </div>
    </>
  )
}
