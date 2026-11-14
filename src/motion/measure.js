// ═══════════════════════════════════════════════════════
// measureSoon (v6.7, perf) — çoxlu komponentin getBoundingClientRect oxunuşunu BİR layout-a yığır.
//
// Problem: TextEffect / NumberTicker hər nüsxədə layout effektində ölçü oxuyurdu, aralarında isə
// yazılar (textContent, atribut) olurdu → brauzer hər oxunuşda layout-u yenidən hesablayırdı
// (ana səhifədə CPU×4-də ~1.5 s). İndi: elementlər növbəyə düşür, microtask-da (boyamadan əvvəl)
// əvvəl HAMISININ ölçüsü oxunur, sonra callback-lər (yazılar) işləyir.
// ═══════════════════════════════════════════════════════
let queue = []

function flush() {
  const items = queue
  queue = []
  const rects = items.map(([el]) => (el.isConnected ? el.getBoundingClientRect() : null))
  items.forEach(([, cb], i) => { if (rects[i]) cb(rects[i]) })
}

/** el-in ölçüsünü toplu oxu, sonra cb(rect) çağır (eyni tick-də, boyamadan əvvəl) */
export function measureSoon(el, cb) {
  queue.push([el, cb])
  if (queue.length === 1) queueMicrotask(flush)
}
