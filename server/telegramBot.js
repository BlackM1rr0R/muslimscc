// ═══════════════════════════════════════════════════════════════════════
// Telegram botu — namaz vaxtları, növbəti namaz, günün ayəsi / hədisi, azan xatırlatması
//
//   POST /api/telegram/webhook
//     başlıq X-Telegram-Bot-Api-Secret-Token = TELEGRAM_WEBHOOK_SECRET (setWebhook → secret_token).
//     Sirr URL-də DEYİL: yol nginx / Cloudflare giriş jurnallarına düşür (başlıqlar düşmür).
//
// • TOKEN və ya SİRR yoxdursa (api.env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET) modul TAM SÖNÜLÜDÜR:
//   /api/telegram/* → 404, planlayıcı heç nə etmir, şəbəkəyə heç bir sorğu getmir.
// • Çıxış yalnız https://api.telegram.org (fetch + timeout) və vaxtlar üçün saytın öz mənbələri:
//   Azərbaycan — server/prayCalc.js (Əbu Bəkr məscidi, şəbəkəsiz), digər ölkələr — aladhan (metod 13,
//   saytdakı kimi: src/utils/prayerLocation.js → methodFor); ayə — alquran.cloud (push ilə eyni, daily-ayah.js);
//   hədis — server/daily-hadith-data.js (yalnız səhih Buxari / Müslim, saytdakı mətn).
// • Şəhər siyahısı — server/prayerCities.js (saytın src/data/prayerCities.js surəti).
// • Yalnız ŞƏXSİ söhbətlər (chat.type = private). Qruplar nəzərə alınmır.
// • Məxfilik: telegram_chats { chat_id, lang, city, remind, created_at } — başqa heç nə; mesaj mətni,
//   ad, istifadəçi adı, IP saxlanmır və loglanmır. Sətir yalnız şəhər seçiləndə yaranır; /stop və ya
//   botun bloklanması (403) onu dərhal silir.
// • Xatırlatma: hər namaz vaxtında (şəhərin öz saatı ilə) — server/pushClaims.js ilə bir dəfə
//   (kəsintisiz deploy zamanı yanaşı işləyən iki proses eyni mesajı iki dəfə göndərmir).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const crypto = require('node:crypto')
const express = require('express')
const prayCalc = require('./prayCalc')
const { PRAYERS, PUSH_TEXTS } = require('./prayer-utils')
const dailyAyah = require('./daily-ayah')
const dailyHadith = require('./daily-hadith')
const { COUNTRY_NAMES, PRAYER_CITIES } = require('./prayerCities')

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const API = 'https://api.telegram.org'
const TIMEOUT_MS = 10000
const WORLD_METHOD = 13          // saytdakı DEFAULT_METHOD (Diyanet) — Azərbaycandan başqa ölkələr
const CITY_PAGE = 24             // şəhər klaviaturası: 3 sütun × 8 sətir
const SEND_GAP_MS = 40           // Telegram: ~30 mesaj/san — toplu göndərişdə ara
const SECRET_RE = /^[A-Za-z0-9_-]{24,256}$/
const CITY_BY_ID = new Map(PRAYER_CITIES.map((c) => [c.id, c]))
const COUNTRIES = [...new Set(PRAYER_CITIES.map((c) => c.country))]
const ALL_TIMES = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

// saytın hədis kartındakı dərəcə adı (src/pages/HadithPage.jsx → GRADE_UI.s)
const SAHIH = { az: 'Səhih', en: 'Sahih', ru: 'Сахих', ar: 'صحيح', tr: 'Sahih' }
const SUNRISE = { az: 'Günəş', en: 'Sunrise', ru: 'Восход', ar: 'الشروق', tr: 'Güneş' }

