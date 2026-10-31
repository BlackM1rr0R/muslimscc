// "Sünnə orucu xatırlatması" push-unun saf köməkçiləri — şəbəkə və sirr tələb
// etmir, ona görə ayrıca test olunur (tests/unit/fasting.test.js).
//
// AXIN: seçimi açıq olan abunəçiyə (prefs.fasting === true; susmaya görə
// SÖNÜLÜ) öz şəhərinin yerli saatı ilə 20:00-da — oruc gününün ƏVVƏLKİ
// axşamı — "Sabah bazar ertəsidir — sünnə orucu…" bildirişi gedir. Klikdə
// /learn/sunnah-fasts dərsi açılır (dil prefiksi ilə; az — prefikssiz).
//
// Hicri tarix: Ümmül-Qura təqvimi (Intl 'islamic-umalqura'). Yerli hilal
// rüyəti bir gün fərqlənə bilər — mətnlər ona görə qısa və təvazökardır.
//
// Hansı oruc (prioritet sırası ilə): arafah (9 Zülhiccə), ashura (10
// Məhərrəm), tasua (9 Məhərrəm), white (hər ayın 13/14/15-i), shawwal (2
// Şəvval — altı günə başlamaq xatırlatması, ildə bir dəfə), monday, thursday.
// HEÇ NƏ göndərilmir: Ramazan (9-cu ay), iki bayram (1 Şəvval, 10 Zülhiccə),
// təşriq günləri (11–13 Zülhiccə — oruc qadağandır, Müslim 1141) və Şəbanın
// 29–30-u ("Ramazanı bir-iki gün oruc tutmaqla qabaqlamayın" — Buxari 1914,
// Müslim 1082; adəti olan istisnadır, amma ümumi xatırlatma adəti bilmir).
//
// Hədis nömrələri (Müslim — Fuad Əbdülbaqi nömrələməsi), src/data/lessons/
// sunnah-fasts.js dərsi ilə eyni: bazar ertəsi — Müslim 1162; bazar ertəsi və
// cümə axşamı — Tirmizi 747; ağ günlər — Nəsai 2420; Ərəfə, Aşura — Müslim
// 1162; Tasua — Müslim 1134; Şəvvalın altı günü — Müslim 1164.
'use strict'

const { LANGS } = require('./prayer-utils')

const FASTING_HHMM = '20:00'   // yerli saat — oruc gününün əvvəlki axşamı
const KINDS = ['arafah', 'ashura', 'tasua', 'white', 'shawwal', 'monday', 'thursday']

const HIJRI_FMT = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
  timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric',
})

/** Abunəlikdəki seçim: yalnız açıq-aydın true olanda göndərilir. */
const normFasting = (v) => v === true

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** 'YYYY-MM-DD' → UTC günortası (saat qurşağı sürüşməsi tarixi dəyişməsin) | null */
function utcNoon(dateKey) {
  const m = DATE_RE.exec(String(dateKey || ''))
  if (!m) return null
  const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12))
  return Number.isNaN(t.getTime()) ? null : t
}

/** 'YYYY-MM-DD' + n gün → 'YYYY-MM-DD' | null */
function addDaysKey(dateKey, n = 1) {
  const t = utcNoon(dateKey)
  if (!t) return null
  return new Date(t.getTime() + n * 86400000).toISOString().slice(0, 10)
}

/** Qriqorian tarix → Ümmül-Qura { y, m, d } | null */
function hijriOf(dateKey) {
  const t = utcNoon(dateKey)
  if (!t) return null
  const p = Object.fromEntries(HIJRI_FMT.formatToParts(t).map((x) => [x.type, x.value]))
  const y = parseInt(p.year, 10), m = parseInt(p.month, 10), d = parseInt(p.day, 10)
  return y && m && d ? { y, m, d } : null
}

/** 0 = bazar, 1 = bazar ertəsi … 4 = cümə axşamı */
function weekdayOf(dateKey) {
  const t = utcNoon(dateKey)
  return t ? t.getUTCDay() : null
}

/** Oruc tutulmayan / xatırlatma göndərilməyən günlər. */
function isExcluded({ m, d }) {
  if (m === 9) return true                        // Ramazan — fərz oruc
  if (m === 10 && d === 1) return true            // Ramazan bayramı
  if (m === 12 && d >= 10 && d <= 13) return true // Qurban bayramı + təşriq günləri
  if (m === 8 && d >= 29) return true             // Ramazandan bir-iki gün əvvəl
  return false
}

/** Hicri gün + həftə günü → sünnə orucunun növü | null (saf). */
function fastKind(hijri, weekday) {
  if (!hijri || isExcluded(hijri)) return null
  const { m, d } = hijri
  if (m === 12 && d === 9) return 'arafah'
  if (m === 1 && d === 10) return 'ashura'
  if (m === 1 && d === 9) return 'tasua'
  // 13 Zülhiccə təşriq günüdür — yuxarıda artıq istisna olunub
  if (d >= 13 && d <= 15) return 'white'
  if (m === 10 && d === 2) return 'shawwal'
  if (weekday === 1) return 'monday'
  if (weekday === 4) return 'thursday'
  return null
}

