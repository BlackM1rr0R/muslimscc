// ═══════════════════════════════════════════════════════
// E2E köməkçisi: şəxsi xatırlatmalar API-sinin (server/personal.js) saxta cavabları, yaddaşda.
// Real yoxlama (razılıq, həddlər, tarix, CSRF, token heşi) serverdədir və tests/unit/server-personal.test.js-də
// yoxlanır — burada yalnız UI axını. fixtures.js-dəki ümumi /api/personal marşrutundan SONRA qeyd olunur.
// ═══════════════════════════════════════════════════════

export const SHARE_TOKEN = 'S'.repeat(43)
export const INVITE_TOKEN = 'F'.repeat(43)

export async function fakePersonalApi(page, opts = {}) {
  const state = {
    consent: { letters: false, loved: false, zakat: false, ...(opts.consent || {}) },
    letters: [], loved: [], zakat: null, share: null, followers: [], following: [], lovedEmail: true,
    bodies: {}, requests: [], csrfMissing: [], nextId: 1,
  }
  const need = (feature, body) => {
    if (state.consent[feature]) return false
    if (body.consent === true) { state.consent[feature] = true; return false }
    return true
  }
  const bad = (route, code, status = 400) => route.fulfill({ status, json: { error: code, code } })

  await page.route((u) => u.pathname === '/api/personal' || u.pathname.startsWith('/api/personal/'), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()
    const key = `${method} ${pathname}`
    state.requests.push(key)
    let body = {}
    try { body = req.postDataJSON() || {} } catch { /* */ }
    state.bodies[key] = body
    if (method !== 'GET' && !req.headers()['x-requested-with']) { state.csrfMissing.push(key); return bad(route, 'forbidden', 403) }
    const seg = pathname.split('/').slice(3)          // ['letters', '1']
    const id = Number(seg[1])

    if (seg[0] === 'letters') {
      if (method === 'GET') return route.fulfill({ json: { letters: state.letters, consent: state.consent.letters, emailVerified: true, max: 50, maxLength: 4000 } })
      if (method === 'POST') {
        if (need('letters', body)) return bad(route, 'consent_required')
        const l = { id: state.nextId++, body: body.body, deliverOn: body.deliverOn, kind: body.kind, status: 'pending', createdAt: Date.now(), deliveredAt: null }
        state.letters.push(l)
        return route.fulfill({ status: 201, json: { letter: l } })
      }
      if (method === 'PATCH') { const l = state.letters.find((x) => x.id === id); Object.assign(l, body); return route.fulfill({ json: { letter: l } }) }
      if (method === 'DELETE') { state.letters = state.letters.filter((x) => x.id !== id); return route.fulfill({ json: { ok: true } }) }
    }
    if (seg[0] === 'loved') {
      if (seg[1] === 'share') {
        if (method === 'POST') { state.share = { createdAt: Date.now() }; return route.fulfill({ status: 201, json: { token: SHARE_TOKEN } }) }
        state.share = null; state.followers = []
        return route.fulfill({ json: { ok: true } })
      }
      if (method === 'GET') {
        return route.fulfill({ json: {
          items: state.loved, consent: state.consent.loved, emailVerified: true, lovedEmail: state.lovedEmail,
          share: { active: Boolean(state.share), createdAt: state.share?.createdAt || null, followers: state.followers },
          following: state.following, max: 50,
        } })
      }
      if (method === 'POST') {
        if (need('loved', body)) return bad(route, 'consent_required')
        const remind = body.remind || 'friday', monthDay = remind === 'monthly' ? body.monthDay : null
        const it = { id: state.nextId++, name: body.name, relation: body.relation || '', passedOn: body.passedOn || '', calendar: body.calendar || 'g', remind, monthDay, friday: remind === 'friday', note: body.note || '', nextOn: null }
        state.loved.push(it)
        return route.fulfill({ status: 201, json: { item: it } })
      }
      if (method === 'PATCH') { const it = state.loved.find((x) => x.id === id); Object.assign(it, body); return route.fulfill({ json: { item: it } }) }
      if (method === 'DELETE') { state.loved = state.loved.filter((x) => x.id !== id); return route.fulfill({ json: { ok: true } }) }
    }
    if (seg[0] === 'follow') {
      if (seg[1] === 'preview') return body.token === INVITE_TOKEN
        ? route.fulfill({ json: { ownerLabel: 'Fatimə', count: 2, self: false, following: false } })
        : bad(route, 'invalid_token', 404)
      if (method === 'POST') {
        if (need('loved', body)) return bad(route, 'consent_required')
        state.following.push({ ownerId: 7, ownerLabel: 'Fatimə', since: Date.now(), items: [{ id: 501, name: 'Nənəm Zəhra', relation: '', passedOn: '2019-04-02', calendar: 'h', remind: 'friday', monthDay: null, friday: true, nextOn: null }] })
        return route.fulfill({ status: 201, json: { ok: true, ownerId: 7, ownerLabel: 'Fatimə' } })
      }
      state.following = []
      return route.fulfill({ json: { ok: true } })
    }
    if (seg[0] === 'zakat') {
      if (method === 'GET') return route.fulfill({ json: { reminder: state.zakat, consent: state.consent.zakat, emailVerified: true } })
      if (method === 'PUT') {
        if (need('zakat', body)) return bad(route, 'consent_required')
        state.zakat = { hawlStart: body.hawlStart, dueOn: opts.zakatDue || '2027-11-06', amount: body.storeAmount ? body.amount : null, currency: body.storeAmount ? body.currency : null }
        return route.fulfill({ json: { reminder: state.zakat } })
      }
      state.zakat = null
      return route.fulfill({ json: { ok: true } })
    }
    if (seg[0] === 'prefs') { if (method === 'PATCH') state.lovedEmail = body.lovedEmail; return route.fulfill({ json: { ok: true } }) }
    if (seg[0] === 'push-link') return route.fulfill({ json: { linked: Boolean(body.on) } })
    if (pathname === '/api/personal' && method === 'DELETE') { state.letters = []; state.loved = []; state.zakat = null; return route.fulfill({ json: { ok: true } }) }
    return bad(route, 'not_found', 404)
  })
  return state
}
