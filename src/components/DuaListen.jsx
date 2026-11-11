// ═══════════════════════════════════════════════════════
// DuaListen (v6.0) — duanın ərəbcə səsi (Hisnul-Müslim, Dualar)
//
//   <DuaListen akey="27:3" lang="az" />      akey — "<fəsil id>:<sıra>" (Hisnul-Müslim) və ya "d:<id>" (Dualar)
//
// • Səs xəritəsi — public/data/hisn/audio.json (scripts/build-hisn-audio.mjs: ərəb mətni ilə uyğunlaşdırılıb).
//   Səs faylları KOPYALANMIR — hisnmuslim.com-un öz serverindən oxunur; mənbə düymənin yanında göstərilir.
// • Bütün səhifədə eyni anda bir dua səslənir (ümumi <audio>). Səsi olmayan duada düymə görünmür.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import '../styles/DuaListen.css'

const T = {
  az: { play: 'Dinlə', stop: 'Dayandır', loading: 'Yüklənir…', src: 'Səs: hisnmuslim.com', err: 'Səs açılmadı' },
  en: { play: 'Listen', stop: 'Stop', loading: 'Loading…', src: 'Audio: hisnmuslim.com', err: 'Could not play' },
  ru: { play: 'Слушать', stop: 'Стоп', loading: 'Загрузка…', src: 'Аудио: hisnmuslim.com', err: 'Не удалось воспроизвести' },
  ar: { play: 'استمع', stop: 'إيقاف', loading: 'جارٍ التحميل…', src: 'الصوت: hisnmuslim.com', err: 'تعذّر التشغيل' },
  tr: { play: 'Dinle', stop: 'Durdur', loading: 'Yükleniyor…', src: 'Ses: hisnmuslim.com', err: 'Ses açılamadı' },
}
const BASE = 'https://www.hisnmuslim.com/audio/ar/'
let mapPromise = null
const loadMap = () => (mapPromise ||= fetch('/data/hisn/audio.json').then(r => (r.ok ? r.json() : {})).catch(() => { mapPromise = null; return {} }))

// Ümumi pleyer: bir dua başlayanda əvvəlki dayanır
let audio = null, current = null
const listeners = new Set()
const emit = () => listeners.forEach(fn => fn(current))
function play(key, id) {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'none'
    audio.addEventListener('ended', () => { current = null; emit() })
    audio.addEventListener('error', () => { if (current) { current = { ...current, err: true }; emit() } })
    audio.addEventListener('playing', () => { if (current) { current = { ...current, loading: false }; emit() } })
  }
  if (current?.key === key) { audio.pause(); current = null; emit(); return }
  audio.pause()
  audio.src = `${BASE}${id}.mp3`
  current = { key, loading: true }
  emit()
  audio.play().catch(() => { if (current?.key === key) { current = { key, err: true }; emit() } })
}

export default function DuaListen({ akey, lang = 'az' }) {
  const t = pickUi(T, lang)
  const [id, setId] = useState(null)
  const [state, setState] = useState(current)
  useEffect(() => { let alive = true; loadMap().then(m => { if (alive) setId(m[akey] || null) }); return () => { alive = false } }, [akey])
  useEffect(() => { listeners.add(setState); return () => listeners.delete(setState) }, [])
  if (!id) return null
  const mine = state?.key === akey
  const label = mine ? (state.err ? t.err : state.loading ? t.loading : t.stop) : t.play
  return (
    <span className="dua-listen">
      <button type="button" className={`ui-btn ui-btn--ghost ui-btn--sm dua-listen__btn${mine && !state.err ? ' is-on' : ''}`} onClick={() => play(akey, id)}
        aria-pressed={mine && !state.err} data-testid="dua-listen">
        <Icon name={mine && !state.err && !state.loading ? 'pause' : 'play'} className="ui-btn__icon" />{label}
      </button>
      <a className="dua-listen__src" href="https://www.hisnmuslim.com/" target="_blank" rel="noopener noreferrer">{t.src}</a>
    </span>
  )
}
