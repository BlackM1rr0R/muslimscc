// ═══════════════════════════════════════════════════════
// ProphetLetters — Peyğəmbərin ﷺ hökmdarlara məktubları (xəritə + kart)
//
// • Xəritə: d3-geo (Equal Earth) + world-atlas quru (IslamicScience.jsx kimi),
//   Yaxın Şərq. Mədinədən hər məktubun yoluna əyri xətt; seçiləndə xətt bir dəfə
//   "çəkilir" və elçi nöqtəsi yol boyu gedir (bölmə ekrana girəndə). Hərəkət
//   azaldılıbsa — xətt dərhal tam, nöqtə sonda (statik).
// • Çiplər: məktub seçimi (data-letter). Kart: hökmdar, yer, elçi, vaxt, nə
//   baş verdi (bizim sözlərimizlə xülasə, tərcümə deyil), hədisin ərəbcə hərfi
//   parçası və mənbələr — hər istinad saytın Hədis kitabxanasına keçid verir
//   (orada tam mətn, tərcümə və dərəcə hadith-api-dən olduğu kimi).
// • Məlumat və mənbə qaydası: data/prophetLetters.js (başlıq şərhinə bax).
//   Mənbəsi olmayan hökmdar (məs. Müqövqis) göstərilmir.
// ═══════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { pathFor } from '../seo/routes'
import { BOOKS, BOOK_DATA } from '../data/hadithLibrary'
import { PL_LETTERS, PL_PLACES, PL_REFS, PL_HUDAYBIYYAH } from '../data/prophetLetters'
import { libHash, routePath } from '../utils/prophetLetters'
import '../styles/ProphetLetters.css'

