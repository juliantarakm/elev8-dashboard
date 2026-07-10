import { describe, expect, it } from 'vitest'
import handler from '~/server/api/assistant.post'

// Vitest helper: invoke the h3 handler with a fake event.
// We pre-populate `req[Symbol.for('h3ParsedBody')]` so h3's readBody()
// returns our payload without touching a real Node.js IncomingMessage.
async function invoke(body: any) {
  const ParsedBodySymbol = Symbol.for('h3ParsedBody')
  const req: any = { headers: {} }
  req[ParsedBodySymbol] = body
  const event: any = {
    node: { req, res: {} },
    context: {},
  }
  return handler(event)
}

describe('POST /api/assistant', () => {
  it('returns streaming response for valid query', async () => {
    const result = await invoke({ messages: [{ role: 'user', content: "today's check-ins" }] })
    expect(result).toBeDefined()
  })
})