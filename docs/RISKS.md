# HushQuote — Risk Register & Mitigations

> Each risk: mitigation ladder (cheapest first), the D-day it gets verified, and the kill-switch if mitigation fails.
> Rule: every risk must die by its verify-day or its kill-switch activates. No risk rides to D5.

## R1 — WASM inference too slow (8–25s/quote on non-WebGPU browsers)
Mitigation ladder:
1. **WebGPU first** (wllama `n_gpu_layers:99` when `navigator.gpu` exists) — covers Chrome/Edge ≈ most judges. ~1–4s.
2. **Prefix KV-cache warm-up**: system prompt + few-shot (~400 tokens) prefilled ONCE at model-ready, reused per request (llama.cpp prompt caching). Saves several seconds of prefill on every single quote — biggest single win on WASM.
3. **Output token diet**: short-key schema (`{d,q,u,r}`), `max_tokens: 400`, item cap 12, omit-empty fields. Fewer tokens out = linear time saved.
4. **Progressive row materialization**: items stream as complete `{...}` objects — regex-match closed item objects in the partial stream, render each as a skeleton row flipping to real content. The 15s wait *looks* like work happening, not hang. (UI.md rule 3.)
5. **Thread tuning**: `navigator.hardwareConcurrency`-based thread count when crossOriginIsolated; single-thread otherwise.
6. **Quant check (D2)**: 270M at Q8 (~300MB) vs Q4 (~250MB) — Q4 quality loss is proportionally worse on tiny models; pick by measured extraction accuracy on the 20-transcript test set, not by size.
7. **Latency probe kill-switch**: measure first-token latency on the warm-up; if projected quote time >30s, proactively surface manual mode as primary with "AI assist is slow on this device" — never let a judge sit through a hang.
Verify: **D2** on 3 devices (M-series laptop, mid Android phone, Safari). Kill-switch: manual mode promotion (already built — it's the floor of the ladder).

## R2 — COOP/COEP cross-origin isolation vs model fetching
Reality check (downgrades the risk): under `COEP: require-corp`, cross-origin fetches ARE allowed when CORS-approved; HF CDN sends `Access-Control-Allow-Origin: *`, and wllama fetches with CORS mode. So isolation + HF CDN likely coexist. `[verify D2]`
Mitigation ladder:
1. **Try single-thread first** — no isolation needed at all, zero header config. If 270M single-thread speed clears the R1 bar on WebGPU devices (GPU does the work; threads matter mainly for WASM), ship it. Simplest thing that works.
2. **Self-host 270M same-origin** (`/public/models/`, chunked ≤512MB per wllama docs) — same-origin fetches are immune to COEP entirely. Render free tier: 100GB/mo bandwidth; 270M × ~300 judge loads ≈ 75GB worst case — fits, and service-worker caching cuts repeats. 1B stays on HF CDN (CORS path above).
3. **Headers via Render dashboard → Headers tab** (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`) — only if multithread measurably needed. NOT a `_headers` file (Netlify convention; Render ignores it).
4. **Last resort**: `coi-serviceworker` shim (injects isolation headers client-side) — known community workaround if dashboard headers misbehave.
Runtime guard: check `self.crossOriginIsolated` and pick thread count accordingly — app must work correctly in BOTH modes, headers become an optimization, never a dependency.
Verify: **D2**. Kill-switch: single-thread everywhere (slower but universal) + R1.7 probe.

## R3 — 270M extraction quality too poor (hallucinated items, mangled numbers)
Mitigation ladder:
1. Few-shot > instructions at this size — 2 worked examples in the prompt (one trades, one creative gig).
2. Rate-library grounding: inject user's known services so the model maps to existing labels instead of inventing.
3. **Deterministic co-extraction**: cheap regex pass for quantities+units ("40 sqm", "2 days", "$300") runs in parallel; numbers the model drops get offered as suggestion chips in Review. Model misses stop being data loss.
4. Zod + repair retry (ARCHITECTURE §5).
5. **20-transcript test set (write on D1, before integration)**: realistic voice-note transcripts incl. messy ones (ums, corrections, "actually make that 45"). Measured accuracy decides 270M-vs-1B-default and Q4-vs-Q8 with data, not vibes.
Verify: **D2 end**. Kill-switch: flip default to 1B-on-WebGPU / manual-first on WASM; the post honestly reports the tradeoff (good writing material, not a failure).

## R4 — Schedule (4 days, solo)
1. **UI-first with mock data (D1)** — the manual mode IS the mock; even if the model integration cratered entirely, a polished, working, honest quote builder ships. The floor is a submittable product.
2. **Deploy on D1, not D4** — Render service created with the first scaffold commit; every day ends with a live URL. No deploy-day surprises (Week 1's build-command/publish-dir dashboard gotcha is pre-known).
3. Scope gates already in PLAN.md non-goals; new rule: **any D2 model task overrunning its timebox gets parked behind manual mode, not extended.**
4. D5 is writing-only. Code freeze D4 night. The heaviest judging criterion gets protected time.

## R5 — Judge first-impression friction (nobody waits for a 250MB download)
1. Lazy load: app shell + manual mode usable in <1s; download only on "Build quote" or explicit "Prepare AI".
2. **30–45s screen-recording GIF/video at the top of the DEV post** — judges see the magic moment with zero install. The live link is for the convinced.
3. Example chips (UI.md rule 6) double as instant gratification: tapping one pre-fills a real transcript so there's something to do while the model downloads.
4. Download copy per UI.md rule 3: size + "one time, stays on your device" — turns the wait into the privacy pitch.

## R6 — Voice honesty (Chrome speech = Google cloud; Firefox = none)
Already resolved by design (REVIEW M2): textarea first-class, mic hidden on Firefox, in-app disclosure "voice transcription uses your browser's speech service — quote building is 100% local." The DEV post repeats it; nothing to verify, just don't regress it.

## Standing instruction
Any session that discovers a new risk: add it here with a ladder + verify-day + kill-switch, and note it in PLAN.md's Decisions log.
