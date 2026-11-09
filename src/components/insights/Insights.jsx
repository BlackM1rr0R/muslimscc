// ═══════════════════════════════════════════════════════
// Şəxsi izləyici səhifələrinin ortaq "Analitika" bölməsi (viz v2 bento).
//   <InsightsSection id title lead range onRange hasData empty>{<BentoGrid>…}</InsightsSection>
//   const P = useInsightPeriod(range, today, f, lang)   // açarlar, qruplama, ox yazıları
// Hər səhifə öz kartlarını özü qurur (components/insights/<Səhifə>Insights.jsx);
// məlumat yalnız həmin səhifənin localStorage qeydlərindəndir.
// Stil: src/styles/Insights.css (.ins-*)
// ═══════════════════════════════════════════════════════
import { useMemo } from 'react'
import Icon from '../Icon'
import { RangeTabs } from '../viz'
import { addDayKey, fromDayKey } from '../viz/scale.js'
import { pickUi } from '../../utils/uiText'
import { RANGES, periodKeys, bucketEnd, bucketLabels, weekdayNames } from '../../utils/trackerInsights.js'
import '../../styles/Insights.css'

export const INS = {
  az: {
    eyebrow: 'Analitika', period: 'Dövr', ranges: { 7: '7 gün', 30: '30 gün', 90: '90 gün', 364: 'İl' },
    vs: (n) => (n === 364 ? 'keçən ilə görə' : `əvvəlki ${n} günə görə`),
    noPrev: 'əvvəlki dövrdə qeyd yoxdur', sparkOf: (s) => `${s}: dövr üzrə trend`,
    wdTitle: 'Həftənin günləri', wdSub: 'gündə orta — bu dövr və əvvəlki dövr',
    feedTitle: 'Son qeydlər', feedEmpty: 'Hələ qeyd yoxdur.',
    private: 'Yalnız bu cihazdakı öz qeydlərinizdən hesablanır — heç nə serverə getmir.',
    days: 'gün', perDay: 'gündə', streak: 'Ardıcıl gün', best: 'Ən uzun seriya',
  },
  en: {
    eyebrow: 'Analytics', period: 'Period', ranges: { 7: '7 days', 30: '30 days', 90: '90 days', 364: 'Year' },
    vs: (n) => (n === 364 ? 'vs last year' : `vs previous ${n} days`),
    noPrev: 'nothing logged in the previous period', sparkOf: (s) => `${s}: trend over the period`,
    wdTitle: 'Days of the week', wdSub: 'average per day — this period and the previous one',
    feedTitle: 'Recent entries', feedEmpty: 'Nothing logged yet.',
    private: 'Calculated only from your own records on this device — nothing is sent to a server.',
    days: 'days', perDay: 'per day', streak: 'Day streak', best: 'Best streak',
  },
  ru: {
    eyebrow: 'Аналитика', period: 'Период', ranges: { 7: '7 дней', 30: '30 дней', 90: '90 дней', 364: 'Год' },
    vs: (n) => (n === 364 ? 'к прошлому году' : `к предыдущим ${n} дням`),
    noPrev: 'в прошлом периоде записей нет', sparkOf: (s) => `${s}: динамика за период`,
    wdTitle: 'Дни недели', wdSub: 'в среднем за день — этот и предыдущий период',
    feedTitle: 'Последние записи', feedEmpty: 'Записей пока нет.',
    private: 'Считается только по вашим записям на этом устройстве — ничего не отправляется на сервер.',
    days: 'дн.', perDay: 'в день', streak: 'Дней подряд', best: 'Лучшая серия',
  },
  ar: {
    eyebrow: 'التحليلات', period: 'الفترة', ranges: { 7: '7 أيام', 30: '30 يومًا', 90: '90 يومًا', 364: 'سنة' },
    vs: (n) => (n === 364 ? 'مقارنة بالسنة الماضية' : `مقارنة بالأيام الـ${n} السابقة`),
    noPrev: 'لا تسجيلات في الفترة السابقة', sparkOf: (s) => `${s}: الاتجاه خلال الفترة`,
    wdTitle: 'أيام الأسبوع', wdSub: 'المتوسط في اليوم — هذه الفترة والسابقة',
    feedTitle: 'آخر التسجيلات', feedEmpty: 'لا تسجيلات بعد.',
    private: 'يُحسب من سجلاتك أنت على هذا الجهاز فقط — لا يُرسل شيء إلى الخادم.',
    days: 'يوم', perDay: 'في اليوم', streak: 'أيام متتالية', best: 'أطول سلسلة',
  },
  tr: {
    eyebrow: 'Analiz', period: 'Dönem', ranges: { 7: '7 gün', 30: '30 gün', 90: '90 gün', 364: 'Yıl' },
    vs: (n) => (n === 364 ? 'geçen yıla göre' : `önceki ${n} güne göre`),
    noPrev: 'önceki dönemde kayıt yok', sparkOf: (s) => `${s}: dönem boyunca eğilim`,
    wdTitle: 'Haftanın günleri', wdSub: 'günde ortalama — bu dönem ve önceki dönem',
    feedTitle: 'Son kayıtlar', feedEmpty: 'Henüz kayıt yok.',
    private: 'Yalnızca bu cihazdaki kendi kayıtlarınızdan hesaplanır — hiçbir şey sunucuya gönderilmez.',
    days: 'gün', perDay: 'günde', streak: 'Gün serisi', best: 'En uzun seri',
  },
}
export const insText = (lang) => pickUi(INS, lang, 'en')

