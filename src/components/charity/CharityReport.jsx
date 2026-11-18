// ═══════════════════════════════════════════════════════
// CharityReport — "Sədəqə hesabatı" (/charity, /account): charity_log-dan illik xülasə
//
//   <CharityReport lang="az" entries={entries} compact moreHref onMore />
//
// • Hesab: utils/charityReport (saf, testli). Aylar üzrə sütunlar, növlər üzrə zolaqlar
//   (components/viz — saytın qrafik nümunələri), Ramazan payı (utils/ramadanRange — Ümmül-Qura).
// • "Məbləğləri gizlət" — yalnız say (ekranda, PNG kartda və CSV-də; alıcılar da gizlənir).
// • İxrac: PNG kart (utils/statCard — yalnız həndəsə) və CSV xülasə (Excel üçün BOM).
//   Yalnız YÜKLƏMƏ — "paylaş" yoxdur (sahibin qərarı, 2026-11-18: sədəqəni gizlətmək sünnədir).
// • Valyuta saxlanmır — məbləğ qeyd olunduğu kimi cəmlənir.
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useState } from 'react'
import Icon from '../Icon'
import { ColumnChart, BarChart, ChartFigure } from '../viz'
import { makeFormat } from '../viz/format.js'
import { pickUi } from '../../utils/uiText'
import { G_MONTHS, G_MONTHS_SHORT } from '../../utils/hijri'
import { cleanEntries, reportYears, yearlyReport, reportCsv } from '../../utils/charityReport'
import { ramadanRangesInYear } from '../../utils/ramadanRange'
import { preopenWindow, saveBlob } from '../../utils/quoteCard'
import '../../styles/CharityReport.css'

