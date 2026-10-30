// ═══ Günün xatırlatmaları — ana səhifənin yuxarısındakı sakit zolaq ═══
// Üzən kartlar və toast-lar əvəzinə: günün ayəsi, hədisi, duası və zikri
// bir zolaqda, növbə ilə (8 saniyədən bir) göstərilir.
//
// QAYDALAR:
//   • Mətnlər YALNIZ repo məlumatından (src/data/*.js) və admin panelin
//     "Günün məzmunu" bölməsindən gəlir — olduğu kimi, mənbəsi ilə.
//     Qısaltma yalnız vizualdır (CSS ellipsis); mətnə klik tam mətni açır.
//   • Seçim təqvim gününə bağlıdır (yerli vaxtla epoxadan keçən günlər) —
//     o gün bütün ziyarətçilər, hansı dildə olursa olsun, eyni dördlüyü görür.
//   • Zolaq üzmür, sabit deyil — səhifə axınındadır və hündürlüyü
//     CSS-də (--drb-h) sabitdir, yəni heç nəyin üstünə düşmür.
//
// Ana səhifədə React.lazy ilə yüklənir; fallback: DailyReminderBarSkeleton.
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
// PERFORMANS: bütöv QUOTES/DUAS_DATA əvəzinə build zamanı hesablanmış hovuzlar
// (vite.config.js → dailyPoolsPlugin, qayda: src/utils/dailyPools.js) —
// ana səhifədə ~72 KB gzip əvəzinə ~40 KB, quotes/duas chunk-ları yüklənmir.
import { AYAH_POOL, HADITH_POOL, DUA_POOL } from 'virtual:daily-pools'
import { DHIKRS } from '../data/dhikr'
// PERFORMANS: adminContent (→ Firebase SDK, ~90 KB gzip) statik import edilmir —
// zolaq ana səhifənin ən yuxarısındadır və onun chunk-ı ilk ekranda lazımdır;
// admin "Günün məzmunu" abunəliyi "load"-dan sonra, boş vaxtda başlayır
// (utils/idle.js). Zolaq o vaxta qədər repo məlumatı ilə göstərilir (əvvəlki
// kimi — Firebase cavabı onsuz da şəbəkədən sonra gəlirdi); hündürlüyü sabitdir.
import { whenIdle } from '../utils/idle'
import { filled, tr } from '../config/brand'
import { localizeSource } from '../utils/sourceNames'
import { isDailyBarHiddenToday, hideDailyBarForToday } from './DailyReminderBarSkeleton'
import '../styles/DailyReminderBar.css'

const ROTATE_MS = 8000

const LABELS = {
  az: {
    region: 'Günün xatırlatmaları',
    chip: { ayah: 'Günün ayəsi', hadith: 'Günün hədisi', dua: 'Günün duası', dhikr: 'Günün zikri' },
    more: { quran: 'Qurana keç', hadith: 'Hədislərə keç', duas: 'Dualara keç', dhikr: 'Zikr sayğacına keç' },
    prev: 'Əvvəlki', next: 'Növbəti', close: 'Bu gün üçün gizlət',
    expand: 'Tam mətni göstər', collapse: 'Qısalt',
  },
  en: {
    region: 'Today’s reminders',
    chip: { ayah: 'Daily verse', hadith: 'Daily hadith', dua: 'Daily dua', dhikr: 'Daily dhikr' },
    more: { quran: 'Open the Quran', hadith: 'More hadiths', duas: 'More duas', dhikr: 'Open dhikr counter' },
    prev: 'Previous', next: 'Next', close: 'Hide for today',
    expand: 'Show full text', collapse: 'Show less',
  },
  ru: {
    region: 'Напоминания дня',
    chip: { ayah: 'Аят дня', hadith: 'Хадис дня', dua: 'Дуа дня', dhikr: 'Зикр дня' },
    more: { quran: 'Открыть Коран', hadith: 'Больше хадисов', duas: 'Больше дуа', dhikr: 'Открыть счётчик зикра' },
    prev: 'Предыдущее', next: 'Следующее', close: 'Скрыть на сегодня',
    expand: 'Показать полностью', collapse: 'Свернуть',
  },
  ar: {
    region: 'تذكيرات اليوم',
    chip: { ayah: 'آية اليوم', hadith: 'حديث اليوم', dua: 'دعاء اليوم', dhikr: 'ذكر اليوم' },
    more: { quran: 'افتح القرآن', hadith: 'المزيد من الأحاديث', duas: 'المزيد من الأدعية', dhikr: 'افتح عداد الذكر' },
    prev: 'السابق', next: 'التالي', close: 'إخفاء لهذا اليوم',
    expand: 'عرض النص كاملاً', collapse: 'عرض أقل',
  },
  tr: {
    region: 'Günün hatırlatmaları',
    chip: { ayah: 'Günün ayeti', hadith: 'Günün hadisi', dua: 'Günün duası', dhikr: 'Günün zikri' },
    more: { quran: 'Kur’an’a git', hadith: 'Daha fazla hadis', duas: 'Daha fazla dua', dhikr: 'Zikir sayacına git' },
    prev: 'Önceki', next: 'Sonraki', close: 'Bugün için gizle',
    expand: 'Tam metni göster', collapse: 'Daralt',
  },
}