/**
 * Dövr köməkçisi: cari/əvvəlki açarlar, il rejimində həftəlik qruplama,
 * ox və izah qutusu yazıları, KPI dəyişməsinin "… görə" mətni.
 */
export function useInsightPeriod(range, today, f, lang) {
  return useMemo(() => {
    const v = insText(lang)
    const { keys, prevKeys } = periodKeys(today, range)
    const bucket = range === 364 ? 7 : 1
    const b = (vals) => bucketEnd(vals, bucket)
    const labels = bucketLabels(keys, bucket)
    const xTick = (k) => (k ? f.date(fromDayKey(k), range === 364 ? { month: 'short' } : { day: 'numeric', month: 'short' }) : '')
    const tipTitle = (k) => {
      if (!k) return ''
      const d = fromDayKey(k)
      if (bucket > 1) return `${f.date(d, { day: 'numeric', month: 'short' })} – ${f.date(fromDayKey(addDayKey(k, bucket - 1)), { day: 'numeric', month: 'short', year: 'numeric' })}`
      return f.date(d, { weekday: 'short', day: 'numeric', month: 'long' })
    }
    const options = RANGES.map(n => ({ value: n, label: v.ranges[n] }))
    return { keys, prevKeys, bucket, b, labels, xTick, tipTitle, vs: v.vs(range), options, wd: weekdayNames(f.date), v, n: range }
  }, [range, today, f, lang])
}

/**
 * Bölmə qabığı: başlıq + dövr seçimi; məlumat yoxdursa izah + "başla" düyməsi
 * (saxta rəqəm göstərilmir — yalnız rəqəmsiz kölgə dekor).
 * empty: { text, action: { label, onClick?, href?, icon? } }
 */
export function InsightsSection({ id, title, lead, range, onRange, hasData, empty, lang, className = '', alt = false, children }) {
  const v = insText(lang)
  const P = { options: RANGES.map(n => ({ value: n, label: v.ranges[n] })) }
  const act = empty?.action
  return (
    <section className={`ui-section ui-section--tight ins${alt ? ' ui-section--alt' : ''} ${className}`.trim()} id={id} aria-labelledby={`${id}-h`} data-testid={`${id}`}>
      <div className="ui-container">
        <div className="ins-head">
          <div className="ins-head__text">
            <span className="ui-eyebrow">{v.eyebrow}</span>
            <h2 id={`${id}-h`} className="ui-title">{title}</h2>
            {lead && <p className="ui-lead">{lead}</p>}
            <p className="ins-private"><Icon name="shield" size={15} /> <span>{v.private}</span></p>
          </div>
          {hasData && onRange && (
            <div className="ins-head__tools">
              <RangeTabs options={P.options} value={range} onChange={onRange} label={v.period} />
            </div>
          )}
        </div>
        {hasData ? children : (
          <div className="ins-empty ui-card" role="status">
            <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--accent" aria-hidden="true"><Icon name="analytics" /></span>
            <div className="ins-empty__body">
              <p className="ins-empty__text">{empty?.text}</p>
              {act && (act.href
                ? <a className="ui-btn ui-btn--primary ui-btn--sm" href={act.href} onClick={act.onClick}>{act.icon && <Icon name={act.icon} className="ui-btn__icon" />}{act.label}</a>
                : <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={act.onClick}>{act.icon && <Icon name={act.icon} className="ui-btn__icon" />}{act.label}</button>)}
            </div>
            <div className="ins-ghost" aria-hidden="true">
              {[0, 1, 2, 3].map(i => <span key={i} className="ins-ghost__kpi"><i /><b /></span>)}
              <svg className="ins-ghost__chart" viewBox="0 0 400 90" preserveAspectRatio="none">
                <path d="M0 70 C40 60 60 30 100 40 S160 75 200 50 S270 15 310 30 S370 55 400 35 V90 H0Z" />
                <path className="ins-ghost__line" d="M0 70 C40 60 60 30 100 40 S160 75 200 50 S270 15 310 30 S370 55 400 35" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

/** Sətirdə ilk qeyd tapılan elementə hamar sürüşmə (empty → "başla" düyməsi). */
export const scrollToSel = (sel) => () => {
  const el = typeof document !== 'undefined' ? document.querySelector(sel) : null
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const focusable = el.matches('button, a, input, textarea, select') ? el : el.querySelector('button, a, input, textarea, select')
  focusable?.focus?.({ preventScroll: true })
}
