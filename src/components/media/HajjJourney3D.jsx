// ═══════════════════════════════════════════════════════
// HajjJourney3D (v5.8) — Həcc yolu 3D: Məkkə → Mina → Ərəfat → Müzdəlifə → Mina → Məkkə (/hajjguide)
//
//   <HajjJourney3D lang="az" />
//
// • Hər addımda həmin günün izahı — Həcc bələdçisinin öz mətni (HAJJ_DAYS), yeni mətn yazılmayıb.
// • Yerlər — HajjRouteMap-in koordinatları (SiraMaps → HAJJ_POINTS, real enlik/uzunluq),
//   addımlar və mətnlər — eyni xəritənin günləri (HAJJ_L.legend): 8–13 Zülhiccə.
// • Səhnə: səhra relyefi (sadə dalğalı səth), Ərəfatda Rəhmət dağı (konus), dayanacaqlarda
//   işıq sütunları; addım seçiləndə kamera həmin yerə "uçur", yolun keçilmiş hissəsi parlayır.
// • İnsan təsviri yoxdur. Sxematikdir — məsafələr real nisbətdədir, relyef təxminidir.
// • "Səyahəti başlat" — 6 addım ~4 s ilə; ←/→ ilə də keçilir. three.js — ayrıca chunk.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { HAJJ_L, HAJJ_POINTS } from './SiraMaps'
import { HAJJ_DAYS } from '../../data/guides/HajjGuideExtra'
import './HajjJourney3D.css'

const T = {
  // lang-ok[Kamera,Kameranı,kamera,kamerada]: az dilinin öz sözüdür (kamera)
  az: { title: 'Həcc yolu — 3D səyahət', lead: 'Günlər üzrə yerlər: kamera hər dayanacağa uçur. Sxematikdir, məsafələr real nisbətdədir.', play: 'Səyahəti başlat', pause: 'Dayandır', prev: 'Əvvəlki', next: 'Növbəti', noGl: 'Bu cihazda 3D (WebGL) dəstəklənmir.' },
  en: { title: 'The Hajj route — a 3D journey', lead: 'The places day by day: the camera flies to each stop. Schematic; distances are to scale.', play: 'Start the journey', pause: 'Pause', prev: 'Previous', next: 'Next', noGl: '3D (WebGL) is not supported on this device.' },
  // lang-ok[D,WebGL]: texniki ad (3D, WebGL)
  ru: { title: 'Путь хаджа — 3D-путешествие', lead: 'Места по дням: камера летит к каждой остановке. Схематично, расстояния в масштабе.', play: 'Начать путь', pause: 'Пауза', prev: 'Назад', next: 'Далее', noGl: 'На этом устройстве 3D (WebGL) не поддерживается.' },
  // lang-ok[D,WebGL]: texniki ad (3D, WebGL)
  ar: { title: 'طريق الحج — رحلة ثلاثية الأبعاد', lead: 'الأماكن يومًا بيوم: تطير الكاميرا إلى كل محطة. تخطيطي، والمسافات بمقياس حقيقي.', play: 'ابدأ الرحلة', pause: 'إيقاف', prev: 'السابق', next: 'التالي', noGl: 'العرض ثلاثي الأبعاد (WebGL) غير مدعوم على هذا الجهاز.' },
  tr: { title: 'Hac yolu — 3D yolculuk', lead: 'Günlere göre yerler: kamera her durağa uçar. Şematiktir, mesafeler gerçek ölçekte.', play: 'Yolculuğu başlat', pause: 'Durdur', prev: 'Önceki', next: 'Sonraki', noGl: 'Bu cihazda 3D (WebGL) desteklenmiyor.' },
}
// legend addımı → hara (HajjRouteMap-in ayaqları ilə eyni ardıcıllıq)
const STEP_TO = ['mina', 'arafat', 'muzdalifah', 'jamarat', 'haram', 'mina']
// legend addımı → Həcc bələdçisinin günləri (data/guides/HajjGuideExtra → HAJJ_DAYS, mənbələri ilə)
const STEP_DAYS = [['d8'], ['d9'], ['n10'], ['d10'], ['d10'], ['d11', 'd12', 'd13']]
const STOP_KEYS = ['haram', 'mina', 'jamarat', 'muzdalifah', 'arafat']
const ORIGIN = [21.39, 39.9], KM = 111.0
const P = (o, lang) => (o && (pickUi(o, lang, 'en') || o.az)) || ''
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user')

/** enlik/uzunluq → səhnə (1 vahid ≈ 1 km; x — şərq, z — cənub) */
export function toScene([lat, lng]) {
  return [(lng - ORIGIN[1]) * KM * Math.cos(ORIGIN[0] * Math.PI / 180), 0, -(lat - ORIGIN[0]) * KM]
}
const hill = (x, z) => Math.sin(x * 0.35) * Math.cos(z * 0.3) * 0.35 + Math.sin(x * 0.9 + z * 0.7) * 0.12

