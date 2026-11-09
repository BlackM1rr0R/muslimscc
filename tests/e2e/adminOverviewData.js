// ═══════════════════════════════════════════════════════
// E2E köməkçisi: admin icmal panelinin (DashboardOverview) API cavabları — SAXTA,
// yalnız testdə. Formalar serverdəki ilə eynidir:
//   /api/admin/analytics?compare=1 (server/analytics.js) · /subscribers, /notification-history (server.js)
//   /api/admin/feedback (server/feedback.js) · /api/admin/errors (server/clientErrors.js)
// fakeAdminSession-dan SONRA çağırılır (sonra qeyd olunan marşrut birinci işləyir).
// ═══════════════════════════════════════════════════════

const DAY = 86400e3
const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10)

function days(from, to) {
  const out = []
  for (let t = Date.parse(from + 'T00:00:00Z'); t <= Date.parse(to + 'T00:00:00Z'); t += DAY) out.push(dayOf(t))
  return out
}

// Deterministik "dalğa" — həftə sonu yüksək, yavaş artım
const viewsOn = (day) => {
  const t = Date.parse(day + 'T00:00:00Z') / DAY
  const wd = new Date(day + 'T00:00:00Z').getUTCDay()
  return Math.round(320 + (t % 97) * 1.6 + (wd === 5 ? 140 : wd === 6 ? 60 : 0) + 40 * Math.sin(t / 3))
}

function statsFor(from, to, scale = 1) {
  const series = days(from, to).map(d => { const v = Math.round(viewsOn(d) * scale); return { day: d, views: v, visitors: Math.round(v * 0.46) } })
  const views = series.reduce((s, r) => s + r.views, 0)
  const visitors = series.reduce((s, r) => s + r.visitors, 0)
  const part = (k) => Math.round(views * k)
  return {
    from, to, days: series.length,
    totals: { views, visitors, viewsPerVisit: Math.round((views / visitors) * 100) / 100, pages: 214, topLanguage: 'az' },
    series,
    pages: [['/', 0.22], ['/prayer', 0.17], ['/quran', 0.12], ['/quran/2-al-baqara', 0.05], ['/hadith', 0.045], ['/dhikr', 0.04], ['/names', 0.03], ['/qibla', 0.025]]
      .map(([key, k]) => ({ key, views: part(k), visitors: part(k * 0.6) })),
    referrers: [['google.com', 0.11], ['instagram.com', 0.05], ['t.co', 0.02], ['yandex.ru', 0.015], ['bing.com', 0.006], ['facebook.com', 0.005], ['duckduckgo.com', 0.003]]
      .map(([key, k]) => ({ key, count: Math.round(part(k) * (key === 'instagram.com' ? scale : 1)) })),
    languages: [['az', 0.58], ['ru', 0.17], ['en', 0.11], ['tr', 0.08], ['ar', 0.04], ['id', 0.01], ['ur', 0.01]].map(([key, k]) => ({ key, count: part(k) })),
    devices: [['mobile', 0.71], ['desktop', 0.24], ['tablet', 0.05]].map(([key, k]) => ({ key, count: part(k) })),
    browsers: [['Chrome', 0.62], ['Safari', 0.24], ['Samsung Internet', 0.06], ['Edge', 0.04], ['Firefox', 0.03], ['Other', 0.01]].map(([key, k]) => ({ key, count: part(k) })),
    retentionDays: 400,
  }
}

export function overviewAnalytics(from, to) {
  const n = days(from, to).length
  const pFrom = dayOf(Date.parse(from + 'T00:00:00Z') - n * DAY)
  const pTo = dayOf(Date.parse(from + 'T00:00:00Z') - DAY)
  const cur = statsFor(from, to)
  const prev = statsFor(pFrom, pTo, 0.86)
  const pageSeries = Object.fromEntries(cur.pages.map((p, i) => [p.key, cur.series.map((r, j) => Math.round(r.views * (0.2 - i * 0.02) * (1 + ((j + i) % 5) / 10)))]))
  return { ...cur, prev, pageSeries }
}

