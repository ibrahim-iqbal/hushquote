// Rate library. Mirrors ProfileContext's pattern. ModelContext reads this
// same storage key directly (loadJSON(KEYS.rates, ...)) when building a
// prompt, so no wiring is needed there - this context only serves the UI
// that lets a user maintain the list.

import { createContext, useContext, useEffect, useState } from 'react'
import { z } from 'zod'
import { RateItem } from '../lib/schema'
import { loadJSON, saveJSON, KEYS } from '../lib/storage'

const RatesContext = createContext(null)

export function RatesProvider({ children }) {
  const [rates, setRates] = useState(() =>
    loadJSON(KEYS.rates, z.array(RateItem), [])
  )

  useEffect(() => {
    saveJSON(KEYS.rates, rates)
  }, [rates])

  function addRate() {
    setRates((prev) => [...prev, { label: '', unit: 'item', rate: 0 }])
  }

  function updateRate(index, patch) {
    setRates((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function removeRate(index) {
    setRates((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <RatesContext.Provider value={{ rates, addRate, updateRate, removeRate }}>
      {children}
    </RatesContext.Provider>
  )
}

export function useRates() {
  const ctx = useContext(RatesContext)
  if (!ctx) throw new Error('useRates must be used inside RatesProvider')
  return ctx
}
