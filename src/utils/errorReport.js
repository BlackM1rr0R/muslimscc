// ═══════════════════════════════════════════════════════
// Brauzer xətalarının hesabatı → POST /api/client-error (server/clientErrors.js)
//
// • window "error" və "unhandledrejection" + PageErrorBoundary (reportError).
// • Yalnız: xəta növü, mesaj, fayl yolu, sətir, stack-in ilk sətirləri, səhifənin yolu.
//   Sorğu hissəsi, cookie, yerli yaddaş, istifadəçi məlumatı GÖNDƏRİLMİR.
// • Səs-küyə qarşı: eyni xəta bir sessiyada bir dəfə, sessiyada ən çox 8 hesabat;
//   localhost / önizləmə / avtomatlaşdırılmış brauzer (navigator.webdriver) — göndərilmir.
// • sendBeacon (səhifə bağlananda da çatır), olmasa fetch keepalive.
// ═══════════════════════════════════════════════════════
const ENDPOINT = '/api/client-error'
const MAX_PER_SESSION = 8
const sent = new Set()
let count = 0

const enabled = () => typeof window !== 'undefined' && !navigator.webdriver
  && /^(www\.)?muslims\.cc$/.test(window.location.hostname)

/** Saf: hadisədən hesabat obyekti (tests/unit/error-report.test.js) */
export function buildReport(kind, err, extra = {}) {
  const e = err instanceof Error ? err : null
  const message = String(e?.message || (typeof err === 'string' ? err : err?.message) || extra.message || 'Unknown error').slice(0, 300)
  return {
    kind,
    message: e?.name && e.name !== 'Error' && !message.startsWith(e.name) ? `${e.name}: ${message}` : message,
    source: String(extra.source || '').split('?')[0].slice(0, 300),
    line: Number.isInteger(extra.line) ? extra.line : 0,
    col: Number.isInteger(extra.col) ? extra.col : 0,
    stack: String(e?.stack || '').split('\n').slice(0, 5).join('\n').slice(0, 1200),
    page: typeof window !== 'undefined' ? window.location.pathname : '',
  }
}

export function reportError(kind, err, extra) {
  try {
    if (!enabled() || count >= MAX_PER_SESSION) return
    const r = buildReport(kind, err, extra)
    const key = `${r.kind}|${r.message}|${r.source}|${r.line}`
    if (sent.has(key)) return
    sent.add(key); count++
    const body = JSON.stringify(r)
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return
    fetch(ENDPOINT, { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
  } catch { /* hesabat özü heç vaxt xəta atmasın */ }
}

export function initErrorReporting() {
  if (typeof window === 'undefined' || window.__qmErr) return
  window.__qmErr = true
  window.addEventListener('error', (ev) => {
    // Şəkil/skript yüklənmə xətaları (ev.target element) — burada deyil
    if (ev.target && ev.target !== window) return
    reportError('error', ev.error || ev.message, { source: ev.filename, line: ev.lineno, col: ev.colno, message: ev.message })
  })
  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason
    // Ləğv edilmiş sorğular (AbortError) xəta deyil
    if (r && (r.name === 'AbortError' || r === 'cancelled')) return
    reportError('rejection', r)
  })
}
