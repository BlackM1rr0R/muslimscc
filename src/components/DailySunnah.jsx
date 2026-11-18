// ═══════════════════════════════════════════════════════
// DailySunnah — "Günün sünnəsi"
//
// Hər gün bir kiçik sünnə əməli (sağ əllə yemək, salamı yaymaq, gülümsəmək,
// misvak, xəstə ziyarəti, qardaşa gizli dua …). Əməl tarixə görə determinist
// seçilir (utils/dailySunnah → itemForDate) — bütün istifadəçilərdə eyni gün
// eyni əməl. Hər əməlin altında onu dəlil edən hədis: mətn, mənbə və dərəcə
// saytın öz yoxlanmış hədis məlumatından (utils/hadithData — tənbəl yüklənir)
// OLDUĞU KİMİ götürülür, /hadith/<id> səhifəsinə keçid var. Əməl adları
// (data/dailySunnah.js) hədis sözü deyil, saytın qısa UI ifadələridir.
// "Etdim" günü qeyd edir; ay cədvəlində edilən günlər rənglənir, ardıcıllıq
// (streak) sayılır. Yalnız bu cihazda: localStorage muslim_cc_daily_sunnah.
// Hərəkət: yalnız düymədə qısa keçid (CSS, reduced-motion-da yoxdur).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { isPlainClick } from './PageLink'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced'
import { loadHadithData, peekHadithData } from '../utils/hadithData'
import { localizeSource } from '../utils/sourceNames'
// Hədis səhifələri yalnız 5 əsas dildə var (/de/hadith/<id> — server 404): əlavə dildə /en/hadith/<id>
import { pathFor, canonicalLang } from '../seo/routes'
import { DAILY_SUNNAH } from '../data/dailySunnah'
import {
  dayKey, itemForDate, loadLog, saveLog, setDone, streakOf, doneInMonth, monthCells, fromKey,
} from '../utils/dailySunnah'
import '../styles/DailySunnah.css'

const T = {
  az: {
    ey: 'Hər gün bir sünnə', title: 'Günün sünnəsi',
    lead: 'Peyğəmbərin ﷺ kiçik, amma bərəkətli sünnələrindən biri — hər gün yenisi. Hər birinin altında saytdakı səhih hədis var.',
    proof: 'Dəlil', open: 'Hədisə bax', done: 'Etdim', undo: 'Etdim — geri al',
    doneMsg: 'Əlhəmdulillah! Bu gün qeyd olundu.', streak: 'Ardıcıl gün', month: 'Bu ay',
    prev: 'Əvvəlki ay', next: 'Növbəti ay', cal: 'Sünnə təqvimi', loading: 'Hədis yüklənir…',
    note: 'Qeydlər yalnız bu cihazda saxlanır.', doneDay: 'edildi',
  },
  en: {
    ey: 'One sunnah a day', title: 'Sunnah of the day',
    lead: 'One of the Prophet’s ﷺ small but blessed sunnahs — a new one each day. Each comes with a sahih hadith from this site.',
    proof: 'Evidence', open: 'Open hadith', done: 'I did it', undo: 'Done — undo',
    doneMsg: 'Alhamdulillah! Today is marked.', streak: 'Day streak', month: 'This month',
    prev: 'Previous month', next: 'Next month', cal: 'Sunnah calendar', loading: 'Loading hadith…',
    note: 'Your marks are stored only on this device.', doneDay: 'done',
  },
  ru: {
    ey: 'Одна сунна в день', title: 'Сунна дня',
    lead: 'Одна из небольших, но благословенных сунн Пророка ﷺ — каждый день новая. К каждой приложен достоверный хадис с сайта.',
    proof: 'Довод', open: 'Открыть хадис', done: 'Сделал', undo: 'Сделано — отменить',
    doneMsg: 'Альхамдулиллях! Сегодня отмечено.', streak: 'Дней подряд', month: 'В этом месяце',
    prev: 'Предыдущий месяц', next: 'Следующий месяц', cal: 'Календарь сунны', loading: 'Загрузка хадиса…',
    note: 'Отметки хранятся только на этом устройстве.', doneDay: 'сделано',
  },
  ar: {
    ey: 'سنة كل يوم', title: 'سنة اليوم',
    lead: 'سنة من سنن النبي ﷺ اليسيرة المباركة — كل يوم سنة جديدة، ومع كل واحدة حديث صحيح من أحاديث الموقع.',
    proof: 'الدليل', open: 'افتح الحديث', done: 'فعلتُها', undo: 'تمّت — تراجع',
    doneMsg: 'الحمد لله! سُجِّل هذا اليوم.', streak: 'أيام متتالية', month: 'هذا الشهر',
    prev: 'الشهر السابق', next: 'الشهر التالي', cal: 'تقويم السنن', loading: 'جارٍ تحميل الحديث…',
    note: 'تُحفظ علاماتك على هذا الجهاز فقط.', doneDay: 'تمّت',
  },
  tr: {
    ey: 'Her gün bir sünnet', title: 'Günün sünneti',
    lead: 'Peygamber’in ﷺ küçük ama bereketli sünnetlerinden biri — her gün yenisi. Her birinin altında sitedeki sahih hadis var.',
    proof: 'Delil', open: 'Hadise git', done: 'Yaptım', undo: 'Yapıldı — geri al',
    doneMsg: 'Elhamdülillah! Bugün işaretlendi.', streak: 'Art arda gün', month: 'Bu ay',
    prev: 'Önceki ay', next: 'Sonraki ay', cal: 'Sünnet takvimi', loading: 'Hadis yükleniyor…',
    note: 'İşaretler yalnızca bu cihazda saklanır.', doneDay: 'yapıldı',
  },
}

