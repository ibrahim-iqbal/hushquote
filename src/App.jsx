import { useState } from 'react'
import { ModelProvider } from './context/ModelContext'
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
  const dispatch = useQuoteDispatch()

  function handleSubmit(text) {
    setTranscript(text)
    // Day 2: send text through model.extractQuote() and the parse ladder
    // (docs/ARCHITECTURE.md section 5). Day 1 is manual mode: typing/speaking
    // fills the Margin so the layout can be seen working end to end, and the
    // user adds lines themselves on the Sheet below.
  }

  function handleExampleChip(label) {
    handleSubmit(`${label} job`)
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
      <div className="flex min-h-0 flex-1 flex-col border-t md:flex-row" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        <MarginRail transcript={transcript} />
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
