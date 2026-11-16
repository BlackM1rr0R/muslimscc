// ═══════════════════════════════════════════════════════
// Quran şəhəri — 114 surə gecə şəhərinin 114 binası kimi
//
// • Bina hündürlüyü ayə sayının kvadrat kökü ilə (utils/quranCity.js):
//   286 ayəli Bəqərə də, 3 ayəli Kövsər də oxunaqlı qalır.
// • Rəng ailəsi: Məkki — isti qum daşı / qızılı, Mədəni — lacivərd (lapis).
//   Tac növü (günbəz, minarə, sivri tağ, soğanvari günbəz, qoşa minarə) qəti qaydadır.
// • Pəncərələrdə işıq = bu cihazda oxunan surələr: localStorage 'quran_stats'.reads
//   (QuranPage.jsx yazır; burada yalnız oxunur).
// • Şəhər səhifədən enlidir — sürüşmə yalnız komponentin içində (overflow-x).
//   Binaya toxunanda kart: nömrə, ad, ayə sayı, Məkki/Mədəni, oxunub-oxunmayıb, keçid.
// • "Şəhərimi paylaş" — 1080×1920 PNG (3 küçə), utils/quoteCard paylaşma köməkçiləri ilə.
// • useReduced('decor'): ulduz parıltısı və binaların qalxması yoxdur.
//
//   <QuranCity onOpen={(n) => …} />   (onOpen verilməsə adi keçid işləyir)
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced'
import { pathFor } from '../seo/routes'
import { SURAH_TABLE } from '../data/mushafIndex'
import { REVELATION_PLACE } from '../data/surahRevelation'
import { getSurahLocal } from '../data/surahNamesAz'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import { buildCity, makeStars, readLitSurahs, splitRows, GROUND, SKY_H, STATS_KEY, WINDOW_TILE, WX, WY } from '../utils/quranCity'
import '../styles/QuranCity.css'

