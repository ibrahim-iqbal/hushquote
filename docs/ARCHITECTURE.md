# HushQuote — Flow & Architecture (feasibility-checked)

> Companion to PLAN.md (what/when) and UI.md (how it looks).
> This file answers: how the pieces connect, what the data shapes are, what can fail, and whether the numbers work.

## 0. Name
**HushQuote** — verified collision-free 2026-10-13 (no app/software/domain indexed under the name; "QuoteCraft" rejected: existing contractor tool + Capterra "QuotCraft"; "Quotewright" rejected: phonetically ≈ QuoteWerks, major quoting SaaS).

## 1. System diagram (everything client-side)

```
┌──────────────────────────────── Browser ────────────────────────────────┐
│                                                                         │
│  UI (React 19 + Tailwind v4)                                            │
│   Describe ──► Review ──► Send          ModelProvider (context)         │
│      │            ▲  │                   ├─ wllama V3 instance          │
│      │ text       │  │ Quote            ├─ status: idle→loading(p%)     │
│      ▼            │  ▼                   │          →ready→busy→error   │
│  extractQuote(text)  pdf-lib            └─ generate(prompt): string     │
│      │            │                                                     │
│      ▼            │                     Storage (localStorage, zod-     │
│  prompt builder   │                     validated on read)              │
│      │            │                      ├─ businessProfile             │
│      ▼            │                      ├─ rateLibrary[]               │
│  wllama.generate ─┘                      └─ savedQuotes[]               │
│      │                                                                  │
│      ▼                                                                  │
│  parse ladder: JSON.parse → fence-strip → repair-retry → manual mode    │
└─────────────────────────────────────────────────────────────────────────┘
   Model GGUF chunks: same-origin /models/ (270M)   HF CDN (1B, opt-in)
   Deploy: Render free static. NO server, NO API keys, NO accounts.
```

## 2. Data shapes (zod schemas — single source of truth in `src/lib/schema.ts`)

```ts
const LineItem = z.object({
  id: z.string(),                 // nanoid, app-generated — never model-generated
  description: z.string().min(1),
  qty: z.number().positive(),
  unit: z.enum(['item','hour','day','m2','m','job']),
  rate: z.number().nonnegative().nullable(), // null = model couldn't price it
  source: z.enum(['model','user','library']), // drives dashed-amber vs solid UI
});

const Quote = z.object({
  id: z.string(),
  createdAt: z.number(),
  client: z.object({ name: z.string(), detail: z.string() }).partial(),
  items: z.array(LineItem).max(20),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(1).default(0),
  currency: z.string().default('USD'),
});
// Totals are NEVER stored — always derived: subtotal/tax/total computed in
// selectors. (The invariant: LLM extracts, app calculates.)

const ModelOutput = z.object({          // what we ask the LLM for — smaller!
  client: z.string().optional(),
  items: z.array(z.object({
    d: z.string(),                      // short keys = fewer output tokens
    q: z.number(),
    u: z.string(),
    r: z.number().optional(),
  })).max(12),
  notes: z.string().optional(),
});

const BusinessProfile = z.object({
  name: z.string(), trade: z.string(), contact: z.string(),
  logoDataUrl: z.string().optional(), currency: z.string(), taxRate: z.number(),
});
const RateItem = z.object({ label: z.string(), unit: z.string(), rate: z.number() });
```

`ModelOutput → Quote` mapping (`src/lib/mapModelOutput.ts`): expand short keys, resolve `r` against rateLibrary fuzzy match (library wins over model guess → `source:'library'`), generate ids, clamp numbers.

## 3. Model lifecycle (ModelProvider)

```
idle ──user taps "Build quote" OR visits app 2nd time──► loading(progress)
loading ──chunks fetched+compiled──► ready
ready ──extractQuote()──► busy ──ok──► ready
busy ──parse ladder exhausted──► ready (UI falls to manual mode w/ raw text shown)
any ──wasm/oom/fetch error──► error (UI: manual mode + retry button)
```

- **Lazy load**: model does NOT download on first paint. Describe screen is instant; download starts on first "Build quote" tap (or via a "prepare offline" button). Judges see UI in <1s.
- wllama V3: `n_gpu_layers: 99` when WebGPU detected, else `0` (WASM). Progress callback drives the UI.md rule-3 human-worded progress bar.
- One generation at a time (busy flag); "Stop" button aborts.

## 4. Prompt contract (`src/lib/prompt.ts`)

System: "You extract quote line items from a tradesperson's job description. Respond with ONLY minified JSON matching: {client?, items:[{d,q,u,r?}], notes?}. u ∈ item|hour|day|m2|m|job. Do not invent prices you weren't told; omit r instead. No markdown."
+ 2 few-shot pairs (one trade job, one freelance/creative job) — few-shot matters more than instructions at 270M size.
+ User's rate library labels injected as "known services: tiling (m2), callout (job), …" so the model maps phrasing to the user's own catalog.

