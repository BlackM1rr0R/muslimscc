// ═══════════════════════════════════════════════════════
// QuranZen (v5.7) — surəni tam ekranda, ayə-ayə dinləmək (/quran/<surə> → "Zen")
//
//   <QuranZen player={player} verses={verses} title="Yasin" lang="az" start={n} onClose={…} />
//
// • Səs — səhifənin öz pleyeri (useQuranPlayer: qari, sürət, ardıcıl oxu, Media Session);
//   ekranda yalnız indi oxunan ayə: iri ərəb mətni + (varsa) tərcümə, ayə nömrəsi.
// • Fon — canlı səma (html[data-sky], utils/livingSky) rəngləri və yavaş ulduzlar.
// • Yuxu taymeri: 15 / 30 / 60 dəq — vaxt çatanda səs yumşaq dayanır.
// • Klaviatura: boşluq — oxu/dayandır, ←/→ — ayə, Esc — çıx. createPortal (main transform-u).
// • Sözbəsöz işıqlanma bu rejimdə yoxdur — ayə səviyyəsindədir (KaraokeAyah ayrıca).
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { offlineUrl } from '../../utils/quranAudio'
import { ayahEnvelope, FPS } from '../../utils/audioEnvelope'
import '../../styles/QuranZen.css'

const T = {
  az: { close: 'Çıx', play: 'Oxu', pause: 'Dayandır', prev: 'Əvvəlki ayə', next: 'Növbəti ayə', sleep: 'Yuxu saatı', off: 'Söndür', min: '{n} dəq', left: '{n} dəq qalıb', ayah: 'ayə' },
  en: { close: 'Exit', play: 'Play', pause: 'Pause', prev: 'Previous verse', next: 'Next verse', sleep: 'Sleep timer', off: 'Off', min: '{n} min', left: '{n} min left', ayah: 'verse' },
  ru: { close: 'Выйти', play: 'Слушать', pause: 'Пауза', prev: 'Предыдущий аят', next: 'Следующий аят', sleep: 'Таймер сна', off: 'Выкл.', min: '{n} мин', left: 'Осталось {n} мин', ayah: 'аят' },
  ar: { close: 'خروج', play: 'تشغيل', pause: 'إيقاف', prev: 'الآية السابقة', next: 'الآية التالية', sleep: 'مؤقت النوم', off: 'إيقاف', min: '{n} د', left: 'باقٍ {n} د', ayah: 'آية' },
  tr: { close: 'Çık', play: 'Dinle', pause: 'Durdur', prev: 'Önceki ayet', next: 'Sonraki ayet', sleep: 'Uyku zamanlayıcısı', off: 'Kapalı', min: '{n} dk', left: '{n} dk kaldı', ayah: 'ayet' },
}
const SLEEP = [15, 30, 60]
const STARS = Array.from({ length: 36 }, (_, i) => ({ left: `${(i * 41) % 100}%`, top: `${(i * 29) % 70}%`, '--d': `${(i % 9) * 0.5}s` }))

