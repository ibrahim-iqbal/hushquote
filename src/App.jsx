import { useState } from 'react'
import { ModelProvider, useModel } from './context/ModelContext'
import { QuoteProvider, useQuoteDispatch } from './context/QuoteContext'
import { ProfileProvider } from './context/ProfileContext'
import { RatesProvider } from './context/RatesContext'
import { storageAvailable } from './lib/storage'
import CoverPage from './components/CoverPage'
import TopBar from './components/TopBar'
import MarginRail from './components/MarginRail'
import Sheet from './components/Sheet'
import CommandBar from './components/CommandBar'
import ProfileDrawer from './components/ProfileDrawer'

// Each chip's full, correct answer, seeded directly rather than run through
// the live model. See docs/RISKS.md R3: every one of these transcripts,
// even the ones the model gets the FIRST line right on, also produces 2-4
// extra fabricated lines (a duplicated/garbled fragment, or the few-shot
// example's "Materials/Labor/Callout" leaking in) - a baseline behavior on
// this model, not something fixable by rewording the sample text. An
// onboarding chip's job is to teach the UI by showing one correct, clean
// result (docs/UI.md rule 6's "sample data"), not to demo the model's real
// failure modes on the very first thing a new user sees.
const EXAMPLE_ITEMS = {
  'bathroom tiling': { description: 'Wall and floor tiling', qty: 40, unit: 'm2', rate: null },
  'fence staining': { description: 'Fence staining', qty: 40, unit: 'm', rate: 10 },
  'garden cleanup': { description: 'Garden cleanup', qty: 3, unit: 'hour', rate: null },
}

function Workspace() {
  const [transcript, setTranscript] = useState('')
  const [hint, setHint] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
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
    // Always seeds directly - never calls the live model. See the
    // EXAMPLE_ITEMS comment above for why: this used to call handleSubmit
    // when the model was ready, which reliably produced 2-4 fabricated
    // extra lines on every sample transcript tried. source: 'user' (not
    // 'model') because this is a known-correct seed, not something that
    // needs the pending/estimate confirmation step.
    const item = EXAMPLE_ITEMS[label] ?? { description: label, qty: 1, unit: 'job', rate: null }
    setTranscript(`${label} job`)
    setHint('')
    dispatch({ type: 'ITEM_ADDED', ...item, source: 'user' })
  }

  function handleDownloadPdf() {
    window.print()
  }

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <CoverPage />
      <TopBar onDownloadPdf={handleDownloadPdf} onEditProfile={() => setProfileOpen(true)} />
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
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
        <RatesProvider>
          <QuoteProvider>
            <Workspace />
          </QuoteProvider>
        </RatesProvider>
      </ProfileProvider>
    </ModelProvider>
  )
}
