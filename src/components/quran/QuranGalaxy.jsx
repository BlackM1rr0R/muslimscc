// ═══════════════════════════════════════════════════════
// QuranGalaxy (v5.8) — 114 surə 3D spiral qalaktikada (/quran)
//
//   <QuranGalaxy lang="az" surahName={(n) => '…'} onOpen={(n) => …} />
//
// • Hər surə bir ulduzdur: mushaf sırası ilə iki qollu spiral boyunca (Fatihə mərkəzdə),
//   ölçüsü ayə sayına görə (√), rəngi — Məkki (qızılı) / Mədəni (firuzəyi).
// • "Nazil olma sırası": işıq xətti surələri vəhy ardıcıllığı ilə birləşdirir (yavaş
//   çəkilir). Məlumat: src/data/surahRevelation.js (Quran.com API v4 — məşhur cədvəl).
// • Fırlat / yaxınlaşdır (OrbitControls); ulduza toxun — məlumat paneli və "Surəni aç".
// • three.js — ayrıca lazy chunk; ekranda deyilsə render dayanır.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { SURAH_TABLE } from '../../data/mushafIndex.js'
import { REVELATION_ORDER, REVELATION_PLACE } from '../../data/surahRevelation.js'
import './QuranGalaxy.css'

const T = {
  az: { title: 'Quran qalaktikası', lead: '114 surə — 114 ulduz. Böyüklük ayə sayıdır, rəng — Məkki və ya Mədəni. Fırladın, ulduza toxunun.', meccan: 'Məkki', medinan: 'Mədəni', order: 'Nazil olma sırası', ayahs: 'ayə', rev: 'nazil olma sırası: {n}', open: 'Surəni aç', note: 'Nazil olma sırası — məşhur cədvəl (Quran.com); alimlərin ictihadıdır, qəti deyil.', noGl: 'Bu cihazda 3D (WebGL) dəstəklənmir.' },
  en: { title: 'Quran galaxy', lead: '114 surahs — 114 stars. Size is the number of verses, colour is Meccan or Medinan. Rotate and tap a star.', meccan: 'Meccan', medinan: 'Medinan', order: 'Order of revelation', ayahs: 'verses', rev: 'revelation order: {n}', open: 'Open surah', note: 'Order of revelation — the well-known table (Quran.com); a scholarly estimate, not definitive.', noGl: '3D (WebGL) is not supported on this device.' },
  // lang-ok[D,WebGL,Quran]: texniki ad / mənbə adı (Quran.com)
  ru: { title: 'Галактика Корана', lead: '114 сур — 114 звёзд. Размер — число аятов, цвет — мекканская или мединская. Вращайте и коснитесь звезды.', meccan: 'Мекканская', medinan: 'Мединская', order: 'Порядок ниспослания', ayahs: 'аятов', rev: 'порядок ниспослания: {n}', open: 'Открыть суру', note: 'Порядок ниспослания — известная таблица (Quran.com); это оценка учёных, не окончательная.', noGl: 'На этом устройстве 3D (WebGL) не поддерживается.' },
  // lang-ok[D,WebGL,Quran]: texniki ad / mənbə adı (Quran.com)
  ar: { title: 'مجرّة القرآن', lead: '١١٤ سورة — ١١٤ نجمًا. الحجم عدد الآيات، واللون مكية أو مدنية. دوّر والمس نجمًا.', meccan: 'مكية', medinan: 'مدنية', order: 'ترتيب النزول', ayahs: 'آية', rev: 'ترتيب النزول: {n}', open: 'افتح السورة', note: 'ترتيب النزول — الجدول المشهور (Quran.com)؛ اجتهاد للعلماء وليس قطعيًا.', noGl: 'العرض ثلاثي الأبعاد (WebGL) غير مدعوم على هذا الجهاز.' },
  // lang-ok[D,WebGL,Quran]: texniki ad / mənbə adı (Quran.com)
  tr: { title: 'Kur’an galaksisi', lead: '114 sure — 114 yıldız. Büyüklük ayet sayısı, renk Mekkî veya Medenî. Döndürün, bir yıldıza dokunun.', meccan: 'Mekkî', medinan: 'Medenî', order: 'İniş sırası', ayahs: 'ayet', rev: 'iniş sırası: {n}', open: 'Sureyi aç', note: 'İniş sırası — meşhur tablo (Quran.com); âlimlerin ictihadıdır, kesin değildir.', noGl: 'Bu cihazda 3D (WebGL) desteklenmiyor.' },
}
const GOLD = new THREE.Color('#f0cf7e'), TEAL = new THREE.Color('#6fe3c4')
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user')

