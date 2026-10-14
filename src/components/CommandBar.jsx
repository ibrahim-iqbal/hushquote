import { useState } from 'react'
import { Microphone, ArrowUp, Stop } from '@phosphor-icons/react'
import { useSpeechRecognition } from '../lib/useSpeechRecognition'
import { useModel } from '../context/ModelContext'

export default function CommandBar({ onSubmit, placeholder = 'Say the job, or type it...' }) {
  const [text, setText] = useState('')
  const model = useModel()
  const busy = model.status === 'busy'
  const { supported, listening, start, stop } = useSpeechRecognition({
    onResult: (spoken) => setText((prev) => (prev ? `${prev} ${spoken}` : spoken)),
  })

  function submit() {
    if (busy) return
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setText('')
  }

  return (
    <div
      className="no-print flex shrink-0 items-center gap-2.5 border-t px-3 py-2.5 md:px-[26px] md:py-3"
      style={{ borderColor: 'var(--line)', background: 'var(--surface)', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
    >
      <div
        className="flex min-h-12 flex-1 items-center gap-2.5 rounded-[10px] border-[1.5px] px-3 text-[16px]"
        style={{ borderColor: 'var(--line)', background: 'var(--bg)', color: 'var(--muted)' }}
      >
        {supported && (
          <button
            type="button"
            onClick={listening ? stop : start}
            aria-label={listening ? 'Stop listening' : 'Start voice input'}
            className="shrink-0"
            style={{ color: listening ? 'var(--danger)' : 'var(--accent)' }}
          >
            <Microphone size={19} weight={listening ? 'fill' : 'regular'} />
          </button>
        )}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={busy ? 'Thinking...' : placeholder}
          disabled={busy}
          className="w-full bg-transparent outline-none disabled:opacity-60"
          style={{ color: 'var(--ink)' }}
        />
      </div>
      <button
        type="button"
        onClick={busy ? model.stop : submit}
        aria-label={busy ? 'Stop' : 'Submit'}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] text-white motion-safe:transition-[filter,transform] motion-safe:duration-150 hover:brightness-110 motion-safe:active:scale-95"
        style={{ background: busy ? 'var(--danger)' : 'var(--grad-btn)' }}
      >
        {busy ? <Stop size={16} weight="fill" /> : <ArrowUp size={18} />}
      </button>
    </div>
  )
}
