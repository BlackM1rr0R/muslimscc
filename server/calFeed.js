// ═══════════════════════════════════════════════════════════════════════
// Şəxsi təqvim axını — webcal:// abunəliyi (I4)
//
// • İstifadəçi axını açır: gizli token (32 bayt = 256 bit), bazada YALNIZ SHA-256; token bir dəfə
//   göstərilir (itsə — "yenilə": köhnə URL dərhal işləməz), istənilən vaxt ləğv olunur.
// • GET /api/cal/<token>.ics — GİRİŞSİZ (təqvim proqramları cookie göndərmir). Yalnız istifadəçinin
//   SEÇDİYİ kateqoriyalar: mərhumların ildönümləri (+ Cümə), zəkat ili, gələcək məktubların açılış günü
//   (yalnız "Gələcək özünə məktub" — mətn YOX), sünnə orucları (saytın təqvimi ilə eyni qayda —
//   src/components/calendar/CalSunnahFasts.jsx → fastStatus; Şəvvalın altı günü daxil deyil),
//   qrup çağırışlarının günləri (server/challenges.js). Başqa şəxsi məlumat yoxdur.
// • Hamısı bütün-gün hadisələridir (VALUE=DATE) — saat qurşağı (VTIMEZONE) lazım deyil.
// • URL heç yerdə yazılmır: Express loglamır, xəta logunda yol yoxdur; nginx `location ^~ /api/cal/`
//   üçün access_log off. Cavab: Cache-Control private, X-Robots-Tag noindex, Referrer-Policy no-referrer.
//
// Cədvəl MİQRASİYASIZ (CREATE TABLE IF NOT EXISTS), users(id) ON DELETE CASCADE.
//
//   GET    /api/cal-feed        (girişli) → { enabled, cats, lang, createdAt, available }
//   POST   /api/cal-feed        (girişli) { cats, lang?, consent? } → 201 { token, cats } — yarat / yenilə (köhnə URL ölür)
//   PATCH  /api/cal-feed        (girişli) { cats?, lang? } → { enabled, cats }
//   DELETE /api/cal-feed        (girişli) → ləğv
//   GET    /api/cal/:token.ics  → text/calendar
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const hijri = require('./hijri')
const { icsEscape, foldLine } = require('./ics')
const { nextAnniversary, hawlDue } = require('./personal')
const { templateLabel } = require('./challenges')

const CATS = ['loved', 'friday', 'zakat', 'letters', 'fasts', 'challenges']
const FILE_RE = /^([A-Za-z0-9_-]{43})\.ics$/
const DAY = 86400000
const PAST_DAYS = 30
const AHEAD_DAYS = 400
const FAST_AHEAD = 120

const T = {
  az: {
    cal: 'Muslims.cc — şəxsi təqvim', anniv: (name, n) => `${name} — ${n} il`, annivDesc: 'Bu gün ildönümüdür. Onu dualarınızda yad edin.',
    friday: 'Cümə — sevdiklərinizi duada yad edin', zakat: 'Zəkat ili tamamlanır', zakatAlarm: 'Zəkat ilinə 7 gün qalıb',
    letter: 'Gələcək özünə məktub açılır', challenge: (s) => `Çağırış: ${s}`, fast: 'Sünnə orucu',
    kinds: { mon: 'bazar ertəsi', thu: 'cümə axşamı', bid: 'ağ günlər', tasua: 'Tasua', ashura: 'Aşura', arafah: 'Ərəfə günü' },
  },
  en: {
    cal: 'Muslims.cc — my calendar', anniv: (name, n) => `${name} — ${n} ${n === 1 ? 'year' : 'years'}`, annivDesc: 'Today is the anniversary. Remember them in your duas.',
    friday: 'Friday — remember your loved ones in dua', zakat: 'Zakat year completes', zakatAlarm: 'Your zakat year completes in 7 days',
    letter: 'A letter to your future self opens', challenge: (s) => `Challenge: ${s}`, fast: 'Sunnah fast',
    kinds: { mon: 'Monday', thu: 'Thursday', bid: 'white days', tasua: 'Tasu‘a', ashura: 'Ashura', arafah: 'Day of Arafah' },
  },
  ru: {
    cal: 'Muslims.cc — мой календарь', anniv: (name, n) => `${name} — ${n}-я годовщина`, annivDesc: 'Сегодня годовщина. Вспомните их в своих дуа.',
    friday: 'Пятница — вспомните близких в дуа', zakat: 'Завершается год закята', zakatAlarm: 'До завершения года закята — 7 дней',
    letter: 'Открывается письмо себе в будущее', challenge: (s) => `Челлендж: ${s}`, fast: 'Желательный пост',
    kinds: { mon: 'понедельник', thu: 'четверг', bid: 'белые дни', tasua: 'Тасуа', ashura: 'Ашура', arafah: 'день Арафа' },
  },
  tr: {
    cal: 'Muslims.cc — kişisel takvim', anniv: (name, n) => `${name} — ${n}. yıl`, annivDesc: 'Bugün yıl dönümü. Onu dualarınızda anın.',
    friday: 'Cuma — sevdiklerinizi duada anın', zakat: 'Zekât yılı doluyor', zakatAlarm: 'Zekât yılınızın dolmasına 7 gün var',
    letter: 'Geleceğe mektup açılıyor', challenge: (s) => `Meydan okuma: ${s}`, fast: 'Sünnet oruç',
    kinds: { mon: 'pazartesi', thu: 'perşembe', bid: 'beyaz günler', tasua: 'Tasua', ashura: 'Aşure', arafah: 'Arefe günü' },
  },
  ar: {
    cal: 'Muslims.cc — تقويمي', anniv: (name, n) => `${name} — ${n}`, annivDesc: 'اليوم ذكرى الوفاة. اذكره في دعائك.',
    friday: 'الجمعة — اذكر أحبّتك في الدعاء', zakat: 'يتمّ حول الزكاة', zakatAlarm: 'بقي ٧ أيام على تمام حول زكاتك',
    letter: 'تُفتح رسالتك إلى نفسك في المستقبل', challenge: (s) => `تحدٍّ: ${s}`, fast: 'صيام سنة',
    kinds: { mon: 'الاثنين', thu: 'الخميس', bid: 'الأيام البيض', tasua: 'تاسوعاء', ashura: 'عاشوراء', arafah: 'يوم عرفة' },
  },
}
const textsOf = (lang) => T[lang] || T.en

