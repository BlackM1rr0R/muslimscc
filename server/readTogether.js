// ═══════════════════════════════════════════════════════════════════════
// "Birlikdə Quran oxu" — real vaxtlı oxu otaqları (Mushaf səhifəsi üzrə)
//
// • Otağı YALNIZ daxil olmuş istifadəçi yaradır (requireUser); dəvət keçidi ilə
//   başqaları — hesablı və ya hesabsız (yalnız ləqəb) — qoşulur.
// • Aparıcı (host) səhifəni çevirir → hamının Mushafı həmin səhifəyə keçir; oxunan
//   ayəni işarələyir → hamıda parlayır. "Hər kəs vərəq çevirə bilər" seçimi var.
//   "Aparıcını izlə" klientdə hər iştirakçının öz seçimidir (serverdə saxlanmır).
// • Nəqliyyat: server → klient Server-Sent Events (SSE), klient → server POST.
//   Hər dəyişiklikdə otağın TAM vəziyyəti (kiçik JSON) bütün bağlantılara göndərilir —
//   yenidən qoşulan klient həmişə ilk mesajda tam vəziyyəti alır (itən hadisə yoxdur).
// • Otaqlar YALNIZ YADDAŞDADIR (API bir konteynerdir). Bazada heç nə saxlanmır;
//   API yenidən başlayanda otaqlar bağlanır (klient "otaq bitib" göstərir).
//   Son fəaliyyətdən 24 saat sonra otaq silinir.
// • Sirlər: dəvət tokeni (128 bit), iştirakçı sirri (128 bit), SSE bileti (128 bit,
//   birdəfəlik, 60 san) — yaddaşda da yalnız SHA-256 həşi saxlanır, loga yazılmır.
//   EventSource başlıq göndərə bilmir, ona görə sirr URL-ə qoyulmur: klient əvvəlcə
//   POST ilə qısaömürlü bilet alır, GET …/events?t=<bilet> onu dərhal "yandırır"
//   (nginx loguna düşsə də təkrar istifadə olunmur).
// • Həddlər: istifadəçi başına 3 aktiv otaq, otaqda 30 iştirakçı, iştirakçı başına 3 SSE
//   bağlantısı, cəmi 500 otaq / 3000 bağlantı; IP üzrə qoşulma və yaratma limiti; iştirakçı
//   başına əməliyyat limiti (dəqiqədə 120).
// • Məxfilik: yalnız iştirakçının yazdığı ləqəb; IP yalnız yaddaşdakı limit sayğacında.
//
//   POST /api/read-together/rooms            (girişli)  { title?, page?, anyoneTurns?, name? } → 201 { room, invite, pid, secret, state }
//   GET  /api/read-together/mine             (girişli)  → { rooms: [{ id, title, page, online, participants, createdAt }] }
//   POST /api/read-together/rooms/:id/reclaim(girişli)  → { pid, secret, invite, state } — aparıcı başqa cihazda
//   POST /api/read-together/join             { invite, name } → { room, pid, secret, state }
//   POST /api/read-together/:id/ticket       { pid, secret } → { ticket }
//   GET  /api/read-together/:id/events?t=…   → text/event-stream (event: state | kicked | closed)
//   POST /api/read-together/:id/action       { pid, secret, type, … } → { ok, state?, invite? }
//        type: page {page} · highlight {ayah|null} · settings {anyoneTurns?, title?} · kick {target}
//              · invite (yeni dəvət keçidi; köhnəsi işləmir) · leave · close
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const { csrfRejected } = require('./auth')

const MUSHAF_PAGES = 604
const MAX_ROOMS = 500
const MAX_ROOMS_PER_USER = 3
const MAX_PARTICIPANTS = 30
const MAX_CONN_PER_PARTICIPANT = 3
const MAX_CONN_TOTAL = 3000
const MAX_TITLE = 60
const MAX_NAME = 40
const IDLE_MS = 24 * 3600e3
const TICKET_MS = 60e3
const KEEPALIVE_MS = 25e3
const SWEEP_MS = 60e3
const LIMITS = {
  create: { max: 10, windowMs: 3600e3 },     // istifadəçi üzrə
  join: { max: 30, windowMs: 10 * 60e3 },    // IP üzrə
  ticket: { max: 60, windowMs: 60e3 },       // IP üzrə (yenidən qoşulmalar)
  action: { max: 120, windowMs: 60e3 },      // iştirakçı üzrə
}
// Hər surənin ayə sayı (Kufə sayı) — işarələnən ayə açarının yoxlanması üçün
const AYAHS = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6]

