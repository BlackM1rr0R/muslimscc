// ═══════════════════════════════════════════════════════
// Quran radiosu (Quran səhifəsi, v3.2) — siyahını fasiləsiz dinləmək.
// Səs: utils/quranAudio.js (cdn.islamic.network + ehtiyat mənbələr; oxuyucu
// ilə eyni qarilər, Həfs rəvayəti). Ayə-ayə oynadılır, ardıcıl.
// Hazır siyahılar YALNIZ Quran ayələridir:
//   • Ruqyə: Fatihə, Bəqərə 1–5, Ayətul-Kürsi (2:255), Bəqərə 285–286,
//     İxlas, Fələq, Nas
//   • Əmmə cüzü (78–114) · istənilən surədən — istənilən surəyə
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Icon from '../Icon'
import { SURAH_TABLE } from '../../data/mushafIndex'
import { RECITERS, ayahSources, readAudioPrefs, writeAudioPrefs, reciterName } from '../../utils/quranAudio'

// Surənin ilk ayəsinin ümumi nömrəsi (1…6236)
const FIRST_G = (() => {
  const out = [0]
  let g = 1
  for (const row of SURAH_TABLE) { out.push(g); g += row[2] }
  return out
})()
const item = (s, a) => ({ s, a, g: FIRST_G[s] + a - 1 })
const range = (s, from, to) => Array.from({ length: to - from + 1 }, (_, i) => item(s, from + i))
const wholeSurahs = (from, to) => {
  const out = []
  for (let s = from; s <= to; s++) out.push(...range(s, 1, SURAH_TABLE[s - 1][2]))
  return out
}
const RUQYAH = () => [
  ...range(1, 1, 7), ...range(2, 1, 5), item(2, 255), ...range(2, 285, 286),
  ...range(112, 1, 4), ...range(113, 1, 5), ...range(114, 1, 6),
]

const L = {
  az: {
    eyebrow: 'Quran radiosu', title: 'Fasiləsiz dinləyin',
    lead: 'Siyahını seçin — ayələr bir-birinin ardınca oxunacaq.',
    presets: 'Siyahı', ruqyah: 'Ruqyə ayələri', ruqyahHint: 'Fatihə, Bəqərə 1–5, Ayətul-Kürsi, Bəqərə 285–286, İxlas, Fələq, Nas',
    amma: 'Əmmə cüzü', ammaHint: 'Nəbə (78) — Nas (114)', custom: 'Surələr', customHint: 'Seçdiyiniz surədən sonuncuya qədər',
    from: 'Başlanğıc surə', to: 'Son surə', reciter: 'Qari',
    play: 'Dinlə', pause: 'Dayandır', prev: 'Əvvəlki ayə', next: 'Növbəti ayə', stop: 'Bitir',
    now: 'İndi', error: 'Səs yüklənmədi. İnternet bağlantısını yoxlayın.',
  },
  en: {
    eyebrow: 'Quran radio', title: 'Listen without a break',
    lead: 'Choose a list and the verses play one after another.',
    presets: 'Playlist', ruqyah: 'Ruqyah verses', ruqyahHint: 'al-Fatiha, al-Baqarah 1–5, Ayat al-Kursi, al-Baqarah 285–286, al-Ikhlas, al-Falaq, an-Nas',
    amma: 'Juz ʿAmma', ammaHint: 'an-Naba (78) — an-Nas (114)', custom: 'Surahs', customHint: 'From the surah you choose to the last one',
    from: 'First surah', to: 'Last surah', reciter: 'Reciter',
    play: 'Play', pause: 'Pause', prev: 'Previous verse', next: 'Next verse', stop: 'Stop',
    now: 'Now', error: 'The audio could not be loaded. Please check your connection.',
  },
  ru: {
    eyebrow: 'Коран-радио', title: 'Слушайте без перерыва',
    lead: 'Выберите список — аяты будут звучать один за другим.',
    presets: 'Список', ruqyah: 'Аяты рукьи', ruqyahHint: 'аль-Фатиха, аль-Бакара 1–5, аят аль-Курси, аль-Бакара 285–286, аль-Ихлас, аль-Фалак, ан-Нас',
    amma: 'Джуз «Амма»', ammaHint: 'ан-Наба (78) — ан-Нас (114)', custom: 'Суры', customHint: 'От выбранной суры до последней',
    from: 'Первая сура', to: 'Последняя сура', reciter: 'Чтец',
    play: 'Слушать', pause: 'Пауза', prev: 'Предыдущий аят', next: 'Следующий аят', stop: 'Стоп',
    now: 'Сейчас', error: 'Не удалось загрузить аудио. Проверьте подключение к интернету.',
  },
  ar: {
    eyebrow: 'إذاعة القرآن', title: 'استمع دون انقطاع',
    lead: 'اختر قائمة فتُتلى الآيات واحدة تلو الأخرى.',
    presets: 'القائمة', ruqyah: 'آيات الرقية', ruqyahHint: 'الفاتحة، البقرة ⁦1–5⁩، آية الكرسي، البقرة ⁦285–286⁩، الإخلاص، الفلق، الناس',
    amma: 'جزء عمّ', ammaHint: 'النبأ (78) — الناس (114)', custom: 'السور', customHint: 'من السورة التي تختارها إلى الأخيرة',
    from: 'السورة الأولى', to: 'السورة الأخيرة', reciter: 'القارئ',
    play: 'استمع', pause: 'إيقاف مؤقت', prev: 'الآية السابقة', next: 'الآية التالية', stop: 'إنهاء',
    now: 'الآن', error: 'تعذّر تحميل الصوت. تحقّق من الاتصال بالإنترنت.',
  },
  tr: {
    eyebrow: 'Kur’an radyosu', title: 'Kesintisiz dinleyin',
    lead: 'Bir liste seçin — ayetler art arda okunur.',
    presets: 'Liste', ruqyah: 'Rukye ayetleri', ruqyahHint: 'Fatiha, Bakara 1–5, Ayetel-Kürsi, Bakara 285–286, İhlas, Felak, Nas',
    amma: 'Amme cüzü', ammaHint: 'Nebe (78) — Nas (114)', custom: 'Sureler', customHint: 'Seçtiğiniz sureden sonuncuya kadar',
    from: 'İlk sure', to: 'Son sure', reciter: 'Kari',
    play: 'Dinle', pause: 'Duraklat', prev: 'Önceki ayet', next: 'Sonraki ayet', stop: 'Bitir',
    now: 'Şimdi', error: 'Ses yüklenemedi. İnternet bağlantınızı kontrol edin.',
  },
}

