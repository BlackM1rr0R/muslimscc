// "Səhər / axşam zikri" və "Cümə" xatırlatmalarının saf köməkçiləri (v5.4) —
// şəbəkə və sirr tələb etmir, ayrıca test olunur (tests/unit/reminders.test.js).
//
// AXIN (hamısı susmaya görə SÖNÜLÜ, abunəlikdə prefs.adhkar / prefs.jumuah):
//   • morning — sübh azanından 30 dəqiqə sonra: "Səhər zikrlərinin vaxtıdır"
//   • evening — əsr azanından 30 dəqiqə sonra:  "Axşam zikrlərinin vaxtıdır"
//     Klikdə Hisnul-Müslim → "Səhər və axşam zikrləri" fəsli (#hs-28) açılır.
//     Vaxt: səhər zikrləri sübhdən, axşam zikrləri əsrdən sonra oxunur —
//     "Rəbbini gün çıxmazdan əvvəl və batmazdan əvvəl təsbih et" (Taha 130).
//   • jumuah — cümə günü yerli saatla 09:00: Kəhf surəsi və çoxlu salavat.
//     Klikdə /quran/18 açılır. Hədislər (saytdakı dərəcə ilə eyni):
//     Əbu Davud 1047 (salavat, səhih — əl-Albani), əl-Hakim 2/399 (Kəhf,
//     səhih — əl-Albani, Səhihul-Cami 6470).
// Mətnlərdə hədis/ayə SİTATI yoxdur — yalnız qısa xatırlatma + istinad.
'use strict'

const { LANGS } = require('./prayer-utils')

const ADHKAR_DELAY_MIN = 30
const JUMUAH_HHMM = '09:00'
const KINDS = ['morning', 'evening', 'jumuah']

/** Abunəlikdəki seçim: yalnız açıq-aydın true olanda göndərilir. */
const normFlag = (v) => v === true

/** 'HH:MM' + n dəqiqə → 'HH:MM' | null (gecə yarısından keçmir) */
function addMinutes(hhmm, n) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''))
  if (!m) return null
  const t = Number(m[1]) * 60 + Number(m[2]) + n
  if (t < 0 || t >= 24 * 60) return null
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** Bu dəqiqədə vaxtı çatan xatırlatmalar (saf): ['morning' | 'evening' | 'jumuah'] */
function dueReminders(times, hhmm, { friday = false, adhkar = true, jumuah = true } = {}) {
  const out = []
  if (adhkar && times) {
    if (addMinutes(times.fajr, ADHKAR_DELAY_MIN) === hhmm) out.push('morning')
    if (addMinutes(times.asr, ADHKAR_DELAY_MIN) === hhmm) out.push('evening')
  }
  if (jumuah && friday && hhmm === JUMUAH_HHMM) out.push('jumuah')
  return out
}

const TEXTS = {
  az: {
    morning: { title: '🌅 Səhər zikrlərinin vaxtıdır', body: 'Hisnul-Müslimdən səhər zikrləri — bir neçə dəqiqə.' },
    evening: { title: '🌇 Axşam zikrlərinin vaxtıdır', body: 'Hisnul-Müslimdən axşam zikrləri — gün batmazdan əvvəl.' },
    jumuah: { title: '🕌 Bu gün cümədir', body: 'Kəhf surəsini oxumaq və Peyğəmbərə ﷺ çoxlu salavat gətirmək (Əbu Davud 1047; əl-Hakim 2/399).' },
  },
  en: {
    morning: { title: '🌅 Time for the morning adhkar', body: 'The morning remembrances from Hisn al-Muslim — a few minutes.' },
    evening: { title: '🌇 Time for the evening adhkar', body: 'The evening remembrances from Hisn al-Muslim — before sunset.' },
    jumuah: { title: '🕌 Today is Friday', body: 'Read Surah al-Kahf and send abundant salawat upon the Prophet ﷺ (Abu Dawud 1047; al-Hakim 2/399).' },
  },
  ru: {
    morning: { title: '🌅 Время утренних азкаров', body: 'Утренние поминания из «Крепости мусульманина» — несколько минут.' },
    evening: { title: '🌇 Время вечерних азкаров', body: 'Вечерние поминания из «Крепости мусульманина» — до заката.' },
    jumuah: { title: '🕌 Сегодня пятница', body: 'Прочитайте суру «аль-Кахф» и чаще произносите салават Пророку ﷺ (Абу Дауд 1047; аль-Хаким 2/399).' },
  },
  ar: {
    morning: { title: '🌅 حان وقت أذكار الصباح', body: 'أذكار الصباح من حصن المسلم — دقائق معدودة.' },
    evening: { title: '🌇 حان وقت أذكار المساء', body: 'أذكار المساء من حصن المسلم — قبل غروب الشمس.' },
    jumuah: { title: '🕌 اليوم الجمعة', body: 'اقرأ سورة الكهف وأكثر من الصلاة على النبي ﷺ (أبو داود 1047؛ الحاكم 2/399).' },
  },
  tr: {
    morning: { title: '🌅 Sabah zikirlerinin vakti', body: 'Hisnu’l-Müslim’den sabah zikirleri — birkaç dakika.' },
    evening: { title: '🌇 Akşam zikirlerinin vakti', body: 'Hisnu’l-Müslim’den akşam zikirleri — güneş batmadan önce.' },
    jumuah: { title: '🕌 Bugün cuma', body: 'Kehf suresini okuyun ve Peygamber’e ﷺ çokça salavat getirin (Ebû Dâvûd 1047; Hâkim 2/399).' },
  },
}

const prefix = (lang) => (lang === 'az' || !LANGS.includes(lang) ? '' : `/${lang}`)
function reminderLink(lang, kind) {
  return kind === 'jumuah' ? `${prefix(lang)}/quran/18` : `${prefix(lang)}/hisnul-muslim#hs-28`
}

/** deliver üçün mesaj. TTL: zikr — 2 saat, cümə — 6 saat (gec çatan mənasızdır). */
function buildReminderMessage(lang, kind, dateKey, icons = {}) {
  const L = LANGS.includes(lang) ? lang : 'az'
  const t = TEXTS[L][kind]
  if (!t) return null
  const tag = `${kind === 'jumuah' ? 'jumuah' : 'adhkar'}-${kind}-${dateKey}`
  const url = reminderLink(L, kind)
  return {
    notification: { title: t.title, body: t.body },
    data: { kind: 'reminder', reminder: kind, date: dateKey, tag, url },
    webpush: {
      headers: { TTL: kind === 'jumuah' ? '21600' : '7200' },
      notification: { ...icons, tag },
      fcmOptions: { link: url },
    },
  }
}

module.exports = { ADHKAR_DELAY_MIN, JUMUAH_HHMM, KINDS, TEXTS, normFlag, addMinutes, dueReminders, reminderLink, buildReminderMessage }
