# HushQuote

Speak a job, get a professional quote. A local open-weight model runs
entirely in your browser and turns a spoken (or typed) job description into
an itemized, editable quote, then a branded PDF. No account, no server. Your
clients and rates never leave your device.

Built for the [DEV Hacktoberfest Open-Source AI Challenge, Week 2](https://dev.to/events/challenges/hacktoberfest-week2-2026-10-12)
("Side Hustle"), targeting the Best Use of Gemma category.

## Status

Day 1 of a 5 day build. This snapshot ships the full UI shell and a working
manual quote builder (add/edit/delete line items, live totals, local
persistence). The local model (wllama + Gemma, in-browser extraction) lands
Day 2; until then the app runs in manual mode end to end, which is itself a
legitimate, fully usable product.

See `docs/PLAN.md` for the day-by-day plan and `docs/ARCHITECTURE.md` for how
the model integration will work.

## Why local AI

Tradespeople and freelancers already pay $10 to $30 a month for invoicing
software that is worse at this one job. HushQuote's model is a file the app
ships, not a service you rent: a small open-weight model doing one job well,
and because it runs on-device, a plumber's client list and day rates never
leave the plumber's phone. No API bill, no backend, works offline on a job
site with no signal.

## Stack

- React 19 + Vite + Tailwind v4
- Zod for all data shapes (`src/lib/schema.js`)
- Phosphor icons, self-hosted Geist / Geist Mono variable fonts
- wllama (in-browser llama.cpp via WebAssembly) for the local model, Day 2
- pdf-lib for client-side PDF export, Day 3
- No backend, no database, no accounts

## Design

The product is one living document, not a step wizard: a transcript rail
("the Margin") beside an always-visible quote document ("the Sheet"), with a
persistent command bar at the bottom. See `docs/UI.md` for the full design
contract, including the cover page, built from a gradient generated with
[FeralUI](https://feralui.dev/gradients).

## Development

```bash
npm install
npm run dev
```

## License

MIT, see `LICENSE`.
