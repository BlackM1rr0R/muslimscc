// ═══════════════════════════════════════════════════════
// Admin icmal paneli (components/admin/DashboardOverview.jsx) — saf hesab.
// YALNIZ mövcud admin API cavablarından (heç nə uydurulmur):
//   GET /api/admin/analytics?from&to&compare=1  { series, totals, pages, referrers, languages, devices, browsers, prev, pageSeries }
//   GET /api/admin/subscribers                  { count, fcm, webpush, webpushNew:[{day,count}], webpushLangs }
//   GET /api/admin/notification-history         [{ id, title, sentTo, failed, createdAt }]
//   GET /api/admin/feedback                     [{ id, kind, page, status, lang, createdAt }]
//   GET /api/admin/errors                       { since, total, items:[{ kind, message, count, last }] }
// Gün sərhədi UTC-dir (server/analytics.js ilə eyni).
// Testlər: tests/unit/admin-overview.test.js
// ═══════════════════════════════════════════════════════

const DAY_MS = 86400e3
export const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10)
export const addUtcDays = (day, n) => utcDay(Date.parse(day + 'T00:00:00Z') + n * DAY_MS)

/** Son n gün (bu gün daxil), köhnədən yeniyə: ['YYYY-MM-DD', …] */
export function utcDayKeys(todayKey, n) {
  return Array.from({ length: n }, (_, i) => addUtcDays(todayKey, i - (n - 1)))
}

/** Dövr üçün { from, to } (UTC) */
export function rangeFor(days, now = Date.now()) {
  const to = utcDay(now)
  return { from: addUtcDays(to, -(days - 1)), to }
}

const sumOf = (arr) => arr.reduce((s, v) => s + (Number(v) || 0), 0)

/** a-nın b-yə görə faiz dəyişməsi; b = 0 → null (sonsuz faiz göstərilmir) */
export function pct(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null
  return ((a - b) / b) * 100
}

/**
 * Trafik göstəriciləri: bu gün / dünən, son 7 gün / əvvəlki 7 gün.
 * analytics.series + analytics.prev.series birləşdirilir (7 günlük dövrdə əvvəlki həftə prev-dədir).
 */
export function trafficKpis(analytics) {
  const cur = Array.isArray(analytics?.series) ? analytics.series : []
  const prev = Array.isArray(analytics?.prev?.series) ? analytics.prev.series : []
  const all = [...prev, ...cur]
  const at = (i) => all[all.length - 1 - i] || null
  const today = at(0), yday = at(1)
  const last = (n, k, off = 0) => all.slice(Math.max(0, all.length - n - off), all.length - off).map(r => Number(r[k]) || 0)
  const has14 = all.length >= 14
  const v7 = sumOf(last(7, 'visitors'))
  const v7prev = has14 ? sumOf(last(7, 'visitors', 7)) : null
  return {
    todayViews: today ? today.views : 0,
    todayVisitors: today ? today.visitors : 0,
    ydayViews: yday ? yday.views : null,
    ydayVisitors: yday ? yday.visitors : null,
    visitors7: v7,
    visitors7Prev: v7prev,
    sparkViews: last(14, 'views'),
    sparkVisitors: last(14, 'visitors'),
    spark7: last(7, 'visitors'),
  }
}

/**
 * Bir ölçünün (dil, mənbə, cihaz…) indiki və keçən dövr dəyərləri:
 * [{ key, value, prev }] — indiki sıra ilə; limit-dən sonrakılar "other" sətrinə yığılır.
 */
export function withPrev(list, prevList, { limit = 5, valueKey = 'count', otherKey = '(other)' } = {}) {
  const cur = Array.isArray(list) ? list : []
  const pm = new Map((Array.isArray(prevList) ? prevList : []).map(r => [r.key, Number(r[valueKey]) || 0]))
  const hasPrev = Array.isArray(prevList)
  const rows = cur.map(r => ({ key: r.key, value: Number(r[valueKey]) || 0, prev: hasPrev ? (pm.get(r.key) || 0) : null }))
  if (rows.length <= limit) return rows
  const head = rows.slice(0, limit - 1)
  const tail = rows.slice(limit - 1)
  head.push({
    key: otherKey,
    value: sumOf(tail.map(r => r.value)),
    prev: hasPrev ? sumOf(tail.map(r => r.prev || 0)) : null,
  })
  return head
}

