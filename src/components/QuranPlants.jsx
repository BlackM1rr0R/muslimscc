// ═══════════════════════════════════════════════════════
// QuranPlants (v7.1) — "Quran bitkiləri bağı" (/kids, QuranAnimals-ın yanında)
//
//   <QuranPlants lang="az" ayahHref={(s, a) => '/quran/…?a=…'} />
//
// • 13 bitki (data/quranPlants.js) — yalnız Quranın adını açıq çəkdiyi, mənası mübahisəsiz olanlar.
//   Bağda bitkiyə toxun → ərəbcə adı, ayənin özü və saytın həmin dildəki rəsmi tərcüməsi
//   (public/data/quran-plants/<dil>.json — hərfi-hərfinə, build-quran-plants.mjs).
// • "Hansı bitkidir?" oyunu: ərəbcə ad göstərilir, 4 şəkildən düzgününü tap.
// • Şəkillər əllə çəkilmiş SVG-dir (xarici şəkil yoxdur). Təfsir/izah yazılmır.
// • Hərəkət azaldılıbsa (useReduced) — bitkilər yellənmir.
// Stillər: src/styles/QuranPlants.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced'
import { QURAN_PLANTS } from '../data/quranPlants'
import '../styles/QuranPlants.css'

const T = {
  az: { garden: 'Bağ', game: 'Hansı bitkidir?', tap: 'Bitkiyə toxun', open: 'Ayəni oxu', trl: 'Tərcümə', loading: 'Yüklənir…', ayahs: 'Ayələr',
    ask: 'Bu ərəbcə söz hansı bitkinin adıdır?', right: 'Afərin, düzdür!', wrong: 'Bir də yoxla', next: 'Növbəti', score: 'Xal',
    note: 'Yalnız Quranın adını açıq çəkdiyi bitkilər. Ayə mətni və tərcüməsi saytdakı Quranla eynidir.' },
  en: { garden: 'Garden', game: 'Which plant?', tap: 'Tap a plant', open: 'Read the verse', trl: 'Translation', loading: 'Loading…', ayahs: 'Verses',
    ask: 'Which plant is this Arabic word?', right: 'Well done, that’s right!', wrong: 'Try again', next: 'Next', score: 'Score',
    note: 'Only plants the Quran names directly. The verse text and translation are the same as in the site’s Quran.' },
  ru: { garden: 'Сад', game: 'Какое это растение?', tap: 'Нажми на растение', open: 'Читать аят', trl: 'Перевод', loading: 'Загрузка…', ayahs: 'Аяты',
    ask: 'Какое растение называется этим арабским словом?', right: 'Молодец, верно!', wrong: 'Попробуй ещё раз', next: 'Дальше', score: 'Очки',
    note: 'Только растения, которые Коран называет прямо. Текст аята и перевод — те же, что в Коране на сайте.' },
  ar: { garden: 'البستان', game: 'أيّ نبات هذا؟', tap: 'اضغط على نبتة', open: 'اقرأ الآية', trl: 'الترجمة', loading: 'جارٍ التحميل…', ayahs: 'الآيات',
    ask: 'أيّ نبات تدل عليه هذه الكلمة؟', right: 'أحسنت، صحيح!', wrong: 'حاول مرة أخرى', next: 'التالي', score: 'النقاط',
    note: 'النباتات التي ذكرها القرآن باسمها فقط. ونص الآية وترجمتها كما في مصحف الموقع.' },
  tr: { garden: 'Bahçe', game: 'Hangi bitki?', tap: 'Bir bitkiye dokun', open: 'Ayeti oku', trl: 'Meal', loading: 'Yükleniyor…', ayahs: 'Ayetler',
    ask: 'Bu Arapça kelime hangi bitkinin adı?', right: 'Aferin, doğru!', wrong: 'Bir daha dene', next: 'Sonraki', score: 'Puan',
    note: 'Yalnızca Kur’an’ın adını açıkça andığı bitkiler. Ayet metni ve meali sitedeki Kur’an ile aynıdır.' },
}

