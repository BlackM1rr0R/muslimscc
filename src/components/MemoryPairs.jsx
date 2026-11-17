// ═══════════════════════════════════════════════════════
// MemoryPairs — "Cütünü tap" yaddaş oyunu (/kids, uşaqlar və ailə)
//
// • Cütlər saytın öz məlumatındandır (utils/kidsWordData.js memoryPairs):
//   Allahın ərəbcə adı ↔ mənası (KidsPage siyahısı), surənin ərəbcə adı ↔
//   yerli adı (Fatihə + 30-cu cüz), peyğəmbərin ərəbcə adı ↔ yerli adı.
// • 8 / 12 / 16 kart; iki kart açılır = 1 gediş. Ən yaxşı nəticə (ən az
//   gediş) mövzu + ölçü üzrə localStorage "muslim_cc_memory_best"-də.
// • Çevrilmə yalnız transform ilə; hərəkət azaldılıbsa — çevrilmə yoxdur,
//   üz dərhal dəyişir. Məntiq utils/memoryPairs.js-dədir (saf, test olunur).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { pickUi } from '../utils/uiText'
import { hashSeed } from '../utils/crossword'
import { memoryPairs, WORD_THEMES } from '../utils/kidsWordData'
import { buildDeck, newGame, flip, settle, isWon, bestKey, updateBest, readBest, writeBest, MEMORY_SIZES } from '../utils/memoryPairs'
import '../styles/MemoryPairs.css'

const T = {
  az: { ey: 'Uşaqlar və ailə', title: 'Cütünü tap', lead: 'Kartları çevirin və cütləri tapın: Allahın ərəbcə adı və mənası, surənin ərəbcə və bizdəki adı, peyğəmbərin ərəbcə adı. Nə qədər az gedişlə — o qədər yaxşı!',
    themeL: 'Mövzu', sizeL: 'Kart sayı', themes: { names: 'Allahın adları', surahs: 'Surələr', prophets: 'Peyğəmbərlər' },
    cards: (n) => `${n} kart`, moves: 'Gediş', found: 'Tapıldı', best: 'Ən yaxşı', fresh: 'Yeni oyun', hidden: (i) => `Kart ${i}, bağlıdır`,
    won: (m) => `Afərin! Bütün cütləri ${m} gedişdə tapdınız.`, record: 'Yeni rekord!', src: 'Mənbə: saytın «Uşaqlar» bölməsindəki Allahın adları, surə adları cədvəli və «İslam tarixi»ndəki peyğəmbərlər.' },
  en: { ey: 'Kids & family', title: 'Find the pair', lead: 'Flip the cards and find the pairs: a name of Allah in Arabic and its meaning, a surah’s name in Arabic and in Latin letters, a prophet’s Arabic name. The fewer moves, the better!',
    themeL: 'Theme', sizeL: 'Cards', themes: { names: 'Names of Allah', surahs: 'Surahs', prophets: 'Prophets' },
    cards: (n) => `${n} cards`, moves: 'Moves', found: 'Found', best: 'Best', fresh: 'New game', hidden: (i) => `Card ${i}, face down`,
    won: (m) => `Well done! You found all the pairs in ${m} moves.`, record: 'New record!', src: 'Source: the names of Allah from the site’s Kids section, its surah name table and the prophets from Islamic history.' },
  ru: { ey: 'Детям и семье', title: 'Найди пару', lead: 'Переворачивайте карточки и находите пары: имя Аллаха по-арабски и его значение, арабское и русское название суры, арабское имя пророка. Чем меньше ходов — тем лучше!',
    themeL: 'Тема', sizeL: 'Карточки', themes: { names: 'Имена Аллаха', surahs: 'Суры', prophets: 'Пророки' },
    cards: (n) => `${n} карточек`, moves: 'Ходы', found: 'Найдено', best: 'Рекорд', fresh: 'Новая игра', hidden: (i) => `Карточка ${i}, закрыта`,
    won: (m) => `Молодец! Все пары найдены за ${m} ходов.`, record: 'Новый рекорд!', src: 'Источник: имена Аллаха из детского раздела сайта, таблица названий сур и пророки из «Исламской истории».' },
  ar: { ey: 'للأطفال والأسرة', title: 'جِد الزوج', lead: 'اقلب البطاقات وابحث عن الأزواج: اسم من أسماء الله ومعناه، اسم السورة بالعربية وبالحروف اللاتينية، اسم النبي بالعربية واللاتينية. كلما قلّت الحركات كان أفضل!',
    themeL: 'الموضوع', sizeL: 'عدد البطاقات', themes: { names: 'أسماء الله', surahs: 'السور', prophets: 'الأنبياء' },
    cards: (n) => `${n} بطاقة`, moves: 'الحركات', found: 'وُجد', best: 'الأفضل', fresh: 'لعبة جديدة', hidden: (i) => `البطاقة ${i}، مقلوبة`,
    won: (m) => `أحسنت! وجدت كل الأزواج في ${m} حركة.`, record: 'رقم قياسي جديد!', src: 'المصدر: أسماء الله من قسم الأطفال في الموقع، وجدول أسماء السور، والأنبياء من قسم التاريخ الإسلامي.' },
  tr: { ey: 'Çocuklar ve aile', title: 'Eşini bul', lead: 'Kartları çevirin ve eşleri bulun: Allah’ın Arapça ismi ve anlamı, surenin Arapça ve Türkçe adı, peygamberin Arapça adı. Ne kadar az hamle, o kadar iyi!',
    themeL: 'Konu', sizeL: 'Kart sayısı', themes: { names: 'Allah’ın isimleri', surahs: 'Sureler', prophets: 'Peygamberler' },
    cards: (n) => `${n} kart`, moves: 'Hamle', found: 'Bulunan', best: 'En iyi', fresh: 'Yeni oyun', hidden: (i) => `Kart ${i}, kapalı`,
    won: (m) => `Aferin! Bütün eşleri ${m} hamlede buldunuz.`, record: 'Yeni rekor!', src: 'Kaynak: sitenin «Çocuklar» bölümündeki Allah’ın isimleri, sure adları tablosu ve «İslam tarihi»ndeki peygamberler.' },
}

