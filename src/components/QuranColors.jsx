// ═══════════════════════════════════════════════════════
// QuranColors (v8) — "Quranda rənglər"
//
//   <QuranColors />   (dil useLang()-dən gəlir)
//
// • Quranın açıq adını çəkdiyi rənglər (data/quranColors.js): ağ, qara, qırmızı, sarı, yaşıl,
//   «zurq» (20:102 — rəng adı verilmir, yalnız söz və ayə) və «müxtəlif rəngli» (مُخْتَلِفٌ أَلْوَانُهُ).
// • Rəssam palitrası: hər rəng fırça zolağı kimi çəkilib; üstdə 35:27-nin dağ illüstrasiyası —
//   ağ, qırmızı və qara zolaqlı dağlar (seçilən rəngin zolaqları önə çıxır).
// • Rəngə toxun → kart: ərəbcə söz, ayə(lər)in ərəb mətni (rəng sözü vurğulanır, mətn dəyişmir),
//   saytın həmin dildəki rəsmi tərcüməsi + tərcüməçi (public/data/quran-colors/<dil>.json —
//   build-quran-colors.mjs hərfi-hərfinə köçürür), ayəyə keçid. Təfsir/izah yazılmır.
// • Hərəkət azaldılıbsa (useReduced) — kart və zolaqlar animasiyasızdır. Sonsuz animasiya yoxdur.
// Stillər: src/styles/QuranColors.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { pathFor } from '../seo/routes'
import { QURAN_COLORS, colorWordIdx } from '../data/quranColors'
import '../styles/QuranColors.css'

const T = {
  az: { ey: 'Quran və təbiət', title: 'Quranda rənglər', lead: 'Quran bəzi rəngləri adı ilə çəkir: dağlardakı ağ, qırmızı və qara zolaqlar, sapsarı inək, yaşıl paltarlar. Palitradan bir rəng seçin — həmin sözün keçdiyi ayələri oxuyun.',
    tap: 'Rəngə toxunun', open: 'Ayəni oxu', trl: 'Tərcümə', loading: 'Yüklənir…', ayahs: 'Ayələr', word: 'Ərəbcə söz', mountains: 'Dağlarda ağ, qırmızı və qara zolaqlar (35:27)',
    neutral: 'Bu söz üçün rəng adı verilmir — yalnız ayənin özü göstərilir.', note: 'Yalnız Quranın adını açıq çəkdiyi rənglər. Ayə mətni və tərcüməsi saytdakı Quranla eynidir; rəng sözü vurğulanıb.' },
  en: { ey: 'The Quran and nature', title: 'Colours in the Quran', lead: 'The Quran names some colours outright: white, red and black streaks in the mountains, a bright yellow cow, green garments. Pick a colour from the palette and read the verses where the word appears.',
    tap: 'Tap a colour', open: 'Read the verse', trl: 'Translation', loading: 'Loading…', ayahs: 'Verses', word: 'Arabic word', mountains: 'White, red and black streaks in the mountains (35:27)',
    neutral: 'No colour name is given for this word — only the verse itself is shown.', note: 'Only colours the Quran names directly. The verse text and translation are the same as in the site’s Quran; the colour word is highlighted.' },
  ru: { ey: 'Коран и природа', title: 'Цвета в Коране', lead: 'Коран прямо называет некоторые цвета: белые, красные и чёрные полосы в горах, ярко-жёлтая корова, зелёные одежды. Выберите цвет на палитре и прочитайте аяты, где встречается это слово.',
    tap: 'Нажмите на цвет', open: 'Читать аят', trl: 'Перевод', loading: 'Загрузка…', ayahs: 'Аяты', word: 'Арабское слово', mountains: 'Белые, красные и чёрные полосы в горах (35:27)',
    neutral: 'Для этого слова название цвета не даётся — показан только сам аят.', note: 'Только цвета, которые Коран называет прямо. Текст аята и перевод — те же, что в Коране на сайте; слово цвета выделено.' },
  ar: { ey: 'القرآن والطبيعة', title: 'الألوان في القرآن', lead: 'يذكر القرآن ألوانًا بأسمائها: جددٌ بيض وحمر وسود في الجبال، وبقرة صفراء فاقع لونها، وثياب خضر. اختر لونًا من اللوحة واقرأ الآيات التي وردت فيها الكلمة.',
    tap: 'اضغط على لون', open: 'اقرأ الآية', trl: 'الترجمة', loading: 'جارٍ التحميل…', ayahs: 'الآيات', word: 'الكلمة', mountains: 'جدد بيض وحمر وسود في الجبال (35:27)',
    neutral: 'لا يُذكر هنا اسم لون لهذه الكلمة — تُعرض الآية وحدها.', note: 'الألوان التي ذكرها القرآن باسمها فقط. ونص الآية كما في مصحف الموقع، مع تمييز كلمة اللون.' },
  tr: { ey: 'Kur’an ve tabiat', title: 'Kur’an’da renkler', lead: 'Kur’an bazı renkleri adıyla anar: dağlardaki beyaz, kırmızı ve siyah yollar, sapsarı inek, yeşil elbiseler. Paletten bir renk seçin ve kelimenin geçtiği ayetleri okuyun.',
    tap: 'Bir renge dokunun', open: 'Ayeti oku', trl: 'Meal', loading: 'Yükleniyor…', ayahs: 'Ayetler', word: 'Arapça kelime', mountains: 'Dağlarda beyaz, kırmızı ve siyah yollar (35:27)',
    neutral: 'Bu kelime için renk adı verilmez — yalnızca ayetin kendisi gösterilir.', note: 'Yalnızca Kur’an’ın adını açıkça andığı renkler. Ayet metni ve meali sitedeki Kur’an ile aynıdır; renk kelimesi vurgulanmıştır.' },
}

