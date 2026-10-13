# Senior Review — QuoteCraft plan (2026-10-13)

**Artifact reviewed:** PLAN.md / IDEAS.md / UI.md as written 2026-10-13 (frozen).
**Altitude diagnosis:** mixed — product altitude is right (persona, non-goals, judging-criteria mapping all present), but the model-runtime section was fog: "wllama primary / WebLLM enhancement" committed to a dual-stack without checking what either library ships today, and "strict JSON schema prompting" hand-waved the single hardest technical risk.

## Blockers

- **[B1] Dual-runtime stack (wllama + WebLLM) is obsolete and doubles integration work.**
  Evidence: [wllama GitHub README](https://github.com/ngxson/wllama) (fetched 2026-10-13) — "V3 is out, with WebGPU, multimodal and tool calling support"; runs WASM-SIMD with no GPU (`n_gpu_layers: 0`), same COOP/COEP requirement we already solved in Week 1.
  Fix: **wllama V3 only.** WebGPU when available, WASM fallback, one API, one model format (GGUF straight from Hugging Face). Delete WebLLM from the plan. (Independent corroboration that WebLLM needs MLC-format re-quantization and Safari-stable lacks WebGPU: [Intel in-browser LLM guide](https://www.intel.com/content/www/us/en/developer/articles/technical/web-developers-guide-to-in-browser-llms.html), [Transformers.js vs WebLLM](https://zenvanriel.com/ai-engineer-blog/transformers-js-vs-web-llm-which-is-faster/).)

- **[B2] "Strict JSON schema prompting" is not a plan — it's a hope.**
  Evidence: wllama README confirms tool-calling and an OpenAI-compatible API but does **not** document GBNF/JSON-schema constrained sampling `[unverified]`; underlying llama.cpp does support JSON-schema→GBNF conversion ([llama.cpp grammars README](https://huggingface.co/spaces/YZ-TAN/flask-llama/blob/main/llama.cpp/grammars/README.md?code=true)).
  Fix (defense in depth, in order): (1) try wllama sampling `grammar` option on D2 morning — timebox 2h; (2) regardless, parse with **zod** schema + a repair pass (strip fences, retry-once-with-error-fed-back); (3) the manual-mode ladder already guarantees a working app if extraction quality disappoints. The DEV post gets honest material either way.

## Major

- **[M1] Model choice should be pinned to Gemma, and not only for technical reasons.**
  Evidence: Week 2 partner categories include **"Best Use of Gemma" — $200 + badge** ("running it locally" explicitly listed as a qualifying use) — [challenge page](https://dev.to/events/challenges/hacktoberfest-week2-2026-10-12), fetched 2026-10-13. The plan already leaned Gemma; now it's strategic: one build competes for Overall **and** Best Use of Gemma.
  Fix: **Gemma 3 1B-instruct Q4 GGUF** primary (~700–800MB download — must verify exact quant size D1), **Gemma 3 270M** as the low-RAM/mobile fallback the UI offers when device memory is tight. Both from the official/ggml-org HF repos, loaded via HF CDN (no bandwidth cost to us). Declare the category in the submission.

- **[M2] Voice input was overweighted; Firefox has no Web Speech API by default.**
  Evidence: SpeechRecognition — Chrome/Edge/Safari (webkit-prefixed, 14.1+) yes; **Firefox behind a flag, "shipping soon" as of a Nov 2025 Mozilla/Google deck** — [testmuai support table](https://www.testmuai.com/learning-hub/speech-recognition-api-browser-support/), [AssemblyAI guide](https://www.assemblyai.com/blog/speech-recognition-javascript-web-speech-api), [Mozilla wiki](https://wiki.mozilla.org/Special:MobileDiff/1239804). Also: Chrome streams mic audio to Google's cloud — which **contradicts our "nothing leaves your device" headline** if we're sloppy.
  Fix: UI.md already makes textarea first-class — keep. Add honesty footnote in-app + post: "voice transcription uses your browser's speech service; the quote building is 100% local." Never claim mic audio is local. Feature-detect, hide mic on Firefox.

- **[M3] UI kit left unnamed ("custom CSS fine") — that's fog on a 1-day UI budget.**
  Fix, named: **Tailwind CSS v4** (tokens from UI.md as `@theme` variables) + **Radix UI primitives** only where a11y is hard (Dialog→the one allowed profile drawer, Toast). No shadcn/no component kit — the paper-document aesthetic in UI.md is bespoke and kits would fight it; Tailwind just makes the bespoke fast. Icons: **lucide-react** (tree-shaken). Fonts: self-hosted **Inter variable** via `@fontsource-variable/inter`.
  PDF: **pdf-lib** `[training-data, unverified]` — zero-dependency, pure client-side; `@react-pdf/renderer` rejected (heavier bundle, its own layout engine to learn). Verify maintained release on D1; fallback is print-stylesheet + `window.print()` which is also a legitimate "zero-dependency" story.

- **[M4] Deployment plan ignored the credits/categories landscape.**
  Facts gathered: Week 2 categories = Tinker ($200), Qualcomm, Arduino ($200), **DigitalOcean ($200)**, **Gemma ($200)**, Backboard ($100). Render is NOT a Week-2 category (was Week 1). MLH event offers API returned zero promo pools for Week 2. No partner free-credit offers found on the page.
  Fix: deploy static site on **Render free static tier** (pipeline already proven on touch-grass — remember: build command + publish dir must be set in the dashboard, not just render.yaml). Model files served from **Hugging Face CDN** (free, designed for GGUF). **Skip DigitalOcean** — chasing its category with a cloud deploy would dilute the local-first thesis that carries both the Overall and Gemma entries. One clean story beats two muddled ones.

## Minor

- **[m1]** D5 writing day is right (writing weighted heaviest) but the post should include a measured tokens/s table on 2–3 real devices — cheap to collect during D4 testing, huge credibility in judging.
- **[m2]** UI.md download copy says "280 MB" — placeholder; set real number after quant choice (1B Q4 is likely ~700MB; 270M ~250MB). Lying to users in microcopy fails its own rule 9.
- **[m3]** PLAN.md stack table said "Gemma 3 1B-instruct (or 270M fallback)" — now a user-facing choice ("Fast vs Smart" toggle), not a silent fallback; it demos better and handles low-RAM phones.

## What the junior got right (preserved)
- Persona/pain/pay mapping and the rejection reasoning in IDEAS.md — genuinely strong, no changes.
- "LLM extracts, app calculates" invariant — this is the correct division and a great line for the post.
- Degradation ladder ending in manual mode — app is never broken on any browser.
- UI.md as a binding contract with a measurable D4 gate — keep verbatim, one copy fix (m2).
- Budgeting a full day for the DEV post.

## Delta summary
- Dual runtime (wllama+WebLLM) → **wllama V3 alone** (WebGPU+WASM in one lib) [B1]
- JSON-by-prompting → **grammar-if-available + zod validate/repair + manual-mode floor** [B2]
- Model: Gemma pinned, **targets "Best Use of Gemma" $200 category**; 1B/270M becomes a user-facing Fast/Smart toggle [M1, m3]
- Voice demoted to enhancement w/ honest "browser speech service" disclosure; Firefox gets no mic, loses nothing [M2]
- UI stack named: **Tailwind v4 + Radix primitives + lucide-react + Inter variable + pdf-lib** [M3]
- Deploy: **Render static (free) + HF CDN for models**; DigitalOcean category consciously skipped to protect the thesis [M4]

## Open questions for the human
1. Product name "QuoteCraft" — taken by several SaaS products; ship under it anyway, or rename? (e.g. "FairQuote", "Quotable", "SpeakQuote" — your call, pure branding.)
2. Target the **Best Use of Gemma** category explicitly in the submission? (Recommended yes — zero extra work.)
3. 1B Q4 ≈ 700MB download on first use: acceptable for the demo, or lead with 270M by default and offer 1B as "Smart mode"? (Recommend: default 270M for instant-ish demo, judges are impatient.)