// ── Seçim məntiqi (saf funksiyalar — node ilə yoxlanıla bilər) ──

/** Yerli təqvim günü üzrə epoxadan keçən günlərin sayı */
export function dayNumber(d = new Date()) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}

// Hovuzlar (AYAH_POOL, HADITH_POOL, DUA_POOL) build zamanı qurulur — qayda
// (filtr, qısalıq həddi 140/100/140, data faylındakı sıra) src/utils/dailyPools.js-dədir.

const pick = (pool, day, offset = 0) =>
  pool.length ? pool[(((day + offset) % pool.length) + pool.length) % pool.length] : null

/**
 * Admin mətni cari dildə. Ərəb dilində başqa dilə düşmürük (ərəbcə orijinal
 * onsuz da göstərilir); admin "ərəbcə tərcümə"yə orijinalın özünü yazıbsa, təkrarlamırıq.
 */
const str = (v) => (typeof v === 'string' ? v.trim() : '')
const textFor = (obj, lang, original = '') => {
  if (lang !== 'ar') return str(tr(obj, lang))
  const t = str(obj?.ar)
  return t && t !== str(original) ? t : ''
}

/**
 * Günün 4 elementi.
 * @param {string} lang
 * @param {number} day   — dayNumber()
 * @param {object|null} admin — admin "Günün məzmunu" sənədi (subscribeToDailyContent)
 * @returns {{type,page,ar,name,text,source}[]}
 */
