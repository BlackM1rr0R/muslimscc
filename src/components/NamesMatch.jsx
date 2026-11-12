// ═══════════════════════════════════════════════════════
// NamesMatch (v6.3) — "Adı mənası ilə cütlə" (/names)
//
//   <NamesMatch names={NAMES_99} lang="az" meaningOf={(name, lang) => …} />
//
// • Kartlar üzüaşağı; ərəbcə adı mənası ilə cütləşdirmək lazımdır. 3 səviyyə (6 / 8 / 10 cüt),
//   vaxt və gediş sayı, hər səviyyənin ən yaxşı vaxtı bu cihazda (localStorage names_match_best).
// • Məlumat — saytın 99 ad siyahısı (data/names99.js); məna mötərizədəki izah olanda onu götürürük
//   ("Əhəd (Yeganə)" → "Yeganə"), ki, kart adın transliterasiyasını təkrarlamasın.
// • Hərəkət azaldılıbsa — kartlar çevrilmə animasiyasız açılır.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { shortMeaning } from '../utils/namesMatch'
import '../styles/NamesMatch.css'

const T = {
  az: { ey: 'Oyun', title: 'Adı mənası ilə cütlə', lead: 'Kartları çevirin: ərəbcə adı onun mənası ilə cütləşdirin. Hər cüt tapılanda ad yerində qalır.', level: 'Səviyyə', time: 'Vaxt', moves: 'Gediş', best: 'Ən yaxşı', start: 'Başla', again: 'Yenidən', next: 'Növbəti səviyyə', won: 'Afərin! Bütün cütlər tapıldı', pairs: 'cüt', card: 'Kart', name: 'Ad', meaning: 'Məna', record: 'Yeni rekord!' },
  en: { ey: 'Game', title: 'Match the name to its meaning', lead: 'Turn the cards over and pair each Arabic name with its meaning. Every pair you find stays face up.', level: 'Level', time: 'Time', moves: 'Moves', best: 'Best', start: 'Start', again: 'Play again', next: 'Next level', won: 'Well done! All pairs found', pairs: 'pairs', card: 'Card', name: 'Name', meaning: 'Meaning', record: 'New record!' },
  ru: { ey: 'Игра', title: 'Соедините имя с его значением', lead: 'Переворачивайте карточки и соединяйте арабское имя с его значением. Найденные пары остаются открытыми.', level: 'Уровень', time: 'Время', moves: 'Ходы', best: 'Лучшее', start: 'Начать', again: 'Ещё раз', next: 'Следующий уровень', won: 'Отлично! Все пары найдены', pairs: 'пар', card: 'Карточка', name: 'Имя', meaning: 'Значение', record: 'Новый рекорд!' },
  ar: { ey: 'لعبة', title: 'طابِق الاسم بمعناه', lead: 'اقلب البطاقات وطابِق كل اسم عربي بمعناه. كل زوج تجده يبقى مكشوفًا.', level: 'المستوى', time: 'الوقت', moves: 'الحركات', best: 'الأفضل', start: 'ابدأ', again: 'العب مجددًا', next: 'المستوى التالي', won: 'أحسنت! وجدت كل الأزواج', pairs: 'أزواج', card: 'بطاقة', name: 'الاسم', meaning: 'المعنى', record: 'رقم قياسي جديد!' },
  tr: { ey: 'Oyun', title: 'İsmi anlamıyla eşleştir', lead: 'Kartları çevirin ve her Arapça ismi anlamıyla eşleştirin. Bulunan her çift açık kalır.', level: 'Seviye', time: 'Süre', moves: 'Hamle', best: 'En iyi', start: 'Başla', again: 'Tekrar', next: 'Sonraki seviye', won: 'Tebrikler! Bütün çiftler bulundu', pairs: 'çift', card: 'Kart', name: 'İsim', meaning: 'Anlam', record: 'Yeni rekor!' },
}
const LEVELS = [6, 8, 10]
const BEST_KEY = 'names_match_best'
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))

function shuffle(a, seed) {
  let x = seed >>> 0
  const r = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296 }
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] }
  return b
}
const readBest = () => { try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {} } catch { return {} } }

