// ═══════════════════════════════════════════════════════
// CityPicker — namaz vaxtlarının şəhərini seçən axtarışlı seçici
//
// • Seçim bütün saytda ortaqdır: utils/prayerLocation → setPrayerCity
//   (ana səhifənin kartı, /prayer, /jamaat, /qibla və push bildirişləri).
// • Yazdıqca süzür — diakritikasız və 5 dildə ("seki" → Şəki, "gence" → Gəncə,
//   "шеки", "شكي" …). Qruplar: Son seçilənlər · Azərbaycan · Dünya.
// • "Mənim yerim" — geolocation → siyahıdakı ən yaxın şəhər (≤ 25 km),
//   uzaqdırsa dəqiq koordinat (brauzerin saat qurşağı ilə).
// • "Başqa şəhər axtar" — Open-Meteo geocoding: dünyanın istənilən şəhəri
//   (cari dildə); seçiləndə koordinat + saat qurşağı xüsusi yer kimi yazılır.
// • Əlçatanlıq: WAI-ARIA 1.2 combobox — input role="combobox", siyahı
//   role="listbox" (qruplar role="group"), aktiv sətir aria-activedescendant;
//   ↑ ↓ Home End Enter Esc. Nəticə sayı ekran oxuyucusuna elan olunur.
// • Telefonda (< 640px) alt vərəq, kompüterdə düymənin altında açılan panel.
//
// İstifadə:
//   <CityPicker />                                   — standart düymə (sancaq + şəhər + ox)
//   <CityPicker variant="inline" />                  — mətn içində şəhər adı (link kimi)
//   <CityPicker label="Şəhəri dəyiş" variant="inline" />
//   <CityPicker renderTrigger={(props, { cityName }) => <button {...props}>…</button>} />
//   onSelect(loc) — seçimdən sonra (loc = getPrayerLocation())
// ═══════════════════════════════════════════════════════

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLang } from '../contexts/LangContext'
import {
  PRAYER_CITIES, COUNTRY_NAMES, usePrayerLocation, setPrayerCity, getPrayerLocation, getRecentPlaces,
  searchCities, nearestCity, searchWorldPlaces, worldPlaceLabels,
} from '../utils/prayerLocation'
import { exitDelay } from '../utils/promptCoordinator'
import { haptic } from '../hooks/useHaptic'
import Icon from './Icon'
import '../styles/CityPicker.css'