const T = {
  az: {
    ey: 'Siyər', title: 'Peyğəmbərin ﷺ hökmdarlara məktubları',
    lead: 'Peyğəmbər ﷺ Kəsraya, Qeysərə, Nəcaşiyə və başqa hökmdarlara məktub yazıb onları Allaha dəvət etdi (Müslim 1774). Xəritədə məktubların Mədinədən yolu, kartda isə yalnız səhih hədislərdə gələn məlumat.',
    map: 'Mədinədən hökmdarların yanına məktubların yolu', pick: 'Məktubu seçin',
    place: 'Yer', envoy: 'Elçi', when: 'Vaxt', what: 'Nə baş verdi (qısa xülasə)', quote: 'Hədisin mətnindən', src: 'Mənbələr',
    hud: (title, year) => `${title} — ${year} (saytın tarix xronologiyası)`,
    full: 'Hər istinad Hədis kitabxanasında açılır — tam mətn və tərcümə oradadır.',
    note: 'Xülasələr bizim sözlərimizlədir, hədis tərcüməsi deyil. Burada yalnız saytın hədis mənbələrində təsdiqlənən məktublar var; siyər kitablarında adı çəkilən digər məktublar (məs. Misir hakimi Müqövqisə) yoxlanmış mənbə olmadığı üçün göstərilmir. Xəritədəki yollar təxminidir.',
    approx: 'təxmini',
  },
  en: {
    ey: 'Sirah', title: 'The Prophet’s ﷺ letters to the rulers',
    lead: 'The Prophet ﷺ wrote to Kisra, to Caesar, to the Negus and to other rulers, calling them to Allah (Muslim 1774). The map shows the letters’ routes from Medina; the card gives only what is reported in authentic hadith.',
    map: 'Routes of the letters from Medina to the rulers', pick: 'Choose a letter',
    place: 'Place', envoy: 'Envoy', when: 'Time', what: 'What happened (short summary)', quote: 'From the hadith text', src: 'Sources',
    hud: (title, year) => `${title} — ${year} (the site’s history timeline)`,
    full: 'Each reference opens in the Hadith Library — the full text and translation are there.',
    note: 'The summaries are in our own words, not a hadith translation. Only letters confirmed in the site’s hadith sources are shown; other letters named in the sirah books (e.g. to al-Muqawqis of Egypt) are left out because the site has no verified source for them. Routes on the map are approximate.',
    approx: 'approx.',
  },
  ru: {
    ey: 'Сира', title: 'Письма Пророка ﷺ правителям',
    lead: 'Пророк ﷺ написал Кисре, Кайсару, Негусу и другим правителям, призывая их к Аллаху (Муслим 1774). На карте — путь писем из Медины, в карточке — только то, что передано в достоверных хадисах.',
    map: 'Путь писем из Медины к правителям', pick: 'Выберите письмо',
    place: 'Место', envoy: 'Посланец', when: 'Время', what: 'Что произошло (краткий пересказ)', quote: 'Из текста хадиса', src: 'Источники',
    hud: (title, year) => `${title} — ${year} (хронология истории на сайте)`,
    full: 'Каждая ссылка открывается в Библиотеке хадисов — там полный текст и перевод.',
    note: 'Пересказ — нашими словами, это не перевод хадиса. Показаны только письма, подтверждённые хадисными источниками сайта; другие письма из книг сиры (например, к аль-Мукаукису, правителю Египта) не показаны, так как проверенного источника на сайте нет. Пути на карте приблизительны.',
    approx: 'прибл.',
  },
  ar: {
    ey: 'السيرة', title: 'كتب النبي ﷺ إلى الملوك',
    lead: 'كتب النبي ﷺ إلى كسرى وقيصر والنجاشي وغيرهم من الملوك يدعوهم إلى الله (مسلم ١٧٧٤). في الخريطة طريق الكتب من المدينة، وفي البطاقة ما ورد في الأحاديث الصحيحة فقط.',
    map: 'طريق الكتب من المدينة إلى الملوك', pick: 'اختر الكتاب',
    place: 'المكان', envoy: 'الرسول', when: 'الوقت', what: 'ما الذي حدث (ملخص)', quote: 'من نص الحديث', src: 'المصادر',
    hud: (title, year) => `${title} — ${year} (التسلسل التاريخي في الموقع)`,
    full: 'كل إحالة تُفتح في مكتبة الحديث، وفيها النص الكامل والترجمة.',
    note: 'الملخصات بأسلوبنا وليست ترجمة للحديث. تُعرض هنا الكتب الثابتة في مصادر الحديث بالموقع فقط؛ ولم تُعرض كتب أخرى مذكورة في كتب السيرة (كالكتاب إلى المقوقس عظيم مصر) لعدم وجود مصدر موثّق لها في الموقع. الطرق في الخريطة تقريبية.',
    approx: 'تقريبي',
  },
  tr: {
    ey: 'Siyer', title: 'Peygamber’in ﷺ hükümdarlara mektupları',
    lead: 'Peygamber ﷺ Kisrâ’ya, Kayser’e, Necâşî’ye ve diğer hükümdarlara yazıp onları Allah’a davet etti (Müslim 1774). Haritada mektupların Medine’den yolu, kartta ise yalnızca sahih hadislerde geçen bilgi.',
    map: 'Mektupların Medine’den hükümdarlara yolu', pick: 'Mektubu seçin',
    place: 'Yer', envoy: 'Elçi', when: 'Zaman', what: 'Ne oldu (kısa özet)', quote: 'Hadis metninden', src: 'Kaynaklar',
    hud: (title, year) => `${title} — ${year} (sitenin tarih kronolojisi)`,
    full: 'Her kaynak Hadis Kütüphanesi’nde açılır — tam metin ve tercüme oradadır.',
    note: 'Özetler kendi ifademizledir, hadis tercümesi değildir. Burada yalnızca sitenin hadis kaynaklarında doğrulanan mektuplar var; siyer kitaplarında adı geçen diğer mektuplar (ör. Mısır hâkimi Mukavkıs’a) doğrulanmış kaynak olmadığı için gösterilmez. Haritadaki yollar yaklaşıktır.',
    approx: 'yaklaşık',
  },
}

