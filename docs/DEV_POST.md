<!--
D5 DRAFT. This is a markdown draft, not the final dev.to post.
Before publishing:
1. Record the demo video/GIF (marked [DEMO VIDEO HERE]) and upload it to dev.to directly - dev.to embeds video by drag-drop, this file can't do that.
2. Upload docs/design/post-screenshots/*.jpg into the dev.to editor at the marked spots (drag-drop into the post body - dev.to rehosts images, local paths don't work once published).
4. Decide whether to publish the DevRelay agent session (optional per the challenge rules) and link it where marked.
5. Read it out loud once per docs/UI.md's D4 polish gate copy rule before publishing.
-->

# HushQuote: quotes that stay yours

*This is a submission for the [Hacktoberfest Open-Source AI Challenge: Week 2 - Side Hustle](https://dev.to/devteam/join-the-hacktoberfest-open-source-ai-challenge-side-hustle-2550-in-prizes-across-18-winners-55ba)*

**What I Built:** HushQuote. Speak a job description, get an itemized, editable quote - then a PDF. A small open-weight model (Gemma 3 270M) runs entirely inside the browser tab, on WebGPU when it's there and WASM when it isn't. No account, no server, no install. The client's name and the day rate never leave the device they were typed on.

[DEMO VIDEO HERE - 30-45s, silent is fine, screen record: open app, say/type a job, watch it typeset onto the sheet, edit a line, download PDF]

## The problem

Every tradesperson I know who works for themselves does the same thing after a job: sits in the van, opens a notes app or a half-remembered Excel template, and tries to turn "forty square meters, two days, plus materials" into something a client will actually pay against. Then they either forget a line, round a number wrong, or just don't send the quote for three days because writing it feels like a second job.

The invoicing SaaS market solved this with a $15/month subscription and an account you have to make, for software that's worse at the one job that actually matters: turning what you just said out loud into a document. That's the gap HushQuote is built for - it's cheap enough to be a real side-hustle tool, not a line item.

![Cover page - model downloading, then the lock-open reveal](docs/design/post-screenshots/01-cover.jpg)

## What I built

The whole app is one living document, not a wizard:

1. **The Margin** - a rail on the side holding your raw words in monospace, dictation-tape style.
2. **The Sheet** - an always-visible, real quote document. Line items typeset directly onto it as the model reads your words.
3. **The Command Bar** - mic or textarea, one submit button, nothing else.

Say or type the job. The model reads it into structured line items - description, quantity, unit, rate - and they land on the sheet looking exactly like what you'd hand a client, except every model-sourced line is visually provisional: a dashed border and an "Estimated. Yours to set." label, until you tap to confirm it. Math is never done by the model; totals are always computed in plain JavaScript from whatever's actually on the sheet.

![The Sheet mid-extraction - two confirmed lines, two still marked estimated](docs/design/post-screenshots/02-sheet-extraction.jpg)

## How I built it

### The model only extracts. The app decides what's true.

That's the one sentence that governs every design choice here. A 270-million-parameter model is small enough to ship as a file instead of a service, but it is also small enough to be wrong in specific, repeatable ways - so nothing it says is trusted until code checks it.

```mermaid
flowchart LR
    A[Mic / text input] --> B[wllama + Gemma 3 270M<br/>WebGPU or WASM]
    B -->|JSON schema<br/>constrained decoding| C{zod validate}
    C -->|valid| D[Map to line items<br/>source: model]
    C -->|invalid| E[One repair generation]
    E --> F{zod validate}
    F -->|valid| D
    F -->|invalid| G[Surrender -<br/>manual mode]
    D --> H[Sheet: dashed,<br/>"Estimated. Yours to set."]
    H -->|user taps Confirm| I[Sheet: solid,<br/>source: user]
    H -->|user edits/removes| I
    style G fill:#C0392B,color:#fff
    style I fill:#2B4BD7,color:#fff
```

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

## Why open innovation matters here

- **The model is a file the app ships, not a service you rent.** No API key, no per-request bill, no vendor who can change pricing under you. The entire cost of running this for a thousand quotes is the same as running it for one.
- **Client names and day rates never leave the device.** A plumber's client list is exactly the kind of data a side-hustle tool shouldn't be phoning home with, and "trust us" isn't verifiable the way "look, no network tab activity" is.
- **It works with no signal.** A job site with no wifi and bad cell coverage is a normal Tuesday for a tradesperson. Closed APIs don't work there. This does.
- **Running it myself, honestly, instead of hiding the rough edges**, is also the open-source story: the 20-transcript table above exists because I could actually inspect why the model did what it did, and the fixes I made (schema validation, the repair step, the token-budget bump) are fixes to *my own code*, not a support ticket to a vendor.

## How this is different from the other Side Hustle freelance tools

A few other Week 2 submissions land in the same space - invoice and receipt sorters for freelancers. The closest ones (InvoicePilot AI, VaultLedger AI, FreelanceAI) are all built the same way under the hood: Ollama or a Python backend the user has to install and run alongside the app. That's "local" in the sense that your data doesn't leave your machine, but it's not "no install" - you're still standing up a server process first.

HushQuote has no backend at all, not even a local one. It's a static site. The model downloads into the browser tab itself and runs there via WebAssembly/WebGPU. Close the tab, and there's nothing left running on your machine to manage. That's a stronger version of the same privacy pitch, and it's the actual reason this is a PWA instead of a desktop app.

## What's next

- Deploying to Render (static site, `render.yaml` already in the repo) - this is also the "Best Use of Render" category, separate from "Best Use of Gemma," so it's worth finishing even though the app already works without it.
- The deterministic regex co-extraction pass flagged in `docs/RISKS.md` as the next real lever on accuracy, if there's time after this post.
- Finding an actual tradesperson to hand this to and reporting back what they asked for next - the challenge's bonus round, not done yet at time of writing.

## Try it

- **Live:** https://hushquote.onrender.com
- **Code:** https://github.com/ibrahim-iqbal/hushquote
- **Full build log / decisions / bugs found:** `docs/PLAN.md` and `docs/RISKS.md` in the repo - the honest version of this post, day by day.

#hf26challenge #gemma #webassembly #opensource
