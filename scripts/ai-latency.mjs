#!/usr/bin/env node
// AI köməkçinin gecikməsini ölçür: JSON və axın (SSE) rejimində
// ilk tokenə qədər vaxt (TTFT) və ümumi vaxt.
//
//   node scripts/ai-latency.mjs                       # https://muslims.cc, hər rejim 1 dəfə
//   node scripts/ai-latency.mjs --url=http://127.0.0.1:3001 --runs=2 --lang=en
//   node scripts/ai-latency.mjs --mode=stream "Səbr haqqında hədis"
//
// Server dəqiqədə 10 sorğu buraxır — runs-u kiçik saxlayın.

const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
  const [k, v = 'true'] = a.slice(2).split('=')
  return [k, v]
}))
const question = process.argv.slice(2).find(a => !a.startsWith('--')) || 'Səbr haqqında bir hədis'
const base = (args.url || 'https://muslims.cc').replace(/\/$/, '')
const runs = Math.max(1, Math.min(4, Number(args.runs) || 1))
const lang = args.lang || 'az'
const modes = args.mode ? [args.mode] : ['json', 'stream']

const body = (stream) => JSON.stringify({
  message: question,
  history: [{ role: 'user', content: question }],
  lang,
  ...(stream ? { stream: true } : {}),
})

async function measure(mode) {
  const stream = mode === 'stream'
  const t0 = performance.now()
  const res = await fetch(`${base}/api/ask-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://muslims.cc',
      ...(stream ? { Accept: 'text/event-stream' } : {}),
    },
    body: body(stream),
  })
  const tHeaders = performance.now() - t0
  const ct = res.headers.get('content-type') || ''
  let ttft = 0
  let text = ''
  let error = ''
  if (stream && ct.includes('text/event-stream')) {
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let i
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim()
        buf = buf.slice(i + 1)
        if (!line.startsWith('data:')) continue
        try {
          const ev = JSON.parse(line.slice(5))
          if (ev.t) { if (!ttft) ttft = performance.now() - t0; text += ev.t }
          if (ev.error) error = `${ev.code}: ${ev.error}`
        } catch { /* yarımçıq sətir deyil — atla */ }
      }
    }
  } else {
    const raw = await res.text()
    ttft = performance.now() - t0
    try {
      const j = JSON.parse(raw)
      text = j.reply || ''
      if (!res.ok || j.error) error = `${res.status} ${j.code || ''} ${j.error || ''}`.trim()
    } catch { error = `${res.status} JSON deyil` }
    if (stream) mode += ' (server axını dəstəkləmir → JSON)'
  }
  const total = performance.now() - t0
  const f = (ms) => (ms / 1000).toFixed(2) + 's'
  console.log(`${mode.padEnd(8)} status=${res.status} başlıq=${f(tHeaders)} TTFT=${f(ttft)} ümumi=${f(total)} simvol=${text.length}${error ? '  XƏTA: ' + error : ''}`)
}

console.log(`→ ${base}/api/ask-ai  lang=${lang}  sual="${question}"`)
for (let r = 0; r < runs; r++) {
  for (const m of modes) {
    try { await measure(m) } catch (e) { console.log(`${m.padEnd(8)} şəbəkə xətası: ${e.message}`) }
  }
}
