// ═══════════════════════════════════════════════════════
// E2E köməkçisi: D mərhələsinin API-lərinin (server/readTogether.js, family.js, hifzTest.js) saxtaları.
// "Server" testin öz yaddaşındadır — iki brauzer konteksti (aparıcı + qonaq, ana + uşaq) EYNİ obyekti
// paylaşır. SSE: hər GET …/events cavabı otağın tam vəziyyətini verib bağlanır (retry) — klient yeni bilet
// alıb yenidən qoşulur, yəni real serverdəki kimi "ilk mesaj — tam vəziyyət" qaydası ilə işləyir.
// Real təhlükəsizlik (həş, CSRF, limitlər, SSE yayımı) tests/unit/server-*.test.js-dədir.
// fixtures.js-dəki ümumi marşrutdan SONRA qeyd olunur (birinci işləyir).
// ═══════════════════════════════════════════════════════

const rid = (n, abc = 'abcdefghijklmnopqrstuvwxyz0123456789') => Array.from({ length: n }, () => abc[Math.floor(Math.random() * abc.length)]).join('')
const sec = () => rid(22, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-')
const body = (req) => { try { return req.postDataJSON() || {} } catch { return {} } }
const csrfOk = (req) => req.method() === 'GET' || Boolean(req.headers()['x-requested-with'])

// ── Birlikdə oxu ──
export function createRtServer() {
  return { rooms: new Map(), invites: new Map(), tickets: new Map(), csrfMissing: [], actions: [] }
}
const snap = (r) => ({
  id: r.id, title: r.title, page: r.page, highlight: r.highlight, anyoneTurns: r.anyoneTurns, seq: r.seq, createdAt: 1,
  participants: [...r.participants.values()].map((p) => ({ pid: p.pid, name: p.name, host: p.host, online: Date.now() - (p.seen || 0) < 4000 })),
})

export async function attachRt(page, S, { owner = 0 } = {}) {
  await page.route((u) => u.pathname.startsWith('/api/read-together/'), async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const parts = url.pathname.split('/').slice(3)   // ['rooms'] | ['join'] | [id, 'ticket'|'events'|'action']
    const b = body(req)
    if (!csrfOk(req)) { S.csrfMissing.push(url.pathname); return route.fulfill({ status: 403, json: { code: 'forbidden' } }) }
    const add = (r, name, host) => {
      const p = { pid: rid(8), secret: sec(), name, host, seen: 0 }
      r.participants.set(p.pid, p)
      return p
    }
    if (parts[0] === 'rooms' && parts.length === 1) {
      if (!owner) return route.fulfill({ status: 401, json: { code: 'unauthenticated' } })
      const r = { id: rid(10), ownerId: owner, title: b.title || '', page: b.page || 1, highlight: null, anyoneTurns: Boolean(b.anyoneTurns), seq: 0, participants: new Map() }
      const invite = sec()
      S.rooms.set(r.id, r); S.invites.set(invite, r.id)
      const h = add(r, b.name || 'Host', true)
      return route.fulfill({ status: 201, json: { room: r.id, invite, pid: h.pid, secret: h.secret, state: snap(r) } })
    }
    if (parts[0] === 'mine') return route.fulfill({ json: { rooms: [...S.rooms.values()].filter((r) => r.ownerId === owner).map((r) => ({ id: r.id, title: r.title, page: r.page, participants: r.participants.size, online: 0 })), max: 3 } })
    if (parts[0] === 'join') {
      const r = S.rooms.get(S.invites.get(b.invite))
      if (!r) return route.fulfill({ status: 404, json: { code: 'invalid_invite' } })
      const p = add(r, b.name, false)
      r.seq++
      return route.fulfill({ json: { room: r.id, pid: p.pid, secret: p.secret, state: snap(r) } })
    }
    const r = S.rooms.get(parts[0])
    if (!r) return route.fulfill({ status: 404, json: { code: 'not_found' } })
    if (parts[1] === 'events') {
      const tk = S.tickets.get(url.searchParams.get('t'))
      S.tickets.delete(url.searchParams.get('t'))
      const p = tk && r.participants.get(tk)
      if (!p) return route.fulfill({ status: 403, json: { code: 'forbidden' } })
      p.seen = Date.now()
      return route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store' }, body: `retry: 300\n\nevent: state\ndata: ${JSON.stringify(snap(r))}\n\n` })
    }
    const p = r.participants.get(b.pid)
    if (!p || p.secret !== b.secret) return route.fulfill({ status: 403, json: { code: 'forbidden' } })
    if (parts[1] === 'ticket') { const t = sec(); S.tickets.set(t, p.pid); return route.fulfill({ json: { ticket: t } }) }
    if (parts[1] === 'action') {
      S.actions.push({ by: p.name, ...b, secret: undefined })
      if (b.type === 'page') { if (!p.host && !r.anyoneTurns) return route.fulfill({ status: 403, json: { code: 'host_only' } }); r.page = b.page; r.highlight = null }
      else if (b.type === 'highlight') { if (!p.host) return route.fulfill({ status: 403, json: { code: 'host_only' } }); r.highlight = b.ayah || null }
      else if (b.type === 'settings') r.anyoneTurns = Boolean(b.anyoneTurns)
      else if (b.type === 'leave' || b.type === 'close') { if (p.host) S.rooms.delete(r.id); else r.participants.delete(p.pid) }
      r.seq++
      return route.fulfill({ json: { ok: true, state: snap(r) } })
    }
    return route.fulfill({ status: 404, json: { code: 'not_found' } })
  })
}

