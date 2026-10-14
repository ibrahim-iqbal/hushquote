// Manual theme override on top of the system-preference default (see
// index.css's prefers-color-scheme block). Persisted value is 'light' or
// 'dark'; no stored value means "follow the system," which is the
// original D4 behavior and stays the default until the user touches the
// toggle. The pre-paint apply also happens inline in index.html, to avoid
// a flash of the wrong theme before React mounts.
const KEY = 'hushquote.theme.v1'

export function getStoredTheme() {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function getEffectiveTheme() {
  const stored = getStoredTheme()
  if (stored) return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setTheme(theme) {
  try {
    window.localStorage.setItem(KEY, theme)
  } catch {
    // private browsing / quota - theme just won't persist, still applies for this session
  }
  document.documentElement.dataset.theme = theme
}
