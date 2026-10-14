// Shared frame for HushQuote's one illustration (docs/UI.md "Visual pop"
// point 3): waveform flowing into a dimension-marked quote sheet, pencil.
// Used by BlueprintEmpty (the Sheet's empty state) and Dashboard (the
// quotes-list empty state) - same asset, not a second illustration style.

export default function BlueprintIllustration({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[10px] ${className}`}
      style={{
        background:
          'radial-gradient(420px 260px at 50% 0%, rgba(107,133,242,.14), transparent 70%), linear-gradient(180deg,#20368F 0%,#1D3180 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.14), 0 10px 30px rgba(30,55,168,.25)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent 0 13px, rgba(255,255,255,.07) 13px 14px), repeating-linear-gradient(90deg, transparent 0 13px, rgba(255,255,255,.07) 13px 14px)',
        }}
      />
      <svg
        viewBox="0 0 300 210"
        fill="none"
        stroke="#ADC0FF"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative h-full w-full"
      >
        <rect x="92" y="34" width="116" height="146" rx="3" />
        <line x1="104" y1="56" x2="160" y2="56" strokeWidth="2.4" />
        <line x1="104" y1="76" x2="196" y2="76" />
        <line x1="104" y1="92" x2="180" y2="92" />
        <line x1="104" y1="108" x2="188" y2="108" />
        <line x1="104" y1="150" x2="196" y2="150" strokeWidth="2.4" />
        <text x="166" y="166" fontFamily="Geist Mono" fontSize="11" fill="#ADC0FF" stroke="none" textAnchor="end">
          2,574.00
        </text>
        <line x1="70" y1="34" x2="70" y2="180" strokeDasharray="3 5" strokeWidth="1" />
        <line x1="64" y1="34" x2="76" y2="34" strokeWidth="1" />
        <line x1="64" y1="180" x2="76" y2="180" strokeWidth="1" />
        <path d="M18 108 h10 M34 100 v16 M44 92 v32 M54 100 v16 M64 96 v24 M74 104 v8" strokeWidth="2" />
        <path d="M80 108 H 92" strokeDasharray="2 4" strokeWidth="1.4" />
        <path d="M226 64 l26 -26 m-26 26 l-5 13 13 -5 m-8 -8 l18 -18" strokeWidth="1.6" />
      </svg>
    </div>
  )
}
