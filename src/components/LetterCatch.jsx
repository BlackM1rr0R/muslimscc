// ═══════════════════════════════════════════════════════
// LetterCatch — "Hərf tutma oyunu" (uşaqlar üçün)
//
//   <LetterCatch />            — dil useLang()-dən
//   <LetterCatch lang="en" />
//
// • Yuxarıda ərəbcə söz və mənası; hərflər rəngli fənərlər kimi yuxarıdan
//   düşür. Sözün hərflərinə SIRA İLƏ toxun — tutulan hərflər yuxarıda yığılır,
//   söz tamamlananda hərflərin necə BİTİŞDİYİ göstərilir (tək → bitişik).
// • Səhv hərf → yüngül titrəmə, 1 can (3 can). Səviyyə artdıqca söz uzanır,
//   sürət artır. Düzgün tutulan hərfin səsi kursun səs fayllarından
//   (/audio/arabic/<id>.wav) — "Səs" düyməsi ilə söndürülür.
// • Ekrandan çıxanda və ya vərəq gizlənəndə oyun dayanır. Hərəkət azaldılıbsa —
//   hərflər yavaş düşür, yırğalanmır, konfetti yoxdur.
// • Ən yaxşı xal: localStorage 'muslim_cc_letter_catch_best'.
// • Test: window.__lcSlow — düşmə sürəti minimal (e2e üçün).
// Məntiq: src/utils/letterCatch.js · Stillər: src/styles/LetterCatch.css
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { pickUi } from '../utils/uiText'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { LETTERS } from '../data/arabicCourse'
import { letterAudioUrl, useCourseAudio } from './arabic/useCourseAudio'
import { LIVES, isolatedForm, newGame, step, tap } from '../utils/letterCatch'
import '../styles/LetterCatch.css'

const BEST_KEY = 'muslim_cc_letter_catch_best'
const BY_CH = Object.fromEntries(LETTERS.map(l => [l.ch, l]))

