// ═══════════════════════════════════════════════════════
// YearStory — "Mənim ilim" story formatında (AnalyticsPage → YearReview → "Story kimi bax")
//
//   <YearStory scenes={[{ key, icon, value, label, sub }]} title="Hicri 1448 ilim" lead="…"
//     lang="az" onShare={() => …} onClose={() => …} />
//
// • Tam ekran səhnələr: giriş → hər göstərici bir səhnə → son (paylaş).
// • Yuxarıda irəliləyiş zolaqları (transform: scaleX); hər səhnə ~4.5 s, sonra özü keçir.
// • Sağ yarıya toxunuş / → — növbəti, sol / ← — əvvəlki; basıb saxlamaq — dayandırır;
//   Esc — bağla. Hərəkət azaldılıbsa avtomatik keçid yoxdur (yalnız toxunuşla).
// • Bütün rəqəmlər bu cihazdakı qeydlərdəndir (utils/yearReview). Stillər: src/styles/YearStory.css
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import '../styles/YearStory.css'
import { pickUi } from '../utils/uiText'

const DUR = 4500
const T = {
  az: { close: 'Bağla', next: 'Növbəti', prev: 'Əvvəlki', end: 'Allah qəbul etsin', endSub: 'Əməllərin ən sevimlisi az da olsa davamlı olanıdır (Buxari 6464).', share: 'Paylaş', again: 'Yenidən bax' },
  en: { close: 'Close', next: 'Next', prev: 'Previous', end: 'May Allah accept it', endSub: 'The most beloved deeds are those done consistently, even if small (Bukhari 6464).', share: 'Share', again: 'Watch again' },
  ru: { close: 'Закрыть', next: 'Далее', prev: 'Назад', end: 'Да примет Аллах', endSub: 'Самые любимые дела — постоянные, даже если их мало (Бухари 6464).', share: 'Поделиться', again: 'Смотреть снова' },
  tr: { close: 'Kapat', next: 'Sonraki', prev: 'Önceki', end: 'Allah kabul etsin', endSub: 'Amellerin en sevimlisi az da olsa devamlı olanıdır (Buhari 6464).', share: 'Paylaş', again: 'Tekrar izle' },
  ar: { close: 'إغلاق', next: 'التالي', prev: 'السابق', end: 'تقبّل الله', endSub: 'أحبّ الأعمال إلى الله أدومها وإن قلّ (البخاري ٦٤٦٤).', share: 'مشاركة', again: 'شاهد مجددًا' },
}
const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'))

export default function YearStory({ scenes, title, lead, lang = 'az', onShare, onClose }) {
  const t = pickUi(T, lang)
  const all = [{ key: 'intro', intro: true }, ...scenes, { key: 'end', end: true }]
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const auto = useRef(!reduced())
  const closeRef = useRef(null)
  const n = all.length
  const go = useCallback((d) => setI(x => Math.max(0, Math.min(n - 1, x + d))), [n])

  useEffect(() => {
    if (!auto.current || paused || i >= n - 1) return undefined
    const id = setTimeout(() => go(1), DUR)
    return () => clearTimeout(id)
  }, [i, paused, n, go])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(document.documentElement.dir === 'rtl' ? -1 : 1)
      else if (e.key === 'ArrowLeft') go(document.documentElement.dir === 'rtl' ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose, go])

  const holdT = useRef(0), downAt = useRef(0)
  const onDown = () => { downAt.current = Date.now(); holdT.current = setTimeout(() => setPaused(true), 220) }
  const onUp = (e) => {
    clearTimeout(holdT.current)
    if (paused) { setPaused(false); return }
    if (Date.now() - downAt.current > 400) return
    const r = e.currentTarget.getBoundingClientRect()
    const right = (e.clientX - r.left) > r.width / 3
    const rtl = document.documentElement.dir === 'rtl'
    go(right !== rtl ? 1 : -1)
  }

  const s = all[i]
  return createPortal(
    <div className={`ys ys--${i % 5}${paused ? ' is-paused' : ''}`} role="dialog" aria-modal="true" aria-label={title} data-testid="year-story">
      <div className="ys__bars" aria-hidden="true">
        {all.map((x, k) => (
          <span key={x.key} className="ys__bar">
            <i key={k === i ? `on-${i}` : 'off'} className={k < i ? 'is-done' : k === i && auto.current && i < n - 1 ? 'is-run' : k === i ? 'is-done' : ''}
              style={{ animationDuration: `${DUR}ms` }} />
          </span>
        ))}
      </div>
      <div className="ys__top">
        <span className="ys__brand">muslims.cc</span>
        <button type="button" ref={closeRef} className="ys__close" onClick={onClose} aria-label={t.close}><Icon name="close" size={22} /></button>
      </div>

      <div className="ys__stage" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => clearTimeout(holdT.current)}>
        <div className="ys__scene" key={s.key} aria-live="polite">
          {s.intro && <>
            <span className="ys__orb" aria-hidden="true"><Icon name="moonStar" size={40} /></span>
            <h2 className="ys__title">{title}</h2>
            <p className="ys__sub">{lead}</p>
          </>}
          {!s.intro && !s.end && <>
            <span className="ys__orb" aria-hidden="true"><Icon name={s.icon} size={40} /></span>
            <p className="ys__big ui-num" data-testid="ys-value">{s.value}</p>
            <p className="ys__label">{s.label}</p>
            {s.sub && <p className="ys__sub">{s.sub}</p>}
          </>}
          {s.end && <>
            <span className="ys__orb" aria-hidden="true"><Icon name="sparkle" size={40} /></span>
            <h2 className="ys__title">{t.end}</h2>
            <p className="ys__sub">{t.endSub}</p>
            <div className="ys__actions" onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}>
              {onShare && <button type="button" className="ui-btn ui-btn--inverse" onClick={onShare}><Icon name="share" className="ui-btn__icon" /> {t.share}</button>}
              <button type="button" className="ui-btn ui-btn--inverse-ghost" onClick={() => setI(0)}><Icon name="refresh" className="ui-btn__icon" /> {t.again}</button>
            </div>
          </>}
        </div>
      </div>
      <div className="ys__nav">
        <button type="button" className="ys__navbtn" onClick={() => go(-1)} disabled={i === 0} aria-label={t.prev}><Icon name="chevronLeft" size={22} className="ui-flip-rtl" /></button>
        <span className="ys__count ui-num">{i + 1} / {n}</span>
        <button type="button" className="ys__navbtn" onClick={() => go(1)} disabled={i === n - 1} aria-label={t.next} data-testid="ys-next"><Icon name="chevron" size={22} className="ui-flip-rtl" /></button>
      </div>
    </div>,
    document.body,
  )
}
