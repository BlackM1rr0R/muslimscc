// ═══════════════════════════════════════════════════════
// SeerahTunnel3D (v6.1) — Siyər zaman tuneli: 610–632, hər il bir halqa (/history → Xəritələr)
//
//   <SeerahTunnel3D lang="az" events={EVENTS} yearOf={eventYear} />
//
// • Hadisələr — saytın öz tarix məlumatı (data/islamicHistory.js → EVENTS: başlıq, izah, əsas fakt);
//   yeni dini mətn yazılmayıb. Yalnız 610–632-ci illər (vəhydən vəfata qədər).
// • Kamera tunelin içi ilə irəliləyir; Hicrətə (622) qədər halqalar qızılı (Məkkə dövrü),
//   sonra zümrüd (Mədinə dövrü). Hadisə seçiləndə kamera ora uçur; kətanı çəkmək — ilə keçid.
// • Ekrandan çıxanda / vərəq gizlənəndə dayanır; hərəkət azaldılıbsa — uçuş yoxdur, dərhal keçid.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import './HajjJourney3D.css'
import './SeerahTunnel3D.css'

const T = {
  // lang-ok[tuneli,tunel,tuneldən]: az dilinin öz sözüdür (tunel)
  az: { title: 'Siyər — zaman tuneli', lead: 'Vəhydən vəfata qədər 23 il: hər il bir halqa. Hicrətə qədər qızılı — Məkkə dövrü, sonra zümrüd — Mədinə dövrü. Hadisəni seçin və ya tuneli çəkin.', mecca: 'Məkkə dövrü', medina: 'Mədinə dövrü', prev: 'Əvvəlki', next: 'Növbəti', play: 'Səyahət et', pause: 'Dayandır', fact: 'Əsas fakt', noGl: 'Bu cihazda 3D (WebGL) dəstəklənmir.' },
  en: { title: 'Seerah — a tunnel through time', lead: 'Twenty-three years from the first revelation to his passing: one ring for each year. Gold until the Hijrah — the Meccan period; emerald after — the Medinan period. Pick an event or drag the tunnel.', mecca: 'Meccan period', medina: 'Medinan period', prev: 'Previous', next: 'Next', play: 'Travel', pause: 'Pause', fact: 'Key fact', noGl: '3D (WebGL) is not supported on this device.' },
  // lang-ok[D,WebGL]: texniki ad (3D, WebGL)
  ru: { title: 'Сира — туннель времени', lead: 'Двадцать три года от первого откровения до кончины: каждый год — кольцо. До хиджры кольца золотые — мекканский период, после — изумрудные, мединский. Выберите событие или потяните туннель.', mecca: 'Мекканский период', medina: 'Мединский период', prev: 'Назад', next: 'Далее', play: 'В путь', pause: 'Пауза', fact: 'Главный факт', noGl: 'На этом устройстве 3D (WebGL) не поддерживается.' },
  // lang-ok[D,WebGL]: texniki ad (3D, WebGL)
  ar: { title: 'السيرة — نفق الزمن', lead: 'ثلاث وعشرون سنة من أول الوحي إلى الوفاة: لكل سنة حلقة. ذهبية حتى الهجرة — العهد المكي، ثم زمرّدية — العهد المدني. اختر حدثًا أو اسحب النفق.', mecca: 'العهد المكي', medina: 'العهد المدني', prev: 'السابق', next: 'التالي', play: 'انطلق', pause: 'إيقاف', fact: 'حقيقة أساسية', noGl: 'العرض ثلاثي الأبعاد (WebGL) غير مدعوم على هذا الجهاز.' },
  tr: { title: 'Siyer — zaman tüneli', lead: 'İlk vahiyden vefata 23 yıl: her yıl bir halka. Hicrete kadar altın — Mekke dönemi, sonra zümrüt — Medine dönemi. Bir olay seçin ya da tüneli sürükleyin.', mecca: 'Mekke dönemi', medina: 'Medine dönemi', prev: 'Önceki', next: 'Sonraki', play: 'Yolculuk', pause: 'Durdur', fact: 'Temel bilgi', noGl: 'Bu cihazda 3D (WebGL) desteklenmiyor.' },
}
const Y0 = 610, Y1 = 632, ZS = 7, R = 3.2
const GOLD = '#e2b857', EMERALD = '#3fd0a0'
const zOf = (y) => -(y - Y0) * ZS
const motionOk = () => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('a11y-motion-user') } catch { return false } }
const L = (o, lang) => (o && (pickUi(o, lang, 'en') || o.az)) || ''