const TEXT = {
  az: {
    welcome: 'Əssalamu aleykum! Bu, muslims.cc saytının botudur: namaz vaxtları, növbəti namaza qalan vaxt, günün ayəsi və hədisi, istəsəniz hər azan vaxtında xatırlatma.',
    consent: 'Şəhər seçsəniz, bot serverimizdə yalnız söhbət nömrənizi, dilinizi, şəhəri və xatırlatma seçimini saxlayır (şifrələnmədən). Mesajlarınız saxlanmır. /stop — hamısını silir.',
    chooseCountry: 'Ölkəni seçin:', chooseCity: (c) => `${c} — şəhəri seçin:`,
    citySet: (c) => `✅ Şəhər: ${c}`, noCity: 'Əvvəlcə şəhəri seçin — /city',
    next: (n, t, left) => `⏳ Növbəti namaz: ${n} — ${t} (${left} sonra)`, tomorrow: 'sabah',
    dur: (h, m) => (h ? `${h} saat ${m} dəq` : `${m} dəq`),
    remindOn: (c) => `🔔 Xatırlatma açıqdır: hər namaz vaxtında (${c}) mesaj gələcək.`, remindOff: '🔕 Xatırlatma söndürüldü.',
    remindUsage: 'İstifadə: /remind on və ya /remind off',
    stopped: 'Bütün məlumatlarınız silindi (şəhər, dil, xatırlatma seçimi). Yenidən başlamaq üçün — /start',
    help: 'Əmrlər: /times — bugünkü vaxtlar · /next — növbəti namaz · /ayah — günün ayəsi · /hadith — günün hədisi · /city — şəhər · /remind on|off — azan xatırlatması · /stop — məlumatı sil',
    failed: 'Məlumatı indi almaq olmadı. Bir azdan yenidən cəhd edin.',
    open: 'Saytda aç',
    b: { times: 'Namaz vaxtları', next: 'Növbəti namaz', ayah: 'Günün ayəsi', hadith: 'Günün hədisi', on: 'Xatırlatmanı aç', off: 'Xatırlatmanı söndür', city: 'Şəhəri dəyiş', back: '« Ölkələr', more: 'Daha »', prev: '« Əvvəlki' },
  },
  en: {
    welcome: 'Assalamu alaykum! This is the muslims.cc bot: prayer times, time left until the next prayer, the verse and hadith of the day and, if you like, a reminder at every adhan time.',
    consent: 'If you choose a city, the bot stores only your chat number, language, city and reminder choice on our server (unencrypted). Your messages are not stored. /stop deletes everything.',
    chooseCountry: 'Choose a country:', chooseCity: (c) => `${c} — choose a city:`,
    citySet: (c) => `✅ City: ${c}`, noCity: 'Choose a city first — /city',
    next: (n, t, left) => `⏳ Next prayer: ${n} — ${t} (in ${left})`, tomorrow: 'tomorrow',
    dur: (h, m) => (h ? `${h} h ${m} min` : `${m} min`),
    remindOn: (c) => `🔔 Reminders are on: you will get a message at every prayer time (${c}).`, remindOff: '🔕 Reminders are off.',
    remindUsage: 'Usage: /remind on or /remind off',
    stopped: 'All your data has been deleted (city, language, reminder choice). To start again — /start',
    help: 'Commands: /times — today’s times · /next — next prayer · /ayah — verse of the day · /hadith — hadith of the day · /city — city · /remind on|off — adhan reminder · /stop — delete data',
    failed: 'Could not get the data right now. Please try again in a moment.',
    open: 'Open on the site',
    b: { times: 'Prayer times', next: 'Next prayer', ayah: 'Verse of the day', hadith: 'Hadith of the day', on: 'Turn reminders on', off: 'Turn reminders off', city: 'Change city', back: '« Countries', more: 'More »', prev: '« Back' },
  },
  ru: {
    welcome: 'Ассаляму алейкум! Это бот сайта muslims.cc: время намаза, сколько осталось до следующего намаза, аят и хадис дня и, по желанию, напоминание в каждое время азана.',
    consent: 'Если вы выберете город, бот хранит на нашем сервере только номер чата, язык, город и настройку напоминаний (без шифрования). Ваши сообщения не сохраняются. /stop удаляет всё.',
    chooseCountry: 'Выберите страну:', chooseCity: (c) => `${c} — выберите город:`,
    citySet: (c) => `✅ Город: ${c}`, noCity: 'Сначала выберите город — /city',
    next: (n, t, left) => `⏳ Следующий намаз: ${n} — ${t} (через ${left})`, tomorrow: 'завтра',
    dur: (h, m) => (h ? `${h} ч ${m} мин` : `${m} мин`),
    remindOn: (c) => `🔔 Напоминания включены: сообщение придёт в каждое время намаза (${c}).`, remindOff: '🔕 Напоминания выключены.',
    remindUsage: 'Использование: /remind on или /remind off',
    stopped: 'Все ваши данные удалены (город, язык, настройка напоминаний). Чтобы начать снова — /start',
    help: 'Команды: /times — время на сегодня · /next — следующий намаз · /ayah — аят дня · /hadith — хадис дня · /city — город · /remind on|off — напоминание об азане · /stop — удалить данные',
    failed: 'Сейчас не удалось получить данные. Попробуйте чуть позже.',
    open: 'Открыть на сайте',
    b: { times: 'Время намаза', next: 'Следующий намаз', ayah: 'Аят дня', hadith: 'Хадис дня', on: 'Включить напоминания', off: 'Выключить напоминания', city: 'Сменить город', back: '« Страны', more: 'Ещё »', prev: '« Назад' },
  },
  tr: {
    welcome: 'Esselâmu aleyküm! Bu, muslims.cc sitesinin botudur: namaz vakitleri, sonraki namaza kalan süre, günün ayeti ve hadisi ve dilerseniz her ezan vaktinde hatırlatma.',
    consent: 'Bir şehir seçerseniz bot sunucumuzda yalnızca sohbet numaranızı, dilinizi, şehri ve hatırlatma tercihini saklar (şifrelenmeden). Mesajlarınız saklanmaz. /stop hepsini siler.',
    chooseCountry: 'Ülke seçin:', chooseCity: (c) => `${c} — şehir seçin:`,
    citySet: (c) => `✅ Şehir: ${c}`, noCity: 'Önce şehir seçin — /city',
    next: (n, t, left) => `⏳ Sonraki namaz: ${n} — ${t} (${left} sonra)`, tomorrow: 'yarın',
    dur: (h, m) => (h ? `${h} sa ${m} dk` : `${m} dk`),
    remindOn: (c) => `🔔 Hatırlatma açık: her namaz vaktinde (${c}) mesaj gelecek.`, remindOff: '🔕 Hatırlatma kapatıldı.',
    remindUsage: 'Kullanım: /remind on veya /remind off',
    stopped: 'Tüm verileriniz silindi (şehir, dil, hatırlatma tercihi). Yeniden başlamak için — /start',
    help: 'Komutlar: /times — bugünün vakitleri · /next — sonraki namaz · /ayah — günün ayeti · /hadith — günün hadisi · /city — şehir · /remind on|off — ezan hatırlatması · /stop — verileri sil',
    failed: 'Veriler şu anda alınamadı. Biraz sonra yeniden deneyin.',
    open: 'Sitede aç',
    b: { times: 'Namaz vakitleri', next: 'Sonraki namaz', ayah: 'Günün ayeti', hadith: 'Günün hadisi', on: 'Hatırlatmayı aç', off: 'Hatırlatmayı kapat', city: 'Şehri değiştir', back: '« Ülkeler', more: 'Daha »', prev: '« Geri' },
  },
  ar: {
    welcome: 'السلام عليكم! هذا بوت موقع muslims.cc: مواقيت الصلاة، والوقت المتبقي حتى الصلاة القادمة، وآية اليوم وحديث اليوم، وإن شئت تذكير عند كل أذان.',
    consent: 'إذا اخترت مدينة يحفظ البوت على خادمنا رقم المحادثة واللغة والمدينة وخيار التذكير فقط (دون تشفير). لا تُحفظ رسائلك. الأمر /stop يحذف كل شيء.',
    chooseCountry: 'اختر الدولة:', chooseCity: (c) => `${c} — اختر المدينة:`,
    citySet: (c) => `✅ المدينة: ${c}`, noCity: 'اختر المدينة أولًا — /city',
    next: (n, t, left) => `⏳ الصلاة القادمة: ${n} — ${t} (بعد ${left})`, tomorrow: 'غدًا',
    dur: (h, m) => (h ? `${h} س ${m} د` : `${m} د`),
    remindOn: (c) => `🔔 التذكير مفعّل: ستصلك رسالة عند كل وقت صلاة (${c}).`, remindOff: '🔕 تم إيقاف التذكير.',
    remindUsage: 'الاستخدام: /remind on أو /remind off',
    stopped: 'حُذفت جميع بياناتك (المدينة واللغة وخيار التذكير). للبدء من جديد — /start',
    help: 'الأوامر: /times — مواقيت اليوم · /next — الصلاة القادمة · /ayah — آية اليوم · /hadith — حديث اليوم · /city — المدينة · /remind on|off — تذكير الأذان · /stop — حذف البيانات',
    failed: 'تعذّر جلب البيانات الآن. حاول بعد قليل.',
    open: 'افتح في الموقع',
    b: { times: 'مواقيت الصلاة', next: 'الصلاة القادمة', ayah: 'آية اليوم', hadith: 'حديث اليوم', on: 'تفعيل التذكير', off: 'إيقاف التذكير', city: 'تغيير المدينة', back: '« الدول', more: 'المزيد »', prev: '« السابق' },
  },
}

