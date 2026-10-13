# HushQuote — Plan of Record

> **Any model/session working on this project: read this file, IDEAS.md and UI.md first.
> Do not deviate without updating this file and noting why in the Decisions log.**

## One-liner
Speak a job description; a local open-weight model running **entirely in your browser** turns it into an itemized, editable, professional quote — then a branded PDF. No account. No server. Your clients and rates never leave your device.

## Why it fits "Side Hustle"
- Real person: tradespeople + freelancers (the archetypal side hustlers).
- Specific problem: quoting is slow, hated, and lost quotes = lost income.
- They already pay: invoicing SaaS is $10–30/month.
- Open-source AI is load-bearing, not decoration: privacy of client data + rates, offline use on job sites, zero running costs (no API bill for a side hustler).

## Stack (locked — revised per REVIEW.md, 2026-10-13)
| Layer | Choice | Why |
|---|---|---|
| App | React 19 + Vite PWA | Same as touch-grass; known-good; Render static deploy solved |
| Model runtime | **wllama V3 only** — WebGPU when available, WASM-SIMD fallback, one API, GGUF direct | V3 ships both paths; WebLLM dropped (REVIEW B1). COOP/COEP headers required for threads — reuse Week-1 `_headers` |
| Model | **Gemma 3 270M-instruct Q8_0 (292MB, self-hosted) default ("Fast")**, 1B-instruct opt-in ("Smart", not yet integrated) | Targets **Best Use of Gemma ($200)** category; Q8 not Q4 because ggml-org only publishes Q8_0 for this model (D2 finding, see Decisions log) |
| JSON reliability | Grammar option if wllama exposes it (2h timebox D2) → **zod validate + one repair retry** → manual mode floor | REVIEW B2; LLM extracts, app calculates — model never does math |
| UI | **Tailwind v4** (UI.md tokens as `@theme`) + **Radix primitives** (Dialog, Toast only) + **lucide-react** + self-hosted **Inter variable** | Bespoke paper aesthetic, no component kit (REVIEW M3) |
| Voice | Web Speech API as *enhancement*; textarea first-class; mic hidden on Firefox; in-app disclosure that browser speech may use a cloud service | Firefox lacks API; Chrome mic audio goes to Google — never claim voice is local (REVIEW M2) |
| PDF | **pdf-lib** client-side; fallback print stylesheet + `window.print()` | Zero-dependency story (REVIEW M3) |
| Store | localStorage (business profile, rate library, saved quotes) | Local-first |
| Deploy | **Render free static tier** (dashboard: build `npm install && npm run build`, publish `dist` — not render.yaml alone) + model GGUFs from HF CDN | DigitalOcean category consciously skipped to keep local-first thesis clean (REVIEW M4) |

## Core flow (3 steps, one primary action per screen)
1. **Describe** — mic button + textarea. Example chips ("bathroom tiling job", "logo design package"). Model streams structured JSON.
2. **Review** — itemized quote table: editable qty/rate/description, auto totals, tax toggle. Model suggestions visually distinct until confirmed (dashed border → solid on accept).
3. **Send** — branded PDF preview, download/share. Business profile (name/logo/rates) editable inline, saved locally.

## Model contract
- Prompt → strict JSON schema: `{ client?, items: [{description, qty, unit, rate?}], notes? }`
- Rates resolved from the user's saved rate library first; model fills gaps, UI marks guesses as "estimate — tap to set".
- **Never let the model invent totals** — all math done in app code. (Writes well in the DEV post: "the LLM extracts, the app calculates".)
- Graceful degradation ladder: WebGPU (WebLLM) → WASM (wllama) → no-model manual mode (same UI, user types line items). App is never broken.

## Milestones (deadline Oct 18)
| Day | Deliverable |
|---|---|
| D1 (Oct 13) | Scaffold, UI shell of all 3 screens with mock data, design tokens from UI.md |
| D2 (Oct 14) | wllama + Gemma integration, JSON schema prompting, streaming into Review screen |
| D3 (Oct 15) | Rate library, PDF generation, business profile, localStorage persistence |
| D4 (Oct 16) | Polish pass (UI.md checklist), offline/PWA, deploy to Render, test on phone + Safari |
| D5 (Oct 17) | **DEV post** — writing is the heaviest-weighted criterion; budget a full day. Screenshots, the "why open innovation" section, honest limitations. Submit. Buffer: Oct 18 morning. |

## Non-goals (do not scope-creep)
- No accounts, no backend, no payments integration, no email sending.
- No multi-currency/locale matrix — one currency selector, done.
- No invoice numbering schemes/accounting features — it's quotes first; "Mark as invoice" just changes the PDF title.
- No model fine-tuning talk in the post unless actually done.

