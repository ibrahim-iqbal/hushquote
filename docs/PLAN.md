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
| Model | **Gemma 3 270M-instruct Q4 default ("Fast"), 1B-instruct Q4 opt-in ("Smart")**, GGUF from Hugging Face CDN | Targets **Best Use of Gemma ($200)** category; 270M default keeps first demo fast (REVIEW M1/m3) |
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