// ── Ailə dairəsi ──
export const FAMILY_TOKEN = 'T'.repeat(43)
export function createFamilyServer() {
  return { circle: null, members: [], shares: {}, cards: [], invites: [], csrfMissing: [], bodies: {}, nextId: 1 }
}
export async function attachFamily(page, S, me) {
  const view = () => {
    const mine = S.members.find((m) => m.id === me.id)
    if (!S.circle || !mine) return null
    return {
      id: 1, role: mine.role, max: 8,
      members: S.members.map((m) => ({ id: m.id, label: m.label, role: m.role, joinedAt: 1, self: m.id === me.id, share: S.shares[m.id] || null })),
      invites: mine.role === 'owner' ? S.invites.map((i) => ({ id: i.id, createdAt: 1, expiresAt: Date.now() + 7 * 864e5 })) : [],
    }
  }
  await page.route((u) => u.pathname === '/api/family' || u.pathname.startsWith('/api/family/'), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const b = body(req)
    S.bodies[`${me.id} ${method} ${pathname}`] = b
    if (!csrfOk(req)) { S.csrfMissing.push(pathname); return route.fulfill({ status: 403, json: { code: 'forbidden' } }) }
    const ok = (json = { ok: true }, status = 200) => route.fulfill({ status, json })
    if (pathname === '/api/family' && method === 'GET') {
      return ok({ circle: view(), cards: S.cards.filter((c) => c.to === me.id).map((c) => ({ ...c })), share: S.shares[me.id] || null, consent: Boolean(S.shares[me.id]), limits: {} })
    }
    if (pathname === '/api/family' && method === 'POST') {
      S.circle = { owner: me.id }
      S.members.push({ id: me.id, label: me.label, role: 'owner' })
      return ok({ circle: view() }, 201)
    }
    if (pathname === '/api/family/invites' && method === 'POST') { S.invites.push({ id: S.nextId++ }); return ok({ id: S.nextId - 1, token: FAMILY_TOKEN, expiresAt: Date.now() + 7 * 864e5 }, 201) }
    if (pathname === '/api/family/join/preview') return b.token === FAMILY_TOKEN && S.invites.length ? ok({ ownerLabel: S.members[0].label, members: S.members.length, inCircle: false, same: false }) : ok({ code: 'invalid_token' }, 404)
    if (pathname === '/api/family/join') {
      if (b.token !== FAMILY_TOKEN || !S.invites.length) return ok({ code: 'invalid_token' }, 404)
      S.invites.shift()
      S.members.push({ id: me.id, label: me.label, role: 'member' })
      return ok({ circle: view() })
    }
    if (pathname === '/api/family/share' && method === 'PUT') {
      if (!S.shares[me.id] && b.consent !== true) return ok({ code: 'consent_required' }, 400)
      S.shares[me.id] = { fields: b.fields, stats: b.stats, updatedAt: Date.now() }
      return ok({ share: S.shares[me.id] })
    }
    if (pathname === '/api/family/cards' && method === 'POST') {
      const c = { id: S.nextId++, to: b.to, from: me.label, fromId: me.id, template: b.template, n: b.n ?? null, createdAt: Date.now(), seen: false }
      S.cards.push(c)
      return ok({ card: c }, 201)
    }
    if (pathname === '/api/family/cards/seen') { for (const c of S.cards) if (b.ids.includes(c.id) && c.to === me.id) c.seen = true; return ok() }
    return ok({ code: 'not_found' }, 404)
  })
}

// ── Məni yoxla ──
export const CHECK_TOKEN = 'K'.repeat(43)
export function createCheckServer() { return { tests: [], csrfMissing: [], bodies: {} } }
export async function attachChecks(page, S) {
  await page.route((u) => u.pathname === '/api/hifz-tests' || u.pathname.startsWith('/api/hifz-tests/'), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const b = body(req)
    S.bodies[`${method} ${pathname}`] = b
    if (!csrfOk(req)) { S.csrfMissing.push(pathname); return route.fulfill({ status: 403, json: { code: 'forbidden' } }) }
    if (pathname === '/api/hifz-tests' && method === 'POST') {
      const t = { id: S.tests.length + 1, surah: b.surah, from: b.from, to: b.to, name: b.name, createdAt: Date.now(), expiresAt: Date.now() + 864e5, status: 'open', result: null }
      S.tests.push(t)
      return route.fulfill({ status: 201, json: { test: t, token: CHECK_TOKEN } })
    }
    if (pathname === '/api/hifz-tests' && method === 'GET') return route.fulfill({ json: { tests: [...S.tests].reverse(), max: 10 } })
    const t = S.tests[S.tests.length - 1]
    if (pathname === '/api/hifz-tests/open') {
      if (b.token !== CHECK_TOKEN || !t) return route.fulfill({ status: 404, json: { code: 'invalid_token' } })
      return route.fulfill({ json: { surah: t.surah, from: t.from, to: t.to, name: t.name, expiresAt: t.expiresAt, submitted: t.status === 'done' } })
    }
    if (pathname === '/api/hifz-tests/submit') {
      if (b.token !== CHECK_TOKEN || !t) return route.fulfill({ status: 404, json: { code: 'invalid_token' } })
      if (t.status === 'done') return route.fulfill({ status: 409, json: { code: 'already_submitted' } })
      t.status = 'done'
      t.result = { marks: b.marks, submittedAt: Date.now() }
      return route.fulfill({ json: { ok: true } })
    }
    return route.fulfill({ status: 404, json: { code: 'not_found' } })
  })
}
