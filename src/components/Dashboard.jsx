// The overview/list view added per the D6 "Dashboard" addendum in
// docs/UI.md. Lives at "/" (HashRouter); opening or creating a quote
// navigates to "/quote/:id", which renders the original single-document
// Workspace unchanged. This page only ever reads/creates/deletes from the
// quotes list - it never edits a quote's contents directly.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, CurrencyDollar, PencilSimple, TrashSimple, Check } from '@phosphor-icons/react'
import { useQuoteList, useQuoteDispatch, emptyQuote, nextQNumber } from '../context/QuoteContext'
import { computeTotals, formatMoney } from '../lib/totals'

function StatCard({ icon, label, value, sub }) {
  return (
    <div
      className="flex flex-1 flex-col gap-2 rounded-[10px] border p-4"
      style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
        <span style={{ color: 'var(--muted)' }}>{icon}</span>
      </div>
      <div className="font-mono text-[26px] font-semibold leading-none">{value}</div>
      {sub && <span className="text-[12px]" style={{ color: 'var(--muted)' }}>{sub}</span>}
    </div>
  )
}

function statusFor(quote) {
  if (quote.items.length === 0) return { label: 'Empty', tone: 'muted' }
  if (quote.items.some((item) => item.source === 'model')) return { label: 'Estimated', tone: 'pending' }
  return { label: 'Ready', tone: 'accent' }
}

export default function Dashboard() {
  const quotes = useQuoteList()
  const dispatch = useQuoteDispatch()
  const navigate = useNavigate()
  // Two-step inline delete instead of window.confirm(): native confirm()
  // dialogs are unreliable under browser automation (observed hanging the
  // page entirely earlier in this project, see docs/PLAN.md) and are a
  // jarring, unstyled interruption either way. First click arms the row
  // for 4s; a second click within that window deletes it.
  const [armedId, setArmedId] = useState(null)

  useEffect(() => {
    if (!armedId) return
    const t = setTimeout(() => setArmedId(null), 4000)
    return () => clearTimeout(t)
  }, [armedId])

  const quotedValue = quotes.reduce((sum, q) => sum + computeTotals(q).total, 0)
  const needsAttention = quotes.reduce(
    (sum, q) => sum + q.items.filter((item) => item.source === 'model').length,
    0
  )

  function handleNewQuote() {
    const quote = emptyQuote(nextQNumber(quotes))
    dispatch({ type: 'QUOTE_CREATED', quote })
    navigate(`/quote/${quote.id}`)
  }

  function handleDelete(e, id) {
    e.stopPropagation()
    // Functional update, not a read of the `armedId` closure variable:
    // two clicks fired back-to-back (fast real clicks, or automated ones)
    // can both get batched against the same pre-update render, which would
    // otherwise re-arm instead of confirming on the second click.
    setArmedId((prev) => {
      if (prev === id) {
        dispatch({ type: 'QUOTE_DELETED', id })
        return null
      }
      return id
    })
  }

  const sorted = [...quotes].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div className="no-print h-1 shrink-0" style={{ background: 'var(--grad-edge)' }} />
      <div className="mx-auto w-full max-w-[900px] px-4 py-8 md:px-[26px] md:py-12">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
              Say the job. Get the quote.
            </p>
            <h1 className="mt-1.5 text-[28px] font-semibold tracking-tight md:text-[32px]">
              Your quotes.
            </h1>
          </div>
          <button
            type="button"
            onClick={handleNewQuote}
            className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white motion-safe:transition-[filter,transform] motion-safe:duration-150 hover:brightness-110 motion-safe:active:scale-95"
            style={{ background: 'var(--grad-btn)' }}
          >
            <Plus size={16} weight="bold" />
            New quote
          </button>
        </div>

        <div className="mb-7 flex flex-col gap-3 sm:flex-row">
          <StatCard
            icon={<FileText size={16} />}
            label="In your workspace"
            value={String(quotes.length).padStart(2, '0')}
            sub={quotes.length === 1 ? '1 quote' : `${quotes.length} quotes`}
          />
          <StatCard
            icon={<CurrencyDollar size={16} />}
            label="Quoted value"
            value={formatMoney(quotedValue)}
            sub="Across all quotes, before tax adjustments vary"
          />
          <StatCard
            icon={<PencilSimple size={16} />}
            label="Lines to confirm"
            value={String(needsAttention).padStart(2, '0')}
            sub="Estimated lines across every draft"
          />
        </div>

        {sorted.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed px-6 py-14 text-center"
            style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
          >
            <p className="text-[14px]">No quotes yet. Say or type a job to start your first one.</p>
            <button
              type="button"
              onClick={handleNewQuote}
              className="rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white motion-safe:transition-[filter] hover:brightness-110"
              style={{ background: 'var(--grad-btn)' }}
            >
              New quote
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[10px] border" style={{ borderColor: 'var(--line)' }}>
            <table className="w-full border-collapse text-left text-[13.5px]">
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  <th className="px-4 py-2.5 font-medium" style={{ color: 'var(--muted)' }}>Client / quote</th>
                  <th className="px-4 py-2.5 font-medium" style={{ color: 'var(--muted)' }}>Status</th>
                  <th className="px-4 py-2.5 text-right font-medium" style={{ color: 'var(--muted)' }}>Total</th>
                  <th className="px-4 py-2.5 font-medium" style={{ color: 'var(--muted)' }}>Created</th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((quote) => {
                  const status = statusFor(quote)
                  const { total } = computeTotals(quote)
                  return (
                    <tr
                      key={quote.id}
                      onClick={() => navigate(`/quote/${quote.id}`)}
                      className="cursor-pointer border-t motion-safe:transition-colors motion-safe:duration-150 hover:bg-[var(--accent-soft)]"
                      style={{ borderColor: 'var(--line)' }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{quote.client?.name || 'Untitled client'}</div>
                        <div className="font-mono text-[11.5px]" style={{ color: 'var(--muted)' }}>{quote.qNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11.5px] font-medium"
                          style={{
                            background: status.tone === 'accent' ? 'var(--accent-soft)' : 'var(--pending)',
                            color: status.tone === 'accent' ? 'var(--accent)' : 'var(--muted)',
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatMoney(total, quote.currency)}</td>
                      <td className="px-4 py-3 font-mono text-[12px]" style={{ color: 'var(--muted)' }}>
                        {new Date(quote.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, quote.id)}
                          aria-label={armedId === quote.id ? 'Confirm delete quote' : 'Delete quote'}
                          className="flex items-center gap-1 rounded-md px-1.5 py-1.5 text-[11.5px] font-medium motion-safe:transition-colors"
                          style={
                            armedId === quote.id
                              ? { background: 'var(--danger)', color: 'white' }
                              : { color: 'var(--muted)' }
                          }
                        >
                          {armedId === quote.id ? (
                            <>
                              <Check size={14} weight="bold" />
                              Confirm
                            </>
                          ) : (
                            <TrashSimple size={14} />
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-center text-[11.5px]" style={{ color: 'var(--muted)' }}>
          Saved in this browser only. Nothing here was ever uploaded.
        </p>
      </div>
    </div>
  )
}