export function buildDailyItems(lang, day, admin) {
  const items = []

  // 1) Günün ayəsi — admin doldurubsa onu, yoxsa QUOTES (cat: 'quran').
  //    Admin yalnız başqa dildə doldurubsa və bu dildə göstəriləcək heç nə yoxdursa — repo məlumatı.
  const aa = admin?.ayah
  const adminAyah = aa && (filled(aa.ar) || filled(aa.text))
    ? { type: 'ayah', page: 'quran', ar: str(aa.ar), name: '', text: textFor(aa.text, lang, aa.ar), source: str(aa.source) }
    : null
  if (adminAyah && (adminAyah.ar || adminAyah.text)) {
    items.push(adminAyah)
  } else {
    const q = pick(AYAH_POOL, day)
    if (q) items.push({ type: 'ayah', page: 'quran', ar: q.ar, name: '', text: lang === 'ar' ? '' : (q.text[lang] || q.text.en), source: q.source })
  }

  // 2) Günün hədisi — QUOTES (cat: 'hadith'), mənbəsi ilə
  const h = pick(HADITH_POOL, day, 1)
  if (h) items.push({ type: 'hadith', page: 'hadith', ar: h.ar, name: '', text: lang === 'ar' ? '' : (h.text[lang] || h.text.en), source: h.source })

  // 3) Günün duası — DUAS_DATA
  const d = pick(DUA_POOL, day, 2)
  if (d) items.push({ type: 'dua', page: 'duas', ar: d.ar, name: '', text: lang === 'ar' ? '' : (d[lang] || d.en), source: d.source })

  // 4) Günün zikri — admin doldurubsa onu, yoxsa DHIKRS (fəzilətin mənbəyi data/dhikr.js-dəki source sahəsidir)
  const ad = admin?.dhikr
  const adminDhikr = ad && (filled(ad.ar) || filled(ad.translit))
    ? { type: 'dhikr', page: 'dhikr', ar: str(ad.ar), name: lang === 'ar' ? '' : str(ad.translit), text: textFor(ad.text, lang, ad.ar), source: '' }
    : null
  if (adminDhikr && (adminDhikr.ar || adminDhikr.name || adminDhikr.text)) {
    items.push(adminDhikr)
  } else {
    const z = pick(DHIKRS, day, 3)
    if (z) items.push({
      type: 'dhikr', page: 'dhikr', ar: z.arabic,
      // ərəb dilində ad elə ərəbcə zikrin özüdür — təkrar etmirik
      name: lang === 'ar' ? '' : (z[lang] || z.en),
      text: z.virtue?.[lang] || z.virtue?.en || '',
      source: z.source || '',
    })
  }

  return items
}

// ── Hook-lar ──

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => {
    try { return window.matchMedia(query).matches } catch { return false }
  })
  useEffect(() => {
    let mql
    try { mql = window.matchMedia(query) } catch { return undefined }
    const onChange = (e) => setReduced(e.matches)
    if (mql.addEventListener) mql.addEventListener('change', onChange)
    else if (mql.addListener) mql.addListener(onChange)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange)
      else if (mql.removeListener) mql.removeListener(onChange)
    }
  }, [])
  return reduced
}

// ── İkonlar (dekorativ) ──
const Chevron = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Cross = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

