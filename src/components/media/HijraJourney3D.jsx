// ═══════════════════════════════════════════════════════
// HijraJourney3D (v5.9) — Hicrət yolu 3D: Məkkə → Sevr mağarası → sahil yolu → Quba → Mədinə
// (/history → Xəritələr; HajjJourney3D ilə eyni quruluş)
//
//   <HijraJourney3D lang="az" />
//
// • Dayanacaqlar, mətnlər və mənbələr — 2D "Hicrət — addım-addım" xəritəsinin özü
//   (SiraMaps → HJ_STOPS, HJ_SRC; Buxari 3905, 3906, Tövbə 40). Yeni dini mətn yazılmayıb.
// • Yol — eyni təxmini xətt (HIJRA_ROUTE), sahil — sadələşdirilmiş (COAST). Relyef təxminidir:
//   sahildən şərqə Hicaz dağları yüksəlir. Miqyas: 1 vahid ≈ 10 km. İnsan təsviri yoxdur.
// • Addım seçiləndə kamera həmin yerə uçur, keçilmiş yol parlayır; ekrandan çıxanda dayanır.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { G, COAST, NAMES, HJ_STOPS, HJ_SRC, HJ_UI, HIJRA_ROUTE } from './SiraMaps'
import './HajjJourney3D.css'

const T = {
  // lang-ok[Kamera,Kameranı,kamera,kamerada]: az dilinin öz sözüdür (kamera)
  az: { title: 'Hicrət yolu — 3D səyahət', lead: 'Məkkədən Mədinəyə ~450 km: kamera hər dayanacağa uçur. Yolun xətti və relyef təxminidir.', noGl: 'Bu cihazda 3D (WebGL) dəstəklənmir.' },
  en: { title: 'The route of the Hijrah — a 3D journey', lead: 'About 450 km from Mecca to Medina: the camera flies to each stop. The line of the route and the terrain are approximate.', noGl: '3D (WebGL) is not supported on this device.' },
  // lang-ok[D,WebGL]: texniki ad (3D, WebGL)
  ru: { title: 'Путь хиджры — 3D-путешествие', lead: 'Около 450 км от Мекки до Медины: камера летит к каждой остановке. Линия пути и рельеф приблизительны.', noGl: 'На этом устройстве 3D (WebGL) не поддерживается.' },
  // lang-ok[D,WebGL]: texniki ad (3D, WebGL)
  ar: { title: 'طريق الهجرة — رحلة ثلاثية الأبعاد', lead: 'نحو 450 كم من مكة إلى المدينة: تطير الكاميرا إلى كل محطة. خط الطريق والتضاريس تقريبية.', noGl: 'العرض ثلاثي الأبعاد (WebGL) غير مدعوم على هذا الجهاز.' },
  tr: { title: 'Hicret yolu — 3D yolculuk', lead: 'Mekke’den Medine’ye ~450 km: kamera her durağa uçar. Yolun çizgisi ve arazi yaklaşıktır.', noGl: 'Bu cihazda 3D (WebGL) desteklenmiyor.' },
}
const ORIGIN = [22.95, 39.0], KM = 111.0, S = 0.1     // 1 vahid ≈ 10 km
const LABEL_KEYS = ['mecca', 'thawr', 'quba', 'medina']
// Sütun/etiket hündürlüyü: Məkkə–Sevr və Quba–Mədinə bir-birinə çox yaxındır — etiketlər üst-üstə düşməsin
const LABEL_H = { mecca: 3.6, thawr: 1.9, quba: 1.9, medina: 3.6 }
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user')
const L = (o, lang) => (o && (pickUi(o, lang, 'en') || o.az)) || ''

/** enlik/uzunluq → səhnə (x — şərq, z — cənub) */
const toScene = ([lat, lng]) => [(lng - ORIGIN[1]) * KM * Math.cos(ORIGIN[0] * Math.PI / 180) * S, -(lat - ORIGIN[0]) * KM * S]
// Verilmiş enlikdə sahilin uzunluğu (xətti interpolyasiya)
function coastLon(lat) {
  if (lat <= COAST[0][0]) return COAST[0][1]
  for (let i = 1; i < COAST.length; i++) {
    const [a, b] = [COAST[i - 1], COAST[i]]
    if (lat <= b[0]) return a[1] + (b[1] - a[1]) * ((lat - a[0]) / (b[0] - a[0]))
  }
  return COAST[COAST.length - 1][1]
}
const fromScene = (x, z) => [ORIGIN[0] - z / (KM * S), ORIGIN[1] + x / (KM * S * Math.cos(ORIGIN[0] * Math.PI / 180))]
function height(x, z) {
  const [lat, lon] = fromScene(x, z)
  const d = (lon - coastLon(lat)) * KM            // sahildən şərqə km
  // Sahil boyu yumşaq keçid (±8 km) — dəniz səthi ilə kəsişmə dişli görünməsin
  const shore = Math.max(-1, Math.min(1, d / 8)) * 0.12
  if (d < 0) return shore - Math.min(1, -d / 30) * 0.2
  const rise = Math.min(1, d / 70)
  return shore + rise * (0.55 + Math.sin(x * 1.3 + z * 0.4) * 0.22 + Math.cos(z * 0.9 - x * 0.5) * 0.18)
}

