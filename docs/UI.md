# HushQuote — UI Contract ("pristine, clean, intuitive")

> Binding for every screen. A change that violates this file is a bug.
> Polish checklist at the bottom gates the D4 milestone.

## Design stance (v2, 2026-10-13 — replaces v1 after anti-slop review)
Workwear-grade tool. Cobalt is the tradesperson's color (jackets, vans); porcelain-cool neutrals; every number in monospace like a receipt printer. Confident, utilitarian, zero craft-cosplay.
**v1 (paper/cream + green + amber + Inter + lucide) rejected**: hit the banned warm-craft palette family, default-font tell, and discouraged icon lib — classic AI-gen patterns. See mockup.html (v1, kept for contrast) vs mockup-v2.html (current).

## Tokens
- **Type:** **Geist** (variable, self-hosted) — display 28/34 semibold -2% tracking, body 16/24, label 12/16 medium uppercase-tracked (max ONE tracked label per screen). **Geist Mono for every number on the page** (line-item math, totals, progress meta, dates in PDF): `font-family: Geist Mono`.
- **Color:** porcelain `#F4F5F7` bg, surface `#FFFFFF`, ink `#15171C`, muted `#5C6470`, line `#E3E6EB`; single accent **workwear cobalt `#2B4BD7`** (soft tint `#E9EDFB`) for primary action + confirmed/active states ONLY. **No second hue for AI-estimates**: pending state is structural — dashed `1.5px` muted border + `#F0F1F4` fill + "Estimated. Yours to set." label. Danger `#C0392B` semantic only. Dark: bg `#101216`, surface `#181B21`, ink `#E9EBEF`, cobalt `#6B85F2`, pending `#1E222A`.
- **Icons:** **Phosphor** (regular weight), via `@phosphor-icons/react`. No lucide. Budget amended 2026-10-14 (pre-deploy pass) from six to ten glyphs, to cover features added after the original lock: microphone, arrow-up, download-simple, pencil-simple, lock-key, x, plus, image, sun-dim, moon-stars. Help lives as a tab inside the existing profile drawer (docs/UI.md rule 10), not a separate icon/popover.
- **Spacing:** 4px grid; 20px gutter mobile / centered 680px column desktop.
- **Radius:** one system — 12px cards/inputs, 10px buttons. No pills. **Shadows:** `0 1px 2px rgba(21,23,28,.05), 0 2px 8px rgba(21,23,28,.04)` only.
- **Motion:** 150–250ms ease-out; reveal stagger 40ms; `prefers-reduced-motion` honored. MOTION dial 4: hover/active states, stream-in rows, step transitions — nothing ambient.
- **Copy bans (shipped UI strings):** no em/en dashes, no cute AI-speak ("the brain" → "the model"), no middle-dot chains, plain functional sentences.

## Layout concept (v3, 2026-10-13): "The Margin"
The app is **one living document, not a 3-screen wizard**. Signature elements, binding:
1. **The Sheet** — an always-present, A4-proportioned quote document, typeset like the real deliverable (2px ink rules top/bottom, small-caps meta in mono, ruled totals block). Editing happens ON the sheet; there is no separate review screen.
2. **The Margin** — a rail (desktop) / collapsible strip (mobile) holding the raw transcript in Geist Mono, dictation-tape style. Every extracted line item is linked to its source phrase: tap an item, the phrase lights cobalt; tap a phrase, the item highlights. The AI is auditable by design — this interaction IS the product's trust story and its demo moment.
3. **The Command Bar** — one persistent bottom bar (mic + text + submit), typewriter-style. New utterances typeset new items into the sheet. No wizard CTAs.
4. **The Folder Tab** — document identity (client, Q-number, draft/sent status) rendered as a physical folder tab at the top; Share/PDF live beside it. No stepper anywhere.
Pending items: dashed "estimated" chip inline on the sheet, cobalt "use this rate" confirm. Faint ruled-paper background behind the sheet (1px lines at 24px rhythm, 1.5% ink).
Mobile collapse: margin → one-line strip with caret expand; sheet full-width; command bar fixed bottom.

## Visual pop (v4, 2026-10-13): blueprint language
Pop is structural, never blobby. Four devices, binding:
1. **Binder edge** — 4px gradient strip along the very top of the app: `linear-gradient(90deg,#1E37A8,#2B4BD7 35%,#6B85F2 75%,#2B4BD7)`. The only place a horizontal gradient appears.
2. **Graph-paper margin** — the transcript rail carries a faint 12px cobalt grid (rgba(43,75,215,.07) lines) under a 92% bg wash. Technical-margin feel.
3. **Blueprint empty state** — deep cobalt panel (`#20368F→#1D3180`, white 7% grid overlay, soft top glow) with a single-stroke technical illustration in `#ADC0FF` 1.6px: waveform flowing into a dimension-marked quote sheet, pencil. Headline: "Say the job. Get the quote." This is the only illustration in the app; filled states stay clean.
4. **Tactile buttons** — primary actions use a crisp vertical gradient `#3558E8→#2B4BD7→#2440BE` + `inset 0 1px 0 rgba(255,255,255,.22)` inner highlight + tinted shadow. Wordmark chip same treatment.
Banned still: mesh/aurora gradients, blobs, glows, gradient text, decorative illustration in working states.