export default function HajjJourney3D({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const wrapRef = useRef(null)
  const api = useRef({})
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [noGl, setNoGl] = useState(false)
  const labelsRef = useRef({})

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined
    let renderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }) } catch { setNoGl(true); return undefined }
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    renderer.setPixelRatio(Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1))
    wrap.prepend(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f3dcb4')
    scene.fog = new THREE.Fog('#f3dcb4', 18, 46)
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200)
    camera.position.set(-2, 14, 16)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 4; controls.maxDistance = 40
    controls.maxPolarAngle = Math.PI * 0.45
    scene.add(new THREE.HemisphereLight('#fff4dc', '#b98a52', 1.1))
    const sun = new THREE.DirectionalLight('#fff1d6', 1.6); sun.position.set(-10, 20, 8); scene.add(sun)

    // Relyef
    const g = new THREE.PlaneGeometry(36, 24, 120, 80); g.rotateX(-Math.PI / 2)
    const pa = g.attributes.position
    for (let i = 0; i < pa.count; i++) pa.setY(i, hill(pa.getX(i), pa.getZ(i)))
    g.computeVertexNormals()
    scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#e2bf86', roughness: 1, flatShading: true })))
    // Ərəfatda Rəhmət dağı, Mina ətrafında qayalı təpələr (sxematik)
    const rock = new THREE.MeshStandardMaterial({ color: '#b98a5a', roughness: 1, flatShading: true })
    const ar = toScene(HAJJ_POINTS.arafat)
    const jr = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 7), rock); jr.position.set(ar[0] + 0.3, 0.45, ar[2] - 0.6); scene.add(jr)
    let seed = 7
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    const stopXZ = STOP_KEYS.map(k => toScene(HAJJ_POINTS[k]))
    for (let i = 0, n = 0; i < 80 && n < 26; i++) {
      const a = rnd() * Math.PI * 2, rr = 4 + rnd() * 10, x = Math.cos(a) * rr - 2, z = Math.sin(a) * rr * 0.7 - 1
      if (stopXZ.some(([sx, , sz]) => Math.hypot(sx - x, sz - z) < 2.2)) continue
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.4 + rnd() * 0.9, 0.6 + rnd() * 1.4, 6), rock); c.position.set(x, 0.3, z); scene.add(c); n++
    }

    // Dayanacaqlar — işıq sütunları
    const pts = {}
    for (const k of STOP_KEYS) {
      const p = toScene(HAJJ_POINTS[k]); pts[k] = new THREE.Vector3(p[0], hill(p[0], p[2]) + 0.05, p[2])
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 10), new THREE.MeshBasicMaterial({ color: k === 'haram' ? '#0e5c46' : '#c79a3a', transparent: true, opacity: 0.85 }))
      col.position.copy(pts[k]).add(new THREE.Vector3(0, 1.2, 0)); scene.add(col)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 20), new THREE.MeshBasicMaterial({ color: '#fff4d0' }))
      base.position.copy(pts[k]); scene.add(base)
    }
    // Yol: Məkkə → addımlar (əyilmiş xətlər)
    const seq = ['haram', ...STEP_TO]
    const legs = []
    for (let i = 0; i < STEP_TO.length; i++) {
      const a = pts[seq[i]], b = pts[seq[i + 1]]
      const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.8, (i % 2 ? 0.6 : -0.6)))
      const curve = new THREE.QuadraticBezierCurve3(a.clone().add(new THREE.Vector3(0, 0.1, 0)), mid, b.clone().add(new THREE.Vector3(0, 0.1, 0)))
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.07, 6, false), new THREE.MeshBasicMaterial({ color: '#7a5a28', transparent: true, opacity: 0.35 }))
      scene.add(tube); legs.push(tube)
    }
    const setActive = (n) => legs.forEach((l, i) => { l.material.color.set(i <= n ? '#e2a31b' : '#7a5a28'); l.material.opacity = i <= n ? 0.95 : 0.35 })

    // Kamera uçuşu
    let fly = null
    api.current.goTo = (n) => {
      setActive(n)
      const target = n < 0 ? new THREE.Vector3(0, 0, 0) : pts[STEP_TO[n]]
      const from = { p: camera.position.clone(), t: controls.target.clone() }
      const to = { p: target.clone().add(new THREE.Vector3(-2.6, 4.2, 5.2)), t: target.clone() }
      if (n < 0) to.p.set(-2, 14, 16)
      fly = reduced() ? { from: to, to, t0: 0, d: 1 } : { from, to, t0: performance.now(), d: 1600 }
    }

    const resize = () => {
      const w = wrap.clientWidth, h = Math.max(300, Math.round(w * (coarse ? 0.95 : 0.52)))
      renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = `${h}px`
      camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(wrap)

    let visible = true, raf = 0
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop() }, { threshold: 0.01 })
    io.observe(wrap)
    const v = new THREE.Vector3()
    const loop = () => {
      cancelAnimationFrame(raf)
      if (!visible || document.hidden) return
      raf = requestAnimationFrame(loop)
      if (fly) {
        const k = fly.d <= 1 ? 1 : Math.min(1, (performance.now() - fly.t0) / fly.d)
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        camera.position.lerpVectors(fly.from.p, fly.to.p, e); controls.target.lerpVectors(fly.from.t, fly.to.t, e)
        if (k >= 1) fly = null
      }
      controls.update(); renderer.render(scene, camera)
      // HTML etiketlər
      const r = renderer.domElement.getBoundingClientRect()
      for (const k of STOP_KEYS) {
        const el = labelsRef.current[k]; if (!el) continue
        v.copy(pts[k]).add(new THREE.Vector3(0, 2.6, 0)).project(camera)
        el.style.transform = `translate(${((v.x + 1) / 2 * r.width).toFixed(1)}px, ${((1 - v.y) / 2 * r.height).toFixed(1)}px) translate(-50%, -100%)`
        el.style.opacity = v.z < 1 ? '1' : '0'
      }
    }
    const onVis = () => loop()
    document.addEventListener('visibilitychange', onVis)
    loop()
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis)
      controls.dispose(); scene.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.() }); renderer.dispose(); renderer.domElement.remove()
    }
  }, [])

  useEffect(() => { api.current.goTo?.(step) }, [step])
  useEffect(() => {
    if (!playing) return undefined
    if (step >= STEP_TO.length - 1) { setPlaying(false); return undefined }
    const id = setTimeout(() => setStep(s => s + 1), step < 0 ? 300 : 4000)
    return () => clearTimeout(id)
  }, [playing, step])

  const cur = step >= 0 ? HAJJ_L.legend[step] : null
  const go = (n) => { setPlaying(false); setStep(Math.max(-1, Math.min(STEP_TO.length - 1, n))) }
  return (
    <figure className="ui-card hj3" data-testid="hajj-3d" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(step + (lang === 'ar' ? -1 : 1)); if (e.key === 'ArrowLeft') go(step + (lang === 'ar' ? 1 : -1)) }}>
      <figcaption className="hj3__head"><span className="hj3__title">{t.title}</span><span className="hj3__lead">{t.lead}</span></figcaption>
      <div className="hj3__stage" ref={wrapRef}>
        {noGl && <p className="hj3__nogl">{t.noGl}</p>}
        {STOP_KEYS.map(k => (
          <span key={k} className={`hj3__label${cur && STEP_TO[step] === k ? ' is-on' : ''}`} ref={el => { labelsRef.current[k] = el }}>{pickUi(HAJJ_L.stops[k], lang)}</span>
        ))}
      </div>
      <div className="hj3__panel" aria-live="polite">
        <ol className="hj3__dots">
          {HAJJ_L.legend.map((s, i) => <li key={s.n}><button type="button" className={i === step ? 'is-on' : i < step ? 'is-done' : ''} onClick={() => go(i)} aria-label={pickUi(s, lang)}>{s.n}</button></li>)}
        </ol>
        <div className="hj3__text" data-testid="hj3-text">
          {cur ? <>
            <p className="hj3__step">{pickUi(cur, lang)}</p>
            {STEP_DAYS[step].map(k => { const d = HAJJ_DAYS.find(x => x.key === k); return d ? <p key={k}><b className="ui-num">{P(d.when, lang)}</b> {P(d.text, lang)}</p> : null })}
          </> : <p>{pickUi(HAJJ_L.desc, lang)}</p>}
        </div>
        <div className="hj3__btns">
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => go(step - 1)} disabled={step < 0}><Icon name="chevronLeft" className="ui-btn__icon ui-flip-rtl" />{t.prev}</button>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => { if (step >= STEP_TO.length - 1) setStep(-1); setPlaying(p => !p) }} data-testid="hj3-play">
            <Icon name={playing ? 'pause' : 'play'} className="ui-btn__icon" />{playing ? t.pause : t.play}
          </button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => go(step + 1)} disabled={step >= STEP_TO.length - 1} data-testid="hj3-next">{t.next}<Icon name="chevron" className="ui-btn__icon ui-flip-rtl" /></button>
        </div>
      </div>
    </figure>
  )
}