export default function HijraJourney3D({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const u = pickUi(HJ_UI, lang) || HJ_UI.en
  const wrapRef = useRef(null)
  const api = useRef({})
  const labelsRef = useRef({})
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [noGl, setNoGl] = useState(false)

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
    scene.background = new THREE.Color('#efd6a8')
    scene.fog = new THREE.Fog('#efd6a8', 30, 80)
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 4; controls.maxDistance = 70
    controls.maxPolarAngle = Math.PI * 0.45
    scene.add(new THREE.HemisphereLight('#fff4dc', '#9c7448', 1.1))
    const sun = new THREE.DirectionalLight('#fff1d6', 1.5); sun.position.set(-20, 30, 10); scene.add(sun)

    // Relyef (sahildən qərbə — dəniz dibi)
    const W = 36, D = 46
    const g = new THREE.PlaneGeometry(W, D, 144, 184); g.rotateX(-Math.PI / 2)
    const pa = g.attributes.position
    for (let i = 0; i < pa.count; i++) pa.setY(i, height(pa.getX(i), pa.getZ(i)))
    g.computeVertexNormals()
    scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#dcb27a', roughness: 1, flatShading: true })))
    // Dəniz yalnız qərb hissədə (sahil x ≈ +4-dən qərbə) — şərq kənarında görünməsin
    const seaW = W / 2 + 6
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(seaW, D), new THREE.MeshStandardMaterial({ color: '#2f7fa6', roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.92 }))
    sea.rotation.x = -Math.PI / 2; sea.position.set(-W / 2 + seaW / 2, 0, 0); scene.add(sea)

    // Yol (təxmini) — yerin üstündə əyri boru
    const pts = HIJRA_ROUTE.map(p => { const [x, z] = toScene(p); return new THREE.Vector3(x, Math.max(0.05, height(x, z)) + 0.12, z) })
    // Yol relyefin üstündən keçsin: dayanacaqlar arası sıx nöqtələr, hər biri yerin hündürlüyündə
    const dense = []
    for (let i = 0; i < pts.length - 1; i++) {
      for (let k = 0; k < 24; k++) {
        const f = k / 24, x = pts[i].x + (pts[i + 1].x - pts[i].x) * f, z = pts[i].z + (pts[i + 1].z - pts[i].z) * f
        dense.push(new THREE.Vector3(x, Math.max(0.05, height(x, z)) + 0.14, z))
      }
    }
    dense.push(pts[pts.length - 1].clone())
    const curve = new THREE.CatmullRomCurve3(dense, false, 'centripetal')
    const N = 900
    const base = new THREE.Mesh(new THREE.TubeGeometry(curve, N, 0.07, 6, false), new THREE.MeshBasicMaterial({ color: '#7a5a28', transparent: true, opacity: 0.4 }))
    scene.add(base)
    const lit = new THREE.Mesh(new THREE.TubeGeometry(curve, N, 0.1, 8, false), new THREE.MeshBasicMaterial({ color: '#f0b429' }))
    scene.add(lit)
    const idxCount = lit.geometry.index.count
    // Hər nöqtənin əyri boyu nisbəti (yolun hansı hissəsi parlasın)
    const tAt = pts.map((p) => {
      let best = 0, bd = Infinity
      for (let i = 0; i <= 200; i++) { const q = curve.getPointAt(i / 200); const dd = q.distanceToSquared(p); if (dd < bd) { bd = dd; best = i / 200 } }
      return best
    })

    // Dayanacaqlar
    const pillar = (key, color) => {
      const [x, z] = toScene(G[key]); const y = Math.max(0.05, height(x, z)), hh = LABEL_H[key] - 0.3
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, hh, 10), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }))
      col.position.set(x, y + hh / 2, z); scene.add(col)
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 24), new THREE.MeshBasicMaterial({ color: '#fff4d0' }))
      ring.position.set(x, y + 0.03, z); scene.add(ring)
      return new THREE.Vector3(x, y, z)
    }
    const at = { mecca: pillar('mecca', '#0e5c46'), thawr: pillar('thawr', '#c79a3a'), quba: pillar('quba', '#c79a3a'), medina: pillar('medina', '#0e5c46') }
    // Sevr dağı — kiçik konus
    const th = at.thawr
    const mount = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.1, 7), new THREE.MeshStandardMaterial({ color: '#9a6f45', roughness: 1, flatShading: true }))
    mount.position.set(th.x + 0.5, th.y + 0.5, th.z + 0.3); scene.add(mount)

    let fly = null
    const view = (n) => {
      const st = HJ_STOPS[n]
      const target = pts[st.at].clone()
      return { p: target.clone().add(new THREE.Vector3(-5, 7, 8)), t: target }
    }
    const setLit = (n) => {
      const frac = tAt[HJ_STOPS[n].at]
      lit.geometry.setDrawRange(0, Math.max(0, Math.round((idxCount / 3) * frac) * 3))
    }
    api.current.goTo = (n) => {
      setLit(n)
      const to = view(n)
      const from = { p: camera.position.clone(), t: controls.target.clone() }
      fly = reduced() ? { from: to, to, t0: 0, d: 1 } : { from, to, t0: performance.now(), d: 1800 }
    }
    const v0 = view(0); camera.position.copy(v0.p).add(new THREE.Vector3(0, 10, 10)); controls.target.copy(v0.t); setLit(0)

    const resize = () => {
      const w = wrap.clientWidth, h = Math.max(320, Math.round(w * (coarse ? 1.0 : 0.56)))
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
      const r = renderer.domElement.getBoundingClientRect()
      for (const k of LABEL_KEYS) {
        const el = labelsRef.current[k]; if (!el) continue
        v.copy(at[k]).add(new THREE.Vector3(0, LABEL_H[k], 0)).project(camera)
        el.style.transform = `translate(${((v.x + 1) / 2 * r.width).toFixed(1)}px, ${((1 - v.y) / 2 * r.height).toFixed(1)}px) translate(-50%, -100%)`
        el.style.opacity = v.z < 1 ? '1' : '0'
      }
    }
    const onVis = () => loop()
    document.addEventListener('visibilitychange', onVis)
    api.current.goTo(0)
    loop()
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis)
      controls.dispose(); scene.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.() }); renderer.dispose(); renderer.domElement.remove()
    }
  }, [])

  useEffect(() => { api.current.goTo?.(step) }, [step])
  useEffect(() => {
    if (!playing) return undefined
    if (step >= HJ_STOPS.length - 1) { setPlaying(false); return undefined }
    const id = setTimeout(() => setStep(s => s + 1), 4200)
    return () => clearTimeout(id)
  }, [playing, step])

  const st = HJ_STOPS[step]
  const src = HJ_SRC[st.src]?.[lang] || HJ_SRC[st.src]?.en || st.src
  const go = (n) => { setPlaying(false); setStep(Math.max(0, Math.min(HJ_STOPS.length - 1, n))) }
  const curKey = LABEL_KEYS.includes(st.k) ? st.k : null
  return (
    <figure className="ui-card hj3" data-testid="hijra-3d" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(step + (lang === 'ar' ? -1 : 1)); if (e.key === 'ArrowLeft') go(step + (lang === 'ar' ? 1 : -1)) }}>
      <figcaption className="hj3__head"><span className="hj3__title">{t.title}</span><span className="hj3__lead">{t.lead}</span></figcaption>
      <div className="hj3__stage" ref={wrapRef} style={{ background: '#efd6a8' }}>
        {noGl && <p className="hj3__nogl">{t.noGl}</p>}
        {LABEL_KEYS.map(k => (
          <span key={k} className={`hj3__label${curKey === k ? ' is-on' : ''}`} ref={el => { labelsRef.current[k] = el }}>{L(NAMES[k], lang)}</span>
        ))}
      </div>
      <div className="hj3__panel" aria-live="polite">
        <ol className="hj3__dots">
          {HJ_STOPS.map((s, i) => <li key={s.k}><button type="button" className={i === step ? 'is-on' : i < step ? 'is-done' : ''} onClick={() => go(i)} aria-label={L(s.t, lang)}>{i + 1}</button></li>)}
        </ol>
        <div className="hj3__text" data-testid="hijra3d-text">
          <p className="hj3__step">{L(st.t, lang)}{st.approx ? <small className="hj3__approx"> · {u.approx}</small> : null}</p>
          <p>{L(st.d, lang)}</p>
          {src && <p><b>{src}</b></p>}
        </div>
        <div className="hj3__btns">
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => go(step - 1)} disabled={step <= 0}><Icon name="chevronLeft" className="ui-btn__icon ui-flip-rtl" />{u.prev}</button>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => { if (step >= HJ_STOPS.length - 1) setStep(0); setPlaying(p => !p) }} data-testid="hijra3d-play">
            <Icon name={playing ? 'pause' : 'play'} className="ui-btn__icon" />{playing ? u.pause : u.play}
          </button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => go(step + 1)} disabled={step >= HJ_STOPS.length - 1} data-testid="hijra3d-next">{u.next}<Icon name="chevron" className="ui-btn__icon ui-flip-rtl" /></button>
        </div>
      </div>
    </figure>
  )
}