// Bot menyusu (setMyCommands) — scripts/telegram-setup.js
const COMMANDS = {
  az: [['times', 'Bugünkü namaz vaxtları'], ['next', 'Növbəti namaz'], ['ayah', 'Günün ayəsi'], ['hadith', 'Günün hədisi'], ['city', 'Şəhəri seç'], ['remind', 'Xatırlatma: on / off'], ['stop', 'Məlumatımı sil']],
  en: [['times', 'Today’s prayer times'], ['next', 'Next prayer'], ['ayah', 'Verse of the day'], ['hadith', 'Hadith of the day'], ['city', 'Choose city'], ['remind', 'Reminders: on / off'], ['stop', 'Delete my data']],
  ru: [['times', 'Время намаза на сегодня'], ['next', 'Следующий намаз'], ['ayah', 'Аят дня'], ['hadith', 'Хадис дня'], ['city', 'Выбрать город'], ['remind', 'Напоминания: on / off'], ['stop', 'Удалить мои данные']],
  tr: [['times', 'Bugünün namaz vakitleri'], ['next', 'Sonraki namaz'], ['ayah', 'Günün ayeti'], ['hadith', 'Günün hadisi'], ['city', 'Şehir seç'], ['remind', 'Hatırlatma: on / off'], ['stop', 'Verilerimi sil']],
  ar: [['times', 'مواقيت صلاة اليوم'], ['next', 'الصلاة القادمة'], ['ayah', 'آية اليوم'], ['hadith', 'حديث اليوم'], ['city', 'اختيار المدينة'], ['remind', 'التذكير: on / off'], ['stop', 'حذف بياناتي']],
}

