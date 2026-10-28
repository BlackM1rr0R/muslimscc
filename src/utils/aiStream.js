// AI köməkçiyə sorğu — axın (SSE) rejimində, mətn gəldikcə onDelta(tamMətn) çağırılır.
// Server köhnədirsə və ya JSON qaytarırsa ({ reply }) — eyni nəticə, sadəcə bir parçada.
// Xətalar AIError ilə: code = timeout | upstream | empty | rate | aborted | network
// (konsola heç nə yazılmır — UI sakit mesaj göstərir).

export class AIError extends Error {
  constructor(code, partial = '') {
    super(code)
    this.code = code
    this.partial = partial
  }
}

const FIRST_TOKEN_MS = 35000 // server özü 25 san-də dayanır; bu, şəbəkə asılması üçün ehtiyatdır
const IDLE_MS = 20000

export async function askAI({ apiUrl, message, history, lang, signal, onDelta }) {
  const ac = new AbortController()
  let timedOut = false
  let timer = null
  const arm = (ms) => {
    clearTimeout(timer)
    timer = setTimeout(() => { timedOut = true; ac.abort() }, ms)
  }
  const onAbort = () => ac.abort()
  if (signal) {
    if (signal.aborted) throw new AIError('aborted')
    signal.addEventListener('abort', onAbort, { once: true })
  }
  arm(FIRST_TOKEN_MS)

  let text = ''
  const fail = (code) => new AIError(code, text)
  try {
    let res
    try {
      res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
        body: JSON.stringify({ message, history, lang, stream: true }),
        signal: ac.signal,
      })
    } catch {
      throw fail(signal?.aborted ? 'aborted' : timedOut ? 'timeout' : 'network')
    }

    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('text/event-stream') || !res.body) {
      // JSON cavabı (köhnə server, xəta, rate limit)
      const data = await res.json().catch(() => ({}))
      if (res.ok && typeof data.reply === 'string' && data.reply.trim()) {
        text = data.reply
        onDelta?.(text)
        return text
      }
      if (res.status === 429) throw fail('rate')
      throw fail(data.code || (res.status === 504 ? 'timeout' : 'upstream'))
    }

    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    let done = false
    let errCode = ''
    const handle = (line) => {
      if (!line.startsWith('data:')) return
      let ev
      try { ev = JSON.parse(line.slice(5)) } catch { return }
      if (typeof ev.t === 'string' && ev.t) {
        text += ev.t
        arm(IDLE_MS)
        onDelta?.(text)
      }
      if (ev.error) errCode = ev.code || 'upstream'
      if (ev.done) done = true
    }
    try {
      for (;;) {
        const { value, done: end } = await reader.read()
        if (end) break
        buf += dec.decode(value, { stream: true })
        let i
        while ((i = buf.indexOf('\n')) >= 0) {
          handle(buf.slice(0, i).replace(/\r$/, ''))
          buf = buf.slice(i + 1)
        }
      }
      if (buf) handle(buf)
    } catch {
      throw fail(signal?.aborted ? 'aborted' : timedOut ? 'timeout' : 'network')
    }
    if (errCode) throw fail(errCode)
    if (!done) throw fail(text ? 'network' : 'empty')
    if (!text.trim()) throw fail('empty')
    return text
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}
