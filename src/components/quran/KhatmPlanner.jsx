// ═══════════════════════════════════════════════════════
// Xətm planı (Quran səhifəsi, v3.2) — Quranı seçilmiş müddətdə bitirmək.
// Ölçü vahidi Mədinə mushafının səhifəsidir (604 — data/mushafIndex.js);
// bugünkü hissə /mushaf?p=<səhifə>-də açılır. Yalnız bu cihazda saxlanılır.
// Dua mətni əlavə edilmir (xətm duası kimi yayılan mətn sabit deyil).
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react'
import Icon from '../Icon'
import { ProgressRing } from '../viz'
import { MUSHAF_PAGES, SURAH_TABLE, JUZ_START_PAGES } from '../../data/mushafIndex'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import { useNavigate } from 'react-router-dom'
import { pickUi } from '../../utils/uiText'

const KEY = 'quran_khatm_plan'
const DAY_OPTIONS = [7, 10, 15, 30, 60, 90]

const L = {
  az: {
    eyebrow: 'Xətm planı', title: 'Quranı bitirmək üçün plan',
    lead: 'Müddəti seçin — sayt hər günə düşən səhifələri hesablayacaq. Mədinə mushafı, 604 səhifə.',
    pick: 'Neçə günə bitirmək istəyirsiniz?', days: n => `${n} gün`, perDay: n => `gündə ≈ ${n} səhifə`,
    start: 'Planı başlat', today: 'Bugünkü hissə', pages: (a, b) => (a === b ? `${a}-ci səhifə` : `${a}–${b} səhifələr`),
    open: 'Mushafda aç', done: 'Oxudum', progress: 'İrəliləyiş', of: 'səhifə',
    dayN: (d, t) => `${t} günün ${d}-ci günü`, streak: 'ardıcıl gün', left: 'qalan səhifə',
    behind: n => `Plandan ${n} səhifə geridəsiniz — narahat olmayın, bu gün bir az çox oxuyun.`,
    ahead: n => `Plandan ${n} səhifə öndəsiniz.`, onTrack: 'Plan üzrə gedirsiniz.',
    finished: 'Təbrik edirik — Quranı bu planla xətm etdiniz!', reset: 'Planı sıfırla', resetConfirm: 'Plan silinsin?',
    note: 'Yalnız bu cihazda saxlanılır.', startsIn: 'Başlanğıc',
  },
  en: {
    eyebrow: 'Khatm plan', title: 'A plan to complete the Quran',
    lead: 'Choose a duration and the site works out the pages for each day. Madinah mushaf, 604 pages.',
    pick: 'In how many days do you want to finish?', days: n => `${n} days`, perDay: n => `≈ ${n} pages a day`,
    start: 'Start the plan', today: 'Today’s portion', pages: (a, b) => (a === b ? `page ${a}` : `pages ${a}–${b}`),
    open: 'Open in the mushaf', done: 'I read it', progress: 'Progress', of: 'pages',
    dayN: (d, t) => `day ${d} of ${t}`, streak: 'day streak', left: 'pages left',
    behind: n => `You are ${n} pages behind the plan — no worries, read a little more today.`,
    ahead: n => `You are ${n} pages ahead of the plan.`, onTrack: 'You are on track.',
    finished: 'Congratulations — you completed the Quran with this plan!', reset: 'Reset the plan', resetConfirm: 'Delete the plan?',
    note: 'Stored on this device only.', startsIn: 'Starts in',
  },
  ru: {
    eyebrow: 'План хатма', title: 'План полного прочтения Корана',
    lead: 'Выберите срок — сайт рассчитает страницы на каждый день. Мединский мусхаф, 604 страницы.',
    pick: 'За сколько дней вы хотите закончить?', days: n => `${n} дн.`, perDay: n => `≈ ${n} стр. в день`,
    start: 'Начать план', today: 'Сегодняшняя часть', pages: (a, b) => (a === b ? `страница ${a}` : `страницы ${a}–${b}`),
    open: 'Открыть в мусхафе', done: 'Прочитал', progress: 'Прогресс', of: 'стр.',
    dayN: (d, t) => `день ${d} из ${t}`, streak: 'дней подряд', left: 'стр. осталось',
    behind: n => `Вы отстаёте от плана на ${n} стр. — не страшно, прочитайте сегодня немного больше.`,
    ahead: n => `Вы опережаете план на ${n} стр.`, onTrack: 'Вы идёте по плану.',
    finished: 'Поздравляем — вы завершили чтение Корана по этому плану!', reset: 'Сбросить план', resetConfirm: 'Удалить план?',
    note: 'Хранится только на этом устройстве.', startsIn: 'Начало',
  },
  ar: {
    eyebrow: 'خطة الختمة', title: 'خطة لختم القرآن',
    lead: 'اختر المدة وسيحسب الموقع الصفحات المقررة لكل يوم. مصحف المدينة، 604 صفحات.',
    pick: 'في كم يومًا تريد أن تختم؟', days: n => `${n} يومًا`, perDay: n => `≈ ${n} صفحات يوميًا`,
    start: 'ابدأ الخطة', today: 'ورد اليوم', pages: (a, b) => (a === b ? `الصفحة ${a}` : `الصفحات ⁦${a}–${b}⁩`),
    open: 'افتح في المصحف', done: 'قرأته', progress: 'التقدم', of: 'صفحة',
    dayN: (d, t) => `اليوم ${d} من ${t}`, streak: 'أيام متتالية', left: 'صفحة متبقية',
    behind: n => `أنت متأخر عن الخطة بـ ${n} صفحة — لا بأس، اقرأ اليوم أكثر قليلًا.`,
    ahead: n => `أنت متقدم على الخطة بـ ${n} صفحة.`, onTrack: 'أنت على الخطة.',
    finished: 'مبارك — أتممت ختم القرآن بهذه الخطة!', reset: 'أعد ضبط الخطة', resetConfirm: 'هل تحذف الخطة؟',
    note: 'تُحفظ على هذا الجهاز فقط.', startsIn: 'البداية',
  },
  tr: {
    eyebrow: 'Hatim planı', title: 'Kur’an’ı bitirmek için plan',
    lead: 'Süreyi seçin — site her güne düşen sayfaları hesaplar. Medine mushafı, 604 sayfa.',
    pick: 'Kaç günde bitirmek istiyorsunuz?', days: n => `${n} gün`, perDay: n => `günde ≈ ${n} sayfa`,
    start: 'Planı başlat', today: 'Bugünkü bölüm', pages: (a, b) => (a === b ? `${a}. sayfa` : `${a}–${b}. sayfalar`),
    open: 'Mushafta aç', done: 'Okudum', progress: 'İlerleme', of: 'sayfa',
    dayN: (d, t) => `${t} günün ${d}. günü`, streak: 'gün seri', left: 'sayfa kaldı',
    behind: n => `Planın ${n} sayfa gerisindesiniz — endişelenmeyin, bugün biraz fazla okuyun.`,
    ahead: n => `Planın ${n} sayfa önündesiniz.`, onTrack: 'Plana uygun gidiyorsunuz.',
    finished: 'Tebrikler — Kur’an’ı bu planla hatmettiniz!', reset: 'Planı sıfırla', resetConfirm: 'Plan silinsin mi?',
    note: 'Yalnızca bu cihazda saklanır.', startsIn: 'Başlangıç',
  },
}

