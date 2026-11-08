// ═══════════════════════════════════════════════════════
// DuaDeck (v5.8) — "Bu günün duaları" kart dəstəsi (/duas)
//
//   <DuaDeck duas={DUAS_DATA} lang="az" />
//
// • Hər gün 7 dua (tarixə görə deterministik — hamıda eyni). Kartı SAĞA sürüşdür
//   (və ya "Oxudum") — oxunmuş sayılır; SOLA (və ya "Sonra") — dəstənin sonuna keçir.
//   RTL-də istiqamət güzgülənir. Klaviatura: → oxudum, ← sonra.
// • Mətn saytın dua bazasındandır (src/data/duas.js: ərəbcə, oxunuş, tərcümə, mənbə).
// • Bitəndə — günün nəticəsi və ulduz partlayışı (utils/celebrate). Vəziyyət gün ərzində
//   yadda qalır ('dua_deck_v1'), yalnız bu cihazda.
// • Sürüşmə: pointer hadisələri, kart transform ilə hərəkət edir (layout yox).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { localizeSource } from '../utils/sourceNames'
import { celebrate } from '../utils/celebrate'
import '../styles/DuaDeck.css'

const KEY = 'dua_deck_v1'
const N = 7
const T = {
  az: { ey: 'Bu günün duaları', title: '7 dua — kart-kart', lead: 'Sağa sürüşdürün — oxudum, sola — sonra.', read: 'Oxudum', later: 'Sonra', done: 'Bu günün 7 duası oxundu', doneSub: 'Allah qəbul etsin. Sabah yeni dəstə.', again: 'Yenidən bax', left: '{n} qalıb' },
  en: { ey: 'Today’s duas', title: '7 duas — card by card', lead: 'Swipe right — read, left — later.', read: 'Read', later: 'Later', done: 'All 7 of today’s duas are read', doneSub: 'May Allah accept. A new deck tomorrow.', again: 'Look again', left: '{n} left' },
  ru: { ey: 'Дуа на сегодня', title: '7 дуа — карточка за карточкой', lead: 'Вправо — прочитано, влево — позже.', read: 'Прочитал', later: 'Позже', done: 'Все 7 дуа на сегодня прочитаны', doneSub: 'Да примет Аллах. Завтра — новая колода.', again: 'Посмотреть снова', left: 'Осталось: {n}' },
  ar: { ey: 'أدعية اليوم', title: '7 أدعية — بطاقة بطاقة', lead: 'اسحب يمينًا — قرأت، ويسارًا — لاحقًا.', read: 'قرأت', later: 'لاحقًا', done: 'قُرئت أدعية اليوم السبعة', doneSub: 'تقبّل الله. مجموعة جديدة غدًا.', again: 'اعرضها مجددًا', left: 'باقٍ {n}' },
  tr: { ey: 'Bugünün duaları', title: '7 dua — kart kart', lead: 'Sağa kaydırın — okudum, sola — sonra.', read: 'Okudum', later: 'Sonra', done: 'Bugünün 7 duası okundu', doneSub: 'Allah kabul etsin. Yarın yeni deste.', again: 'Tekrar bak', left: '{n} kaldı' },
}
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }

/** Günün 7 duası (indekslər) — gün nömrəsinə görə sabit addımla seçilir */
export function pickDaily(len, date = new Date(), n = N) {
  if (!len) return []
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
  const step = 37 % len || 1
  const out = []
  for (let i = 0; out.length < Math.min(n, len) && i < len * 2; i++) {
    const k = (day * 11 + i * step) % len
    if (!out.includes(k)) out.push(k)
  }
  return out
}

function load(ids) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && s.date === todayKey() && Array.isArray(s.order) && s.order.every(i => ids.includes(i))) return s
  } catch { /* */ }
  return { date: todayKey(), order: ids, read: [] }
}

