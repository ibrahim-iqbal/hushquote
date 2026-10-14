// The single allowed sheet/drawer (docs/UI.md rule 10). Holds business
// profile fields and the rate library. Inline-edit everywhere, no Save
// button - every change persists immediately through context + storage.js,
// same pattern as the Sheet itself.

import { X, Plus } from '@phosphor-icons/react'
import { useProfile } from '../context/ProfileContext'
import { useRates } from '../context/RatesContext'
import { UNITS } from '../lib/schema'

const CURRENCIES = ['USD', 'EUR', 'GBP']

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle = {
  borderColor: 'var(--line)',
  background: 'var(--bg)',
  color: 'var(--ink)',
}

export default function ProfileDrawer({ open, onClose }) {
  const { profile, setProfile } = useProfile()
  const { rates, addRate, updateRate, removeRate } = useRates()

  if (!open) return null

  return (
    <div className="no-print fixed inset-0 z-[60] flex justify-end" style={{ background: 'rgba(16,24,70,.35)' }} onClick={onClose}>
      <div
        className="flex h-full w-full max-w-[380px] flex-col gap-5 overflow-y-auto p-5"
        style={{ background: 'var(--surface)', boxShadow: 'var(--sheet-shadow)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">Business profile</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="opacity-60 hover:opacity-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Business name">
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="min-h-11 w-full rounded-[10px] border-[1.5px] px-3 text-[15px] outline-none"
              style={inputStyle}
            />
          </Field>
          <Field label="Trade">
            <input
              value={profile.trade}
              onChange={(e) => setProfile({ ...profile, trade: e.target.value })}
              placeholder="e.g. tiling, electrical"
              className="min-h-11 w-full rounded-[10px] border-[1.5px] px-3 text-[15px] outline-none"
              style={inputStyle}
            />
          </Field>
          <Field label="Contact">
            <input
              value={profile.contact}
              onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
              placeholder="phone or email"
              className="min-h-11 w-full rounded-[10px] border-[1.5px] px-3 text-[15px] outline-none"
              style={inputStyle}
            />
          </Field>
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Currency">
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  className="min-h-11 w-full rounded-[10px] border-[1.5px] px-3 text-[15px] outline-none"
                  style={inputStyle}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Default tax %">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  value={Math.round((profile.taxRate ?? 0) * 100)}
                  onChange={(e) => {
                    const pct = parseFloat(e.target.value)
                    // Same reasoning as Sheet.jsx's tax input: BusinessProfile.taxRate
                    // is zod-bound to [0,1], and an out-of-range value here would
                    // silently wipe the whole saved profile on the next reload.
                    const clamped = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0
                    setProfile({ ...profile, taxRate: clamped / 100 })
                  }}
                  className="min-h-11 w-full rounded-[10px] border-[1.5px] px-3 text-[15px] outline-none"
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Rate library
            </h3>
            <button type="button" onClick={addRate} className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
              <Plus size={14} />
              Add
            </button>
          </div>

          {rates.length === 0 && (
            <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
              Saved rates help the model fill in prices it wasn't told. Add your usual jobs here.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {rates.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  value={r.label}
                  onChange={(e) => updateRate(i, { label: e.target.value })}
                  placeholder="service"
                  className="min-h-10 flex-1 rounded-lg border px-2 text-[13.5px] outline-none"
                  style={inputStyle}
                />
                <select
                  value={r.unit}
                  onChange={(e) => updateRate(i, { unit: e.target.value })}
                  className="min-h-10 rounded-lg border px-1.5 text-[12.5px] outline-none"
                  style={inputStyle}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={r.rate}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value)
                    updateRate(i, { rate: Number.isFinite(num) ? num : 0 })
                  }}
                  className="min-h-10 w-20 rounded-lg border px-2 text-right font-mono text-[13px] outline-none"
                  style={inputStyle}
                />
                <button type="button" onClick={() => removeRate(i)} aria-label="Remove rate" className="shrink-0 opacity-40 hover:opacity-100">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