export default function DailyReminderBar({ setPage }) {
  const { lang } = useLang()
  const L = LABELS[lang] || LABELS.en
  const isAr = lang === 'ar'

  const [hidden, setHidden] = useState(isDailyBarHiddenToday)
  const [day, setDay] = useState(dayNumber)
  const [admin, setAdmin] = useState(null)
  const [idx, setIdx] = useState(0)
  const [open, setOpen] = useState(false)       // tam mətn açıqdır
  const [hover, setHover] = useState(false)
  const [focused, setFocused] = useState(false)
  const [manual, setManual] = useState(false)   // istifadəçi özü keçid edibsə, avtomatik dönmə dayanır
  const [announce, setAnnounce] = useState('')  // ekran oxuyucu üçün (yalnız əl ilə keçiddə)
  const [dir, setDir] = useState('fwd')         // keçidin istiqaməti — yeni mətn o tərəfdən sürüşüb gəlir
  const [touching, setTouching] = useState(false) // barmaq zolaqdadır — dönmə dayanır (çəkərkən mətn dəyişməsin)
  const reduced = usePrefersReducedMotion()
  const touch = useRef(null)
  const rootRef = useRef(null)
  const bodyInRef = useRef(null)                // barmaqla çəkərkən mətni izlətmək üçün
  const dragRaf = useRef(0)

  // Admin "Günün məzmunu" — Firebase yoxdursa DEFAULT (boş) qaytarır
  useEffect(() => {
    let unsub = () => {}
    let alive = true
    whenIdle()
      .then(() => import('../data/adminContent'))
      .then(({ subscribeToDailyContent }) => {
        if (!alive) return
        try {
          const u = subscribeToDailyContent((data) => setAdmin(data || null))
          if (typeof u === 'function') unsub = u
        } catch { /* Firebase əlçatan deyil — repo məlumatı ilə davam */ }
      })
      .catch(() => { /* chunk yüklənmədi — repo məlumatı ilə davam */ })
    return () => { alive = false; try { unsub() } catch { /* */ } }
  }, [])

  // Səhifə gecə yarısından sonra yenidən açılarsa — yeni günün dördlüyü
  useEffect(() => {
    const onVis = () => { if (!document.hidden) setDay(dayNumber()) }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const items = useMemo(() => buildDailyItems(lang, day, admin), [lang, day, admin])
  const count = items.length
  const cur = items[count ? idx % count : 0]

  // Avtomatik dönmə: hover/fokus/toxunuş/tam mətn/azaldılmış hərəkət zamanı dayanır
  const autoRotate = count > 1 && !reduced && !hover && !focused && !touching && !open && !manual && !hidden
  useEffect(() => {
    if (!autoRotate) return undefined
    const t = setInterval(() => { setDir('fwd'); setIdx(i => (i + 1) % count) }, ROTATE_MS)
    return () => clearInterval(t)
  }, [autoRotate, count])

  // Çəkmə kadrı ləğv edilməmiş qalmasın
  useEffect(() => () => cancelAnimationFrame(dragRaf.current), [])

  /**
   * @param {number} next — hədəf indeks (dairəvi)
   * @param {'fwd'|'back'} [hint] — istiqamət; verilməyibsə indekslərin fərqindən
   */
  const goTo = useCallback((next, hint) => {
    if (!count) return
    const n = ((next % count) + count) % count
    const curI = idx % count
    if (n !== curI) setDir(hint || (n > curI ? 'fwd' : 'back'))
    setIdx(n)
    setOpen(false)
    setManual(true)
    const it = items[n]
    if (it) {
      const txt = [it.name, it.text || it.ar].filter(Boolean).join(' — ')
      setAnnounce(`${L.chip[it.type]}: ${txt}${it.source ? ` — ${localizeSource(it.source, lang)}` : ''}`)
    }
  }, [count, idx, items, L, lang])

  const onClose = () => {
    hideDailyBarForToday()
    setHidden(true)
  }

  // ── Mobil sürüşdürmə (RTL-də istiqamət tərsdir) ──
  // Üfüqi hərəkət aydın olanda mətn barmağı izləyir (requestAnimationFrame,
  // yalnız transform/opacity); 40px-dən çox çəkilibsə növbəti/əvvəlki
  // element gəlir, yoxsa mətn yumşaq yerinə qayıdır. Şaquli hərəkət
  // (səhifənin sürüşməsi) toxunulmur. "Hərəkəti azalt"da mətn izləmir.
  const setDrag = (dx) => {
    cancelAnimationFrame(dragRaf.current)
    dragRaf.current = requestAnimationFrame(() => {
      const el = bodyInRef.current
      if (!el) return
      el.style.transition = 'none'
      el.style.transform = `translate3d(${Math.round(dx * 0.55)}px, 0, 0)`
      el.style.opacity = String(1 - Math.min(Math.abs(dx) / 320, 0.45))
    })
  }
  const springBack = () => {
    cancelAnimationFrame(dragRaf.current)
    const el = bodyInRef.current
    if (!el || !el.style.transform) return
    el.style.transition = 'transform var(--dur-2) var(--ease-out), opacity var(--dur-2) var(--ease-out)'
    el.style.transform = ''
    el.style.opacity = ''
  }
  const onTouchStart = (e) => {
    const t = e.touches?.[0]
    if (t) touch.current = { x: t.clientX, y: t.clientY, axis: null }
    setTouching(true)
  }
  const onTouchMove = (e) => {
    const s = touch.current
    const t = e.touches?.[0]
    if (!s || !t || reduced) return
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (!s.axis) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) s.axis = 'x'
      else if (Math.abs(dy) > 8) s.axis = 'y'
    }
    if (s.axis === 'x') setDrag(dx)
  }
  const onTouchEnd = (e) => {
    const s = touch.current
    touch.current = null
    setTouching(false)
    const t = e.changedTouches?.[0]
    if (!s || !t) { springBack(); return }
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) { springBack(); return }
    const forward = isAr ? dx > 0 : dx < 0
    // Köhnə mətn yığışdırılır, yenisi (key dəyişir) öz animasiyası ilə gəlir
    cancelAnimationFrame(dragRaf.current)
    goTo(idx + (forward ? 1 : -1), forward ? 'fwd' : 'back')
  }
  const onTouchCancel = () => {
    touch.current = null
    setTouching(false)
    springBack()
  }

  const onBlur = (e) => {
    if (!rootRef.current?.contains(e.relatedTarget)) setFocused(false)
  }

  if (hidden || !cur) return null

  const cls = [
    'drb',
    `drb--${cur.type}`,
    open ? 'drb--open' : '',
    isAr ? 'drb--ar' : '',
    (cur.name || cur.text) ? '' : 'drb--notx',
  ].filter(Boolean).join(' ')

  // Mənbə data fayllarında Azərbaycan yazılışındadır — dilə çevrilir ("القرآن 112:2")
  const source = localizeSource(cur.source, lang)
  const fullTitle = [cur.ar, [cur.name, cur.text].filter(Boolean).join(' — '), source && `— ${source}`]
    .filter(Boolean).join('\n')

  return (
    <div className="drb-wrap">
      <div
        ref={rootRef}
        className={cls}
        role="region"
        aria-label={L.region}
        data-rotating={autoRotate ? 'on' : 'off'}
        data-dir={dir}
        style={{ '--drb-rotate': `${ROTATE_MS}ms` }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        onKeyDown={(e) => { if (e.key === 'Escape' && open) setOpen(false) }}
      >
        <span key={`c${idx}`} className="drb-chip drb-anim">
          <span className="drb-chip-dot" aria-hidden="true" />
          {L.chip[cur.type]}
        </span>

        <button
          type="button"
          className="drb-body"
          aria-expanded={open}
          title={open ? L.collapse : fullTitle}
          onClick={() => setOpen(o => !o)}
        >
          <span key={`b${idx}-${lang}`} ref={bodyInRef} className="drb-body-in drb-anim">
            {cur.ar && <span className="drb-ar" dir="rtl" lang="ar">{cur.ar}</span>}
            {(cur.name || cur.text) && (
              <span className="drb-tx">
                {cur.name && <strong className="drb-name">{cur.name}</strong>}
                {cur.name && cur.text && <span className="drb-sep" aria-hidden="true"> · </span>}
                {cur.text}
              </span>
            )}
          </span>
          <span className="drb-visually-hidden">{open ? L.collapse : L.expand}</span>
        </button>

        {source && (
          <span key={`s${idx}`} className="drb-src drb-anim">— {source}</span>
        )}

        <div className="drb-ctl">
          <button type="button" className="drb-btn drb-nav drb-prev" aria-label={L.prev} onClick={() => goTo(idx - 1, 'back')}>
            <Chevron />
          </button>
          <div className="drb-dots">
            {items.map((it, i) => (
              <button
                key={it.type}
                type="button"
                className={`drb-btn drb-dot ${i === idx % count ? 'is-active' : ''}`}
                aria-label={L.chip[it.type]}
                aria-current={i === idx % count ? 'true' : undefined}
                onClick={() => goTo(i)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
          <button type="button" className="drb-btn drb-nav drb-next" aria-label={L.next} onClick={() => goTo(idx + 1, 'fwd')}>
            <Chevron />
          </button>
        </div>

        <button type="button" className="drb-btn drb-close" aria-label={L.close} title={L.close} onClick={onClose}>
          <Cross />
        </button>

        {open && typeof setPage === 'function' && (
          <button type="button" className="drb-more" onClick={() => setPage(cur.page)}>
            {L.more[cur.page]} <Icon name="arrow" size={15} className="drb-more-arrow ui-flip-rtl" />
          </button>
        )}

        {/* Avtomatik dönmə elan edilmir (səs-küy olmasın) — yalnız istifadəçi keçid edəndə */}
        <div className="drb-visually-hidden" aria-live="polite" aria-atomic="true">{announce}</div>
      </div>
    </div>
  )
}
