// ═══════════════════════════════════════════════════════
// SajdahMoment (v5.9) — səcdə ayəsinə çatanda "səcdə anı" (QuranPage oxuyucusu)
//
//   <SajdahMoment listRef={listRef} activeAyah={player.current} playing={busy} surah={2} lang="az" />
//
// • Hansı ayənin səcdə ayəsi olduğu — API-nin öz məlumatıdır (api.alquran.cloud → ayah.sajda,
//   Mədinə mushafında 15 yer); burada siyahı əl ilə yazılmayıb (QuranPage → verse.sj).
// • Tetik: kart ekranın ortasında ≥1.2 s qalanda (oxuyarkən) və ya qiraət həmin ayəyə
//   çatanda. Hər ayə üçün sessiyada bir dəfə (sessionStorage) — təkrar narahat etmir.
// • Dua — Hisnul-Müslimin öz mətni (fəsil 22 "Tilavət səcdəsinin duası", mənbəsi ilə,
//   public/data/hisn/<dil>.json) — yeni dini mətn yazılmayıb. Hökm iddiası yoxdur:
//   yalnız "bu, səcdə ayəsidir" deyilir.
// • Qiraəti dayandırmır; Esc / "Davam et" bağlayır. Hərəkət azaldılıbsa — animasiyasız.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import '../../styles/SajdahMoment.css'

const T = {
  az: { title: 'Səcdə ayəsi', lead: 'Bu ayə Quranın səcdə yerlərindəndir — burada tilavət səcdəsi edilir.', dua: 'Tilavət səcdəsinin duası', go: 'Davam et', open: 'Hisnul-Müslimdə aç', badge: 'Səcdə' },
  en: { title: 'Ayah of prostration', lead: 'This ayah is one of the places of prostration in the Quran — the prostration of recitation is made here.', dua: 'Supplication for the prostration of recitation', go: 'Continue', open: 'Open in Hisn al-Muslim', badge: 'Sajdah' },
  ru: { title: 'Аят земного поклона', lead: 'Этот аят — одно из мест земного поклона в Коране: здесь совершают суджуд ат-тиляуа.', dua: 'Мольба при земном поклоне во время чтения', go: 'Продолжить', open: 'Открыть в «Крепости мусульманина»', badge: 'Саджда' },
  ar: { title: 'آية سجدة', lead: 'هذه الآية من مواضع السجود في القرآن — يُسجد هنا سجود التلاوة.', dua: 'دعاء سجود التلاوة', go: 'متابعة', open: 'افتح في حصن المسلم', badge: 'سجدة' },
  tr: { title: 'Secde âyeti', lead: 'Bu âyet Kur’an’daki secde yerlerindendir — burada tilâvet secdesi yapılır.', dua: 'Tilâvet secdesi duası', go: 'Devam et', open: 'Hisnü’l-Müslim’de aç', badge: 'Secde' },
}
const HISN_CH = 22
const HISN_LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const seenKey = (s, a) => `sajdah_seen:${s}:${a}`
const seen = (s, a) => { try { return sessionStorage.getItem(seenKey(s, a)) === '1' } catch { return false } }
const markSeen = (s, a) => { try { sessionStorage.setItem(seenKey(s, a), '1') } catch { /* */ } }

let hisnCache = {}
function loadDua(lang) {
  const l = HISN_LANGS.includes(lang) ? lang : 'en'
  if (!hisnCache[l]) {
    hisnCache[l] = fetch(`/data/hisn/${l}.json`).then(r => (r.ok ? r.json() : null)).then(d => {
      const ch = d?.chapters?.find(c => c.id === HISN_CH)
      return ch?.items?.[0] ? { ...ch.items[0], lang: l } : null
    }).catch(() => { hisnCache[l] = null; return null })
  }
  return hisnCache[l]
}

export default function SajdahMoment({ listRef, activeAyah, surah, lang = 'az' }) {
  const t = pickUi(T, lang)
  const [open, setOpen] = useState(null)        // ayə nömrəsi
  const [dua, setDua] = useState(null)
  const btnRef = useRef(null)
  const openRef = useRef(null); openRef.current = open

  const show = (n) => {
    if (openRef.current || seen(surah, n)) return
    markSeen(surah, n)
    setOpen(n)
    loadDua(lang).then(d => setDua(d))
  }

  // Oxuyarkən: səcdə kartı ekranın orta zolağında 1.2 s qalırsa
  useEffect(() => {
    const list = listRef?.current
    if (!list || typeof IntersectionObserver === 'undefined') return undefined
    const timers = new Map()
    const io = new IntersectionObserver((ens) => {
      for (const en of ens) {
        const n = Number(en.target.dataset.ayah)
        if (en.isIntersecting) {
          if (!timers.has(n)) timers.set(n, setTimeout(() => { timers.delete(n); show(n) }, 1200))
        } else { clearTimeout(timers.get(n)); timers.delete(n) }
      }
    }, { rootMargin: '-35% 0px -35% 0px' })
    const watch = () => list.querySelectorAll('.ayah-card[data-sajdah]').forEach(el => io.observe(el))
    watch()
    const mo = new MutationObserver(watch)
    mo.observe(list, { childList: true })
    return () => { io.disconnect(); mo.disconnect(); timers.forEach(clearTimeout) }
  }, [listRef, surah]) // eslint-disable-line react-hooks/exhaustive-deps

  // Qiraət səcdə ayəsinə çatanda
  useEffect(() => {
    if (!activeAyah) return
    const el = listRef?.current?.querySelector(`.ayah-card[data-ayah="${activeAyah}"][data-sajdah]`)
    if (el) show(activeAyah)
  }, [activeAyah]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined
    btnRef.current?.focus({ preventScroll: true })
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  const hisnLang = dua?.lang || 'en'
  return createPortal(
    <div className="sjm" role="dialog" aria-modal="true" aria-labelledby="sjm-title" data-testid="sajdah-moment" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null) }}>
      <div className="sjm__halo" aria-hidden="true"><i /><i /><i /></div>
      <div className="sjm__card">
        <span className="sjm__glyph" aria-hidden="true">۩</span>
        <h2 id="sjm-title" className="sjm__title">{t.title}</h2>
        <p className="sjm__ref ui-num">{surah}:{open}</p>
        <p className="sjm__lead">{t.lead}</p>
        {dua && (
          <figure className="sjm__dua">
            <figcaption>{t.dua}</figcaption>
            <p className="sjm__ar" lang="ar" dir="rtl">{dua.ar}</p>
            {dua.text && <p className="sjm__tr" lang={hisnLang}>{dua.text}</p>}
            {dua.src && <small className="sjm__src">{dua.src}</small>}
          </figure>
        )}
        <div className="sjm__btns">
          <button type="button" ref={btnRef} className="ui-btn ui-btn--primary" onClick={() => setOpen(null)} data-testid="sajdah-close">{t.go}</button>
          <a className="ui-btn ui-btn--ghost" href={`${pathFor('hisn', lang)}#hs-${HISN_CH}`}><Icon name="hisn" className="ui-btn__icon" />{t.open}</a>
        </div>
      </div>
    </div>,
    document.body,
  )
}
