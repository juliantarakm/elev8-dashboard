import { defineEventHandler, readBody, createError } from 'h3'
import { matchQuery, resolveIntent, splitText } from '../utils/intents'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ messages: Array<{ role: string; content: string }> }>(event)
  if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'messages array required' })
  }

  const lastUser = [...body.messages].reverse().find(m => m.role === 'user')
  if (!lastUser?.content) {
    throw createError({ statusCode: 400, statusMessage: 'no user message found' })
  }

  const intent = matchQuery(lastUser.content)

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      if (!intent) {
        const fallbackText = "I can help with **reservations**, **cleaning**, **listings**, **occupancy**, and **revenue**.\n\n"
          + "Try: 'Show today's check-ins', 'Cleaning schedule today', or 'Revenue this month'."
        for (const chunk of splitText(fallbackText)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', delta: chunk })}\n\n`))
          await sleep(80)
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish' })}\n\n`))
        controller.close()
        return
      }

      // Pass the raw query text so resolvers like create_task can extract
      // details from it (e.g. "create task to fix pool" → task title).
      const resolved = resolveIntent({
        ...intent,
        // __queryText is a non-standard extension; resolvers can read it
        // via (intent as any).__queryText. Keeps Intent type clean.
        __queryText: lastUser.content,
      } as any)

      for (const toolCall of resolved.toolCalls) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'tool_call', toolName: toolCall.name, args: toolCall.args })}\n\n`,
        ))
        await sleep(150)
      }

      await sleep(250)

      for (const chunk of resolved.chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', delta: chunk })}\n\n`))
        await sleep(80)
      }

      // If the intent requires confirmation, emit the confirmation data
      // after the text so the UI can render the approval prompt.
      if (resolved.requiresConfirmation && resolved.confirmation) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'confirmation', data: resolved.confirmation })}\n\n`,
        ))
        await sleep(150)
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish' })}\n\n`))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Vercel-AI-Data-Stream': 'v1',
    },
  })
})

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}