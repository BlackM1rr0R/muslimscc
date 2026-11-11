// ═══════════════════════════════════════════════════════
// ReciterCompare (v6.2) — "Qiraətçiləri müqayisə" (/quran)
//
//   <ReciterCompare lang="az" surahName={n => …} />
//
// • Eyni ayə 5 qarinin səsində: hər qari bir zolaq — səs dalğası + söz-söz bölgü.
//   Zaman ərəb yazısı kimi SAĞDAN SOLA axır; bütün zolaqlar eyni miqyasdadır —
//   kim hansı sözü nə qədər uzadır, gözlə görünür. Sözə toxun → hər qaridə həmin sözün müddəti.
// • Söz vaxtları — Quran.com API v4, səs — verses.quran.com (saytda saxlanmır).
//   Səs dalğası WebAudio ilə çıxarılır; alınmasa yalnız söz bölgüsü göstərilir.
// • Bölmə ekrana yaxınlaşanda yüklənir; seçilmiş ayə dəyişəndə yenidən gətirilir.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { getReciter } from '../../utils/quranAudio'
import { COMPARE_RECITERS, parseRecitation, verseWords, peaksOf, wordDurations, wordAtTime } from '../../utils/reciterCompare'
import { SURAH_TABLE } from '../../data/mushafIndex'
import '../../styles/ReciterCompare.css'

const T = {
  az: { ey: 'Qiraət', title: 'Qiraətçiləri müqayisə et', lead: 'Eyni ayə beş qarinin səsində. Zaman ərəb yazısı kimi sağdan sola axır və hamısı eyni miqyasdadır — kim hansı sözü nə qədər uzadır, görünür. Sözə toxunun.',
    surah: 'Surə', ayah: 'Ayə', play: 'Dinlə', pause: 'Dayandır', all: 'Hamısını ardıcıl dinlə', sec: 'san', loading: 'Yüklənir…', err: 'Bu qarinin səsi yüklənmədi.', word: 'Seçilmiş söz', total: 'Ayənin müddəti', longest: 'ən uzun', src: 'Söz vaxtları — Quran.com, səs — verses.quran.com', pick: 'Sözə toxunun — hər qaridə onun müddəti çıxacaq.' },
  en: { ey: 'Recitation', title: 'Compare the reciters', lead: 'The same ayah in five reciters’ voices. Time flows right to left, like Arabic script, and all share one scale — you can see who lengthens which word and by how much. Tap a word.',
    surah: 'Surah', ayah: 'Ayah', play: 'Listen', pause: 'Pause', all: 'Listen to all in turn', sec: 's', loading: 'Loading…', err: 'This reciter’s audio did not load.', word: 'Selected word', total: 'Length of the ayah', longest: 'longest', src: 'Word timings — Quran.com, audio — verses.quran.com', pick: 'Tap a word to see its length for each reciter.' },
  ru: { ey: 'Чтение', title: 'Сравните чтецов', lead: 'Один и тот же аят голосами пяти чтецов. Время идёт справа налево, как арабское письмо, и у всех один масштаб — видно, кто и насколько растягивает каждое слово. Коснитесь слова.',
    // lang-ok[Quran]: Quran.com — saytın adıdır
    surah: 'Сура', ayah: 'Аят', play: 'Слушать', pause: 'Пауза', all: 'Слушать всех по очереди', sec: 'с', loading: 'Загрузка…', err: 'Запись этого чтеца не загрузилась.', word: 'Выбранное слово', total: 'Длина аята', longest: 'дольше всех', src: 'Тайминги слов — Quran.com, аудио — verses.quran.com', pick: 'Коснитесь слова — появится его длительность у каждого чтеца.' },
  ar: { ey: 'التلاوة', title: 'قارن بين القرّاء', lead: 'الآية نفسها بأصوات خمسة قرّاء. يجري الزمن من اليمين إلى اليسار كالكتابة العربية، والمقياس واحد للجميع — فترى من يمدّ أيّ كلمة وكم. المس كلمة.',
    // lang-ok[Quran]: Quran.com — saytın adıdır
    surah: 'السورة', ayah: 'الآية', play: 'استمع', pause: 'إيقاف', all: 'استمع للجميع بالتتابع', sec: 'ث', loading: 'جارٍ التحميل…', err: 'لم يُحمَّل صوت هذا القارئ.', word: 'الكلمة المختارة', total: 'مدة الآية', longest: 'الأطول', src: 'توقيت الكلمات — Quran.com، الصوت — verses.quran.com', pick: 'المس كلمة لتظهر مدّتها عند كل قارئ.' },
  tr: { ey: 'Kıraat', title: 'Kârileri karşılaştır', lead: 'Aynı âyet beş kârinin sesinde. Zaman Arap yazısı gibi sağdan sola akar ve hepsi aynı ölçektedir — kimin hangi kelimeyi ne kadar uzattığı görünür. Bir kelimeye dokunun.',
    // lang-ok[Quran]: Quran.com — saytın adıdır
    surah: 'Sure', ayah: 'Âyet', play: 'Dinle', pause: 'Durdur', all: 'Hepsini sırayla dinle', sec: 'sn', loading: 'Yükleniyor…', err: 'Bu kârinin sesi yüklenemedi.', word: 'Seçilen kelime', total: 'Âyetin süresi', longest: 'en uzun', src: 'Kelime zamanları — Quran.com, ses — verses.quran.com', pick: 'Bir kelimeye dokunun — her kâride süresi çıksın.' },
}
const API = 'https://api.quran.com/api/v4'
const COLORS = ['#e2b857', '#6ee7b7', '#8fb8ff', '#f59ab0', '#c4a6ff']
const CW = 900, CH = 64

