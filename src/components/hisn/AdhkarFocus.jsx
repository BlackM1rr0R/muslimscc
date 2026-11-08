// ═══════════════════════════════════════════════════════
// AdhkarFocus (v5.6) — səhər / axşam azkarı TAM EKRAN rejimi
// (/hisnul-muslim → "Başla" düyməsi və ya /hisnul-muslim#adhkar — səhər/axşam
// bildirişi də buraya açır)
//
//   <AdhkarFocus items={chapter.items} part="morning" lang="az" isAr={false} onClose={…} />
//
// • Məzmun Hisnul-Müslimin "Səhər və axşam zikrləri" fəslidir (public/data/
//   hisn/<dil>.json, id 28) — mətn, tərcümə, təkrar sayı və mənbə dəyişmədən.
// • Hər zikr ayrıca ekranda: iri ərəb mətni, tərcümə, mənbə (açılır).
//   Sayğac — iri dairə: hər toxunuşda halqa dolur, telefon titrəyir; say
//   bitəndə növbəti zikrə özü keçir. Sürüşdürmə (barmaq), ← →, Esc.
// • Yuxarıda ümumi irəliləyiş; sonda ulduz partlayışı və dua.
// • İrəliləyiş bu gün üçün yadda qalır (səhər və axşam ayrı) — localStorage.
// Stillər: src/styles/AdhkarFocus.css
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'
import { celebrate } from '../../utils/celebrate'
import { pickUi } from '../../utils/uiText'
import { loadAdhkar as load, saveAdhkar as save, todayKey as today } from './adhkarState'
import '../../styles/AdhkarFocus.css'

const TXT = {
  az: { morning: 'Səhər azkarı', evening: 'Axşam azkarı', close: 'Bağla', prev: 'Əvvəlki', next: 'Növbəti', tap: 'Toxunun', leftW: 'qaldı', once: 'Bir dəfə', source: 'Mənbə', of: (a, b) => `${a} / ${b}`, done: 'Allah qəbul etsin!', doneLead: 'Bu günün azkarını tamamladınız.', again: 'Yenidən başla', finish: 'Bitir', next2: 'Növbəti zikr', reset: 'Sıfırla' },
  en: { morning: 'Morning adhkar', evening: 'Evening adhkar', close: 'Close', prev: 'Previous', next: 'Next', tap: 'Tap', leftW: 'left', once: 'Once', source: 'Source', of: (a, b) => `${a} / ${b}`, done: 'May Allah accept it!', doneLead: 'You have completed today’s adhkar.', again: 'Start again', finish: 'Finish', next2: 'Next dhikr', reset: 'Reset' },
  ru: { morning: 'Утренние зикры', evening: 'Вечерние зикры', close: 'Закрыть', prev: 'Назад', next: 'Далее', tap: 'Нажмите', leftW: 'осталось', once: 'Один раз', source: 'Источник', of: (a, b) => `${a} / ${b}`, done: 'Да примет Аллах!', doneLead: 'Вы завершили сегодняшние зикры.', again: 'Начать заново', finish: 'Завершить', next2: 'Следующий зикр', reset: 'Сбросить' },
  ar: { morning: 'أذكار الصباح', evening: 'أذكار المساء', close: 'إغلاق', prev: 'السابق', next: 'التالي', tap: 'اضغط', leftW: 'باقٍ', once: 'مرة واحدة', source: 'المصدر', of: (a, b) => `${a} / ${b}`, done: 'تقبّل الله!', doneLead: 'أتممت أذكار اليوم.', again: 'ابدأ من جديد', finish: 'إنهاء', next2: 'الذكر التالي', reset: 'إعادة' },
  tr: { morning: 'Sabah zikirleri', evening: 'Akşam zikirleri', close: 'Kapat', prev: 'Önceki', next: 'Sonraki', tap: 'Dokunun', leftW: 'kaldı', once: 'Bir kez', source: 'Kaynak', of: (a, b) => `${a} / ${b}`, done: 'Allah kabul etsin!', doneLead: 'Bugünün zikirlerini tamamladınız.', again: 'Yeniden başla', finish: 'Bitir', next2: 'Sonraki zikir', reset: 'Sıfırla' },
}

const vibrate = (p) => { try { navigator.vibrate?.(p) } catch { /* */ } }