## Writing angle for the DEV post (draft thesis)
"A side hustle can't afford a SaaS stack. HushQuote is what invoicing looks like when the AI is a file you ship, not a service you rent: a 1B-parameter open-weight model, running in the browser, doing one job well — and because it's local, a plumber's client list and day-rates stay on the plumber's phone."

## Decisions log
- 2026-10-13 (D4, extraction accuracy sweep): Ran all remaining 18 of 20 test transcripts (docs/test/transcripts.md) live, see docs/RISKS.md R3 for the full per-transcript writeup. Headline finding: the single few-shot example's content leaked into 10 of 18 outputs (a fabricated "Callout" line, confirmed NOT caused by the rate library), and twice (transcripts 9, 20) the model either echoed the example verbatim ignoring the real input, or invented a fully priced fake quote for an input with zero numbers in it - a direct violation of "never invent prices." Tried dropping the few-shot example entirely (zero-shot, relying on JSON-schema constrained decoding alone); it fixed both critical cases but introduced a new corruption (literal `"${1}"`/`"+"` in the description field) and worse duplication on one retest. Reverted - shipping the known few-shot behavior, not an unproven swap this close to the deadline. Recommended next step if time allows: deterministic regex co-extraction (RISKS R3 ladder step 3) or testing the 1B model variant, which was always the planned "Smart" opt-in.
- 2026-10-13 (D4): Polish pass against docs/UI.md's gate, partial. Fixed real bugs found live: (1) dark mode was dead code - `:root[data-theme="dark"]` was never set by anything, nothing read `prefers-color-scheme`; wrapped the same tokens in `@media (prefers-color-scheme: dark)` so the app actually follows the system theme now, verified both ways at 320px. (2) Cover Page privacy pill overflowed past the viewport edge at 320px width (clipped silently by a parent `overflow-hidden`, not a scrollbar - easy to miss); fixed to wrap at narrow widths, stays one line on larger screens. (3) `public/favicon.svg` and the leftover `public/icons.svg` sprite were unrelated template scaffolding (a purple abstract mark + a Bluesky/Discord/GitHub icon sheet), not HushQuote's own mark - replaced with a cobalt LockKey favicon matching docs/UI.md's brand, deleted the stray sprite. Added manifest.webmanifest + apple-touch-icon + OG/Twitter meta (reusing cover-cobalt-pearl.png per README's allowed usage). Keyboard-only tab order and console verified clean; copy re-read against the banned-punctuation list (no em/en dashes in any shipped string).
  **Known gap, deliberately deferred:** no service worker. A real offline PWA needs one that reliably caches a 292MB GGUF, which is a correctness-risk-heavy feature to build this close to the deadline. App already works fully offline on repeat visits via wllama's own OPFS model cache (confirmed D2/D3); what's missing is the browser's installability prompt and asset precache, not offline function. Add only if D4 time remains after the rest of the gate.
  **Still open from the gate:** Lighthouse a11y score (no Lighthouse CLI in this sandbox - did a manual pass instead: aria-labels present on icon-only buttons, visible focus order confirmed via keyboard tab-through, no focus rings suppressed); Safari real-device check; remaining 18/20 test transcripts; Render deploy (still blocked on interactive sign-in, see D1 note).
