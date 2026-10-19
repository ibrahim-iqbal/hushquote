// Real model lifecycle. See docs/ARCHITECTURE.md sections 3, 4, 5.
//
// Deviations from the original plan, logged here and in docs/PLAN.md:
// - Model is Gemma 3 270M-instruct Q8_0 (292MB), not Q4. ggml-org (the
//   canonical, wllama-tested publisher) only ships Q8_0 for this model;
//   no Q4 GGUF exists for it there. Q8 is higher quality and still
//   comfortably same-origin-hostable, so this is a straight upgrade, not
//   a compromise.
// - response_format: { type: 'json_schema' } (OAI-compatible, built into
//   wllama's createChatCompletion) is the constrained-decoding mechanism
//   the 2h GBNF-probe timebox in ARCHITECTURE section 4 was looking for.
//   Found immediately by reading wllama's type definitions; no GBNF
//   grammar needed on top, no extra dependency.
// - wllama auto-switches single/multi-thread WASM based on cross-origin
//   isolation at runtime; no manual thread-count or COOP/COEP logic was
//   needed for Day 2 (see docs/RISKS.md R2 ladder step 1 — it turned out
//   to not even require a decision).
// - Model loads eagerly on mount (driving the Cover Page's real progress
//   bar), not deferred to first "Build quote" tap. This matches the
//   approved Cover Page design (docs/UI.md "The Cover Page") exactly,
//   which supersedes the earlier "lazy load" note in this file's section 3.
// - No token-by-token streaming UI yet (docs/RISKS.md R1.4's "progressive
//   row materialization"). createChatCompletion is called non-streaming
//   for Day 2 so correctness and the parse ladder could be verified
//   first; streaming is a motion/perceived-progress polish layered on
//   top later, not a correctness requirement.

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Wllama } from '@wllama/wllama'
import { buildMessages, GENERATION_PARAMS } from '../lib/prompt'
import { MODEL_OUTPUT_JSON_SCHEMA } from '../lib/modelOutputJsonSchema'
import { tryParse } from '../lib/parseModelOutput'
import { mapModelOutputToItems } from '../lib/mapModelOutput'
import { filterCalloutLeak } from '../lib/filterHallucinations'
import { RateItem } from '../lib/schema'
import { loadJSON, KEYS } from '../lib/storage'
import { z } from 'zod'

const MODEL_URL = '/models/gemma-3-270m-it-Q8_0.gguf'
const WASM_PATHS = { default: '/wllama/wllama.wasm' }
const MODEL_SIZE_MB = 278 // actual downloaded file size, see docs/PLAN.md Decisions log

const ModelContext = createContext(null)

export function ModelProvider({ children }) {
  const [status, setStatus] = useState('idle') // idle | loading | ready | busy | error
  const [progress, setProgress] = useState(0) // 0..1
  const [downloadedMb, setDownloadedMb] = useState(0)
  const wllamaRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      try {
        const wllama = new Wllama(WASM_PATHS)
        wllamaRef.current = wllama
        const supportsWebGPU = wllama.isSupportWebGPU()

        await wllama.loadModelFromUrl(MODEL_URL, {
          n_gpu_layers: supportsWebGPU ? 99 : 0,
          useCache: true,
          progressCallback: ({ loaded, total }) => {
            if (cancelled) return
            setProgress(total > 0 ? loaded / total : 0)
            setDownloadedMb(Math.round(loaded / (1024 * 1024)))
          },
        })

        if (cancelled) return
        setProgress(1)
        setStatus('ready')
      } catch (err) {
        console.error('[model] failed to load', err)
        if (!cancelled) setStatus('error')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  function getRateLibrary() {
    return loadJSON(KEYS.rates, z.array(RateItem), [])
  }

  async function runCompletion(messages, signal) {
    const wllama = wllamaRef.current
    const startedAt = performance.now()
    const response = await wllama.createChatCompletion({
      messages,
      ...GENERATION_PARAMS,
      response_format: { type: 'json_schema', json_schema: MODEL_OUTPUT_JSON_SCHEMA },
      abortSignal: signal,
    })
    const elapsedS = (performance.now() - startedAt) / 1000
    const tokens = response.usage?.completion_tokens ?? 0
    if (tokens > 0) {
      // Measured-tok/s diagnostic for docs/RISKS.md R1 / docs/ARCHITECTURE.md
      // section 6's feasibility table. Not shippable UI copy; the real
      // cross-device table is assembled by hand on Day 4 from numbers like
      // this one, read out of the console on a few real devices.
      console.log(`[model] ${tokens} tokens in ${elapsedS.toFixed(2)}s = ${(tokens / elapsedS).toFixed(1)} tok/s`)
    }
    return response.choices?.[0]?.message?.content ?? ''
  }

  /**
   * Extract quote line items from free text. Returns an array of LineItem
   * (see src/lib/schema.js), or null if extraction could not be trusted —
   * the parse ladder's step 4 "surrender", which the caller treats as
   * "stay in manual mode for this submission" (see docs/ARCHITECTURE.md
   * section 5.4).
   */
  async function extractQuote(text) {
    if (status !== 'ready' || !wllamaRef.current) return null

    const rateLibrary = getRateLibrary()
    const controller = new AbortController()
    abortRef.current = controller
    setStatus('busy')

    try {
      const messages = buildMessages(text, rateLibrary)
      const raw = await runCompletion(messages, controller.signal)

      const first = tryParse(raw)
      if (first.ok) {
        const items = filterCalloutLeak(first.data.items, text)
        return mapModelOutputToItems({ ...first.data, items }, rateLibrary)
      }

      // Step 3: one repair generation, per docs/ARCHITECTURE.md section 5.
      const repairMessages = [
        ...messages,
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content: `Your output failed: ${first.issue}. Reply with corrected JSON only.`,
        },
      ]
      const repaired = await runCompletion(repairMessages, controller.signal)
      const second = tryParse(repaired)
      if (second.ok) {
        const items = filterCalloutLeak(second.data.items, text)
        return mapModelOutputToItems({ ...second.data, items }, rateLibrary)
      }

      return null
    } catch (err) {
      if (err?.name === 'WllamaAbortError' || err?.name === 'AbortError') {
        return null
      }
      console.error('[model] extraction failed', err)
      return null
    } finally {
      abortRef.current = null
      setStatus('ready')
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  const value = {
    status,
    progress,
    downloadedMb,
    totalMb: MODEL_SIZE_MB,
    extractQuote,
    stop,
  }

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
}

export function useModel() {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used inside ModelProvider')
  return ctx
}