const T = {
  az: { ey: 'Quran', title: 'Quran şəhəri', lead: '114 surə — gecə şəhərinin 114 binası. Bina nə qədər ucadırsa, surədə bir o qədər çox ayə var. Bu cihazda oxuduğunuz surələrin pəncərələrində işıq yanır.', meccan: 'Məkki', medinan: 'Mədəni', lit: (n) => `İşıqlanan surə: ${n} / 114`, hint: 'Şəhəri yana sürüşdürün, binaya toxunun.', ayahs: 'Ayə sayı', place: 'Nazil olduğu yer', read: 'Oxunub — pəncərələr işıqlıdır', unread: 'Hələ oxunmayıb', open: 'Surəni aç', share: 'Şəhərimi paylaş', save: 'Şəkil kimi saxla', busy: 'Hazırlanır…', png: 'Mənim Quran şəhərim', city: 'Quran şəhəri: 114 surə, 114 bina', empty: 'Oxuduğunuz hər surə bir binanı işıqlandıracaq.', close: 'Bağla', note: 'Hündürlük ayə sayının kvadrat kökü ilə artır. Oxuma qeydləri yalnız bu cihazda saxlanılır.' },
  en: { ey: 'Quran', title: 'The Quran city', lead: '114 surahs — the 114 buildings of a night city. The taller the building, the more verses the surah has. Surahs you have read on this device glow with lit windows.', meccan: 'Meccan', medinan: 'Medinan', lit: (n) => `${n} of 114 surahs lit`, hint: 'Scroll the city sideways and tap a building.', ayahs: 'Verses', place: 'Revealed in', read: 'Read — windows lit', unread: 'Not read yet', open: 'Open the surah', share: 'Share my city', save: 'Save as image', busy: 'Preparing…', png: 'My Quran city', city: 'The Quran city: 114 surahs, 114 buildings', empty: 'Every surah you read will light up a building.', close: 'Close', note: 'Height grows with the square root of the verse count. Reading history stays on this device only.' },
  ru: { ey: 'Коран', title: 'Город Корана', lead: '114 сур — 114 зданий ночного города. Чем выше здание, тем больше в суре аятов. В окнах сур, прочитанных на этом устройстве, горит свет.', meccan: 'Мекканская', medinan: 'Мединская', lit: (n) => `Освещено сур: ${n} из 114`, hint: 'Прокрутите город вбок и нажмите на здание.', ayahs: 'Аятов', place: 'Место ниспослания', read: 'Прочитана — окна горят', unread: 'Ещё не прочитана', open: 'Открыть суру', share: 'Поделиться городом', save: 'Сохранить картинку', busy: 'Готовим…', png: 'Мой город Корана', city: 'Город Корана: 114 сур, 114 зданий', empty: 'Каждая прочитанная сура зажжёт свет в одном здании.', close: 'Закрыть', note: 'Высота растёт как квадратный корень из числа аятов. Отметки о чтении хранятся только на этом устройстве.' },
  ar: { ey: 'القرآن', title: 'مدينة القرآن', lead: '114 سورة هي 114 مبنى في مدينة ليلية. كلما علا المبنى كثرت آيات السورة. وتضيء نوافذ السور التي قرأتها على هذا الجهاز.', meccan: 'مكية', medinan: 'مدنية', lit: (n) => `أُضيئت ${n} من 114 سورة`, hint: 'مرِّر المدينة جانبًا واضغط على مبنى.', ayahs: 'عدد الآيات', place: 'مكان النزول', read: 'مقروءة — النوافذ مضاءة', unread: 'لم تُقرأ بعد', open: 'افتح السورة', share: 'شارك مدينتي', save: 'حفظ الصورة', busy: 'جارٍ التحضير…', png: 'مدينتي القرآنية', city: 'مدينة القرآن: 114 سورة و114 مبنى', empty: 'كل سورة تقرؤها تضيء مبنى.', close: 'إغلاق', note: 'يزداد الارتفاع بالجذر التربيعي لعدد الآيات. سجل القراءة محفوظ على هذا الجهاز فقط.' },
  tr: { ey: 'Kur\'an', title: 'Kur\'an şehri', lead: '114 sure — gece şehrinin 114 binası. Bina ne kadar yüksekse surede o kadar çok ayet var. Bu cihazda okuduğunuz surelerin pencerelerinde ışık yanar.', meccan: 'Mekkî', medinan: 'Medenî', lit: (n) => `Aydınlanan sure: ${n} / 114`, hint: 'Şehri yana kaydırın, bir binaya dokunun.', ayahs: 'Ayet sayısı', place: 'İndiği yer', read: 'Okundu — pencereler aydınlık', unread: 'Henüz okunmadı', open: 'Sureyi aç', share: 'Şehrimi paylaş', save: 'Resim olarak kaydet', busy: 'Hazırlanıyor…', png: 'Benim Kur\'an şehrim', city: 'Kur\'an şehri: 114 sure, 114 bina', empty: 'Okuduğunuz her sure bir binayı aydınlatacak.', close: 'Kapat', note: 'Yükseklik ayet sayısının karekökü ile artar. Okuma kayıtları yalnızca bu cihazda tutulur.' },
}

// Rənglər (CSS ilə eyni — PNG ixracı üçün də)
const PAL = {
  mk: { lit: ['#e2bd82', '#a8773f'], dark: ['#5a4430', '#33261a'] },
  md: { lit: ['#6f8fdc', '#34509c'], dark: ['#2c3a6a', '#18203e'] },
  win: '#ffd889', door: 'rgba(8,10,28,.75)', winOff: 'rgba(255,240,210,.07)', sky: ['#070b1f', '#121a3d', '#2a2350'],
}

const MOON = 'M0 -30A30 30 0 0 0 0 30A17 30 0 0 1 0 -30Z'

// Şrift siyahısı (kanvas üçün): [latın, ərəb]
const FONTS = ['Inter, system-ui, sans-serif', '"IBM Plex Sans Arabic", Inter, system-ui, sans-serif']

const surahName = (n, lang) => getSurahLocal(n, lang)?.name || (lang === 'ar' ? SURAH_TABLE[n - 1][4] : SURAH_TABLE[n - 1][5])

