// The single allowed sheet/drawer (docs/UI.md rule 10). Three tabs inside
// it rather than three separate drawers: Profile, Rates, Help. Inline-edit
// everywhere, no Save button - every change persists immediately through
// context + storage.js, same pattern as the Sheet itself.
// Stays mounted even when closed (unlike the D3 version) so it can slide
// out instead of popping - see the transform classes below.

import { useRef, useState } from 'react'
import { X, Plus, Image as ImageIcon } from '@phosphor-icons/react'
import { useProfile } from '../context/ProfileContext'
import { useRates } from '../context/RatesContext'
import { UNITS } from '../lib/schema'
import { fileToResizedDataUrl } from '../lib/image'

const CURRENCIES = ['USD', 'EUR', 'GBP']
const TABS = ['Profile', 'Rates', 'Help']

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

function ProfileTab({ profile, setProfile }) {
  const fileRef = useRef(null)
  const [logoError, setLogoError] = useState('')

  async function handleLogoFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // lets picking the same file again still fire onChange
    if (!file) return
    try {
      setLogoError('')
      const dataUrl = await fileToResizedDataUrl(file)
      setProfile({ ...profile, logoDataUrl: dataUrl })
    } catch {
      setLogoError("Couldn't read that image. Try a JPG or PNG.")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Logo">
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border-[1.5px]"
            style={inputStyle}
          >
            {profile.logoDataUrl ? (
              <img src={profile.logoDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={20} style={{ color: 'var(--muted)' }} />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border px-3 py-1.5 text-[13px] font-semibold motion-safe:transition-colors hover:bg-[var(--accent-soft)]"
              style={{ borderColor: 'var(--line)', color: 'var(--accent)' }}
            >
              {profile.logoDataUrl ? 'Change' : 'Upload'}
            </button>
            {profile.logoDataUrl && (
              <button
                type="button"
                onClick={() => setProfile({ ...profile, logoDataUrl: undefined })}
                className="text-[12px]"
                style={{ color: 'var(--muted)' }}
              >
                Remove
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
        </div>
        {logoError && <p className="mt-1.5 text-[12px]" style={{ color: 'var(--danger)' }}>{logoError}</p>}
      </Field>

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
                // BusinessProfile.taxRate is zod-bound to [0,1]; an
                // out-of-range value would silently wipe the whole saved
                // profile on the next reload (see docs/PLAN.md D4 note).
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
  )
}

function RatesTab({ rates, addRate, updateRate, removeRate }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Rate library
        </h3>
        <button type="button" onClick={addRate} className="flex items-center gap-1 text-[13px] font-semibold motion-safe:transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
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
            <button type="button" onClick={() => removeRate(i)} aria-label="Remove rate" className="shrink-0 opacity-40 motion-safe:transition-opacity hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function HelpStep({ n, children }) {
  return (
    <div className="flex gap-2.5">
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold text-white"
        style={{ background: 'var(--accent)' }}
      >
        {n}
      </span>
      <p className="text-[13.5px] leading-relaxed">{children}</p>
    </div>
  )
}

function HelpTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <HelpStep n={1}>
          Tap the mic or just type the job, like you'd tell a mate: "tiled a bathroom, 40 square meters, two
          days labor."
        </HelpStep>
        <HelpStep n={2}>
          The model types lines onto the sheet. Anything it guessed shows a dashed border and
          "Estimated. Yours to set." - it hasn't been added to your total for certain yet, it's waiting on you.
        </HelpStep>
        <HelpStep n={3}>
          Tap <strong>Use this rate</strong> to confirm a guess, or just edit the description, quantity, unit
          or rate directly - tap any of them to change it. Tap the × to remove a line entirely.
        </HelpStep>
        <HelpStep n={4}>
          Set your business name, logo and usual rates in the <strong>Profile</strong> and{' '}
          <strong>Rates</strong> tabs. Saved rates help the model map vague phrasing ("the usual tiling job") to
          a price you've already set.
        </HelpStep>
        <HelpStep n={5}>
          Tap <strong>PDF</strong> top right when the quote's ready - it uses your browser's print dialog, so
          choose "Save as PDF" there.
        </HelpStep>
      </div>
      <div className="border-t pt-3" style={{ borderColor: 'var(--line)' }}>
        <p className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
          Everything runs on this device. The job description, the model's guesses, and your rates never
          leave your browser - there's no account and no server to send them to. The only thing that can use a
          cloud service is voice dictation itself, if your browser's speech recognition needs one; typing is
          always fully local.
        </p>
      </div>
    </div>
  )
}

export default function ProfileDrawer({ open, onClose }) {
  const { profile, setProfile } = useProfile()
  const { rates, addRate, updateRate, removeRate } = useRates()
  const [tab, setTab] = useState('Profile')

  return (
    <div
      className={`no-print fixed inset-0 z-[60] flex justify-end motion-safe:transition-opacity motion-safe:duration-200 ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{ background: 'rgba(16,24,70,.35)' }}
      onClick={onClose}
    >
      <div
        className={`flex h-full w-full max-w-[380px] flex-col gap-4 overflow-y-auto p-5 motion-safe:transition-transform motion-safe:duration-250 motion-safe:ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'var(--surface)', boxShadow: 'var(--sheet-shadow)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="opacity-60 motion-safe:transition-opacity hover:opacity-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg)' }}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="flex-1 rounded-md py-1.5 text-[13px] font-semibold motion-safe:transition-colors motion-safe:duration-150"
              style={
                tab === t
                  ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'var(--shadow)' }
                  : { color: 'var(--muted)' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Profile' && <ProfileTab profile={profile} setProfile={setProfile} />}
        {tab === 'Rates' && <RatesTab rates={rates} addRate={addRate} updateRate={updateRate} removeRate={removeRate} />}
        {tab === 'Help' && <HelpTab />}
      </div>
    </div>
  )
}
