const startTime = Date.now()

Deno.serve(() =>
  Response.json({ status: 'ok', uptime: (Date.now() - startTime) / 1000 })
)
