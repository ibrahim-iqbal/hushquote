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
**D2 measured (1 device, WebGPU, M-series laptop):** 23.0-43.9 tok/s, full single-item extraction in 1.3-2s, well inside the "demo path" target. Multi-device (Android, Safari/WASM) measurement not done in D2 - logged as open for D4's cross-device table.
Verify: **D2** on 3 devices (M-series laptop, mid Android phone, Safari). Kill-switch: manual mode promotion (already built — it's the floor of the ladder).

## R2 — COOP/COEP cross-origin isolation vs model fetching
Reality check (downgrades the risk): under `COEP: require-corp`, cross-origin fetches ARE allowed when CORS-approved; HF CDN sends `Access-Control-Allow-Origin: *`, and wllama fetches with CORS mode. So isolation + HF CDN likely coexist. `[verify D2]`
Mitigation ladder:
1. **Try single-thread first** — no isolation needed at all, zero header config. If 270M single-thread speed clears the R1 bar on WebGPU devices (GPU does the work; threads matter mainly for WASM), ship it. Simplest thing that works.
2. **Self-host 270M same-origin** (`/public/models/`, chunked ≤512MB per wllama docs) — same-origin fetches are immune to COEP entirely. Render free tier: 100GB/mo bandwidth; 270M × ~300 judge loads ≈ 75GB worst case — fits, and service-worker caching cuts repeats. 1B stays on HF CDN (CORS path above).
3. **Headers via Render dashboard → Headers tab** (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`) — only if multithread measurably needed. NOT a `_headers` file (Netlify convention; Render ignores it).
4. **Last resort**: `coi-serviceworker` shim (injects isolation headers client-side) — known community workaround if dashboard headers misbehave.
Runtime guard: check `self.crossOriginIsolated` and pick thread count accordingly — app must work correctly in BOTH modes, headers become an optimization, never a dependency.
**D2 finding: this risk mostly evaporated.** wllama V3 auto-detects cross-origin isolation at runtime and switches its own single/multi-thread WASM build accordingly - no manual thread-count code, no COOP/COEP headers, no runtime guard was needed on the app's side. The library already does step 1 of this ladder internally. Confirmed working via the model loading and running correctly in dev (no COOP/COEP headers set).
Verify: **D2**. Kill-switch: single-thread everywhere (slower but universal) + R1.7 probe.

## R3 — 270M extraction quality too poor (hallucinated items, mangled numbers)
**D2 measured result (real hardware, WebGPU, 2026-10-13):** single-item jobs
extract correctly (description, qty, unit, rate all accurate). Multi-item
jobs degrade after the first item: units default wrong and/or line items
duplicate with hallucinated quantities. Two real, in-budget prompt fixes
were found and applied:
1. Two few-shot pairs caused a recency-anchoring failure (the model echoed
   the LAST example almost verbatim regardless of the real input, even
   when that input was nearly identical to the FIRST example). Fixed by
   dropping to one few-shot pair.
2. The one remaining example never demonstrated the `hour` unit, so the
   model had no in-context evidence it was a valid value and defaulted to
   `m2` for every hour-based job. Fixed by widening the single example's
   items to cover m2/item/day/hour instead of adding a second exchange
   (which would reopen finding 1).
After both fixes: first-item accuracy is reliable; 3+ item jobs still
produce 1-2 duplicate/wrong-unit lines beyond the first. This is treated as
a measured model-capability ceiling at 270M params, not a further prompt
bug - RISKS R4.3's "don't keep extending a timeboxed task" applies.
**This is the exact scenario the pending/estimated UI exists for**: every
model-sourced line renders dashed with an "Estimated. Yours to set." chip
and is independently removable/editable before being sent, so a bad
multi-item extraction costs the user a few taps of cleanup, never a wrong
quote going out silently. Verified live: removing a bad duplicate line
works correctly and totals recompute.

**D4 full 20-transcript sweep (docs/test/transcripts.md), all 20 run.**
This revises the D2 finding above - the problem is worse and more specific
than "3+ item jobs degrade." Full results per transcript:
- **1, 3**: already run D2, single-item/corrected-item - reliable.
- **2, 7, 13**: single real job hallucinated into 3 duplicate fragments; flat-fee amounts landed in `q` instead of `r` (logo package: q=450, r=0).
- **4, 8, 10, 11, 12, 18, 19**: real item(s) extracted with roughly right description, but qty/unit/rate garbled, AND a fabricated `Callout/1/hour` line appended that has no basis in the transcript - this is the FEW_SHOT example's 4th item leaking in, not a rate-library effect (confirmed by clearing the rate library mid-sweep and seeing it persist).
- **5, 17**: right item count in the ballpark but duplicated 2-5x with wrong units.
- **6, 16**: best results in the sweep - first item's description/qty/unit/rate came out correct (16 even got the corrected rate, 10 not 8), though extra garbage lines still followed.
- **9, 14**: **critical** - model ignored the real transcript entirely and echoed the FEW_SHOT example near-verbatim (Hendersons/Materials/Labor/Callout), including on transcript 14 which is literally about a callout fee and a valve. Confirms single-example anchoring (the D2 "fix" from two examples down to one) does not fully prevent anchoring - one example is still enough to hijack the output on some inputs.
- **20**: **critical** - "just an inspection, no numbers at all" (input designed to need zero extraction) produced a fully invented priced quote (Roof 40 m2, Materials 1 item @300, Labor 2 day, Callout 1 hour) - a direct violation of "never let the model invent prices," and again the FEW_SHOT example's numbers verbatim.

Tally: the FEW_SHOT example's content (description "Callout" or the whole
example) leaked into 10 of 18 freshly-run transcripts. This is now
understood as the dominant failure mode, not general small-model noise.

**D4 experiment (not shipped): dropped FEW_SHOT entirely, zero-shot with
only the JSON-schema constrained decoding (which already enforces field
names and the unit enum) and system prompt.** Retested the two critical
cases (9, 20) and one leak case (4):
- 9: no more verbatim echo, item count matched expected (4), but the `d`
  field came out as the literal string `"${1}"` on every line - a new,
  different corruption.
- 20: correctly surrendered to manual mode (null, no invented quote) -
  this IS the expected/safe behavior for this input.
- 14: surrendered to manual mode (hit the 400-token cap on both the
  initial and repair generation, so neither parsed) - safe but a miss.
- 4 (retest): no Callout leak, but duplicated the single real item 8x
  (worse count than the few-shot version's 2-4x) with the description
  broken to the literal string `"+"`.
Verdict: zero-shot trades the two worst failure modes (fabricated
unrelated content, invented prices on a no-data job) for a new, distinct
corruption (broken description field) and in one case worse duplication.
Not a clean win either way - **reverted to FEW_SHOT, not shipped**, so D4
ships the known, documented behavior rather than an unproven swap this
close to the deadline. Worth a real follow-up with more token budget to
properly A/B both prompts across all 20 before picking a default, and/or
testing whether the 1B model variant doesn't have this failure mode at all
(it has far more headroom to actually use the schema instead of pattern-
matching the nearest-looking example).

**D4 external research (dev.to/sharpenlee, "Why LLMs return invalid JSON -
a language model has no parser"):** independently confirms the mechanism
behind the zero-shot experiment's transcript 14/20 truncations above - a
model stream has no concept of "document complete," so `finish_reason:
length` mid-object is a real, common failure, and a repair pass that just
closes brackets on a truncated response produces syntactically valid but
fabricated JSON (the article's own worked example). Checked our parse
ladder (src/lib/parseModelOutput.js) against this: we don't do that -
`tryParse` only ever does a strict `JSON.parse` + zod validate, never
bracket-patches, so a truncated response is correctly rejected rather than
silently completed with invented values. The one gap it did expose:
`GENERATION_PARAMS.max_tokens` was 400, tight enough that at least one
transcript hit the cap on both the initial and repair generation and
never got a complete object either time. **Fixed**: bumped to 600
(src/lib/prompt.js) - cheap, no new code path, just gives the model room
to finish. Retested transcript 14: still fails, but via the FEW_SHOT
anchoring bug documented above, confirming the two failure modes are
independent and the token bump doesn't mask or regress the anchoring one.

Mitigation ladder:
1. Few-shot > instructions at this size - applied, see above. Superseded by the finding above: the single example itself is now the primary bug source, not a pure win.
2. Rate-library grounding: inject user's known services so the model maps to existing labels instead of inventing. Ruled out as the cause of the "Callout" leak (confirmed by clearing the library and still seeing it) - the real cause is FEW_SHOT, see above.
3. **Deterministic co-extraction**: cheap regex pass for quantities+units ("40 sqm", "2 days", "$300") runs in parallel; numbers the model drops get offered as suggestion chips in Review. Model misses stop being data loss. **Not implemented** - still the next cheapest lever, now more clearly justified given the leak rate above; parked for post-hackathon or if D4/D5 time remains.
7. **Post-publish: narrow "Callout" leak filter (D6)** - `src/lib/filterHallucinations.js`. A bare regex (`/\bcall[\s-]?out\b/i`) drops any model-output item whose description matches when the raw transcript contains no such word at all; keeps it otherwise. Deliberately scoped to "Callout" only, not "Labor" or any other few-shot item - "Labor" is legitimate content far more often than a leak (e.g. transcript 1's correct "two days labor"), so extending the same bare-word check there would trade a rare false positive for a much more common false negative. Verified: 4 self-check cases (`test/filterHallucinations.check.mjs`) plus a live re-run of this very ladder's reproduction case (a realistic rate-omitted phrasing, not literally one of the 20) - the fabricated Callout line no longer appears, the real Materials/Wall-tiling lines are untouched. Does **not** fix the other two leak shapes this risk documents: transcripts 9/14's full verbatim echo, or transcript 20's fully invented quote on a no-numbers job - those need the model to recognize it has no grounding at all, which a regex over one field can't do.
4. Zod + repair retry (ARCHITECTURE §5) - implemented. Helps on structural failures (transcript 14 zero-shot surrendered cleanly instead of emitting garbage) but does nothing for schema-valid-but-wrong content, which is most of the failures above.
5. ~~20-transcript test set, only 2 run~~ **done D4, see above.**
6. **max_tokens 400 to 600** - done D4, see research note above. Addresses truncation-driven surrender, not anchoring.
Verify: **D4 (this sweep)**. Kill-switch unchanged: flip default to 1B-on-WebGPU / manual-first on WASM; the post honestly reports the tradeoff (good writing material, not a failure) - this sweep's data makes that writeup stronger, not weaker: it is a defensible, measured limitation with a working floor (manual mode, pending-chip UI), not a hidden one.

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
