// Parse ladder. See docs/ARCHITECTURE.md section 5.
// Step 1 (plain JSON.parse + zod) and step 2 (fence-strip retry) are pure
// and live here. Step 3 (one repair generation) needs the model, so it is
// orchestrated from ModelContext, which calls back into this module's
// tryParse for the repaired text.

import { ModelOutput } from './schema'

/**
 * Attempt to parse raw model text as ModelOutput.
 * @returns {{ok:true, data:object} | {ok:false, issue:string}}
 */
export function tryParse(raw) {
  // Step 1: direct parse.
  const direct = attemptJsonParse(raw)
  if (direct.ok) return direct

  // Step 2: strip code fences / leading-trailing junk, keep only the first
  // balanced-looking {...} span, retry once.
  const stripped = stripToJsonSpan(raw)
  if (stripped !== raw) {
    const retried = attemptJsonParse(stripped)
    if (retried.ok) return retried
  }

  return { ok: false, issue: direct.issue }
}

function attemptJsonParse(text) {
  let json
  try {
    json = JSON.parse(text)
  } catch (e) {
    return { ok: false, issue: `invalid JSON: ${e.message}` }
  }
  const result = ModelOutput.safeParse(json)
  if (!result.success) {
    return { ok: false, issue: result.error.issues.map((i) => i.message).join('; ') }
  }
  return { ok: true, data: result.data }
}

function stripToJsonSpan(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return text
  return text.slice(start, end + 1)
}
