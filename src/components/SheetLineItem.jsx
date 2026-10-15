import { useState } from 'react'
import { X } from '@phosphor-icons/react'
import { useQuoteDispatch } from '../context/QuoteContext'
import { lineAmount, formatNumber } from '../lib/totals'
import { UNITS } from '../lib/schema'

function EditableText({ value, onChange, placeholder, className, inputClassName }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          onChange(draft)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        className={`w-full rounded border bg-transparent px-1 outline-none ${inputClassName ?? ''}`}
        style={{ borderColor: 'var(--accent)' }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      className={`block w-full text-left ${className ?? ''}`}
    >
      {value || <span style={{ color: 'var(--muted)' }}>{placeholder}</span>}
    </button>
  )
}

function EditableNumber({ value, onChange, placeholder, className }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value == null ? '' : String(value))

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        inputMode="decimal"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          const num = parseFloat(draft)
          onChange(Number.isFinite(num) ? num : null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        className={`w-20 rounded border bg-transparent px-1 text-right font-mono outline-none ${className ?? ''}`}
        style={{ borderColor: 'var(--accent)' }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value == null ? '' : String(value))
        setEditing(true)
      }}
      className={`font-mono ${className ?? ''}`}
    >
      {value == null ? <span style={{ color: 'var(--muted)' }}>{placeholder}</span> : formatNumber(value)}
    </button>
  )
}

export default function SheetLineItem({ item, animationDelay = 0 }) {
  const dispatch = useQuoteDispatch()
  const pending = item.source === 'model'
  const [leaving, setLeaving] = useState(false)

  const handleRemove = () => {
    // Tactile exit instead of an instant unmount: fade + collapse, then
    // dispatch once the transition has actually played. Duration here must
    // match animate-item-out's keyframe time below.
    setLeaving(true)
    window.setTimeout(() => dispatch({ type: 'ITEM_REMOVED', id: item.id }), 180)
  }

  return (
    <div
      className={`motion-safe:transition-[border-color,background-color] motion-safe:duration-300 rounded-lg m-2.5 border-[1.5px] p-2.5 ${
        leaving ? 'animate-item-out' : 'animate-item-in'
      } ${pending ? 'border-dashed animate-pending-shimmer' : 'border-solid'}`}
      style={{
        animationDelay: leaving ? undefined : `${animationDelay}ms`,
        borderColor: pending ? 'var(--muted)' : 'var(--line)',
        background: pending ? undefined : 'var(--surface)',
      }}
    >
      <div>
        {pending && (
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            Estimated. Yours to set.
          </span>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0 flex-1">
            <EditableText
              value={item.description}
              placeholder="Description"
              onChange={(description) => dispatch({ type: 'ITEM_EDITED', id: item.id, patch: { description } })}
              className="truncate text-[14.5px] font-medium"
            />
            <div className="mt-0.5 flex items-center gap-1 font-mono text-[11.5px]" style={{ color: 'var(--muted)' }}>
              <EditableNumber
                value={item.qty}
                placeholder="qty"
                onChange={(qty) => dispatch({ type: 'ITEM_EDITED', id: item.id, patch: { qty: qty ?? 1 } })}
                className="text-[11.5px]"
              />
              <select
                value={item.unit}
                onChange={(e) => dispatch({ type: 'ITEM_EDITED', id: item.id, patch: { unit: e.target.value } })}
                className="rounded bg-transparent font-mono text-[11.5px] outline-none"
                style={{ color: 'var(--muted)' }}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <span>&times;</span>
              <EditableNumber
                value={item.rate}
                placeholder="rate?"
                onChange={(rate) => dispatch({ type: 'ITEM_EDITED', id: item.id, patch: { rate } })}
                className="text-[11.5px]"
              />
            </div>
            {pending && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'ITEM_CONFIRMED', id: item.id })}
                className="mt-1.5 text-[12.5px] font-semibold motion-safe:transition-[opacity,transform] motion-safe:duration-150 hover:opacity-70 motion-safe:active:scale-95"
                style={{ color: 'var(--accent)' }}
              >
                Use this rate
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-mono text-[13px]">{formatNumber(lineAmount(item))}</span>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove line"
              className="opacity-40 motion-safe:transition-[opacity,transform] motion-safe:duration-150 hover:opacity-100 motion-safe:active:scale-90"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
