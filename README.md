# HushQuote

Speak a job, get a professional quote. A local open-weight model (Gemma 3
270M) runs entirely in your browser via WebAssembly/WebGPU and turns a
spoken or typed job description into an itemized, editable quote, then a
PDF. No account, no server, no backend of any kind. Your clients and rates
never leave the device they were typed on.

**Live:** https://hushquote.onrender.com
**Built for:** [DEV Hacktoberfest Open-Source AI Challenge, Week 2](https://dev.to/events/challenges/hacktoberfest-week2-2026-10-12) ("Side Hustle"), targeting Best Use of Gemma and Best Use of Render.
**Submission post:** https://dev.to/ibrahimiqbal/hushquote-quotes-that-stay-yours-3ldl

![Real job typed in, the model extracts it, one line confirmed, client named - all on the live deploy](docs/design/post-screenshots/hushquote-demo.gif)

## Status

Feature-complete and deployed.

- **Dashboard** - every quote you've saved, with stat cards (count, total
  quoted value, lines still waiting on a rate) and a table to open, sort,
  or delete one. First visit shows an illustrated empty state instead of a
  blank table.
- **The quote editor** - say or type a job, the model extracts itemized
  lines (each one visually provisional - dashed border, "Estimated. Yours
  to set." - until you confirm it), edit anything inline, set up a
  business profile with a logo and a rate library, export a PDF via the
  browser's print dialog.
- **Manual mode** - no model needed. Works end to end on its own as a
  fallback floor if the model fails to load.

See [`docs/README.md`](docs/README.md) for the full docs index. Start with
`docs/PLAN.md` for the day-by-day build log and decisions, `docs/RISKS.md`
for the honest extraction-accuracy writeup (a full 20-transcript test
sweep, not just a couple of happy-path runs), and `docs/UI.md` for the
design contract.

![Dashboard - quote count, quoted value, and lines still needing a rate, with an illustrated empty state](docs/design/post-screenshots/03-dashboard.jpg)

![The Sheet mid-extraction - confirmed and still-estimated lines side by side](docs/design/post-screenshots/02-sheet-extraction.jpg)

## Why local AI

Tradespeople and freelancers already pay $10-30/month for invoicing
software that's worse at this one job. HushQuote's model is a file the app
ships, not a service you rent: no API bill, no vendor who can change
pricing under you, and because it runs on-device, a plumber's client list
and day rates never leave their phone. Works offline on a job site with no
signal.

The closest competitors in this space (InvoicePilot AI, VaultLedger AI,
and similar Side Hustle submissions) still require a local Ollama or
Python backend process. The one submission actually in the same product
category - turning a brief into a priced estimate - is
[ScopeCraft](https://dev.to/harshalranjhani/scopecraft-a-clearer-scope-a-fairer-quote-and-a-model-you-can-own-2cla),
which still runs a local Node server for inference. HushQuote has none at
all; it's a static site, and the model downloads straight into the browser
tab.

## Stack

- React 19 + Vite + Tailwind v4, client-side routing via `react-router-dom`
  (`HashRouter` - no server rewrite rules needed on static hosting)
- Zod for all data shapes (`src/lib/schema.js`)
- Phosphor icons, self-hosted Geist / Geist Mono variable fonts
- wllama (in-browser llama.cpp via WebAssembly/WebGPU) running Gemma 3
  270M-instruct (Q8_0), with JSON-schema constrained decoding + zod
  validation + one repair retry before falling back to manual entry
- PDF export via the browser's native print dialog (no added dependency)
- No backend, no database, no accounts, deployed as a static site on Render

## Design

The quote editor is one living document, not a step wizard: a transcript
rail ("the Margin") beside an always-visible quote document ("the Sheet"),
with a persistent command bar at the bottom. The Dashboard sits in front of
it as a single list screen, not a second information architecture - open
any quote and you're back in the same single-document editor. One
illustration (a waveform flowing into a dimension-marked quote sheet),
reused in both the editor's and the Dashboard's empty states, never a
second style. See `docs/UI.md` for the full design contract, including the
cover page, built from a gradient generated with
[FeralUI](https://feralui.dev/gradients). Motion (line-item stream-in, a
shimmer on AI-estimated lines, a glow while the model's thinking) is scoped
to real state, not decoration - see the D4 UX-pass entries in
`docs/PLAN.md`.

![Cover page - model downloading, then the lock-open reveal](docs/design/post-screenshots/01-cover.jpg)

### How extraction works

![Flow: mic or text input through Gemma 3 270M, JSON-schema validation, one repair retry, and either a confirmed sheet line or a fallback to manual mode](docs/design/post-screenshots/extraction-flow.png)

## Project structure

```
src/
  components/   UI - Dashboard, Margin, Sheet, Command Bar, Cover Page,
                Profile Drawer, Top Bar, the shared Blueprint illustration
  context/      React context + reducer state (quotes list, profile, rates, model)
  lib/          Pure logic - zod schemas, the parse ladder, totals, storage, theme
scripts/
  fetch-model.mjs   Downloads the Gemma 3 270M GGUF into public/models/
test/
  transcripts.md    20 test job descriptions used for the accuracy sweep in docs/RISKS.md
docs/           Build log, architecture, design contract, risk register - see docs/README.md
```

## Development

```bash
npm install
npm run dev     # start the dev server (fetches the model first if missing)
npm run build   # production build to dist/
npm run lint    # oxlint - should report zero warnings
npm run preview # serve the production build locally
```

First run downloads the local model (Gemma 3 270M, ~278MB) into
`public/models/` automatically; see `scripts/fetch-model.mjs`. The model
file itself is not committed to the repo.

## License

MIT, see `LICENSE`.


---

<p align="center">
  <sub><em>crafted by <a href="https://github.com/ibrahim-iqbal">ibrahim-iqbal</a> · <a href="https://dev.to/ibrahimiqbal">dev.to</a></em></sub>
</p>