export default function DuaDeck({ duas = [], lang = 'az' }) {
  const t = pickUi(T, lang)
  const ids = useMemo(() => pickDaily(duas.length), [duas.length])
  const [st, setSt] = useState(() => (typeof window === 'undefined' ? { date: '', order: ids, read: [] } : load(ids)))
  const [drag, setDrag] = useState(0)
  const [fly, setFly] = useState(null)   // 'r' | 'l'
  const start = useRef(null)
  const rtl = lang === 'ar'

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* */ } }, [st])

  const queue = st.order.filter(i => !st.read.includes(i))
  const cur = queue[0]
  const d = cur != null ? duas[cur] : null
  const finished = queue.length === 0

  const act = (dir) => {
    if (cur == null || fly) return
    setFly(dir)
    setTimeout(() => {
      setFly(null); setDrag(0)
      setSt(s => {
        if (dir === 'r') {
          const read = [...s.read, cur]
          if (read.length === s.order.length) setTimeout(() => celebrate({ size: 'big' }), 50)
          return { ...s, read }
        }
        return { ...s, order: [...s.order.filter(i => i !== cur), cur] }
      })
    }, 260)
  }
  const onDown = (e) => { if (fly) return; start.current = e.clientX; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const onMove = (e) => { if (start.current != null) setDrag(e.clientX - start.current) }
  const onUp = () => {
    if (start.current == null) return
    start.current = null
    const forward = rtl ? drag < 0 : drag > 0
    if (Math.abs(drag) > 90) act(forward ? 'r' : 'l'); else setDrag(0)
  }
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); act((e.key === 'ArrowRight') !== rtl ? 'r' : 'l') }
  }

  const tx = fly ? ((fly === 'r') !== rtl ? 1 : -1) * 520 : drag
  const tr = (o) => (typeof o === 'string' ? o : o?.[lang] || o?.en || '')

  return (
    <section className="dd" aria-labelledby="dd-h" data-testid="dua-deck">
      <div className="dd__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="dd-h" className="ui-title dd__title">{t.title}</h2>
        <p className="dd__lead">{finished ? '' : t.lead} <span className="ui-num dd__left">{st.read.length} / {st.order.length}</span></p>
      </div>
      {finished ? (
        <div className="ui-card dd__done" data-testid="dd-done">
          <span className="dd__done-ic"><Icon name="check" size={30} /></span>
          <h3>{t.done}</h3>
          <p>{t.doneSub}</p>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setSt({ date: todayKey(), order: ids, read: [] })}>{t.again}</button>
        </div>
      ) : (
        <div className="dd__stack" tabIndex={0} onKeyDown={onKey} aria-roledescription="deck">
          {queue.slice(1, 3).reverse().map((i, k) => <div key={i} className={`ui-card dd__card dd__card--under dd__card--u${2 - k}`} aria-hidden="true" />)}
          {d && (
            <article key={cur} className={`ui-card dd__card${fly ? ' is-fly' : ''}`} data-testid="dd-card"
              style={{ transform: `translate3d(${tx}px,0,0) rotate(${tx / 22}deg)`, transition: start.current != null ? 'none' : undefined }}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
              <span className={`dd__stamp dd__stamp--r${drag > 40 !== rtl && Math.abs(drag) > 40 ? ' is-on' : ''}`}>{t.read}</span>
              <span className={`dd__stamp dd__stamp--l${drag < -40 !== rtl && Math.abs(drag) > 40 ? ' is-on' : ''}`}>{t.later}</span>
              <p className="dd__ar" lang="ar" dir="rtl">{d.ar}</p>
              {d.translit && lang !== 'ar' && <p className="dd__tl">{d.translit}</p>}
              {lang !== 'ar' && <p className="dd__tr">{tr(d[lang] ? d[lang] : d.en)}</p>}
              {d.source && <small className="dd__src">{localizeSource(d.source, lang)}</small>}
            </article>
          )}
          <div className="dd__btns">
            <button type="button" className="dd__btn dd__btn--l" onClick={() => act('l')} aria-label={t.later}><Icon name="refresh" size={20} /><span>{t.later}</span></button>
            <button type="button" className="dd__btn dd__btn--r" onClick={() => act('r')} aria-label={t.read} data-testid="dd-read"><Icon name="check" size={22} /><span>{t.read}</span></button>
          </div>
        </div>
      )}
    </section>
  )
}