- `temperature: 0.2`, `max_tokens: 400`, stop at `}` balance.
- D2 timebox (2h): probe wllama sampling options for GBNF/JSON-schema grammar; if present, generate grammar from ModelOutput schema. If absent — ladder below suffices. **Do not sink more than 2h.**

## 5. Parse ladder (`src/lib/parseModelOutput.ts`)
1. `JSON.parse(text)` → zod `ModelOutput.safeParse`.
2. Strip code fences / leading prose / trailing junk (regex to first `{`..last `}`), retry 1.
3. One repair generation: feed back "Your output failed: <zod msg>. Reply with corrected JSON only." (counts against a single retry budget).
4. Surrender → Review screen opens in manual mode with the raw transcript pinned above an empty editable table, toast: "Couldn't auto-build this one — add lines below." **App never dead-ends.**

## 6. Feasibility numbers (checked 2026-10-13, verify D1/D2 on real hardware)
| Concern | Number | Verdict |
|---|---|---|
| 270M Q4 GGUF size | ~240–280 MB | OK for same-origin hosting in `/public/models/` on Render (100GB/mo free bandwidth; model fetched once, service-worker cached) |
| 1B Q4 GGUF size | ~700–800 MB | HF CDN only, opt-in "Smart mode"; warn user on size |
| Output budget | ModelOutput short-keys ≈ 120–250 tokens for 5–8 items | Deliberate — this is why keys are 1 char |
| WASM decode speed (270M, laptop) | ~10–30 tok/s → **8–25s per quote** | Acceptable WITH live-streaming UI (raw tokens visibly arriving = perceived progress). Unacceptable silently — UI.md rule 3 applies |
| WebGPU decode speed (270M) | 5–20× WASM → ~1–4s | The demo path; DEV post tells judges "Chrome/Edge recommended", with honest cross-browser table |
| 1B on WASM | likely <5 tok/s | Smart mode gated behind WebGPU detection; on WASM-only browsers it's hidden |
| Memory 270M | <1 GB total | Phones OK |
| **COOP/COEP trap** | Multi-thread WASM needs cross-origin isolation; with `COEP: require-corp`, cross-origin model fetches (HF CDN) need CORP/CORS cooperation; `credentialless` not in Safari | **Resolution: 270M self-hosted same-origin (no cross-origin issue); try single-thread first — if speed acceptable, skip isolation entirely (simplest). Only add COOP/COEP (via Render dashboard → Headers tab, NOT a `_headers` file) if multithread proves necessary on D2.** 1B/HF-CDN then inherits whichever mode works |
| Web Speech | Chrome/Edge/Safari(webkit) yes; Firefox no | Mic hidden on Firefox; disclosure copy per REVIEW M2 |

## 7. Screen ↔ state wiring
- Plain React: one `QuoteContext` (useReducer) for the active quote + `ModelProvider` + `useLocalStorage` hooks for profile/rates/saved. **No Redux/zustand — surface is 3 screens.**
- Describe: local `text` state; submit → `model.extract(text)` → dispatch `QUOTE_LOADED` → route `/review`.
- Review: dispatches `ITEM_EDITED | ITEM_ADDED | ITEM_REMOVED | ITEM_CONFIRMED` (confirm flips `source→'user'`, amber→ink per UI.md rule 4). Totals via `useMemo` selector.
- Send: `buildPdf(quote, profile)` (pdf-lib, ~150 lines, one A4 template) → blob URL → `<iframe>` preview + download. Print-stylesheet fallback behind try/catch.
- Routes: react-router, 3 routes + `/` landing = Describe. Back/forward just works; stepper reflects route.

## 8. Failure modes (each has a user-visible path)
| Failure | User sees |
|---|---|
| Model download fails/offline first run | "Couldn't fetch the brain — check connection. You can still build quotes by hand." → manual mode |
| WASM unsupported (ancient browser) | Same manual-mode banner, no retry spam |
| Parse ladder exhausted | Manual mode + raw transcript pinned (§5.4) |
| Mic permission denied | Inline hint under mic: "or just type below" (UI.md rule 9) |
| localStorage blocked (private mode) | App works per-session; quiet banner "saving is off in private browsing" |
| PDF generation throws | Print-stylesheet + window.print() fallback |

## 9. Submission checklist (D5)
- DEV post via template, tags `devchallenge` `hf26challenge`, **declare "Best Use of Gemma" category** (user-confirmed 2026-10-13).
- Include measured tok/s table (REVIEW m1), honest limitations section, "why open innovation" section (thesis in PLAN.md).
- Live link (Render) + GitHub repo (public, MIT).