export function overviewFixtures(now = Date.now()) {
  const t = (minAgo) => now - minAgo * 60e3
  return {
    subscribers: {
      count: 1287, fcm: 312, webpush: 975,
      webpushNew: Array.from({ length: 90 }, (_, i) => ({ day: dayOf(now - (89 - i) * DAY), count: (i * 7) % 11 === 0 ? 0 : 2 + ((i * 5) % 9) })),
      webpushLangs: [{ key: 'az', count: 610 }, { key: 'ru', count: 190 }, { key: 'en', count: 95 }, { key: 'tr', count: 80 }],
    },
    history: [
      { id: 'n1', title: 'Cümə mübarək', body: 'Kəhf surəsini oxumağı unutmayın', url: '/quran/18-al-kahf', priority: 'normal', sentTo: 1204, failed: 31, createdAt: t(95) },
      { id: 'n2', title: 'Yeni dərs: Namazın şərtləri', body: '…', url: '/learn', priority: 'normal', sentTo: 1180, failed: 22, createdAt: t(60 * 26) },
    ],
    feedback: [
      { id: 'f1', page: '/hadith/bukhari/1', ref: 'bukhari:1', kind: 'source', text: 'Mənbə nömrəsi səhvdir', lang: 'az', contact: '', status: 'new', createdAt: t(7) },
      { id: 'f2', page: '/aichat', ref: 'ai', kind: 'ai', text: 'Səbəb: Səhv məlumat …', lang: 'ru', contact: '', status: 'new', createdAt: t(42) },
      { id: 'f3', page: '/quran/2-al-baqara', ref: '2:255', kind: 'translation', text: 'Tərcümədə hərf səhvi', lang: 'az', contact: '', status: 'done', createdAt: t(60 * 5) },
      { id: 'f4', page: '/aichat', ref: 'ai', kind: 'ai', text: 'Səbəb: Mənbə yoxdur …', lang: 'en', contact: '', status: 'done', createdAt: t(60 * 24 * 3) },
      { id: 'f5', page: '/prayer', ref: '', kind: 'design', text: 'Telefonda düymə kəsilir', lang: 'tr', contact: '', status: 'new', createdAt: t(60 * 24 * 12) },
    ],
    errors: {
      since: new Date(now - 3 * DAY).toISOString(), total: 14, dropped: 0,
      items: [{ kind: 'error', message: "Cannot read properties of undefined (reading 'map')", source: '/assets/index.js', line: 1, col: 2, stack: '', pages: ['/hifz'], count: 9, first: new Date(t(60 * 30)).toISOString(), last: new Date(t(18)).toISOString() },
        { kind: 'rejection', message: 'Failed to fetch', source: '', line: 0, col: 0, stack: '', pages: ['/prayer'], count: 5, first: new Date(t(60 * 50)).toISOString(), last: new Date(t(60 * 3)).toISOString() }],
    },
  }
}

/** Admin icmal API-sini saxta cavablarla doldur. failing — 500 qaytaracaq mənbələr ('analytics', 'errors' …). */
export async function mockOverviewApi(page, { failing = [], empty = false } = {}) {
  const fx = overviewFixtures()
  const requests = []
  const map = {
    '/api/admin/subscribers': ['subs', () => (empty ? { count: 0, fcm: 0, webpush: 0, webpushNew: [], webpushLangs: [] } : fx.subscribers)],
    '/api/admin/notification-history': ['history', () => (empty ? [] : fx.history)],
    '/api/admin/feedback': ['feedback', () => (empty ? [] : fx.feedback)],
    '/api/admin/errors': ['errors', () => (empty ? { since: new Date().toISOString(), total: 0, dropped: 0, items: [] } : fx.errors)],
  }
  await page.route((u) => u.pathname === '/api/admin/analytics' || u.pathname in map, async (route) => {
    const u = new URL(route.request().url())
    requests.push(u.pathname + u.search)
    if (u.pathname === '/api/admin/analytics') {
      if (failing.includes('analytics')) return route.fulfill({ status: 500, json: { error: 'Server error' } })
      const from = u.searchParams.get('from'), to = u.searchParams.get('to')
      const body = overviewAnalytics(from, to)
      if (empty) {
        for (const s of [body, body.prev]) {
          s.series = s.series.map(r => ({ ...r, views: 0, visitors: 0 }))
          Object.assign(s.totals, { views: 0, visitors: 0, viewsPerVisit: 0, pages: 0, topLanguage: null })
          s.pages = []; s.referrers = []; s.languages = []; s.devices = []; s.browsers = []
        }
        body.pageSeries = {}
      }
      return route.fulfill({ json: body })
    }
    const [key, fn] = map[u.pathname]
    if (failing.includes(key)) return route.fulfill({ status: 500, json: { error: 'Server error' } })
    return route.fulfill({ json: fn() })
  })
  return { requests }
}