const T = {
  az: { eyebrow: 'Ərəb hərfləri', title: 'Hərf tutma oyunu', lead: 'Yuxarıdakı sözün hərflərini sıra ilə tut: sağdan sola, birincidən başla. Söz tamamlananda hərflərin necə birləşdiyini görəcəksən.',
    start: 'Başla', again: 'Yenidən oyna', resume: 'Davam et', pause: 'Fasilə', paused: 'Oyun dayandırılıb',
    score: 'Xal', level: 'Səviyyə', best: 'Ən yaxşı', lives: n => `Can: ${n}`, sound: 'Səs', meaning: 'Mənası',
    letter: 'Hərf', next: 'İndi tut', hit: 'Düzdür!', wrong: 'Bu hərf deyil, bir də bax', done: 'Afərin! Hərflər birləşdi:',
    over: 'Oyun bitdi', final: n => `Sənin xalın: ${n}`, record: 'Yeni rekord!', levelUp: n => `Səviyyə ${n}! Sözlər uzanır`,
    alone: 'Tək-tək', joined: 'Bitişik', field: 'Düşən hərflər' },
  en: { eyebrow: 'Arabic letters', title: 'Letter catch', lead: 'Catch the letters of the word at the top in order: from right to left, starting with the first. When the word is complete, you will see how the letters join.',
    start: 'Start', again: 'Play again', resume: 'Continue', pause: 'Pause', paused: 'Game paused',
    score: 'Score', level: 'Level', best: 'Best', lives: n => `Lives: ${n}`, sound: 'Sound', meaning: 'Meaning',
    letter: 'Letter', next: 'Catch now', hit: 'Correct!', wrong: 'Not this letter, look again', done: 'Well done! The letters joined:',
    over: 'Game over', final: n => `Your score: ${n}`, record: 'New record!', levelUp: n => `Level ${n}! Words get longer`,
    alone: 'Separate', joined: 'Joined', field: 'Falling letters' },
  ru: { eyebrow: 'Арабские буквы', title: 'Поймай букву', lead: 'Лови буквы слова сверху по порядку: справа налево, начиная с первой. Когда слово соберётся, ты увидишь, как буквы соединяются.',
    start: 'Начать', again: 'Играть снова', resume: 'Продолжить', pause: 'Пауза', paused: 'Игра на паузе',
    score: 'Очки', level: 'Уровень', best: 'Рекорд', lives: n => `Жизни: ${n}`, sound: 'Звук', meaning: 'Значение',
    letter: 'Буква', next: 'Лови', hit: 'Верно!', wrong: 'Не эта буква, посмотри ещё раз', done: 'Молодец! Буквы соединились:',
    over: 'Игра окончена', final: n => `Твои очки: ${n}`, record: 'Новый рекорд!', levelUp: n => `Уровень ${n}! Слова длиннее`,
    alone: 'По отдельности', joined: 'Слитно', field: 'Падающие буквы' },
  ar: { eyebrow: 'الحروف العربية', title: 'التقط الحروف', lead: 'التقط حروف الكلمة التي في الأعلى بالترتيب: من اليمين إلى اليسار، ابدأ بالحرف الأول. وعندما تكتمل الكلمة سترى كيف تتصل الحروف.',
    start: 'ابدأ', again: 'العب مرة أخرى', resume: 'تابع', pause: 'إيقاف مؤقت', paused: 'اللعبة متوقفة',
    score: 'النقاط', level: 'المستوى', best: 'أفضل نتيجة', lives: n => `المحاولات: ${n}`, sound: 'الصوت', meaning: 'المعنى',
    letter: 'حرف', next: 'التقط الآن', hit: 'صحيح!', wrong: 'ليس هذا الحرف، انظر مرة أخرى', done: 'أحسنت! اتصلت الحروف:',
    over: 'انتهت اللعبة', final: n => `نقاطك: ${n}`, record: 'رقم قياسي جديد!', levelUp: n => `المستوى ${n}! الكلمات أطول`,
    alone: 'منفصلة', joined: 'متصلة', field: 'الحروف المتساقطة' },
  tr: { eyebrow: 'Arap harfleri', title: 'Harf yakalama oyunu', lead: 'Üstteki kelimenin harflerini sırayla yakala: sağdan sola, ilk harften başla. Kelime tamamlanınca harflerin nasıl birleştiğini göreceksin.',
    start: 'Başla', again: 'Yeniden oyna', resume: 'Devam et', pause: 'Duraklat', paused: 'Oyun duraklatıldı',
    score: 'Puan', level: 'Seviye', best: 'En iyi', lives: n => `Can: ${n}`, sound: 'Ses', meaning: 'Anlamı',
    letter: 'Harf', next: 'Şimdi yakala', hit: 'Doğru!', wrong: 'Bu harf değil, bir daha bak', done: 'Aferin! Harfler birleşti:',
    over: 'Oyun bitti', final: n => `Puanın: ${n}`, record: 'Yeni rekor!', levelUp: n => `Seviye ${n}! Kelimeler uzuyor`,
    alone: 'Ayrı ayrı', joined: 'Bitişik', field: 'Düşen harfler' },
}

const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 } }
const writeBest = (n) => { try { localStorage.setItem(BEST_KEY, String(n)) } catch { /* gizli rejim */ } }
// Serverdə (prerender) useLayoutEffect xəbərdarlıq verir
const useIsoLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect
const isSlow = () => { try { return !!window.__lcSlow } catch { return false } }

function Heart({ on }) {
  return (
    <svg className={`lc__heart${on ? '' : ' is-off'}`} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 2.9 4.5 6.6 4.5c2.1 0 3.6 1.1 4.4 2.6.8-1.5 2.3-2.6 4.4-2.6 3.7 0 5.7 4 4.2 7.3C19.5 16.4 12 21 12 21z" />
    </svg>
  )
}