/** Surənin 3D yeri — mushaf sırası ilə iki qollu loqarifmik spiral (saf) */
export function galaxyPos(i) {
  const arm = i % 2, k = Math.floor(i / 2)
  const r = 3 + k * 0.62
  const a = k * 0.33 + arm * Math.PI
  const y = Math.sin(i * 1.7) * (0.6 + k * 0.025)
  return [Math.cos(a) * r, y, Math.sin(a) * r]
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.25, 'rgba(255,255,255,.8)'); rg.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

export default function QuranGalaxy({ lang = 'az', surahName = (n) => String(n), onOpen }) {
  const t = pickUi(T, lang)
  const wrapRef = useRef(null)
  const api = useRef({})
  const [sel, setSel] = useState(null)
  const [order, setOrder] = useState(false)
  const [noGl, setNoGl] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined
    let renderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }) } catch { setNoGl(true); return undefined }
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    renderer.setPixelRatio(Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1))
    renderer.setClearColor('#03050d')
    wrap.prepend(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2('#03050d', 0.012)
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500)
    camera.position.set(0, 26, 42)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false
    controls.minDistance = 8; controls.maxDistance = 90
    controls.autoRotate = !reduced(); controls.autoRotateSpeed = 0.45

    // Fon ulduzları
    const bg = new Float32Array(1800 * 3)
    for (let i = 0; i < 1800; i++) { const r = 80 + Math.random() * 120, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1); bg[i * 3] = r * Math.sin(ph) * Math.cos(th); bg[i * 3 + 1] = r * Math.cos(ph); bg[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) }
    const bgG = new THREE.BufferGeometry(); bgG.setAttribute('position', new THREE.BufferAttribute(bg, 3))
    scene.add(new THREE.Points(bgG, new THREE.PointsMaterial({ color: '#9fb0d8', size: 0.6, sizeAttenuation: true, transparent: true, opacity: 0.6 })))
    // Qalaktika tozu
    const dust = new Float32Array(2600 * 3)
    for (let i = 0; i < 2600; i++) { const p = galaxyPos(Math.floor(Math.random() * 114)); dust[i * 3] = p[0] + (Math.random() - 0.5) * 4; dust[i * 3 + 1] = p[1] + (Math.random() - 0.5) * 1.2; dust[i * 3 + 2] = p[2] + (Math.random() - 0.5) * 4 }
    const dG = new THREE.BufferGeometry(); dG.setAttribute('position', new THREE.BufferAttribute(dust, 3))
    scene.add(new THREE.Points(dG, new THREE.PointsMaterial({ color: '#5b6fb8', size: 0.18, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })))

    // 114 ulduz
    const tex = glowTexture()
    const stars = []
    for (let i = 0; i < 114; i++) {
      const ay = SURAH_TABLE[i][2], med = REVELATION_PLACE[i] === 1
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: med ? TEAL : GOLD, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
      const s = 0.9 + Math.sqrt(ay) * 0.17
      sp.scale.set(s, s, s); sp.position.set(...galaxyPos(i)); sp.userData = { n: i + 1, s }
      scene.add(sp); stars.push(sp)
    }
    // Nazil olma sırası xətti
    const byRev = Array.from({ length: 114 }, (_, i) => i).sort((a, b) => REVELATION_ORDER[a] - REVELATION_ORDER[b])
    const lp = new Float32Array(114 * 3)
    byRev.forEach((i, k) => { const p = galaxyPos(i); lp[k * 3] = p[0]; lp[k * 3 + 1] = p[1]; lp[k * 3 + 2] = p[2] })
    const lG = new THREE.BufferGeometry(); lG.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lG.setDrawRange(0, 0)
    const line = new THREE.Line(lG, new THREE.LineBasicMaterial({ color: '#fff1c4', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending }))
    scene.add(line)
    // Seçim halqası
    const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 48), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, side: THREE.DoubleSide }))
    ring.visible = false; scene.add(ring)

    let drawN = 0, drawing = false
    api.current.setOrder = (on) => { drawing = on; if (!on) { drawN = 0; lG.setDrawRange(0, 0) } else if (reduced()) { drawN = 114; lG.setDrawRange(0, 114) } }
    api.current.select = (n) => {
      if (!n) { ring.visible = false; return }
      const sp = stars[n - 1]; ring.visible = true; ring.position.copy(sp.position); ring.scale.setScalar(sp.userData.s * 0.7)
    }

    const resize = () => {
      const w = wrap.clientWidth, h = Math.max(300, Math.round(w * (coarse ? 1.05 : 0.56)))
      renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = `${h}px`
      camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(wrap)

    // Toxunuş: sürüşdürmə deyilsə — ən yaxın ulduz (ekran məsafəsi ilə)
    let down = null
    const el = renderer.domElement
    const onDown = (e) => { down = { x: e.clientX, y: e.clientY } }
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down = null; return }
      down = null
      const r = el.getBoundingClientRect()
      let best = null, bd = 28
      const v = new THREE.Vector3()
      for (const sp of stars) {
        v.copy(sp.position).project(camera)
        if (v.z > 1) continue
        const sx = (v.x + 1) / 2 * r.width, sy = (1 - v.y) / 2 * r.height
        const d = Math.hypot(sx - (e.clientX - r.left), sy - (e.clientY - r.top))
        if (d < bd) { bd = d; best = sp }
      }
      const n = best ? best.userData.n : null
      setSel(n); api.current.select(n)
      if (n) controls.autoRotate = false
    }
    el.addEventListener('pointerdown', onDown); el.addEventListener('pointerup', onUp)

    let visible = true, raf = 0
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop() }, { threshold: 0.01 })
    io.observe(wrap)
    const t0 = performance.now()
    const loop = () => {
      cancelAnimationFrame(raf)
      if (!visible || document.hidden) return
      raf = requestAnimationFrame(loop)
      const tt = (performance.now() - t0) / 1000
      if (drawing && drawN < 114) { drawN = Math.min(114, drawN + 0.6); lG.setDrawRange(0, Math.floor(drawN)) }
      if (ring.visible) { ring.lookAt(camera.position); ring.material.opacity = 0.55 + Math.sin(tt * 3) * 0.25 }
      controls.update()
      renderer.render(scene, camera)
    }
    const onVis = () => loop()
    document.addEventListener('visibilitychange', onVis)
    loop()
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis)
      el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointerup', onUp)
      controls.dispose(); tex.dispose()
      scene.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.() })
      renderer.dispose(); el.remove()
    }
  }, [])

  useEffect(() => { api.current.setOrder?.(order) }, [order])

  const s = sel ? SURAH_TABLE[sel - 1] : null
  return (
    <figure className="ui-card qgx" data-testid="quran-galaxy">
      <figcaption className="qgx__head">
        <span className="qgx__title">{t.title}</span>
        <span className="qgx__lead">{t.lead}</span>
      </figcaption>
      <div className="qgx__stage" ref={wrapRef}>
        {noGl && <p className="qgx__nogl">{t.noGl}</p>}
        <div className="qgx__tools">
          <ul className="qgx__legend" aria-hidden="true">
            <li><i className="qgx__sw qgx__sw--mk" />{t.meccan}</li>
            <li><i className="qgx__sw qgx__sw--md" />{t.medinan}</li>
          </ul>
          <button type="button" className={`qgx__order${order ? ' is-on' : ''}`} aria-pressed={order} onClick={() => setOrder(o => !o)} data-testid="qgx-order">
            <Icon name="sparkle" size={14} /> {t.order}
          </button>
        </div>
        {s && (
          <div className="qgx__info" data-testid="qgx-info" aria-live="polite">
            <b><span className="ui-num">{sel}.</span> {surahName(sel)}</b>
            <span lang="ar" dir="rtl" className="qgx__ar">{s[4]}</span>
            <span className="ui-num">{s[2]} {t.ayahs} · {REVELATION_PLACE[sel - 1] ? t.medinan : t.meccan} · {t.rev.replace('{n}', REVELATION_ORDER[sel - 1])}</span>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => onOpen?.(sel)}>{t.open}</button>
          </div>
        )}
      </div>
      <small className="qgx__note">{t.note}</small>
    </figure>
  )
}