const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dayDiff = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000)

function readPlan() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    if (!v || !DAY_OPTIONS.includes(v.days) || !/^\d{4}-\d{2}-\d{2}$/.test(v.start)) return null
    const done = Math.min(MUSHAF_PAGES, Math.max(0, Math.floor(Number(v.done) || 0)))
    const log = Array.isArray(v.log) ? v.log.filter(d => typeof d === 'string') : []
    return { days: v.days, start: v.start, done, log }
  } catch { return null }
}
function writePlan(p) {
  try { if (p) localStorage.setItem(KEY, JSON.stringify(p)); else localStorage.removeItem(KEY) } catch { /* yaddaş bağlıdır */ }
}
function streakOf(log) {
  const set = new Set(log)
  let d = new Date()
  if (!set.has(ymd(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(ymd(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}
// Səhifənin surəsi (səhifə bir neçə surəni əhatə edə bilər — başlayan sonuncusu)
function surahAtPage(p) {
  let s = 1
  for (let i = 0; i < SURAH_TABLE.length; i++) if (SURAH_TABLE[i][0] <= p) s = i + 1
  return s
}
const juzAtPage = p => JUZ_START_PAGES.reduce((j, start, i) => (start <= p ? i + 1 : j), 1)

export default function KhatmPlanner({ lang, surahName }) {
  const t = pickUi(L, lang)
  const navigate = useNavigate()
  const [plan, setPlan] = useState(readPlan)
  const [days, setDays] = useState(30)
  const save = p => { writePlan(p); setPlan(p) }

  const info = useMemo(() => {
    if (!plan) return null
    const today = ymd()
    const perDay = Math.ceil(MUSHAF_PAGES / plan.days)
    const dayNo = Math.max(1, Math.min(plan.days, dayDiff(plan.start, today) + 1))
    const target = Math.min(MUSHAF_PAGES, dayNo * perDay)
    const from = Math.min(MUSHAF_PAGES, plan.done + 1)
    // Bugünkü porsiya həmişə bir günlük həcmdir; geri qalma ayrıca yazılır
    const to = Math.min(MUSHAF_PAGES, plan.done + perDay)
    return { today, perDay, dayNo, target, from, to, diff: plan.done - target, readToday: plan.log.includes(today) }
  }, [plan])

  const href = p => `${pathFor('mushaf', lang)}?p=${p}`
  const go = p => e => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href(p)) }

  if (!plan) {
    return (
      <section className="qk" aria-labelledby="qk-h">
        <div className="qk__head">
          <span className="ui-icon-tile" aria-hidden="true"><Icon name="target" /></span>
          <div>
            <span className="ui-eyebrow">{t.eyebrow}</span>
            <h2 className="qk__title" id="qk-h">{t.title}</h2>
          </div>
        </div>
        <p className="qk__lead">{t.lead}</p>
        <p className="qk__pick" id="qk-pick">{t.pick}</p>
        <div className="qk__days" role="group" aria-labelledby="qk-pick">
          {DAY_OPTIONS.map(d => (
            <button type="button" key={d} className="ui-chip" aria-pressed={days === d} onClick={() => setDays(d)}>
              {t.days(d)}
            </button>
          ))}
        </div>
        <div className="qk__foot">
          <span className="qk__per ui-num">{t.perDay(Math.ceil(MUSHAF_PAGES / days))}</span>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => save({ days, start: ymd(), done: 0, log: [] })}>
            <Icon name="play" className="ui-btn__icon" />{t.start}
          </button>
        </div>
      </section>
    )
  }

  const finished = plan.done >= MUSHAF_PAGES
  const streak = streakOf(plan.log)
  const markDone = () => {
    const log = plan.log.includes(info.today) ? plan.log : [...plan.log, info.today].slice(-400)
    save({ ...plan, done: info.to, log })
  }
  const reset = () => { if (window.confirm(t.resetConfirm)) save(null) }
  const s = surahAtPage(info.from)

  return (
    <section className="qk qk--active" aria-labelledby="qk-h">
      <div className="qk__head">
        <ProgressRing value={plan.done} max={MUSHAF_PAGES} size={76} thickness={8} />
        <div>
          <span className="ui-eyebrow">{t.eyebrow} · {t.days(plan.days)}</span>
          <h2 className="qk__title" id="qk-h">{finished ? t.finished : t.today}</h2>
          {!finished && <p className="qk__sub ui-num">{t.dayN(info.dayNo, plan.days)}</p>}
        </div>
      </div>
      {!finished && (
        <div className="qk__portion">
          <span className="qk__pages ui-num">{t.pages(info.from, info.to)}</span>
          <span className="qk__where">
            {surahName(s)} · {lang === 'ar' ? `الجزء ${juzAtPage(info.from)}` : juzLabel(lang, juzAtPage(info.from))}
          </span>
        </div>
      )}
      <dl className="qk__stats">
        <div><dt>{t.of}</dt><dd className="ui-num" dir="ltr">{plan.done} / {MUSHAF_PAGES}</dd></div>
        <div><dt>{t.left}</dt><dd className="ui-num">{MUSHAF_PAGES - plan.done}</dd></div>
        <div><dt>{t.streak}</dt><dd className="ui-num">{streak}</dd></div>
      </dl>
      {!finished && (
        <p className={`qk__status${info.diff < 0 ? ' is-behind' : ''}`}>
          {info.diff < 0 ? t.behind(-info.diff) : info.diff > 0 ? t.ahead(info.diff) : t.onTrack}
        </p>
      )}
      <div className="qk__foot">
        {!finished && (
          <>
            <a className="ui-btn ui-btn--secondary ui-btn--sm" href={href(info.from)} onClick={go(info.from)}>
              <Icon name="mushaf" className="ui-btn__icon" />{t.open}
            </a>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={markDone}>
              <Icon name="check" className="ui-btn__icon" />{t.done}
            </button>
          </>
        )}
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm qk__reset" onClick={reset}>
          <Icon name="refresh" className="ui-btn__icon" />{t.reset}
        </button>
      </div>
      <p className="qk__note">{t.note}</p>
    </section>
  )
}

function juzLabel(lang, n) {
  switch (lang) {
    case 'en': return `Juz ${n}`
    case 'ru': return `Джуз ${n}`
    case 'tr': return `${n}. cüz`
    default: return `Cüz ${n}`
  }
}
