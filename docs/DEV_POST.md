<!--
D5. PUBLISHED at https://dev.to/ibrahimiqbal/hushquote-quotes-that-stay-yours-3ldl
(article id 4848352). Images are hosted on GitHub raw (not DEV's own
upload bucket - that one silently dropped a file mid-session, GitHub
raw is the durable source of truth; DEV rehosts its own CDN copy on
ingest regardless). Optional: publish the DevRelay agent session and
link it below if desired. Keep this file in sync with the live post.

D6: synced after shipping the Callout-leak filter (src/lib/filterHallucinations.js)
and adding the two recovery-flow screenshots (04/05-remove-*.jpg).
-->

# HushQuote: quotes that stay yours

*This is a submission for the [Hacktoberfest Open-Source AI Challenge: Week 2 - Side Hustle](https://dev.to/events/challenges/hacktoberfest-week2-2026-10-12)*

**What I Built:** HushQuote. Speak a job description, get an itemized, editable quote - then a PDF. A small open-weight model (Gemma 3 270M) runs entirely inside the browser tab, on WebGPU when it's there and WASM when it isn't. No account, no server, no install. The client's name and the day rate never leave the device they were typed on.

![Real job typed in, the model extracts it, one line confirmed, client named - all on the live deploy](https://raw.githubusercontent.com/ibrahim-iqbal/hushquote/main/docs/design/post-screenshots/hushquote-demo.gif?v=2)

Try your own phrasing, not just the demo's. If a line shows up that you never said, that's a known model quirk documented below, not a broken app - tap the × to drop it; totals recompute instantly either way.

## The problem

Every tradesperson I know who works for themselves does the same thing after a job: sits in the van, opens a notes app or a half-remembered Excel template, and tries to turn "forty square meters, two days, plus materials" into something a client will actually pay against. Then they either forget a line, round a number wrong, or just don't send the quote for three days because writing it feels like a second job.

The invoicing SaaS market solved this with a $15/month subscription and an account you have to make, for software that's worse at the one job that actually matters: turning what you just said out loud into a document. That's the gap HushQuote is built for - it's cheap enough to be a real side-hustle tool, not a line item.

![Cover page - model downloading, then the lock-open reveal](https://raw.githubusercontent.com/ibrahim-iqbal/hushquote/main/docs/design/post-screenshots/01-cover.jpg)

## What I built

The whole app is one living document, not a wizard:

1. **The Margin** - a rail on the side holding your raw words in monospace, dictation-tape style.
2. **The Sheet** - an always-visible, real quote document. Line items typeset directly onto it as the model reads your words.
3. **The Command Bar** - mic or textarea, one submit button, nothing else.

Say or type the job. The model reads it into structured line items - description, quantity, unit, rate - and they land on the sheet looking exactly like what you'd hand a client, except every model-sourced line is visually provisional: a dashed border and an "Estimated. Yours to set." label, until you tap to confirm it. Math is never done by the model; totals are always computed in plain JavaScript from whatever's actually on the sheet.

![The Sheet mid-extraction - confirmed and still-estimated lines side by side](https://raw.githubusercontent.com/ibrahim-iqbal/hushquote/main/docs/design/post-screenshots/02-sheet-extraction.jpg)

A Dashboard sits in front of the Sheet once you have more than one quote going: every saved quote in one list, with stat cards for quote count, total quoted value, and how many lines across all your drafts are still sitting on a model's estimate instead of your own number.

![Dashboard - quote count, quoted value, and lines still needing a rate, with an illustrated empty state](https://raw.githubusercontent.com/ibrahim-iqbal/hushquote/main/docs/design/post-screenshots/03-dashboard.jpg)

## How I built it

**Stack, at a glance:**
- **Runtime:** React 19 + Vite, deployed as a static site on Render - no backend, no database, nothing running server-side at all
- **Model:** Gemma 3 270M-instruct (Q8_0 GGUF), via `wllama` (llama.cpp compiled to WebAssembly/WebGPU), downloaded once into the browser tab
- **Validation:** zod schemas (`src/lib/schema.js`) checking every model response before it reaches the sheet
- **Storage:** `localStorage` only - quotes, business profile, and rate library never leave the device
- **PDF export:** the browser's native print dialog, no added dependency

### The model only extracts. The app decides what's true.

That's the one sentence that governs every design choice here. A 270-million-parameter model is small enough to ship as a file instead of a service, but it is also small enough to be wrong in specific, repeatable ways - so nothing it says is trusted until code checks it.

![Flow: mic or text input through Gemma 3 270M, JSON-schema validation, one repair retry, and either a confirmed sheet line or a fallback to manual mode](https://raw.githubusercontent.com/ibrahim-iqbal/hushquote/main/docs/design/post-screenshots/extraction-flow.png)

Concretely:

- **Structured output, not a hopeful prompt.** `wllama`'s `createChatCompletion` supports OAI-compatible `response_format: {type:'json_schema'}` natively - the model is sampling against a grammar that only lets valid tokens through, not just being asked nicely for JSON.
- **Everything still gets zod-validated.** A grammar guarantees the braces close; it says nothing about whether the content inside them is right. Every response goes through a real schema check before it touches the sheet.
- **One repair generation, then honest surrender.** If the first response fails validation, the model gets one more try with the exact error attached. If that fails too, the app does *not* guess - it drops back to manual mode and the user types the line themselves. A bad extraction costs a few seconds, never a wrong number going out silently.
- **The model never sees or touches the totals.** Subtotal, tax, and total are pure functions over whatever line items are actually on the sheet (`src/lib/totals.js`) - they recompute instantly on every edit, independent of what the model ever said.

### What I got wrong, and how I know

I ran all 20 of my own test transcripts (`test/transcripts.md`) through the real pipeline rather than trusting the two I'd eyeballed early on, and the results were worse, and more specific, than I expected.

| # | Job | What happened |
|---|-----|----------------|
| 1, 3 | Bathroom tiling (clean / with correction) | Correct |
| 6, 16 | Garden cleanup / fence staining with a price correction | Mostly correct - 16 even picked up the corrected rate, not the original |
| 2, 7, 13 | Logo package / tap repair / photography | Real job fragmented into 2-3 duplicate lines, flat fees landed in the wrong field |
| 4, 8, 10, 11, 12, 18, 19 | Fence, deck rebuild, painting, electrical, Chen deck, gutter cleaning, drywall | Right-ish first item, **plus a fabricated "Callout" line that doesn't exist anywhere in the transcript** |
| 5, 17 | Lawn+hedges / dog walking | Right item count, duplicated 2-5x, wrong units |
| **9, 14** | **Blog posts / callout+valve** | **Model ignored the real transcript and echoed an unrelated internal example almost word for word** |
| **20** | **"Just an inspection, no numbers"** | **Model invented a fully priced fake quote for a job that explicitly had no numbers in it** |

That "Callout" line showing up in 10 of 18 fresh runs turned out to be my own few-shot example leaking into unrelated outputs - not a rate-library bug, confirmed by clearing the rate library mid-test and watching it persist. Transcript 20 is the one that actually matters: a model inventing prices for a job the user described as having none is exactly the failure "the LLM extracts, the app calculates" exists to make survivable, but a quote that reaches the pending-chip UI with a confidently wrong number on it is still a UX cost, even if it's a recoverable one.

I tried the obvious fix - dropping the few-shot example entirely and relying on the JSON schema alone. It killed both of the worst cases, but introduced a new one (the model wrote the literal string `"${1}"` as a description on every line). Not a clean win either way, so I shipped the known, documented behavior instead of an unproven swap days before the deadline. Full writeup, including a confirmed-separate truncation bug and its fix, is in `docs/RISKS.md`.

**Update, after publishing:** shipped the narrower fix instead. `src/lib/filterHallucinations.js` drops a model-output line when its description is a bare "callout" and the transcript never said any form of that word - the single leak that hit 10 of the 18 transcripts above. It's deliberately narrow: "Labor" leaks the same way sometimes, but "Labor" is correct far more often than it's a leak (transcript 1's "two days labor" needs that line to survive), so the same bare-word check there would trade a rare false positive for a common false negative. It does not touch the other two failure rows (9/14's verbatim echo, 20's fully invented quote) - those need the model to recognize it has no grounding at all, which a regex over one field can't do.

Here's the safety net those two unfixed rows still rely on, in case you hit either one: tap the × on a wrong line, the total recomputes immediately.

![Before: three pending lines, including one that's off, total $300](https://raw.githubusercontent.com/ibrahim-iqbal/hushquote/main/docs/design/post-screenshots/04-remove-before.jpg)
![After: the bad line removed with one tap, total recomputes to $0](https://raw.githubusercontent.com/ibrahim-iqbal/hushquote/main/docs/design/post-screenshots/05-remove-after.jpg)

## Why open innovation matters here

- **The model is a file the app ships, not a service you rent.** No API key, no per-request bill, no vendor who can change pricing under you. The entire cost of running this for a thousand quotes is the same as running it for one.
- **Client names and day rates never leave the device.** A plumber's client list is exactly the kind of data a side-hustle tool shouldn't be phoning home with, and "trust us" isn't verifiable the way "look, no network tab activity" is.
- **It works with no signal.** A job site with no wifi and bad cell coverage is a normal Tuesday for a tradesperson. Closed APIs don't work there. This does.
- **Running it myself, honestly, instead of hiding the rough edges**, is also the open-source story: the 20-transcript table above exists because I could actually inspect why the model did what it did, and the fixes I made (schema validation, the repair step, the token-budget bump, and now the Callout filter) are fixes to *my own code*, not a support ticket to a vendor.

## How this is different from the other Side Hustle freelance tools

A few other Week 2 submissions land in the same space - invoice and receipt sorters for freelancers. The closest ones (InvoicePilot AI, VaultLedger AI, FreelanceAI) are all built the same way under the hood: Ollama or a Python backend the user has to install and run alongside the app. That's "local" in the sense that your data doesn't leave your machine, but it's not "no install" - you're still standing up a server process first.

The one submission actually in the same product category - turning a messy brief into a priced estimate, not sorting receipts - is [ScopeCraft](https://dev.to/harshalranjhani/scopecraft-a-clearer-scope-a-fairer-quote-and-a-model-you-can-own-2cla), a genuinely good build around Qwen3-0.6B. Even it runs a small Node HTTP server locally to serve inference. HushQuote has no server step at all, local or otherwise.

HushQuote has no backend at all, not even a local one. It's a static site. The model downloads into the browser tab itself and runs there via WebAssembly/WebGPU. Close the tab, and there's nothing left running on your machine to manage. That's a stronger version of the same privacy pitch, and it's the actual reason this is a PWA instead of a desktop app.

## Prize Categories

- **Best Use of Gemma** - Gemma 3 270M-instruct is the only model HushQuote ships, and it's the entire extraction pipeline: every line item on the sheet exists because this model read the transcript, not a cloud call standing in for it.
- **Best Use of Render** - the live deploy (`hushquote.onrender.com`) is a Render static site, auto-deploying on every push to `main` with no build server of my own to maintain.

## What's next

- The deterministic regex co-extraction pass flagged in `docs/RISKS.md` as the next real lever on the two still-unfixed failure rows (verbatim echo, invented-quote), if there's time.
- Finding an actual tradesperson to hand this to and reporting back what they asked for next - the challenge's bonus round, not done yet at time of writing.

## Try it

- **Live:** https://hushquote.onrender.com
- **Code:** https://github.com/ibrahim-iqbal/hushquote
- **Full build log / decisions / bugs found:** `docs/PLAN.md` and `docs/RISKS.md` in the repo - the honest version of this post, day by day.
