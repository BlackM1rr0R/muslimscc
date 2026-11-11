// ═══════════════════════════════════════════════════════
// AyahPuzzle (v6.2) — "Tapmaca" görünüşü (/hifz → məşq kartı)
//
//   <AyahPuzzle words={[…]} ayah={5} lang="az" onDone={({ mistakes, grade }) => …} />
//
// • Ayənin sözləri qarışıq verilir; istifadəçi onları sırası ilə toxunaraq düzür.
//   Uzun ayə ≤ 8 sözlük hissələrə bölünür (utils/ayahPuzzle.js — saf, testli).
// • Düz söz yerinə "uçur", səhv söz titrəyir (və telefon qısa titrəyir), səhvlər sayılır.
// • Sonda qiymət TƏKLİF olunur — qiyməti istifadəçi özü verir (mövcud hifz təkrar sistemi).
// • Danışığı tanıma YOXDUR (sayt sahibinin qərarı) — yalnız toxunuş.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { haptic } from '../../hooks/useHaptic'
import { puzzleRounds, shuffledRound, fitsNext, suggestGrade } from '../../utils/ayahPuzzle'
import '../../styles/AyahPuzzle.css'


const T = {
  az: { hint: 'Sözlərə ayədəki sırası ilə toxunun.', part: (a, b) => `Hissə ${a} / ${b}`, mistakes: 'Səhv', done: 'Ayə tamamdır!', again: 'Yenidən qarışdır', suggest: 'Tövsiyə olunan qiymət aşağıda işarələnib.', wrong: 'Bu söz deyil — yenidən cəhd edin', placed: 'Düzülən sözlər' },
  en: { hint: 'Tap the words in the order they come in the ayah.', part: (a, b) => `Part ${a} of ${b}`, mistakes: 'Mistakes', done: 'The ayah is complete!', again: 'Shuffle again', suggest: 'The suggested grade is marked below.', wrong: 'Not this word — try again', placed: 'Words placed' },
  ru: { hint: 'Нажимайте на слова в том порядке, в каком они идут в аяте.', part: (a, b) => `Часть ${a} из ${b}`, mistakes: 'Ошибки', done: 'Аят собран!', again: 'Перемешать заново', suggest: 'Рекомендуемая оценка отмечена ниже.', wrong: 'Не это слово — попробуйте ещё', placed: 'Собранные слова' },
  ar: { hint: 'المس الكلمات بترتيبها في الآية.', part: (a, b) => `الجزء ${a} من ${b}`, mistakes: 'الأخطاء', done: 'اكتملت الآية!', again: 'أعد الخلط', suggest: 'التقييم المقترح معلَّم في الأسفل.', wrong: 'ليست هذه الكلمة — حاول مجددًا', placed: 'الكلمات المرتّبة' },
  tr: { hint: 'Kelimelere âyetteki sırasıyla dokunun.', part: (a, b) => `Bölüm ${a} / ${b}`, mistakes: 'Hata', done: 'Âyet tamam!', again: 'Yeniden karıştır', suggest: 'Önerilen not aşağıda işaretlendi.', wrong: 'Bu kelime değil — tekrar deneyin', placed: 'Dizilen kelimeler' },
}

export default function AyahPuzzle({ words, ayah, lang = 'az', onDone }) {
  const t = pickUi(T, lang)
  const rounds = useMemo(() => puzzleRounds(words, 8), [words])
  const [seed, setSeed] = useState(() => (Date.now() % 9973) + 1)
  const [round, setRound] = useState(0)
  const [placed, setPlaced] = useState(0)        // ümumi düzülmüş söz sayı (bütün ayə üzrə)
  const [used, setUsed] = useState(() => new Set()) // cari raundda istifadə olunmuş indekslər
  const [mistakes, setMistakes] = useState(0)
  const [shake, setShake] = useState(null)        // { i, n }
  const [msg, setMsg] = useState('')
  const r = rounds[round]
  const pool = useMemo(() => (r ? shuffledRound(words, r, seed + round * 31) : []), [words, r, seed, round])
  const finished = rounds.length > 0 && placed >= words.length

  useEffect(() => { setRound(0); setPlaced(0); setUsed(new Set()); setMistakes(0); setMsg('') }, [words, seed])
  useEffect(() => {
    if (finished) onDone?.({ mistakes, grade: suggestGrade(mistakes, words.length) })
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (i) => {
    if (finished || used.has(i)) return
    // Eyni mətnli söz düzgün sayılır — onda o sözün özünü yox, sıradakını "istifadə olunmuş" edirik
    if (fitsNext(words, placed, i)) {
      const nu = new Set(used).add(i)
      setMsg('')
      const np = placed + 1
      setPlaced(np)
      if (np >= r.to && round + 1 < rounds.length) { setRound(round + 1); setUsed(new Set()) } else setUsed(nu)
    } else {
      setMistakes(m => m + 1)
      setShake(s => ({ i, n: (s?.n || 0) + 1 }))
      setMsg(t.wrong)
      haptic?.(30)
    }
  }

  return (
    <div className="apz" data-testid="ayah-puzzle">
      <p className="apz__line ui-arabic" lang="ar" dir="rtl" aria-label={t.placed} data-testid="apz-line">
        {words.slice(0, placed).map((w, i) => <span key={i} className="apz__w is-in">{w}</span>)}
        {!finished && r && Array.from({ length: r.to - placed }, (_, k) => <span key={`s${k}`} className={`apz__slot${k === 0 ? ' is-next' : ''}`} aria-hidden="true" />)}
        {finished && <span className="apz__num ui-num" aria-hidden="true">﴿{ayah}﴾</span>}
      </p>
      {!finished && r && (
        <>
          <div className="apz__meta">
            <span>{t.hint}</span>
            {rounds.length > 1 && <span className="ui-num">{t.part(round + 1, rounds.length)}</span>}
            <span className="apz__mis ui-num">{t.mistakes}: <b data-testid="apz-mistakes">{mistakes}</b></span>
          </div>
          <div className="apz__pool" dir="rtl" role="group" aria-label={t.hint}>
            {pool.map(i => (
              <button key={`${round}-${i}`} type="button" lang="ar" className={`apz__chip ui-arabic${used.has(i) ? ' is-used' : ''}${shake?.i === i ? ` is-shake s${shake.n % 2}` : ''}`}
                disabled={used.has(i)} onClick={() => tap(i)} data-testid="apz-chip" data-w={i}>{words[i]}</button>
            ))}
          </div>
          <p className="apz__msg" role="status" aria-live="polite">{msg}</p>
        </>
      )}
      {finished && (
        <div className="apz__done" role="status" data-testid="apz-done">
          <b><Icon name="check" size={18} /> {t.done}</b>
          <span className="ui-num">{t.mistakes}: {mistakes}</span>
          <span>{t.suggest}</span>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setSeed(s => s + 7)}><Icon name="refresh" className="ui-btn__icon" /> {t.again}</button>
        </div>
      )}
    </div>
  )
}
