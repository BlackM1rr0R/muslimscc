// ═══════════════════════════════════════════════════════
// MuslimAtlas (v8) — "Müsəlman dünyası atlası": ölkələr üzrə müsəlman əhalisinin xoroplet xəritəsi
//
//   <MuslimAtlas />   (dil useLang()-dən)
//
// • Rəqəmlər YALNIZ Pew Research Center-dən (data/muslimPopulation.js): 2010 və 2020 təxminləri,
//   201 ölkə/ərazi; dünya cəmi də Pew-dandır. Mənbə həm kartda, həm altda göstərilir.
// • Üç görünüş: pay (%) — ardıcıl rəng şkalası; say — sahəsi müsəlmanların sayına mütənasib
//   dairələr; dəyişmə — 2010→2020 payın faiz bəndi ilə dəyişməsi (iki tərəfli şkala).
//   İl düymələri 2010/2020. Ölkəyə toxunanda (siçanla üzərinə gələndə) kart: ad (Intl.DisplayNames),
//   əhali, müsəlmanlar, pay, dəyişmə, mənbə. Yanda ilk 10 ölkə; kiçik ada ölkələri xəritədə
//   görünmədiyi üçün hamısı seçim siyahısındadır.
// • Xəritə: d3-geo (Equal Earth) + world-atlas countries-110m (tənbəl yüklənir) + topojson-client.
//   Animasiya yoxdur — yalnız seçimdə yenidən çəkilir.
// Stillər: src/styles/MuslimAtlas.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { geoArea, geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import countriesUrl from 'world-atlas/countries-110m.json?url'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { MP_COUNTRIES, MP_SOURCE, MP_YEARS } from '../data/muslimPopulation'
import {
  shareClass, changeClass, radiusFor, changeOf, topN, worldTotals, maxMuslims,
  shapeIso3, countryByIso3, countryName, fmtInt, fmtCompact, fmtPct, fmtSigned,
} from '../utils/muslimAtlas'
import '../styles/MuslimAtlas.css'