// Dərəcə adları — HadithPage-dəki GRADE_UI ilə eyni sözlər (məlumatdakı koda görə)
const GRADE = {
  az: { s: 'Səhih', h: 'Həsən', mq: 'Səhih (səhabə sözü)', d: 'Zəif', m: 'İxtilaflı' },
  en: { s: 'Sahih', h: 'Hasan', mq: 'Sahih (a Companion’s words)', d: 'Weak', m: 'Disputed' },
  ru: { s: 'Сахих', h: 'Хасан', mq: 'Сахих (слова сподвижника)', d: 'Слабый', m: 'Спорный' },
  ar: { s: 'صحيح', h: 'حسن', mq: 'صحيح موقوفًا', d: 'ضعيف', m: 'مختلف فيه' },
  tr: { s: 'Sahih', h: 'Hasen', mq: 'Sahih (sahâbî sözü)', d: 'Zayıf', m: 'İhtilaflı' },
}
const ALBANI = { az: 'Albani', en: 'al-Albani', ru: 'аль-Албани', ar: 'الألباني', tr: 'Elbânî' }
const graderName = (gb, lang) => (gb === 'bukhari' ? localizeSource('Buxari', lang)
  : gb === 'muslim' ? localizeSource('Muslim', lang)
  : gb === 'albani' ? pickUi(ALBANI, lang, 'en') : '')

const itemText = (item, lang) => item[lang] || item.en

function fmt(lang, opts, d) {
  try { return new Intl.DateTimeFormat(lang, opts).format(d) } catch { return new Intl.DateTimeFormat('en', opts).format(d) }
}