export default function QuranZen({ player, verses = [], title, lang = 'az', start = 1, surah, onClose }) {
  const t = pickUi(T, lang)
  const [shown, setShown] = useState(player.current || start)
  const [sleepAt, setSleepAt] = useState(null)
  const [, force] = useState(0)
  const rootRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const playing = player.status === 'playing' || player.status === 'loading'

  // Pleyerin cari ayəsini izlə
  const cur = player.current
  useEffect(() => { if (cur) setShown(cur) }, [cur])

  // v5.8: qiraət vizualizatoru — ayənin səs zərfi (CORS-lu mənbədən ayrıca), pleyerin
  // oxuduğu saniyəyə görə nur halqaları (--lvl). Zərf yoxdursa — sakit nəfəs ritmi.
  const ringRef = useRef(null)
  const envRef = useRef(null)
  const reciter = player.prefs?.reciter
  useEffect(() => {
    envRef.current = null
    const url = surah && cur ? offlineUrl(reciter, surah, cur) : null
    let alive = true
    if (url) ayahEnvelope(url).then(e => { if (alive) envRef.current = e })
    return () => { alive = false }
  }, [surah, cur, reciter])
  useEffect(() => {
    if (!playing) { ringRef.current?.style.setProperty('--lvl', '0'); return undefined }
    let raf = 0, sm = 0
    const tick = () => {
      const env = envRef.current
      const tt = player.time?.() || 0
      const v = env ? env[Math.min(env.length - 1, Math.floor(tt * FPS))] || 0 : 0.35 + Math.sin(performance.now() / 900) * 0.15
      sm += (v - sm) * 0.25
      ringRef.current?.style.setProperty('--lvl', sm.toFixed(3))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, player])
  useEffect(() => {
    rootRef.current?.focus()
    document.documentElement.classList.add('qz-open')
    return () => document.documentElement.classList.remove('qz-open')
  }, [])

  // Yuxu taymeri
  useEffect(() => {
    if (!sleepAt) return undefined
    const id = setInterval(() => {
      if (Date.now() >= sleepAt) { player.pause(); setSleepAt(null) } else force(x => x + 1)
    }, 15000)
    return () => clearInterval(id)
  }, [sleepAt, player])

  const v = verses.find(x => x.n === shown) || verses[0]
  const total = verses.length || 1
  const go = (d) => {
    const n = Math.min(total, Math.max(1, (shown || 1) + d))
    setShown(n)
    if (playing) player.toggle(n)
  }
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeRef.current?.() }
    else if (e.key === ' ' && e.target === rootRef.current) { e.preventDefault(); playing ? player.pause() : player.toggle(shown) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); e.stopPropagation()
      const rtl = document.documentElement.dir === 'rtl'
      go((e.key === 'ArrowRight') !== rtl ? 1 : -1)
    }
  }
  const leftMin = sleepAt ? Math.max(1, Math.round((sleepAt - Date.now()) / 60000)) : 0

  if (typeof document === 'undefined' || !v) return null
  return createPortal(
    <div className="qz" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={rootRef} onKeyDown={onKey} data-testid="quran-zen">
      <div className="qz-sky" aria-hidden="true">
        <div className="qz-stars">{STARS.map((s, i) => <i key={i} style={s} />)}</div>
        <div className="qz-glow" />
      </div>
      <header className="qz-top">
        <button type="button" className="qz-x" onClick={onClose} aria-label={t.close}><Icon name="close" size={18} /></button>
        <div className="qz-title"><b>{title}</b><span className="ui-num">{shown} / {total}</span></div>
      </header>
      <div className="qz-bar" aria-hidden="true"><i style={{ transform: `scaleX(${shown / total})` }} /></div>

      <main className="qz-stage">
        <div className="qz-rings" ref={ringRef} aria-hidden="true"><i /><i /><i /></div>
        <div className="qz-ayah" key={shown}>
          <p className="qz-ar" lang="ar" dir="rtl">{v.ar} <span className="qz-num">﴿{v.n.toLocaleString('ar-EG')}﴾</span></p>
          {v.tr && lang !== 'ar' && <p className="qz-tr">{v.tr}</p>}
        </div>
      </main>

      <footer className="qz-foot">
        <div className="qz-ctrl">
          <button type="button" className="qz-btn" onClick={() => go(-1)} disabled={shown <= 1} aria-label={t.prev}><Icon name="chevronLeft" size={22} className="ui-flip-rtl" /></button>
          <button type="button" className="qz-play" onClick={() => (playing ? player.pause() : player.toggle(shown))} aria-label={playing ? t.pause : t.play} data-testid="qz-play">
            <Icon name={playing ? 'pause' : 'play'} size={28} />
          </button>
          <button type="button" className="qz-btn" onClick={() => go(1)} disabled={shown >= total} aria-label={t.next}><Icon name="chevron" size={22} className="ui-flip-rtl" /></button>
        </div>
        <div className="qz-sleep" role="group" aria-label={t.sleep}>
          <Icon name="moon" size={14} />
          {SLEEP.map(m => (
            <button key={m} type="button" className={`qz-chip${sleepAt && Math.abs((sleepAt - Date.now()) / 60000 - m) < 0.6 && leftMin === m ? ' is-on' : ''}`}
              onClick={() => setSleepAt(Date.now() + m * 60000)}>{t.min.replace('{n}', m)}</button>
          ))}
          {sleepAt ? <button type="button" className="qz-chip is-on" onClick={() => setSleepAt(null)}>{t.left.replace('{n}', leftMin)} · {t.off}</button> : null}
        </div>
      </footer>
    </div>,
    document.body,
  )
}