/** Telegram language_code ('pt-br', 'ru', 'az') → 5 dildən biri; yoxdursa en */
function langOf(code) {
  const l = String(code || '').toLowerCase().slice(0, 2)
  return LANGS.includes(l) ? l : 'en'
}

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** '/times@MyBot extra' → { cmd:'times', arg:'extra' } | null. Yalnız ASCII əmr adları. */
function parseCommand(text, botUsername = '') {
  const m = /^\/([a-z_]{1,32})(?:@([A-Za-z0-9_]{1,64}))?(?:\s+([\s\S]*))?$/i.exec(String(text || '').trim())
  if (!m) return null
  if (m[2] && botUsername && m[2].toLowerCase() !== String(botUsername).toLowerCase()) return null
  return { cmd: m[1].toLowerCase(), arg: String(m[3] || '').trim().toLowerCase().slice(0, 32) }
}

/** Callback data allowlist: co · cn:<ÖLKƏ>:<səhifə> · ci:<şəhər id> · do:<əmr> */
function parseCallback(data) {
  const s = String(data || '')
  if (s.length > 64) return null
  if (s === 'co') return { type: 'countries' }
  let m = /^cn:([A-Z]{2}):(\d{1,2})$/.exec(s)
  if (m && COUNTRY_NAMES[m[1]]) return { type: 'country', country: m[1], page: Number(m[2]) }
  m = /^ci:(.{1,40})$/.exec(s)
  if (m && CITY_BY_ID.has(m[1])) return { type: 'city', id: m[1] }
  m = /^do:(times|next|ayah|hadith|on|off|city)$/.exec(s)
  if (m) return { type: 'do', cmd: m[1] }
  return null
}

/** Saat qurşağında an → { dateKey, ddmmyyyy, hhmm, friday } (prayer-utils.nowIn, amma saat verilə bilir) */
function nowAt(tz, ms) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false,
  }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  return {
    dateKey: `${p.year}-${p.month}-${p.day}`,
    ddmmyyyy: `${p.day}-${p.month}-${p.year}`,
    hhmm: `${p.hour === '24' ? '00' : p.hour}:${p.minute}`,
    friday: p.weekday === 'Fri',
  }
}
const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m }
const nextDdmmyyyy = (ddmmyyyy) => {
  const [d, m, y] = ddmmyyyy.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d) + 864e5)
  return `${String(t.getUTCDate()).padStart(2, '0')}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${t.getUTCFullYear()}`
}

/** Bugünkü vaxtlara görə növbəti namaz: { key, time, tomorrow, minutes } */
function nextPrayer(times, hhmm, tomorrowFajr) {
  const now = toMin(hhmm)
  for (const [key] of PRAYERS) {
    if (times[key] && toMin(times[key]) > now) return { key, time: times[key], tomorrow: false, minutes: toMin(times[key]) - now }
  }
  if (!tomorrowFajr) return null
  return { key: 'fajr', time: tomorrowFajr, tomorrow: true, minutes: 24 * 60 - now + toMin(tomorrowFajr) }
}