const TXT = {
  az: {
    title: 'Şəhər seçin', change: 'Şəhəri dəyiş', placeholder: 'Şəhər axtarın…', close: 'Bağla',
    myLoc: 'Mənim yerim', myLocSub: 'Ən yaxın şəhəri tap', locating: 'Yer təyin edilir…',
    geoError: 'Yer tapılmadı. Brauzerdə məkan icazəsi verin.',
    recent: 'Son seçilənlər', world: 'Dünya', results: 'Axtarış nəticələri',
    searchWorld: (q) => `Başqa şəhər axtar: «${q}»`, searchWorldSub: 'Dünyanın istənilən şəhəri',
    searching: 'Axtarılır…', none: 'Siyahıda tapılmadı', worldNone: 'Heç nə tapılmadı',
    netError: 'Axtarış alınmadı. İnterneti yoxlayın.', selected: 'seçilib',
    count: (n) => `${n} nəticə`, hint: 'Siyahıda yoxdursa, adını yazın — dünyada axtararıq.',
  },
  en: {
    title: 'Choose a city', change: 'Change city', placeholder: 'Search for a city…', close: 'Close',
    myLoc: 'My location', myLocSub: 'Find the nearest city', locating: 'Locating…',
    geoError: 'Couldn’t get your location. Allow location access in the browser.',
    recent: 'Recent', world: 'World', results: 'Search results',
    searchWorld: (q) => `Search other cities: “${q}”`, searchWorldSub: 'Any city in the world',
    searching: 'Searching…', none: 'Not in the list', worldNone: 'Nothing found',
    netError: 'Search failed. Check your connection.', selected: 'selected',
    count: (n) => `${n} results`, hint: 'Not in the list? Type its name and we’ll search the world.',
  },
  ru: {
    title: 'Выберите город', change: 'Сменить город', placeholder: 'Поиск города…', close: 'Закрыть',
    myLoc: 'Моё местоположение', myLocSub: 'Найти ближайший город', locating: 'Определяем местоположение…',
    geoError: 'Не удалось определить местоположение. Разрешите доступ в браузере.',
    recent: 'Недавние', world: 'Мир', results: 'Результаты поиска',
    searchWorld: (q) => `Искать другой город: «${q}»`, searchWorldSub: 'Любой город мира',
    searching: 'Поиск…', none: 'В списке нет', worldNone: 'Ничего не найдено',
    netError: 'Поиск не удался. Проверьте подключение.', selected: 'выбран',
    count: (n) => `Найдено: ${n}`, hint: 'Нет в списке? Введите название — найдём по всему миру.',
  },
  ar: {
    title: 'اختر المدينة', change: 'تغيير المدينة', placeholder: 'ابحث عن مدينة…', close: 'إغلاق',
    myLoc: 'موقعي', myLocSub: 'ابحث عن أقرب مدينة', locating: 'جارٍ تحديد الموقع…',
    geoError: 'تعذّر تحديد موقعك. اسمح بالوصول إلى الموقع في المتصفح.',
    recent: 'المختارة مؤخرًا', world: 'العالم', results: 'نتائج البحث',
    searchWorld: (q) => `ابحث عن مدينة أخرى: «${q}»`, searchWorldSub: 'أي مدينة في العالم',
    searching: 'جارٍ البحث…', none: 'غير موجودة في القائمة', worldNone: 'لا توجد نتائج',
    netError: 'تعذّر البحث. تحقّق من الاتصال.', selected: 'محدّدة',
    count: (n) => `النتائج: ${n}`, hint: 'ليست في القائمة؟ اكتب اسمها وسنبحث في العالم كله.',
  },
  tr: {
    title: 'Şehir seçin', change: 'Şehri değiştir', placeholder: 'Şehir arayın…', close: 'Kapat',
    myLoc: 'Konumum', myLocSub: 'En yakın şehri bul', locating: 'Konum belirleniyor…',
    geoError: 'Konum alınamadı. Tarayıcıda konum izni verin.',
    recent: 'Son seçilenler', world: 'Dünya', results: 'Arama sonuçları',
    searchWorld: (q) => `Başka şehir ara: “${q}”`, searchWorldSub: 'Dünyadaki herhangi bir şehir',
    searching: 'Aranıyor…', none: 'Listede bulunamadı', worldNone: 'Sonuç bulunamadı',
    netError: 'Arama başarısız. Bağlantınızı kontrol edin.', selected: 'seçili',
    count: (n) => `${n} sonuç`, hint: 'Listede yoksa adını yazın, dünyada arayalım.',
  },
}

// "Mənim yerim" siyahıdakı şəhərdən uzaqdırsa xüsusi yerin adı (server bildirişdə yazır)
const MY_PLACE_LABEL = { az: 'Mənim yerim', en: 'My location', ru: 'Моё местоположение', ar: 'موقعي', tr: 'Konumum' }
const NEAR_KM = 25
const SHEET_MQ = '(max-width: 639.98px)'

const countryName = (cc, lang) => COUNTRY_NAMES[cc]?.[lang] || ''
const sameSpot = (a, b) => Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lng - b.lng) < 0.01