let actx = null
const audioCtx = () => { if (!actx && typeof window !== 'undefined') { const C = window.AudioContext || window.webkitAudioContext; if (C) actx = new C() } return actx }
const cache = new Map()
function loadAyah(key) {
  if (cache.has(key)) return cache.get(key)
  const p = Promise.all([
    fetch(`${API}/verses/by_key/${key}?words=true&word_fields=text_uthmani`).then(r => { if (!r.ok) throw new Error('http'); return r.json() }).then(verseWords),
    ...COMPARE_RECITERS.map(rc => fetch(`${API}/recitations/${rc.qc}/by_ayah/${key}?fields=segments`).then(r => (r.ok ? r.json() : null)).then(parseRecitation).catch(() => null)),
  ]).then(([words, ...recs]) => ({ words, recs }))
  cache.set(key, p)
  p.catch(() => cache.delete(key))
  return p
}
async function loadPeaks(url) {
  const ctx = audioCtx()
  if (!ctx || !url) return null
  const buf = await fetch(url).then(r => { if (!r.ok) throw new Error('http'); return r.arrayBuffer() })
  const audio = await new Promise((res, rej) => { const pr = ctx.decodeAudioData(buf, res, rej); if (pr?.then) pr.then(res, rej) })
  return { peaks: peaksOf(audio.getChannelData(0), 360), dur: audio.duration * 1000 }
}