const T = {
  az: {
    ey: 'Hesabat', title: 'Sədəqə hesabatı', lead: 'İllik xülasə: neçə xeyir əməli, hansı aylarda, hansı növlərdə və Ramazanın payı.',
    year: 'İl', hide: 'Məbləğləri gizlət — yalnız say göstərilsin',
    kDeeds: 'Əməllər', kAmount: 'Məbləğ', kDays: 'Xeyirli günlər', kRamadan: 'Ramazan payı', ramSub: (n) => `${n} əməl Ramazanda`, hidden: 'gizlədilib',
    months: 'Aylar üzrə', monthsCount: 'hər ayda qeyd olunan əməllər', monthsAmount: 'hər ayın məbləği', metric: 'Göstərici', mCount: 'Say', mAmount: 'Məbləğ',
    byType: 'Növlər üzrə', typesSub: 'ilin əməlləri növlərə görə', to: 'Kimə / hara', toSub: 'ən çox qeyd olunan ünvanlar', best: (m) => `Ən fəal ay: ${m}`, bestM: 'Ən fəal ay',
    png: 'PNG kart', csv: 'CSV yüklə', saved: 'Fayl hazırdır.', privateNote: 'İbadətiniz sizinlə Allah arasındadır — bu şəkil yalnız sizin üçündür.',
    empty: 'Hələ qeyd yoxdur — ilk xeyir əməlinizi əlavə edin, hesabat burada görünəcək.',
    noCur: 'Məbləğlər valyutasızdır — qeyd etdiyiniz kimi cəmlənir.', ramNote: 'Ramazan günləri Ümmül-Qura təqviminə görədir; yerli elan bir gün fərqlənə bilər.',
    cardTitle: (y) => `${y} — sədəqə hesabatım`, cardSub: 'xeyir əməllərim', more: 'Sədəqə gündəliyinə keç',
    csvL: { section: 'Bölmə', metric: 'Göstərici', count: 'Say', amount: 'Məbləğ', total: 'Cəmi', ramadan: 'Ramazanda', monthSec: 'Ay', typeSec: 'Növ', recipients: 'Alıcı' },
    types: { money: 'Pul', food: 'Yemək', smile: 'Gülüş', knowledge: 'Elm', dua: 'Dua', helping: 'Kömək', clothing: 'Geyim', other: 'Digər' },
  },
  en: {
    ey: 'Report', title: 'Charity report', lead: 'A yearly summary: how many good deeds, in which months, of which kinds, and Ramadan’s share.',
    year: 'Year', hide: 'Hide amounts — show counts only',
    kDeeds: 'Deeds', kAmount: 'Amount', kDays: 'Days with a deed', kRamadan: 'Ramadan share', ramSub: (n) => `${n} deeds in Ramadan`, hidden: 'hidden',
    months: 'By month', monthsCount: 'deeds logged in each month', monthsAmount: 'amount in each month', metric: 'Metric', mCount: 'Count', mAmount: 'Amount',
    byType: 'By type', typesSub: 'the year’s deeds by type', to: 'To whom / where', toSub: 'the most frequent recipients', best: (m) => `Most active month: ${m}`, bestM: 'Most active month',
    png: 'PNG card', csv: 'Download CSV', saved: 'Your file is ready.', privateNote: 'Your worship is between you and Allah — this image is for you.',
    empty: 'Nothing logged yet — add your first good deed and the report will appear here.',
    noCur: 'Amounts have no currency — they are added up as you logged them.', ramNote: 'Ramadan days follow the Umm al-Qura calendar; the local announcement may differ by a day.',
    cardTitle: (y) => `${y} — my charity report`, cardSub: 'my good deeds', more: 'Open the charity log',
    csvL: { section: 'Section', metric: 'Metric', count: 'Count', amount: 'Amount', total: 'Total', ramadan: 'In Ramadan', monthSec: 'Month', typeSec: 'Type', recipients: 'Recipient' },
    types: { money: 'Money', food: 'Food', smile: 'Smile', knowledge: 'Knowledge', dua: 'Dua', helping: 'Helping', clothing: 'Clothing', other: 'Other' },
  },
  ru: {
    ey: 'Отчёт', title: 'Отчёт о садаке', lead: 'Годовая сводка: сколько добрых дел, в какие месяцы, каких видов и доля Рамадана.',
    year: 'Год', hide: 'Скрыть суммы — показывать только количество',
    kDeeds: 'Дела', kAmount: 'Сумма', kDays: 'Дни с делами', kRamadan: 'Доля Рамадана', ramSub: (n) => `дел в Рамадан: ${n}`, hidden: 'скрыто',
    months: 'По месяцам', monthsCount: 'дела, записанные в каждом месяце', monthsAmount: 'сумма за каждый месяц', metric: 'Показатель', mCount: 'Количество', mAmount: 'Сумма',
    byType: 'По видам', typesSub: 'дела года по видам', to: 'Кому / куда', toSub: 'самые частые получатели', best: (m) => `Самый активный месяц: ${m}`, bestM: 'Самый активный месяц',
    png: 'Карточка PNG', csv: 'Скачать CSV', saved: 'Файл готов.', privateNote: 'Ваше поклонение — между вами и Аллахом. Это изображение только для вас.',
    empty: 'Записей пока нет — добавьте первое доброе дело, и здесь появится отчёт.',
    noCur: 'Суммы без валюты — складываются так, как вы их записали.', ramNote: 'Дни Рамадана — по календарю Умм аль-Кура; местное объявление может отличаться на день.',
    cardTitle: (y) => `${y} — мой отчёт о садаке`, cardSub: 'мои добрые дела', more: 'Открыть дневник садаки',
    csvL: { section: 'Раздел', metric: 'Показатель', count: 'Количество', amount: 'Сумма', total: 'Всего', ramadan: 'В Рамадан', monthSec: 'Месяц', typeSec: 'Вид', recipients: 'Получатель' },
    types: { money: 'Деньги', food: 'Еда', smile: 'Улыбка', knowledge: 'Знание', dua: 'Дуа', helping: 'Помощь', clothing: 'Одежда', other: 'Другое' },
  },
  ar: {
    ey: 'التقرير', title: 'تقرير الصدقة', lead: 'ملخص سنوي: كم عمل خير، وفي أي الشهور، ومن أي الأنواع، ونصيب رمضان.',
    year: 'السنة', hide: 'أخفِ المبالغ — اعرض العدد فقط',
    kDeeds: 'الأعمال', kAmount: 'المبلغ', kDays: 'أيام فيها عمل', kRamadan: 'نصيب رمضان', ramSub: (n) => `${n} أعمال في رمضان`, hidden: 'مخفي',
    months: 'حسب الشهر', monthsCount: 'الأعمال المسجلة في كل شهر', monthsAmount: 'مبلغ كل شهر', metric: 'المؤشر', mCount: 'العدد', mAmount: 'المبلغ',
    byType: 'حسب النوع', typesSub: 'أعمال السنة حسب النوع', to: 'لمن / إلى أين', toSub: 'أكثر الجهات تكرارًا', best: (m) => `أنشط شهر: ${m}`, bestM: 'أنشط شهر',
    png: 'بطاقة PNG', csv: 'نزّل CSV', saved: 'الملف جاهز.', privateNote: 'عبادتك بينك وبين الله — هذه الصورة لك وحدك.',
    empty: 'لا سجلات بعد — أضف أول عمل خير وسيظهر التقرير هنا.',
    noCur: 'المبالغ بلا عملة — تُجمع كما سجّلتها.', ramNote: 'أيام رمضان بحسب تقويم أم القرى، وقد يختلف الإعلان المحلي بيوم.',
    cardTitle: (y) => `${y} — تقرير صدقتي`, cardSub: 'أعمالي في الخير', more: 'افتح سجل الصدقة',
    csvL: { section: 'القسم', metric: 'المؤشر', count: 'العدد', amount: 'المبلغ', total: 'المجموع', ramadan: 'في رمضان', monthSec: 'الشهر', typeSec: 'النوع', recipients: 'المستفيد' },
    types: { money: 'مال', food: 'طعام', smile: 'ابتسامة', knowledge: 'علم', dua: 'دعاء', helping: 'مساعدة', clothing: 'ملابس', other: 'أخرى' },
  },
  tr: {
    ey: 'Rapor', title: 'Sadaka raporu', lead: 'Yıllık özet: kaç hayır işi, hangi aylarda, hangi türlerde ve Ramazan’ın payı.',
    year: 'Yıl', hide: 'Tutarları gizle — yalnızca sayı gösterilsin',
    kDeeds: 'Hayır işleri', kAmount: 'Tutar', kDays: 'Hayırlı günler', kRamadan: 'Ramazan payı', ramSub: (n) => `Ramazan’da ${n} hayır işi`, hidden: 'gizli',
    months: 'Aylara göre', monthsCount: 'her ay kaydedilen hayır işleri', monthsAmount: 'her ayın tutarı', metric: 'Gösterge', mCount: 'Sayı', mAmount: 'Tutar',
    byType: 'Türlere göre', typesSub: 'yılın hayır işleri türlerine göre', to: 'Kime / nereye', toSub: 'en sık kaydedilen alıcılar', best: (m) => `En hareketli ay: ${m}`, bestM: 'En hareketli ay',
    png: 'PNG kart', csv: 'CSV indir', saved: 'Dosyanız hazır.', privateNote: 'İbadetiniz sizinle Allah arasındadır — bu görsel yalnızca sizin için.',
    empty: 'Henüz kayıt yok — ilk hayır işinizi ekleyin, rapor burada görünecek.',
    noCur: 'Tutarlar para birimsizdir — kaydettiğiniz gibi toplanır.', ramNote: 'Ramazan günleri Ümmü’l-Kurâ takvimine göredir; yerel ilan bir gün farklı olabilir.',
    cardTitle: (y) => `${y} — sadaka raporum`, cardSub: 'hayır işlerim', more: 'Sadaka günlüğünü aç',
    csvL: { section: 'Bölüm', metric: 'Gösterge', count: 'Sayı', amount: 'Tutar', total: 'Toplam', ramadan: 'Ramazan’da', monthSec: 'Ay', typeSec: 'Tür', recipients: 'Alıcı' },
    types: { money: 'Para', food: 'Yemek', smile: 'Gülümseme', knowledge: 'İlim', dua: 'Dua', helping: 'Yardım', clothing: 'Giyim', other: 'Diğer' },
  },
}