const RAINBOW = ['#c0392b', '#e67e22', '#e9b824', '#2f8a4c', '#2a6fb0', '#7b3f8c']

/** Fırça zolağı (palitra nümunəsi) — kənarları cırıq boya ləkəsi */
const STROKE = 'M6 22 C10 10 28 8 46 11 C66 14 86 7 104 10 C114 12 118 20 114 28 C110 37 92 33 74 36 C54 39 34 34 18 38 C8 40 3 31 6 22Z'
function Swatch({ c, uid }) {
  const fill = c.id === 'various' ? `url(#${uid}-rb)` : c.neutral ? `url(#${uid}-hz)` : c.hex
  return (
    <svg className="qcl__stroke" viewBox="0 0 120 46" aria-hidden="true" focusable="false">
      <defs>
        {c.id === 'various' && (
          <linearGradient id={`${uid}-rb`} x1="0" x2="1" y1="0" y2="0">
            {RAINBOW.map((h, i) => <stop key={h} offset={i / (RAINBOW.length - 1)} stopColor={h} />)}
          </linearGradient>
        )}
        {c.neutral && (
          <pattern id={`${uid}-hz`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="8" height="8" fill="#c9ced6" /><rect width="3.2" height="8" fill={c.hex} />
          </pattern>
        )}
      </defs>
      <path d={STROKE} fill={fill} className="qcl__paint" />
      <path d="M14 18 C34 14 60 18 92 14" stroke="#fff" strokeOpacity=".28" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M20 30 C44 27 70 31 100 26" stroke="#000" strokeOpacity=".12" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** 35:27 — qatlı dağlar: ağ, qırmızı, qara zolaqlar. Seçilən rəngin zolaqları önə çıxır (dekorativ) */
function Mountains({ sel, label }) {
  const on = (id) => (['white', 'red', 'black'].includes(sel) ? (sel === id ? ' is-on' : ' is-dim') : '')
  return (
    <svg className="qcl__mtn" viewBox="0 0 360 150" role="img" aria-label={label}>
      <defs>
        <clipPath id="qcl-m1"><path d="M-10 150 L70 46 L118 92 L176 26 L250 110 L300 64 L370 150Z" /></clipPath>
        <clipPath id="qcl-m2"><path d="M-10 150 L40 92 L96 120 L150 70 L214 130 L278 84 L370 150Z" /></clipPath>
      </defs>
      <path d="M-10 150 L70 46 L118 92 L176 26 L250 110 L300 64 L370 150Z" className="qcl__rock qcl__rock--far" />
      <g clipPath="url(#qcl-m1)">
        <path className={`qcl__vein${on('white')}`} d="M40 90 C90 70 130 86 180 58 C220 40 260 70 330 60 L330 70 C262 82 222 52 182 70 C132 98 92 82 40 102Z" fill="#f4f1ea" />
        <path className={`qcl__vein${on('red')}`} d="M30 112 C80 96 128 112 176 92 C228 72 270 98 340 88 L340 100 C272 110 230 86 178 106 C128 124 80 108 30 124Z" fill="#b8322c" />
        <path className={`qcl__vein${on('white')}`} d="M120 60 C150 50 172 48 200 40 L204 46 C176 56 152 58 122 68Z" fill="#f4f1ea" />
      </g>
      <path d="M-10 150 L40 92 L96 120 L150 70 L214 130 L278 84 L370 150Z" className="qcl__rock qcl__rock--near" />
      <g clipPath="url(#qcl-m2)">
        <path className={`qcl__vein${on('black')}`} d="M20 118 C70 106 110 128 160 104 C210 84 250 118 350 106 L350 120 C252 130 212 98 162 118 C112 140 70 120 20 132Z" fill="#22201f" />
        <path className={`qcl__vein${on('red')}`} d="M150 84 C170 80 186 86 206 78 L210 86 C188 94 172 90 152 94Z" fill="#b8322c" />
        <path className={`qcl__vein${on('white')}`} d="M250 104 C270 96 290 100 316 92 L320 100 C292 108 272 106 252 112Z" fill="#f4f1ea" />
      </g>
    </svg>
  )
}

const cache = new Map()

export default function QuranColors() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [sel, setSel] = useState(QURAN_COLORS[0].id)
  const [ri, setRi] = useState(0)
  const [texts, setTexts] = useState(null)
  const c = useMemo(() => QURAN_COLORS.find(x => x.id === sel), [sel])

  useEffect(() => {
    let alive = true
    const load = (f) => cache.get(f) || fetch(`/data/quran-colors/${f}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
    const pr = load(lang).catch(() => load('en'))
    cache.set(lang, pr)
    pr.then(d => { if (alive) setTexts(d) }).catch(() => {})
    return () => { alive = false }
  }, [lang])

  const pick = (id) => { setSel(id); setRi(0) }
  const ref = c.refs[Math.min(ri, c.refs.length - 1)]
  const [s, n] = ref.split(':').map(Number)
  const arText = texts?.ar?.[ref]
  const hi = arText ? new Set(colorWordIdx(c, arText)) : null
  const name = pickUi(c.name, lang, 'en')

  return (
    <section className={`ui-card qcl${reduced ? '' : ' is-live'}`} data-testid="quran-colors" aria-labelledby="qcl-title">
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id="qcl-title" className="qcl__title">{t.title}</h2>
      <p className="qcl__lead">{t.lead}</p>

      <div className="qcl__grid">
        <div className="qcl__easel">
          <Mountains sel={sel} label={t.mountains} />
          <p className="qcl__hint">{t.tap}</p>
          <ul className="qcl__palette">
            {QURAN_COLORS.map(x => (
              <li key={x.id}>
                <button type="button" className={`qcl__sw${x.id === sel ? ' is-on' : ''}`} onClick={() => pick(x.id)} aria-pressed={x.id === sel} data-color={x.id}>
                  <Swatch c={x} uid={`qcl-${x.id}`} />
                  <span className="qcl__nm">{pickUi(x.name, lang, 'en')}</span>
                  <span className="qcl__w ui-arabic" lang="ar" dir="rtl">{x.ar.split(' · ')[0]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <article className="qcl__card" aria-live="polite" data-testid="qc-color-card" data-id={c.id} key={c.id}>
          <div className="qcl__top">
            <span className={`qcl__gem qcl__gem--${c.id}`} style={c.hex && !c.neutral ? { '--g': c.hex } : undefined} aria-hidden="true" />
            <div className="qcl__hd">
              <h3 className="qcl__name">{name}</h3>
              <p className="qcl__lbl">{t.word}</p>
              <p className="qcl__ar ui-arabic" lang="ar" dir="rtl">{c.ar}</p>
            </div>
          </div>
          {c.neutral && <p className="qcl__neutral"><Icon name="info" size={14} /> {t.neutral}</p>}
          {c.refs.length > 1 && (
            <div className="qcl__refs" role="group" aria-label={t.ayahs}>
              {c.refs.map((r, i) => (
                <button key={r} type="button" className={`qcl__chip ui-num${r === ref ? ' is-on' : ''}`} aria-pressed={r === ref} onClick={() => setRi(i)} dir="ltr" data-testid="qcl-ref">{r}</button>
              ))}
            </div>
          )}
          <blockquote className="qcl__ayah ui-arabic" lang="ar" dir="rtl" data-testid="qcl-ayah">
            {arText
              ? arText.split(' ').map((w, i) => (
                <span key={i}>{i ? ' ' : ''}{hi.has(i) ? <mark className="qcl__mk" style={c.hex && !c.neutral ? { '--g': c.hex } : undefined}>{w}</mark> : w}</span>
              ))
              : t.loading}
            {' '}<span className="ui-num">﴿{n}﴾</span>
          </blockquote>
          {lang !== 'ar' && texts?.tr?.[ref] && <p className="qcl__tr">{texts.tr[ref]} <small>— {t.trl}: {texts.by}</small></p>}
          <div className="qcl__foot">
            <span className="ui-num qcl__ref" dir="ltr">{ref}</span>
            <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`${pathFor('quran', lang, s)}?a=${n}`} data-testid="qcl-open">{t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" /></a>
          </div>
        </article>
      </div>
      <p className="qcl__note"><Icon name="info" size={14} /> {t.note}</p>
    </section>
  )
}