const ROOM_RE = /^[a-z0-9]{10}$/
const PID_RE = /^[a-z0-9]{8}$/
const SECRET_RE = /^[A-Za-z0-9_-]{22}$/
const CTRL_RE = /[\p{Cc}‎‏‪-‮⁦-⁩]/gu
const cleanLine = (v, max) => (typeof v === 'string' ? [...v.normalize('NFC').replace(CTRL_RE, '').replace(/\s+/g, ' ').trim()].slice(0, max).join('') : '')
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const secret = () => crypto.randomBytes(16).toString('base64url')   // 128 bit → 22 simvol
const ABC = 'abcdefghijklmnopqrstuvwxyz0123456789'
function randId(len) {
  let s = ''
  while (s.length < len) for (const b of crypto.randomBytes(len * 2)) { if (b < 252 && s.length < len) s += ABC[b % 36] }
  return s
}
function sameHash(value, h) {
  if (typeof value !== 'string' || !SECRET_RE.test(value) || typeof h !== 'string') return false
  const a = Buffer.from(sha256(value), 'hex'), b = Buffer.from(h, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
/** '2:255' → normal açar | null */
function ayahKey(v) {
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(String(v || ''))
  if (!m) return null
  const s = Number(m[1]), a = Number(m[2])
  return s >= 1 && s <= 114 && a >= 1 && a <= AYAHS[s - 1] ? `${s}:${a}` : null
}
const validPage = (p) => Number.isInteger(p) && p >= 1 && p <= MUSHAF_PAGES

function createReadTogetherRouter({ requireUser, allowedOrigins = [], now = () => Date.now(), limits = LIMITS, sweepMs = SWEEP_MS, keepaliveMs = KEEPALIVE_MS } = {}) {
  const router = express.Router()
  const json = express.json({ limit: '2kb' })
  const auth = requireUser()
  const rooms = new Map()      // id → room
  const invites = new Map()    // sha256(invite) → room id
  const tickets = new Map()    // sha256(ticket) → { room, pid, exp }
  let connCount = 0

  // ── Limit sayğacları (yalnız yaddaşda) ──
  const buckets = Object.fromEntries(Object.keys(limits).map((k) => [k, new Map()]))
  function limited(kind, key) {
    const { max, windowMs } = limits[kind]
    const map = buckets[kind]
    const t = now()
    const list = (map.get(key) || []).filter((x) => t - x < windowMs)
    const over = list.length >= max
    if (!over) list.push(t)
    map.set(key, list)
    if (map.size > 20000) map.clear()
    return over
  }
  const err = (res, status, code) => res.status(status).json({ error: code, code })
  const csrf = (req, res, next) => (csrfRejected(req, allowedOrigins) ? err(res, 403, 'forbidden') : next())
  const body = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {})

  // ── Vəziyyət ──
  function snapshot(room) {
    return {
      id: room.id, title: room.title, page: room.page, highlight: room.highlight, anyoneTurns: room.anyoneTurns,
      seq: room.seq, createdAt: room.createdAt,
      participants: [...room.participants.values()].map((p) => ({ pid: p.pid, name: p.name, host: p.host, online: p.conns.size > 0 })),
    }
  }
  function send(res, event, data) {
    try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`) } catch { /* bağlantı qırılıb */ }
  }
  function broadcast(room) {
    room.seq++
    const s = snapshot(room)
    for (const p of room.participants.values()) for (const res of p.conns) send(res, 'state', s)
  }
  function endConns(p, event) {
    for (const res of [...p.conns]) {
      send(res, event, {})
      try { res.end() } catch { /* */ }
    }
  }
  function closeRoom(room) {
    if (!rooms.has(room.id)) return
    rooms.delete(room.id)
    invites.delete(room.inviteHash)
    for (const p of room.participants.values()) endConns(p, 'closed')
  }
  const touch = (room) => { room.lastActivity = now() }

  function addParticipant(room, name, host) {
    let pid
    do { pid = randId(8) } while (room.participants.has(pid))
    const s = secret()
    room.participants.set(pid, { pid, name, host, secretHash: sha256(s), joinedAt: now(), conns: new Set() })
    return { pid, secret: s }
  }
  function rotateInvite(room) {
    const inv = secret()
    invites.delete(room.inviteHash)
    room.inviteHash = sha256(inv)
    invites.set(room.inviteHash, room.id)
    return inv
  }
  const roomsOf = (userId) => [...rooms.values()].filter((r) => r.ownerId === userId)

  /** :id + { pid, secret } → { room, p } | null (cavab artıq göndərilib) */
  function member(req, res) {
    const room = ROOM_RE.test(req.params.id || '') ? rooms.get(req.params.id) : null
    if (!room) { err(res, 404, 'not_found'); return null }
    const b = body(req)
    const p = PID_RE.test(String(b.pid || '')) ? room.participants.get(b.pid) : null
    if (!p || !sameHash(b.secret, p.secretHash)) { err(res, 403, 'forbidden'); return null }
    return { room, p }
  }

  router.use('/read-together', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  // ── Yaratma (girişli) ──
  router.post('/read-together/rooms', auth, json, (req, res) => {
    const uid = req.user.id
    if (limited('create', `u${uid}`)) return err(res, 429, 'rate_limited')
    const b = body(req)
    const page = b.page == null ? 1 : Number(b.page)
    if (!validPage(page)) return err(res, 400, 'bad_page')
    if (b.anyoneTurns != null && typeof b.anyoneTurns !== 'boolean') return err(res, 400, 'bad_request')
    const name = cleanLine(b.name, MAX_NAME) || cleanLine(req.user.display_name, MAX_NAME) || 'Host'
    if (roomsOf(uid).length >= MAX_ROOMS_PER_USER) return err(res, 409, 'too_many')
    if (rooms.size >= MAX_ROOMS) return err(res, 503, 'full')
    let id
    do { id = randId(10) } while (rooms.has(id))
    const t = now()
    const room = {
      id, ownerId: uid, title: cleanLine(b.title, MAX_TITLE), page, highlight: null, anyoneTurns: b.anyoneTurns === true,
      createdAt: t, lastActivity: t, seq: 0, inviteHash: '', participants: new Map(),
    }
    rooms.set(id, room)
    const invite = rotateInvite(room)
    const host = addParticipant(room, name, true)
    res.status(201).json({ room: id, invite, ...host, state: snapshot(room) })
  })

  router.get('/read-together/mine', auth, (req, res) => {
    res.json({
      rooms: roomsOf(req.user.id).map((r) => ({
        id: r.id, title: r.title, page: r.page, createdAt: r.createdAt,
        participants: r.participants.size, online: [...r.participants.values()].filter((p) => p.conns.size).length,
      })),
      max: MAX_ROOMS_PER_USER,
    })
  })

  // Aparıcı başqa cihazda / yaddaşı itib: sahib (hesab) aparıcı sirrini yeniləyir, yeni dəvət alır
  router.post('/read-together/rooms/:id/reclaim', auth, (req, res) => {
    const room = ROOM_RE.test(req.params.id || '') ? rooms.get(req.params.id) : null
    if (!room || room.ownerId !== req.user.id) return err(res, 404, 'not_found')
    const host = [...room.participants.values()].find((p) => p.host)
    const s = secret()
    host.secretHash = sha256(s)
    endConns(host, 'kicked')   // köhnə cihazdakı aparıcı bağlantıları
    const invite = rotateInvite(room)
    touch(room)
    res.json({ room: room.id, pid: host.pid, secret: s, invite, state: snapshot(room) })
  })

  // ── Qoşulma (hesabsız da) ──
  router.post('/read-together/join', csrf, json, (req, res) => {
    if (limited('join', req.ip || '')) return err(res, 429, 'rate_limited')
    const b = body(req)
    const id = typeof b.invite === 'string' && SECRET_RE.test(b.invite) ? invites.get(sha256(b.invite)) : null
    const room = id ? rooms.get(id) : null
    if (!room) return err(res, 404, 'invalid_invite')
    const name = cleanLine(b.name, MAX_NAME)
    if (!name) return err(res, 400, 'bad_name')
    if (room.participants.size >= MAX_PARTICIPANTS) return err(res, 409, 'room_full')
    const me = addParticipant(room, name, false)
    touch(room)
    broadcast(room)
    res.json({ room: room.id, ...me, state: snapshot(room) })
  })

  // ── SSE bileti + axın ──
  router.post('/read-together/:id/ticket', csrf, json, (req, res) => {
    if (limited('ticket', req.ip || '')) return err(res, 429, 'rate_limited')
    const m = member(req, res); if (!m) return
    const t = secret()
    tickets.set(sha256(t), { room: m.room.id, pid: m.p.pid, exp: now() + TICKET_MS })
    res.json({ ticket: t })
  })

  router.get('/read-together/:id/events', (req, res) => {
    const t = String(req.query.t || '')
    const key = SECRET_RE.test(t) ? sha256(t) : ''
    const tk = key && tickets.get(key)
    if (tk) tickets.delete(key)   // birdəfəlik
    const room = tk && tk.room === req.params.id && tk.exp > now() ? rooms.get(tk.room) : null
    const p = room ? room.participants.get(tk.pid) : null
    if (!p) return err(res, 403, 'forbidden')
    if (p.conns.size >= MAX_CONN_PER_PARTICIPANT || connCount >= MAX_CONN_TOTAL) return err(res, 429, 'too_many_connections')
    res.status(200).set({
      'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no', Connection: 'keep-alive',
    })
    res.flushHeaders?.()
    res.write('retry: 3000\n\n')
    const wasOnline = p.conns.size > 0
    p.conns.add(res)
    connCount++
    touch(room)
    if (wasOnline) send(res, 'state', snapshot(room))
    else broadcast(room)   // iştirakçı "onlayn" oldu — hamı görsün (yeni bağlantı da daxil)
    const ka = setInterval(() => { try { res.write(': k\n\n') } catch { /* */ } }, keepaliveMs)
    if (ka.unref) ka.unref()
    let done = false
    const cleanup = () => {
      if (done) return
      done = true
      clearInterval(ka)
      connCount--
      p.conns.delete(res)
      if (!p.conns.size && rooms.get(room.id) === room && room.participants.get(p.pid) === p) broadcast(room)
    }
    req.on('close', cleanup)
    res.on('close', cleanup)
  })

  // ── Əməliyyatlar ──
  router.post('/read-together/:id/action', csrf, json, (req, res) => {
    const m = member(req, res); if (!m) return
    const { room, p } = m
    if (limited('action', `${room.id}:${p.pid}`)) return err(res, 429, 'rate_limited')
    const b = body(req)
    const hostOnly = () => { if (!p.host) { err(res, 403, 'host_only'); return false } return true }
    switch (b.type) {
      case 'page': {
        if (!p.host && !room.anyoneTurns) return err(res, 403, 'host_only')
        const page = Number(b.page)
        if (!validPage(page)) return err(res, 400, 'bad_page')
        if (page !== room.page) { room.page = page; room.highlight = null }
        break
      }
      case 'highlight': {
        if (!hostOnly()) return
        if (b.ayah == null) room.highlight = null
        else {
          const k = ayahKey(b.ayah)
          if (!k) return err(res, 400, 'bad_ayah')
          room.highlight = k
        }
        break
      }
      case 'settings': {
        if (!hostOnly()) return
        if (b.anyoneTurns != null) {
          if (typeof b.anyoneTurns !== 'boolean') return err(res, 400, 'bad_request')
          room.anyoneTurns = b.anyoneTurns
        }
        if (b.title != null) room.title = cleanLine(b.title, MAX_TITLE)
        break
      }
      case 'kick': {
        if (!hostOnly()) return
        const target = PID_RE.test(String(b.target || '')) ? room.participants.get(b.target) : null
        if (!target || target.host) return err(res, 404, 'not_found')
        room.participants.delete(target.pid)
        endConns(target, 'kicked')
        break
      }
      case 'invite': {
        if (!hostOnly()) return
        const invite = rotateInvite(room)
        touch(room)
        return res.json({ ok: true, invite })
      }
      case 'leave': {
        if (p.host) { closeRoom(room); return res.json({ ok: true, closed: true }) }
        room.participants.delete(p.pid)
        endConns(p, 'kicked')
        break
      }
      case 'close': {
        if (!hostOnly()) return
        closeRoom(room)
        return res.json({ ok: true, closed: true })
      }
      default:
        return err(res, 400, 'bad_request')
    }
    touch(room)
    broadcast(room)
    res.json({ ok: true, state: snapshot(room) })
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/read-together', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large')
    if (status === 400) return err(res, 400, 'bad_request')
    console.error('read-together error:', e && e.message)
    err(res, 500, 'server_error')
  })

  // ── Təmizləmə: boş otaqlar 24 saatdan sonra, köhnə biletlər ──
  function sweep() {
    const t = now()
    let n = 0
    for (const room of [...rooms.values()]) {
      if (t - room.lastActivity > IDLE_MS) { closeRoom(room); n++ }
    }
    for (const [k, v] of tickets) if (v.exp <= t) tickets.delete(k)
    return n
  }
  const timer = sweepMs > 0 ? setInterval(sweep, sweepMs) : null
  if (timer && timer.unref) timer.unref()

  router.sweep = sweep
  router.rooms = rooms
  router.connections = () => connCount
  router.closeOwnerRooms = (userId) => { for (const r of roomsOf(userId)) closeRoom(r) }
  /** "Mənim məlumatlarım" (server/security.js): yalnız yaddaşdakı otaqların sayı (bazada heç nə yoxdur) */
  router.summaryUser = (userId) => ({ openRooms: roomsOf(userId).length })
  router.exportUser = (userId) => ({ openRooms: roomsOf(userId).length })
  router.shutdown = () => { if (timer) clearInterval(timer); for (const r of [...rooms.values()]) closeRoom(r) }
  return router
}

module.exports = {
  createReadTogetherRouter, ayahKey, cleanLine,
  MAX_ROOMS, MAX_ROOMS_PER_USER, MAX_PARTICIPANTS, MAX_CONN_PER_PARTICIPANT, IDLE_MS, TICKET_MS, LIMITS, AYAHS,
}
