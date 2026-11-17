// ═══════════════════════════════════════════════════════
// MoonCraters — "Ayda müsəlman alimlərinin adları"
//
// • Beynəlxalq Astronomiya İttifaqının (IAU) rəsmi adlandırdığı, adı İslam
//   dünyasının alimlərindən gələn Ay kraterləri (data/moonCraters.js —
//   USGS «Gazetteer of Planetary Nomenclature»: koordinat, diametr, IAU "origin").
// • Ortoqrafik Ay qlobusu (saf SVG): barmaqla fırladılır; "Ön tərəf / Arxa tərəf"
//   düyməsi qlobusu çevirir. Kraterlər əsl selenoqrafik yerlərindədir, halqanın
//   ölçüsü əsl diametrdir. Dənizlər — rəsmi mərkəz və diametrdən sadə dairələr.
// • "Bu gecənin Ayı": qlobus ön tərəfə dönür, utils/lunar.js-dən hesablanan
//   fazaya görə gecə tərəfi kölgələnir — hansı kraterin indi işıqda olduğu görünür.
// • Krater seçiləndə kart: ad, alim, qısa tərcümeyi-hal, diametr, koordinat, mənbə.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { pickUi } from '../utils/uiText'
import Icon from './Icon'
import { MOON_CRATERS, MOON_MARIA, MOON_CRATERS_SOURCE, featureUrl } from '../data/moonCraters'
import { SCIENTISTS } from '../data/islamicScientists'
import { placeLabels, project, circlePath, nightPath, kmToDeg, subsolarLon, moonPhase, isLit, sunAltitude, isNearSide, fmtCoord, wrap180 } from '../utils/moonCraters'
import '../styles/MoonCraters.css'

