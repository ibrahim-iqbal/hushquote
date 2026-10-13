import { createContext, useContext, useEffect, useReducer } from 'react'
import { Quote } from '../lib/schema'
import { makeId } from '../lib/id'
import { loadJSON, saveJSON, KEYS } from '../lib/storage'

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
      const item = {
        id: makeId('li'),
        description: action.description ?? 'New line',
        qty: action.qty ?? 1,
        unit: action.unit ?? 'item',
        rate: action.rate ?? null,
        source: action.source ?? 'user',
      }
      return { ...state, items: [...state.items, item] }
    }

    case 'ITEM_EDITED': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item
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
      return { ...state, taxRate: action.taxRate }

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