export default function ReciterCompare({ lang = 'az', surahName = (n) => SURAH_TABLE[n - 1]?.[5] }) {
  const t = pickUi(T, lang)
  const [s, setS] = useState(1)
  const [a, setA] = useState(7)
  const key = `${s}:${a}`
  const [data, setData] = useState(null)       // { words, recs }
  const [err, setErr] = useState(false)
  const [waves, setWaves] = useState({})       // i → { peaks, dur } | 'err'
  const [sel, setSel] = useState(null)         // sözün yeri (pos)
  const [play, setPlay] = useState(null)       // { i, ms }
  const queue = useRef(null)
  const audioRef = useRef(null)
  const maxA = SURAH_TABLE[s - 1]?.[2] || 7

  useEffect(() => {
    let off = false
    setData(null); setErr(false); setWaves({}); setSel(null); stop()
    loadAyah(key).then(d => {
      if (off) return
      setData(d)
    }).catch(() => !off && setErr(true))
    return () => { off = true }
  }, [key])

  // Səs dalğaları (5 mp3, ~0.5 MB) yalnız istifadəçi bölmə ilə işləməyə başlayanda yüklənir —
  // səhifəyə sadəcə baxana trafik xərclənməsin; söz bölgüsü (kiçik JSON) dərhal görünür
  const [wantWaves, setWantWaves] = useState(false)
  useEffect(() => {
    if (!wantWaves || !data) return undefined
    let off = false
    data.recs.forEach((r, i) => loadPeaks(r?.url).then(w => !off && setWaves(o => ({ ...o, [i]: w || 'err' }))).catch(() => !off && setWaves(o => ({ ...o, [i]: 'err' }))))
    return () => { off = true }
  }, [wantWaves, data])  

  useEffect(() => () => stop(), [])  

  function stop() {
    queue.current = null
    const el = audioRef.current
    if (el) { el.pause(); el.onended = el.ontimeupdate = null }
    setPlay(null)
  }
  function start(i, chain = false) {
    const r = data?.recs[i]
    if (!r?.url) { if (chain) next(i); return }
    let el = audioRef.current
    if (!el) { el = new Audio(); el.preload = 'auto'; audioRef.current = el }
    el.pause(); el.src = r.url; el.currentTime = 0
    queue.current = chain ? i : null
    let raf = 0
    const tick = () => { if (audioRef.current === el && !el.paused) { setPlay({ i, ms: el.currentTime * 1000 }); raf = requestAnimationFrame(tick) } }
    el.onplay = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick) }
    el.onended = () => { cancelAnimationFrame(raf); setPlay(null); if (queue.current === i) next(i) }
    el.play().catch(() => setPlay(null))
    setPlay({ i, ms: 0 })
  }
  function next(i) { if (i + 1 < COMPARE_RECITERS.length) start(i + 1, true); else queue.current = null }

  const scale = useMemo(() => {
    if (!data) return 1
    return Math.max(1, ...data.recs.map((r, i) => Math.max(r?.end || 0, (waves[i] && waves[i] !== 'err' ? waves[i].dur : 0))))
  }, [data, waves])
  const durs = useMemo(() => (data ? wordDurations(data.words, data.recs) : []), [data])
  const selDur = sel != null ? durs.find(d => d.pos === sel) : null
  const selMax = selDur ? Math.max(...selDur.ms.filter(x => x != null)) : 0
  const activeWord = play && data ? wordAtTime(data.recs[play.i]?.segs, play.ms) : null

  return (
    <section className="rcm ui-card" aria-labelledby="rcm-title" data-testid="reciter-compare" onPointerDown={() => setWantWaves(true)} onKeyDown={() => setWantWaves(true)}>
      <div className="rcm__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h3 id="rcm-title" className="ui-title ui-title--sm">{t.title}</h3>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <div className="rcm__pick">
        <label><span>{t.surah}</span>
          <select value={s} onChange={e => { setS(Number(e.target.value)); setA(1) }} data-testid="rcm-surah">
            {SURAH_TABLE.map((row, i) => <option key={i} value={i + 1}>{i + 1}. {surahName(i + 1)}</option>)}
          </select>
        </label>
        <label><span>{t.ayah}</span>
          <input type="number" min={1} max={maxA} value={a} inputMode="numeric" data-testid="rcm-ayah"
            onChange={e => { const v = Math.max(1, Math.min(maxA, Number(e.target.value) || 1)); setA(v) }} />
        </label>
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={!data} onClick={() => (play && queue.current != null ? stop() : start(0, true))} data-testid="rcm-all">
          <Icon name={play && queue.current != null ? 'pause' : 'play'} className="ui-btn__icon" /> {play && queue.current != null ? t.pause : t.all}
        </button>
      </div>

      {err && <p className="rcm__err" role="alert">{t.err}</p>}
      {!data && !err && <p className="rcm__loading" role="status"><span className="ui-spin" aria-hidden="true" /> {t.loading}</p>}
      {data && (
        <>
          <div className="rcm__words ui-arabic" lang="ar" dir="rtl" role="group" aria-label={t.pick}>
            {data.words.map(w => (
              <button key={w.pos} type="button" className={`rcm__w${sel === w.pos ? ' is-sel' : ''}${activeWord === w.pos ? ' is-now' : ''}`} aria-pressed={sel === w.pos}
                onClick={() => setSel(x => (x === w.pos ? null : w.pos))} data-testid="rcm-word">{w.text}</button>
            ))}
          </div>
          <ul className="rcm__rows">
            {COMPARE_RECITERS.map((rc, i) => {
              const r = data.recs[i], wv = waves[i]
              const name = pickUi(getReciter(rc.id).name, lang)
              const isPlay = play?.i === i
              const total = r?.end || (wv && wv !== 'err' ? wv.dur : 0)
              return (
                <li key={rc.qc} className={`rcm__row${isPlay ? ' is-play' : ''}`} style={{ '--c': COLORS[i] }} data-testid="rcm-row">
                  <div className="rcm__who">
                    <button type="button" className="ui-icon-btn rcm__play" aria-label={`${isPlay ? t.pause : t.play}: ${name}`} disabled={!r?.url}
                      onClick={() => (isPlay ? stop() : start(i))}><Icon name={isPlay ? 'pause' : 'play'} /></button>
                    <span className="rcm__name">{name}</span>
                    {total > 0 && <span className="rcm__total ui-num">{(total / 1000).toFixed(1)} {t.sec}</span>}
                    {selDur && selDur.ms[i] != null && (
                      <span className={`rcm__wd ui-num${selDur.ms[i] === selMax ? ' is-max' : ''}`} data-testid="rcm-wd">
                        {(selDur.ms[i] / 1000).toFixed(2)} {t.sec}{selDur.ms[i] === selMax ? ` · ${t.longest}` : ''}
                      </span>
                    )}
                  </div>
                  <Lane rec={r} wave={wv && wv !== 'err' ? wv : null} scale={scale} sel={sel} words={data.words} ms={isPlay ? play.ms : null} color={COLORS[i]} />
                  {!r && <span className="rcm__miss">{t.err}</span>}
                </li>
              )
            })}
          </ul>
          {sel == null && <p className="rcm__hint">{t.pick}</p>}
        </>
      )}
      <p className="rcm__src"><Icon name="info" size={14} /> {t.src}</p>
    </section>
  )
}

