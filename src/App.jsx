import { useState } from 'react'
import { ModelProvider, useModel } from './context/ModelContext'
import { QuoteProvider, useQuoteDispatch } from './context/QuoteContext'
import { ProfileProvider } from './context/ProfileContext'
import { storageAvailable } from './lib/storage'
import CoverPage from './components/CoverPage'
import TopBar from './components/TopBar'
import MarginRail from './components/MarginRail'
import Sheet from './components/Sheet'
import CommandBar from './components/CommandBar'

function Workspace() {
  const [transcript, setTranscript] = useState('')
  const [hint, setHint] = useState('')
  const dispatch = useQuoteDispatch()
  const model = useModel()

  async function handleSubmit(text) {
    setTranscript(text)
    setHint('')

    if (model.status !== 'ready') {
      // Model still loading, errored, or this browser never got one
      // (see docs/ARCHITECTURE.md section 8 failure modes). The app stays
      // usable either way: the user just adds the line themselves below.
      setHint("Still getting ready. Add the line below for now.")
      return
    }

    const items = await model.extractQuote(text)
    if (!items || items.length === 0) {
      setHint("Couldn't auto-build this one. Add lines below.")
      return
    }
    for (const item of items) {
      dispatch({
        type: 'ITEM_ADDED',
        description: item.description,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate,
        source: item.source,
      })
    }
  }

  function handleExampleChip(label) {
    const text = `${label} job`
    if (model.status === 'ready') {
      handleSubmit(text)
      return
    }
    // Model not ready yet (likely, since loading takes a few seconds) -
    // the chip must still teach by doing something, per docs/UI.md rule 6,
    // so seed one clean sample line directly instead of leaving it inert.
    setTranscript(text)
    setHint('')
    dispatch({ type: 'ITEM_ADDED', description: label, qty: 1, unit: 'job', rate: null, source: 'user' })
  }

  function handleDownloadPdf() {
    window.print()
  }

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <CoverPage />
      <TopBar onDownloadPdf={handleDownloadPdf} />
      {!storageAvailable && (
        <div
          className="shrink-0 px-4 py-1.5 text-center text-xs md:px-[26px]"
          style={{ background: 'var(--pending)', color: 'var(--muted)' }}
        >
          Saving is off in private browsing. Your quote stays for this visit only.
        </div>
      )}
      {model.status === 'error' && (
        <div
          className="shrink-0 px-4 py-1.5 text-center text-xs md:px-[26px]"
          style={{ background: 'var(--pending)', color: 'var(--muted)' }}
        >
          Couldn't load the model on this device. You can still build quotes by hand.
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col border-t md:flex-row" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        <MarginRail transcript={transcript} hint={hint} />
        <Sheet onExampleChip={handleExampleChip} />
      </div>
      <CommandBar onSubmit={handleSubmit} />
    </div>
  )
}

export default function App() {
  return (
    <ModelProvider>
      <ProfileProvider>
        <QuoteProvider>
          <Workspace />
        </QuoteProvider>
      </ProfileProvider>
    </ModelProvider>
  )
}
