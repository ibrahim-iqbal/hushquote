// Targeted mitigation for docs/RISKS.md R3's single most common failure
// mode: the FEW_SHOT example's literal "Callout" line (src/lib/prompt.js)
// leaking into outputs for transcripts that never mentioned a callout at
// all. Measured in the D4 sweep (docs/RISKS.md R3) at 10 of 18 fresh runs.
//
// Deliberately narrow: only drops an item whose description is a bare
// "callout" / "call out" / "call-out" when the raw transcript contains no
// such word anywhere. Does NOT touch "Labor" (the few-shot's other
// anchor-prone item) or any other description - those are legitimate
// content far more often than they're a leak (transcript 1's correct "two
// days labor" has no literal word "callout" to key off, but filtering
// "Labor" the same way would risk dropping real lines whenever the user's
// phrasing omits the word itself, e.g. "two days" alone). "Callout" is
// close to a free word in natural job descriptions - the false-positive
// risk of this filter is low where the false-negative risk of extending it
// to "Labor" would not be.
//
// This does not fix the other two leak shapes RISKS.md documents
// (transcripts 9/14's full verbatim echo, transcript 20's fully invented
// quote on a no-numbers job) - those need the model to recognize it has no
// grounding at all, which a post-hoc regex over one field can't do. Logged
// honestly, not oversold.

const CALLOUT_PATTERN = /\bcall[\s-]?out\b/i

/**
 * @param {{d:string, q:number, u:string, r?:number}[]} items - raw model
 *   output items, before mapModelOutputToItems.
 * @param {string} transcript - the user's original text, unmodified.
 * @returns {object[]} items with any bogus bare "callout" line removed.
 */
export function filterCalloutLeak(items, transcript) {
  if (CALLOUT_PATTERN.test(transcript)) return items
  return items.filter((item) => !CALLOUT_PATTERN.test(item.d || ''))
}