// ── Əllə çəkilmiş bitkilər (viewBox 0 0 64 64, torpaq xətti y≈60). .qpl__sw — yellənən hissə ──
const LEAF = '#4caf50', LEAF2 = '#2e7d32', BARK = '#8d5a3b'
const leaf = (x, y, r, c = LEAF) => <ellipse cx={x} cy={y} rx={r} ry={r * 0.55} fill={c} />
const ART = {
  palm: (
    <>
      <path d="M31 60 C30 46 33 34 32 22 L35 22 C36 34 34 46 35 60 Z" fill={BARK} />
      <path d="M31.5 52h3M31.5 45h3M32 38h3M32 31h3" stroke="#6b4329" strokeWidth="1.4" strokeLinecap="round" />
      <g className="qpl__sw">
        <path d="M33 22 C24 14 14 16 8 24 C16 20 24 20 33 23Z" fill={LEAF} />
        <path d="M34 22 C43 14 53 16 58 24 C50 20 42 20 34 23Z" fill={LEAF} />
        <path d="M33 21 C28 10 20 6 12 8 C20 11 26 15 33 22Z" fill={LEAF2} />
        <path d="M34 21 C39 10 47 6 55 8 C47 11 41 15 34 22Z" fill={LEAF2} />
        <path d="M33.5 21 C32 12 34 6 36 3 C36 10 35.5 15 34.5 21Z" fill={LEAF} />
        <circle cx="30" cy="26" r="2.2" fill="#e08a1e" /><circle cx="33" cy="27.5" r="2.2" fill="#c96f10" />
        <circle cx="36.5" cy="26" r="2.2" fill="#e08a1e" /><circle cx="34" cy="30.5" r="2" fill="#e08a1e" />
      </g>
    </>
  ),
  olive: (
    <>
      <path d="M30 60 C31 52 28 46 26 40 L29 39 C31 44 33 48 33 42 C33 38 36 36 37 34 L39 35 C37 40 36 46 35 60Z" fill={BARK} />
      <g className="qpl__sw">
        <ellipse cx="32" cy="24" rx="22" ry="14" fill="#7a9a5a" />
        <ellipse cx="22" cy="20" rx="10" ry="8" fill="#8fb06a" /><ellipse cx="42" cy="19" rx="10" ry="8" fill="#8fb06a" />
        {[[20, 26], [27, 18], [36, 27], [44, 23], [31, 30], [40, 14]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2" ry="2.6" fill="#3d4a2a" />)}
      </g>
    </>
  ),
  fig: (
    <>
      <path d="M30 60 C31 50 30 44 28 38 L31 37 C33 44 34 50 35 60Z" fill={BARK} />
      <g className="qpl__sw">
        <path d="M32 6 C20 6 10 14 10 24 C10 34 20 40 32 40 C44 40 54 34 54 24 C54 14 44 6 32 6Z" fill={LEAF} />
        <path d="M18 18 l6 6 M46 18 l-6 6 M32 12 v10" stroke={LEAF2} strokeWidth="2" strokeLinecap="round" />
        <path d="M22 28 c-3 0 -4 4 -2 6 c2 2 5 1 5 -2 c0 -2 -1 -4 -3 -4Z" fill="#7b3f8c" />
        <path d="M40 26 c-3 0 -4 4 -2 6 c2 2 5 1 5 -2 c0 -2 -1 -4 -3 -4Z" fill="#7b3f8c" />
        <path d="M31 30 c-3 0 -4 4 -2 6 c2 2 5 1 5 -2 c0 -2 -1 -4 -3 -4Z" fill="#94509e" />
      </g>
    </>
  ),
  pomegranate: (
    <>
      <path d="M32 60 V40" stroke={BARK} strokeWidth="3" strokeLinecap="round" />
      <g className="qpl__sw">
        <path d="M32 44 C22 40 18 32 22 26" stroke={BARK} strokeWidth="2" fill="none" />
        {leaf(18, 24, 7)}{leaf(46, 22, 7)}{leaf(30, 14, 6, LEAF2)}
        <circle cx="32" cy="32" r="13" fill="#d7263d" />
        <circle cx="27" cy="28" r="3.5" fill="#ff6b7d" opacity=".6" />
        <path d="M28 20 l2 -5 l2 3 l2 -3 l2 5Z" fill="#a61b2c" />
      </g>
    </>
  ),
  grapes: (
    <>
      <path d="M14 60 V20 M14 22 H50" stroke={BARK} strokeWidth="3" strokeLinecap="round" />
      <g className="qpl__sw">
        <path d="M30 22 C30 26 32 28 34 28" stroke={LEAF2} strokeWidth="1.6" fill="none" />
        <path d="M38 22 c-6 0 -10 6 -6 10 c-4 2 0 8 4 5 c2 4 8 2 7 -2 c5 -1 4 -8 -1 -8 c2 -4 -1 -5 -4 -5Z" fill={LEAF} transform="translate(6 -6)" />
        {[[30, 32], [36, 32], [42, 32], [33, 38], [39, 38], [36, 44], [27, 37], [45, 37], [33, 49]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.6" fill="#6a3d9a" />)}
        <circle cx="29" cy="31" r="1.1" fill="#fff" opacity=".5" /><circle cx="35" cy="37" r="1.1" fill="#fff" opacity=".5" />
      </g>
    </>
  ),
  lote: (
    <>
      <path d="M30 60 C30 50 29 44 26 38 M34 60 C34 50 36 44 40 38" stroke={BARK} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <g className="qpl__sw">
        <ellipse cx="32" cy="24" rx="24" ry="16" fill="#5f9a4b" />
        <ellipse cx="22" cy="20" rx="11" ry="9" fill="#6fb058" /><ellipse cx="42" cy="22" rx="11" ry="9" fill="#6fb058" />
        {[[18, 28], [26, 16], [34, 30], [44, 18], [48, 28], [30, 22], [40, 26]].map(([x, y], i) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.1" fill={i % 2 ? '#e8b923' : '#d9622b'} />)}
      </g>
    </>
  ),
  mustard: (
    <>
      <path d="M32 60 V18 M32 44 L22 32 M32 36 L42 26" stroke="#5b8f3a" strokeWidth="2" strokeLinecap="round" />
      {leaf(24, 54, 6)}{leaf(40, 54, 6)}
      <g className="qpl__sw">
        {[[32, 14], [22, 29], [42, 23], [28, 12], [36, 12], [32, 9], [19, 27], [25, 27], [39, 21], [45, 21], [42, 19]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="#f2c318" />)}
      </g>
      {[[48, 58], [52, 57], [50, 60]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#b8860b" />)}
    </>
  ),
  ginger: (
    <>
      <g className="qpl__sw">
        <path d="M24 46 C22 32 20 22 18 12 M30 46 C30 32 31 22 32 10 M36 46 C38 34 42 24 46 16" stroke={LEAF2} strokeWidth="2" strokeLinecap="round" fill="none" />
        {leaf(19, 18, 6)}{leaf(31, 16, 6)}{leaf(44, 20, 6)}{leaf(23, 30, 5, LEAF2)}{leaf(39, 30, 5, LEAF2)}
      </g>
      <path d="M14 52 c0 -5 6 -6 9 -4 c2 -4 9 -4 11 0 c3 -3 10 -2 10 3 c4 0 6 5 2 7 c-6 3 -26 3 -31 0 c-3 -1 -3 -5 -1 -6Z" fill="#d9a35b" />
      <path d="M20 54 h4 M30 52 h3 M38 55 h4" stroke="#b07a35" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  gourd: (
    <>
      <path d="M6 60 C14 54 20 58 26 54" stroke="#5b8f3a" strokeWidth="2" fill="none" />
      <g className="qpl__sw">
        <path d="M10 40 c-6 -2 -6 -12 2 -12 c2 -6 12 -4 10 4 c4 4 -2 10 -6 8Z" fill={LEAF} />
        <path d="M44 14 c-5 0 -6 7 -3 10 c-6 3 -14 9 -14 20 c0 10 8 16 18 16 c10 0 15 -6 15 -15 c0 -10 -8 -16 -13 -20 c3 -4 2 -11 -3 -11Z" fill="#c5d65a" />
        <path d="M44 14 v-4" stroke="#5b8f3a" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="38" cy="44" rx="4" ry="7" fill="#fff" opacity=".25" />
      </g>
    </>
  ),
  lentils: (
    <>
      <path d="M32 60 V22 M32 48 L22 38 M32 40 L42 30 M32 32 L24 24" stroke="#6a9a3a" strokeWidth="1.8" strokeLinecap="round" />
      <g className="qpl__sw">
        {[[20, 36], [24, 40], [44, 28], [40, 32], [22, 22], [26, 26], [32, 18]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="3.2" ry="1.8" fill="#7fb34a" />)}
        <path d="M36 44 c4 -2 9 0 9 3 c0 3 -5 4 -9 2Z" fill="#b5c45a" /><path d="M28 30 c-4 -2 -8 0 -8 3 c0 3 5 3 8 1Z" fill="#b5c45a" />
      </g>
      <ellipse cx="50" cy="58" rx="10" ry="3.4" fill="#c97a3a" />
      {[[45, 56.5], [49, 55.6], [53, 56.2], [47, 58.2], [51, 58], [55, 57.6]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.8" ry="1.1" fill="#f28c38" />)}
    </>
  ),
  cucumber: (
    <>
      <path d="M8 58 C20 50 30 56 40 48 C48 42 54 44 58 40" stroke="#5b8f3a" strokeWidth="2" fill="none" />
      <g className="qpl__sw">
        <path d="M30 18 c-6 0 -8 8 -4 11 c-3 4 2 9 6 6 c3 3 9 0 7 -4 c5 -2 3 -10 -2 -9 c0 -3 -3 -4 -7 -4Z" fill={LEAF} />
        <circle cx="48" cy="30" r="3.4" fill="#f5c518" /><circle cx="48" cy="30" r="1.3" fill="#e08a1e" />
      </g>
      <rect x="12" y="44" width="30" height="10" rx="5" fill="#3f8a3a" transform="rotate(-12 27 49)" />
      {[[18, 49], [25, 47], [32, 45], [22, 51], [30, 49]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".9" fill="#a6d38f" />)}
    </>
  ),
  onion: (
    <>
      <g className="qpl__sw">
        <path d="M30 34 C28 22 24 14 20 6 M32 34 C32 22 33 14 34 4 M34 34 C36 24 40 16 46 9" stroke="#4fae4f" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>
      <path d="M32 32 C22 36 18 44 20 52 C22 58 42 58 44 52 C46 44 42 36 32 32Z" fill="#b5577a" />
      <path d="M32 33 C27 40 26 48 28 56 M32 33 C37 40 38 48 36 56" stroke="#d987a6" strokeWidth="1.3" fill="none" />
      <path d="M28 57 l-2 3 M32 57 v3 M36 57 l2 3" stroke="#d9c7a0" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  tamarisk: (
    <>
      <path d="M31 60 C31 50 28 44 24 38 M33 60 C34 52 38 44 42 40 M32 52 V36" stroke={BARK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <g className="qpl__sw">
        <ellipse cx="22" cy="26" rx="11" ry="14" fill="#7aa88a" /><ellipse cx="42" cy="26" rx="11" ry="14" fill="#7aa88a" />
        <ellipse cx="32" cy="20" rx="11" ry="16" fill="#8bbb9b" />
        {[[18, 18], [26, 12], [38, 12], [46, 18], [32, 8], [22, 30], [42, 30]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.4" ry="4.4" fill="#f0a6c4" />)}
      </g>
    </>
  ),
}
function PlantArt({ id, className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <ellipse cx="32" cy="61" rx="22" ry="3" fill="#7a4e2d" opacity=".35" />
      {ART[id]}
    </svg>
  )
}

const cache = new Map()
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const makeQ = (prev) => {
  const pool = QURAN_PLANTS.filter(p => p.id !== prev)
  const ans = pool[Math.floor(Math.random() * pool.length)]
  return { ans, opts: shuffle([ans, ...shuffle(QURAN_PLANTS.filter(p => p.id !== ans.id)).slice(0, 3)]) }
}

export default function QuranPlants({ lang = 'az', ayahHref }) {
  const t = pickUi(T, lang)
  const reduced = useReduced()
  const [mode, setMode] = useState('garden')
  const [sel, setSel] = useState(QURAN_PLANTS[0].id)
  const [ri, setRi] = useState(0)
  const [texts, setTexts] = useState(null)
  const [q, setQ] = useState(() => makeQ())
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const p = useMemo(() => QURAN_PLANTS.find(x => x.id === sel), [sel])

  useEffect(() => {
    let alive = true
    const file = lang === 'ar' ? 'ar' : lang
    const load = (f) => cache.get(f) || fetch(`/data/quran-plants/${f}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
    const pr = load(file).catch(() => load('en'))
    cache.set(file, pr)
    pr.then(d => { if (alive) setTexts(d) }).catch(() => {})
    return () => { alive = false }
  }, [lang])

  const pick = (id) => { setSel(id); setRi(0) }
  const choose = (opt) => {
    if (picked === q.ans.id) return
    setPicked(opt.id)
    if (opt.id === q.ans.id) setScore(s => s + 1)
  }
  const nextQ = () => { setQ(makeQ(q.ans.id)); setPicked(null) }
  const ref = p.refs[Math.min(ri, p.refs.length - 1)]
  const [s, n] = ref.split(':').map(Number)

  return (
    <div className={`qpl${reduced ? '' : ' is-live'}`} data-testid="quran-plants">
      <div className="qpl__tabs" role="tablist">
        {['garden', 'game'].map(m => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={`qpl__tab${mode === m ? ' is-on' : ''}`} onClick={() => setMode(m)} data-testid={`qpl-tab-${m}`}>
            {m === 'garden' ? t.garden : t.game}
          </button>
        ))}
      </div>

      {mode === 'garden' && (
        <div className="qpl__learn">
          <div className="qpl__garden">
            <p className="qpl__hint">{t.tap}</p>
            <ul className="qpl__bed" data-testid="qpl-garden">
              {QURAN_PLANTS.map((x, i) => (
                <li key={x.id}>
                  <button type="button" className={`qpl__plant${x.id === sel ? ' is-on' : ''}`} onClick={() => pick(x.id)} aria-pressed={x.id === sel} data-plant={x.id} style={{ '--d': `${(i % 5) * -0.7}s` }}>
                    <PlantArt id={x.id} className="qpl__art" />
                    <span className="qpl__nm">{pickUi(x.name, lang)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <article className="qpl__card" aria-live="polite" data-testid="plant-card" data-id={p.id} key={p.id}>
            <div className="qpl__top">
              <PlantArt id={p.id} className="qpl__big" />
              <div>
                <h3 className="qpl__title">{pickUi(p.name, lang)}</h3>
                {lang !== 'ar' && <p className="qpl__ar ui-arabic" lang="ar" dir="rtl">{p.ar}</p>}
              </div>
            </div>
            {p.refs.length > 1 && (
              <div className="qpl__refs" role="group" aria-label={t.ayahs}>
                {p.refs.map((r, i) => (
                  <button key={r} type="button" className={`qpl__chip ui-num${r === ref ? ' is-on' : ''}`} aria-pressed={r === ref} onClick={() => setRi(i)} dir="ltr" data-testid="qpl-ref">{r}</button>
                ))}
              </div>
            )}
            <blockquote className="qpl__ayah ui-arabic" lang="ar" dir="rtl" data-testid="qpl-ayah">{texts ? texts.ar[ref] : t.loading} <span className="ui-num">﴿{n}﴾</span></blockquote>
            {lang !== 'ar' && texts?.tr?.[ref] && <p className="qpl__tr">{texts.tr[ref]} <small>— {t.trl}: {texts.by}</small></p>}
            <div className="qpl__foot">
              <span className="ui-num qpl__ref" dir="ltr">{ref}</span>
              {ayahHref && <a className="ui-btn ui-btn--secondary ui-btn--sm" href={ayahHref(s, n)} data-testid="qpl-open">{t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" /></a>}
            </div>
          </article>
        </div>
      )}

      {mode === 'game' && (
        <div className="qpl__game" data-testid="qpl-game">
          <p className="qpl__ask">{t.ask}</p>
          <p className="qpl__word ui-arabic" lang="ar" dir="rtl" data-testid="qpl-word" data-id={q.ans.id}>{q.ans.ar}</p>
          <div className="qpl__opts">
            {q.opts.map(o => {
              const st = picked == null ? '' : o.id === q.ans.id && picked === q.ans.id ? ' is-right' : o.id === picked ? ' is-wrong' : ''
              return (
                <button key={o.id} type="button" className={`qpl__opt${st}`} onClick={() => choose(o)} data-testid="qpl-opt" data-id={o.id}>
                  <PlantArt id={o.id} className="qpl__art" />
                  <span>{pickUi(o.name, lang)}</span>
                </button>
              )
            })}
          </div>
          <p className="qpl__fb" aria-live="polite" data-testid="qpl-fb">{picked == null ? '' : picked === q.ans.id ? t.right : t.wrong}</p>
          <div className="qpl__foot">
            <span>{t.score}: <b className="ui-num" data-testid="qpl-score">{score}</b></span>
            {picked === q.ans.id && <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={nextQ} data-testid="qpl-next">{t.next}</button>}
          </div>
        </div>
      )}
      <p className="qpl__note"><Icon name="info" size={14} /> {t.note}</p>
    </div>
  )
}
