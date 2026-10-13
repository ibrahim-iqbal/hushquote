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

  if (quote.items.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center overflow-auto p-4 md:p-[22px_30px]"
        style={{ background: 'repeating-linear-gradient(0deg, transparent 0 23px, rgba(21,23,28,.015) 23px 24px)' }}
      >
        <BlueprintEmpty onChipClick={onExampleChip} />
      </div>
    )
  }

  return (
    <div
      className="flex-1 overflow-auto p-4 md:p-[22px_30px]"
      style={{ background: 'repeating-linear-gradient(0deg, transparent 0 23px, rgba(21,23,28,.015) 23px 24px)' }}
    >
      <div
        className="mx-auto max-w-[470px] rounded-[4px] border p-5 text-[13.5px] md:p-[28px_30px]"
        style={{ background: 'var(--surface)', borderColor: 'var(--line)', boxShadow: 'var(--sheet-shadow)' }}
      >
        <div className="flex items-start justify-between gap-2.5 border-b-2 pb-3" style={{ borderColor: 'var(--ink)' }}>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold">{profile.name || 'Your business'}</div>
            <small style={{ color: 'var(--muted)' }}>
              {[profile.contact, profile.currency].filter(Boolean).join(' · ')}
            </small>
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

        {quote.items.map((item) => (
          <SheetLineItem key={item.id} item={item} />
        ))}

        <button
          type="button"
          onClick={() =>
            dispatch({ type: 'ITEM_ADDED', description: '', qty: 1, unit: 'item', rate: null, source: 'user' })
          }
          className="my-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed py-2.5 text-[13.5px] font-medium"
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
                value={Math.round(quote.taxRate * 100)}
                onChange={(e) => {
                  const pct = parseFloat(e.target.value)
                  dispatch({ type: 'TAX_SET', taxRate: Number.isFinite(pct) ? pct / 100 : 0 })
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
