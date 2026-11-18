// Server: müəllim sinfi (server/classes.js) — giriş + CSRF, dəvət tokeni (yalnız SHA-256, yenilənir),
// şablon tapşırıqlar (surə/ayə, Mushaf səhifəsi, son tarix), müəllim FƏRDİ vəziyyəti YALNIZ şagirdin
// razılığı ilə görür, şagird başqa şagirdləri görmür, "Məni yoxla" (server/hifzTest.js) şagirdin adına,
// həddlər, CASCADE, ixrac.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startApp, require, ORIGIN } from './server-together-helpers.js'

const cl = require('../../server/classes.js')
const ht = require('../../server/hifzTest.js')

const clock = Date.UTC(2026, 10, 18, 9, 0)

describe('classes HTTP', () => {
  let A, router
  beforeAll(async () => {
    A = await startApp((app, { db, requireUser }) => {
      const hifz = ht.createHifzTestRouter({ db, requireUser, allowedOrigins: [ORIGIN], now: () => clock })
      app.use('/api', hifz)
      router = cl.createClassesRouter({ db, requireUser, hifzTests: hifz, now: () => clock })
      app.use('/api', router)
    })
  })
  afterAll(() => A.close())

  const json = (r) => r.json()
  const mkClass = async (t, name = 'Hifz sinfi') => json(await A.call('/api/classes', { cookie: t.cookie, body: { name } }))
  const join = (u, token, consent) => A.call('/api/classes/join', { cookie: u.cookie, body: { token, ...(consent == null ? {} : { consent }) } })
  const asg = (t, id, body) => A.call(`/api/classes/${id}/assignments`, { cookie: t.cookie, body: { kind: 'memorize', surah: 67, from: 1, to: 10, dueOn: '2026-11-25', ...body } })
  const view = async (u, id) => json(await A.get(`/api/classes/${id}`, u.cookie))

  it('giriş (401), CSRF (403), ad yoxlaması, müəllim həddi', async () => {
    expect((await A.get('/api/classes')).status).toBe(401)
    const t = await A.signup('Ustad')
    expect((await A.call('/api/classes', { cookie: t.cookie, headers: { 'content-type': 'application/json' }, body: { name: 'x' } })).status).toBe(403)
    expect((await A.call('/api/classes', { cookie: t.cookie, body: { name: '' } })).status).toBe(400)
    expect((await A.call('/api/classes', { cookie: t.cookie, body: { name: 'x'.repeat(61) } })).status).toBe(400)
    for (let i = 0; i < cl.MAX_TEACHING; i++) expect((await A.call('/api/classes', { cookie: t.cookie, body: { name: `S${i}` } })).status).toBe(201)
    expect((await json(await A.call('/api/classes', { cookie: t.cookie, body: { name: 'çox' } }))).code).toBe('too_many')
    const list = await json(await A.get('/api/classes', t.cookie))
    expect(list.teaching).toHaveLength(cl.MAX_TEACHING)
    expect(list.learning).toEqual([])
  })

  it('dəvət: yalnız həş, yenilənir; müəllim öz sinfinə qoşula bilmir; şagird görünüşü', async () => {
    const t = await A.signup('Müəllim Əli'), s = await A.signup('Şagird'), s2 = await A.signup('İkinci')
    const c = await mkClass(t)
    expect(c.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const row = A.db.raw.prepare('SELECT * FROM classes WHERE id = ?').get(c.class.id)
    expect(JSON.stringify(row)).not.toContain(c.token)
    expect(row.invite_hash).toMatch(/^[0-9a-f]{64}$/)
    expect((await json(await join(t, c.token))).code).toBe('self')
    const pv = await json(await A.call('/api/classes/join/preview', { cookie: s.cookie, body: { token: c.token } }))
    expect(pv).toMatchObject({ class: { name: 'Hifz sinfi', teacher: 'Müəllim Əli', students: 0 }, already: false, teacher: false })
    expect((await join(s, c.token, 'yes')).status).toBe(400)
    expect(await json(await join(s, c.token))).toEqual({ id: c.class.id, already: false })
    expect((await A.call(`/api/classes/${c.class.id}/invite`, { cookie: s.cookie })).status).toBe(403)
    const { token } = await json(await A.call(`/api/classes/${c.class.id}/invite`, { cookie: t.cookie }))
    expect((await join(s2, c.token)).status).toBe(404)
    expect((await join(s2, token)).status).toBe(200)
    const v = await view(s, c.class.id)
    expect(v.class).toMatchObject({ role: 'student', teacher: 'Müəllim Əli', students: 2 })
    expect(JSON.stringify(v)).not.toContain('İkinci')
    expect(JSON.stringify(v)).not.toContain(s2.email)
    const out = await A.signup()
    expect((await A.get(`/api/classes/${c.class.id}`, out.cookie)).status).toBe(404)
  })

  it('tapşırıq yoxlaması (növ, surə/ayə, səhifə ≤604, son tarix); yalnız müəllim', async () => {
    const t = await A.signup(), s = await A.signup()
    const c = await mkClass(t)
    await join(s, c.token)
    const id = c.class.id
    const code = async (body) => (await json(await asg(t, id, body))).code
    expect(await code({ kind: 'chat' })).toBe('bad_kind')
    expect(await code({ surah: 115 })).toBe('bad_range')
    expect(await code({ surah: 67, to: 31 })).toBe('bad_range')        // Mülk — 30 ayə
    expect(await code({ from: 5, to: 4 })).toBe('bad_range')
    expect(await code({ kind: 'read', surah: undefined, from: 600, to: 605 })).toBe('bad_range')
    expect(await code({ dueOn: '2026-11-16' })).toBe('bad_date')
    expect(await code({ dueOn: '2027-12-01' })).toBe('bad_date')
    expect((await asg(t, id, { surah: 67, to: 30 })).status).toBe(201)
    const r = await json(await asg(t, id, { kind: 'read', from: 1, to: 20, surah: 2 }))
    expect(r.assignment).toMatchObject({ kind: 'read', surah: null, from: 1, to: 20 })
    expect((await asg(s, id, {})).status).toBe(403)
    expect((await A.call(`/api/classes/${id}`, { method: 'PATCH', cookie: s.cookie, body: { note: 'salam' } })).status).toBe(403)
    // müəllimin qeydi ≤200
    expect((await A.call(`/api/classes/${id}`, { method: 'PATCH', cookie: t.cookie, body: { note: 'x'.repeat(201) } })).status).toBe(400)
    expect((await json(await A.call(`/api/classes/${id}`, { method: 'PATCH', cookie: t.cookie, body: { note: 'Cümə dərsi saat 18-də' } }))).class.note).toBe('Cümə dərsi saat 18-də')
    expect((await view(s, id)).class.note).toBe('Cümə dərsi saat 18-də')
    // silmə
    expect((await A.call(`/api/classes/${id}/assignments/${r.assignment.id}`, { method: 'DELETE', cookie: s.cookie })).status).toBe(403)
    expect((await A.call(`/api/classes/${id}/assignments/${r.assignment.id}`, { method: 'DELETE', cookie: t.cookie })).status).toBe(200)
  })

  it('müəllim fərdi vəziyyəti YALNIZ razılıqla görür; doneCount yalnız paylaşanlardan', async () => {
    const t = await A.signup('T'), a = await A.signup('Aişə'), b = await A.signup('Bilal')
    const c = await mkClass(t)
    const id = c.class.id
    await join(a, c.token, true)     // qoşularkən razılıq
    await join(b, c.token)           // razılıq yoxdur
    const { assignment } = await json(await asg(t, id, {}))
    const done = (u, d = true) => A.call(`/api/classes/${id}/assignments/${assignment.id}/done`, { cookie: u.cookie, body: { done: d } })
    expect((await done(t)).status).toBe(403)        // müəllim "etdim" deyə bilmir
    expect((await A.call(`/api/classes/${id}/assignments/${assignment.id}/done`, { cookie: a.cookie, body: { done: 1 } })).status).toBe(400)
    expect((await json(await done(a))).assignments[0].done).toBe(true)
    expect((await done(b)).status).toBe(200)

    let tv = await view(t, id)
    const sa = tv.students.find((x) => x.id === a.id), sb = tv.students.find((x) => x.id === b.id)
    expect(sa).toMatchObject({ label: 'Aişə', sharing: true, done: [assignment.id] })
    expect(sb).toMatchObject({ label: 'Bilal', sharing: false })
    expect(sb).not.toHaveProperty('done')
    expect(sb).not.toHaveProperty('stats')
    expect(tv.assignments[0].doneCount).toBe(1)     // Bilal etdi, amma paylaşmır — sayılmır
    expect(tv.class.sharing).toBe(1)

    // Bilal paylaşır: əvvəl razılıq lazımdır
    const share = (u, body) => A.call(`/api/classes/${id}/share`, { method: 'PUT', cookie: u.cookie, body })
    expect((await json(await share(b, { stats: { hifzAyahs: 40 } }))).code).toBe('consent_required')
    expect((await share(b, { consent: true, stats: { secret: 1 } })).status).toBe(400)
    expect((await share(b, { consent: true, stats: { hifzAyahs: -1 } })).status).toBe(400)
    expect((await share(t, { consent: true, stats: {} })).status).toBe(403)
    const sv = await json(await share(b, { consent: true, stats: { hifzAyahs: 40, quranDaysWeek: 5 } }))
    expect(sv).toMatchObject({ consent: true, share: { stats: { hifzAyahs: 40, quranDaysWeek: 5 } } })
    tv = await view(t, id)
    expect(tv.students.find((x) => x.id === b.id)).toMatchObject({ sharing: true, done: [assignment.id], stats: { hifzAyahs: 40, quranDaysWeek: 5 } })
    expect(tv.assignments[0].doneCount).toBe(2)
    // dayandırır → rəqəmlər silinir, fərdi vəziyyət gizlənir
    expect((await json(await A.call(`/api/classes/${id}/share`, { method: 'DELETE', cookie: b.cookie }))).consent).toBe(false)
    tv = await view(t, id)
    expect(tv.students.find((x) => x.id === b.id)).not.toHaveProperty('stats')
    expect(A.db.raw.prepare('SELECT stats FROM class_members WHERE class_id = ? AND user_id = ?').get(id, b.id).stats).toBe(null)
    expect(tv.assignments[0].doneCount).toBe(1)
    // şagird görünüşündə başqa şagird yoxdur
    const av = JSON.stringify(await view(a, id))
    expect(av).not.toContain('Bilal')
    expect(av).not.toContain('doneCount')
    // geri götürmək
    expect((await json(await done(a, false))).assignments[0].done).toBe(false)
  })

  it('"Məni yoxla": müəllim şagird üçün yaradır — keçid şagirdin adına; müəllim vəziyyəti görür', async () => {
    const t = await A.signup('Ustad'), s = await A.signup('Hafiz'), x = await A.signup()
    const c = await mkClass(t)
    const id = c.class.id
    await join(s, c.token)
    const mk = (body) => A.call(`/api/classes/${id}/tests`, { cookie: t.cookie, body: { studentId: s.id, surah: 1, from: 1, to: 7, ...body } })
    expect((await mk({ studentId: x.id })).status).toBe(404)
    expect((await mk({ surah: 1, to: 8 })).status).toBe(400)
    expect((await A.call(`/api/classes/${id}/tests`, { cookie: s.cookie, body: { studentId: s.id, surah: 1, from: 1, to: 7 } })).status).toBe(403)
    const r = await mk({})
    expect(r.status).toBe(201)
    const { token, test } = await json(r)
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(test).toMatchObject({ status: 'open', surah: 1, from: 1, to: 7 })
    // şagirdin /hifz siyahısında
    const mine = await json(await A.get('/api/hifz-tests', s.cookie))
    expect(mine.tests.map((q) => q.id)).toContain(test.id)
    expect(mine.tests.find((q) => q.id === test.id).name).toBe('Hafiz')
    expect((await json(await A.get('/api/hifz-tests', t.cookie))).tests).toEqual([])
    // müəllim yoxlayan kimi göndərir
    expect((await A.call('/api/hifz-tests/submit', { body: { token, marks: [{ a: 2, kind: 'mistake' }] } })).status).toBe(200)
    const tv = await view(t, id)
    expect(tv.students.find((q) => q.id === s.id).tests).toEqual([expect.objectContaining({ id: test.id, status: 'done', surah: 1 })])
    expect(JSON.stringify(tv)).not.toContain('mistake')   // müəllim görünüşündə işarələr yoxdur
  })

  it('şagirdi çıxarmaq, çıxmaq, sinfi silmək; hesab silinəndə CASCADE; ixrac / xülasə', async () => {
    const t = await A.signup(), s1 = await A.signup(), s2 = await A.signup()
    const c = await mkClass(t)
    const id = c.class.id
    await join(s1, c.token, true); await join(s2, c.token)
    const { assignment } = await json(await asg(t, id, {}))
    await A.call(`/api/classes/${id}/assignments/${assignment.id}/done`, { cookie: s1.cookie, body: { done: true } })
    expect(router.summaryUser(s1.id)).toEqual({ teaching: 0, learning: 1 })
    const ex = router.exportUser(s1.id)
    expect(ex.learning[0].assignments[0].done).toBe(true)
    expect(JSON.stringify(router.exportUser(t.id))).not.toMatch(/invite_hash|token/)

    expect((await A.call(`/api/classes/${id}/me`, { method: 'DELETE', cookie: t.cookie })).status).toBe(403)
    expect((await A.call(`/api/classes/${id}/students/${s2.id}`, { method: 'DELETE', cookie: s1.cookie })).status).toBe(403)
    expect((await A.call(`/api/classes/${id}/students/${s2.id}`, { method: 'DELETE', cookie: t.cookie })).status).toBe(200)
    expect((await A.get(`/api/classes/${id}`, s2.cookie)).status).toBe(404)
    expect((await A.del(s1)).status).toBe(200)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM class_done WHERE user_id = ?').get(s1.id).n).toBe(0)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM class_members WHERE user_id = ?').get(s1.id).n).toBe(0)
    await join(s2, c.token)
    expect((await A.call(`/api/classes/${id}/me`, { method: 'DELETE', cookie: s2.cookie })).status).toBe(200)
    const c2 = await mkClass(t)
    expect((await A.call(`/api/classes/${c2.class.id}`, { method: 'DELETE', cookie: t.cookie })).status).toBe(200)
    expect((await A.del(t)).status).toBe(200)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM classes WHERE teacher_id = ?').get(t.id).n).toBe(0)
    expect(A.db.raw.prepare('SELECT COUNT(*) AS n FROM class_assignments WHERE class_id = ?').get(id).n).toBe(0)
  })

  it('saf funksiyalar: validStats, validAssignment', () => {
    expect(cl.validStats({ hifzAyahs: 3 })).toEqual({ hifzAyahs: 3 })
    expect(cl.validStats({ hifzAyahs: 3, x: 1 })).toBe(null)
    expect(cl.validStats({ quranDaysWeek: '1' })).toBe(null)
    expect(cl.validStats([])).toBe(null)
    expect(cl.validAssignment({ kind: 'review', surah: 2, from: 255, to: 257, dueOn: '2026-11-18' }, '2026-11-18')).toMatchObject({ surah: 2 })
    expect(cl.validAssignment({ kind: 'review', surah: 2, from: 255, to: 287, dueOn: '2026-11-18' }, '2026-11-18').error).toBe('bad_range')
  })
})