export default function NamesMatch({ names, lang = 'az', meaningOf }) {
  const t = pickUi(T, lang)
  const [level, setLevel] = useState(0)
  const [seed, setSeed] = useState(() => (Date.now() % 100000) + 1)
  const [open, setOpen] = useState([])          // açıq (yoxlanan) kart indeksləri
  const [done, setDone] = useState(() => new Set())
  const [moves, setMoves] = useState(0)
  const [t0, setT0] = useState(null)
  const [now, setNow] = useState(0)
  const [best, setBest] = useState(readBest)
  const [record, setRecord] = useState(false)
  const lock = useRef(false)
  const timer = useRef(0)

  const cards = useMemo(() => {
    const pool = names.filter(n => n.n > 1 && shortMeaning(meaningOf(n, lang)))
    // Eyni mənalı iki ad bir oyuna düşməsin (kart mətnləri fərqli olsun)
    const seen = new Set(), pick = []
    for (const n of shuffle(pool, seed)) {
      const m = shortMeaning(meaningOf(n, lang)).toLowerCase()
      if (seen.has(m)) continue
      seen.add(m); pick.push(n)
      if (pick.length === LEVELS[level]) break
    }
    const list = pick.flatMap(n => [{ id: n.n, kind: 'ar', text: n.ar }, { id: n.n, kind: 'm', text: shortMeaning(meaningOf(n, lang)) }])
    return shuffle(list, seed * 7 + level)
  }, [names, lang, meaningOf, seed, level])
  const total = LEVELS[level]
  const won = done.size === total
  const secs = t0 ? Math.floor(((won ? now : now) - t0) / 1000) : 0

  useEffect(() => { setOpen([]); setDone(new Set()); setMoves(0); setT0(null); setNow(0); setRecord(false); lock.current = false }, [cards])
  useEffect(() => {
    if (!t0 || won) return undefined
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [t0, won])
  useEffect(() => {
    if (!won || !t0) return
    const s = Math.max(1, Math.round((Date.now() - t0) / 1000))
    setNow(Date.now())
    setBest(b => {
      const prev = b[total]
      if (prev && prev <= s) return b
      const nb = { ...b, [total]: s }
      try { localStorage.setItem(BEST_KEY, JSON.stringify(nb)) } catch { /* yaddaş yoxdur */ }
      setRecord(Boolean(prev))
      return nb
    })
  }, [won]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(timer.current), [])

  const flip = (i) => {
    if (lock.current || open.includes(i) || done.has(cards[i].id)) return
    if (!t0) { setT0(Date.now()); setNow(Date.now()) }
    const nx = [...open, i]
    setOpen(nx)
    if (nx.length < 2) return
    setMoves(m => m + 1)
    const [a, b] = nx.map(k => cards[k])
    if (a.id === b.id && a.kind !== b.kind) {
      setDone(d => new Set(d).add(a.id)); setOpen([])
    } else {
      lock.current = true
      timer.current = setTimeout(() => { setOpen([]); lock.current = false }, reduced() ? 600 : 900)
    }
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <section className="nmg ui-card" aria-labelledby="nmg-title" data-testid="names-match">
      <div className="nmg__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h3 id="nmg-title" className="ui-title ui-title--sm">{t.title}</h3>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <div className="nmg__bar">
        <div className="nmg__levels" role="group" aria-label={t.level}>
          {LEVELS.map((n, i) => (
            <button key={n} type="button" className="ui-chip" aria-pressed={level === i} onClick={() => { setLevel(i); setSeed(s => s + 1) }} data-testid={`nmg-level-${i}`}>
              {t.level} {i + 1} · <span className="ui-num">{n}</span> {t.pairs}
            </button>
          ))}
        </div>
        <span className="nmg__stat ui-num">{t.time}: <b data-testid="nmg-time">{fmt(secs)}</b></span>
        <span className="nmg__stat ui-num">{t.moves}: <b data-testid="nmg-moves">{moves}</b></span>
        {best[total] && <span className="nmg__stat ui-num">{t.best}: <b>{fmt(best[total])}</b></span>}
      </div>
      <ul className={`nmg__grid is-${total}`}>
        {cards.map((c, i) => {
          const up = open.includes(i) || done.has(c.id)
          return (
            <li key={`${c.kind}-${c.id}`}>
              <button type="button" className={`nmg__card${up ? ' is-up' : ''}${done.has(c.id) ? ' is-done' : ''}`} onClick={() => flip(i)}
                aria-label={up ? `${c.kind === 'ar' ? t.name : t.meaning}: ${c.text}` : `${t.card} ${i + 1}`} data-testid="nmg-card" data-id={c.id} data-kind={c.kind}>
                <span className="nmg__face nmg__back" aria-hidden="true"><span className="nmg__star" /></span>
                <span className={`nmg__face nmg__front is-${c.kind}`} aria-hidden="true" lang={c.kind === 'ar' ? 'ar' : undefined}>{c.text}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {won && (
        <div className="nmg__won" role="status" data-testid="nmg-won">
          <b><Icon name="check" size={18} /> {t.won}</b>
          <span className="ui-num">{t.time}: {fmt(secs)} · {t.moves}: {moves}</span>
          {record && <span className="nmg__rec">{t.record}</span>}
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setSeed(s => s + 1)}><Icon name="refresh" className="ui-btn__icon" /> {t.again}</button>
          {level < LEVELS.length - 1 && <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => { setLevel(level + 1); setSeed(s => s + 1) }}>{t.next}</button>}
        </div>
      )}
    </section>
  )
}
