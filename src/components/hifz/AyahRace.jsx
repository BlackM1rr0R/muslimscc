// ═══════════════════════════════════════════════════════
// AyahRace — "Ayə yarışı" (/hifz) — ayə tapmacasının sürət rejimi
//
// • Qısa surələrdən (Cüz Əmmə və Fatihə) ayə gəlir, sözləri qarışıqdır; vaxta qarşı sırası ilə
//   toxunub düzürsən. Hər səviyyədə ayə uzanır, vaxt sıxılır; səhv söz −2 san.
// • Mətn hifz səhifəsi ilə eyni mənbədən (alquran.cloud, ar.alafasy) — dəyişdirilmir.
// • Rekord yalnız bu cihazda (localStorage). Danışığı tanıma YOXDUR — yalnız toxunuş.
// • Hərəkət azaldılıbsa — vaxt zolağı animasiyasız; oyun eynidir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { haptic } from '../../hooks/useHaptic'
import { splitAyahWords } from '../../utils/hifzSrs'
import { displayAyah } from '../../utils/quranText'
import { getSurahLocal } from '../../data/surahNamesAz'
import { pickAyah, timeFor, levelScore, shuffleIdx, PENALTY_S } from '../../utils/ayahRace'
import '../../styles/AyahRace.css'

const SURAHS = [1, 97, 103, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 99, 100, 101, 102]
const BEST_KEY = 'muslim_cc_ayah_race_best'

const T = {
  az: { ey: 'Sürət rejimi', title: 'Ayə yarışı', lead: 'Qarışıq sözləri vaxt bitməmiş ayədəki sırası ilə düz. Hər səviyyədə ayə uzanır, vaxt azalır. Səhv söz 2 saniyə aparır.', start: 'Başla', again: 'Yenidən oyna', level: 'Səviyyə', score: 'Xal', best: 'Rekord', time: 'Vaxt', over: 'Vaxt bitdi!', newBest: 'Yeni rekord!', loading: 'Ayələr yüklənir…', err: 'Ayələri yükləmək alınmadı — internet bağlantısını yoxlayın.', retry: 'Yenidən', next: 'Növbəti səviyyə', done: 'Afərin!', note: 'Rekord yalnız bu cihazda saxlanır.', from: (s, a) => `${s}, ${a}-ci ayə` },
  en: { ey: 'Speed mode', title: 'Ayah race', lead: 'Put the shuffled words in their order in the ayah before time runs out. Each level the ayah gets longer and time shorter. A wrong word costs 2 seconds.', start: 'Start', again: 'Play again', level: 'Level', score: 'Score', best: 'Best', time: 'Time', over: 'Time’s up!', newBest: 'New record!', loading: 'Loading ayahs…', err: 'Couldn’t load the ayahs — check your connection.', retry: 'Retry', next: 'Next level', done: 'Well done!', note: 'Your record is stored on this device only.', from: (s, a) => `${s}, ayah ${a}` },
  ru: { ey: 'Режим скорости', title: 'Гонка аятов', lead: 'Расставьте перемешанные слова в порядке аята, пока не кончилось время. С каждым уровнем аят длиннее, а времени меньше. Ошибка отнимает 2 секунды.', start: 'Начать', again: 'Играть снова', level: 'Уровень', score: 'Очки', best: 'Рекорд', time: 'Время', over: 'Время вышло!', newBest: 'Новый рекорд!', loading: 'Загрузка аятов…', err: 'Не удалось загрузить аяты — проверьте подключение.', retry: 'Повторить', next: 'Следующий уровень', done: 'Молодец!', note: 'Рекорд хранится только на этом устройстве.', from: (s, a) => `${s}, аят ${a}` },
  tr: { ey: 'Hız modu', title: 'Âyet yarışı', lead: 'Karışık kelimeleri süre bitmeden âyetteki sırasıyla diz. Her seviyede âyet uzar, süre kısalır. Yanlış kelime 2 saniye götürür.', start: 'Başla', again: 'Tekrar oyna', level: 'Seviye', score: 'Puan', best: 'Rekor', time: 'Süre', over: 'Süre doldu!', newBest: 'Yeni rekor!', loading: 'Âyetler yükleniyor…', err: 'Âyetler yüklenemedi — bağlantınızı kontrol edin.', retry: 'Tekrar', next: 'Sonraki seviye', done: 'Aferin!', note: 'Rekor yalnızca bu cihazda saklanır.', from: (s, a) => `${s}, ${a}. âyet` },
  ar: { ey: 'وضع السرعة', title: 'سباق الآيات', lead: 'رتّب الكلمات المبعثرة بترتيبها في الآية قبل انتهاء الوقت. في كل مستوى تطول الآية ويقصر الوقت. الكلمة الخاطئة تنقص ثانيتين.', start: 'ابدأ', again: 'العب مجددًا', level: 'المستوى', score: 'النقاط', best: 'الأفضل', time: 'الوقت', over: 'انتهى الوقت!', newBest: 'رقم قياسي جديد!', loading: 'جارٍ تحميل الآيات…', err: 'تعذّر تحميل الآيات — تحقّق من الاتصال.', retry: 'أعد المحاولة', next: 'المستوى التالي', done: 'أحسنت!', note: 'يُحفظ رقمك القياسي على هذا الجهاز فقط.', from: (s, a) => `${s}، الآية ${a}` },
}

