// ═══════════════════════════════════════════════════════
// E2E köməkçisi: I mərhələsinin API-lərinin saxtaları — qrup çağırışları (server/challenges.js),
// müəllim sinfi (server/classes.js), ailə Ramazan lövhəsi (server/familyRamadan.js), təqvim axını
// (server/calFeed.js). "Server" testin yaddaşındadır — iki brauzer konteksti EYNİ obyekti paylaşır.
// Məxfilik qaydası burada da təqlid olunur (lövhədə yalnız toplu say, müəllimə yalnız razılıqla);
// real yoxlamalar tests/unit/server-*.test.js-dədir. fixtures.js-dəki ümumi marşrutdan SONRA qeyd olunur.
// ═══════════════════════════════════════════════════════

export const CH_TOKEN = 'C'.repeat(43)
export const CLS_TOKEN = 'Q'.repeat(43)
const body = (req) => { try { return req.postDataJSON() || {} } catch { return {} } }
const csrfOk = (req) => req.method() === 'GET' || Boolean(req.headers()['x-requested-with'])
const bakuToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date())
const ok = (route, json = { ok: true }, status = 200) => route.fulfill({ status, json })
const addDays = (key, n) => new Date(Date.parse(`${key}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10)

export function createTogetherServer() {
  return { challenges: [], classes: [], csrfMissing: [], bodies: [], feed: null, feedTokens: 0, ramadan: null, nextId: 1 }
}

/** me: { id, label } */
export async function attachTogether(page, S, me) {

  // ── Çağırışlar ──
  const board = (c) => {
    const today = bakuToday()
    const days = Array.from({ length: c.days }, (_, i) => addDays(c.startOn, i))
    const juz = c.template === 'khatm' ? Array.from({ length: 30 }, (_, i) => {
      const r = c.juz[i + 1]
      return { juz: i + 1, taken: Boolean(r), done: Boolean(r && r.done), mine: Boolean(r && r.uid === me.id) }
    }) : undefined
    return {
      id: c.id, template: c.template, n: c.n ?? null, title: c.title || '', startOn: c.startOn, days: c.days, endOn: c.endOn,
      owner: c.owner === me.id, members: c.members.length, max: 50, today,
      board: days.map((d) => ({ day: d, done: c.members.filter((u) => (c.ticks[u] || []).includes(d)).length })),
      mine: [...(c.ticks[me.id] || [])].sort(), reminder: { at: c.remind[me.id] || null, tz: 'Asia/Baku' }, ...(juz ? { juz } : {}),
    }
  }
  await page.route((u) => u.pathname === '/api/challenges' || u.pathname.startsWith('/api/challenges/'), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const b = body(req)
    S.bodies.push({ who: me.id, method, pathname, body: b })
    if (!csrfOk(req)) { S.csrfMissing.push(pathname); return ok(route, { code: 'forbidden' }, 403) }
    const parts = pathname.split('/').slice(3)   // [] | [id] | [id, 'tick'] | ['join', 'preview']
    if (!parts.length && method === 'GET') {
      return ok(route, { challenges: S.challenges.filter((c) => c.members.includes(me.id)).map((c) => {
        const x = board(c)
        const row = x.board.find((d) => d.day === x.today)
        return { ...x, todayDone: row ? row.done : null, mineToday: x.mine.includes(x.today), myDays: x.mine.length }
      }), limits: {} })
    }
    if (!parts.length && method === 'POST') {
      if (b.consent !== true) return ok(route, { code: 'consent_required' }, 400)
      const c = { id: S.nextId++, template: b.template, n: b.n, title: b.title, startOn: b.startOn, days: b.days, endOn: addDays(b.startOn, b.days - 1), owner: me.id, members: [me.id], ticks: {}, remind: {}, juz: {} }
      S.challenges.push(c)
      return ok(route, { challenge: board(c), token: CH_TOKEN }, 201)
    }
    if (parts[0] === 'join') {
      const c = b.token === CH_TOKEN ? S.challenges[S.challenges.length - 1] : null
      if (!c) return ok(route, { code: 'invalid_token' }, 404)
      if (parts[1] === 'preview') return ok(route, { challenge: { ...board(c), members: c.members.length }, already: c.members.includes(me.id) })
      if (!c.members.includes(me.id)) {
        if (b.consent !== true) return ok(route, { code: 'consent_required' }, 400)
        c.members.push(me.id)
      }
      return ok(route, { id: c.id, already: false })
    }
    const c = S.challenges.find((x) => x.id === Number(parts[0]) && x.members.includes(me.id))
    if (!c) return ok(route, { code: 'not_found' }, 404)
    if (parts.length === 1 && method === 'GET') return ok(route, { challenge: board(c) })
    if (parts[1] === 'invite') return ok(route, { token: CH_TOKEN })
    if (parts[1] === 'tick') {
      const set = new Set(c.ticks[me.id] || [])
      if (b.done) set.add(b.day); else set.delete(b.day)
      c.ticks[me.id] = [...set]
      return ok(route, { ok: true, challenge: board(c) })
    }
    if (parts[1] === 'me' && method === 'PATCH') { c.remind[me.id] = b.remindAt; return ok(route, { reminder: { at: b.remindAt, tz: b.tz } }) }
    return ok(route, { code: 'not_found' }, 404)
  })

  // ── Siniflər ──
  const teacherView = (k) => ({
    class: { id: k.id, name: k.name, note: k.note, students: k.students.length, max: 60, role: 'teacher', sharing: k.students.filter((s) => s.consent).length },
    assignments: k.assignments.map((a) => ({ ...a, doneCount: k.students.filter((s) => s.consent && s.done.includes(a.id)).length })),
    // Razılıq yoxdursa — yalnız ad (server/classes.js ilə eyni qayda)
    students: k.students.map((s) => ({ id: s.id, label: s.label, joinedAt: 1, sharing: s.consent, ...(s.consent ? { done: s.done, stats: s.stats || {}, statsAt: 1 } : {}), tests: s.tests })),
  })
  const studentView = (k) => {
    const s = k.students.find((x) => x.id === me.id)
    return {
      class: { id: k.id, name: k.name, note: k.note, students: k.students.length, max: 60, role: 'student', teacher: k.teacherLabel },
      assignments: k.assignments.map((a) => ({ ...a, done: s.done.includes(a.id) })),
      share: s.consent ? { stats: s.stats || {}, updatedAt: 1 } : null, consent: s.consent,
    }
  }
  await page.route((u) => u.pathname === '/api/classes' || u.pathname.startsWith('/api/classes/'), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const b = body(req)
    S.bodies.push({ who: me.id, method, pathname, body: b })
    if (!csrfOk(req)) { S.csrfMissing.push(pathname); return ok(route, { code: 'forbidden' }, 403) }
    const parts = pathname.split('/').slice(3)
    if (!parts.length && method === 'GET') {
      return ok(route, {
        teaching: S.classes.filter((k) => k.teacher === me.id).map((k) => ({ ...teacherView(k).class, assignments: k.assignments.length })),
        learning: S.classes.filter((k) => k.students.some((s) => s.id === me.id)).map((k) => ({ ...studentView(k).class, sharing: studentView(k).consent })),
        limits: {},
      })
    }
    if (!parts.length && method === 'POST') {
      const k = { id: S.nextId++, name: b.name, note: '', teacher: me.id, teacherLabel: me.label, students: [], assignments: [] }
      S.classes.push(k)
      return ok(route, { ...teacherView(k), token: CLS_TOKEN }, 201)
    }
    if (parts[0] === 'join') {
      const k = b.token === CLS_TOKEN ? S.classes[S.classes.length - 1] : null
      if (!k) return ok(route, { code: 'invalid_token' }, 404)
      if (parts[1] === 'preview') return ok(route, { class: { id: k.id, name: k.name, teacher: k.teacherLabel, students: k.students.length, max: 60 }, already: k.students.some((s) => s.id === me.id), teacher: k.teacher === me.id })
      if (!k.students.some((s) => s.id === me.id)) k.students.push({ id: me.id, label: me.label, consent: b.consent === true, done: [], stats: null, tests: [] })
      return ok(route, { id: k.id, already: false })
    }
    const k = S.classes.find((x) => x.id === Number(parts[0]) && (x.teacher === me.id || x.students.some((s) => s.id === me.id)))
    if (!k) return ok(route, { code: 'not_found' }, 404)
    const teacher = k.teacher === me.id
    const view = () => (teacher ? teacherView(k) : studentView(k))
    if (parts.length === 1 && method === 'GET') return ok(route, view())
    if (parts.length === 1 && method === 'PATCH' && teacher) { if (b.note != null) k.note = b.note; return ok(route, view()) }
    if (parts[1] === 'invite' && teacher) return ok(route, { token: CLS_TOKEN })
    if (parts[1] === 'assignments' && parts.length === 2 && teacher) {
      const a = { id: S.nextId++, kind: b.kind, surah: b.surah ?? null, from: b.from, to: b.to, dueOn: b.dueOn, createdAt: 1 }
      k.assignments.unshift(a)
      return ok(route, { assignment: a, ...view() }, 201)
    }
    const s = k.students.find((x) => x.id === me.id)
    if (parts[1] === 'assignments' && parts[3] === 'done' && s) {
      const aid = Number(parts[2])
      s.done = b.done ? [...new Set([...s.done, aid])] : s.done.filter((x) => x !== aid)
      return ok(route, view())
    }
    if (parts[1] === 'share' && s) {
      if (method === 'PUT') { if (!s.consent && b.consent !== true) return ok(route, { code: 'consent_required' }, 400); s.consent = true; s.stats = b.stats }
      else { s.consent = false; s.stats = null }
      return ok(route, view())
    }
    if (parts[1] === 'tests' && teacher) {
      const st = k.students.find((x) => x.id === b.studentId)
      if (!st) return ok(route, { code: 'not_found' }, 404)
      const test = { id: S.nextId++, status: 'open', surah: b.surah, from: b.from, to: b.to, createdAt: 1 }
      st.tests.push(test)
      return ok(route, { token: 'T'.repeat(43), test }, 201)
    }
    return ok(route, { code: 'not_found' }, 404)
  })

  // ── Təqvim axını ──
  await page.route((u) => u.pathname === '/api/cal-feed', async (route) => {
    const req = route.request()
    const method = req.method()
    const b = body(req)
    S.bodies.push({ who: me.id, method, pathname: '/api/cal-feed', body: b })
    if (!csrfOk(req)) { S.csrfMissing.push('/api/cal-feed'); return ok(route, { code: 'forbidden' }, 403) }
    const out = () => (S.feed ? { enabled: true, cats: S.feed.cats, lang: S.feed.lang, createdAt: S.feed.createdAt } : { enabled: false, cats: null, lang: null, createdAt: null })
    if (method === 'GET') return ok(route, { ...out(), available: [] })
    if (method === 'POST') {
      if (!S.feed && b.consent !== true) return ok(route, { code: 'consent_required' }, 400)
      S.feedTokens++
      const token = String.fromCharCode(64 + S.feedTokens).repeat(43)
      S.feed = { cats: b.cats, lang: b.lang, createdAt: Date.now(), token }
      return ok(route, { token, ...out() }, 201)
    }
    if (method === 'PATCH') { S.feed.cats = b.cats; return ok(route, out()) }
    if (method === 'DELETE') { S.feed = null; return ok(route) }
    return ok(route, { code: 'not_found' }, 404)
  })
}

/** Ailə Ramazan lövhəsi: S.ramadan = { open, members:[{id,label}], … } — "Ramazan tarixi" saxtadır (5-ci gün) */
export function ramadanSeason({ open = true } = {}) {
  const start = '2027-02-08'
  const days = Array.from({ length: 29 }, (_, i) => addDays(start, i))
  return { open, hyear: 1448, start, end: days[28], days, phase: open ? 'ramadan' : null, today: addDays(start, 4), hijriDay: open ? 5 : null }
}
export async function attachRamadan(page, S, me, { open = true } = {}) {
  const season = ramadanSeason({ open })
  const R = S.ramadan || (S.ramadan = { shares: {}, juz: {}, iftar: {}, qadr: {}, members: [{ id: 12, label: 'Ana' }, { id: 13, label: 'Əli' }] })
  const label = (id) => R.members.find((m) => m.id === id)?.label || null
  const boardOf = () => {
    const seasonOut = { open: season.open, hyear: season.hyear, start: season.start, end: season.end, phase: season.phase, today: season.today, hijriDay: season.hijriDay }
    if (!season.open) return { season: seasonOut, circle: { id: 1 } }
    return {
      season: seasonOut, circle: { id: 1, role: me.id === 12 ? 'owner' : 'member' },
      members: R.members.map((m) => ({ id: m.id, label: m.label, self: m.id === me.id, share: R.shares[m.id] || null })),
      consent: Boolean(R.shares[me.id]), mine: R.shares[me.id] || null,
      juz: Array.from({ length: 30 }, (_, i) => { const r = R.juz[i + 1]; return { juz: i + 1, by: r ? label(r.uid) : null, mine: Boolean(r && r.uid === me.id), done: Boolean(r && r.done) } }),
      iftar: season.days.map((d, i) => ({ day: d, n: i + 1, by: R.iftar[d] ? label(R.iftar[d]) : null, mine: R.iftar[d] === me.id })),
      qadr: [21, 23, 25, 27, 29].map((n) => ({ night: n, count: (R.qadr[n] || []).length, mine: (R.qadr[n] || []).includes(me.id) })),
      total: R.members.length,
    }
  }
  await page.route((u) => u.pathname === '/api/family/ramadan' || u.pathname.startsWith('/api/family/ramadan/'), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const b = body(req)
    S.bodies.push({ who: me.id, method, pathname, body: b })
    if (!csrfOk(req)) { S.csrfMissing.push(pathname); return ok(route, { code: 'forbidden' }, 403) }
    if (pathname === '/api/family/ramadan') return ok(route, boardOf())
    if (!season.open) return ok(route, { code: 'not_ramadan' }, 409)
    if (pathname.endsWith('/share')) {
      if (method === 'DELETE') delete R.shares[me.id]
      else { if (!R.shares[me.id] && b.consent !== true) return ok(route, { code: 'consent_required' }, 400); R.shares[me.id] = { fasts: b.fasts, pages: b.pages, updatedAt: 1 } }
    }
    if (pathname.endsWith('/juz')) {
      if (b.action === 'take') R.juz[b.juz] = { uid: me.id, done: false }
      if (b.action === 'done') R.juz[b.juz].done = true
      if (b.action === 'release') delete R.juz[b.juz]
    }
    if (pathname.endsWith('/iftar')) { if (b.on) R.iftar[b.day] = me.id; else delete R.iftar[b.day] }
    if (pathname.endsWith('/qadr')) { const l = new Set(R.qadr[b.night] || []); if (b.on) l.add(me.id); else l.delete(me.id); R.qadr[b.night] = [...l] }
    return ok(route, boardOf())
  })
}
