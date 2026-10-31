// ═══════════════════════════════════════════════════════
// Sayt statistikası (kukisiz) — admin bölməsi
//
// Mənbə: GET /api/admin/analytics?from&to (server/analytics.js) — yalnız cəmlər.
// Qrafiklər əl ilə yazılmış SVG-dir (kitabxana yoxdur):
//   • xətt + sahə: gündəlik baxışlar və ziyarətçilər (bir ox, iki seriya,
//     əfsanə + uc etiketləri, krosheyr + ipucu, ox düymələri ilə gəzmək)
//   • üfüqi zolaqlar: səhifələr, mənbələr, dillər, cihazlar, brauzerlər
// Hər qrafikin altında "Cədvəl kimi göstər" — eyni rəqəmlər mətnlə.
// Seriya rəngləri (dataviz validatoru ilə yoxlanılıb, işıqlı və qaranlıq):
//   --an-s1 = --emerald-500, --an-s2 = --sand-600 (AnalyticsManager.css).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../../contexts/LangContext'
import { apiFetch } from '../../api/http'
import { AdminHeader, AdminEmpty, AdminAlert, SectionTitle } from './AdminUi'
import Icon from '../Icon'
import '../../styles/AnalyticsManager.css'

const LABELS = {
  az: {
    title: 'Sayt statistikası', sub: 'Kukisiz, anonim ziyarət statistikası — bazada yalnız gündəlik cəmlər saxlanılır',
    range: 'Dövr', d7: 'Son 7 gün', d30: 'Son 30 gün', d90: 'Son 90 gün', refresh: 'Yenilə',
    views: 'Baxışlar', visitors: 'Ziyarətçilər', perVisit: 'Baxış / ziyarətçi', topLang: 'Əsas dil',
    visitorsHint: 'Günlük unikalların cəmi (təxmini)', pagesHint: 'səhifə',
    trend: 'Gündəlik baxışlar və ziyarətçilər', pages: 'Ən çox baxılan səhifələr', referrers: 'Gəlinən saytlar',
    languages: 'Dillər', devices: 'Cihazlar', browsers: 'Brauzerlər',
    table: 'Cədvəl kimi göstər', date: 'Tarix', item: 'Ad', share: 'Pay',
    empty: 'Bu dövr üçün hələ məlumat yoxdur.', noRefs: 'Bu dövrdə xarici saytdan keçid olmayıb.',
    error: 'Statistika yüklənmədi', loading: 'Yüklənir...',
    home: 'Ana səhifə', other: 'Digər', notFound: 'Tapılmayan səhifə (404)',
    keys: 'Günlər arasında ox düymələri ilə keçin.', peak: 'Ən yüksək gün',
    dev: { mobile: 'Mobil cihaz', tablet: 'Planşet', desktop: 'Kompüter' },
    langNames: ['Azərbaycan dili', 'İngilis dili', 'Rus dili', 'Ərəb dili', 'Türk dili'],   // LANG_CODES sırası ilə
  },
  en: {
    title: 'Site analytics', sub: 'Cookieless, anonymous visit statistics — only daily totals are stored',
    range: 'Period', d7: 'Last 7 days', d30: 'Last 30 days', d90: 'Last 90 days', refresh: 'Refresh',
    views: 'Page views', visitors: 'Visitors', perVisit: 'Views per visitor', topLang: 'Top language',
    visitorsHint: 'Sum of daily uniques (approximate)', pagesHint: 'pages',
    trend: 'Daily page views and visitors', pages: 'Most viewed pages', referrers: 'Referring sites',
    languages: 'Languages', devices: 'Devices', browsers: 'Browsers',
    table: 'Show as table', date: 'Date', item: 'Name', share: 'Share',
    empty: 'No data for this period yet.', noRefs: 'No visits from other sites in this period.',
    error: 'Could not load analytics', loading: 'Loading...',
    home: 'Home page', other: 'Other', notFound: 'Not found page (404)',
    keys: 'Use the arrow keys to move between days.', peak: 'Busiest day',
    dev: { mobile: 'Phone', tablet: 'Tablet', desktop: 'Desktop computer' },
    langNames: ['Azerbaijani', 'English', 'Russian', 'Arabic', 'Turkish'],   // LANG_CODES sırası ilə
  },
  ru: {
    title: 'Статистика сайта', sub: 'Анонимная статистика посещений без куки — в базе хранятся только дневные итоги',
    range: 'Период', d7: 'Последние 7 дней', d30: 'Последние 30 дней', d90: 'Последние 90 дней', refresh: 'Обновить',
    views: 'Просмотры', visitors: 'Посетители', perVisit: 'Просмотров на посетителя', topLang: 'Основной язык',
    visitorsHint: 'Сумма уникальных за каждый день (приблизительно)', pagesHint: 'страниц',
    trend: 'Просмотры и посетители по дням', pages: 'Самые просматриваемые страницы', referrers: 'Сайты-источники',
    languages: 'Языки', devices: 'Устройства', browsers: 'Браузеры',
    table: 'Показать таблицей', date: 'Дата', item: 'Название', share: 'Доля',
    empty: 'За этот период данных пока нет.', noRefs: 'За этот период переходов с других сайтов не было.',
    error: 'Не удалось загрузить статистику', loading: 'Загрузка...',
    home: 'Главная страница', other: 'Прочее', notFound: 'Страница не найдена (404)',
    keys: 'Переходите между днями стрелками.', peak: 'Самый активный день',
    dev: { mobile: 'Телефон', tablet: 'Планшет', desktop: 'Компьютер' },
    langNames: ['Азербайджанский', 'Английский', 'Русский', 'Арабский', 'Турецкий'],   // LANG_CODES sırası ilə
  },
  ar: {
    title: 'إحصائيات الموقع', sub: 'إحصائيات زيارات مجهولة بلا ملفات تعريف ارتباط — تُحفظ المجاميع اليومية فقط',
    range: 'الفترة', d7: 'آخر 7 أيام', d30: 'آخر 30 يومًا', d90: 'آخر 90 يومًا', refresh: 'تحديث',
    views: 'المشاهدات', visitors: 'الزوار', perVisit: 'مشاهدات لكل زائر', topLang: 'اللغة الأولى',
    visitorsHint: 'مجموع الزوار الفريدين يوميًا (تقريبي)', pagesHint: 'صفحة',
    trend: 'المشاهدات والزوار يوميًا', pages: 'الصفحات الأكثر مشاهدة', referrers: 'المواقع المُحيلة',
    languages: 'اللغات', devices: 'الأجهزة', browsers: 'المتصفحات',
    table: 'عرض كجدول', date: 'التاريخ', item: 'الاسم', share: 'النسبة',
    empty: 'لا توجد بيانات لهذه الفترة بعد.', noRefs: 'لا زيارات من مواقع أخرى في هذه الفترة.',
    error: 'تعذّر تحميل الإحصائيات', loading: 'جارٍ التحميل...',
    home: 'الصفحة الرئيسية', other: 'أخرى', notFound: 'صفحة غير موجودة (404)',
    keys: 'استخدم مفاتيح الأسهم للتنقل بين الأيام.', peak: 'أكثر الأيام نشاطًا',
    dev: { mobile: 'هاتف', tablet: 'جهاز لوحي', desktop: 'حاسوب مكتبي' },
    langNames: ['الأذربيجانية', 'الإنجليزية', 'الروسية', 'العربية', 'التركية'],   // LANG_CODES sırası ilə
  },
  tr: {
    title: 'Site istatistikleri', sub: 'Çerezsiz, anonim ziyaret istatistikleri — veritabanında yalnızca günlük toplamlar tutulur',
    range: 'Dönem', d7: 'Son 7 gün', d30: 'Son 30 gün', d90: 'Son 90 gün', refresh: 'Yenile',
    views: 'Görüntülemeler', visitors: 'Ziyaretçiler', perVisit: 'Ziyaretçi başına görüntüleme', topLang: 'Başlıca dil',
    visitorsHint: 'Günlük tekil ziyaretçilerin toplamı (yaklaşık)', pagesHint: 'sayfa',
    trend: 'Günlük görüntülemeler ve ziyaretçiler', pages: 'En çok görüntülenen sayfalar', referrers: 'Yönlendiren siteler',
    languages: 'Diller', devices: 'Cihazlar', browsers: 'Tarayıcılar',
    table: 'Tablo olarak göster', date: 'Tarih', item: 'Ad', share: 'Pay',
    empty: 'Bu dönem için henüz veri yok.', noRefs: 'Bu dönemde başka sitelerden gelen ziyaret olmadı.',
    error: 'İstatistikler yüklenemedi', loading: 'Yükleniyor...',
    home: 'Ana sayfa', other: 'Diğer', notFound: 'Bulunamayan sayfa (404)',
    keys: 'Günler arasında ok tuşlarıyla gezinin.', peak: 'En yoğun gün',
    dev: { mobile: 'Cep telefonu', tablet: 'Tablet bilgisayar', desktop: 'Masaüstü bilgisayar' },
    langNames: ['Azerbaycanca', 'İngilizce', 'Rusça', 'Arapça', 'Türkçe'],   // LANG_CODES sırası ilə
  },
}