const MISS_MS = 900
const todaySeed = () => { const d = new Date(); return hashSeed('mp', d.getFullYear(), d.getMonth(), d.getDate()) % 100000 }

export default function MemoryPairs() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [theme, setTheme] = useState('names')
  const [size, setSize] = useState(12)
  const [seed, setSeed] = useState(todaySeed)
  const deck = useMemo(() => buildDeck(memoryPairs(theme, lang), size, hashSeed(theme, size, seed)), [theme, size, seed, lang])
  const [game, setGame] = useState(() => newGame(deck))
  const [best, setBest] = useState(() => readBest())
  const [record, setRecord] = useState(false)

  // Yeni göyərtə → yeni oyun
  const [deckSeen, setDeckSeen] = useState(deck)
  if (deckSeen !== deck) { setDeckSeen(deck); setGame(newGame(deck)); setRecord(false) }

  // Cüt olmayan iki kart — qısa fasilədən sonra bağlanır
  useEffect(() => {
    if (game.open.length !== 2) return undefined
    const t = setTimeout(() => setGame(g => settle(g)), MISS_MS)
    return () => clearTimeout(t)
  }, [game.open])

  const won = isWon(game)
  const bk = bestKey(theme, size)
  useEffect(() => {
    if (!won) return
    const cur = readBest()
    const r = updateBest(cur, bk, game.moves)
    if (r.improved) writeBest(r.map)
    setBest(r.map)
    setRecord(r.improved && typeof cur[bk] === 'number')
  }, [won, bk, game.moves])

  const pairsTotal = game.cards.length / 2

  return (
    <section className={`ui-card mp${reduced ? ' mp--still' : ''}`} data-testid="memory-pairs" data-matched={game.matched.length} data-moves={game.moves}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 className="mp__title">{u.title}</h2>
      <p className="mp__lead">{u.lead}</p>

      <div className="mp__opts">
        <div className="mp__group" role="group" aria-label={u.themeL}>
          {WORD_THEMES.slice().sort((a, b) => (a === 'names' ? -1 : b === 'names' ? 1 : 0)).map(t => (
            <button key={t} type="button" className="ui-chip" aria-pressed={theme === t} onClick={() => setTheme(t)}>{u.themes[t]}</button>
          ))}
        </div>
        <div className="mp__group" role="group" aria-label={u.sizeL}>
          {MEMORY_SIZES.map(n => (
            <button key={n} type="button" className="ui-chip" aria-pressed={size === n} onClick={() => setSize(n)}>{u.cards(n)}</button>
          ))}
        </div>
      </div>

      <div className="mp__bar">
        <dl className="mp__stats">
          <div><dt>{u.moves}</dt><dd className="ui-num" data-testid="mp-moves" aria-live="polite">{game.moves}</dd></div>
          <div><dt>{u.found}</dt><dd className="ui-num">{game.matched.length} / {pairsTotal}</dd></div>
          <div><dt>{u.best}</dt><dd className="ui-num" data-testid="mp-best">{best[bk] ?? '—'}</dd></div>
        </dl>
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" data-testid="mp-new" onClick={() => setSeed(s => s + 1)}>
          <Icon name="refresh" className="ui-btn__icon" /> {u.fresh}
        </button>
      </div>

      <div className={`mp__grid mp__grid--${size}`}>
        {game.cards.map((card, i) => {
          const matched = game.matched.includes(card.pair)
          const up = matched || game.open.includes(i)
          const miss = game.open.length === 2 && game.open.includes(i)
          return (
            <button key={`${card.pair}-${card.side}`} type="button"
              className={`mp__card${up ? ' is-up' : ''}${matched ? ' is-matched' : ''}${miss ? ' is-miss' : ''}`}
              data-card={i} data-pair={card.pair}
              aria-label={up ? card.text : u.hidden(i + 1)}
              aria-pressed={up}
              disabled={matched}
              onClick={() => setGame(g => flip(g, i))}>
              <span className="mp__inner" aria-hidden="true">
                <span className="mp__face mp__back"><Icon name="star" size={22} /></span>
                <span className={`mp__face mp__front${card.lang === 'ar' ? ' is-ar' : ''}`} lang={card.lang} dir={card.lang === 'ar' ? 'rtl' : 'ltr'}>{card.text}</span>
              </span>
            </button>
          )
        })}
      </div>

      <p className={`mp__msg${won ? ' is-won' : ''}`} role="status" data-testid="mp-msg">
        {won ? <>{u.won(game.moves)}{record && <b className="mp__record"> {u.record}</b>}</> : ''}
      </p>
      <p className="mp__src">{u.src}</p>
    </section>
  )
}