/** Şəhərin bugünkü yerli tarixi → sabahın sünnə orucu { kind, date, hijri } | null */
function fastingForTomorrow(todayKey) {
  const date = addDaysKey(todayKey, 1)
  if (!date) return null
  const hijri = hijriOf(date)
  const kind = fastKind(hijri, weekdayOf(date))
  return kind ? { kind, date, hijri } : null
}

const isDueNow = (hhmm) => hhmm === FASTING_HHMM

const SAHUR = {
  az: 'Səhurun bərəkəti var.',
  en: 'There is blessing in suhur.',
  ru: 'В сухуре есть баракат.',
  ar: 'في السحور بركة.',
  tr: 'Sahurda bereket vardır.',
}

const TEXTS = {
  az: {
    monday:   { title: 'Sabah bazar ertəsidir', body: 'Sünnə orucu tutmaq istəyirsinizmi? Peyğəmbər ﷺ bu günü oruc tutardı (Müslim 1162).' },
    thursday: { title: 'Sabah cümə axşamıdır', body: 'Sünnə orucu tutmaq istəyirsinizmi? Əməllər bazar ertəsi və cümə axşamı Allaha təqdim olunur (Tirmizi 747).' },
    white:    { title: 'Sabah ağ günlərdəndir', body: 'Hicri ayın 13, 14 və 15-i oruc tutmaq sünnədir (Nəsai 2420). Niyyət etmək istəyirsinizmi?' },
    arafah:   { title: 'Sabah Ərəfə günüdür', body: 'Ərəfə orucu keçən və gələn ilin günahlarına kəffarədir (Müslim 1162). Həcdə olmayanlar üçün sünnədir.' },
    ashura:   { title: 'Sabah Aşura günüdür', body: 'Aşura orucu keçən ilin günahlarına kəffarədir (Müslim 1162).' },
    tasua:    { title: 'Sabah Tasua — Məhərrəmin 9-u', body: 'Aşura ilə birlikdə doqquzuncu günü də oruc tutmaq sünnədir (Müslim 1134).' },
    shawwal:  { title: 'Şəvvalın altı günü', body: 'Ramazandan sonra Şəvvaldan altı gün oruc tutan bütün ili oruc tutmuş kimidir (Müslim 1164). Sabahdan başlamaq olar.' },
  },
  en: {
    monday:   { title: 'Tomorrow is Monday', body: 'Would you like to fast the sunnah fast? The Prophet ﷺ used to fast this day (Muslim 1162).' },
    thursday: { title: 'Tomorrow is Thursday', body: 'Would you like to fast the sunnah fast? Deeds are presented to Allah on Mondays and Thursdays (at-Tirmidhi 747).' },
    white:    { title: 'Tomorrow is one of the white days', body: 'Fasting the 13th, 14th and 15th of the Hijri month is sunnah (an-Nasa’i 2420). Would you like to make the intention?' },
    arafah:   { title: 'Tomorrow is the Day of Arafah', body: 'Fasting Arafah expiates the sins of the past and coming year (Muslim 1162). It is sunnah for those not on Hajj.' },
    ashura:   { title: 'Tomorrow is Ashura', body: 'Fasting Ashura expiates the sins of the past year (Muslim 1162).' },
    tasua:    { title: 'Tomorrow is Tasu‘a — 9 Muharram', body: 'It is sunnah to fast the ninth day together with Ashura (Muslim 1134).' },
    shawwal:  { title: 'Six days of Shawwal', body: 'Whoever fasts Ramadan and follows it with six days of Shawwal, it is as if he fasted the whole year (Muslim 1164). You can begin tomorrow.' },
  },
  ru: {
    monday:   { title: 'Завтра понедельник', body: 'Хотите соблюсти желательный пост? Пророк ﷺ постился в этот день (Муслим 1162).' },
    thursday: { title: 'Завтра четверг', body: 'Хотите соблюсти желательный пост? Деяния представляются Аллаху в понедельник и четверг (ат-Тирмизи 747).' },
    white:    { title: 'Завтра один из белых дней', body: 'Пост 13, 14 и 15 числа лунного месяца — сунна (ан-Насаи 2420). Хотите сделать намерение?' },
    arafah:   { title: 'Завтра день Арафа', body: 'Пост в день Арафа искупает грехи прошлого и следующего года (Муслим 1162). Это сунна для тех, кто не в хадже.' },
    ashura:   { title: 'Завтра день Ашура', body: 'Пост в день Ашура искупает грехи прошлого года (Муслим 1162).' },
    tasua:    { title: 'Завтра Тасуа — 9 мухаррама', body: 'Сунна — поститься в девятый день вместе с Ашурой (Муслим 1134).' },
    shawwal:  { title: 'Шесть дней шавваля', body: 'Кто постился в рамадан, а затем шесть дней шавваля, тот словно постился весь год (Муслим 1164). Можно начать завтра.' },
  },
  ar: {
    monday:   { title: 'غدًا يوم الاثنين', body: 'هل تودّ صيام التطوع؟ كان النبي ﷺ يصوم هذا اليوم (مسلم 1162).' },
    thursday: { title: 'غدًا يوم الخميس', body: 'هل تودّ صيام التطوع؟ تُعرض الأعمال يوم الاثنين والخميس (الترمذي 747).' },
    white:    { title: 'غدًا من الأيام البيض', body: 'صيام الثالث عشر والرابع عشر والخامس عشر من الشهر الهجري سنة (النسائي 2420). هل تنوي صيامه؟' },
    arafah:   { title: 'غدًا يوم عرفة', body: 'صيام يوم عرفة يكفّر السنة الماضية والباقية (مسلم 1162)، وهو لغير الحاج.' },
    ashura:   { title: 'غدًا يوم عاشوراء', body: 'صيام يوم عاشوراء يكفّر السنة الماضية (مسلم 1162).' },
    tasua:    { title: 'غدًا تاسوعاء — التاسع من المحرم', body: 'يُسنّ صيام التاسع مع عاشوراء (مسلم 1134).' },
    shawwal:  { title: 'ست من شوال', body: 'من صام رمضان ثم أتبعه ستًّا من شوال كان كصيام الدهر (مسلم 1164). يمكنك البدء غدًا.' },
  },
  tr: {
    monday:   { title: 'Yarın pazartesi', body: 'Nafile oruç tutmak ister misiniz? Peygamber ﷺ bu gün oruç tutardı (Müslim 1162).' },
    thursday: { title: 'Yarın perşembe', body: 'Nafile oruç tutmak ister misiniz? Ameller pazartesi ve perşembe günleri Allah’a arz edilir (Tirmizî 747).' },
    white:    { title: 'Yarın eyyâm-ı bîzdendir', body: 'Hicri ayın 13, 14 ve 15. günlerinde oruç tutmak sünnettir (Nesâî 2420). Niyet etmek ister misiniz?' },
    arafah:   { title: 'Yarın Arefe günü', body: 'Arefe orucu geçmiş ve gelecek yılın günahlarına kefarettir (Müslim 1162). Hacda olmayanlar için sünnettir.' },
    ashura:   { title: 'Yarın Aşure günü', body: 'Aşure orucu geçmiş yılın günahlarına kefarettir (Müslim 1162).' },
    tasua:    { title: 'Yarın Tasua — 9 Muharrem', body: 'Aşure ile birlikte dokuzuncu günü de oruç tutmak sünnettir (Müslim 1134).' },
    shawwal:  { title: 'Şevval’in altı günü', body: 'Ramazan orucunu tutup ardından Şevval’den altı gün oruç tutan, bütün yılı oruçlu geçirmiş gibidir (Müslim 1164). Yarın başlayabilirsiniz.' },
  },
}