const W = 600, H = 600
let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)))
const projection = geoEqualEarth().fitExtent([[14, 14], [W - 14, H - 14]], { type: 'MultiPoint', coordinates: [[29, 11.5], [47.5, 11.5], [29, 35], [47.5, 35]] })
const P = (id) => { const [lat, lng] = PL_PLACES[id].at; return projection([lng, lat]) }
// Yazının tərəfi (yaxın nöqtələr üst-üstə düşməsin)
const LABEL = { iliya: 'end', busra: 'start', madain: 'end', habasha: 'middle' }
const ROUTES = Object.fromEntries(PL_LETTERS.map(l => [l.id, routePath(l.route.map(P))]))

const labelAt = (x, y, side = 'middle') => side === 'middle'
  ? { x, y: y - 16, textAnchor: 'middle' }
  : { x: x + (side === 'start' ? 16 : -16), y: y + 8, textAnchor: side }

export default function ProphetLetters() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [sel, setSel] = useState(PL_LETTERS[0].id)
  const [land, setLand] = useState(null)
  const [seen, setSeen] = useState(false)
  const root = useRef(null)
  const motion = useRef(null)
  const path = useMemo(() => geoPath(projection), [])
  const cur = PL_LETTERS.find(l => l.id === sel) || PL_LETTERS[0]

  useEffect(() => { let ok = true; loadLand().then(l => { if (ok) setLand(l) }).catch(() => {}); return () => { ok = false } }, [])
  // Animasiya bölmə ekrana girəndə başlayır (bir dəfə)
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver !== 'function') { setSeen(true); return undefined }
    const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { setSeen(true); io.disconnect() } }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // SMIL vaxtı sənədin başlanğıcından sayılır — elçi nöqtəsini hər seçimdə özümüz başladırıq
  useLayoutEffect(() => { try { motion.current?.beginElement?.() } catch { /* köhnə brauzer */ } }, [sel, seen, reduced])

  const libBase = pathFor('hadithbooks', siteLang)
  const bookName = (key) => pickUi(BOOKS.find(b => b.key === key)?.name, lang)
  const Refs = ({ ids }) => (
    <span className="pl__refs">
      {ids.map(id => {
        const r = PL_REFS[id]
        return <a key={id} className="pl__ref ui-num" href={libBase + libHash(r, BOOK_DATA)} data-testid="pl-ref" data-ref={id}>{bookName(r.book)} {r.n}</a>
      })}
    </span>
  )

  const animate = seen && !reduced
  const end = P(cur.seat)
  const medina = P('medina')
  const curPlaces = new Set(cur.route)

  return (
    <section ref={root} className="ui-card pl" data-testid="prophet-letters" aria-labelledby="pl-title">
      <div className="pl__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="pl-title" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="ui-lead">{t.lead}</p>
      </div>

      <div className="pl__chips" role="group" aria-label={t.pick}>
        {PL_LETTERS.map(l => (
          <button key={l.id} type="button" className="ui-chip pl__chip" aria-pressed={l.id === sel} data-letter={l.id}
            style={{ '--c': l.color }} onClick={() => setSel(l.id)}>
            <i aria-hidden="true" /> {pickUi(l.ruler, lang)}
          </button>
        ))}
      </div>

      <div className="pl__grid">
        <figure className="pl__map">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.map}>
            <rect width={W} height={H} className="pl__sea" rx="14" />
            {land && <path d={path(land)} className="pl__land" />}
            {PL_LETTERS.filter(l => l.id !== cur.id).map(l => (
              <path key={l.id} d={ROUTES[l.id]} className="pl__ghost" style={{ '--c': l.color }} onClick={() => setSel(l.id)} />
            ))}
            <g style={{ '--c': cur.color }}>
              <path key={`r-${cur.id}-${animate}`} d={ROUTES[cur.id]} pathLength="1" className={`pl__route${animate ? ' is-draw' : ''}${!seen && !reduced ? ' is-wait' : ''}`} data-testid="pl-route" />
              {animate ? (
                <circle key={`e-${cur.id}`} r="8" className="pl__envoy">
                  <animateMotion ref={motion} begin="indefinite" dur="1.8s" fill="freeze" path={ROUTES[cur.id]} calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".35 0 .25 1" />
                </circle>
              ) : <circle r="8" className="pl__envoy" cx={end[0]} cy={end[1]} />}
            </g>
            {Object.keys(PL_PLACES).filter(id => id !== 'medina').map(id => {
              const [x, y] = P(id), on = curPlaces.has(id)
              const owner = PL_LETTERS.find(l => l.route.includes(id))
              return (
                <g key={id} className={`pl__pt${on ? ' is-on' : ''}`} style={{ '--c': (on ? cur : owner).color }} onClick={() => owner && setSel(owner.id)}>
                  <circle cx={x} cy={y} r={on ? 9 : 6} />
                  {on && <text {...labelAt(x, y, LABEL[id])}>{pickUi(PL_PLACES[id].name, lang)}{PL_PLACES[id].approx ? ` (${t.approx})` : ''}</text>}
                </g>
              )
            })}
            <g className="pl__home">
              <circle cx={medina[0]} cy={medina[1]} r="10" />
              <text x={medina[0] + 16} y={medina[1] + 8}>{pickUi(PL_PLACES.medina.name, lang)}</text>
            </g>
          </svg>
          <figcaption className="pl__cap">{t.map}</figcaption>
        </figure>

        <article className="pl__card" style={{ '--c': cur.color }} data-testid="pl-card" data-letter={cur.id} aria-live="polite">
          <div className="pl__ctop">
            <h3>{pickUi(cur.ruler, lang)}</h3>
            {lang !== 'ar' && <span className="pl__arname ui-arabic" lang="ar" dir="rtl">{cur.rulerAr}</span>}
            <span className="pl__realm">{pickUi(cur.realm, lang)}</span>
          </div>
          <dl className="pl__dl">
            <div><dt>{t.place}</dt><dd>{pickUi(cur.place, lang)}</dd></div>
            {cur.envoy && <div><dt>{t.envoy}</dt><dd data-testid="pl-envoy">{pickUi(cur.envoy.name, lang)} <Refs ids={cur.envoy.refs} /></dd></div>}
            {cur.when && (
              <div><dt>{t.when}</dt><dd>{pickUi(cur.when.text, lang)} <Refs ids={cur.when.refs} />
                {cur.when.hudaybiyyah && <span className="pl__ctx">{t.hud(pickUi(PL_HUDAYBIYYAH.title, lang), pickUi(PL_HUDAYBIYYAH.year, lang))}</span>}
              </dd></div>
            )}
          </dl>
          <div className="pl__what">
            <h4>{t.what}</h4>
            <ul>
              {cur.facts.map((f, i) => <li key={i}>{pickUi(f.text, lang)} <Refs ids={f.refs} /></li>)}
            </ul>
          </div>
          {cur.quote && (
            <figure className="pl__quote" data-testid="pl-quote">
              <figcaption>{t.quote}</figcaption>
              <blockquote className="ui-arabic" lang="ar" dir="rtl">…{cur.quote.ar}{cur.quote.end ? '' : '…'}</blockquote>
              <Refs ids={[cur.quote.ref]} />
            </figure>
          )}
          {cur.context && (
            <p className="pl__context"><Icon name="info" size={16} /> <span>{pickUi(cur.context.text, lang)} <Refs ids={cur.context.refs} /></span></p>
          )}
          <p className="pl__src"><span>{t.src}:</span> <Refs ids={cur.refs} /></p>
          <p className="pl__full"><Icon name="hadithbooks" size={16} /> {t.full}</p>
        </article>
      </div>
      <p className="pl__note">{t.note}</p>
    </section>
  )
}