// Bir qarinin zolağı: kətan — sağdan sola zaman; söz bölgüləri, səs dalğası, oxu xətti
function Lane({ rec, wave, scale, sel, words, ms, color }) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const X = (t) => CW * (1 - t / scale)
    ctx.clearRect(0, 0, CW, CH)
    if (rec) {
      words.forEach((w, k) => {
        const sg = rec.segs.get(w.pos)
        if (!sg) return
        const x1 = X(sg[1]), x0 = X(sg[0])
        ctx.fillStyle = w.pos === sel ? color : k % 2 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.12)'
        ctx.globalAlpha = w.pos === sel ? 0.38 : 1
        ctx.fillRect(x1, 2, Math.max(1, x0 - x1), CH - 4)
        ctx.globalAlpha = 1
        ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x0 - 1, 6, 1, CH - 12)
      })
    }
    if (wave) {
      const n = wave.peaks.length, span = wave.dur / scale
      ctx.fillStyle = color
      for (let b = 0; b < n; b++) {
        const h = Math.max(1.5, wave.peaks[b] * (CH - 14))
        const x = CW - (b / n) * span * CW
        ctx.fillRect(x - (span * CW) / n, (CH - h) / 2, Math.max(1, (span * CW) / n - 0.6), h)
      }
    }
    if (ms != null) { ctx.fillStyle = '#fff'; ctx.fillRect(X(ms) - 1, 0, 2, CH) }
  }, [rec, wave, scale, sel, words, ms, color])
  return <canvas ref={ref} width={CW} height={CH} className="rcm__lane" aria-hidden="true" />
}
