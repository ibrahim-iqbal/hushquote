// Self-check for src/lib/filterHallucinations.js. No framework, no new
// dependency - run directly with `node test/filterHallucinations.check.mjs`.
// Covers the real failure mode from docs/RISKS.md R3's D4 sweep: a bare
// "Callout" line leaking from the FEW_SHOT example into transcripts that
// never mentioned one, and the two cases a bare-word filter must not
// touch (a real callout, and "Labor" - out of scope by design).

import assert from 'node:assert/strict'
import { filterCalloutLeak } from '../src/lib/filterHallucinations.js'

function run(name, fn) {
  try {
    fn()
    console.log(`ok - ${name}`)
  } catch (err) {
    console.error(`FAIL - ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

run('drops a bogus Callout line when the transcript never said it', () => {
  const items = [
    { d: 'Wall and floor tiling', q: 40, u: 'm2' },
    { d: 'Materials', q: 1, u: 'item', r: 200 },
    { d: 'Callout', q: 1, u: 'hour' },
  ]
  const transcript = 'Bathroom tiling, forty square meters, two days, plus materials at two hundred dollars'
  const result = filterCalloutLeak(items, transcript)
  assert.equal(result.length, 2)
  assert.ok(!result.some((i) => /call ?out/i.test(i.d)))
})

run('keeps a real callout line when the transcript actually says it', () => {
  const items = [
    { d: 'Materials', q: 1, u: 'item', r: 300 },
    { d: 'Callout', q: 1, u: 'hour' },
  ]
  const transcript = 'materials were 300, plus one hour of callout'
  const result = filterCalloutLeak(items, transcript)
  assert.equal(result.length, 2)
})

run('is case/spacing insensitive on both sides ("call out", "call-out")', () => {
  const items = [{ d: 'call-out', q: 1, u: 'hour' }]
  assert.equal(filterCalloutLeak(items, 'no mention of it').length, 0)
  assert.equal(filterCalloutLeak(items, 'plus a call out fee').length, 1)
})

run('never touches non-callout descriptions, by design', () => {
  const items = [
    { d: 'Labor', q: 2, u: 'day' },
    { d: 'Wall and floor tiling', q: 40, u: 'm2' },
  ]
  // Transcript says neither "labor" nor "callout" - Labor must survive;
  // extending this filter to Labor is explicitly out of scope, see the
  // module's own comment on why.
  const result = filterCalloutLeak(items, 'forty square meters, two days')
  assert.equal(result.length, 2)
})

if (process.exitCode) {
  console.error('\nSome checks failed.')
} else {
  console.log('\nAll filterCalloutLeak checks passed.')
}