const cache = new Map()
function loadSurah(s) {
  if (cache.has(s)) return cache.get(s)
  const p = fetch(`https://api.alquran.cloud/v1/surah/${s}/editions/ar.alafasy`)
    .then((r) => { if (!r.ok) throw new Error('http'); return r.json() })
    .then((d) => {
      const ed = Array.isArray(d?.data) ? d.data[0] : null
      if (!Array.isArray(ed?.ayahs)) throw new Error('bad')
      return ed.ayahs.map((v, i) => ({ key: `${s}:${v.numberInSurah}`, s, a: v.numberInSurah, words: splitAyahWords(displayAyah(v.text, s, i)) }))
        .filter((x) => x.words.length >= 2)
    })
  cache.set(s, p)
  p.catch(() => cache.delete(s))
  return p
}
const readBest = () => { try { return Math.max(0, Number(localStorage.getItem(BEST_KEY)) || 0) } catch { return 0 } }

export default function AyahRace({ lang = 'az' }) {
  const t = pickUi(T, lang, 'en')
  const [pool, setPool] = useState(null)
  const [err, setErr] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [st, setSt] = useState({ phase: 'ready', level: 1, score: 0, item: null, order: [], placed: 0, left: 0, total: 1, shake: -1 })
  const [best, setBest] = useState(readBest)
  const [isNewBest, setIsNewBest] = useState(false)
  const seen = useRef(new Set())

  useEffect(() => {
    let live = true
    setErr(false)
    Promise.allSettled(SURAHS.map(loadSurah)).then((rs) => {
      if (!live) return
      const all = rs.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      if (all.length) setPool(all); else setErr(true)
    })
    return () => { live = false }
  }, [attempt])

  const startLevel = useCallback((level, score) => {
    const item = pickAyah(pool || [], level, seen.current)
    if (!item) return
    seen.current.add(item.key)
    const total = timeFor(item.words.length, level)
    setSt({ phase: 'playing', level, score, item, order: shuffleIdx(item.words.length, Date.now() % 9973 + level), placed: 0, left: total, total, shake: -1 })
  }, [pool])

  // Saniyəölçən (100 ms): yalnız oyun gedəndə
  useEffect(() => {
    if (st.phase !== 'playing') return undefined
    const id = setInterval(() => setSt((s) => {
      if (s.phase !== 'playing') return s
      const left = Math.max(0, s.left - 0.1)
      return left <= 0 ? { ...s, left: 0, phase: 'over' } : { ...s, left }
    }), 100)
    return () => clearInterval(id)
  }, [st.phase])

  // Oyun bitəndə rekord
  useEffect(() => {
    if (st.phase !== 'over') return
    if (st.score > best) {
      setBest(st.score); setIsNewBest(true)
      try { localStorage.setItem(BEST_KEY, String(st.score)) } catch { /* yaddaş bağlıdır */ }
    }
  }, [st.phase, st.score, best])

  const tap = (wordIdx) => {
    if (st.phase !== 'playing') return
    const w = st.item.words
    if (w[wordIdx] === w[st.placed]) {
      const placed = st.placed + 1
      if (placed >= w.length) {
        haptic(12)
        setSt((s) => ({ ...s, placed, phase: 'cleared', score: s.score + levelScore(w.length, s.left) }))
      } else setSt((s) => ({ ...s, placed, shake: -1 }))
    } else {
      haptic([20, 40, 20])
      setSt((s) => ({ ...s, left: Math.max(0, s.left - PENALTY_S), shake: wordIdx }))
    }
  }
  const restart = () => { seen.current = new Set(); setIsNewBest(false); startLevel(1, 0) }

  // Hansı sözlər artıq düzülüb: sırada ilk "placed" qədər eyni mətnli sözlər istifadə olunub
  const usedIdx = useMemo(() => {
    if (!st.item) return new Set()
    const w = st.item.words, need = new Map()
    for (let i = 0; i < st.placed; i++) need.set(w[i], (need.get(w[i]) || 0) + 1)
    const used = new Set()
    for (const i of st.order) { const n = need.get(w[i]) || 0; if (n > 0) { used.add(i); need.set(w[i], n - 1) } }
    return used
  }, [st.item, st.placed, st.order])

  const surahName = (s) => (lang === 'ar' ? String(s) : getSurahLocal(s, lang)?.name || String(s))
  const pct = st.total ? Math.max(0, Math.min(100, (st.left / st.total) * 100)) : 0

  return (
    <section className="ui-section ui-section--tight ar-race" aria-labelledby="ar-race-h" data-testid="ayah-race" data-phase={st.phase} data-level={st.level} data-score={st.score} data-next={st.item && st.phase === 'playing' ? st.item.words[st.placed] : undefined}>
      <div className="ui-container">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="ar-race-h" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="ar-race__lead">{t.lead}</p>

        <div className="ar-race__card ui-card">
          <div className="ar-race__stats">
            <span>{t.level} <b className="ui-num">{st.level}</b></span>
            <span>{t.score} <b className="ui-num" data-testid="ar-score">{st.score}</b></span>
            <span>{t.best} <b className="ui-num">{best}</b></span>
          </div>

          {!pool && !err && <p className="ar-race__msg" role="status">{t.loading}</p>}
          {err && <p className="ar-race__msg" role="alert">{t.err} <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setAttempt((a) => a + 1)}>{t.retry}</button></p>}

          {pool && st.phase === 'ready' && (
            <button type="button" className="ui-btn ui-btn--primary ar-race__go" onClick={restart} data-testid="ar-start"><Icon name="play" className="ui-btn__icon" /> {t.start}</button>
          )}

          {st.item && st.phase !== 'ready' && (
            <>
              <div className="ar-race__bar" role="progressbar" aria-label={t.time} aria-valuemin={0} aria-valuemax={st.total} aria-valuenow={Math.round(st.left)}>
                <span style={{ transform: `scaleX(${pct / 100})` }} className={pct < 25 ? 'is-low' : ''} />
              </div>
              <p className="ar-race__from">{t.from(surahName(st.item.s), st.item.a)}</p>
              <p className="ar-race__line" lang="ar" dir="rtl" aria-live="polite">
                {st.item.words.slice(0, st.placed).map((w, i) => <span key={i} className="ar-race__placed">{w}</span>)}
                {st.placed < st.item.words.length && <span className="ar-race__slot" aria-hidden="true">…</span>}
              </p>
              {st.phase === 'playing' && (
                <div className="ar-race__pool" lang="ar" dir="rtl">
                  {st.order.map((i) => (
                    <button key={i} type="button" className={`ar-race__w${usedIdx.has(i) ? ' is-used' : ''}${st.shake === i ? ' is-shake' : ''}`}
                      disabled={usedIdx.has(i)} onClick={() => tap(i)} data-word-idx={i}>{st.item.words[i]}</button>
                  ))}
                </div>
              )}
              {st.phase === 'cleared' && (
                <div className="ar-race__end" role="status">
                  <b>{t.done}</b>
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => startLevel(st.level + 1, st.score)} data-testid="ar-next">{t.next} <Icon name="arrow" className="ui-btn__icon ui-flip-rtl" /></button>
                </div>
              )}
              {st.phase === 'over' && (
                <div className="ar-race__end" role="status">
                  <b>{t.over}</b>{isNewBest && <span className="ar-race__best">{t.newBest}</span>}
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={restart}>{t.again}</button>
                </div>
              )}
            </>
          )}
          <p className="ar-race__note">{t.note}</p>
        </div>
      </div>
    </section>
  )
}