const T = {
  az: { ey: 'Müsəlman dünyası', title: 'Müsəlman dünyası atlası', lead: 'Dünya əhalisinin təxminən dörddə biri müsəlmandır. Xəritədə hər ölkədə müsəlmanların payına, sayına və 2010–2020 illərindəki dəyişməyə baxın. Ölkəyə toxunun — kartı açılacaq.',
    view: 'Görünüş', modes: { share: 'Pay (%)', people: 'Say', change: 'Dəyişmə' }, year: 'İl',
    world: 'Dünyada müsəlmanlar', ofWorld: 'Dünya əhalisində payı', since: '2010-dan bəri artım',
    top: { pct: 'Payı ən yüksək 10 ölkə', muslims: 'Ən çox müsəlman yaşayan 10 ölkə', growth: 'Müsəlman sayı ən çox artan 10 ölkə' },
    pop: 'Əhali', muslims: 'Müsəlmanlar', share: 'Payı', change: 'Dəyişmə 2010→2020', pp: 'faiz bəndi', people: 'nəfər',
    pick: 'Ölkə seçin…', hint: 'Xəritədə ölkəyə toxunun və ya siyahıdan seçin.', close: 'Bağla',
    legShare: 'Müsəlmanların əhalidə payı, %', legPeople: 'Dairənin sahəsi — müsəlmanların sayı', legChange: 'Payın dəyişməsi 2010→2020, faiz bəndi', noData: 'Məlumat yoxdur',
    src: 'Mənbə', note: 'Rəqəmlər təxminidir: siyahıyaalma və sorğulara əsaslanır, ölkə əhalisi BMT-nin 2024 proqnozlarındandır. Kiprin rəqəmi bütün adanı, Somalininki Somalilendi də əhatə edir. Kiçik ada ölkələri xəritədə görünmür — onları siyahıdan seçin.', // lang-ok[Somalilendi]: ölkə adı (Somaliland)
    mapLabel: 'Ölkələr üzrə müsəlman əhalisinin xəritəsi', loading: 'Xəritə yüklənir…' },
  en: { ey: 'The Muslim world', title: 'Atlas of the Muslim world', lead: 'About a quarter of the world’s people are Muslims. See the Muslim share, number and its 2010–2020 change in every country. Tap a country to open its card.',
    view: 'View', modes: { share: 'Share (%)', people: 'Number', change: 'Change' }, year: 'Year',
    world: 'Muslims worldwide', ofWorld: 'Share of world population', since: 'Growth since 2010',
    top: { pct: 'Top 10 by share', muslims: 'Top 10 by number of Muslims', growth: 'Top 10 by growth in Muslims' },
    pop: 'Population', muslims: 'Muslims', share: 'Share', change: 'Change 2010→2020', pp: 'percentage points', people: 'people',
    pick: 'Choose a country…', hint: 'Tap a country on the map or choose one from the list.', close: 'Close',
    legShare: 'Muslim share of population, %', legPeople: 'Circle area — number of Muslims', legChange: 'Change in share 2010→2020, percentage points', noData: 'No data',
    src: 'Source', note: 'Figures are estimates based on censuses and surveys; country populations come from the UN’s 2024 projections. Cyprus covers the whole island and Somalia includes Somaliland. Small island countries are not visible on the map — choose them from the list.',
    mapLabel: 'Map of Muslim population by country', loading: 'Loading map…' },
  ru: { ey: 'Мусульманский мир', title: 'Атлас мусульманского мира', lead: 'Примерно четверть населения Земли — мусульмане. Смотрите долю мусульман, их число и изменение за 2010–2020 годы в каждой стране. Нажмите на страну, чтобы открыть карточку.',
    view: 'Вид', modes: { share: 'Доля (%)', people: 'Число', change: 'Изменение' }, year: 'Год',
    world: 'Мусульман в мире', ofWorld: 'Доля в населении мира', since: 'Рост с 2010 года',
    top: { pct: '10 стран с наибольшей долей', muslims: '10 стран с наибольшим числом мусульман', growth: '10 стран с наибольшим ростом' },
    pop: 'Население', muslims: 'Мусульмане', share: 'Доля', change: 'Изменение 2010→2020', pp: 'п. п.', people: 'чел.',
    pick: 'Выберите страну…', hint: 'Нажмите на страну на карте или выберите её из списка.', close: 'Закрыть',
    legShare: 'Доля мусульман в населении, %', legPeople: 'Площадь круга — число мусульман', legChange: 'Изменение доли 2010→2020, п. п.', noData: 'Нет данных',
    src: 'Источник', note: 'Цифры оценочные: основаны на переписях и опросах, население стран — по прогнозам ООН 2024 года. Кипр учтён целиком, Сомали — вместе с Сомалилендом. Малые островные страны на карте не видны — выберите их из списка.',
    mapLabel: 'Карта мусульманского населения по странам', loading: 'Загрузка карты…' },
  ar: { ey: 'العالم الإسلامي', title: 'أطلس العالم الإسلامي', lead: 'نحو ربع سكان العالم مسلمون. تعرّف على نسبة المسلمين وعددهم وتغيّرهما بين 2010 و2020 في كل بلد. المس بلدًا لتفتح بطاقته.',
    view: 'العرض', modes: { share: 'النسبة (%)', people: 'العدد', change: 'التغيّر' }, year: 'السنة',
    world: 'المسلمون في العالم', ofWorld: 'نسبتهم من سكان العالم', since: 'الزيادة منذ 2010',
    top: { pct: 'أعلى 10 بلدان نسبةً', muslims: 'أكثر 10 بلدان عددًا للمسلمين', growth: 'أكثر 10 بلدان زيادةً في عدد المسلمين' },
    pop: 'السكان', muslims: 'المسلمون', share: 'النسبة', change: 'التغيّر 2010←2020', pp: 'نقطة مئوية', people: 'نسمة',
    pick: 'اختر بلدًا…', hint: 'المس بلدًا على الخريطة أو اختره من القائمة.', close: 'إغلاق',
    legShare: 'نسبة المسلمين من السكان، %', legPeople: 'مساحة الدائرة — عدد المسلمين', legChange: 'تغيّر النسبة 2010←2020، نقاط مئوية', noData: 'لا بيانات',
    src: 'المصدر', note: 'الأرقام تقديرية مبنية على التعدادات والمسوح، وسكان البلدان من توقعات الأمم المتحدة لعام 2024. رقم قبرص يشمل الجزيرة كلها، والصومال يشمل أرض الصومال. الدول الجزرية الصغيرة لا تظهر على الخريطة — اخترها من القائمة.',
    mapLabel: 'خريطة السكان المسلمين حسب البلد', loading: 'جارٍ تحميل الخريطة…' },
  tr: { ey: 'Müslüman dünyası', title: 'Müslüman dünyası atlası', lead: 'Dünya nüfusunun yaklaşık dörtte biri Müslümandır. Haritada her ülkede Müslümanların payını, sayısını ve 2010–2020 arasındaki değişimi görün. Bir ülkeye dokunun — kartı açılır.',
    view: 'Görünüm', modes: { share: 'Pay (%)', people: 'Sayı', change: 'Değişim' }, year: 'Yıl',
    world: 'Dünyada Müslümanlar', ofWorld: 'Dünya nüfusundaki payı', since: '2010’dan beri artış',
    top: { pct: 'Payı en yüksek 10 ülke', muslims: 'En çok Müslüman yaşayan 10 ülke', growth: 'Müslüman sayısı en çok artan 10 ülke' },
    pop: 'Nüfus', muslims: 'Müslümanlar', share: 'Payı', change: 'Değişim 2010→2020', pp: 'yüzde puan', people: 'kişi',
    pick: 'Ülke seçin…', hint: 'Haritada bir ülkeye dokunun veya listeden seçin.', close: 'Kapat',
    legShare: 'Müslümanların nüfustaki payı, %', legPeople: 'Daire alanı — Müslüman sayısı', legChange: 'Paydaki değişim 2010→2020, yüzde puan', noData: 'Veri yok',
    src: 'Kaynak', note: 'Rakamlar tahminidir: nüfus sayımları ve anketlere dayanır, ülke nüfusu BM’nin 2024 projeksiyonlarındandır. Kıbrıs adanın tamamını, Somali Somaliland’i de kapsar. Küçük ada ülkeleri haritada görünmez — listeden seçin.',
    mapLabel: 'Ülkelere göre Müslüman nüfus haritası', loading: 'Harita yükleniyor…' },
}

