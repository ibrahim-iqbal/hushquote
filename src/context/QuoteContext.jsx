import { createContext, useContext, useEffect, useReducer } from 'react'
import { Quote } from '../lib/schema'
import { makeId } from '../lib/id'
import { loadJSON, saveJSON, KEYS } from '../lib/storage'

// Reducer-level guardrail: Quote's zod schema (src/lib/schema.js) requires
// qty > 0, rate >= 0 (or null), and 0 <= taxRate <= 1. zod rejects the
// WHOLE saved object if any one field is out of range, so an out-of-bound
// value reaching here would silently wipe the entire quote on the next
// reload (loadJSON falls back to emptyQuote()), not just reset that field.
// The UI inputs (Sheet.jsx, SheetLineItem.jsx) already clamp at the source,
// but this is the single choke point every dispatch goes through, so it's
// the safer place to guarantee it, including for model-extracted items.
function clampLineItem(item) {
  const qty = Number(item.qty)
  const rate = item.rate == null ? null : Number(item.rate)
  return {
    ...item,
    // LineItem.description requires min length 1 too - EditableText lets
    // a user clear a description to '', which is the same failure class.
    description: item.description && item.description.trim() ? item.description : 'New line',
    qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
    rate: rate != null && Number.isFinite(rate) && rate >= 0 ? rate : null,
  }
}

function clampTaxRate(taxRate) {
  const num = Number(taxRate)
  return Number.isFinite(num) ? Math.min(1, Math.max(0, num)) : 0
}

function emptyQuote() {
  return {
    id: makeId('q'),
    createdAt: Date.now(),
    qNumber: 'Q-001',
    client: { name: '', detail: '' },
    items: [],
    notes: '',
    taxRate: 0,
    currency: 'USD',
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'QUOTE_LOADED':
      return action.quote

    case 'ITEM_ADDED': {
      const item = clampLineItem({
        id: makeId('li'),
        description: action.description ?? 'New line',
        qty: action.qty ?? 1,
        unit: action.unit ?? 'item',
        rate: action.rate ?? null,
        source: action.source ?? 'user',
      })
      return { ...state, items: [...state.items, item] }
    }

    case 'ITEM_EDITED': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? clampLineItem({ ...item, ...action.patch }) : item
        ),
      }
    }

    case 'ITEM_REMOVED':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) }

    case 'ITEM_CONFIRMED':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, source: 'user' } : item
        ),
      }

    case 'CLIENT_SET':
      return { ...state, client: { ...state.client, ...action.client } }

    case 'TAX_SET':
      return { ...state, taxRate: clampTaxRate(action.taxRate) }

    case 'RESET':
      return emptyQuote()

    default:
      return state
  }
}

const QuoteStateContext = createContext(null)
const QuoteDispatchContext = createContext(null)

export function QuoteProvider({ children }) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => loadJSON(KEYS.quote, Quote, emptyQuote())
  )

  useEffect(() => {
    saveJSON(KEYS.quote, state)
  }, [state])

  return (
    <QuoteStateContext.Provider value={state}>
      <QuoteDispatchContext.Provider value={dispatch}>
        {children}
      </QuoteDispatchContext.Provider>
    </QuoteStateContext.Provider>
  )
}

export function useQuote() {
  const ctx = useContext(QuoteStateContext)
  if (!ctx) throw new Error('useQuote must be used inside QuoteProvider')
  return ctx
}

export function useQuoteDispatch() {
  const ctx = useContext(QuoteDispatchContext)
  if (!ctx) throw new Error('useQuoteDispatch must be used inside QuoteProvider')
  return ctx
}

export { emptyQuote }