const T = {
  az: { ey: 'Elm tarixi', title: 'Ayda İslam dünyası alimlərinin adları', lead: 'Ayın xəritəsində onlarla krater İslam dünyasının astronomlarının, riyaziyyatçılarının və səyyahlarının adını daşıyır. Adları Beynəlxalq Astronomiya İttifaqı (IAU) rəsmi təsdiq edib. Qlobusu fırladın, krateri seçin.', near: 'Ön tərəf', far: 'Arxa tərəf', toFar: 'Arxa tərəfə çevir', toNear: 'Ön tərəfə çevir', tonight: 'Bu gecənin Ayı', drag: 'Qlobusu barmaqla fırladın', lit: 'işıqlı', litNow: 'İndi Günəş işığındadır', darkNow: 'İndi Ay gecəsindədir', farNote: 'Arxa tərəf Yerdən heç vaxt görünmür', diam: 'Diametr', coords: 'Koordinat', approved: 'IAU təsdiqi', origin: 'IAU-nun izahı', source: 'Mənbə', side: 'Tərəf', close: 'Bağla', pick: 'Kraterlər', count: 'krater', phaseNote: 'Faza: Meeus üsulu ilə hesab; librasiya nəzərə alınmayıb, terminator təxminidir.', mariaNote: 'Tünd ləkələr — Ay dənizləri (rəsmi mərkəz və diametrə görə sadələşdirilmiş dairələr).' }, // lang-ok[krater,Diametr,Kraterlər,Meeus,diametrə]: Azərbaycan dilində düzgün yazılış (krater, diametr, xüsusi adlar)
  en: { ey: 'History of science', title: 'Scholars of the Islamic world on the Moon', lead: 'Dozens of craters on the lunar map carry the names of astronomers, mathematicians and travellers of the Islamic world. The names are officially approved by the International Astronomical Union (IAU). Turn the globe and pick a crater.', near: 'Near side', far: 'Far side', toFar: 'Turn to the far side', toNear: 'Turn to the near side', tonight: 'Tonight’s Moon', drag: 'Drag to turn the globe', lit: 'lit', litNow: 'In sunlight now', darkNow: 'In lunar night now', farNote: 'The far side is never seen from Earth', diam: 'Diameter', coords: 'Coordinates', approved: 'IAU approval', origin: 'IAU origin', source: 'Source', side: 'Side', close: 'Close', pick: 'Craters', count: 'craters', phaseNote: 'Phase: Meeus calculation; libration ignored, the terminator is approximate.', mariaNote: 'Dark patches are lunar maria (simplified circles from their official centre and diameter).' },
  ru: { ey: 'История науки', title: 'Имена учёных исламского мира на Луне', lead: 'Десятки кратеров на карте Луны носят имена астрономов, математиков и путешественников исламского мира. Названия официально утверждены Международным астрономическим союзом (МАС). Поверните глобус и выберите кратер.', near: 'Видимая сторона', far: 'Обратная сторона', toFar: 'Показать обратную сторону', toNear: 'Показать видимую сторону', tonight: 'Луна этой ночью', drag: 'Поворачивайте глобус пальцем', lit: 'освещено', litNow: 'Сейчас освещён Солнцем', darkNow: 'Сейчас в лунной ночи', farNote: 'Обратная сторона никогда не видна с Земли', diam: 'Диаметр', coords: 'Координаты', approved: 'Утверждение МАС', origin: 'Пояснение МАС', source: 'Источник', side: 'Сторона', close: 'Закрыть', pick: 'Кратеры', count: 'кратеров', phaseNote: 'Фаза: расчёт по Мёсу; либрация не учтена, терминатор приблизителен.', mariaNote: 'Тёмные пятна — лунные моря (упрощённые круги по официальному центру и диаметру).' },
  ar: { ey: 'تاريخ العلوم', title: 'أسماء علماء الحضارة الإسلامية على القمر', lead: 'تحمل عشرات الفوهات على خريطة القمر أسماء فلكيين ورياضيين ورحّالة من العالم الإسلامي، وقد اعتمدها الاتحاد الفلكي الدولي رسميًا. أدِر الكرة واختر فوهة.', near: 'الوجه القريب', far: 'الوجه البعيد', toFar: 'أدِر إلى الوجه البعيد', toNear: 'أدِر إلى الوجه القريب', tonight: 'قمر هذه الليلة', drag: 'اسحب لتدوير الكرة', lit: 'مضاء', litNow: 'في ضوء الشمس الآن', darkNow: 'في ليل القمر الآن', farNote: 'الوجه البعيد لا يُرى من الأرض أبدًا', diam: 'القطر', coords: 'الإحداثيات', approved: 'اعتماد الاتحاد', origin: 'شرح الاتحاد الفلكي', source: 'المصدر', side: 'الوجه', close: 'إغلاق', pick: 'الفوهات', count: 'فوهة', phaseNote: 'الطور: حساب ميوس، دون اعتبار الترنّح، وخط الفصل تقريبي.', mariaNote: 'البقع الداكنة بحار القمر (دوائر مبسّطة من مركزها وقطرها الرسميين).' },
  tr: { ey: 'Bilim tarihi', title: 'Ay’da İslam dünyası âlimlerinin adları', lead: 'Ay haritasında onlarca krater İslam dünyasının astronomlarının, matematikçilerinin ve seyyahlarının adını taşır. Adlar Uluslararası Astronomi Birliği (IAU) tarafından resmen onaylanmıştır. Küreyi çevirin, bir krater seçin.', near: 'Yakın yüz', far: 'Uzak yüz', toFar: 'Uzak yüze çevir', toNear: 'Yakın yüze çevir', tonight: 'Bu gecenin Ayı', drag: 'Küreyi parmakla çevirin', lit: 'aydınlık', litNow: 'Şu an güneş ışığında', darkNow: 'Şu an Ay gecesinde', farNote: 'Uzak yüz Dünya’dan hiç görünmez', diam: 'Çap', coords: 'Koordinat', approved: 'IAU onayı', origin: 'IAU açıklaması', source: 'Kaynak', side: 'Yüz', close: 'Kapat', pick: 'Kraterler', count: 'krater', phaseNote: 'Evre: Meeus hesabı; librasyon hesaba katılmadı, terminatör yaklaşıktır.', mariaNote: 'Koyu lekeler Ay denizleridir (resmî merkez ve çaptan sadeleştirilmiş daireler).' },
}

const R = 180
const SCI = Object.fromEntries(SCIENTISTS.map(s => [s.id, s]))
const ease = (t) => 1 - (1 - t) ** 3

