// ═══════════════════════════════════════════════════════
// WuduOrder (v6.3) — "Dəstəmazı sıraya düz" (/kids → Dəstəmaz)
//
//   <WuduOrder lang="az" />
//
// • Addımlar və şəkillər saytın öz dəstəmaz bələdçisindəndir (data/prayerGuide.js WUDU +
//   components/prayer/WuduPose) — Peyğəmbərin ﷺ dəstəmazı: Buxari 159 (Osmanın təsviri) və s.
// • Qarışıq kartlardan növbəti addımı seçirsən: düzgündürsə — yuxarıdakı yola "axır", səhvdirsə
//   titrəyir. Sonda ulduzlar (səhv sayına görə) və mənbələr.
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import Icon from './Icon'
import WuduPose from './prayer/WuduPose'
import { pickUi } from '../utils/uiText'
import { haptic } from '../hooks/useHaptic'
import { WUDU, refText, refUrl } from '../data/prayerGuide'
import '../styles/PrayerGuidePage.css'
import '../styles/WuduOrder.css'

const T = {
  az: { hint: 'Növbəti addım hansıdır? Kartı seç.', step: 'Addım', wrong: 'Bu hələ deyil — bir də fikirləş!', done: 'Afərin! Dəstəmazı düz sıraladın', again: 'Yenidən oyna', mistakes: 'Səhv', src: 'Mənbələr' },
  en: { hint: 'Which step comes next? Pick a card.', step: 'Step', wrong: 'Not yet — think again!', done: 'Well done! You put the wudu in order', again: 'Play again', mistakes: 'Mistakes', src: 'Sources' },
  ru: { hint: 'Какой шаг следующий? Выбери карточку.', step: 'Шаг', wrong: 'Ещё не этот — подумай ещё!', done: 'Молодец! Ты расставил омовение по порядку', again: 'Играть ещё', mistakes: 'Ошибки', src: 'Источники' },
  ar: { hint: 'ما الخطوة التالية؟ اختر بطاقة.', step: 'الخطوة', wrong: 'ليس بعد — فكّر مرة أخرى!', done: 'أحسنت! رتّبت الوضوء ترتيبًا صحيحًا', again: 'العب مجددًا', mistakes: 'الأخطاء', src: 'المصادر' },
  tr: { hint: 'Sıradaki adım hangisi? Bir kart seç.', step: 'Adım', wrong: 'Henüz bu değil — bir daha düşün!', done: 'Aferin! Abdesti doğru sıraladın', again: 'Tekrar oyna', mistakes: 'Hata', src: 'Kaynaklar' },
}
function shuffled(n, seed) {
  const a = Array.from({ length: n }, (_, i) => i)
  let x = seed >>> 0
  const r = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296 }
  for (let tries = 0; tries < 10; tries++) {
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    if (a.some((v, i) => v !== i)) break
  }
  return a
}

export default function WuduOrder({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const [seed, setSeed] = useState(() => (Date.now() % 9973) + 1)
  const order = useMemo(() => shuffled(WUDU.length, seed), [seed])
  const [placed, setPlaced] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [shake, setShake] = useState(null)
  const [msg, setMsg] = useState('')
  const finished = placed >= WUDU.length
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
  const refs = useMemo(() => {
    const seen = new Map()
    for (const s of WUDU) for (const r of s.refs || []) seen.set(`${r.c}${r.n}`, r)
    return [...seen.values()]
  }, [])

  const pick = (i) => {
    if (finished || i < placed) return
    if (i === placed) { setPlaced(placed + 1); setMsg(''); haptic?.(10) }
    else { setMistakes(m => m + 1); setShake(s => ({ i, n: (s?.n || 0) + 1 })); setMsg(t.wrong); haptic?.(30) }
  }
  const reset = () => { setSeed(s => s + 11); setPlaced(0); setMistakes(0); setMsg(''); setShake(null) }

  return (
    <div className="wdo" data-testid="wudu-order">
      <ol className="wdo__path" aria-label={t.step}>
        {WUDU.map((s, i) => (
          <li key={s.id} className={i < placed ? 'is-in' : i === placed ? 'is-next' : ''}>
            <span className="wdo__n ui-num">{i + 1}</span>
            {i < placed ? <span className="wdo__done">{pickUi(s.name, lang)}</span> : <span className="wdo__slot" aria-hidden="true" />}
          </li>
        ))}
      </ol>
      {!finished ? (
        <>
          <p className="wdo__hint">{t.hint} <span className="ui-num">{t.mistakes}: <b data-testid="wdo-mistakes">{mistakes}</b></span></p>
          <div className="wdo__cards" role="group" aria-label={t.hint}>
            {order.map(i => {
              const s = WUDU[i]
              return (
                <button key={s.id} type="button" className={`wdo__card${i < placed ? ' is-used' : ''}${shake?.i === i ? ` is-shake s${shake.n % 2}` : ''}`}
                  disabled={i < placed} onClick={() => pick(i)} data-testid="wdo-card" data-step={i}>
                  <WuduPose pose={s.pose} className="wdo__pose" />
                  <span className="wdo__name">{pickUi(s.name, lang)}</span>
                </button>
              )
            })}
          </div>
          <p className="wdo__msg" role="status" aria-live="polite">{msg}</p>
        </>
      ) : (
        <div className="wdo__win" role="status" data-testid="wdo-done">
          <span className="wdo__stars" aria-label={`${stars}/3`}>{[0, 1, 2].map(k => <Icon key={k} name="star" size={30} className={k < stars ? 'is-on' : ''} />)}</span>
          <b>{t.done}</b>
          <span className="ui-num">{t.mistakes}: {mistakes}</span>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={reset}><Icon name="refresh" className="ui-btn__icon" /> {t.again}</button>
        </div>
      )}
      <p className="wdo__src"><span>{t.src}:</span> {refs.map((r, k) => {
        const u = refUrl(r)
        return u ? <a key={k} href={u} target="_blank" rel="noopener noreferrer">{refText(r, lang)}</a> : <span key={k}>{refText(r, lang)}</span>
      })}</p>
    </div>
  )
}
