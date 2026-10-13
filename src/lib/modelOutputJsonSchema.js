// Hand-written JSON Schema mirror of ModelOutput (src/lib/schema.js), used as
// wllama's response_format.json_schema for constrained decoding. wllama's
// chat completion supports response_format: { type: 'json_schema', json_schema }
// (OAI-compatible, see node_modules/@wllama/wllama/esm/types/oai-compat.d.ts),
// which is the grammar-equivalent mechanism docs/ARCHITECTURE.md section 4's
// 2h timebox was probing for. Found immediately, no separate GBNF needed, no
// extra dependency (hand-written instead of installing zod-to-json-schema
// for one small, stable shape) — see docs/PLAN.md Decisions log.
//
// Keep this in sync with the ModelOutput zod schema by hand; it is small and
// does not change often.

export const MODEL_OUTPUT_JSON_SCHEMA = {
  name: 'quote_extraction',
  schema: {
    type: 'object',
    properties: {
      client: { type: 'string' },
      items: {
        type: 'array',
        maxItems: 12,
        items: {
          type: 'object',
          properties: {
            d: { type: 'string', description: 'short line item description' },
            q: { type: 'number', description: 'quantity' },
            u: {
              type: 'string',
              enum: ['item', 'hour', 'day', 'm2', 'm', 'job'],
            },
            r: { type: 'number', description: 'rate, omit if not stated' },
          },
          required: ['d', 'q', 'u'],
        },
      },
      notes: { type: 'string' },
    },
    required: ['items'],
  },
  strict: false,
}