- 2026-10-13 (D3): Business profile + rate library shipped. New `RatesContext` (mirrors `ProfileContext`) persists `RateItem[]` at `hushquote.rateLibrary.v1`; `ProfileDrawer` is the single allowed sheet (docs/UI.md rule 10) holding both, inline-edit, no Save button. ModelContext already read this storage key directly for prompt building (D2), so no extra wiring there - verified live: added a `Callout/hour/75` rate and a business name, ran the bathroom-tiling model extraction, confirmed both the name and the quote reflected it.
- 2026-10-13 (D3): **PDF stays window.print(), pdf-lib skipped.** The print stylesheet (`.no-print` classes on all chrome) already produces a real downloadable PDF via the browser's native print-to-PDF, zero added dependency or bundle weight - this was PLAN's own documented fallback story, just promoted to the only path given the deadline. Add pdf-lib later only if judges need a one-click file download without the print dialog.
- 2026-10-13 (D2): wllama V3 + Gemma 3 270M-instruct integrated, verified end-to-end in browser: real download progress on the Cover Page, WebGPU-accelerated extraction (23-44 tok/s measured), zod-validated parse ladder, repair retry, abort/stop control, pending/estimated UI for model-sourced lines.
- 2026-10-13 (D2): **Model is Q8_0 (292MB), not Q4.** ggml-org (the canonical, wllama-tested publisher) ships only Q8_0 for gemma-3-270m-it; no Q4 GGUF exists there. Q8 is higher quality and still comfortably same-origin-hostable (under wllama's 512MB single-file chunk threshold, no splitting needed) - a straight upgrade from plan, not a compromise.
- 2026-10-13 (D2): The 2h GBNF-grammar-probe timebox (docs/ARCHITECTURE.md section 4) resolved in minutes, not hours - wllama's `createChatCompletion` already supports OAI-compatible `response_format: {type: 'json_schema'}` constrained decoding natively. No GBNF grammar needed, no extra dependency installed.
- 2026-10-13 (D2): Removed React StrictMode (src/main.jsx). ModelProvider's mount effect acquires a native OPFS sync-access-handle through wllama's cache manager; StrictMode's double-invoke-then-cleanup of effects in dev collided with that handle (NoModificationAllowedError on the second mount). Same category of fix as a WebGL/Pixi double-init issue from a prior project - don't double-invoke an effect that holds a native resource.
- 2026-10-13 (D2): Fixed a real bug found during testing - CoverPage never handled `status === 'error'`, so a failed model load left the splash stuck forever with no way into manual mode. Now lifts immediately on error; App.jsx shows a "couldn't load the model" banner underneath. Caught by deliberately triggering the StrictMode double-mount error before removing StrictMode - useful to know this class of bug now has a concrete regression case even though the root cause (StrictMode) is gone.
- 2026-10-13 (D2): Measured extraction accuracy on 2 of the 20 test transcripts (docs/test/transcripts.md): single-item jobs extract reliably; 3+ item jobs still produce 1-2 duplicate/wrong-unit lines after two targeted, validated prompt fixes (see docs/RISKS.md R3 for the full writeup). Treated as a measured 270M capability ceiling, not a further prompt bug, per RISKS R4.3's "don't keep extending a timeboxed task." The pending/estimated + removable-item UI (already built D1) is the product's actual, working answer to this - verified live that removing a bad line and recomputing totals works correctly.
- 2026-10-13 (D2): docs/RISKS.md R2 (COOP/COEP) mostly evaporated - wllama V3 auto-detects cross-origin isolation and switches its own thread strategy internally, no app-side header or runtime-guard code was needed.
- Open for D3/D4: run the remaining 18 of 20 test transcripts for a real accuracy count before any 270M-vs-1B default decision; multi-device (Android, Safari/WASM) tok/s measurement for the D4 cross-device table; deterministic regex co-extraction pass (RISKS R3 ladder step 3) if accuracy still needs it after D3 polish.
- 2026-10-13 (D1): Scaffold, shell, manual quote builder, and Cover Page built and verified (build clean, zero console errors, mobile 375px collapse matches proven mockup, localStorage persistence confirmed, totals compute live). Committed and pushed to https://github.com/ibrahim-iqbal/hushquote (main).
- 2026-10-13 (D1): Render deploy BLOCKED, not done. Render dashboard requires interactive sign-in; cannot proceed without entering the user's credentials, which is out of scope for an automated session. render.yaml is in the repo and correct. **Next action for a human or a session with an authenticated browser: sign in to Render, create a new Static Site from github.com/ibrahim-iqbal/hushquote, and in the dashboard (not just render.yaml) set Build Command `npm install && npm run build` and Publish Directory `dist`, per docs/HANDOFF.md gotchas.**

- 2026-10-13: Idea chosen (HushQuote) over receipt-OCR (risk) and status-update writer (freshness). See IDEAS.md scoring.
- 2026-10-13: ~~wllama primary / WebLLM enhancement~~ **superseded** → wllama V3 alone (ships WebGPU+WASM; WebLLM would add a second model format for nothing). See REVIEW.md B1.
- 2026-10-13: Senior review pass done (REVIEW.md) — stack named concretely, Gemma pinned for the $200 partner category, voice demoted with honest cloud-speech disclosure, DigitalOcean category skipped deliberately.
- 2026-10-13: Week 2 registration confirmed on MLH; no sponsor promo-code offers exist for this event (checked).
- Commit style: clean conventional commits, **no Co-Authored-By lines** (user instruction, 2026-10-12).

## Resolved questions (user, 2026-10-13)
1. Name: **HushQuote** — HushQuote collided (existing contractor tool); Quotewright rejected (sounds like QuoteWerks); HushQuote verified clean.
2. "Best Use of Gemma" category: **declare it** in submission.
3. Model default: **270M "Fast", 1B "Smart" opt-in** (1B hidden on non-WebGPU browsers).

See ARCHITECTURE.md for full flow, data shapes, model lifecycle, parse ladder, feasibility numbers, and failure modes.