function readLog() { try { return JSON.parse(localStorage.getItem('charity_log') || '[]') } catch { return [] } }

export default function CharityReport({ lang = 'az', entries = null, compact = false, moreHref, onMore }) {
  const t = pickUi(T, lang, 'en')
  const uid = useId().replace(/:/g, '')
  const fmt = useMemo(() => makeFormat(lang), [lang])
  const [own, setOwn] = useState(() => (entries || typeof window === 'undefined' ? [] : readLog()))
  useEffect(() => {
    if (entries) return undefined
    const on = (e) => { if (!e.key || e.key === 'charity_log') setOwn(readLog()) }
    window.addEventListener('storage', on)
    return () => window.removeEventListener('storage', on)
  }, [entries])
  const list = useMemo(() => cleanEntries(entries || own), [entries, own])
  const years = useMemo(() => reportYears(list), [list])
  const [yearSel, setYear] = useState(null)
  const year = years.includes(yearSel) ? yearSel : years[0]
  const [hide, setHide] = useState(false)
  const [metric, setMetric] = useState('count')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const rep = useMemo(() => (year ? yearlyReport(list, year, ramadanRangesInYear(year)) : null), [list, year])

  const money = (v) => fmt.num(v, { maximumFractionDigits: 2 })
  const count = (v) => fmt.num(v, { maximumFractionDigits: 0 })
  const showAmt = !hide && metric === 'amount'
  const monthsShort = pickUi(G_MONTHS_SHORT, lang, 'en')
  const monthsLong = pickUi(G_MONTHS, lang, 'en')
  const sharePct = rep ? Math.round(rep.ramadan.share * 100) : 0

  const exportPng = async () => {
    if (!rep || busy) return
    const win = preopenWindow()
    setBusy(true)
    try {
      const { statCardBlob } = await import('../../utils/statCard')
      const stats = [
        { v: count(rep.count), l: t.kDeeds },
        { v: count(rep.days), l: t.kDays },
        { v: `${sharePct}%`, l: t.kRamadan },
        ...(!hide && rep.amount ? [{ v: money(rep.amount), l: t.kAmount }] : []),
        ...(rep.best != null ? [{ v: monthsLong[rep.best], l: t.bestM }] : []),
      ]
      const blob = await statCardBlob({ eyebrow: t.title, title: t.cardTitle(rep.year), sub: t.cardSub, stats, rtl: lang === 'ar', tone: 'emerald', foot: hide ? '' : t.noCur })
      if (!blob) return
      saveBlob(blob, `charity-report-${rep.year}.png`, win)
      setStatus(t.saved)
    } finally { setBusy(false) }
  }
  const exportCsv = () => {
    if (!rep) return
    const csv = reportCsv(rep, { ...t.csvL, month: monthsLong, type: t.types }, { hideAmounts: hide })
    saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `charity-report-${rep.year}.csv`)
    setStatus(t.saved)
  }

  return (
    <section className={`ui-card cr${compact ? ' cr--compact' : ''}`} {...(compact ? { 'aria-label': t.title } : { 'aria-labelledby': `${uid}-t` })}
      data-testid="charity-report" data-hidden={hide ? '1' : '0'}>
      {!compact && <>
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 className="cr__title" id={`${uid}-t`}>{t.title}</h2>
        <p className="cr__lead">{t.lead}</p>
      </>}
      {!rep ? <p className="cr__muted">{t.empty}</p> : (
        <>
          <div className="cr__controls">
            <label className="cr__year" htmlFor={`${uid}-y`}>
              <span>{t.year}</span>
              <select id={`${uid}-y`} className="ui-input" value={year} onChange={(e) => setYear(Number(e.target.value))} data-testid="cr-year">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <label className="cr__hide">
              <input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} data-testid="cr-hide" />
              <span>{t.hide}</span>
            </label>
          </div>

          <dl className="cr__kpis">
            <div><dt>{t.kDeeds}</dt><dd className="ui-num" data-testid="cr-count">{count(rep.count)}</dd></div>
            <div><dt>{t.kAmount}</dt><dd className="ui-num" data-testid="cr-amount">{hide ? <span className="cr__hidden">{t.hidden}</span> : money(rep.amount)}</dd></div>
            <div><dt>{t.kDays}</dt><dd className="ui-num">{count(rep.days)}</dd></div>
            <div><dt>{t.kRamadan}</dt><dd className="ui-num" data-testid="cr-ramadan">{sharePct}%<span className="cr__sub">{t.ramSub(count(rep.ramadan.count))}</span></dd></div>
          </dl>

          <ChartFigure title={t.months} sub={showAmt ? t.monthsAmount : t.monthsCount} plain className="cr__fig"
            note={rep.best != null ? t.best(monthsLong[rep.best]) : null}>
            {!hide && (
              <div className="cr__seg" role="group" aria-label={t.metric}>
                {['count', 'amount'].map((m) => (
                  <button key={m} type="button" className={`ui-btn ui-btn--sm ${metric === m ? 'ui-btn--secondary' : 'ui-btn--ghost'}`} aria-pressed={metric === m} onClick={() => setMetric(m)}>
                    {m === 'count' ? t.mCount : t.mAmount}
                  </button>
                ))}
              </div>
            )}
            <ColumnChart label={t.months} height={compact ? 110 : 140} format={showAmt ? money : count}
              data={rep.months.map((m, i) => ({ key: i, label: monthsShort[i], value: showAmt ? m.amount : m.count, current: i === rep.best }))} />
          </ChartFigure>

          {!compact && rep.types.length > 0 && (
            <ChartFigure title={t.byType} sub={t.typesSub} plain className="cr__fig">
              <BarChart label={t.byType} format={(v, d) => (hide || !d.amount ? count(v) : `${count(v)} · ${money(d.amount)}`)}
                data={rep.types.map((x, i) => ({ key: x.key, label: t.types[x.key] || x.key, value: x.count, amount: x.amount, tone: (i % 4) + 1 }))} />
            </ChartFigure>
          )}

          {!compact && !hide && rep.to.length > 0 && (
            <div className="cr__to">
              <h3 className="cr__h3">{t.to}</h3>
              <p className="cr__muted">{t.toSub}</p>
              <ol>{rep.to.map((x) => <li key={x.name}><bdi>{x.name}</bdi> <span className="ui-num cr__muted">· {count(x.count)}</span></li>)}</ol>
            </div>
          )}

          <div className="cr__actions">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={exportPng} disabled={busy} data-testid="cr-png">
              <Icon name="image" className="ui-btn__icon" /> {t.png}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={exportCsv} data-testid="cr-csv">
              <Icon name="download" className="ui-btn__icon" /> {t.csv}
            </button>
            <span className="cr__status" role="status">{status}</span>
          </div>
          <p className="cr__note" data-testid="cr-private-note"><Icon name="lock" size={14} /> {t.privateNote}</p>
          {!compact && <p className="cr__note">{hide ? t.ramNote : `${t.noCur} ${t.ramNote}`}</p>}
        </>
      )}
      {moreHref && (
        <a className="ui-link cr__more" href={moreHref} onClick={(e) => { if (onMore && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); onMore() } }}>
          {t.more} <Icon name="arrow" size={14} className="ui-flip-rtl" />
        </a>
      )}
    </section>
  )
}
