// The Cover Page. See docs/UI.md "The Cover Page (v5)" — binding spec.
// Real FeralUI export (cover-cobalt-pearl.png), content anchored in the
// upper dark third, lifts open when the model is ready.

import { useEffect, useState, useSyncExternalStore } from 'react'
import { LockKey } from '@phosphor-icons/react'
import { useModel } from '../context/ModelContext'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function subscribeToReducedMotion(callback) {
  const mq = window.matchMedia(reducedMotionQuery)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches
}

// Syncs an external browser API (matchMedia) into React state without the
// extra "set state in an effect" render pass — see
// https://react.dev/reference/react/useSyncExternalStore
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeToReducedMotion, getReducedMotionSnapshot)
}

export default function CoverPage() {
  const { status, progress, downloadedMb, totalMb } = useModel()
  const reducedMotion = usePrefersReducedMotion()
  // Only the "ready" path needs a timer (a small beat so the 100% state is
  // visible before lifting); the error path lifts the same render it occurs
  // in, so it's derived directly instead of round-tripping through state.
  const [liftedAfterReady, setLiftedAfterReady] = useState(false)

  useEffect(() => {
    if (status !== 'ready') return
    const t = setTimeout(() => setLiftedAfterReady(true), 250)
    return () => clearTimeout(t)
  }, [status])

  // Model failed to load (unsupported browser, OOM, network). The app must
  // never gate manual mode on a model that isn't coming, per
  // docs/ARCHITECTURE.md section 8's failure modes table - lift immediately,
  // App.jsx shows the "couldn't load" banner underneath.
  const lifted = liftedAfterReady || status === 'error'

  if (lifted) return null

  const transitionClass = reducedMotion
    ? 'transition-opacity duration-150 opacity-0'
    : 'transition-transform duration-300 ease-[cubic-bezier(.76,0,.24,1)] -translate-y-full'

  return (
    <div
      className={`no-print absolute inset-0 z-50 flex flex-col items-start pt-[7%] ${
        status === 'ready' ? transitionClass : ''
      }`}
      style={{
        background:
          'linear-gradient(180deg, rgba(16,24,70,.62) 0%, rgba(16,24,70,.44) 34%, rgba(16,24,70,0) 58%), url(/cover-cobalt-pearl.png) center / cover no-repeat #1B2D77',
        boxShadow: '0 18px 60px rgba(13,22,60,.45)',
      }}
    >
      <div className="relative z-10 flex w-full flex-col items-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 text-white"
          style={{ background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(4px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.3)' }}
        >
          <LockKey size={26} weight="regular" />
        </div>
        <h1
          className="mt-4 text-3xl font-semibold tracking-tight text-white"
          style={{ textShadow: '0 1px 18px rgba(13,22,60,.55)' }}
        >
          HushQuote
        </h1>
        <p
          className="mt-1.5 text-[15px] text-white/95"
          style={{ textShadow: '0 1px 14px rgba(13,22,60,.6)' }}
        >
          Quotes that stay yours.
        </p>
        <div className="mt-8 w-[280px]">
          <div className="h-1 overflow-hidden rounded-full" style={{ background: 'rgba(16,24,70,.45)' }}>
            <div
              className="h-full rounded-full bg-white transition-[width] duration-100"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div
            className="mt-2 flex justify-between font-mono text-[11.5px] text-white/90"
            style={{ textShadow: '0 1px 10px rgba(13,22,60,.65)' }}
          >
            <span>getting the model</span>
            <span>{downloadedMb} / {totalMb} MB</span>
          </div>
        </div>
      </div>
      <div
        className="absolute bottom-6 left-1/2 z-10 flex w-max max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] leading-snug text-white/96 sm:whitespace-nowrap"
        style={{ background: 'rgba(14,21,62,.82)', backdropFilter: 'blur(4px)' }}
      >
        <LockKey size={15} className="shrink-0" />
        <span className="text-left">Runs on your device. Works offline. Nothing uploaded.</span>
      </div>
    </div>
  )
}