function createTelegramBot({
  db, token = '', secret = '', fetchImpl = (...a) => fetch(...a), now = () => Date.now(),
  claims = null, publicOrigin = 'https://muslims.cc', log = console, sendGapMs = SEND_GAP_MS,
} = {}) {
  const enabled = Boolean(token && secret && SECRET_RE.test(secret) && /^\d{5,16}:[A-Za-z0-9_-]{20,100}$/.test(token))
  if ((token || secret) && !enabled) log.warn('Telegram bot: TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET formatı yararsızdır — bot sönülüdür')
  const origin = String(publicOrigin || 'https://muslims.cc').replace(/\/+$/, '')
  const raw = db.raw || db
  raw.exec(`CREATE TABLE IF NOT EXISTS telegram_chats (
    chat_id INTEGER PRIMARY KEY,
    lang TEXT NOT NULL,
    city TEXT NOT NULL,
    remind INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`)
  const q = {
    get: raw.prepare('SELECT chat_id, lang, city, remind FROM telegram_chats WHERE chat_id = ?'),
    upsertCity: raw.prepare(`INSERT INTO telegram_chats (chat_id, lang, city, remind, created_at) VALUES (?, ?, ?, 0, ?)
      ON CONFLICT(chat_id) DO UPDATE SET city = excluded.city, lang = excluded.lang`),
    setLang: raw.prepare('UPDATE telegram_chats SET lang = ? WHERE chat_id = ? AND lang <> ?'),
    setRemind: raw.prepare('UPDATE telegram_chats SET remind = ? WHERE chat_id = ?'),
    del: raw.prepare('DELETE FROM telegram_chats WHERE chat_id = ?'),
    reminders: raw.prepare('SELECT chat_id, lang, city FROM telegram_chats WHERE remind = 1'),
  }
  const sent = claims || require('./pushClaims').createPushClaims(db, { log }).set()
  const timesCache = new Map()   // `${cityId}|${ddmmyyyy}` → { times } | { failedAt }
  const ayahCache = new Map()    // ref → { data, at } | { failedAt }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  // ── Telegram API (token heç vaxt loglanmır: URL çap olunmur) ──
  async function api(method, payload) {
    if (!enabled) return null
    for (let attempt = 0; attempt < 2; attempt++) {
      let r, j
      try {
        r = await fetchImpl(`${API}/bot${token}/${method}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        j = await r.json().catch(() => null)
      } catch (e) {
        log.error(`telegram ${method}:`, e && e.name)
        return null
      }
      if (j && j.ok) return j.result
      const code = (j && j.error_code) || r.status
      if (code === 429 && attempt === 0) {
        const wait = Math.min(30, Number(j && j.parameters && j.parameters.retry_after) || 1)
        await sleep(wait * 1000)
        continue
      }
      // İstifadəçi botu bloklayıb / söhbət yoxdur → onun qeydini sil (artıq lazım deyil)
      if ((code === 403 || (code === 400 && /chat not found/i.test(String(j && j.description)))) && payload && payload.chat_id) {
        try { q.del.run(payload.chat_id) } catch { /* */ }
      }
      log.error(`telegram ${method}: ${code}`)
      return null
    }
    return null
  }

  // ── Namaz vaxtları (sayt ilə eyni mənbə) ──
  async function computeDay(city, ddmmyyyy) {
    const [d, m, y] = ddmmyyyy.split('-').map(Number)
    if (city.country === 'AZ') {
      const t = prayCalc.computeTimes({ year: y, month: m, day: d }, city.lat, city.lng,
        prayCalc.tzOffsetHours(city.tz, y, m, d), prayCalc.CALC_METHODS.abubakr)
      return ALL_TIMES.every((k) => t[k]) ? Object.fromEntries(ALL_TIMES.map((k) => [k, t[k]])) : null
    }
    const url = `https://api.aladhan.com/v1/timings/${ddmmyyyy}?latitude=${city.lat}&longitude=${city.lng}` +
      `&${prayCalc.aladhanMethodQuery(WORLD_METHOD)}&timezonestring=${encodeURIComponent(city.tz)}`
    try {
      const r = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!r.ok) return null
      const t = (await r.json())?.data?.timings
      if (!t) return null
      const out = {}
      for (const k of ALL_TIMES) out[k] = String(t[k[0].toUpperCase() + k.slice(1)] || '').slice(0, 5)
      return ALL_TIMES.every((k) => /^\d{2}:\d{2}$/.test(out[k])) ? out : null
    } catch (e) {
      log.error('telegram aladhan:', e && e.name)
      return null
    }
  }

  async function timesFor(city, ddmmyyyy) {
    const k = `${city.id}|${ddmmyyyy}`
    const c = timesCache.get(k)
    if (c && c.times) return c.times
    if (c && c.failedAt && now() - c.failedAt < 5 * 60e3) return null
    const times = await computeDay(city, ddmmyyyy)
    timesCache.set(k, times ? { times, at: now() } : { failedAt: now() })
    if (timesCache.size > 600) {
      for (const [ck, v] of timesCache) if (now() - (v.at || v.failedAt) > 2 * 864e5) timesCache.delete(ck)
    }
    return times
  }

  // ── Günün ayəsi (push planlayıcısı ilə eyni seçim və mənbə) ──
  async function ayahData(pick) {
    const c = ayahCache.get(pick.ref)
    if (c && c.data) return c.data
    if (c && c.failedAt && now() - c.failedAt < 2 * 60e3) return null
    const parts = []
    for (let a = pick.a; a <= pick.to; a++) {
      try {
        const r = await fetchImpl(dailyAyah.ayahApiUrl(pick.s, a), { signal: AbortSignal.timeout(TIMEOUT_MS) })
        parts.push(r.ok ? dailyAyah.parseAyahResponse(await r.json(), pick.s, a) : null)
      } catch { parts.push(null) }
    }
    const data = dailyAyah.mergeAyahParts(parts)
    ayahCache.set(pick.ref, data ? { data, at: now() } : { failedAt: now() })
    for (const [k, v] of ayahCache) if (v.at && now() - v.at > 2 * 864e5) ayahCache.delete(k)
    return data
  }

  // ── Mətnlər və klaviaturalar ──
  const cityName = (city, L) => city.label[L] || city.label.en
  const nameOf = (key, L) => (key === 'sunrise' ? SUNRISE[L] : PUSH_TEXTS[L].names[key])
  const btn = (text, data) => ({ text, callback_data: data })
  const menu = (L, row) => {
    const b = TEXT[L].b
    return { inline_keyboard: [
      [btn(b.times, 'do:times'), btn(b.next, 'do:next')],
      [btn(b.ayah, 'do:ayah'), btn(b.hadith, 'do:hadith')],
      [row && row.remind ? btn(b.off, 'do:off') : btn(b.on, 'do:on'), btn(b.city, 'do:city')],
    ] }
  }
  const countriesKb = (L) => {
    const rows = []
    for (let i = 0; i < COUNTRIES.length; i += 2) {
      rows.push(COUNTRIES.slice(i, i + 2).map((c) => btn(COUNTRY_NAMES[c][L] || COUNTRY_NAMES[c].en, `cn:${c}:0`)))
    }
    return { inline_keyboard: rows }
  }
  const citiesKb = (L, country, page) => {
    const list = PRAYER_CITIES.filter((c) => c.country === country)
      .sort((a, b) => (a.id === 'Baku' ? -1 : b.id === 'Baku' ? 1 : 0))
    const pages = Math.max(1, Math.ceil(list.length / CITY_PAGE))
    const p = Math.min(Math.max(0, page), pages - 1)
    const slice = list.slice(p * CITY_PAGE, (p + 1) * CITY_PAGE)
    const rows = []
    for (let i = 0; i < slice.length; i += 3) rows.push(slice.slice(i, i + 3).map((c) => btn(cityName(c, L), `ci:${c.id}`)))
    const nav = [btn(TEXT[L].b.back, 'co')]
    if (p > 0) nav.push(btn(TEXT[L].b.prev, `cn:${country}:${p - 1}`))
    if (p < pages - 1) nav.push(btn(TEXT[L].b.more, `cn:${country}:${p + 1}`))
    rows.push(nav)
    return { inline_keyboard: rows }
  }
  const linkKb = (L, url) => ({ inline_keyboard: [[{ text: TEXT[L].open, url }]] })

  const send = (chatId, text, extra = {}) => api('sendMessage', {
    chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra,
  })

  async function timesText(L, city) {
    const t = nowAt(city.tz, now())
    const times = await timesFor(city, t.ddmmyyyy)
    if (!times) return null
    const [y, m, d] = t.dateKey.split('-')
    const lines = ALL_TIMES.map((k) => `${esc(nameOf(k, L))} — <b>${times[k]}</b>`)
    return `🕌 <b>${esc(cityName(city, L))}</b> · ${d}.${m}.${y}\n\n${lines.join('\n')}`
  }

  async function nextText(L, city) {
    const t = nowAt(city.tz, now())
    const times = await timesFor(city, t.ddmmyyyy)
    if (!times) return null
    const tomorrow = toMin(t.hhmm) >= toMin(times.isha) ? await timesFor(city, nextDdmmyyyy(t.ddmmyyyy)) : null
    const n = nextPrayer(times, t.hhmm, tomorrow && tomorrow.fajr)
    if (!n) return null
    const T = TEXT[L]
    const name = `${nameOf(n.key, L)}${n.tomorrow ? ` (${T.tomorrow})` : ''}`
    return `${esc(T.next(name, n.time, T.dur(Math.floor(n.minutes / 60), n.minutes % 60)))}\n${esc(cityName(city, L))}`
  }

  async function ayahMessage(L, city) {
    const dateKey = nowAt(city ? city.tz : 'Asia/Baku', now()).dateKey
    const pick = dailyAyah.ayahForDate(dateKey)
    const data = await ayahData(pick)
    if (!data) return null
    const link = `${origin}${dailyAyah.ayahLink(L, pick)}`
    const body = [`<b>${esc(dailyAyah.ayahTitle(L, pick, data.names))}</b>`, '', esc(data.texts.ar)]
    if (L !== 'ar' && data.texts[L]) body.push('', esc(data.texts[L]))
    return { text: body.join('\n'), kb: linkKb(L, link) }
  }

  function hadithMessage(L, city) {
    const dateKey = nowAt(city ? city.tz : 'Asia/Baku', now()).dateKey
    const h = dailyHadith.hadithForDate(dateKey)
    if (!h) return null
    const hl = dailyHadith.langOf(L)
    const link = `${origin}${hl === 'az' ? '' : `/${hl}`}/hadith/${h.id}`
    // Dərəcə yalnız Buxari / Müslim üçün yazılır — saytın 1-ci qaydası (src/utils/hadithGrade.js → gradeOf, eyni ifadə).
    // Sünən rəvayətlərinin hökmü (Albani və s.) siyahıda yoxdur — uydurulmur; "Saytda aç" səhifəsində göstərilir.
    const bm = /^(Buxari|Muslim|Müslim)\b/.test(String(h.src.az || '')) && !/Ədəb əl-Müfrəd/.test(String(h.src.az || ''))
    const body = [`<b>📜 ${esc(dailyHadith.TITLE[hl])}</b>`, '', esc(h.t[hl] || h.t.en), '', `— ${esc(h.src[hl] || h.src.en)}${bm ? ` · ${esc(SAHIH[hl])}` : ''}`]
    return { text: body.join('\n'), kb: linkKb(L, link) }
  }

  // ── Əmrlər ──
  async function run(chatId, L, cmd, arg) {
    const T = TEXT[L]
    let row = q.get.get(chatId)
    if (row && row.lang !== L) q.setLang.run(L, chatId, L)
    const city = row ? CITY_BY_ID.get(row.city) : null
    switch (cmd) {
      case 'start':
        return send(chatId, `${esc(T.welcome)}\n\n${esc(T.consent)}\n\n${esc(T.chooseCountry)}`, { reply_markup: countriesKb(L) })
      case 'city':
        return send(chatId, esc(T.chooseCountry), { reply_markup: countriesKb(L) })
      case 'times': case 'next': {
        if (!city) return send(chatId, esc(T.noCity), { reply_markup: countriesKb(L) })
        const text = cmd === 'times' ? await timesText(L, city) : await nextText(L, city)
        return send(chatId, text || esc(T.failed), { reply_markup: menu(L, row) })
      }
      case 'ayah': case 'hadith': {
        const msg = cmd === 'ayah' ? await ayahMessage(L, city) : hadithMessage(L, city)
        return msg ? send(chatId, msg.text, { reply_markup: msg.kb }) : send(chatId, esc(T.failed))
      }
      case 'remind': case 'on': case 'off': {
        const v = cmd === 'remind' ? arg : cmd
        if (v !== 'on' && v !== 'off') return send(chatId, esc(T.remindUsage))
        if (!city) return send(chatId, esc(T.noCity), { reply_markup: countriesKb(L) })
        q.setRemind.run(v === 'on' ? 1 : 0, chatId)
        row = q.get.get(chatId)
        return send(chatId, esc(v === 'on' ? T.remindOn(cityName(city, L)) : T.remindOff), { reply_markup: menu(L, row) })
      }
      case 'stop':
        q.del.run(chatId)
        return send(chatId, esc(T.stopped))
      default:
        return send(chatId, esc(T.help), row ? { reply_markup: menu(L, row) } : {})
    }
  }

  async function onCallback(cq) {
    const msg = cq.message
    const chat = msg && msg.chat
    const chatId = chat && Number(chat.id)
    const L = langOf(cq.from && cq.from.language_code)
    const id = typeof cq.id === 'string' ? cq.id.slice(0, 128) : ''
    if (id) await api('answerCallbackQuery', { callback_query_id: id })
    if (!chat || chat.type !== 'private' || !Number.isSafeInteger(chatId)) return
    const c = parseCallback(cq.data)
    if (!c) return
    const edit = (text, kb) => api('editMessageText', {
      chat_id: chatId, message_id: msg.message_id, text, parse_mode: 'HTML', reply_markup: kb,
    })
    if (c.type === 'countries') return edit(esc(TEXT[L].chooseCountry), countriesKb(L))
    if (c.type === 'country') return edit(esc(TEXT[L].chooseCity(COUNTRY_NAMES[c.country][L])), citiesKb(L, c.country, c.page))
    if (c.type === 'city') {
      const city = CITY_BY_ID.get(c.id)
      q.upsertCity.run(chatId, L, city.id, now())
      const row = q.get.get(chatId)
      const text = await timesText(L, city)
      return edit(`${esc(TEXT[L].citySet(cityName(city, L)))}${text ? `\n\n${text}` : ''}`, menu(L, row))
    }
    return run(chatId, L, c.cmd, '')
  }

  /** Bir Telegram yeniləməsi (Update). Mətn heç yerdə saxlanmır və loglanmır. */
  async function handleUpdate(u) {
    if (!enabled || !u || typeof u !== 'object') return
    if (u.callback_query && typeof u.callback_query === 'object') return onCallback(u.callback_query)
    const msg = u.message
    if (!msg || typeof msg !== 'object' || !msg.chat || msg.chat.type !== 'private') return
    const chatId = Number(msg.chat.id)
    if (!Number.isSafeInteger(chatId) || typeof msg.text !== 'string' || msg.text.length > 4096) return
    const L = langOf(msg.from && msg.from.language_code)
    const c = parseCommand(msg.text)
    return run(chatId, L, c ? c.cmd : '', c ? c.arg : '')
  }

  // ── Webhook ──
  const secretBuf = Buffer.from(String(secret))
  const same = (s) => {
    const b = Buffer.from(String(s || ''))
    return b.length === secretBuf.length && crypto.timingSafeEqual(b, secretBuf)
  }
  const router = express.Router()
  const notFound = (res) => res.status(404).json({ error: 'not_found', code: 'not_found' })
  router.use('/telegram', (req, res, next) => (enabled ? next() : notFound(res)))
  router.post('/telegram/webhook', (req, res, next) => {
    if (!same(req.get('X-Telegram-Bot-Api-Secret-Token'))) return notFound(res)
    next()
  }, express.json({ limit: '64kb' }), async (req, res) => {
    res.set('Cache-Control', 'no-store')
    try { await handleUpdate(req.body) } catch (e) { log.error('telegram update:', e && e.message) }
    // Həmişə 200: Telegram xətada eyni yeniləməni təkrar-təkrar göndərir
    res.json({ ok: true })
  })
  router.all(/^\/telegram(\/|$)/, (req, res) => notFound(res))

  // ── Azan xatırlatması planlayıcısı (server.js: 20 saniyədə bir) ──
  let busy = false
  async function tick() {
    if (!enabled || busy) return 0
    busy = true
    let n = 0
    try {
      const byCity = new Map()
      for (const r of q.reminders.all()) {
        if (!CITY_BY_ID.has(r.city)) continue
        if (!byCity.has(r.city)) byCity.set(r.city, [])
        byCity.get(r.city).push(r)
      }
      const today = new Set()
      for (const [cityId, chats] of byCity) {
        const city = CITY_BY_ID.get(cityId)
        const t = nowAt(city.tz, now())
        today.add(`tg|${cityId}|${t.dateKey}|`)
        const times = await timesFor(city, t.ddmmyyyy)
        if (!times) continue
        for (const [p] of PRAYERS) {
          if (times[p] !== t.hhmm || !sent.claim(`tg|${cityId}|${t.dateKey}|${p}`)) continue
          const idx = PRAYERS.findIndex(([k]) => k === p)
          const nextKey = idx < PRAYERS.length - 1 ? PRAYERS[idx + 1][0] : null
          for (const ch of chats) {
            const L = LANGS.includes(ch.lang) ? ch.lang : 'en'
            const P = PUSH_TEXTS[L]
            const title = p === 'dhuhr' && t.friday ? P.jumuaTitle(times[p]) : P.title(P.names[p], times[p])
            const lines = [`<b>${esc(title)}</b>`]
            if (nextKey) lines.push(esc(`${P.next}: ${P.names[nextKey]} ${times[nextKey]}`))
            lines.push(esc(cityName(city, L)))
            await send(ch.chat_id, lines.join('\n'))
            n++
            if (sendGapMs) await sleep(sendGapMs)
          }
        }
      }
      // Yaddaşdakı köhnə günlərin açarları (bazadakı həşləri pushClaims.purge silir)
      for (const k of sent) {
        if (k.startsWith('tg|') && ![...today].some((p) => k.startsWith(p))) sent.delete(k)
      }
    } catch (e) {
      log.error('telegram tick:', e && e.message)
    } finally {
      busy = false
    }
    return n
  }

  return { enabled, router, tick, handleUpdate, api, _q: q }
}

module.exports = {
  createTelegramBot, parseCommand, parseCallback, langOf, nextPrayer, nowAt, esc,
  COMMANDS, TEXT, LANGS, SECRET_RE,
}