/** PNG: 1080×1920, şəhər 3 küçəyə bölünür (eyni miqyas — hündürlüklər müqayisə olunur) */
async function renderCityPng(lit, u, lang) {
  const W = 1080, H = 1920
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')
  if (!ctx || typeof Path2D === 'undefined') return null
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, PAL.sky[0]); g.addColorStop(0.6, PAL.sky[1]); g.addColorStop(1, PAL.sky[2])
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  for (const s of makeStars(170, W, 900, 7)) {
    ctx.globalAlpha = 0.35 + (s.r / 1.8) * 0.6
    ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 1.6, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1
  // Hilal (SVG ilə eyni forma) + halə
  const halo = ctx.createRadialGradient(800, 240, 0, 800, 240, 230)
  halo.addColorStop(0, 'rgba(255,217,138,.32)'); halo.addColorStop(1, 'rgba(255,217,138,0)')
  ctx.fillStyle = halo; ctx.fillRect(560, 0, 480, 480)
  ctx.save(); ctx.translate(800, 240); ctx.rotate(-25 * Math.PI / 180); ctx.scale(2.8, 2.8)
  ctx.fillStyle = '#ffe3a3'; ctx.fill(new Path2D(MOON)); ctx.restore()

  const font = FONTS[lang === 'ar' ? 1 : 0]
  ctx.textAlign = 'center'; ctx.direction = lang === 'ar' ? 'rtl' : 'ltr'
  ctx.fillStyle = '#fff3d6'; ctx.font = `800 76px ${font}`
  ctx.fillText(u.png, W / 2, 470)
  ctx.fillStyle = PAL.win; ctx.font = `600 44px ${font}`
  ctx.fillText(u.lit(lit.size), W / 2, 550)

  const rows = splitRows().map(nums => buildCity(SURAH_TABLE, REVELATION_PLACE, nums))
  const s = Math.min(...rows.map(r => 1000 / r.width))
  // Küçələr 620…H−240 aralığında bərabər paylanır
  const rowHs = rows.map(r => (GROUND - r.top) * s)
  const free = (H - 240) - 620 - rowHs.reduce((a, b) => a + b, 0)
  const gap = Math.max(60, Math.min(170, free / rows.length))
  let y = 620 + Math.max(0, (free - gap * (rows.length - 1)) / 2)
  for (const [ri, row] of rows.entries()) {
    const ground = y + rowHs[ri]
    ctx.save()
    ctx.translate((W - row.width * s) / 2, ground - GROUND * s)
    ctx.scale(s, s)
    for (const t of row.towers) {
      const on = lit.has(t.n), p = t.medinan ? PAL.md : PAL.mk, cols = on ? p.lit : p.dark
      const tg = ctx.createLinearGradient(0, GROUND - t.h, 0, GROUND)
      tg.addColorStop(0, cols[0]); tg.addColorStop(1, cols[1])
      ctx.fillStyle = tg; ctx.fill(new Path2D(t.d))
      if (on) { ctx.save(); ctx.shadowColor = 'rgba(255,200,90,.9)'; ctx.shadowBlur = 6 }
      ctx.fillStyle = on ? PAL.win : PAL.winOff; ctx.fill(new Path2D(t.win))
      if (on) ctx.restore()
      ctx.fillStyle = PAL.door; ctx.fill(new Path2D(t.door))
    }
    ctx.restore()
    ctx.fillStyle = 'rgba(255,230,180,.18)'; ctx.fillRect(40, ground, W - 80, 3)
    y = ground + gap
  }
  // Leqenda: rəng nümunəsi + ad (iki element, ortada)
  ctx.font = `500 34px ${font}`; ctx.textAlign = 'left'; ctx.direction = 'ltr'
  const items = [[PAL.mk.lit, u.meccan], [PAL.md.lit, u.medinan]]
  const widths = items.map(([, l]) => 44 + ctx.measureText(l).width)
  let lx = (W - widths.reduce((a, b) => a + b, 0) - 50) / 2
  items.forEach(([c, l], i) => {
    const sg = ctx.createLinearGradient(0, H - 178, 0, H - 150)
    sg.addColorStop(0, c[0]); sg.addColorStop(1, c[1])
    ctx.fillStyle = sg; ctx.fillRect(lx, H - 178, 28, 28)
    ctx.fillStyle = 'rgba(255,243,214,.8)'; ctx.fillText(l, lx + 44, H - 152)
    lx += widths[i] + 50
  })
  ctx.textAlign = 'center'
  ctx.font = `700 38px Inter, system-ui, sans-serif`; ctx.direction = 'ltr'
  ctx.fillText('muslims.cc', W / 2, H - 90)
  return new Promise((resolve) => c.toBlob(b => resolve(b), 'image/png'))
}