// langNames massivinin sırası (dil açarları obyekti check-lang-i çaşdırmasın deyə massiv)
const LANG_CODES = ['az', 'en', 'ru', 'ar', 'tr']
const langName = (l, code) => l.langNames[LANG_CODES.indexOf(code)] || code
const LOCALES = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar-u-nu-latn', tr: 'tr-TR' }
const PRESETS = [7, 30, 90]
const DAY_MS = 86400e3
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10)

// Bəzi brauzerlərin ICU-sunda az ay adları yoxdur ("M10 2") — az üçün əl ilə
const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
function dateFormatter(lang, long) {
  if (lang === 'az') {
    return {
      format: (d) => {
        const m = AZ_MONTHS[d.getUTCMonth()]
        return long ? `${d.getUTCDate()} ${m} ${d.getUTCFullYear()}` : `${d.getUTCDate()} ${m.slice(0, 3)}`
      },
    }
  }
  return new Intl.DateTimeFormat(LOCALES[lang], long
    ? { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function rangeFor(days) {
  const to = isoDay(Date.now())
  return { from: isoDay(Date.parse(to + 'T00:00:00Z') - (days - 1) * DAY_MS), to }
}

/** Konteynerin piksel eni (SVG mətni dartılmasın deyə viewBox miqyası yox). */
function useWidth(fallback = 640) {
  const ref = useRef(null)
  const [w, setW] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const set = () => setW(Math.max(260, Math.floor(el.clientWidth)))
    set()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

/** Təmiz ox addımı: 1·2·5 × 10^n, tam ədəd. */
function niceTicks(max, count = 4) {
  if (!(max > 0)) return [0, 1, 2, 3, 4]
  const raw = max / count
  const p = 10 ** Math.floor(Math.log10(raw))
  const n = raw / p
  const step = Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p)
  const top = Math.ceil(max / step) * step
  const out = []
  for (let v = 0; v <= top + 1e-9; v += step) out.push(v)
  return out
}

// ─── Xətt + sahə qrafiki ─────────────────────────────────

function TrendChart({ series, l, lang, fmt, fmtAxis }) {
  const [ref, w] = useWidth()
  const [idx, setIdx] = useState(null)
  const titleId = useId()
  const descId = useId()
  const H = 260
  const M = { top: 16, right: 76, bottom: 28, left: 44 }
  const iw = Math.max(10, w - M.left - M.right)
  const ih = H - M.top - M.bottom
  const n = series.length

  const dFmt = useMemo(() => dateFormatter(lang, false), [lang])
  const dFmtLong = useMemo(() => dateFormatter(lang, true), [lang])
  const dateOf = (d) => new Date(d + 'T00:00:00Z')

  const max = Math.max(1, ...series.map((s) => Math.max(s.views, s.visitors)))
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]
  const x = (i) => M.left + (n <= 1 ? iw / 2 : (i * iw) / (n - 1))
  const y = (v) => M.top + ih - (v / top) * ih

  const line = (key) => series.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s[key]).toFixed(1)}`).join('')
  const area = `${line('views')}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`

  const xCount = Math.min(n, w < 480 ? 3 : 6)
  const xIdx = xCount <= 1 ? [0] : Array.from(new Set(Array.from({ length: xCount }, (_, k) => Math.round((k * (n - 1)) / (xCount - 1)))))

  const last = series[n - 1] || { views: 0, visitors: 0 }
  const yv = y(last.views)
  const yu = y(last.visitors)
  const endLabels = Math.abs(yv - yu) >= 14   // yaxındırsa üst-üstə yığma — əfsanə və ipucu kifayətdir

  const peak = series.reduce((a, s) => (s.views > a.views ? s : a), series[0] || { views: 0, day: '' })
  const totalViews = series.reduce((a, s) => a + s.views, 0)
  const pointText = (i) => {
    const s = series[i]
    return s ? `${dFmtLong.format(dateOf(s.day))}: ${l.views} ${fmt(s.views)}, ${l.visitors} ${fmt(s.visitors)}` : ''
  }

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left
    const i = n <= 1 ? 0 : Math.round(((px - M.left) / iw) * (n - 1))
    setIdx(Math.min(n - 1, Math.max(0, i)))
  }
  const onKey = (e) => {
    const k = e.key
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(k)) return
    e.preventDefault()
    setIdx((cur) => {
      const c = cur == null ? n - 1 : cur
      if (k === 'Home') return 0
      if (k === 'End') return n - 1
      return Math.min(n - 1, Math.max(0, c + (k === 'ArrowRight' ? 1 : -1)))
    })
  }

  const cur = idx != null ? series[idx] : null
  const tipLeft = idx != null ? x(idx) : 0
  const tipFlip = tipLeft > w / 2

  return (
    <figure className="an-figure">
      <ul className="an-legend" aria-hidden="true">
        <li><span className="an-key an-key--s1" />{l.views}</li>
        <li><span className="an-key an-key--s2" />{l.visitors}</li>
      </ul>
      <div
        ref={ref}
        className="an-chart"
        dir="ltr"
        role="group"
        tabIndex={0}
        aria-labelledby={titleId}
        aria-describedby={descId}
        onPointerMove={onMove}
        onPointerLeave={() => setIdx(null)}
        onFocus={() => setIdx((c) => (c == null ? n - 1 : c))}
        onBlur={() => setIdx(null)}
        onKeyDown={onKey}
      >
        <span id={titleId} className="ui-sr-only">{l.trend}</span>
        <span id={descId} className="ui-sr-only">
          {`${l.views}: ${fmt(totalViews)}. ${l.peak}: ${peak.day ? dFmtLong.format(dateOf(peak.day)) : '—'} (${fmt(peak.views)}). ${l.keys}`}
        </span>
        <svg width={w} height={H} aria-hidden="true" focusable="false" className="an-svg">
          {ticks.map((t) => (
            <g key={t}>
              <line className={t === 0 ? 'an-baseline' : 'an-gridline'} x1={M.left} x2={M.left + iw} y1={y(t)} y2={y(t)} />
              <text className="an-axis-text" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{fmtAxis(t, top)}</text>
            </g>
          ))}
          {xIdx.map((i) => (
            <text key={i} className="an-axis-text" x={x(i)} y={H - 8}
              textAnchor={n > 1 && i === 0 ? 'start' : n > 1 && i === n - 1 ? 'end' : 'middle'}>
              {dFmt.format(dateOf(series[i].day))}
            </text>
          ))}
          <path d={area} className="an-area" />
          <path d={line('views')} className="an-line an-line--s1" />
          <path d={line('visitors')} className="an-line an-line--s2" />
          {/* Uc nöqtələri + seçici birbaşa etiketlər */}
          <circle className="an-dot an-dot--s1" cx={x(n - 1)} cy={yv} r="4" />
          <circle className="an-dot an-dot--s2" cx={x(n - 1)} cy={yu} r="4" />
          {endLabels && (
            <>
              <text className="an-end-text" x={x(n - 1) + 10} y={yv} dy="0.32em">{fmt(last.views)}</text>
              <text className="an-end-text" x={x(n - 1) + 10} y={yu} dy="0.32em">{fmt(last.visitors)}</text>
            </>
          )}
          {cur && (
            <g className="an-cross">
              <line className="an-cross-line" x1={x(idx)} x2={x(idx)} y1={M.top} y2={M.top + ih} />
              <circle className="an-dot an-dot--s1" cx={x(idx)} cy={y(cur.views)} r="4" />
              <circle className="an-dot an-dot--s2" cx={x(idx)} cy={y(cur.visitors)} r="4" />
            </g>
          )}
        </svg>
        {cur && (
          <div className={`an-tip${tipFlip ? ' is-flip' : ''}`} style={{ left: tipLeft, top: M.top }} aria-hidden="true">
            <div className="an-tip__head">{dFmtLong.format(dateOf(cur.day))}</div>
            <div className="an-tip__row"><span className="an-tip__key an-tip__key--s1" /><strong>{fmt(cur.views)}</strong><span>{l.views}</span></div>
            <div className="an-tip__row"><span className="an-tip__key an-tip__key--s2" /><strong>{fmt(cur.visitors)}</strong><span>{l.visitors}</span></div>
          </div>
        )}
        <span className="ui-sr-only" aria-live="polite">{idx != null ? pointText(idx) : ''}</span>
      </div>
      <details className="an-table-wrap">
        <summary>{l.table}</summary>
        <div className="an-table-scroll">
          <table className="an-table">
            <caption className="ui-sr-only">{l.trend}</caption>
            <thead><tr><th scope="col">{l.date}</th><th scope="col">{l.views}</th><th scope="col">{l.visitors}</th></tr></thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.day}><th scope="row">{dFmtLong.format(dateOf(s.day))}</th><td>{fmt(s.views)}</td><td>{fmt(s.visitors)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}

// ─── Üfüqi zolaq qrafiki (tək seriya — əfsanə yoxdur, başlıq kifayətdir) ───

function barPath(x0, x1, y, h, rtl) {
  const len = Math.abs(x1 - x0)
  const r = Math.min(4, len / 2, h / 2)
  if (!rtl) {
    return `M${x0},${y}H${x1 - r}A${r},${r} 0 0 1 ${x1},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x1 - r},${y + h}H${x0}Z`
  }
  return `M${x0},${y}H${x1 + r}A${r},${r} 0 0 0 ${x1},${y + r}V${y + h - r}A${r},${r} 0 0 0 ${x1 + r},${y + h}H${x0}Z`
}

/** Mətn istiqaməti: yol, domen, rəqəm — həmişə LTR ("/prayer" "prayer/" olmasın).
 *  RTL qrafikdə LTR mətn sağ kənara "end" ilə bağlanır. */
const RTL_CHARS = /[֐-ࣿיִ-﷿ﹰ-﻿]/
function textDir(text, rtl) {
  if (!rtl) return { direction: 'ltr', textAnchor: 'start' }
  return RTL_CHARS.test(text) ? { direction: 'rtl', textAnchor: 'start' } : { direction: 'ltr', textAnchor: 'end' }
}

function BarChart({ title, icon, items, l, fmt, rtl, emptyText, colLabel }) {
  const [ref, w] = useWidth(360)
  const [hover, setHover] = useState(null)
  const titleId = useId()
  const total = items.reduce((a, it) => a + it.value, 0)
  const max = Math.max(1, ...items.map((it) => it.value))
  const ROW = 40
  const BAR = 12
  const VALUE_SPACE = 64
  const H = items.length * ROW
  const barMax = Math.max(10, w - VALUE_SPACE)
  const maxChars = Math.max(8, Math.floor((w - 8) / 7.2))
  const clip = (s) => (s.length > maxChars ? s.slice(0, maxChars - 1) + '…' : s)
  const pct = (v) => (total ? Math.round((v / total) * 1000) / 10 : 0)
  const sx = (px) => (rtl ? w - px : px)   // RTL: zolaqlar sağdan böyüyür

  return (
    <section className="admin-section an-card" aria-labelledby={titleId}>
      <h2 id={titleId} className="admin-section-title">
        <span className="ui-icon-tile ui-icon-tile--sm" aria-hidden="true"><Icon name={icon} /></span>
        <span>{title}</span>
      </h2>
      {!items.length ? (
        <p className="an-muted">{emptyText || l.empty}</p>
      ) : (
        <>
          <div ref={ref} className="an-chart">
            <svg width={w} height={H} className="an-svg" role="list" aria-labelledby={titleId}>
              {items.map((it, i) => {
                const y0 = i * ROW
                const bw = Math.max(2, (it.value / max) * barMax)
                const active = hover === i
                return (
                  <g
                    key={it.key}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`${it.label}: ${fmt(it.value)} (${pct(it.value)}%)`}
                    className={`an-bar-row${active ? ' is-active' : ''}`}
                    onPointerEnter={() => setHover(i)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                  >
                    <rect className="an-hit" x="0" y={y0} width={w} height={ROW} />
                    <text className="an-bar-label" x={sx(0)} y={y0 + 13} {...textDir(it.label, rtl)}>{clip(it.label)}</text>
                    <path className="an-bar" d={barPath(sx(0), sx(bw), y0 + 20, BAR, rtl)} />
                    <text className="an-bar-value" x={sx(bw + 6)} y={y0 + 20 + BAR / 2} dy="0.32em" {...textDir(fmt(it.value), rtl)}>{fmt(it.value)}</text>
                  </g>
                )
              })}
            </svg>
            {hover != null && items[hover] && (
              <div className="an-tip an-tip--bar" style={{ top: hover * ROW }} aria-hidden="true">
                <div className="an-tip__row"><strong>{fmt(items[hover].value)}</strong><span>{pct(items[hover].value)}%</span></div>
                <div className="an-tip__head">{items[hover].label}</div>
              </div>
            )}
          </div>
          <details className="an-table-wrap">
            <summary>{l.table}</summary>
            <div className="an-table-scroll">
              <table className="an-table">
                <caption className="ui-sr-only">{title}</caption>
                <thead><tr><th scope="col">{l.item}</th><th scope="col">{colLabel || l.views}</th><th scope="col">{l.share}</th></tr></thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.key}><th scope="row">{it.label}</th><td>{fmt(it.value)}</td><td>{pct(it.value)}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  )
}

// ─── Əsas komponent ──────────────────────────────────────

export default function AnalyticsManager() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az
  const rtl = lang === 'ar'
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const reqId = useRef(0)

  const nf = useMemo(() => new Intl.NumberFormat(LOCALES[lang]), [lang])
  const nfCompact = useMemo(() => new Intl.NumberFormat(LOCALES[lang], { notation: 'compact', maximumFractionDigits: 1 }), [lang])
  const nf2 = useMemo(() => new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 2 }), [lang])
  const fmt = useCallback((v) => nf.format(v), [nf])
  const fmtAxis = useCallback((v, top) => (top >= 10000 ? nfCompact.format(v) : nf.format(v)), [nf, nfCompact])

  const load = useCallback(async (n) => {
    const id = ++reqId.current
    setBusy(true)
    setError('')
    try {
      const { from, to } = rangeFor(n)
      const res = await apiFetch(`/api/admin/analytics?from=${from}&to=${to}`, { admin: true })
      if (id === reqId.current) setData(res)
    } catch (e) {
      if (id === reqId.current) setError(`${l.error}${e && e.status ? ` (${e.status})` : ''}`)
    } finally {
      if (id === reqId.current) setBusy(false)
    }
  }, [l.error])

  useEffect(() => { load(days) }, [days, load])

  const pageLabel = (k) => {
    if (k === '/') return l.home
    if (k === '(other)') return l.other
    if (k === '/404') return l.notFound
    return k
  }
  const map = (list, labelFn) => (list || []).map((r) => ({ key: r.key, label: labelFn ? labelFn(r.key) : r.key, value: r.count ?? r.views }))

  const t = data && data.totals
  const empty = t && t.views === 0

  return (
    <div className={`an-root${busy && data ? ' is-busy' : ''}`} aria-busy={busy || undefined}>
      <AdminHeader icon="analytics" title={l.title} sub={l.sub}>
        <button type="button" onClick={() => load(days)} className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy}>
          <Icon name="refresh" className={`ui-btn__icon${busy ? ' ui-spin' : ''}`} /> {l.refresh}
        </button>
      </AdminHeader>

      {/* Filtr — bir sətir, hər şeyin üstündə */}
      <div className="an-filters" role="group" aria-label={l.range}>
        {PRESETS.map((n) => (
          <button key={n} type="button" className="ui-chip" aria-pressed={days === n} onClick={() => setDays(n)}>
            {l[`d${n}`]}
          </button>
        ))}
      </div>

      {error && <AdminAlert tone="bad">{error}</AdminAlert>}

      {!data && busy && <AdminEmpty icon="analytics" busy>{l.loading}</AdminEmpty>}

      {t && (
        <div className="an-body">
          <dl className="an-kpis">
            <div className="an-kpi">
              <dt>{l.views}</dt>
              <dd className="an-kpi__value">{fmt(t.views)}</dd>
              <dd className="an-kpi__hint">{fmt(t.pages)} {l.pagesHint}</dd>
            </div>
            <div className="an-kpi">
              <dt>{l.visitors}</dt>
              <dd className="an-kpi__value">{fmt(t.visitors)}</dd>
              <dd className="an-kpi__hint">{l.visitorsHint}</dd>
            </div>
            <div className="an-kpi">
              <dt>{l.perVisit}</dt>
              <dd className="an-kpi__value">{nf2.format(t.viewsPerVisit)}</dd>
            </div>
            <div className="an-kpi">
              <dt>{l.topLang}</dt>
              <dd className="an-kpi__value an-kpi__value--text">{t.topLanguage ? langName(l, t.topLanguage) : '—'}</dd>
              {t.topLanguage && data.languages[0] && t.views > 0 && (
                <dd className="an-kpi__hint">{Math.round((data.languages[0].count / t.views) * 100)}%</dd>
              )}
            </div>
          </dl>

          {empty ? (
            <AdminEmpty icon="analytics">{l.empty}</AdminEmpty>
          ) : (
            <>
              <section className="admin-section an-card" aria-label={l.trend}>
                <SectionTitle icon="calendar">{l.trend}</SectionTitle>
                <TrendChart series={data.series} l={l} lang={lang} fmt={fmt} fmtAxis={fmtAxis} />
              </section>

              <BarChart title={l.pages} icon="list" items={map(data.pages, pageLabel)} l={l} fmt={fmt} rtl={rtl} />
              <div className="an-grid">
                <BarChart title={l.referrers} icon="link" items={map(data.referrers)} l={l} fmt={fmt} rtl={rtl} emptyText={l.noRefs} />
                <BarChart title={l.languages} icon="globe" items={map(data.languages, (k) => langName(l, k))} l={l} fmt={fmt} rtl={rtl} />
                <BarChart title={l.devices} icon="phone" items={map(data.devices, (k) => l.dev[k] || k)} l={l} fmt={fmt} rtl={rtl} />
                <BarChart title={l.browsers} icon="compass" items={map(data.browsers, (k) => (k === 'Other' ? l.other : k))} l={l} fmt={fmt} rtl={rtl} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
