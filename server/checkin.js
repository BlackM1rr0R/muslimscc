// "Qıldınızmı?" push xatırlatmasının saf köməkçiləri — şəbəkə və sirr tələb
// etmir, ona görə ayrıca test olunur (tests/unit/checkin.test.js).
//
// AXIN: namaz (azan) vaxtından CHECKIN_DELAY_MIN dəqiqə sonra seçimi açıq
// olan abunəçiyə (fcm_tokens/<token>.checkin === true; susmaya görə SÖNÜLÜ)
// "🕌 Zöhr namazını qıldınızmı?" bildirişi gedir. Bildirişin data hissəsi
// service worker-ə (public/sw.js) "✅ Qıldım" / "Sonra" düymələrinin mətnini
// və klikdə açılacaq ünvanı verir: /prayer?checkin=dhuhr&d=YYYY-MM-DD.
// Namazın qılınıb-qılınmadığı SERVERƏ GƏLMİR — qeyd yalnız cihazda qalır.
'use strict'

const { PRAYERS, PUSH_TEXTS, LANGS } = require('./prayer-utils')

const CHECKIN_DELAY_MIN = 20
const PRAYER_KEYS = PRAYERS.map(([k]) => k)

const TEXTS = {
  az: { title: (n) => `🕌 ${n} namazını qıldınızmı?`, body: 'Qıldınızsa, bir toxunuşla qeyd edin.',
        prayed: '✅ Qıldım', later: 'Sonra', done: (n) => `${n} namazı qeyd olundu` },
  en: { title: (n) => `🕌 Did you pray ${n}?`, body: 'If you have, mark it with one tap.',
        prayed: '✅ I prayed', later: 'Later', done: (n) => `${n} marked as prayed` },
  ru: { title: (n) => `🕌 Намаз ${n} совершён?`, body: 'Если да — отметьте одним касанием.',
        prayed: '✅ Совершён', later: 'Позже', done: (n) => `Намаз ${n} отмечен` },
  ar: { title: (n) => `🕌 هل صليت ${n}؟`, body: 'إن صليتها فسجّلها بلمسة واحدة.',
        prayed: '✅ صليت', later: 'لاحقًا', done: (n) => `سُجِّلت صلاة ${n}` },
  tr: { title: (n) => `🕌 ${n} namazını kıldınız mı?`, body: 'Kıldıysanız tek dokunuşla işaretleyin.',
        prayed: '✅ Kıldım', later: 'Sonra', done: (n) => `${n} namazı işaretlendi` },
}

/** Token sənədindəki seçim: yalnız açıq-aydın true olanda göndərilir. */
const normCheckin = (v) => v === true

/** 'HH:MM' + dəqiqə → 'HH:MM' | null. Gecə yarısını keçirsə null (həmin
 *  gün üçün göndərilmir — tarix sabaha keçər, qeyd səhv günə düşərdi). */
function addMinutes(hhmm, min = CHECKIN_DELAY_MIN) {
  const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || ''))
  if (!m) return null
  const h = Number(m[1]), mm = Number(m[2])
  if (h > 23 || mm > 59) return null
  const total = h * 60 + mm + min
  if (total >= 24 * 60) return null
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Bu dəqiqədə xatırlatması düşən namazlar (gündəlik vaxtlar → ['dhuhr']). */
function dueCheckins(times, hhmm, delay = CHECKIN_DELAY_MIN) {
  if (!times) return []
  return PRAYER_KEYS.filter(k => addMinutes(times[k], delay) === hhmm)
}

const checkinTag = (prayer, dateKey) => `checkin-${prayer}-${dateKey}`

/** Klikdə açılan ünvan (dil prefiksi ilə; az — prefikssiz). */
function checkinLink(lang, prayer, dateKey) {
  const base = lang === 'az' || !LANGS.includes(lang) ? '/prayer' : `/${lang}/prayer`
  return `${base}?checkin=${encodeURIComponent(prayer)}&d=${encodeURIComponent(dateKey)}`
}

function checkinTexts(lang, prayer) {
  const L = LANGS.includes(lang) ? lang : 'az'
  const T = TEXTS[L]
  const name = PUSH_TEXTS[L].names[prayer] || prayer
  return { title: T.title(name), body: T.body, prayed: T.prayed, later: T.later, done: T.done(name) }
}

/** sendEachForMulticast üçün mesaj (tokenlər çağıran tərəfindən əlavə olunur). */
function buildCheckinMessage(lang, prayer, dateKey, icons = {}) {
  const t = checkinTexts(lang, prayer)
  const tag = checkinTag(prayer, dateKey)
  const url = checkinLink(lang, prayer, dateKey)
  return {
    notification: { title: t.title, body: t.body },
    // sw.js data-dan oxuyur: tag, url, düymə mətnləri, təsdiq mətni.
    // FCM data dəyərləri yalnız mətn ola bilər.
    data: {
      kind: 'checkin', tag, url, prayer, date: dateKey,
      actPrayed: t.prayed, actLater: t.later, doneTitle: t.done,
    },
    webpush: {
      // Xatırlatma bir neçə saat sonra da mənalıdır (qeyd günə bağlıdır),
      // amma gecikmiş push-un ertəsi gün gəlməsi lazım deyil — 3 saat
      headers: { TTL: '10800' },
      notification: { ...icons, tag },
      fcmOptions: { link: url },
    },
  }
}

module.exports = {
  CHECKIN_DELAY_MIN, TEXTS, normCheckin, addMinutes, dueCheckins,
  checkinTag, checkinLink, checkinTexts, buildCheckinMessage,
}