const SCHEMA = `
CREATE TABLE IF NOT EXISTS cal_feeds (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  cats       TEXT NOT NULL,
  lang       TEXT NOT NULL DEFAULT 'en',
  consent_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
`

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const keyOf = (ms) => new Date(ms).toISOString().slice(0, 10)
function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  return keyOf(Date.UTC(y, m - 1, d, 12) + n * DAY)
}
const icsDate = (key) => key.replace(/-/g, '')
const weekday = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() }

/**
 * Saytın təqvimindəki fastStatus-un (src/components/calendar/CalSunnahFasts.jsx) SURƏTİ — h: { month, day },
 * wd: həftə günü (0 = bazar). 'ramadan' | 'haram' | səbəblər massivi. tests/unit/server-cal-feed.test.js
 * iki funksiyanın eyni nəticə verdiyini yoxlayır.
 */
function fastStatus(h, wd) {
  const { month: m, day: d } = h
  if (m === 9) return 'ramadan'
  if ((m === 10 && d === 1) || (m === 12 && d >= 10 && d <= 13)) return 'haram'
  const r = []
  if (m === 1 && d === 9) r.push('tasua')
  if (m === 1 && d === 10) r.push('ashura')
  if (m === 12 && d === 9) r.push('arafah')
  if (m === 10 && d >= 2) r.push('shawwal')
  if (d >= 13 && d <= 15 && m !== 12) r.push('bid')
  if (wd === 1) r.push('mon')
  if (wd === 4) r.push('thu')
  return r
}
// Axına düşən səbəblər: Şəvvalın altı günü (bütün ay uyğundur — 28 hadisə səs-küydür) daxil deyil
const FEED_FASTS = ['arafah', 'ashura', 'tasua', 'bid', 'mon', 'thu']

/** Kateqoriya seçimi → { cat: bool } | null (ən azı biri açıq) */
function validCats(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const out = {}
  for (const k of Object.keys(v)) if (!CATS.includes(k) || typeof v[k] !== 'boolean') return null
  for (const c of CATS) out[c] = v[c] === true
  return Object.values(out).some(Boolean) ? out : null
}

/**
 * Hadisələr → ICS. events: [{ uid, date:'YYYY-MM-DD', end?:'YYYY-MM-DD' (daxil), summary, description?, rrule?, alarm? }]
 */
function buildFeedIcs({ name, events, now = new Date() }) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const L = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//muslims.cc//personal-feed//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(name)}`, `NAME:${icsEscape(name)}`, 'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H',
  ]
  for (const e of events) {
    L.push('BEGIN:VEVENT', `UID:${e.uid}@muslims.cc`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(e.date)}`, `DTEND;VALUE=DATE:${icsDate(addDays(e.end || e.date, 1))}`,
      `SUMMARY:${icsEscape(e.summary)}`)
    if (e.description) L.push(`DESCRIPTION:${icsEscape(e.description)}`)
    if (e.rrule) L.push(`RRULE:${e.rrule}`)
    L.push('TRANSP:TRANSPARENT')
    if (e.alarm) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(e.alarm.text)}`, `TRIGGER:${e.alarm.trigger}`, 'END:VALARM')
    L.push('END:VEVENT')
  }
  L.push('END:VCALENDAR')
  return L.map(foldLine).join('\r\n') + '\r\n'
}

