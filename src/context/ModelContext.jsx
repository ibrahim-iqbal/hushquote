// Model lifecycle stub for Day 1. Real wllama + Gemma integration lands Day 2
// (see docs/ARCHITECTURE.md section 3). For now this only drives the Cover
// Page's progress bar with a fake 2s load so the reveal animation and manual
// mode can be built and tested honestly. extractQuote() always returns null,
// which keeps the whole app in manual mode, exactly the Day-1 floor product
// described in docs/RISKS.md R4.1.

import { createContext, useContext, useEffect, useState } from 'react'

const ModelContext = createContext(null)

const FAKE_LOAD_MS = 2000
const FAKE_SIZE_MB = 260

export function ModelProvider({ children }) {
  const [status, setStatus] = useState('idle') // idle | loading | ready | busy | error
  const [progress, setProgress] = useState(0) // 0..1

  useEffect(() => {
    setStatus('loading')
    const start = Date.now()
    const tick = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(1, elapsed / FAKE_LOAD_MS)
      setProgress(pct)
      if (pct >= 1) {
        clearInterval(tick)
        setStatus('ready')
      }
    }, 60)
    return () => clearInterval(tick)
  }, [])

  // Day 2 will replace this with a real wllama.generate() call per the
  // prompt contract in docs/ARCHITECTURE.md section 4 and the parse ladder
  // in section 5. Day 1 always returns null, which is a legitimate "model
  // declined to extract" result the UI already knows how to handle.
  async function extractQuote(_text) {
    return null
  }

  const value = {
    status,
    progress,
    downloadedMb: Math.round(progress * FAKE_SIZE_MB),
    totalMb: FAKE_SIZE_MB,
    extractQuote,
  }

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
}

export function useModel() {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used inside ModelProvider')
  return ctx
}