export default function AdhkarFocus({ items = [], part = 'morning', lang = 'az', isAr = false, onClose }) {
  const t = pickUi(TXT, lang, 'en')
  const n = items.length
  const need = (i) => Math.max(1, items[i]?.repeat || 1)
  const [st, setSt] = useState(() => load(part, n))
  const [dir, setDir] = useState(1)
  const [srcOpen, setSrcOpen] = useState(false)
  const rootRef = useRef(null)
  const touch = useRef(null)
  const [finished, setFinished] = useState(false)
  const idx = Math.min(st.idx, n - 1)
  const it = items[idx]
  const cnt = st.counts[idx] || 0
  const total = need(idx)
  const doneN = st.counts.filter((c, i) => c >= need(i)).length

  useEffect(() => { save(part, st) }, [part, st])
  // Fokus, fon sürüşməsini kilidlə
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    rootRef.current?.focus()
    return () => { document.body.style.overflow = prev }
  }, [])

  const goTo = useCallback((i, d) => {
    if (i < 0 || i >= n) return
    setDir(d)
    setSrcOpen(false)
    setSt(s => ({ ...s, idx: i }))
  }, [n])

  const tap = () => {
    if (cnt >= total) { if (idx < n - 1) goTo(idx + 1, 1); return }
    const next = cnt + 1
    const counts = st.counts.slice(); counts[idx] = next
    const nextSt = { ...st, counts }
    if (next >= total) {
      const finishedAll = counts.every((c, i) => c >= need(i))
      if (finishedAll) {
        setSt(nextSt)
        setTimeout(() => { setFinished(true); celebrate({ size: 'big' }) }, 350)
        return
      }
      vibrate([30, 40, 30])
      setSt(nextSt)
      // Bir an "tamam" görünsün, sonra növbəti tamamlanmamış zikrə
      const nextIdx = counts.findIndex((c, i) => i > idx && c < need(i))
      setTimeout(() => goTo(nextIdx === -1 ? Math.min(n - 1, idx + 1) : nextIdx, 1), 420)
    } else {
      vibrate(12)
      setSt(nextSt)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose?.() }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + (document.documentElement.dir === 'rtl' ? -1 : 1), 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(idx + (document.documentElement.dir === 'rtl' ? 1 : -1), -1) }
    else if ((e.key === ' ' || e.key === 'Enter') && e.target === rootRef.current) { e.preventDefault(); tap() }
  }
  const onTouchStart = (e) => { const p = e.touches[0]; touch.current = { x: p.clientX, y: p.clientY } }
  const onTouchEnd = (e) => {
    const s = touch.current; touch.current = null
    if (!s) return
    const p = e.changedTouches[0]
    const dx = p.clientX - s.x, dy = p.clientY - s.y
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    const rtl = document.documentElement.dir === 'rtl'
    const forward = rtl ? dx > 0 : dx < 0
    goTo(idx + (forward ? 1 : -1), forward ? 1 : -1)
  }
  const restart = () => { setFinished(false); setDir(-1); setSt({ date: today(), idx: 0, counts: Array(n).fill(0) }) }

  if (!it) return null
  const R = 54, CIRC = 2 * Math.PI * R
  const frac = Math.min(1, cnt / total)

  // Portal: <main class="page-enter"> transform saxlayır — fixed qat onun
  // içində ekranı yox, səhifəni tuturdu (MosqueTvPage ilə eyni səbəb)
  return createPortal(
    <div className={`adf adf--${part}`} role="dialog" aria-modal="true" aria-label={t[part]} tabIndex={-1} ref={rootRef} onKeyDown={onKey}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="adf-sky" aria-hidden="true" />
      <header className="adf-top">
        <button type="button" className="adf-x" onClick={onClose} aria-label={t.close}><Icon name="close" size={20} /></button>
        <div className="adf-title">
          <b>{t[part]}</b>
          <span className="ui-num">{t.of(Math.min(idx + 1, n), n)}</span>
        </div>
        <div className="adf-bar" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={doneN}>
          {items.map((_, i) => <i key={i} className={`${st.counts[i] >= need(i) ? 'is-done' : ''}${i === idx ? ' is-cur' : ''}`} />)}
        </div>
      </header>

      {finished ? (
        <div className="adf-done">
          <div className="adf-done__ring" aria-hidden="true"><Icon name="check" size={44} /></div>
          <h2>{t.done}</h2>
          <p>{t.doneLead}</p>
          {/* Ayə (Cümə 62:10, son hissə) yalnız ərəbcə orijinalında — alquran.cloud quran-uthmani
              mətni; Quran mətni AI ilə tərcümə olunmur */}
          <p className="adf-done__ayah ui-arabic" lang="ar" dir="rtl">﴿وَٱذْكُرُوا۟ ٱللَّهَ كَثِيرًۭا لَّعَلَّكُمْ تُفْلِحُونَ﴾ <span dir="ltr" className="adf-done__ref">62:10</span></p>
          <div className="adf-done__btns">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" onClick={onClose}>{t.finish}</button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={restart}>{t.again}</button>
          </div>
        </div>
      ) : (
        <>
          <main className="adf-stage">
            <article key={idx} className={`adf-card adf-card--${dir > 0 ? 'next' : 'prev'}`}>
              <p className="adf-ar ui-arabic" lang="ar" dir="rtl">{it.ar}</p>
              {!isAr && it.text && <p className="adf-tr">{it.text}</p>}
              {it.src && (
                <div className="adf-src">
                  <button type="button" className="adf-src__btn" onClick={() => setSrcOpen(o => !o)} aria-expanded={srcOpen}>
                    <Icon name="books" size={14} /> {t.source}
                  </button>
                  {srcOpen && <p className="adf-src__text" dir="auto">{it.src}</p>}
                </div>
              )}
            </article>
          </main>
          <footer className="adf-foot">
            <button type="button" className="adf-nav" onClick={() => goTo(idx - 1, -1)} disabled={idx === 0} aria-label={t.prev}>
              <Icon name="chevronLeft" size={22} className="ui-flip-rtl" />
            </button>
            <button type="button" className={`adf-count${cnt >= total ? ' is-done' : ''}`} onClick={tap}
              aria-label={cnt >= total ? t.next2 : `${t.tap}: ${cnt} / ${total}`}>
              <svg viewBox="0 0 128 128" aria-hidden="true">
                <circle className="adf-count__bg" cx="64" cy="64" r={R} />
                <circle className="adf-count__fg" cx="64" cy="64" r={R} style={{ strokeDasharray: CIRC, strokeDashoffset: CIRC * (1 - frac) }} />
              </svg>
              <span className="adf-count__in">
                {cnt >= total
                  ? <Icon name="check" size={34} />
                  : <><b key={cnt} className="ui-num adf-count__n">{total - cnt}</b><small>{total > 1 ? t.leftW : t.once}</small></>}
              </span>
            </button>
            <button type="button" className="adf-nav" onClick={() => goTo(idx + 1, 1)} disabled={idx === n - 1} aria-label={t.next}>
              <Icon name="chevron" size={22} className="ui-flip-rtl" />
            </button>
          </footer>
        </>
      )}
    </div>,
    document.body,
  )
}
