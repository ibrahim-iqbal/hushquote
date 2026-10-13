// Tiny dependency-free id generator. Not cryptographic, just unique enough
// for line items and quotes inside one browser's localStorage.
export function makeId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}