export default function CityPicker({ variant = 'field', label, className = '', renderTrigger, onSelect, triggerId }) {
  const { lang } = useLang()
  const t = TXT[lang] || TXT.en
  const loc = usePrayerLocation()
  const uid = useId().replace(/:/g, '')
  const listId = `cp-list-${uid}`
  const titleId = `cp-title-${uid}`
  const cityName = loc.city?.[lang] || loc.city?.en || ''

  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [pos, setPos] = useState(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [geo, setGeo] = useState('idle')            // idle | loading | error
  const [world, setWorld] = useState({ status: 'idle', q: '', items: [] })   // idle | loading | done | error
  const [busyKey, setBusyKey] = useState(null)      // dünya yerinin adları yüklənir
  const [recent, setRecent] = useState([])

  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const closeRef = useRef(null)
  const worldCtrl = useRef(null)
  const closeTimer = useRef(null)

  // ── Açma / bağlama ──
  const openPicker = useCallback(() => {
    clearTimeout(closeTimer.current)
    let isSheet = false
    try { isSheet = window.matchMedia(SHEET_MQ).matches } catch { /* köhnə brauzer */ }
    setSheet(isSheet)
    setQuery('')
    setActive(0)
    setGeo('idle')
    setWorld({ status: 'idle', q: '', items: [] })
    setRecent(getRecentPlaces())
    setLeaving(false)
    setOpen(true)
  }, [])

  const closePicker = useCallback((returnFocus = true) => {
    worldCtrl.current?.abort()
    setLeaving(true)
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => { setOpen(false); setLeaving(false) }, exitDelay(sheet ? 240 : 200))
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true })
  }, [sheet])

  useEffect(() => () => { clearTimeout(closeTimer.current); worldCtrl.current?.abort() }, [])

  // ── Kompüterdə panelin yeri: düymənin altında (yer yoxdursa üstündə) ──
  const place = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth, vh = window.innerHeight
    const width = Math.min(400, vw - 16)
    const rtl = document.documentElement.dir === 'rtl'
    let left = rtl ? r.right - width : r.left
    left = Math.max(8, Math.min(left, vw - width - 8))
    const below = vh - r.bottom - 14, above = r.top - 14
    const up = below < 340 && above > below
    const maxH = Math.min(520, Math.max(220, up ? above : below))
    setPos(up ? { left, width, bottom: vh - r.top + 6, maxH } : { left, width, top: r.bottom + 6, maxH })
  }, [])

  useLayoutEffect(() => {
    if (!open || sheet) return undefined
    place()
    let raf = 0
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place) }
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onMove); window.removeEventListener('scroll', onMove, true) }
  }, [open, sheet, place])

  // Açılanda axtarış sahəsinə fokus; telefonda arxadakı səhifə sürüşməsin
  useEffect(() => {
    if (!open) return undefined
    const id = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
    let prevOverflow
    if (sheet) { prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden' }
    return () => { cancelAnimationFrame(id); if (sheet) document.body.style.overflow = prevOverflow || '' }
  }, [open, sheet])

  // Kənara klik — bağla (kompüter paneli; telefonda arxa fon özü bağlayır)
  useEffect(() => {
    if (!open || leaving) return undefined
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return
      closePicker(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [open, leaving, closePicker])

  // ── Seçim ──
  const finish = useCallback(() => {
    haptic()
    closePicker(true)
    onSelect?.(getPrayerLocation())
  }, [closePicker, onSelect])

  const chooseCity = useCallback((id) => { setPrayerCity(id); finish() }, [finish])
  const choosePlace = useCallback((p) => { setPrayerCity(p); finish() }, [finish])

  const chooseWorld = useCallback(async (item) => {
    if (busyKey) return
    setBusyKey(`w-${item.gid}`)
    let labelAll = { [lang]: item.name }
    try { labelAll = await worldPlaceLabels(item, lang) } catch { /* əsas ad qalır */ }
    setBusyKey(null)
    choosePlace({ lat: item.lat, lng: item.lng, tz: item.tz, label: labelAll, name: item.name, country: item.country })
  }, [busyKey, lang, choosePlace])

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { setGeo('error'); return }
    setGeo('loading')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: lat, longitude: lng } = p.coords
        const near = nearestCity(lat, lng)
        setGeo('idle')
        if (near && near.km <= NEAR_KM) chooseCity(near.city.id)
        else choosePlace({ lat, lng, label: MY_PLACE_LABEL, country: near?.km < 300 ? near.city.country : '' })
      },
      () => setGeo('error'),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 },
    )
  }, [chooseCity, choosePlace])

  // ── Dünya axtarışı (Open-Meteo) ──
  const runWorld = useCallback((q) => {
    const text = q.trim()
    if (text.length < 2) return
    worldCtrl.current?.abort()
    const ctrl = new AbortController()
    worldCtrl.current = ctrl
    setWorld({ status: 'loading', q: text, items: [] })
    searchWorldPlaces(text, lang, ctrl.signal)
      .then(items => { if (!ctrl.signal.aborted) setWorld({ status: 'done', q: text, items }) })
      .catch(() => { if (!ctrl.signal.aborted) setWorld({ status: 'error', q: text, items: [] }) })
  }, [lang])

  const q = query.trim()
  const local = useMemo(() => (q ? searchCities(q) : PRAYER_CITIES), [q])

  // Siyahıda heç nə yoxdursa dünya axtarışı özü başlayır (gecikmə ilə)
  useEffect(() => {
    if (!open || q.length < 3 || local.length > 0) return undefined
    if (world.q === q && world.status !== 'idle') return undefined
    const id = setTimeout(() => runWorld(q), 400)
    return () => clearTimeout(id)
  }, [open, q, local.length, world.q, world.status, runWorld])

  // ── Seçimlər (düz siyahı — klaviatura bununla işləyir) və qruplar ──
  const { groups, flat } = useMemo(() => {
    const gs = []
    const isCur = (c) => !loc.isCustom && loc.id === c.id
    const cityOpt = (c, prefix) => ({
      key: `${prefix}-${c.id}`, kind: 'city', id: c.id, name: c.label[lang] || c.label.en,
      sub: c.country !== 'AZ' ? countryName(c.country, lang) : '', current: isCur(c),
    })
    if (!q) {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        gs.push({ key: 'geo', items: [{
          key: 'geo', kind: 'geo', name: t.myLoc,
          sub: geo === 'loading' ? t.locating : geo === 'error' ? t.geoError : t.myLocSub, icon: 'compass',
        }] })
      }
      const rec = recent.map(r => (r.place
        ? { key: `r-p-${r.place.lat},${r.place.lng}`, kind: 'place', place: r.place,
            name: r.place.label[lang] || r.place.label.en, sub: countryName(r.place.country, lang),
            current: loc.isCustom && sameSpot(loc, r.place) }
        : cityOpt(r.city, 'r')))
      if (rec.length) gs.push({ key: 'recent', label: t.recent, items: rec })
    }
    const az = local.filter(c => c.country === 'AZ').map(c => cityOpt(c, 'c'))
    const ww = local.filter(c => c.country !== 'AZ').map(c => cityOpt(c, 'c'))
    if (az.length) gs.push({ key: 'az', label: COUNTRY_NAMES.AZ[lang] || COUNTRY_NAMES.AZ.en, items: az })
    if (ww.length) gs.push({ key: 'world', label: t.world, items: ww })
    if (q.length >= 2) {
      const searched = world.q === q && world.status === 'done'
      if (searched && world.items.length) {
        gs.push({ key: 'results', label: t.results, items: world.items.map(w => ({
          key: `w-${w.gid}`, kind: 'world', item: w, name: w.name,
          sub: [w.region, w.countryName].filter(Boolean).join(', '),
          current: loc.isCustom && sameSpot(loc, w),
        })) })
      } else if (!(searched || (world.q === q && world.status === 'loading'))) {
        gs.push({ key: 'search', items: [{ key: 'searchWorld', kind: 'searchWorld', name: t.searchWorld(q), sub: t.searchWorldSub, icon: 'globe' }] })
      }
    }
    return { groups: gs, flat: gs.flatMap(g => g.items) }
  }, [q, local, recent, loc, lang, t, geo, world])

  // Aktiv sətir siyahı dəyişəndə sərhəddən çıxmasın; sorğu dəyişəndə əvvələ qayıt
  useEffect(() => { setActive(0) }, [q])
  useEffect(() => { setActive(a => Math.min(a, Math.max(0, flat.length - 1))) }, [flat.length])
  // Dünya nəticələri gələndə birincisi aktiv olsun
  useEffect(() => {
    if (world.status !== 'done' || !world.items.length) return
    const i = flat.findIndex(o => o.kind === 'world')
    if (i >= 0) setActive(i)
  }, [world.status, world.items, flat])

  // Aktiv sətir görünən sahədə qalsın
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`)
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [active, open])

  // Açılanda seçilmiş şəhər görünsün (siyahının ortasında da ola bilər)
  useEffect(() => {
    if (!open || q) return
    const id = requestAnimationFrame(() => {
      const el = listRef.current?.querySelector('.cp-opt.is-current')
      if (el && listRef.current) {
        const box = listRef.current
        if (el.offsetTop > box.clientHeight - 60) box.scrollTop = el.offsetTop - box.clientHeight / 2
      }
    })
    return () => cancelAnimationFrame(id)
    // yalnız açılış anında
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const activate = (opt) => {
    if (!opt) return
    if (opt.kind === 'city') chooseCity(opt.id)
    else if (opt.kind === 'place') choosePlace(opt.place)
    else if (opt.kind === 'world') chooseWorld(opt.item)
    else if (opt.kind === 'geo') locateMe()
    else if (opt.kind === 'searchWorld') runWorld(q)
  }

  const onKeyDown = (e) => {
    const n = flat.length
    if (e.key === 'ArrowDown') { e.preventDefault(); if (n) setActive(a => (a + 1) % n) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) setActive(a => (a - 1 + n) % n) }
    else if (e.key === 'Home' && !query) { e.preventDefault(); setActive(0) }
    else if (e.key === 'End' && !query) { e.preventDefault(); setActive(Math.max(0, n - 1)) }
    else if (e.key === 'PageDown') { e.preventDefault(); if (n) setActive(a => Math.min(n - 1, a + 8)) }
    else if (e.key === 'PageUp') { e.preventDefault(); if (n) setActive(a => Math.max(0, a - 8)) }
    else if (e.key === 'Enter') { e.preventDefault(); activate(flat[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePicker(true) }
    else if (e.key === 'Tab') {
      // Telefon vərəqində fokus içəridə qalsın (input ↔ bağla düyməsi);
      // kompüterdə Tab paneli bağlayır və fokusu düyməyə qaytarır
      e.preventDefault()
      if (sheet) closeRef.current?.focus()
      else closePicker(true)
    }
  }

  // Ekran oxuyucusu üçün vəziyyət
  const status = world.q === q && world.status === 'loading' ? t.searching
    : world.q === q && world.status === 'error' ? t.netError
    : geo === 'loading' ? t.locating
    : geo === 'error' ? t.geoError
    : q ? (local.length || world.items.length ? t.count(local.length + (world.q === q ? world.items.length : 0)) : t.none)
    : ''

  const activeId = flat[active] ? `${listId}-${active}` : undefined

  // ── Düymə ──
  const triggerProps = {
    ref: triggerRef,
    type: 'button',
    id: triggerId,
    'aria-haspopup': 'dialog',
    'aria-expanded': open && !leaving,
    'aria-label': `${t.change}: ${cityName}`,
    onClick: () => (open && !leaving ? closePicker(false) : openPicker()),
  }

  let trigger
  if (renderTrigger) trigger = renderTrigger(triggerProps, { cityName, labels: t, open: open && !leaving })
  else if (variant === 'inline') {
    trigger = (
      <button {...triggerProps} className={`cp-trigger cp-trigger--inline ${className}`}>
        <span className="cp-trigger__name">{label || cityName}</span>
        <Icon name="chevronDown" size={14} className="cp-trigger__chev" />
      </button>
    )
  } else {
    trigger = (
      <button {...triggerProps} className={`cp-trigger cp-trigger--field ${className}`}>
        <Icon name="pin" size={18} className="cp-trigger__pin" />
        <span className="cp-trigger__text">
          <span className="cp-trigger__name">{label || cityName}</span>
          {!label && loc.country && loc.country !== 'AZ' && <span className="cp-trigger__sub">{countryName(loc.country, lang)}</span>}
        </span>
        <Icon name="chevronDown" size={18} className="cp-trigger__chev" />
      </button>
    )
  }

  let idx = -1
  const panel = open && typeof document !== 'undefined' ? createPortal(
    <div className={`cp-layer${sheet ? ' cp-layer--sheet' : ''}`}>
      {sheet && <div className={`cp-backdrop ui-enter-fade${leaving ? ' is-leaving' : ''}`} onClick={() => closePicker(true)} aria-hidden="true" />}
      <div
        ref={panelRef}
        className={`cp-panel ${sheet ? 'cp-panel--sheet ui-enter-sheet' : 'cp-panel--pop ui-enter-drop'}${pos?.bottom != null && !sheet ? ' is-up' : ''}${leaving ? ' is-leaving' : ''}`}
        role="dialog"
        aria-modal={sheet ? 'true' : undefined}
        aria-labelledby={titleId}
        style={!sheet && pos ? { left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH } : undefined}
      >
        {sheet && <span className="cp-grip" aria-hidden="true" />}
        <div className="cp-head">
          <p className="cp-title" id={titleId}>{t.title}</p>
          <button type="button" className="ui-icon-btn cp-close" aria-label={t.close} onClick={() => closePicker(true)}
            ref={closeRef}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.preventDefault(); closePicker(true) }
              else if (e.key === 'Tab') { e.preventDefault(); inputRef.current?.focus() }
            }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="cp-search">
          <Icon name="search" size={18} className="cp-search__ic" />
          <input
            ref={inputRef}
            className="ui-input cp-input"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            aria-label={t.placeholder}
            placeholder={t.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {world.q === q && world.status === 'loading' && <span className="cp-spin ui-spin" aria-hidden="true" />}
        </div>

        <div className="cp-list" id={listId} role="listbox" aria-label={t.title} ref={listRef}>
          {groups.map(g => (
            <div key={g.key} role="group" aria-labelledby={g.label ? `${listId}-g-${g.key}` : undefined}
              aria-label={g.label ? undefined : (g.key === 'geo' ? t.myLoc : t.results)} className={`cp-group cp-group--${g.key}`}>
              {g.label && <div className="cp-group__label" id={`${listId}-g-${g.key}`} role="presentation">{g.label}</div>}
              {g.items.map(o => {
                idx += 1
                const i = idx
                const isActive = i === active
                const busy = busyKey === o.key || (o.kind === 'geo' && geo === 'loading')
                return (
                  <div
                    key={o.key}
                    id={`${listId}-${i}`}
                    data-idx={i}
                    role="option"
                    aria-selected={isActive}
                    aria-busy={busy || undefined}
                    className={`cp-opt cp-opt--${o.kind}${isActive ? ' is-active' : ''}${o.current ? ' is-current' : ''}${o.kind === 'geo' && geo === 'error' ? ' is-error' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseMove={() => { if (!isActive) setActive(i) }}
                    onClick={() => activate(o)}
                  >
                    {o.icon && <span className="cp-opt__ic" aria-hidden="true"><Icon name={o.icon} size={18} /></span>}
                    <span className="cp-opt__text">
                      <span className="cp-opt__name">{o.name}</span>
                      {o.sub && <span className="cp-opt__sub">{o.sub}</span>}
                    </span>
                    {busy ? <span className="cp-spin ui-spin" aria-hidden="true" />
                      : o.current ? <><Icon name="check" size={16} strokeWidth={2.2} className="cp-opt__check" /><span className="ui-sr-only">, {t.selected}</span></>
                      : null}
                  </div>
                )
              })}
            </div>
          ))}
          {q && !flat.some(o => o.kind === 'city' || o.kind === 'world') && world.q === q && world.status !== 'loading' && (
            <p className="cp-empty">{world.status === 'error' ? t.netError : t.worldNone}</p>
          )}
          {!q && <p className="cp-hint">{t.hint}</p>}
        </div>
        <p className="ui-sr-only" role="status" aria-live="polite">{status}</p>
      </div>
    </div>,
    document.body,
  ) : null

  return <>{trigger}{panel}</>
}