export default function QuranRadio({ lang, surahName, placeLabel }) {
  const t = L[lang] || L.az
  const [preset, setPreset] = useState('ruqyah')
  const [from, setFrom] = useState(1)
  const [to, setTo] = useState(114)
  const [reciter, setReciter] = useState(() => readAudioPrefs().reciter)
  const [idx, setIdx] = useState(-1)                 // -1 — dayanıb
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(false)
  const audioRef = useRef(null)
  const srcRef = useRef(0)                           // ehtiyat mənbənin indeksi

  const list = useMemo(() => {
    if (preset === 'ruqyah') return RUQYAH()
    if (preset === 'amma') return wholeSurahs(78, 114)
    return wholeSurahs(Math.min(from, to), Math.max(from, to))
  }, [preset, from, to])
  const cur = idx >= 0 ? list[idx] : null

  const stop = useCallback(() => {
    const el = audioRef.current
    if (el) { el.pause(); el.removeAttribute('src'); el.load() }
    setIdx(-1); setPlaying(false)
  }, [])
  // Siyahı və ya qari dəyişdi — dayandır (köhnə növbə qarışmasın)
  useEffect(() => { stop() }, [list, reciter, stop])
  useEffect(() => () => { audioRef.current?.pause() }, [])

  // Cari ayəni yüklə və oxut
  useEffect(() => {
    const el = audioRef.current
    if (!el || !cur) return
    srcRef.current = 0
    setError(false)
    el.src = ayahSources(reciter, cur)[0]
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : null
    if (ms && typeof window.MediaMetadata === 'function') {
      try {
        ms.metadata = new window.MediaMetadata({ title: placeLabel(surahName(cur.s), cur.a), artist: reciterName(reciter, lang), album: t.eyebrow })
      } catch { /* köhnə brauzer */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, cur])

  const onEnded = () => { if (idx + 1 < list.length) setIdx(idx + 1); else stop() }
  const onError = () => {
    const el = audioRef.current
    if (!el || !cur || !el.getAttribute('src')) return
    const srcs = ayahSources(reciter, cur)
    if (srcRef.current + 1 < srcs.length) {
      srcRef.current += 1
      el.src = srcs[srcRef.current]
      el.play().catch(() => {})
    } else { setError(true); setPlaying(false) }
  }
  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (idx < 0) { setIdx(0); return }
    if (el.paused) el.play().then(() => setPlaying(true)).catch(() => {})
    else { el.pause(); setPlaying(false) }
  }
  const step = d => { const n = idx + d; if (n >= 0 && n < list.length) setIdx(n) }

  const presets = [
    { key: 'ruqyah', label: t.ruqyah, hint: t.ruqyahHint, icon: 'shield' },
    { key: 'amma', label: t.amma, hint: t.ammaHint, icon: 'quran' },
    { key: 'custom', label: t.custom, hint: t.customHint, icon: 'list' },
  ]
  const surahOptions = SURAH_TABLE.map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}. {surahName(i + 1)}</option>)
  const pct = idx >= 0 ? ((idx + 1) / list.length) : 0

  return (
    <section className="qr" aria-labelledby="qr-h">
      <div className="qr__head">
        <span className="ui-icon-tile" aria-hidden="true"><Icon name="volume" /></span>
        <div>
          <span className="ui-eyebrow">{t.eyebrow}</span>
          <h2 className="qr__title" id="qr-h">{t.title}</h2>
        </div>
      </div>
      <p className="qr__lead">{t.lead}</p>
      <div className="qr__presets" role="group" aria-label={t.presets}>
        {presets.map(p => (
          <button type="button" key={p.key} aria-pressed={preset === p.key}
            className={`qr__preset${preset === p.key ? ' is-on' : ''}`} onClick={() => setPreset(p.key)}>
            <Icon name={p.icon} size={18} />
            <span className="qr__preset-body">
              <span className="qr__preset-title">{p.label}</span>
              <span className="qr__preset-hint">{p.hint}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="qr__fields">
        {preset === 'custom' && (
          <>
            <label className="ui-field">
              <span className="ui-field__label">{t.from}</span>
              <select className="ui-select" value={from} onChange={e => setFrom(Number(e.target.value))}>{surahOptions}</select>
            </label>
            <label className="ui-field">
              <span className="ui-field__label">{t.to}</span>
              <select className="ui-select" value={to} onChange={e => setTo(Number(e.target.value))}>{surahOptions}</select>
            </label>
          </>
        )}
        <label className="ui-field">
          <span className="ui-field__label">{t.reciter}</span>
          <select className="ui-select" value={reciter} onChange={e => {
            const id = e.target.value
            setReciter(id)
            writeAudioPrefs({ ...readAudioPrefs(), reciter: id })
          }}>
            {RECITERS.map(r => <option key={r.id} value={r.id}>{r.name[lang] || r.name.en}</option>)}
          </select>
        </label>
      </div>
      <div className="qr__player">
        <div className="qr__controls">
          <button type="button" className="qr__btn" onClick={() => step(-1)} disabled={idx <= 0} aria-label={t.prev} title={t.prev}>
            <Icon name="chevronLeft" size={18} className="ui-flip-rtl" />
          </button>
          <button type="button" className="qr__btn qr__btn--main" onClick={toggle} aria-label={playing ? t.pause : t.play} aria-pressed={playing}>
            <Icon name={playing ? 'pause' : 'play'} size={20} />
          </button>
          <button type="button" className="qr__btn" onClick={() => step(1)} disabled={idx < 0 || idx >= list.length - 1} aria-label={t.next} title={t.next}>
            <Icon name="chevronLeft" size={18} className="qr__fwd" />
          </button>
          {idx >= 0 && (
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={stop}>{t.stop}</button>
          )}
        </div>
        <div className="qr__now" aria-live="polite">
          {error ? <span className="qr__err" role="alert">{t.error}</span>
            : cur ? <><span className="qr__now-label">{t.now}</span> <b>{placeLabel(surahName(cur.s), cur.a)}</b> <span className="ui-num qr__count" dir="ltr">{idx + 1} / {list.length}</span></>
            : <span className="qr__now-label">{reciterName(reciter, lang)}</span>}
        </div>
        <span className="qr__bar" aria-hidden="true"><span style={{ transform: `scaleX(${pct.toFixed(4)})` }} /></span>
      </div>
      <audio ref={audioRef} preload="auto" onEnded={onEnded} onError={onError}
        onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} hidden />
    </section>
  )
}