const W = 960, H = 470
const SHARE_LEG = ['<1', '1–5', '5–10', '10–25', '25–50', '50–75', '75–90', '≥90']
const CHANGE_LEG = ['≤−5', '−5…−1', '−1…−0.1', '±0.1', '0.1…1', '1…5', '≥5']
const CIRCLE_LEG = [10e6, 50e6, 200e6]

let worldCache = null
const loadWorld = () => (worldCache ||= fetch(countriesUrl).then((r) => r.json()).then((t) => feature(t, t.objects.countries).features))

/** Dairə üçün nöqtə: çoxhissəli ölkədə ən böyük hissənin mərkəzi (Fransa → Avropa, ABŞ → materik) */
function anchor(path, f) {
  const g = f.geometry
  if (g?.type !== 'MultiPolygon') return path.centroid(f)
  let best = null, area = -1
  for (const coordinates of g.coordinates) {
    const part = { type: 'Polygon', coordinates }
    const a = geoArea(part)
    if (a > area) { area = a; best = part }
  }
  return path.centroid(best)
}

export default function MuslimAtlas() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const [mode, setMode] = useState('share')
  const [year, setYear] = useState(2020)
  const [sel, setSel] = useState(null)
  const [hover, setHover] = useState(null)
  const [shapes, setShapes] = useState(null)

  useEffect(() => {
    let ok = true
    loadWorld().then((fs) => { if (ok) setShapes(fs) }).catch(() => {})
    return () => { ok = false }
  }, [])

  // Fiqurlar bir dəfə hesablanır: d, ISO3, dairə nöqtəsi
  const geo = useMemo(() => {
    if (!shapes) return null
    const projection = geoEqualEarth().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' })
    const path = geoPath(projection)
    const list = shapes.filter((f) => f.id !== '010').map((f) => {
      const iso = shapeIso3(f.id, f.properties?.name)
      return { key: `${f.id ?? ''}-${f.properties?.name}`, iso, d: path(f), at: anchor(path, f) }
    })
    return { list, sphere: path({ type: 'Sphere' }) }
  }, [shapes])

  const yr = mode === 'change' ? 2020 : year
  const totals = worldTotals(yr)
  const totals10 = worldTotals(2010)
  const max = useMemo(() => maxMuslims(2020), [])
  const metric = mode === 'share' ? 'pct' : mode === 'people' ? 'muslims' : 'growth'
  const top = useMemo(() => topN(metric, yr, 10), [metric, yr])
  const options = useMemo(() => MP_COUNTRIES.map((c) => ({ iso: c.iso3, name: countryName(c, lang) }))
    .sort((a, b) => a.name.localeCompare(b.name, lang)), [lang])

  const fillClass = (iso) => {
    const c = iso && countryByIso3(iso)
    if (!c) return 'ma-none'
    if (mode === 'share') return `ma-s${shareClass(c[year].pct)}`
    if (mode === 'change') return `ma-d${changeClass(changeOf(c).pp)}`
    return 'ma-base'
  }
  const circles = useMemo(() => {
    if (!geo || mode !== 'people') return []
    const seen = new Set()
    return geo.list.filter((s) => s.iso && !seen.has(s.iso) && seen.add(s.iso) && Number.isFinite(s.at[0]))
      .map((s) => ({ ...s, r: radiusFor(countryByIso3(s.iso)[year].muslims, max) }))
      .filter((s) => s.r > 0.6)
      .sort((a, b) => b.r - a.r)
  }, [geo, mode, year, max])

  const cardIso = hover || sel
  const card = cardIso ? countryByIso3(cardIso) : null
  const selShapes = geo && sel ? geo.list.filter((s) => s.iso === sel) : []
  const pctText = (c, y) => (c[y].pct === 0 && c[y].muslims > 0 ? '<0.1%' : fmtPct(c[y].pct, lang))
  const topVal = (c) => metric === 'pct' ? pctText(c, yr)
    : metric === 'muslims' ? fmtCompact(c[yr].muslims, lang)
      : `${changeOf(c).abs > 0 ? '+' : ''}${fmtCompact(changeOf(c).abs, lang)}`
  const pickShape = (iso) => { if (iso) setSel((s) => (s === iso ? null : iso)) }
  const onEnter = (e, iso) => { if (e.pointerType === 'mouse') setHover(iso) }
  const srcLine = `${MP_SOURCE.publisher}, “${MP_SOURCE.title}” (${MP_SOURCE.published.slice(0, 4)})`

  return (
    <section className="ui-card ma" data-testid="muslim-atlas" data-year={yr} data-mode={mode} aria-labelledby="ma-title">
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id="ma-title" className="ma__title">{t.title}</h2>
      <p className="ma__lead">{t.lead}</p>

      <dl className="ma__stats">
        <div><dt>{t.world} ({yr})</dt><dd>{fmtCompact(totals.muslims, lang, 2)}</dd></div>
        <div><dt>{t.ofWorld}</dt><dd>{fmtPct(totals.pct, lang)}</dd></div>
        <div><dt>{t.since}</dt><dd>+{fmtCompact(worldTotals(2020).muslims - totals10.muslims, lang)}</dd></div>
      </dl>

      <div className="ma__controls">
        <div className="ma__chips" role="group" aria-label={t.view}>
          {['share', 'people', 'change'].map((m) => (
            <button key={m} type="button" className="ui-chip" aria-pressed={mode === m} onClick={() => setMode(m)} data-mode-btn={m}>{t.modes[m]}</button>
          ))}
        </div>
        <div className="ma__chips" role="group" aria-label={t.year}>
          {MP_YEARS.map((y) => (
            <button key={y} type="button" className="ui-chip" aria-pressed={yr === y} disabled={mode === 'change'}
              onClick={() => setYear(y)} data-year-btn={y}>{y}</button>
          ))}
        </div>
        <label className="ma__pick">
          <Icon name="search" size={16} />
          <select value={sel || ''} onChange={(e) => setSel(e.target.value || null)} aria-label={t.pick}>
            <option value="">{t.pick}</option>
            {options.map((o) => <option key={o.iso} value={o.iso}>{o.name}</option>)}
          </select>
        </label>
      </div>

      <div className="ma__grid">
        <figure className="ma__stage">
          {geo ? (
            <svg className="ma__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.mapLabel} onPointerLeave={() => setHover(null)}>
              <path className="ma__sphere" d={geo.sphere} />
              <g className="ma__countries">
                {geo.list.map((s) => (
                  <path key={s.key} d={s.d} data-iso={s.iso || undefined} className={`ma__c ${fillClass(s.iso)}`}
                    onPointerEnter={(e) => onEnter(e, s.iso)} onClick={() => pickShape(s.iso)} />
                ))}
              </g>
              {selShapes.map((s) => <path key={`sel-${s.key}`} d={s.d} className="ma__sel" />)}
              {circles.length > 0 && (
                <g className="ma__bubbles">
                  {circles.map((s) => (
                    <circle key={`b-${s.iso}`} cx={s.at[0]} cy={s.at[1]} r={s.r} data-bubble={s.iso}
                      className={s.iso === sel ? 'is-sel' : undefined}
                      onPointerEnter={(e) => onEnter(e, s.iso)} onClick={() => pickShape(s.iso)} />
                  ))}
                </g>
              )}
            </svg>
          ) : (
            <div className="ma__loading" aria-busy="true">{t.loading}</div>
          )}
          <figcaption className="ma__legend">
            {mode === 'share' && (<>
              <span className="ma__legtitle">{t.legShare}</span>
              <span className="ma__swatches">
                {SHARE_LEG.map((l, i) => <span key={l} className="ma__sw"><i className={`ma-s${i}`} />{l}</span>)}
                <span className="ma__sw"><i className="ma-none" />{t.noData}</span>
              </span>
            </>)}
            {mode === 'change' && (<>
              <span className="ma__legtitle">{t.legChange}</span>
              <span className="ma__swatches">
                {CHANGE_LEG.map((l, i) => <span key={l} className="ma__sw"><i className={`ma-d${i}`} />{l}</span>)}
              </span>
            </>)}
            {mode === 'people' && (<>
              <span className="ma__legtitle">{t.legPeople}</span>
              <svg className="ma__circleg" viewBox="0 0 290 40" aria-hidden="true">
                {CIRCLE_LEG.map((n, i) => {
                  const r = radiusFor(n, max) * 0.75, cx = 16 + i * 84
                  return (
                    <g key={n}>
                      <circle cx={cx} cy={36 - r} r={r} />
                      <text x={cx + r + 4} y={34}>{fmtCompact(n, lang)}</text>
                    </g>
                  )
                })}
              </svg>
            </>)}
          </figcaption>
        </figure>

        <aside className="ma__side">
          <div className="ma__card" data-testid="ma-card" data-iso={card?.iso3 || ''} aria-live="polite">
            {card ? (<>
              <div className="ma__cardhead">
                <h3>{countryName(card, lang)}</h3>
                {sel && !hover && (
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setSel(null)} aria-label={t.close}><Icon name="close" size={16} /></button>
                )}
              </div>
              <dl className="ma__facts">
                <div><dt>{t.muslims} ({yr})</dt><dd>{fmtInt(card[yr].muslims, lang)}</dd></div>
                <div><dt>{t.share}</dt><dd>{pctText(card, yr)}</dd></div>
                <div><dt>{t.pop} ({yr})</dt><dd>{fmtInt(card[yr].pop, lang)}</dd></div>
                <div>
                  <dt>{t.change}</dt>
                  <dd>
                    {fmtSigned(changeOf(card).abs, lang)} {t.people}
                    <small>{changeOf(card).rel != null && `${fmtPct(changeOf(card).rel, lang, true)} · `}{fmtPct(changeOf(card).pp, lang, true).replace('%', '')} {t.pp}</small>
                  </dd>
                </div>
              </dl>
              <p className="ma__cardsrc">{t.src}: <a href={MP_SOURCE.tableUrl} target="_blank" rel="noopener noreferrer">{MP_SOURCE.publisher}, {MP_SOURCE.tableTitle}</a></p>
            </>) : <p className="ma__hint"><Icon name="cursor" size={16} /> {t.hint}</p>}
          </div>

          <div className="ma__top">
            <h3>{t.top[metric]}</h3>
            <ol>
              {top.map((c) => (
                <li key={c.iso3}>
                  <button type="button" className={sel === c.iso3 ? 'is-sel' : undefined} aria-pressed={sel === c.iso3}
                    onClick={() => setSel(sel === c.iso3 ? null : c.iso3)}>
                    <span className="ma__tname">{countryName(c, lang)}</span>
                    <span className="ma__tval">{topVal(c)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <p className="ma__src">
        {t.src}: <a href={MP_SOURCE.url} target="_blank" rel="noopener noreferrer">{srcLine}</a>
        {' · '}<a href={MP_SOURCE.tableUrl} target="_blank" rel="noopener noreferrer">{MP_SOURCE.tableTitle}</a>
      </p>
      <p className="ma__note">{t.note}</p>
    </section>
  )
}