export default function SeerahTunnel3D({ lang = 'az', events = [], yearOf }) {
  const t = pickUi(T, lang)
  const wrapRef = useRef(null)
  const labelsRef = useRef([])
  const api = useRef({})
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [noGl, setNoGl] = useState(false)
  // Hadisələr: 610–632, ilə görə; eyni ildə bir neçəsi — halqa ətrafında yan-yana
  const list = useMemo(() => events.map((e, i) => ({ e, i, y: yearOf(e) })).filter(x => x.y >= Y0 && x.y <= Y1)
    .sort((a, b) => a.y - b.y || a.i - b.i)
    // 632: yalnız ilk hadisə (Vida həcci və vəfat) — sonrakılar (xilafət, riddə) vəfatdan sonradır
    .filter((x, k, arr) => x.y < Y1 || arr.findIndex(o => o.y === Y1) === k)
    .map((x, k, arr) => {
      const same = arr.filter(o => o.y === x.y), n = same.indexOf(x)
      const ang = (x.y * 2.399 + n * (Math.PI * 2 / Math.max(3, same.length))) % (Math.PI * 2)
      return { ...x, k, ang }
    }), [events, yearOf])
  const listRef = useRef(list); listRef.current = list

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || !list.length) return undefined
    let renderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }) } catch { setNoGl(true); return undefined }
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    renderer.setPixelRatio(Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1))
    wrap.prepend(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#060b1a')
    scene.fog = new THREE.Fog('#060b1a', 8, 46)
    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 200)

    // Halqalar: hər il; Hicrət (622) — böyük və parlaq
    const ringGeo = new THREE.TorusGeometry(R, 0.03, 8, 120)
    const bigGeo = new THREE.TorusGeometry(R * 1.04, 0.08, 10, 140)
    for (let y = Y0; y <= Y1; y++) {
      const hij = y === 622
      const m = new THREE.Mesh(hij ? bigGeo : ringGeo, new THREE.MeshBasicMaterial({ color: y < 622 ? GOLD : EMERALD, transparent: true, opacity: hij ? 1 : 0.55 }))
      m.position.z = zOf(y); scene.add(m)
    }
    // Uzununa xətlər (tunelin divarı)
    const lineMat = new THREE.LineBasicMaterial({ color: '#3a4a78', transparent: true, opacity: 0.45 })
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 6), new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, zOf(Y1) - 10)])
      scene.add(new THREE.Line(g, lineMat))
    }
    // Ulduz tozu — tunelin içində və ətrafında
    const N = coarse ? 900 : 1800
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3)
    const cg = new THREE.Color(GOLD), ce = new THREE.Color(EMERALD), cw = new THREE.Color('#ffffff')
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, r = 0.6 + Math.random() * 7, z = 8 - Math.random() * ((Y1 - Y0) * ZS + 24)
      pos.set([Math.cos(a) * r, Math.sin(a) * r, z], i * 3)
      const c = (Math.random() < 0.55 ? cw : z > zOf(622) ? cg : ce)
      col.set([c.r, c.g, c.b], i * 3)
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3))
    scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true })))
    // Hadisə nöqtələri — halqanın üstündə parlayan kürə
    const sphGeo = new THREE.SphereGeometry(0.13, 16, 12)
    const haloGeo = new THREE.SphereGeometry(0.34, 16, 12)
    const marks = list.map(x => {
      const p = new THREE.Vector3(Math.cos(x.ang) * R, Math.sin(x.ang) * R, zOf(x.y))
      const c = x.y < 622 ? GOLD : EMERALD
      const s = new THREE.Mesh(sphGeo, new THREE.MeshBasicMaterial({ color: c })); s.position.copy(p); scene.add(s)
      const h = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.22, depthWrite: false })); h.position.copy(p); scene.add(h)
      return { p, h }
    })

    // Kamera: z oxu boyunca; baxış hədəfi — seçilmiş hadisəyə tərəf bir az əyilir
    let camZ = zOf(list[0].y) + 6, goalZ = camZ
    const look = new THREE.Vector3(0, 0, camZ - 10), lookGoal = look.clone()
    let cur = 0
    const sway = { x: 0, y: 0, gx: 0, gy: 0 }
    const smooth = motionOk()
    api.current.goTo = (n) => {
      cur = n
      const x = listRef.current[n]; if (!x) return
      goalZ = zOf(x.y) + 4.2
      lookGoal.set(Math.cos(x.ang) * R * 0.55, Math.sin(x.ang) * R * 0.55, zOf(x.y) - 1.5)
      if (!smooth) { camZ = goalZ; look.copy(lookGoal) }
    }
    // Çəkmək: kamera tunelin içi ilə; buraxanda ən yaxın hadisə seçilir
    let drag = null
    const el = renderer.domElement
    const onDown = (e) => { drag = { y: e.clientY, x: e.clientX, z: goalZ }; el.setPointerCapture?.(e.pointerId) }
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      sway.gx = ((e.clientX - r.left) / r.width - 0.5) * 0.8; sway.gy = ((e.clientY - r.top) / r.height - 0.5) * 0.6
      if (!drag) return
      const d = (drag.y - e.clientY) + (drag.x - e.clientX) * 0.6
      goalZ = Math.max(zOf(Y1) + 2, Math.min(zOf(Y0) + 8, drag.z - d * 0.05))
      lookGoal.set(0, 0, goalZ - 10)
      if (!smooth) { camZ = goalZ; look.copy(lookGoal) }
    }
    const onUp = () => {
      if (!drag) return
      drag = null
      let best = 0, bd = Infinity
      listRef.current.forEach((x, i) => { const d = Math.abs(zOf(x.y) + 4.2 - goalZ); if (d < bd) { bd = d; best = i } })
      api.current.onPick?.(best)
    }
    el.addEventListener('pointerdown', onDown); el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp)

    const resize = () => {
      const w = wrap.clientWidth, h = Math.max(340, Math.round(w * (coarse ? 1.05 : 0.5)))
      renderer.setSize(w, h, false); el.style.width = '100%'; el.style.height = `${h}px`
      camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(wrap)
    let visible = true, raf = 0
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop() }, { threshold: 0.01 })
    io.observe(wrap)
    const v = new THREE.Vector3()
    const t0 = performance.now()
    const loop = () => {
      cancelAnimationFrame(raf)
      if (!visible || document.hidden) return
      raf = requestAnimationFrame(loop)
      const k = smooth ? 0.06 : 1
      camZ += (goalZ - camZ) * k
      look.lerp(lookGoal, k)
      if (smooth) { sway.x += (sway.gx - sway.x) * 0.05; sway.y += (sway.gy - sway.y) * 0.05 }
      camera.position.set(sway.x, -sway.y, camZ)
      camera.lookAt(look)
      const tt = (performance.now() - t0) / 1000
      marks.forEach((m, i) => { const on = i === cur; m.h.scale.setScalar(on ? 1.5 + (smooth ? Math.sin(tt * 3) * 0.25 : 0) : 1); m.h.material.opacity = on ? 0.4 : 0.18 })
      renderer.render(scene, camera)
      const r = el.getBoundingClientRect()
      marks.forEach((m, i) => {
        const lab = labelsRef.current[i]; if (!lab) return
        v.copy(m.p).project(camera)
        const dz = camZ - m.p.z
        const show = v.z < 1 && dz > 0.5 && dz < 32
        lab.style.transform = `translate(${((v.x + 1) / 2 * r.width).toFixed(1)}px, ${((1 - v.y) / 2 * r.height).toFixed(1)}px) translate(-50%, -130%)`
        lab.style.opacity = show ? String(Math.max(0.15, Math.min(1, 1.3 - dz / 26))) : '0'
      })
    }
    const onVis = () => loop()
    document.addEventListener('visibilitychange', onVis)
    api.current.goTo(0)
    camZ = goalZ + 14
    loop()
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis)
      el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp)
      scene.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.() }); renderer.dispose(); el.remove()
    }
  }, [list])

  api.current.onPick = (n) => { setPlaying(false); setStep(n) }
  useEffect(() => { api.current.goTo?.(step) }, [step])
  useEffect(() => {
    if (!playing) return undefined
    if (step >= list.length - 1) { setPlaying(false); return undefined }
    const id = setTimeout(() => setStep(s => s + 1), 4200)
    return () => clearTimeout(id)
  }, [playing, step, list.length])

  if (!list.length) return null
  const x = list[step]
  const go = (n) => { setPlaying(false); setStep(Math.max(0, Math.min(list.length - 1, n))) }
  const phase = x.y < 622 ? 'mecca' : 'medina'
  return (
    <figure className="ui-card hj3 stn" data-testid="seerah-tunnel" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(step + (lang === 'ar' ? -1 : 1)); if (e.key === 'ArrowLeft') go(step + (lang === 'ar' ? 1 : -1)) }}>
      <figcaption className="hj3__head"><span className="hj3__title">{t.title}</span><span className="hj3__lead">{t.lead}</span></figcaption>
      <div className="hj3__stage stn__stage" ref={wrapRef}>
        {noGl && <p className="hj3__nogl stn__nogl">{t.noGl}</p>}
        {list.map((o, i) => (
          <span key={o.i} className={`stn__label${i === step ? ' is-on' : ''}${o.y < 622 ? '' : ' is-med'}`} ref={el => { labelsRef.current[i] = el }}>
            <b className="ui-num">{o.y}</b> {L(o.e.title, lang)}
          </span>
        ))}
        <div className={`stn__year is-${phase}`} aria-hidden="true"><b className="ui-num">{x.y}</b><span>{t[phase]}</span></div>
      </div>
      <div className="hj3__panel" aria-live="polite">
        <ol className="stn__dots">
          {list.map((o, i) => (
            <li key={o.i}><button type="button" className={`${i === step ? 'is-on' : i < step ? 'is-done' : ''}${o.y < 622 ? '' : ' is-med'}`} onClick={() => go(i)} aria-label={`${o.y} — ${L(o.e.title, lang)}`} aria-current={i === step ? 'step' : undefined} /></li>
          ))}
        </ol>
        <div className="hj3__text" data-testid="seerah-text">
          <p className="hj3__step"><span className="ui-num">{L(x.e.year, lang)}</span> · {L(x.e.title, lang)}</p>
          <p>{L(x.e.desc, lang)}</p>
          {x.e.keyFact && <p><b>{t.fact}:</b> {L(x.e.keyFact, lang)}</p>}
        </div>
        <div className="hj3__btns">
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => go(step - 1)} disabled={step <= 0}><Icon name="chevronLeft" className="ui-btn__icon ui-flip-rtl" />{t.prev}</button>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => { if (step >= list.length - 1) setStep(0); setPlaying(p => !p) }} data-testid="seerah-play">
            <Icon name={playing ? 'pause' : 'play'} className="ui-btn__icon" />{playing ? t.pause : t.play}
          </button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => go(step + 1)} disabled={step >= list.length - 1} data-testid="seerah-next">{t.next}<Icon name="chevron" className="ui-btn__icon ui-flip-rtl" /></button>
        </div>
      </div>
    </figure>
  )
}