export default function DailySunnah({ date }) {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const nav = useNavigate()

  // Bu gün — tab yenidən görünəndə (gecə yarısından sonra) yenilənir
  const [today, setToday] = useState(() => dayKey(date || new Date()))
  useEffect(() => {
    if (date) return undefined
    const sync = () => { if (!document.hidden) setToday(dayKey(new Date())) }
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [date])

  const item = useMemo(() => itemForDate(DAILY_SUNNAH, fromKey(today)), [today])
  const [title, tip] = itemText(item, lang)

  // Hədis — saytın öz məlumatından (cari dil; əlavə dillərdə ingiliscə)
  const [data, setData] = useState(() => peekHadithData(lang))
  useEffect(() => {
    let live = true
    loadHadithData(lang).then(d => { if (live) setData(d) }).catch(() => { /* hədis bloku görünmür */ })
    return () => { live = false }
  }, [lang])
  const hadith = useMemo(() => {
    if (!data) return null
    const id = data.aliases?.get(item.hadith) ?? item.hadith
    return data.list.find(h => Number(h.id) === Number(id)) || null
  }, [data, item])

  // Qeydlər
  const [log, setLog] = useState(() => loadLog())
  const done = Boolean(log[today])
  const toggle = () => {
    const next = setDone(log, today, item.id, !done)
    setLog(next)
    saveLog(next)
  }
  const streak = streakOf(log, today)

  // Ay cədvəli
  const t0 = fromKey(today)
  const [view, setView] = useState(() => ({ y: t0.getFullYear(), m: t0.getMonth() }))
  const cells = useMemo(() => monthCells(view.y, view.m), [view])
  const monthLabel = useMemo(() => fmt(lang, { month: 'long', year: 'numeric' }, new Date(view.y, view.m, 1, 12)), [lang, view])
  const weekdays = useMemo(() => {
    // 2024-01-01 bazar ertəsidir
    return Array.from({ length: 7 }, (_, i) => fmt(lang, { weekday: 'narrow' }, new Date(2024, 0, 1 + i, 12)))
  }, [lang])
  const monthCount = doneInMonth(log, view.y, view.m)
  const shift = (d) => setView(v => {
    const n = new Date(v.y, v.m + d, 1, 12)
    return { y: n.getFullYear(), m: n.getMonth() }
  })

  const href = hadith ? pathFor('hadith', canonicalLang('hadith', lang, String(hadith.id)), String(hadith.id)) : null
  const text = (hadith?.text || '').trim()
  const showText = text && text !== (hadith?.ar || '').trim()
  const gradeName = hadith?.g ? pickUi(GRADE, lang, 'en')[hadith.g] : ''
  const by = hadith?.gb ? graderName(hadith.gb, lang) : ''

  return (
    <section className={`ui-card ds${reduced ? ' ds--still' : ''}`} data-testid="daily-sunnah" data-item={item.id} aria-labelledby="ds-title">
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="ds-title" className="ds__title">{u.title}</h2>
      <p className="ds__lead">{u.lead}</p>

      <div className="ds__grid">
        <article className="ds__today">
          <p className="ds__date">{fmt(lang, { weekday: 'long', day: 'numeric', month: 'long' }, t0)}</p>
          <h3 className="ds__act">{title}</h3>
          <p className="ds__tip">{tip}</p>

          <figure className="ds__proof" aria-label={u.proof}>
            <span className="ds__proof-lbl">{u.proof}</span>
            {hadith ? (
              <>
                <blockquote className="ds__quote">
                  <p className="ds__ar ui-arabic" lang="ar" dir="rtl">{hadith.ar}</p>
                  {showText && <p className="ds__tx">{text}</p>}
                </blockquote>
                <figcaption className="ds__src">
                  <span>— {localizeSource(hadith.source, lang)}</span>
                  {gradeName && (
                    <span className={`ds__grade ds__grade--${hadith.g}`} data-grade={hadith.g}>
                      <span className="ds__grade-dot" aria-hidden="true" />{gradeName}{by && ` · ${by}`}
                    </span>
                  )}
                  {href && (
                    <a className="ui-link ds__open" href={href}
                      onClick={(e) => { if (isPlainClick(e)) { e.preventDefault(); nav(href) } }}>
                      {u.open} <Icon name="arrow" size={13} className="ui-link__arrow ui-flip-rtl" />
                    </a>
                  )}
                </figcaption>
              </>
            ) : (
              <p className="ds__loading">{u.loading}</p>
            )}
          </figure>

          <div className="ds__actions">
            <button type="button" data-testid="ds-done" aria-pressed={done}
              className={`ui-btn ${done ? 'ui-btn--secondary' : 'ui-btn--primary'} ds__done${done ? ' is-done' : ''}`}
              onClick={toggle}>
              <Icon name="check" size={16} /> {done ? u.undo : u.done}
            </button>
            <p className="ds__msg" role="status" aria-live="polite">{done ? u.doneMsg : ''}</p>
          </div>
        </article>

        <div className="ds__side">
          <dl className="ds__stats">
            <div><dt>{u.streak}</dt><dd className="ui-num" data-testid="ds-streak">{streak}</dd></div>
            <div><dt>{u.month}</dt><dd className="ui-num">{monthCount}</dd></div>
          </dl>
          <div className="ds__cal" role="group" aria-label={u.cal}>
            <div className="ds__cal-head">
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm ds__nav" onClick={() => shift(-1)} aria-label={u.prev}>
                <Icon name="chevronLeft" size={16} className="ui-flip-rtl" />
              </button>
              <span className="ds__month">{monthLabel}</span>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm ds__nav" onClick={() => shift(1)} aria-label={u.next}>
                <Icon name="chevron" size={16} className="ui-flip-rtl" />
              </button>
            </div>
            <div className="ds__week" aria-hidden="true">
              {weekdays.map((w, i) => <span key={i}>{w}</span>)}
            </div>
            <div className="ds__days">
              {cells.map((c, i) => c ? (
                <span key={c.key} data-day={c.key}
                  className={`ds__day${log[c.key] ? ' is-done' : ''}${c.key === today ? ' is-today' : ''}${c.key > today ? ' is-future' : ''}`}
                  title={log[c.key] ? `${c.day} — ${u.doneDay}` : undefined}>
                  <span className="ui-num">{c.day}</span>
                  {log[c.key] && <span className="ds__sr">{u.doneDay}</span>}
                </span>
              ) : <span key={`e${i}`} className="ds__day ds__day--empty" aria-hidden="true" />)}
            </div>
          </div>
          <p className="ds__note">{u.note}</p>
        </div>
      </div>
    </section>
  )
}
