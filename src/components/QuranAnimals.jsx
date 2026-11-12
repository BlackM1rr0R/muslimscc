// ═══════════════════════════════════════════════════════
// QuranAnimals (v6.5) — "Quranda heyvanlar" (/kids)
//
//   <QuranAnimals lang="az" ayahHref={(s, a) => '/quran/…?a=…'} />
//
// • 21 heyvan (data/quranAnimals.js) — yalnız Quranın adını açıq çəkdikləri. Karta toxun → ərəbcə
//   adı, Quranda neçə dəfə keçdiyi (Quranic Arabic Corpus), adını daşıyan surə, ayənin özü və
//   saytın həmin dildəki rəsmi tərcüməsi (public/data/quran-animals/<dil>.json — hərfi-hərfinə).
// • "Hansı heyvandır?" oyunu: ərəbcə ad göstərilir, 4 şəkildən düzgününü tap.
// • Təfsir/izah yazılmır. Hərəkət azaldılıbsa — yalnız rəng dəyişir.
// Stillər: src/styles/QuranAnimals.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { QURAN_ANIMALS } from '../data/quranAnimals'
import '../styles/QuranAnimals.css'

const T = {
  az: { times: n => `Quranda ${n} dəfə keçir`, surah: 'Bu adda surə var', open: 'Ayəni oxu', trl: 'Tərcümə', loading: 'Yüklənir…',
    learn: 'Kartlar', game: 'Hansı heyvandır?', ask: 'Bu ərəbcə söz hansı heyvanın adıdır?', right: 'Afərin, düzdür!', wrong: 'Bir də yoxla', next: 'Növbəti', score: 'Xal',
    note: 'Yalnız Quranın adını açıq çəkdiyi heyvanlar. Saylar — Quranic Arabic Corpus. Ayə mətni və tərcüməsi saytdakı Quranla eynidir.' },
  en: { times: n => `Mentioned ${n} ${n === 1 ? 'time' : 'times'} in the Quran`, surah: 'A surah has this name', open: 'Read the verse', trl: 'Translation', loading: 'Loading…',
    learn: 'Cards', game: 'Which animal?', ask: 'Which animal is this Arabic word?', right: 'Well done, that’s right!', wrong: 'Try again', next: 'Next', score: 'Score',
    note: 'Only animals the Quran names directly. Counts: Quranic Arabic Corpus. The verse text and translation are the same as in the site’s Quran.' },
  ru: { times: n => `Упоминается в Коране: ${n}`, surah: 'Есть сура с этим названием', open: 'Читать аят', trl: 'Перевод', loading: 'Загрузка…',
    learn: 'Карточки', game: 'Какое это животное?', ask: 'Какое животное называется этим арабским словом?', right: 'Молодец, верно!', wrong: 'Попробуй ещё раз', next: 'Дальше', score: 'Очки',
    note: 'Только животные, которых Коран называет прямо. Числа — Quranic Arabic Corpus. Текст аята и перевод — те же, что в Коране на сайте.' }, // lang-ok[Quranic,Arabic,Corpus]: mənbənin adı (xüsusi ad)
  ar: { times: n => `ورد في القرآن ${n} مرة`, surah: 'سورة بهذا الاسم', open: 'اقرأ الآية', trl: 'الترجمة', loading: 'جارٍ التحميل…',
    learn: 'البطاقات', game: 'أيّ حيوان هذا؟', ask: 'أيّ حيوان تدل عليه هذه الكلمة؟', right: 'أحسنت، صحيح!', wrong: 'حاول مرة أخرى', next: 'التالي', score: 'النقاط',
    note: 'الحيوانات التي ذكرها القرآن باسمها فقط. الأعداد من Quranic Arabic Corpus. ونص الآية كما في مصحف الموقع.' }, // lang-ok[Quranic,Arabic,Corpus]: mənbənin adı (xüsusi ad)
  tr: { times: n => `Kur’an’da ${n} kez geçer`, surah: 'Bu adda bir sure var', open: 'Ayeti oku', trl: 'Meal', loading: 'Yükleniyor…',
    learn: 'Kartlar', game: 'Hangi hayvan?', ask: 'Bu Arapça kelime hangi hayvanın adı?', right: 'Aferin, doğru!', wrong: 'Bir daha dene', next: 'Sonraki', score: 'Puan',
    note: 'Yalnızca Kur’an’ın adını açıkça andığı hayvanlar. Sayılar: Quranic Arabic Corpus. Ayet metni ve meali sitedeki Kur’an ile aynıdır.' }, // lang-ok[Quranic,Arabic,Corpus]: mənbənin adı (xüsusi ad)
}
const cache = new Map()
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const makeQ = (prev) => {
  const pool = QURAN_ANIMALS.filter(a => a.id !== prev)
  const ans = pool[Math.floor(Math.random() * pool.length)]
  return { ans, opts: shuffle([ans, ...shuffle(QURAN_ANIMALS.filter(a => a.id !== ans.id)).slice(0, 3)]) }
}

