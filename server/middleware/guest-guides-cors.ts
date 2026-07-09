// CORS middleware for public guest guide endpoints
// Allows the guide-app (port 3001) and any other origin to fetch guides
// by token. Applies to all /api/guest-guides/* routes.

export default defineEventHandler((event) => {
  const url = event.path ?? event.node.req.url ?? ''

  // Only apply to guest-guides API routes
  if (!url.includes('/api/guest-guides/')) return

  // Allow any origin (these are public tokenized endpoints, no auth)
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
  setHeader(event, 'Access-Control-Max-Age', '86400')

  // Short-circuit preflight
  if (event.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    return ''
  }
})