function fastingTexts(lang, kind) {
  const L = LANGS.includes(lang) ? lang : 'az'
  const t = TEXTS[L][kind]
  if (!t) return null
  return { title: `🌙 ${t.title}`, body: `${t.body} ${SAHUR[L]}` }
}

const fastingTag = (dateKey) => `fasting-${dateKey}`

/** Klikdə açılan dərs (dil prefiksi ilə; az — prefikssiz). */
function fastingLink(lang) {
  return lang === 'az' || !LANGS.includes(lang) ? '/learn/sunnah-fasts' : `/${lang}/learn/sunnah-fasts`
}

/** sendEachForMulticast/deliver üçün mesaj (tokenlər çağıran tərəfindən əlavə olunur).
 *  dateKey — orucun günü (sabah). */
function buildFastingMessage(lang, kind, dateKey, icons = {}) {
  const t = fastingTexts(lang, kind)
  if (!t) return null
  const tag = fastingTag(dateKey)
  const url = fastingLink(lang)
  return {
    notification: { title: t.title, body: t.body },
    // sw.js data-dan tag/url oxuyur; FCM data dəyərləri yalnız mətn ola bilər
    data: { kind: 'fasting', fast: kind, date: dateKey, tag, url },
    webpush: {
      // Səhər səhura qədər mənalıdır; ertəsi axşam gəlməsin — 8 saat
      headers: { TTL: '28800' },
      notification: { ...icons, tag },
      fcmOptions: { link: url },
    },
  }
}

module.exports = {
  FASTING_HHMM, KINDS, TEXTS, SAHUR, normFasting, addDaysKey, hijriOf, weekdayOf,
  isExcluded, fastKind, fastingForTomorrow, isDueNow, fastingTexts, fastingTag,
  fastingLink, buildFastingMessage,
}