function createCalFeedRouter({ db, requireUser, challengesOf = () => [], publicOrigin = 'https://muslims.cc', now = () => Date.now(), log = console }) {
  const raw = db.raw || db
  raw.exec(SCHEMA)
  const p = (sql) => raw.prepare(sql)
  const st = {
    get: p('SELECT * FROM cal_feeds WHERE user_id = ?'),
    byHash: p('SELECT f.*, u.disabled FROM cal_feeds f JOIN users u ON u.id = f.user_id WHERE f.token_hash = ?'),
    upsert: p(`INSERT INTO cal_feeds (user_id, token_hash, cats, lang, consent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET token_hash = excluded.token_hash, cats = excluded.cats, lang = excluded.lang,
        created_at = excluded.created_at, updated_at = excluded.updated_at`),
    update: p('UPDATE cal_feeds SET cats = ?, lang = ?, updated_at = ? WHERE user_id = ?'),
    del: p('DELETE FROM cal_feeds WHERE user_id = ?'),
  }
  // Şəxsi xatırlatmaların cədvəlləri (server/personal.js) — yoxdursa boş
  const q = (sql) => { let s = null; return (...a) => { try { s = s || p(sql); return s.all(...a) } catch { return [] } } }
  const src = {
    loved: q('SELECT id, name, passed_on, calendar, friday FROM personal_loved WHERE user_id = ? ORDER BY id LIMIT 50'),
    zakat: q('SELECT due_on FROM personal_zakat WHERE user_id = ?'),
    letters: q("SELECT id, deliver_on FROM personal_letters WHERE user_id = ? AND status IN ('pending','sending') ORDER BY deliver_on LIMIT 50"),
  }
  const router = express.Router()
  const json = express.json({ limit: '2kb' })
  const auth = requireUser()
  const err = (res, status, code, error = 'Request failed') => res.status(status).json({ error, code })
  const validLang = (l) => (typeof l === 'string' && /^[a-z]{2,3}$/.test(l) ? l : null)
  const out = (r) => (r ? { enabled: true, cats: JSON.parse(r.cats), lang: r.lang, createdAt: r.created_at } : { enabled: false, cats: null, lang: null, createdAt: null })

  /** Bir istifadəçinin hadisələri (saf — test üçün də) */
  function eventsFor(uid, cats, lang, ms = now()) {
    const X = textsOf(lang)
    const today = keyOf(ms)
    const from = addDays(today, -PAST_DAYS), until = addDays(today, AHEAD_DAYS)
    const uidOf = (...parts) => sha256(`${uid}:${parts.join(':')}`).slice(0, 24)
    const pre = lang === 'az' ? '' : `/${['en', 'ru', 'tr', 'ar'].includes(lang) ? lang : 'en'}`
    const events = []
    const loved = cats.loved || cats.friday ? src.loved(uid) : []
    if (cats.loved) {
      for (const l of loved) {
        let cursor = from
        for (let i = 0; i < 3; i++) {
          const a = nextAnniversary(l.passed_on, l.calendar, cursor)
          if (!a || a.date > until) break
          events.push({ uid: uidOf('loved', l.id, a.date), date: a.date, summary: X.anniv(l.name, a.n), description: `${X.annivDesc}\n${publicOrigin}${pre}/learn/janazah#ls-prayer` })
          cursor = addDays(a.date, 1)
        }
      }
    }
    if (cats.friday && loved.some((l) => l.friday === 1)) {
      let d = addDays(today, -7)
      while (weekday(d) !== 5) d = addDays(d, 1)
      events.push({ uid: uidOf('friday'), date: d, summary: X.friday, rrule: 'FREQ=WEEKLY;BYDAY=FR' })
    }
    if (cats.zakat) {
      for (const z of src.zakat(uid)) {
        const dates = [z.due_on]
        const next = hawlDue(z.due_on, addDays(z.due_on, 1))
        if (next) dates.push(next)
        for (const d of dates) if (d >= from && d <= until) events.push({ uid: uidOf('zakat', d), date: d, summary: X.zakat, description: `${publicOrigin}${pre}/zakat`, alarm: { text: X.zakatAlarm, trigger: '-P7D' } })
      }
    }
    if (cats.letters) {
      for (const l of src.letters(uid)) if (l.deliver_on >= from && l.deliver_on <= until) events.push({ uid: uidOf('letter', l.id), date: l.deliver_on, summary: X.letter })
    }
    if (cats.fasts) {
      for (let i = -7; i <= FAST_AHEAD; i++) {
        const d = addDays(today, i)
        const s = fastStatus(hijri.gregorianToHijri(hijri.parseGKey(d)), weekday(d))
        const kinds = Array.isArray(s) ? s.filter((k) => FEED_FASTS.includes(k)) : []
        if (kinds.length) events.push({ uid: uidOf('fast', d), date: d, summary: `${X.fast} — ${kinds.map((k) => X.kinds[k]).join(', ')}` })
      }
    }
    if (cats.challenges) {
      for (const c of challengesOf(uid) || []) {
        if (c.endOn < from || c.startOn > until) continue
        events.push({ uid: uidOf('challenge', c.id), date: c.startOn, end: c.endOn, summary: X.challenge(templateLabel(c, lang)), description: `${publicOrigin}${pre}/together#c=${c.id}` })
      }
    }
    return events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  }

  router.use('/cal-feed', (req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

  router.get('/cal-feed', auth, (req, res) => res.json({ ...out(st.get.get(req.user.id)), available: CATS }))

  router.post('/cal-feed', auth, json, (req, res) => {
    const b = req.body || {}
    const cur = st.get.get(req.user.id)
    if (!cur && b.consent !== true) return err(res, 400, 'consent_required', 'Consent required')
    const cats = b.cats == null && cur ? JSON.parse(cur.cats) : validCats(b.cats)
    if (!cats) return err(res, 400, 'bad_request', 'Choose at least one category')
    const lang = b.lang == null ? (cur ? cur.lang : 'en') : validLang(b.lang)
    if (!lang) return err(res, 400, 'bad_request', 'Invalid lang')
    const token = crypto.randomBytes(32).toString('base64url')
    const t = now()
    st.upsert.run(req.user.id, sha256(token), JSON.stringify(cats), lang, t, t, t)
    res.status(201).json({ token, ...out(st.get.get(req.user.id)) })
  })

  router.patch('/cal-feed', auth, json, (req, res) => {
    const cur = st.get.get(req.user.id)
    if (!cur) return err(res, 404, 'not_found', 'Feed is off')
    const b = req.body || {}
    const cats = b.cats == null ? JSON.parse(cur.cats) : validCats(b.cats)
    if (!cats) return err(res, 400, 'bad_request', 'Choose at least one category')
    const lang = b.lang == null ? cur.lang : validLang(b.lang)
    if (!lang) return err(res, 400, 'bad_request', 'Invalid lang')
    st.update.run(JSON.stringify(cats), lang, now(), req.user.id)
    res.json(out(st.get.get(req.user.id)))
  })

  router.delete('/cal-feed', auth, (req, res) => {
    st.del.run(req.user.id)
    res.json({ ok: true })
  })

  // ── Girişsiz axın. URL (token) heç yerə yazılmır. ──
  router.get('/cal/:file', (req, res) => {
    res.set({ 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' })
    const m = FILE_RE.exec(req.params.file || '')
    const row = m ? st.byHash.get(sha256(m[1])) : null
    if (!row || row.disabled) return res.status(404).set('Cache-Control', 'no-store').type('text/plain').send('not found')
    let cats
    try { cats = JSON.parse(row.cats) } catch { cats = {} }
    let body
    try {
      body = buildFeedIcs({ name: textsOf(row.lang).cal, events: eventsFor(row.user_id, cats, row.lang), now: new Date(now()) })
    } catch (e) {
      log.error('cal feed build:', e && e.message)
      return res.status(500).set('Cache-Control', 'no-store').type('text/plain').send('error')
    }
    res.set('Content-Type', 'text/calendar; charset=utf-8')
    res.set('Content-Disposition', 'inline; filename="muslims-cc.ics"')
    res.set('Cache-Control', 'private, max-age=1800')
    res.send(body)
  })

  // eslint-disable-next-line no-unused-vars
  router.use('/cal-feed', (e, req, res, next) => {
    const status = e && (e.status || e.statusCode)
    if (status === 413) return err(res, 413, 'too_large', 'Payload too large')
    if (status === 400) return err(res, 400, 'bad_request', 'Invalid JSON')
    log.error('cal-feed error:', e && e.message)
    err(res, 500, 'server_error', 'Server error')
  })

  router.eventsFor = eventsFor
  /** "Mənim məlumatlarım": axın açıqdırmı, kateqoriyalar (token heşi YOX) */
  router.exportUser = (uid) => out(st.get.get(uid))
  router.summaryUser = (uid) => ({ enabled: Boolean(st.get.get(uid)) })
  return router
}

module.exports = { createCalFeedRouter, buildFeedIcs, fastStatus, validCats, CATS, FEED_FASTS }