## The Cover Page (v5, 2026-10-13): splash + reveal
Splash is legitimate because loading is real (model download). Spec, binding:
- **Surface (LOCKED 2026-10-13): real FeralUI export** — `cover-cobalt-pearl.png` (Prism · Cobalt pearl · Crest, 1920x1080, 2% noise baked, in repo/plan folder). No CSS re-creation; MP4 export for the animated loading state, this PNG for static/reduced-motion. No grid overlay on the cover (killed 2026-10-13 — muddied the asset).
- **Contrast system (user-approved):** content block anchored in the UPPER DARK THIRD (`justify-content:flex-start; padding-top:7%`); top scrim `linear-gradient(180deg, rgba(16,24,70,.62), rgba(16,24,70,.44) 34%, transparent 58%)` over the image; tagline/meta at 92-96% white with soft cobalt text-shadow; progress track `rgba(16,24,70,.45)`; privacy pill solid `rgba(14,21,62,.82)`. Pearl crest owns the bottom half untouched.
- **Content:** mark chip, wordmark, tagline "Quotes that stay yours.", real progress bar + mono meta ("getting the model · 162 / 260 MB"), privacy line "Runs on your device. Works offline. Nothing uploaded."
- **Reveal:** when model ready, cover lifts straight up 300ms cubic-bezier(.76,0,.24,1) — flipping the pad open. Workspace already rendered underneath (no pop-in).
- **Returning visit (model cached):** cover shows one brand beat (~400ms) then lifts; **manual-mode browsers skip the cover entirely** — never gate the app on a download that isn't happening.
- `prefers-reduced-motion`: cover fades 150ms instead of sliding.
- FeralUI gradient allowed ONLY: cover page, DEV-post hero/OG. Never behind working content. Note "gradient generated with FeralUI" in README.

## Rules (the "anyone can follow along" contract)
1. **One primary action per screen**, always the same green, always bottom-right (desktop) / full-width bottom (mobile). Everything else is quiet.
2. **(superseded by The Margin, v3)** ~~3-step stepper~~ — single-document model; progress is the document itself filling in.
3. **Model state is always explained in human words:** "Downloading the brain (280 MB, one time, stays on your device)…" with a real progress bar; "Thinking…" with streaming items appearing live; never a blank spinner.
4. **AI output is visually provisional until accepted:** dashed amber border + "estimate" chip on model-guessed rates; one tap converts to confirmed (solid, ink). User always sees what the machine guessed vs. what they set.
5. **Math is never animated or delayed** — totals update instantly and deterministically on any edit; the model never touches arithmetic.
6. **Empty states teach:** first visit shows a ghost quote with 3 example chips; tapping one runs the whole flow with sample data so users learn by watching.
7. **Every input keyboard-reachable; mic is an enhancement, not a requirement.** Textarea and mic have equal visual weight on Describe.
8. **Touch targets ≥ 44px; body text ≥ 16px** (also avoids iOS zoom); contrast AA minimum — check green-on-paper (#1E6B4E on #FAFAF7 = 6.6:1 ✓).
9. **Microcopy is plain-spoken:** "Save quote", not "Persist document". Errors say what to do next: "Mic needs permission — or just type below."
10. **No modals for the core flow.** Business profile is the single allowed sheet/drawer.

## Screen notes
- **Describe:** headline "What's the job?", big rounded textarea, mic button inside it (right), example chips under it. Primary: "Build quote →".
- **Review:** quote as a document card (client header, line items, totals footer). Inline edit on tap — no edit modes. Add-line button is a quiet dashed row. Primary: "Looks right →".
- **Send:** rendered PDF preview (actual pages, not a screenshot), business profile summary above with "Edit" link. Primary: "Download PDF". Secondary quiet: "Share" / "Start another".

## D4 polish gate (all must pass before deploy)
- [ ] 320px-wide phone: no horizontal scroll, flow completable
- [ ] Lighthouse a11y ≥ 95; keyboard-only run-through of all 3 steps
- [ ] Dark mode checked on all 3 screens + PDF preview legible
- [ ] Model-less fallback path walked end-to-end (manual mode)
- [ ] Slow-network first load: progress UI appears < 1s, app shell usable while model downloads
- [ ] All copy read aloud once — anything that sounds like software, rewrite
- [ ] `prefers-reduced-motion` honored
- [ ] Favicon, OG image, PWA icons, title ("HushQuote — quotes that stay yours")
