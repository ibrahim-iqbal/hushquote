// Prompt contract. See docs/ARCHITECTURE.md section 4.
//
// D2 findings (see docs/RISKS.md R3 and docs/PLAN.md Decisions log):
// 1. With two few-shot pairs, Gemma 3 270M echoed the LAST assistant
//    example almost verbatim regardless of the real final user turn.
//    Dropped to a single pair (ladder step 1) to remove the anchor.
// 2. With only one example demonstrating m2/item/day units, the model had
//    no in-context evidence that 'hour' is a valid unit and defaulted to
//    m2 for hour-based jobs. Fixed by giving the single remaining example
//    a wider, explicit unit vocabulary instead of adding a second exchange
//    (which would reopen finding 1).

const SYSTEM_PROMPT =
  "You extract quote line items from a tradesperson's job description. " +
  'Respond with ONLY minified JSON matching: {client?, items:[{d,q,u,r?}], notes?}. ' +
  'u is one of item, hour, day, m2, m, job. ' +
  'Do not invent prices you were not told; omit r instead. No markdown. ' +
  'Base your answer only on the text in the final user message below, not on the example.'

const FEW_SHOT = [
  {
    role: 'user',
    content:
      "Tiled the Hendersons' bathroom, about 40 square meters, materials were 300, two days labor at a day rate, plus one hour of callout.",
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      client: 'The Hendersons',
      items: [
        { d: 'Wall and floor tiling', q: 40, u: 'm2' },
        { d: 'Materials', q: 1, u: 'item', r: 300 },
        { d: 'Labor', q: 2, u: 'day' },
        { d: 'Callout', q: 1, u: 'hour' },
      ],
    }),
  },
]

/**
 * Builds the chat messages array for a single extraction call.
 * @param {string} transcript - the user's spoken/typed job description
 * @param {{label:string, unit:string, rate:number}[]} rateLibrary - user's saved rates
 */
export function buildMessages(transcript, rateLibrary = []) {
  let system = SYSTEM_PROMPT
  if (rateLibrary.length > 0) {
    const known = rateLibrary
      .map((r) => `${r.label} (${r.unit})`)
      .join(', ')
    system += ` Known services from this user's rate list, map matching phrasing to these: ${known}.`
  }

  return [
    { role: 'system', content: system },
    ...FEW_SHOT,
    { role: 'user', content: transcript },
  ]
}

export const GENERATION_PARAMS = {
  temperature: 0.2,
  max_tokens: 400,
}
