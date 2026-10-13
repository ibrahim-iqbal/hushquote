// ModelOutput -> LineItem[] mapping. See docs/ARCHITECTURE.md section 2.
// Rate resolution: the user's own saved rate library always wins over
// whatever the model guessed (source 'library', confirmed/solid in the UI).
// If no library match, the model's own rate (possibly absent) is used,
// marked source 'model' so the Sheet shows it as a pending estimate the
// user must confirm, per docs/UI.md rule 4.

import { makeId } from './id'
import { UNITS } from './schema'

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Cheap bidirectional-substring fuzzy match. No new dependency: a tiny
 * word-overlap check is enough to catch "tiling" vs "wall and floor tiling",
 * which is the realistic phrasing gap between what a user says and what
 * they named their saved rate.
 */
function findLibraryMatch(description, rateLibrary) {
  const words = new Set(normalize(description).split(' ').filter(Boolean))
  let best = null
  let bestScore = 0
  for (const rate of rateLibrary) {
    const rateWords = normalize(rate.label).split(' ').filter(Boolean)
    if (rateWords.length === 0) continue
    const overlap = rateWords.filter((w) => words.has(w)).length
    const score = overlap / rateWords.length
    if (score > bestScore && score >= 0.5) {
      bestScore = score
      best = rate
    }
  }
  return best
}

function clampQty(q) {
  const num = Number(q)
  return Number.isFinite(num) && num > 0 ? num : 1
}

function clampRate(r) {
  const num = Number(r)
  return Number.isFinite(num) && num >= 0 ? num : null
}

function safeUnit(u) {
  return UNITS.includes(u) ? u : 'item'
}

export function mapModelOutputToItems(modelOutput, rateLibrary = []) {
  return modelOutput.items.map((raw) => {
    const libraryMatch = findLibraryMatch(raw.d, rateLibrary)
    const rate = libraryMatch ? libraryMatch.rate : clampRate(raw.r)
    const source = libraryMatch ? 'library' : 'model'

    return {
      id: makeId('li'),
      description: raw.d || 'Line item',
      qty: clampQty(raw.q),
      unit: libraryMatch ? libraryMatch.unit : safeUnit(raw.u),
      rate,
      source,
    }
  })
}
