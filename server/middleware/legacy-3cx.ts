export default defineEventHandler((event) => {
  const url = event.node.req.url || ''
  if (url.includes('pages/settings/integrations/3cx/callback')) {
    // Stub module — does nothing, but no longer 404s
    return new Response(
      'export default { setup() { return () => null } }',
      { status: 200, headers: { 'content-type': 'text/javascript' } }
    )
  }
})