/** Görünüşü yeni mərkəzə yumşaq çevir (rAF yalnız keçid zamanı işləyir) */
function useTween(view, setView, reduced, visibleRef) {
  const raf = useRef(0)
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  return (to) => {
    cancelAnimationFrame(raf.current)
    if (reduced || !visibleRef.current || document.hidden) { setView(to); return }
    const from = { ...view }
    const dLon = wrap180(to.lon - from.lon), dLat = to.lat - from.lat
    const t0 = performance.now(), dur = 900
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = ease(k)
      setView({ lon: wrap180(from.lon + dLon * e), lat: from.lat + dLat * e })
      if (k < 1 && !document.hidden) raf.current = requestAnimationFrame(step)
      else setView(to)
    }
    raf.current = requestAnimationFrame(step)
  }
}

export default function MoonCraters() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const L = (o) => (o ? o[lang] || o.en : '')
  const reduced = useReduced()
  const [view, setView] = useState({ lon: 0, lat: 0 })
  const [tonight, setTonight] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [sel, setSel] = useState(null)
  const rootRef = useRef(null)
  const svgRef = useRef(null)
  const visibleRef = useRef(true)
  const tween = useTween(view, setView, reduced, visibleRef)

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => { visibleRef.current = e.isIntersecting })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const sun = useMemo(() => ({ lon: subsolarLon(now), ...moonPhase(now) }), [now])
  const nearView = Math.abs(wrap180(view.lon)) <= 90

  // Səth: dənizlər, şəbəkə, gecə kölgəsi
  const maria = useMemo(() => MOON_MARIA.map(m => ({ id: m.name, d: circlePath(m.lat, m.lon, kmToDeg(m.diam * (m.scale || 1)), view.lon, view.lat, R, 36) })).filter(m => m.d), [view])
  const grid = useMemo(() => {
    const lines = []
    const line = (pts) => {
      let d = '', pen = false
      for (const [la, lo] of pts) {
        const p = project(la, lo, view.lon, view.lat)
        if (p.z > 0) { d += `${pen ? 'L' : 'M'}${(p.x * R).toFixed(1)} ${(-p.y * R).toFixed(1)}`; pen = true } else pen = false
      }
      return d
    }
    for (let lo = -180; lo < 180; lo += 30) lines.push(line(Array.from({ length: 37 }, (_, i) => [-90 + i * 5, lo])))
    for (let la = -60; la <= 60; la += 30) lines.push(line(Array.from({ length: 73 }, (_, i) => [la, -180 + i * 5])))
    return lines.filter(Boolean)
  }, [view])
  const night = useMemo(() => (tonight ? nightPath(sun.lon, view.lon, view.lat, R) : ''), [tonight, sun.lon, view])

  const marks = useMemo(() => MOON_CRATERS.map(c => {
    const p = project(c.lat, c.lon, view.lon, view.lat)
    return { c, p, ring: p.z > 0 ? circlePath(c.lat, c.lon, kmToDeg(c.diam), view.lon, view.lat, R, 28) : '', lit: isLit(c.lat, c.lon, sun.lon) }
  }), [view, sun.lon])
  const visibleCount = marks.filter(m => m.p.visible).length
  // Yazılar: seçilmiş krater birinci, sonra mərkəzə yaxın olanlar; üst-üstə düşənlər atlanır
  const labels = useMemo(() => {
    const items = marks.filter(m => m.p.z > 0.15 || m.c.id === sel)
      .sort((a, b) => (b.c.id === sel) - (a.c.id === sel) || b.p.z - a.p.z)
      .map(m => ({ id: m.c.id, x: m.p.x * R, y: -m.p.y * R, w: m.c.name.length * 6.6 + 4, h: 11 }))
    return placeLabels(items, R + 14)
  }, [marks, sel])

  // Barmaqla fırlatmaq
  const drag = useRef(null)
  const onDown = (e) => {
    if (e.target.closest?.('[data-crater]')) return
    drag.current = { x: e.clientX, y: e.clientY, v: view, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const r = svgRef.current.getBoundingClientRect()
    const k = 180 / (r.width || 1)
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
    setView({ lon: wrap180(d.v.lon - dx * k), lat: Math.max(-70, Math.min(70, d.v.lat + dy * k)) })
  }
  const onUp = () => { drag.current = null }
  const onKey = (e) => {
    const step = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key]
    if (!step) return
    e.preventDefault()
    setView(v => ({ lon: wrap180(v.lon - step[0]), lat: Math.max(-70, Math.min(70, v.lat - step[1])) }))
  }

  const toggleSide = () => { setTonight(false); tween({ lon: nearView ? 180 : 0, lat: 0 }) }
  const showTonight = () => {
    if (tonight) { setTonight(false); return }
    setNow(Date.now()); setTonight(true); tween({ lon: 0, lat: 0 })
  }
  const choose = (c) => {
    setSel(c.id)
    const p = project(c.lat, c.lon, view.lon, view.lat)
    if (p.z < 0.5) { if (tonight && !isNearSide(c.lon)) setTonight(false); tween({ lon: c.lon, lat: Math.max(-50, Math.min(50, c.lat)) }) }
  }
  const cur = sel ? MOON_CRATERS.find(c => c.id === sel) : null
  const sci = cur?.sci ? SCI[cur.sci] : null
  const fmtNum = (n, d = 0) => n.toLocaleString(lang === 'az' ? 'az-AZ' : lang, { maximumFractionDigits: d })
  const pct = Math.round(sun.fraction * 100)

  return (
    <section ref={rootRef} className="ui-card mcr" aria-labelledby="mcr-title" data-testid="moon-craters" data-count={MOON_CRATERS.length}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="mcr-title" className="mcr__title">{u.title}</h2>
      <p className="mcr__lead">{u.lead}</p>
      <div className="mcr__grid">
        <div className="mcr__stage">
          <div className="mcr__bar">
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" data-testid="mc-side" data-side={nearView ? 'near' : 'far'} onClick={toggleSide}>
              <Icon name="refresh" size={16} /> {nearView ? u.toFar : u.toNear}
            </button>
            <button type="button" className="ui-chip" aria-pressed={tonight} data-testid="mc-tonight" onClick={showTonight}>
              <Icon name="moon" size={16} /> {u.tonight}
            </button>
          </div>
          <svg ref={svgRef} viewBox="-200 -200 400 400" className="mcr__svg" role="application" tabIndex={0}
            aria-label={`${u.title}: ${nearView ? u.near : u.far}. ${u.drag}`} aria-roledescription="globe"
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
            <defs>
              <radialGradient id="mcr-surf" cx="42%" cy="38%" r="70%">
                <stop offset="0%" stopColor="#d9d9d4" /><stop offset="70%" stopColor="#a9a9a4" /><stop offset="100%" stopColor="#7e7e7a" />
              </radialGradient>
              <radialGradient id="mcr-limb" cx="50%" cy="50%" r="50%">
                <stop offset="80%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity=".28" />
              </radialGradient>
              <clipPath id="mcr-clip"><circle r={R} /></clipPath>
            </defs>
            <circle r={R + 10} className="mcr__halo" />
            <circle r={R} fill="url(#mcr-surf)" />
            <g clipPath="url(#mcr-clip)">
              {maria.map(m => <path key={m.id} d={m.d} className="mcr__mare" />)}
              {grid.map((d, i) => <path key={i} d={d} className="mcr__grat" />)}
              {night === 'full' ? <circle r={R} className="mcr__night" /> : night ? <path d={night} className="mcr__night" /> : null}
            </g>
            <circle r={R} fill="url(#mcr-limb)" pointerEvents="none" />
            {marks.filter(m => m.p.visible).sort((a, b) => a.p.z - b.p.z).map(({ c, p, ring, lit }) => {
              const x = p.x * R, y = -p.y * R, on = sel === c.id
              const cls = `mcr__crater${on ? ' is-sel' : ''}${tonight ? (lit ? ' is-lit' : ' is-dark') : ''}`
              return (
                <g key={c.id} className={cls} data-crater={c.id} role="button" tabIndex={0} aria-pressed={on}
                  aria-label={`${c.name} — ${L(c.person)}`} style={{ opacity: Math.min(1, 0.35 + p.z) }}
                  onClick={() => choose(c)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(c) } }}>
                  {ring && <path d={ring} className="mcr__ring" />}
                  <circle cx={x} cy={y} r="11" className="mcr__hit" />
                  <circle cx={x} cy={y} r={on ? 4.5 : 3.2} className="mcr__dot" />
                  {labels[c.id] && <text x={labels[c.id].x} y={labels[c.id].y} textAnchor={labels[c.id].anchor} className="mcr__lbl">{c.name}</text>}
                </g>
              )
            })}
          </svg>
          <p className="mcr__hint">
            {u.drag} · <span className="ui-num">{visibleCount}</span> / <span className="ui-num">{MOON_CRATERS.length}</span> {u.count}
            {tonight && <> · <span className="ui-num" data-testid="mc-phase">{pct}%</span> {u.lit}</>}
          </p>
        </div>

        <div className="mcr__panel">
          {cur ? (
            <article className="mcr__card" data-testid="mc-card" data-crater-id={cur.id} aria-live="polite">
              <header className="mcr__card-h">
                <div>
                  <h3 className="mcr__cname">{cur.name}</h3>
                  <p className="mcr__person">{L(cur.person)}</p>
                  {cur.ar && lang !== 'ar' && <p className="mcr__ar" lang="ar" dir="rtl">{cur.ar}</p>}
                </div>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setSel(null)} aria-label={u.close}><Icon name="close" size={16} /></button>
              </header>
              <p className="mcr__bio">{L(cur.bio)}</p>
              {sci?.fact && <p className="mcr__fact">{L(sci.fact)}</p>}
              <dl className="mcr__facts">
                <div><dt>{u.diam}</dt><dd><span className="ui-num">{fmtNum(cur.diam, 1)}</span> km</dd></div>
                <div><dt>{u.coords}</dt><dd className="ui-num" dir="ltr">{fmtCoord(cur.lat, cur.lon)}</dd></div>
                <div><dt>{u.side}</dt><dd>{isNearSide(cur.lon) ? u.near : u.far}</dd></div>
                {cur.approved && <div><dt>{u.approved}</dt><dd className="ui-num">{cur.approved}</dd></div>}
              </dl>
              {tonight && (
                <p className={`mcr__now${isLit(cur.lat, cur.lon, sun.lon) ? ' is-lit' : ''}`}>
                  <Icon name={isLit(cur.lat, cur.lon, sun.lon) ? 'sun' : 'moon'} size={16} /> {isLit(cur.lat, cur.lon, sun.lon) ? u.litNow : u.darkNow}
                  {isLit(cur.lat, cur.lon, sun.lon) && <span className="ui-num"> ({Math.round(sunAltitude(cur.lat, cur.lon, sun.lon))}°)</span>}
                  {!isNearSide(cur.lon) && <> · {u.farNote}</>}
                </p>
              )}
              <blockquote className="mcr__origin" lang="en" dir="ltr"><b>{u.origin}:</b> {cur.origin}</blockquote>
              <p className="mcr__src">
                {u.source}: <a href={featureUrl(cur.featureId)} target="_blank" rel="noopener noreferrer">{MOON_CRATERS_SOURCE.name} #{cur.featureId} <Icon name="external" size={12} /></a>
              </p>
            </article>
          ) : (
            <p className="mcr__empty">{u.drag}</p>
          )}
          <div className="mcr__list" role="group" aria-label={u.pick}>
            {MOON_CRATERS.map(c => (
              <button key={c.id} type="button" className="ui-chip mcr__chip" aria-pressed={sel === c.id} onClick={() => choose(c)}>
                {c.name}{tonight && <span className={`mcr__pip${isLit(c.lat, c.lon, sun.lon) ? ' is-lit' : ''}`} aria-hidden="true" />}
              </button>
            ))}
          </div>
          <p className="mcr__note">{u.mariaNote} {tonight && u.phaseNote}</p>
          <p className="mcr__note">{u.source}: <a href={MOON_CRATERS_SOURCE.url} target="_blank" rel="noopener noreferrer">{MOON_CRATERS_SOURCE.name}</a> (IAU WGPSN / USGS), {MOON_CRATERS_SOURCE.retrieved}</p>
        </div>
      </div>
    </section>
  )
}
