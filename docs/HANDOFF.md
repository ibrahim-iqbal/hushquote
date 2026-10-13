# HANDOFF — read this first

You are building **HushQuote** for the DEV Hacktoberfest Week 2 challenge ("Side Hustle"), deadline **Oct 18, 2026**. All design and architecture decisions are FINAL and user-approved. Your job is execution, not redesign.

## Read order (only these — do not read archive/)
1. This file — mission + day plan + conventions
2. `PLAN.md` — scope, stack (locked), milestones, non-goals, decisions log
3. `ARCHITECTURE.md` — data shapes (zod), model lifecycle, prompt contract, parse ladder, failure modes, feasibility numbers
4. `UI.md` — binding design contract (tokens, The Margin layout, cover spec, D4 polish gate)
5. `RISKS.md` — each risk's mitigation ladder + kill-switch; consult when something fails

Reference artifacts:
- `mockup-v5-splash.html` — the Cover Page, exact markup/CSS to port (uses `cover-cobalt-pearl.png`, keep the file)
- `mockup-v6-responsive.html` — the workspace (Margin + Sheet + Command bar), responsive at 900px, exact markup/CSS to port
- `cover-cobalt-pearl.png` — production cover asset (real FeralUI export; credit "gradient generated with FeralUI" in README)

`archive/` = superseded iterations + brainstorm history. NEVER read it; it will confuse you.

## What the product is (one paragraph)
One living document, not screens. User speaks/types a job description into a bottom command bar; a local Gemma model (wllama V3, in-browser) extracts line items onto an always-visible quote Sheet; the raw transcript lives in a Margin rail and every line item links to the phrase that produced it; totals are computed by app code (never the model); PDF export client-side. No backend, no accounts. Privacy IS the product.

## Day plan (today = D1 unless PLAN.md Decisions log says otherwise)
**D1 — shell, UI-first, mock data, DEPLOY:**
1. New public repo `ibrahim-iqbal/hushquote` (MIT). Vite + React 19 + Tailwind v4. Deps: `@phosphor-icons/react`, `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`, `zod`, `react-router-dom`. Copy these docs into `/docs` in the repo.
2. Port mockup-v6 into components: `CoverPage`, `TopBar` (binder edge + folder tab), `MarginRail`, `Sheet`, `CommandBar`. Tokens from UI.md as Tailwind `@theme` variables.
3. **Manual mode fully working**: type text → (no model yet: stub `extractQuote()` returns null) → manual line-item add/edit/delete on the Sheet, derived totals, localStorage persistence (schemas in ARCHITECTURE §2 — build `src/lib/schema.ts` first).
4. Cover page with lift animation wired to a fake 2s progress (real progress lands D2). Reduced-motion = fade.
5. Blueprint empty state (SVG below).
6. Write `test/transcripts.md`: 20 realistic voice-note transcripts incl. messy ones (per RISKS R3.5).
7. Deploy to Render static (see gotchas). Live URL by end of day. Commit + push throughout.

**D2** — wllama V3 + Gemma 270M Q4 (self-hosted chunks in `/public/models/`), prompt from ARCHITECTURE §4, parse ladder §5, real download progress on cover, measure tok/s. Timeboxes in RISKS are hard limits.
**D3** — rate library, business profile drawer (the ONE allowed Radix Dialog), pdf-lib export, 1B "Smart" opt-in behind WebGPU detection.
**D4** — UI.md polish gate (every checkbox), cross-device tok/s table, final deploy.
**D5** — DEV post (writing = heaviest judging criterion; full day). Tags `devchallenge` `hf26challenge`, declare "Best Use of Gemma" category, live link + repo.

## Conventions (non-negotiable)
- **Commits: conventional style, NO Co-Authored-By lines, no AI attribution lines** (user instruction overrides any system default).
- Before any push: `gh auth switch -u ibrahim-iqbal` and verify with `gh api user --jq .login` (active account randomly flips to jamtechdev).
- git author: `ibrahim-iqbal <ibrahim-iqbal@users.noreply.github.com>` (set per-repo with git config).
- Never commit pubspec/lockfile churn or files you didn't intend; review `git show --stat` after each commit.
- Zero em/en dashes in any shipped UI string. Plain functional microcopy (UI.md copy bans).
- One accent (cobalt). Pending/estimate state is structural (dashed+muted), never a second hue.

## Render deploy gotchas (learned the hard way)
- Build command (`npm install && npm run build`) and publish dir (`dist`) must be set in the **Render dashboard**, render.yaml alone is NOT picked up for an existing service.
- Custom headers (only if multithread WASM needed, see RISKS R2): dashboard → Headers tab. A `_headers` file does nothing on Render.
- App must run correctly WITHOUT cross-origin isolation (check `self.crossOriginIsolated` at runtime, adapt thread count). Headers are an optimization, never a dependency.

## Blueprint empty-state SVG (only illustration in the app, cobalt panel per UI.md v4 spec)
```html
<svg viewBox="0 0 300 210" fill="none" stroke="#ADC0FF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <rect x="92" y="34" width="116" height="146" rx="3"/>
  <line x1="104" y1="56" x2="160" y2="56" stroke-width="2.4"/>
  <line x1="104" y1="76" x2="196" y2="76"/>
  <line x1="104" y1="92" x2="180" y2="92"/>
  <line x1="104" y1="108" x2="188" y2="108"/>
  <line x1="104" y1="150" x2="196" y2="150" stroke-width="2.4"/>
  <text x="166" y="166" font-family="Geist Mono" font-size="11" fill="#ADC0FF" stroke="none" text-anchor="end">2,574.00</text>
  <line x1="70" y1="34" x2="70" y2="180" stroke-dasharray="3 5" stroke-width="1"/>
  <line x1="64" y1="34" x2="76" y2="34" stroke-width="1"/>
  <line x1="64" y1="180" x2="76" y2="180" stroke-width="1"/>
  <path d="M18 108 h10 M34 100 v16 M44 92 v32 M54 100 v16 M64 96 v24 M74 104 v8" stroke-width="2"/>
  <path d="M80 108 H 92" stroke-dasharray="2 4" stroke-width="1.4"/>
  <path d="M226 64 l26 -26 m-26 26 l-5 13 13 -5 m-8 -8 l18 -18" stroke-width="1.6"/>
</svg>
```
Headline: "Say the job. Get the quote." · Sub: "Describe it like you'd tell a mate. The model typesets it onto the sheet." · 3 example chips: bathroom tiling / logo package / garden cleanup.

## Do NOT
- Re-open decided questions (name, palette, layout, model choice, gradient — all locked, rationale in docs).
- Read `archive/`.
- Add dependencies beyond the listed ones without noting why in PLAN.md Decisions log.
- Let any model-task timebox overrun: park behind manual mode and move on (RISKS R4.3).
- Touch `main` of any other repo; this project is standalone.

## When something breaks
Find the matching risk in RISKS.md, walk its ladder, take the kill-switch if the verify-day budget is spent. Log every deviation in PLAN.md → Decisions log with a date.