export default function QuranAnimals({ lang = 'az', ayahHref, surahName }) {
  const t = pickUi(T, lang)
  const [mode, setMode] = useState('learn')
  const [sel, setSel] = useState(QURAN_ANIMALS[0].id)
  const [texts, setTexts] = useState(null)
  const [q, setQ] = useState(() => makeQ())
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const a = useMemo(() => QURAN_ANIMALS.find(x => x.id === sel), [sel])

  useEffect(() => {
    let alive = true
    const file = lang === 'ar' ? 'ar' : lang
    const load = (f) => cache.get(f) || fetch(`/data/quran-animals/${f}.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
    const p = load(file).catch(() => load('en'))
    cache.set(file, p)
    p.then(d => { if (alive) setTexts(d) }).catch(() => {})
    return () => { alive = false }
  }, [lang])

  const choose = (opt) => {
    if (picked === q.ans.id) return
    setPicked(opt.id)
    if (opt.id === q.ans.id) setScore(s => s + 1)
  }
  const nextQ = () => { setQ(makeQ(q.ans.id)); setPicked(null) }
  const [s, n] = a.ref.split(':').map(Number)

  return (
    <div className="qan" data-testid="quran-animals">
      <div className="qan__tabs" role="tablist">
        {['learn', 'game'].map(m => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={`qan__tab${mode === m ? ' is-on' : ''}`} onClick={() => setMode(m)} data-testid={`qan-tab-${m}`}>
            {m === 'learn' ? t.learn : t.game}
          </button>
        ))}
      </div>

      {mode === 'learn' && (
        <div className="qan__learn">
          <ul className="qan__grid" data-testid="qan-grid">
            {QURAN_ANIMALS.map(x => (
              <li key={x.id}>
                <button type="button" className={`qan__tile${x.id === sel ? ' is-on' : ''}`} onClick={() => setSel(x.id)} aria-pressed={x.id === sel} data-testid="qan-tile" data-id={x.id}>
                  <span className="qan__emoji" aria-hidden="true">{x.emoji}</span>
                  <span className="qan__nm">{pickUi(x.name, lang)}</span>
                </button>
              </li>
            ))}
          </ul>
          <article className="qan__card" aria-live="polite" data-testid="qan-card" key={a.id}>
            <div className="qan__top">
              <span className="qan__big" aria-hidden="true">{a.emoji}</span>
              <div>
                <h3 className="qan__title">{pickUi(a.name, lang)}</h3>
                {lang !== 'ar' && <p className="qan__ar ui-arabic" lang="ar" dir="rtl">{a.ar}</p>}
                <p className="qan__count" data-testid="qan-count">{t.times(a.count)}</p>
                {a.surah && <p className="qan__surah"><Icon name="quran" size={14} /> {t.surah}: <b>{surahName ? surahName(a.surah) : a.surah}</b> <span className="ui-num">({a.surah})</span></p>}
              </div>
            </div>
            <blockquote className="qan__ayah ui-arabic" lang="ar" dir="rtl">{texts ? texts.ar[a.ref] : t.loading} <span className="ui-num">﴿{n}﴾</span></blockquote>
            {lang !== 'ar' && texts?.tr?.[a.ref] && <p className="qan__tr">{texts.tr[a.ref]} <small>— {t.trl}: {texts.by}</small></p>}
            <div className="qan__foot">
              <span className="ui-num qan__ref" dir="ltr">{a.ref}</span>
              {ayahHref && <a className="ui-btn ui-btn--secondary ui-btn--sm" href={ayahHref(s, n)} data-testid="qan-open">{t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" /></a>}
            </div>
          </article>
        </div>
      )}

      {mode === 'game' && (
        <div className="qan__game" data-testid="qan-game">
          <p className="qan__ask">{t.ask}</p>
          <p className="qan__word ui-arabic" lang="ar" dir="rtl" data-testid="qan-word" data-id={q.ans.id}>{q.ans.ar}</p>
          <div className="qan__opts">
            {q.opts.map(o => {
              const st = picked == null ? '' : o.id === q.ans.id && picked === q.ans.id ? ' is-right' : o.id === picked ? ' is-wrong' : ''
              return (
                <button key={o.id} type="button" className={`qan__opt${st}`} onClick={() => choose(o)} data-testid="qan-opt" data-id={o.id}>
                  <span className="qan__emoji" aria-hidden="true">{o.emoji}</span>
                  <span>{pickUi(o.name, lang)}</span>
                </button>
              )
            })}
          </div>
          <p className="qan__fb" aria-live="polite" data-testid="qan-fb">{picked == null ? '' : picked === q.ans.id ? t.right : t.wrong}</p>
          <div className="qan__foot">
            <span>{t.score}: <b className="ui-num" data-testid="qan-score">{score}</b></span>
            {picked === q.ans.id && <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={nextQ} data-testid="qan-next">{t.next}</button>}
          </div>
        </div>
      )}
      <p className="qan__note"><Icon name="info" size={14} /> {t.note}</p>
    </div>
  )
}
