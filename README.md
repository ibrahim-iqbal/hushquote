<div align="center">

# HushQuote

### Speak a job. Get a quote. Nothing leaves your device.

[![License: MIT](https://img.shields.io/badge/License-MIT-5b9dff.svg)](./LICENSE)
[![Hacktoberfest 2026 — Week 2](https://img.shields.io/badge/Hacktoberfest-Week%202%20Side%20Hustle-5b9dff.svg)](https://dev.to/events/challenges/hacktoberfest-week2-2026-10-12)
[![Powered by Gemma 3 270M](https://img.shields.io/badge/powered%20by-Gemma%203%20270M-5b9dff.svg)](https://huggingface.co/google/gemma-3-270m-it)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-5b9dff.svg)](#contributing)

[**Live demo**](https://hushquote.onrender.com) · [**DEV write-up**](https://dev.to/ibrahimiqbal/hushquote-quotes-that-stay-yours-3ldl) · [**Build log**](./docs/PLAN.md) · [**Risks**](./docs/RISKS.md)

</div>

<p align="center">
  <img src="./docs/design/post-screenshots/hushquote-demo.gif" alt="HushQuote — real job in, itemized quote out, all on-device" width="820">
</p>

<p align="center">
  <sub><em>say the job, confirm the lines, export the PDF. Gemma 3 270M runs entirely in your browser tab.</em></sub>
</p>

---

Every tradesperson I know who works for themselves does the same thing after a job: sits in the van, opens a notes app, and tries to turn *"forty square meters, two days, plus materials"* into something a client will actually pay against. Then they forget a line, round a number wrong, or just don't send the quote for three days because writing it feels like a second job.

The invoicing SaaS fix is a $15/month subscription and an account you have to make, for software that's worse at the one job that actually matters: turning what you just said out loud into a document. HushQuote fills that gap. It's cheap enough to be a real side-hustle tool, not a line item.

## Features

- **Fully local.** Gemma 3 270M (Q8_0 GGUF) runs entirely in the browser via WebGPU/WASM through `wllama`. No API key, no backend, no account. Client names and day rates never leave the device they were typed on.
- **The model extracts; the app decides what's true.** Every model-sourced line is visually provisional ("Estimated. Yours to set." label, dashed border) until you tap to confirm it. Math is always computed by plain JS over whatever's on the sheet — not by the model.
- **Dashboard + Sheet + Command Bar.** Every saved quote in one list with stat cards; one living quote document instead of a wizard; mic or textarea, one submit button, nothing else.
- **PDF export via the browser's own print dialog.** Zero added dependencies.
- **Manual mode fallback.** If the model fails to load, you can still type lines by hand. The app degrades honestly.
- **Hallucination filter + zod schema validation + one repair retry.** When the model goes off-script, the app catches it, retries once, and surrenders to manual rather than ship a wrong number silently.

## Try it

**Live:** <https://hushquote.onrender.com>

Or run locally:

```bash
git clone https://github.com/ibrahim-iqbal/hushquote-hf26-wk2.git
cd hushquote-hf26-wk2
npm ci
npm run fetch-model   # one-time ~278 MB Gemma 3 270M download
npm run dev
```

Then open <http://localhost:5173>.

## Stack

- **UI:** React 19 + Vite, static site, no backend
- **Model runtime:** [`wllama`](https://github.com/ngxson/wllama) (llama.cpp compiled to WebAssembly / WebGPU) running Gemma 3 270M-instruct Q8_0 GGUF
- **Validation:** `zod` schemas (`src/lib/schema.js`) check every model response before it touches the sheet
- **Storage:** `localStorage` only — quotes, business profile, rate library all on-device
- **PDF export:** the browser's native print dialog
- **Deploy:** Render static site, auto-deploys on push

## Honest limits

Stated plainly, same as in the DEV write-up:

- The 270M model has specific, repeatable failure modes documented in [`docs/RISKS.md`](./docs/RISKS.md) and the 20-transcript table in the DEV post — "Callout" line leaks (filtered in `src/lib/filterHallucinations.js`), fragmented line items, occasional verbatim echo of unrelated training examples.
- JSON-schema grammar guarantees valid tokens; it doesn't guarantee semantically correct content. That's what the "estimated → tap to confirm" UI is there for.
- Voice input needs Chrome or a Chromium-based browser (Web Speech API support is patchy on Safari/Firefox).

## Contributing

Issues and PRs welcome. The repo has a full planning trail:

- [`docs/PLAN.md`](./docs/PLAN.md) — scope, day-by-day plan, decisions log
- [`docs/RISKS.md`](./docs/RISKS.md) — risk register with mitigations and known model failure rows
- [`test/transcripts.md`](./test/transcripts.md) — the 20-transcript regression set

**Guideline:** keep the "nothing uploaded" invariant honest. New features must not add server-side calls. The model is a file, not a service.

## Acknowledgements

- **[Gemma 3 270M](https://huggingface.co/google/gemma-3-270m-it)** by Google — small enough to ship as a file.
- **[wllama](https://github.com/ngxson/wllama)** — llama.cpp in your browser.
- **[Render](https://render.com)** — static hosting, zero config.
- **The Hacktoberfest Open-Source AI Challenge** — the forcing function.

## License

[MIT](./LICENSE).

---

<p align="center">
  <sub><em>crafted by <a href="https://github.com/ibrahim-iqbal">ibrahim-iqbal</a> · <a href="https://dev.to/ibrahimiqbal">dev.to</a></em></sub>
</p>
