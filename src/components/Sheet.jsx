import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { useQuote, useQuoteDispatch } from '../context/QuoteContext'
import { useProfile } from '../context/ProfileContext'
import { computeTotals, formatMoney, formatNumber } from '../lib/totals'
import SheetLineItem from './SheetLineItem'
import BlueprintEmpty from './BlueprintEmpty'

function todayLabel() {
  return new Date()
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
    .replace(/ /g, ' ')
}

export default function Sheet({ onExampleChip }) {
  const quote = useQuote()
  const dispatch = useQuoteDispatch()
  const { profile } = useProfile()
  const { subtotal, tax, total } = computeTotals(quote)
  const [editingClient, setEditingClient] = useState(false)
  const [clientDraft, setClientDraft] = useState(quote.client?.name ?? '')

  // Ambient drift (motion pass): a faint, slow-moving cobalt wash layered
  // under the paper-texture gradient, idle life behind the Sheet rather
  // than a flat static void. Low opacity on purpose - UI.md bans
  // mesh/aurora gradients as decoration, this is intentionally subtle.
  const sheetBg = {
    background:
      'repeating-linear-gradient(0deg, transparent 0 23px, rgba(21,23,28,.015) 23px 24px), radial-gradient(60% 50% at 30% 20%, rgba(43,75,215,.05), transparent 60%), radial-gradient(50% 45% at 80% 80%, rgba(107,133,242,.04), transparent 60%)',
  }

  if (quote.items.length === 0) {
    return (
      <div
        className="animate-sheet-drift flex flex-1 items-center justify-center overflow-auto p-4 md:p-[22px_30px]"
        style={sheetBg}
      >
        <BlueprintEmpty onChipClick={onExampleChip} />
      </div>
    )
  }

  return (
    <div
      className="animate-sheet-drift flex flex-1 flex-col overflow-auto p-4 md:p-[22px_30px]"
      style={sheetBg}
    >
      <div
        className="mx-auto my-auto w-full max-w-[470px] rounded-[4px] border p-5 text-[13.5px] md:p-[28px_30px]"
        style={{ background: 'var(--surface)', borderColor: 'var(--line)', boxShadow: 'var(--sheet-shadow)' }}
      >
        <div className="flex items-start justify-between gap-2.5 border-b-2 pb-3" style={{ borderColor: 'var(--ink)' }}>
          <div className="flex min-w-0 items-center gap-2.5">
            {profile.logoDataUrl && (
              <img
                src={profile.logoDataUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-md object-cover"
                style={{ border: '1px solid var(--line)' }}
              />
            )}
            <div className="min-w-0">
              <div className="text-[15px] font-semibold">{profile.name || 'Your business'}</div>
              <small style={{ color: 'var(--muted)' }}>
                {[profile.contact, profile.currency].filter(Boolean).join(' · ')}
              </small>
            </div>
          </div>
          <div className="shrink-0 whitespace-nowrap text-right font-mono text-[11.5px] leading-[1.7]" style={{ color: 'var(--muted)' }}>
            QUOTE {quote.qNumber}
            <br />
            {todayLabel()}
          </div>
        </div>

        <div className="py-2.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
          Prepared for{' '}
          {editingClient ? (
            <input
              autoFocus
              value={clientDraft}
              onChange={(e) => setClientDraft(e.target.value)}
              onBlur={() => {
                setEditingClient(false)
                dispatch({ type: 'CLIENT_SET', client: { name: clientDraft } })
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              placeholder="client name"
              className="rounded border bg-transparent px-1 font-semibold outline-none"
              style={{ borderColor: 'var(--accent)', color: 'var(--ink)' }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingClient(true)}
              className="font-semibold"
              style={{ color: 'var(--ink)' }}
            >
              {quote.client?.name || 'tap to name the client'}
            </button>
          )}
        </div>

        {quote.items.map((item, index) => (
          <SheetLineItem key={item.id} item={item} animationDelay={Math.min(index * 40, 160)} />
        ))}

        <button
          type="button"
          onClick={() =>
            dispatch({ type: 'ITEM_ADDED', description: '', qty: 1, unit: 'item', rate: null, source: 'user' })
          }
          className="my-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed py-2.5 text-[13.5px] font-medium motion-safe:transition-[background-color,transform] motion-safe:duration-150 hover:bg-[var(--accent-soft)] motion-safe:active:scale-[0.98]"
          style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
        >
          <Plus size={14} />
          Add a line
        </button>

        <div className="mt-1.5 border-t-2 pt-2.5" style={{ borderColor: 'var(--ink)' }}>
          <div className="flex justify-between py-0.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            <span>Subtotal</span>
            <span className="font-mono">{formatNumber(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between py-0.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            <span className="flex items-center gap-1">
              Tax
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                value={Math.round(quote.taxRate * 100)}
                onChange={(e) => {
                  const pct = parseFloat(e.target.value)
                  // Clamped to [0,100]: Quote.taxRate is zod-bound to [0,1]
                  // (src/lib/schema.js), and zod rejects the WHOLE saved
                  // quote object if this one field is out of range - an
                  // unclamped value here would silently wipe every line
                  // item on the next reload (loadJSON falls back to
                  // emptyQuote()), not just reset the tax field.
                  const clamped = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0
                  dispatch({ type: 'TAX_SET', taxRate: clamped / 100 })
                }}
                className="w-10 rounded border bg-transparent px-1 text-right font-mono text-[12.5px] outline-none"
                style={{ borderColor: 'var(--line)' }}
              />
              %
            </span>
            <span className="font-mono">{formatNumber(tax)}</span>
          </div>
          <div className="flex justify-between pt-1.5 text-[15px] font-semibold">
            <span>Total</span>
            <span className="font-mono text-[15.5px] font-semibold">{formatMoney(total, quote.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