/** Səhifə cədvəli: [{ key, views, prev, share, trend }] */
export function pageRows(analytics, limit = 8) {
  const pages = Array.isArray(analytics?.pages) ? analytics.pages.slice(0, limit) : []
  const prevPages = analytics?.prev?.pages
  const pm = new Map((Array.isArray(prevPages) ? prevPages : []).map(r => [r.key, Number(r.views) || 0]))
  const total = Number(analytics?.totals?.views) || 0
  const ps = analytics?.pageSeries || {}
  return pages.map(p => ({
    key: p.key,
    views: Number(p.views) || 0,
    visitors: Number(p.visitors) || 0,
    prev: Array.isArray(prevPages) ? (pm.get(p.key) || 0) : null,
    share: total > 0 ? (Number(p.views) || 0) / total : 0,
    trend: Array.isArray(ps[p.key]) ? ps[p.key] : [],
  }))
}

const msOf = (v) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') { const t = Date.parse(v); return Number.isFinite(t) ? t : null }
  if (v && typeof v === 'object' && typeof v.seconds === 'number') return v.seconds * 1000   // köhnə Firestore Timestamp
  return null
}

/** Siyahıdakı elementlərin gün üzrə sayı (UTC) — keys sırası ilə */
export function countByDay(list, keys, timeOf = (x) => x.createdAt) {
  const idx = new Map(keys.map((k, i) => [k, i]))
  const out = new Array(keys.length).fill(0)
  for (const x of Array.isArray(list) ? list : []) {
    const t = msOf(timeOf(x))
    if (t == null) continue
    const i = idx.get(utcDay(t))
    if (i != null) out[i]++
  }
  return out
}

/**
 * Səhv bildirişləri və AI cavab şikayətləri (kind 'ai' — AIRating 👎).
 * days — dövr uzunluğu; dövr və əvvəlki dövr üzrə saylar + günlük sıra.
 */
export function feedbackStats(list, days, now = Date.now()) {
  const items = Array.isArray(list) ? list : []
  const today = utcDay(now)
  const keys = utcDayKeys(today, days)
  const prevKeys = utcDayKeys(addUtcDays(today, -days), days)
  const open = items.filter(x => (x.status || 'new') === 'new')
  const ai = items.filter(x => x.kind === 'ai')
  const notAi = items.filter(x => x.kind !== 'ai')
  return {
    total: items.length,
    open: open.length,
    openAi: open.filter(x => x.kind === 'ai').length,
    reports: sumOf(countByDay(notAi, keys)),
    reportsPrev: sumOf(countByDay(notAi, prevKeys)),
    reportsDaily: countByDay(notAi, keys),
    ai: sumOf(countByDay(ai, keys)),
    aiPrev: sumOf(countByDay(ai, prevKeys)),
    aiDaily: countByDay(ai, keys),
    aiTotal: ai.length,
  }
}

/** Push abunəçiləri: son days gündə yaranan (hələ aktiv) Web Push abunəlikləri + günlük sıra */
export function subscriberStats(subs, days, now = Date.now()) {
  const keys = utcDayKeys(utcDay(now), days)
  const prevKeys = utcDayKeys(addUtcDays(utcDay(now), -days), days)
  const m = new Map((Array.isArray(subs?.webpushNew) ? subs.webpushNew : []).map(r => [r.day, Number(r.count) || 0]))
  const daily = keys.map(k => m.get(k) || 0)
  return {
    count: Number(subs?.count) || 0,
    webpush: Number(subs?.webpush) || 0,
    fcm: Number(subs?.fcm) || 0,
    hasDaily: Array.isArray(subs?.webpushNew),
    added: sumOf(daily),
    addedPrev: sumOf(prevKeys.map(k => m.get(k) || 0)),
    daily,
  }
}

