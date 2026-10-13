// localStorage persistence. Every read is zod-validated; a corrupted or
// private-browsing-blocked store never crashes the app, it just falls back
// to an empty/default value silently (banner handled by the caller).

const KEYS = {
  quote: 'hushquote.activeQuote.v1',
  profile: 'hushquote.businessProfile.v1',
  rates: 'hushquote.rateLibrary.v1',
}

function isStorageAvailable() {
  try {
    const testKey = '__hushquote_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export const storageAvailable = isStorageAvailable()

export function loadJSON(key, schema, fallback) {
  if (!storageAvailable) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    const result = schema.safeParse(parsed)
    return result.success ? result.data : fallback
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  if (!storageAvailable) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded or blocked mid-session; fail silently, same as read path
  }
}

export { KEYS }