export default function LetterCatch({ lang: langProp }) {
  const ctx = useLang()
  const lang = langProp || ctx?.lang || 'az'
  const t = pickUi(T, lang)
  const reduced = useReduced()
  const audio = useCourseAudio()
  const [game, setGame] = useState(() => ({ ...newGame(() => 0), status: 'ready' })) // sabit — SSR/hidrasiya eyni olsun
  const [best, setBest] = useState(0)
  const [record, setRecord] = useState(false)
  const [msg, setMsg] = useState('')
  const [shake, setShake] = useState(0)
  const [sound, setSound] = useState(true)
  const gameRef = useRef(game)
  const rootRef = useRef(null)
  const fieldRef = useRef(null)
  const heightRef = useRef(360)
  const btns = useRef(new Map())
  const audioN = useRef(0)

  useEffect(() => { setBest(readBest()) }, [])

  const commit = useCallback((s) => { gameRef.current = s; setGame(s) }, [])

  // Hərflərin yeri: render-dən sonra və hər kadrda yalnız transform (layout yox)
  const place = useCallback(() => {
    const h = heightRef.current
    for (const it of gameRef.current.items) {
      const el = btns.current.get(it.id)
      if (el) el.style.transform = `translate3d(-50%, ${Math.round(it.y * h)}px, 0)`
    }
  }, [])
  useIsoLayout(place)

  // Meydanın hündürlüyü
  useEffect(() => {
    const el = fieldRef.current
    if (!el) return undefined
    heightRef.current = el.clientHeight || 360
    if (typeof ResizeObserver !== 'function') return undefined
    const ro = new ResizeObserver(([e]) => { heightRef.current = e.contentRect.height || heightRef.current; place() })
    ro.observe(el)
    return () => ro.disconnect()
  }, [place])

  // ── Oyun dövrü ──
  const playing = game.status === 'playing'
  useEffect(() => {
    if (!playing) return undefined
    let raf = 0
    let last = performance.now()
    const frame = (now) => {
      const dt = (now - last) / 1000
      last = now
      const n = step(gameRef.current, dt, { reduced, slow: isSlow() })
      const { changed, ...s } = n
      gameRef.current = s
      if (changed) {
        setGame(s)
        if (s.levelUp) setMsg(t.levelUp(s.level))
      } else place()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [playing, reduced, place, t])

  // ── Ekrandan çıxanda / vərəq gizlənəndə fasilə ──
  const pause = useCallback(() => {
    if (gameRef.current.status === 'playing') commit({ ...gameRef.current, status: 'paused' })
  }, [commit])
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'hidden') pause() }
    document.addEventListener('visibilitychange', onVis)
    const el = rootRef.current
    let io = null
    if (el && typeof IntersectionObserver === 'function') {
      io = new IntersectionObserver(([e]) => { if (e && !e.isIntersecting) pause() }, { threshold: 0.15 })
      io.observe(el)
    }
    return () => { document.removeEventListener('visibilitychange', onVis); io?.disconnect() }
  }, [pause])

  const start = () => {
    setRecord(false)
    setMsg('')
    commit(newGame())
  }
  const resume = () => commit({ ...gameRef.current, status: 'playing' })

  const onTap = (id) => {
    const s = gameRef.current
    const it = s.items.find(x => x.id === id)
    const { state, result } = tap(s, id)
    if (result === 'none') return
    commit(state)
    if (result === 'hit' || result === 'word') {
      const l = BY_CH[it.letter]
      if (sound && l?.audio) audio.play(`lc-${++audioN.current}`, letterAudioUrl(l.audio))
      setMsg(result === 'word' ? `${t.done} ${state.word.plain}` : t.hit)
    } else {
      setShake(k => k + 1)
      setMsg(result === 'over' ? `${t.over}. ${t.final(state.score)}` : t.wrong)
    }
    if (result === 'over' && state.score > best) { setBest(state.score); writeBest(state.score); setRecord(true) }
  }

  const { word, idx, phase, status, items, score, level, lives } = game
  const meaning = lang === 'ar' ? null : pickUi(word.m, lang)
  const nameOf = (ch) => { const l = BY_CH[ch]; return l ? (l.name[lang] || l.name.en) : ch }
  const done = phase === 'done'
  const showWord = status !== 'ready'

  return (
    <section className={`lc${reduced ? ' is-calm' : ''}`} ref={rootRef} data-testid="letter-catch" data-state={status} data-score={score} lang={lang}>
      <p className="lc__eyebrow">{t.eyebrow}</p>
      <h3 className="lc__title">{t.title}</h3>
      <p className="lc__lead">{t.lead}</p>

      <div className="lc__hud">
        <span className="lc__stat"><span className="lc__k">{t.score}</span> <b className="ui-num">{score}</b></span>
        <span className="lc__stat"><span className="lc__k">{t.level}</span> <b className="ui-num">{level}</b></span>
        <span className="lc__stat"><span className="lc__k">{t.best}</span> <b className="ui-num">{best}</b></span>
        <span key={shake} className={`lc__lives${shake ? ' is-hurt' : ''}`} role="img" aria-label={t.lives(lives)}>
          {Array.from({ length: LIVES }, (_, i) => <Heart key={i} on={i < lives} />)}
        </span>
        <span className="lc__tools">
          <button type="button" className={`lc__tool${sound ? ' is-on' : ''}`} aria-pressed={sound} onClick={() => { setSound(v => !v); audio.stop() }}>{t.sound}</button>
          {playing && <button type="button" className="lc__tool" onClick={pause} data-testid="lc-pause">{t.pause}</button>}
        </span>
      </div>

      <div className={`lc__word${done ? ' is-done' : ''}`} data-testid="lc-word" data-word={word.plain} hidden={!showWord}>
        {meaning && <p className="lc__meaning"><span className="lc__k">{t.meaning}:</span> <b>{meaning}</b></p>}
        <ol className="lc__slots" dir="rtl" lang="ar" aria-label={isolatedForm(word)}>
          {word.letters.map((ch, i) => (
            <li key={i} className={`lc__slot${i < idx ? ' is-got' : ''}${i === idx && !done ? ' is-next' : ''}`}>
              <span className="ui-arabic">{ch}</span>
            </li>
          ))}
        </ol>
        {!done && idx < word.letters.length && (
          <p className="lc__next"><span className="lc__k">{t.next}:</span> <b>{nameOf(word.letters[idx])}</b></p>
        )}
        {done && (
          <div className="lc__join" aria-hidden="true">
            <span className="lc__join-row"><span className="lc__k">{t.alone}</span><span className="ui-arabic lc__iso" lang="ar" dir="rtl">{isolatedForm(word)}</span></span>
            <span className="lc__arrow">↓</span>
            <span className="lc__join-row"><span className="lc__k">{t.joined}</span><span className="ui-arabic lc__joined" lang="ar" dir="rtl">{word.voc}</span></span>
            {!reduced && <span className="lc__confetti">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>}
          </div>
        )}
      </div>

      <div className="lc__field" ref={fieldRef} role="group" aria-label={t.field}>
        {(status === 'playing' || status === 'paused') && items.map(it => (
          <button key={it.id} type="button" ref={el => { if (el) btns.current.set(it.id, el); else btns.current.delete(it.id) }}
            className={`lc__drop lc__drop--${it.hue}${it.wrong ? ' is-wrong' : ''}`} style={{ left: `${it.x * 100}%` }}
            data-letter={it.letter} aria-label={`${t.letter} ${nameOf(it.letter)}`} disabled={status !== 'playing' || !!it.wrong}
            onPointerDown={(e) => { if (e.pointerType !== 'mouse') { e.preventDefault(); onTap(it.id) } }}
            onClick={() => onTap(it.id)}>
            <span className="lc__glyph ui-arabic" lang="ar" aria-hidden="true">{it.letter}</span>
          </button>
        ))}
        {status !== 'playing' && (
          <div className="lc__overlay">
            {status === 'over' && <p className="lc__over"><b>{t.over}</b><span>{t.final(score)}</span>{record && <span className="lc__record">{t.record}</span>}</p>}
            {status === 'paused' && <p className="lc__over"><b>{t.paused}</b></p>}
            {status === 'paused'
              ? <button type="button" className="lc__start" onClick={resume} data-testid="lc-resume">{t.resume}</button>
              : <button type="button" className="lc__start" onClick={start} data-testid="lc-start">{status === 'over' ? t.again : t.start}</button>}
          </div>
        )}
      </div>
      <p className="lc__sr" role="status" aria-live="polite">{msg}</p>
    </section>
  )
}