/** Bildiriş tarixçəsi: dövrdə göndərilən bildiriş sayı və çatdırılma */
export function notificationStats(history, days, now = Date.now()) {
  const list = Array.isArray(history) ? history : []
  const from = Date.parse(addUtcDays(utcDay(now), -(days - 1)) + 'T00:00:00Z')
  const inRange = list.filter(h => { const t = msOf(h.createdAt); return t != null && t >= from })
  const sent = sumOf(inRange.map(h => h.sentTo))
  const failed = sumOf(inRange.map(h => h.failed))
  return { count: inRange.length, sent, failed, rate: sent + failed > 0 ? (sent / (sent + failed)) * 100 : null }
}

/** Brauzer xətaları (yaddaşda, server başlayandan bəri) */
export function errorStats(errors) {
  const items = Array.isArray(errors?.items) ? errors.items : []
  return { kinds: items.length, total: Number(errors?.total) || sumOf(items.map(x => x.count)), since: errors?.since || null }
}

/**
 * Canlı fəaliyyət lenti: səhv bildirişləri, AI şikayətləri, göndərilən bildirişlər, brauzer xətaları,
 * yeni abunəlik günləri. names — dilə görə yazılar (funksiyalar). Yenidən köhnəyə.
 */
export function buildFeed({ feedback, history, errors, subs }, names, { max = 8 } = {}) {
  const ev = []
  for (const x of Array.isArray(feedback) ? feedback : []) {
    const t = msOf(x.createdAt)
    if (t == null) continue
    const ai = x.kind === 'ai'
    ev.push({
      key: `f-${x.id ?? t}`, t, kind: ai ? 'ai' : 'feedback', icon: ai ? 'sparkle' : 'alert',
      title: ai ? names.ai : names.feedback(x.kind), meta: typeof x.page === 'string' ? x.page : '',
      open: (x.status || 'new') === 'new', tab: 'feedback',
    })
  }
  for (const h of Array.isArray(history) ? history : []) {
    const t = msOf(h.createdAt)
    if (t == null) continue
    ev.push({ key: `n-${h.id ?? t}`, t, kind: 'push', icon: 'bell', title: names.push(String(h.title || '')), meta: names.pushMeta(Number(h.sentTo) || 0, Number(h.failed) || 0), tab: 'pushNotif' })
  }
  for (const e of Array.isArray(errors?.items) ? errors.items : []) {
    const t = msOf(e.last)
    if (t == null) continue
    ev.push({ key: `e-${e.kind}-${e.message}-${e.line ?? ''}`, t, kind: 'error', icon: 'bolt', title: names.error(String(e.message || '')), meta: names.errorMeta(Number(e.count) || 1) })
  }
  for (const r of Array.isArray(subs?.webpushNew) ? subs.webpushNew : []) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.day) || !(r.count > 0)) continue
    ev.push({ key: `s-${r.day}`, t: Date.parse(r.day + 'T12:00:00Z'), day: r.day, kind: 'sub', icon: 'bell', title: names.subs(Number(r.count)), meta: '' })
  }
  return ev.sort((a, b) => b.t - a.t).slice(0, max)
}

/**
 * Bir cümləlik nəticə üçün hissələr (mətni komponent qurur):
 * { traffic: 'up'|'down'|'same'|'first'|'none', delta, open, aiOpen }
 */
export function insightParts(k, fb) {
  let traffic = 'none', delta = null
  if (k && k.todayViews > 0) {
    if (k.ydayViews == null || k.ydayViews === 0) traffic = 'first'
    else {
      delta = pct(k.todayViews, k.ydayViews)
      traffic = Math.abs(delta) < 1 ? 'same' : delta > 0 ? 'up' : 'down'
    }
  }
  return { traffic, delta, open: fb ? fb.open : 0, aiOpen: fb ? fb.openAi : 0 }
}