export default function QuranCity({ onOpen }) {
  const { lang } = useLang()
  const u = pickUi(T, lang)
  const still = useReduced('decor')
  const uid = useId().replace(/:/g, '')
  const city = useMemo(() => buildCity(SURAH_TABLE, REVELATION_PLACE), [])
  const stars = useMemo(() => makeStars(60, 1000, 260), [])
  const [lit, setLit] = useState(() => new Set())
  const [sel, setSel] = useState(null)
  const [focusN, setFocusN] = useState(1)
  const [phase, setPhase] = useState('idle') // idle (prerender) → wait (ekrandan kənar) → in
  const [busy, setBusy] = useState(false)
  const rootRef = useRef(null)
  const scRef = useRef(null)
  const drag = useRef(null)

  // Oxunan surələr — mount-dan sonra (prerender ilə uyğunsuzluq olmasın); başqa tabda dəyişəndə yenilə
  useEffect(() => {
    const load = () => setLit(readLitSurahs())
    load()
    const onStorage = (e) => { if (!e.key || e.key === STATS_KEY) load() }
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVis)
    return () => { window.removeEventListener('storage', onStorage); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  // Görünəndə binalar qalxır (bir dəfə)
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver((es) => {
      if (es.some(e => e.isIntersecting)) { setPhase('in'); io.disconnect() } else setPhase(p => (p === 'idle' ? 'wait' : p))
    }, { threshold: 0.12 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Siçanla sürükləmə (toxunuşda brauzerin öz sürüşməsi işləyir)
  const onDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = { x: e.clientX, left: scRef.current.scrollLeft, moved: false }
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 5) d.moved = true
    if (d.moved) scRef.current.scrollLeft = d.left - dx
  }
  const onUp = () => { setTimeout(() => { drag.current = null }, 0) }

  const pick = useCallback((n) => {
    if (drag.current?.moved) return
    setSel(s => (s === n ? null : n)); setFocusN(n)
  }, [])

  const focusTower = (n) => {
    setFocusN(n)
    const el = scRef.current?.querySelector(`[data-surah="${n}"]`)
    el?.focus({ preventScroll: true })
    el?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: still ? 'auto' : 'smooth' })
  }
  const onKey = (e, n) => {
    const k = e.key
    if (k === 'Enter' || k === ' ') { e.preventDefault(); pick(n) }
    else if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); focusTower(Math.min(114, n + 1)) }
    else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); focusTower(Math.max(1, n - 1)) }
    else if (k === 'Home') { e.preventDefault(); focusTower(1) }
    else if (k === 'End') { e.preventDefault(); focusTower(114) }
    else if (k === 'Escape') setSel(null)
  }

  const exportBlob = () => renderCityPng(lit, u, lang)
  const save = async () => {
    const win = preopenWindow()
    setBusy(true)
    try { const b = await exportBlob(); if (b) saveBlob(b, 'quran-city-muslims-cc.png', win) } finally { setBusy(false) }
  }
  const share = async () => {
    setBusy(true)
    try {
      const b = await exportBlob()
      if (!b) return
      const file = new File([b], 'quran-city-muslims-cc.png', { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], title: u.png }) } catch { /* istifadəçi imtina etdi */ }
      } else saveBlob(b, 'quran-city-muslims-cc.png')
    } finally { setBusy(false) }
  }

  const t = sel ? city.towers[sel - 1] : null
  const vbTop = Math.floor(city.top) - 8
  const vbH = SKY_H - vbTop
  const cls = `ui-card qc${phase === 'idle' ? '' : ` is-${phase}`}${still ? ' is-still' : ''}`

  return (
    <section ref={rootRef} className={cls} aria-labelledby={`${uid}-t`} data-testid="quran-city" data-lit={lit.size}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id={`${uid}-t`} className="qc__title">{u.title}</h2>
      <p className="qc__lead">{u.lead}</p>

      <div className="qc__bar">
        <p className="qc__stat" aria-live="polite"><b className="ui-num">{u.lit(lit.size)}</b>{lit.size === 0 && <span> · {u.empty}</span>}</p>
        <ul className="qc__legend" aria-hidden="true">
          <li><i className="qc__sw qc__sw--mk" />{u.meccan}</li>
          <li><i className="qc__sw qc__sw--md" />{u.medinan}</li>
        </ul>
      </div>

      <div className="qc__stage">
        <svg className="qc__sky" viewBox="0 0 1000 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id={`${uid}-halo`}>
              <stop offset="0%" stopColor="#ffd98a" stopOpacity=".35" /><stop offset="100%" stopColor="#ffd98a" stopOpacity="0" />
            </radialGradient>
          </defs>
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} className={s.tw ? 'qc__star qc__star--tw' : 'qc__star'}
              style={s.tw ? { animationDelay: `${s.delay}s` } : undefined} />
          ))}
          {/* Hilal: sol yarımdairə ilə elliptik qövs arasındakı forma */}
          <circle cx="620" cy="62" r="70" fill={`url(#${uid}-halo)`} />
          <path d={MOON} transform="translate(620 62) rotate(-25)" className="qc__moon" />
        </svg>
        <div ref={scRef} className="qc__scroll" dir="ltr"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>
          <svg className="qc__svg" viewBox={`0 ${vbTop} ${city.width} ${vbH}`} style={{ '--qc-ar': city.width / vbH }}
            role="group" aria-label={`${u.city}. ${u.hint}`}>
            <defs>
              {['mk', 'md'].map(k => ['lit', 'dark'].map(m => (
                <linearGradient key={k + m} id={`${uid}-${k}-${m}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PAL[k][m][0]} /><stop offset="100%" stopColor={PAL[k][m][1]} />
                </linearGradient>
              )))}
              {['on', 'off'].map(k => (
                <pattern key={k} id={`${uid}-w${k}`} width={WX} height={WY} patternUnits="userSpaceOnUse">
                  <path d={WINDOW_TILE} className={k === 'on' ? 'qc__wt qc__wt--on' : 'qc__wt'} />
                </pattern>
              ))}
            </defs>
            <rect x="0" y={GROUND} width={city.width} height={SKY_H - GROUND} className="qc__ground" />
            {city.towers.map((tw, i) => {
              const on = lit.has(tw.n)
              const fam = tw.medinan ? 'md' : 'mk'
              return (
                <g key={tw.n} data-surah={tw.n} data-lit={on ? '1' : '0'}
                  className={`qc__t qc__t--${fam}${on ? ' is-lit' : ''}${sel === tw.n ? ' is-sel' : ''}`}
                  style={{ '--d': `${i * 9}ms` }}
                  role="button" tabIndex={focusN === tw.n ? 0 : -1} aria-pressed={sel === tw.n}
                  aria-label={`${tw.n}. ${surahName(tw.n, lang)} — ${u.ayahs}: ${tw.ayahs}, ${tw.medinan ? u.medinan : u.meccan}, ${on ? u.read : u.unread}`}
                  onClick={() => pick(tw.n)} onKeyDown={(e) => onKey(e, tw.n)}>
                  <rect x={tw.x - 2} y={tw.tipY} width={tw.w + 4} height={GROUND - tw.tipY} className="qc__hit" />
                  <path d={tw.d} fill={`url(#${uid}-${fam}-${on ? 'lit' : 'dark'})`} className="qc__body" />
                  <rect x={tw.grid.x} y={tw.grid.y} width={tw.grid.w} height={tw.grid.h} fill={`url(#${uid}-w${on ? 'on' : 'off'})`} className="qc__win" />
                  <path d={tw.door} className="qc__door" />
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      <p className="qc__hint">{u.hint}</p>

      {t && (
        <div className="qc__card" data-testid="qc-card" aria-live="polite">
          <div className="qc__card-head">
            <span className={`qc__badge qc__badge--${t.medinan ? 'md' : 'mk'} ui-num`}>{t.n}</span>
            <div className="qc__card-name">
              <b>{surahName(t.n, lang)}</b>
              <span lang="ar" dir="rtl" className="qc__ar">{SURAH_TABLE[t.n - 1][4]}</span>
            </div>
            <button type="button" className="qc__x" onClick={() => setSel(null)} aria-label={u.close}>×</button>
          </div>
          <dl className="qc__facts">
            <div><dt>{u.ayahs}</dt><dd className="ui-num">{t.ayahs}</dd></div>
            <div><dt>{u.place}</dt><dd>{t.medinan ? u.medinan : u.meccan}</dd></div>
          </dl>
          <p className={`qc__status${lit.has(t.n) ? ' is-lit' : ''}`}>{lit.has(t.n) ? u.read : u.unread}</p>
          <a className="ui-btn ui-btn--primary ui-btn--sm" href={pathFor('quran', lang, t.n)}
            onClick={(e) => { if (!onOpen || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); onOpen(t.n) }}>
            {u.open}
          </a>
        </div>
      )}

      <div className="qc__actions">
        <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share} disabled={busy} data-testid="qc-share">{busy ? u.busy : u.share}</button>
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={save} disabled={busy}>{u.save}</button>
      </div>
      <p className="qc__note">{u.note}</p>
    </section>
  )
}
