// Zod schemas: single source of truth for every data shape in HushQuote.
// See docs/ARCHITECTURE.md section 2.

import { z } from 'zod'

export const LineItem = z.object({
  id: z.string(),
  description: z.string().min(1),
  qty: z.number().positive(),
  unit: z.enum(['item', 'hour', 'day', 'm2', 'm', 'job']),
  rate: z.number().nonnegative().nullable(),
  source: z.enum(['model', 'user', 'library']),
})

export const Quote = z.object({
  id: z.string(),
  createdAt: z.number(),
  qNumber: z.string(),
  client: z.object({ name: z.string(), detail: z.string() }).partial(),
  items: z.array(LineItem).max(20),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(1).default(0),
  currency: z.string().default('USD'),
  // Totals are never stored. Always derived. See lib/totals.js
})

// What we ask the model for (Day 2). Short keys keep output token count down.
export const ModelOutput = z.object({
  client: z.string().optional(),
  items: z
    .array(
      z.object({
        d: z.string(),
        q: z.number(),
        u: z.string(),
        r: z.number().optional(),
      })
    )
    .max(12),
  notes: z.string().optional(),
})

export const BusinessProfile = z.object({
  name: z.string(),
  trade: z.string(),
  contact: z.string(),
  logoDataUrl: z.string().optional(),
  currency: z.string().default('USD'),
  taxRate: z.number().min(0).max(1).default(0),
})

export const RateItem = z.object({
  label: z.string(),
  unit: z.enum(['item', 'hour', 'day', 'm2', 'm', 'job']),
  rate: z.number().nonnegative(),
})

export const UNITS = ['item', 'hour', 'day', 'm2', 'm', 'job']
