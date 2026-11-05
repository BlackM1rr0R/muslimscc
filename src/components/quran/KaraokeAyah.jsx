// ═══════════════════════════════════════════════════════
// KaraokeAyah — ayə sözbəsöz: oxunan söz həmin anda vurğulanır (/quran)
//
//   <KaraokeAyah surah={2} ayah={255} lang="az" onClose={() => …} />
//
// • Sözlər və vaxtlar quran.com API v4-dən:
//     /verses/by_key/{s:a}?words=true&word_fields=text_uthmani  — Uthmani sözlər
//     /recitations/7/by_ayah/{s:a}?fields=segments               — [idx, söz, başla ms, bitir ms]
//   Səs — HƏMİN vaxtların aid olduğu fayl (Mişari əl-Əfasi, verses.quran.com);
//   saytın adi pleyerindəki fayl başqa kodlaşdırmadır, vaxtlar ona uyğun gəlməyə bilər.
// • Vurğu rAF ilə audio.currentTime-dan; sözə toxunuş — həmin sözdən oxu.
// • Səs dalğası yalnız oxunarkən (transform: scaleY), dayananda dayanır.
// • Esc / "Bağla" — səs dayanır. Stillər: src/styles/KaraokeAyah.css
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'
import { buildKaraoke, wordAt } from '../../utils/karaoke'
import '../../styles/KaraokeAyah.css'

const API = 'https://api.quran.com/api/v4'
const T = {
  az: { title: 'Sözbəsöz tilavət', reciter: 'Mişari əl-Əfasi', play: 'Dinlə', pause: 'Dayandır', again: 'Yenidən', close: 'Bağla', loading: 'Yüklənir…', err: 'Sözlərin vaxtını yükləmək alınmadı. İnterneti yoxlayıb yenidən cəhd edin.', hint: 'Sözə toxunun — oradan oxunsun', src: 'Söz vaxtları: Quran.com' },
  en: { title: 'Word-by-word recitation', reciter: 'Mishary al-Afasy', play: 'Play', pause: 'Pause', again: 'Again', close: 'Close', loading: 'Loading…', err: 'Could not load the word timings. Check your connection and try again.', hint: 'Tap a word to play from there', src: 'Word timings: Quran.com' },
  // lang-ok[Quran]: sayt adı (Quran.com)
  ru: { title: 'Чтение по словам', reciter: 'Мишари аль-Афаси', play: 'Слушать', pause: 'Пауза', again: 'Сначала', close: 'Закрыть', loading: 'Загрузка…', err: 'Не удалось загрузить тайминги слов. Проверьте соединение и попробуйте снова.', hint: 'Коснитесь слова — чтение начнётся с него', src: 'Тайминги слов: Quran.com' },
  // lang-ok[Quran]: sayt adı (Quran.com)
  tr: { title: 'Kelime kelime tilavet', reciter: 'Mişari el-Afasi', play: 'Dinle', pause: 'Duraklat', again: 'Baştan', close: 'Kapat', loading: 'Yükleniyor…', err: 'Kelime zamanlamaları yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.', hint: 'Bir kelimeye dokunun — oradan okunsun', src: 'Kelime zamanlamaları: Quran.com' },
  // lang-ok[Quran]: sayt adı (Quran.com)
  ar: { title: 'التلاوة كلمةً كلمة', reciter: 'مشاري العفاسي', play: 'استمع', pause: 'إيقاف', again: 'من البداية', close: 'إغلاق', loading: 'جارٍ التحميل…', err: 'تعذّر تحميل توقيت الكلمات. تحقّق من الاتصال وحاول مجددًا.', hint: 'المس كلمة لتبدأ التلاوة منها', src: 'توقيت الكلمات: Quran.com' },
}

export default function KaraokeAyah({ surah, ayah, lang = 'az', onClose }) {
  const t = T[lang] || T.az
  const [data, setData] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | playing | paused | error
  const [cur, setCur] = useState(-1)
  const audioRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    const key = `${surah}:${ayah}`
    const ctrl = new AbortController()
    Promise.all([
      fetch(`${API}/verses/by_key/${key}?words=true&word_fields=text_uthmani`, { signal: ctrl.signal }).then(r => (r.ok ? r.json() : Promise.reject(r.status))),
      fetch(`${API}/recitations/7/by_ayah/${key}?fields=segments`, { signal: ctrl.signal }).then(r => (r.ok ? r.json() : Promise.reject(r.status))),
    ]).then(([v, r]) => {
      const k = buildKaraoke(v, r)
      if (!k) throw new Error('empty')
      setData(k); setState('ready')
    }).catch(e => { if (e?.name !== 'AbortError') setState('error') })
    return () => ctrl.abort()
  }, [surah, ayah])

  // Vurğu: oxunarkən rAF
  useEffect(() => {
    if (state !== 'playing' || !data) return undefined
    let raf = 0
    const tick = () => {
      const a = audioRef.current
      if (a) setCur(wordAt(data.words, a.currentTime * 1000))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state, data])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const a = audioRef.current
    return () => { window.removeEventListener('keydown', onKey); try { a?.pause() } catch { /* yox */ } }
  }, [onClose])

  const play = (fromMs = null) => {
    const a = audioRef.current
    if (!a || !data) return
    if (fromMs != null) a.currentTime = fromMs / 1000
    a.play().then(() => setState('playing')).catch(() => setState('error'))
  }
  const toggle = () => {
    const a = audioRef.current
    if (state === 'playing') { a?.pause(); setState('paused') } else play()
  }

  return createPortal(
    <div className="kar" role="dialog" aria-modal="true" aria-labelledby="kar-title" data-testid="karaoke"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="kar__card">
        <header className="kar__head">
          <div>
            <h2 id="kar-title" className="kar__title">{t.title}</h2>
            <span className="kar__sub ui-num">{surah}:{ayah} · {t.reciter}</span>
          </div>
          <button type="button" ref={closeRef} className="ui-btn ui-btn--ghost ui-btn--sm" onClick={onClose}>
            <Icon name="close" className="ui-btn__icon" /> {t.close}
          </button>
        </header>

        {state === 'loading' && <p className="kar__msg">{t.loading}</p>}
        {state === 'error' && <p className="kar__msg" role="alert">{t.err}</p>}
        {data && (
          <>
            <p className="kar__ayah ui-arabic" lang="ar" dir="rtl">
              {data.words.map((w, i) => (
                <button key={w.pos} type="button" className={`kar__w${i === cur ? ' is-on' : ''}${i < cur ? ' is-done' : ''}`}
                  disabled={w.from == null} onClick={() => play(w.from)}>{w.text}</button>
              ))}
            </p>
            <div className={`kar__wave${state === 'playing' ? ' is-playing' : ''}`} aria-hidden="true">
              {Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
            </div>
            <div className="kar__bar">
              <button type="button" className="ui-btn ui-btn--primary" onClick={toggle} data-testid="karaoke-play">
                <Icon name={state === 'playing' ? 'pause' : 'play'} className="ui-btn__icon" /> {state === 'playing' ? t.pause : t.play}
              </button>
              <button type="button" className="ui-btn ui-btn--ghost" onClick={() => { setCur(-1); play(0) }}>
                <Icon name="refresh" className="ui-btn__icon" /> {t.again}
              </button>
              <span className="kar__hint">{t.hint}</span>
            </div>
            <audio ref={audioRef} src={data.url} preload="auto"
              onEnded={() => { setState('ready'); setCur(data.words.length) }} onError={() => setState('error')} />
            <p className="kar__src">{t.src}</p>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
