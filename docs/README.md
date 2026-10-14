# Docs index

What's in here, and which file answers which question.

| File | Answers |
|---|---|
| [`PLAN.md`](PLAN.md) | What shipped, in what order, and why — the day-by-day decisions log. Start here for "why does X work this way." |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Data shapes (zod schemas), model lifecycle, the parse ladder (extract → validate → repair → surrender), failure modes, feasibility numbers. |
| [`UI.md`](UI.md) | The design contract — tokens, layout, motion rules, copy rules. A UI change that violates this file is a bug. |
| [`RISKS.md`](RISKS.md) | Known extraction-accuracy limits of the 270M model, with a full 20-transcript test sweep (not just happy-path runs) and the mitigation ladder for each risk. |
| [`DEV_POST.md`](DEV_POST.md) | Source of truth for the DEV.to submission post ([published](https://dev.to/ibrahimiqbal/hushquote-quotes-that-stay-yours-3ldl)) — keep this in sync if the post is edited directly on DEV. |
| [`HANDOFF.md`](HANDOFF.md) | Original kickoff brief (mission, day plan, read order) from before D1. Historical — `PLAN.md` is current. |
| [`design/`](design/) | Design assets: the cover gradient, the two live spec mockups (`mockup-v5-splash.html`, `mockup-v6-responsive.html`), screenshots and the demo GIF used in the README and the DEV post, and `archive/` (superseded mockups and the original idea-scoring doc — kept for history, not binding). |

## Quick orientation

- New to the project? Read the top-level [`README.md`](../README.md) first, then `PLAN.md`.
- Changing UI? Read `UI.md` before touching `src/components/` or `src/index.css`.
- Changing the extraction/model pipeline? Read `ARCHITECTURE.md` (data shapes + parse ladder) and `RISKS.md` (what's already known to fail and why).
- Editing the DEV.to post? Edit `DEV_POST.md` here first, then push the same change through the DEV editor (or the DevRelay `update_article` API) so the two stay in sync.
