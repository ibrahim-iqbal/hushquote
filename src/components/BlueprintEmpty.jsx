// The only illustration in the app, via BlueprintIllustration.jsx (see
// docs/UI.md "Visual pop (v4)" point 3 and docs/HANDOFF.md). Shown only
// when the Sheet has zero line items and nothing has been typed yet.

import BlueprintIllustration from './BlueprintIllustration'

const CHIPS = ['bathroom tiling', 'fence staining', 'garden cleanup']

export default function BlueprintEmpty({ onChipClick }) {
  return (
    <div className="mx-auto max-w-[440px] text-center">
      <BlueprintIllustration className="mx-auto mb-5 h-[168px] w-[240px] md:h-[210px] md:w-[300px]" />
      <h3 className="text-[19px] font-semibold tracking-tight md:text-[21px]">Say the job. Get the quote.</h3>
      <p className="mt-1.5 text-sm" style={{ color: 'var(--muted)' }}>
        Describe it like you&apos;d tell a mate. The model typesets it onto the sheet.
      </p>
      <div className="mt-3.5 flex flex-wrap justify-center gap-2">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onChipClick?.(chip)}
            className="rounded-lg border px-3 py-2 text-[13.5px] font-medium motion-safe:transition-[background-color,transform] motion-safe:duration-150 hover:bg-[var(--accent-soft)] motion-safe:active:scale-95"
            style={{ background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--muted)', boxShadow: 'var(--shadow)' }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
