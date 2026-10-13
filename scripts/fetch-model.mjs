// Downloads the Gemma GGUF into public/models/ if it isn't already there.
// Runs automatically before `npm run dev` and `npm run build` (see
// package.json "predev"/"prebuild"). The file is NOT committed to git
// (278MB, well over GitHub's 100MB hard limit) - this script is how both
// local development and Render's build step (npm install && npm run build)
// get it onto disk before Vite needs to serve it from public/.

import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODEL_URL =
  'https://huggingface.co/ggml-org/gemma-3-270m-it-GGUF/resolve/main/gemma-3-270m-it-Q8_0.gguf?download=true'
const OUT_DIR = path.join(__dirname, '..', 'public', 'models')
const OUT_FILE = path.join(OUT_DIR, 'gemma-3-270m-it-Q8_0.gguf')
const EXPECTED_MIN_BYTES = 250 * 1024 * 1024 // sanity floor; real file is ~292MB

async function main() {
  if (existsSync(OUT_FILE)) {
    console.log('[fetch-model] already present, skipping download')
    return
  }

  mkdirSync(OUT_DIR, { recursive: true })
  console.log(`[fetch-model] downloading ${MODEL_URL}`)

  const response = await fetch(MODEL_URL)
  if (!response.ok || !response.body) {
    throw new Error(`[fetch-model] download failed: HTTP ${response.status}`)
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(OUT_FILE))

  const { size } = await import('node:fs').then((fs) => fs.statSync(OUT_FILE))
  if (size < EXPECTED_MIN_BYTES) {
    throw new Error(`[fetch-model] downloaded file looks truncated (${size} bytes)`)
  }

  console.log(`[fetch-model] done, ${(size / (1024 * 1024)).toFixed(1)} MB`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
