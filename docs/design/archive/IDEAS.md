# HF26 Week 2 — "Side Hustle" — Idea Brainstorm

**Challenge:** Hacktoberfest Open-Source AI Challenge, Week 2
**Theme:** "Side Hustle" — open-source AI at the core (open-weight model / OSS agent framework / local inference), solving a **small, specific, useful problem for a real person who would pay for it**. DEV post must explain why open innovation matters for the build.
**Deadline:** Oct 18, 2026 (winners announced week of Oct 19)
**Judging (in weight order):** Writing quality (heaviest) → relevance to theme → creativity → technical execution → partner tech (optional: Render, TabPFN, …)
**Submission:** DEV post with `devchallenge` + `hf26challenge` tags, via the submission template.

## Scoring rubric used below
Each idea scored 1–5 on: **Persona** (is there one real person with a wallet?), **Pain** (do they feel it weekly?), **Story** (does "open weights / local inference" genuinely matter, or is it bolted on?), **Ship** (buildable solo in ~4 days with pristine UI?), **Fresh** (will judges have seen 10 of these?).

---

## 1. 🥇 HushQuote — voice note → professional quote/invoice (CHOSEN)
Freelancer or tradesperson rambles a voice note — "tiled the Hendersons' bathroom, 40 square meters, materials were about 300, two days labor" — and a **local, in-browser open-weight model** turns it into a structured, itemized, editable quote with their saved rates, then a branded PDF.

- **Persona 5/5** — plumber, electrician, freelance designer, wedding photographer. They literally get paid via this document. Invoicing SaaS charges $10–30/mo for worse.
- **Pain 5/5** — quoting is the most-hated admin task in every freelancer survey; slow quotes lose jobs.
- **Story 5/5** — your client names, addresses, and your *rates* (competitive info) never leave the device. Local inference isn't a gimmick here; it's the feature. Works offline in a van with no signal.
- **Ship 4/5** — React+Vite PWA (same stack as touch-grass), model via WebLLM/wllama (we already solved COOP/COEP + WASM threading in Week 1), pdf-lib for client-side PDF. Known territory.
- **Fresh 4/5** — "AI invoice" exists as SaaS; **fully-local, zero-backend, works-offline** version is the twist.

## 2. Receipt snap → Schedule-C expense ledger
Photo a receipt, local VLM/OCR + LLM categorizes it for side-hustle taxes.
- Persona 5, Pain 5, Story 5 (financial privacy), **Ship 2** — browser OCR/VLM quality in 4 days is a gamble; a flaky demo kills "technical execution". **Rejected on risk.**

## 3. Voice note → polished client status update
Freelancer rambles; model writes the client-ready update email + changelog.
- Persona 4, Pain 3, Story 4, Ship 5, **Fresh 2** — "AI writes my email" is the most-seen demo in any challenge. **Rejected on freshness.**

## 4. Etsy/marketplace listing optimizer
Describe product → title/tags/description in seller's voice.
- Persona 4, Pain 3, Story 3, Ship 4, **Fresh 1** — saturated. **Rejected.**

## 5. Local-first micro-CRM with follow-up drafting
Side hustlers lose repeat work by forgetting follow-ups; on-device model drafts them from job notes.
- Persona 4, Pain 4, Story 4, Ship 3 (CRM = lots of UI surface, hard to make pristine in 4 days), Fresh 3. **Runner-up; too much surface area.**

## 6. Home-baker menu & cost calculator
Describe bakes → priced menu page + ingredient cost math.
- Persona 3, Pain 2 ("would pay" weak), Story 2, Ship 4, Fresh 4. **Rejected on pain.**

---

## Decision
**Build #1 — HushQuote.** Highest combined score, strongest "why open source matters" narrative, reuses Week-1 hard-won local-LLM-in-browser experience, and the demo moment (speak → watch a real quote assemble itself → download PDF) is visceral for judges.

See `PLAN.md` for scope and milestones, `UI.md` for the design contract.
