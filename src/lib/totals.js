// Totals are always derived from items, never stored, never touched by a model.
// "The LLM extracts, the app calculates."

export function lineAmount(item) {
  const rate = item.rate ?? 0
  return item.qty * rate
}

export function computeTotals(quote) {
  const subtotal = quote.items.reduce((sum, item) => sum + lineAmount(item), 0)
  const tax = subtotal * (quote.taxRate ?? 0)
  const total = subtotal + tax
  return { subtotal, tax, total }
}

export function formatMoney(amount, currency = 'USD') {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : ''
  return `${symbol}${amount.toFixed(2)}`
}

export function formatNumber(amount) {
  return amount.toFixed(2)
}
