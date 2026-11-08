// ═══════════════════════════════════════════════════════
// Kaaba3D (v5.7) — Məscidül-Haramın sxematik 3D modeli (/holy-places)
//
//   <Kaaba3D lang="az" />
//
// • three.js (yalnız bu komponent yüklənəndə — ayrıca chunk). Barmaqla/siçanla
//   fırlatmaq, iki barmaqla / təkərlə yaxınlaşdırmaq (OrbitControls).
// • Model: Kəbə (≈ 12 × 10.5 m, hündürlük 13 m — təxmini), qara örtük və qızılı
//   kəmər (naxış — yazı yox), qızılı qapı (şimal-şərq divarı), Həcərül-Əsvəd küncü
//   (şərq), Hicr İsmayıl (şimal-qərb yarımdairəsi), Məqami-İbrahim (qapının önü),
//   mərmər meydan (mətaf) və sütunlu qalereya. İnsan təsviri YOXDUR.
// • Təvaf: işıq zərrələri Kəbənin ətrafında saat əqrəbinin ƏKSİNƏ fırlanır.
// • Gündüz / gecə işığı (standart — saytın canlı səması: html[data-sky]).
// • Ekranda deyilsə və ya vərəq gizlidirsə render dayanır; hərəkət azaldılıbsa
//   avtomatik fırlanma və zərrə axını yoxdur. WebGL yoxdursa — izah mətni.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import './Kaaba3D.css'

const T = {
  az: { title: 'Məscidül-Haram — 3D', lead: 'Barmaqla fırladın, iki barmaqla yaxınlaşdırın. İşıqlı zərrələr təvafın istiqamətini göstərir — Kəbə solda qalmaqla, saat əqrəbinin əksinə.', day: 'Gündüz', night: 'Gecə', reset: 'Başa qaytar', note: 'Sxematik model — ölçülər təxminidir.', noGl: 'Bu cihazda 3D (WebGL) dəstəklənmir.',
    legend: { kaaba: 'Kəbə', stone: 'Həcərül-Əsvəd', hijr: 'Hicr İsmayıl', maqam: 'Məqami-İbrahim', tawaf: 'Təvafın istiqaməti' } },
  en: { title: 'Masjid al-Haram — 3D', lead: 'Drag to rotate, pinch to zoom. The glowing particles show the direction of tawaf — anticlockwise, with the Kaaba on your left.', day: 'Day', night: 'Night', reset: 'Reset view', note: 'Schematic model — dimensions are approximate.', noGl: '3D (WebGL) is not supported on this device.',
    legend: { kaaba: 'Kaaba', stone: 'Black Stone', hijr: 'Hijr Ismail', maqam: 'Maqam Ibrahim', tawaf: 'Direction of tawaf' } },
  // lang-ok[D,WebGL]: texniki ad (3D, WebGL)
  ru: { title: 'Запретная мечеть — 3D', lead: 'Вращайте пальцем, приближайте двумя пальцами. Светящиеся частицы показывают направление таваафа — против часовой стрелки, Кааба слева.', day: 'День', night: 'Ночь', reset: 'Сбросить вид', note: 'Схематичная модель — размеры приблизительные.', noGl: 'На этом устройстве 3D (WebGL) не поддерживается.',
    legend: { kaaba: 'Кааба', stone: 'Чёрный камень', hijr: 'Хиджр Исмаил', maqam: 'Макам Ибрахим', tawaf: 'Направление таваафа' } },
  // lang-ok[D,WebGL]: texniki ad (3D, WebGL)
  ar: { title: 'المسجد الحرام — ثلاثي الأبعاد', lead: 'اسحب للتدوير وقرّب بإصبعين. الجسيمات المضيئة تُظهر اتجاه الطواف — عكس عقارب الساعة والكعبة عن يسارك.', day: 'نهار', night: 'ليل', reset: 'إعادة العرض', note: 'نموذج تخطيطي — الأبعاد تقريبية.', noGl: 'العرض ثلاثي الأبعاد (WebGL) غير مدعوم على هذا الجهاز.',
    legend: { kaaba: 'الكعبة', stone: 'الحجر الأسود', hijr: 'حِجر إسماعيل', maqam: 'مقام إبراهيم', tawaf: 'اتجاه الطواف' } },
  tr: { title: 'Mescid-i Haram — 3D', lead: 'Parmakla döndürün, iki parmakla yakınlaştırın. Işıklı parçacıklar tavafın yönünü gösterir — Kâbe solunuzda, saat yönünün tersine.', day: 'Gündüz', night: 'Gece', reset: 'Görünümü sıfırla', note: 'Şematik model — ölçüler yaklaşıktır.', noGl: 'Bu cihazda 3D (WebGL) desteklenmiyor.',
    legend: { kaaba: 'Kâbe', stone: 'Hacerü’l-Esved', hijr: 'Hicr-i İsmail', maqam: 'Makam-ı İbrahim', tawaf: 'Tavafın yönü' } },
}

const reduced = () => typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user'))
const isNightSky = () => { const s = document.documentElement.dataset.sky; return s === 'night' || s === 'isha' || s === 'maghrib' || s === 'fajr' }

/** Kəbənin yan üzü: qara örtük, zərif naxış, qızılı kəmər (yazısız ornament) */
function kiswaTexture(w = 512, h = 512) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const g = c.getContext('2d')
  g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, w, h)
  // zəif diaqonal naxış (örtüyün toxunuşu)
  g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 2
  for (let i = -h; i < w; i += 18) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke() }
  // qızılı kəmər: hündürlüyün ~ üçdə ikisində
  const y = h * 0.2, bh = h * 0.1
  const gold = g.createLinearGradient(0, y, 0, y + bh)
  gold.addColorStop(0, '#8a6a22'); gold.addColorStop(0.5, '#e8c76a'); gold.addColorStop(1, '#8a6a22')
  g.fillStyle = gold; g.fillRect(0, y, w, bh)
  g.fillStyle = '#0b0b0c'
  for (let x = 6; x < w; x += 32) { g.fillRect(x, y + bh * 0.28, 20, bh * 0.44) }      // panellər
  g.fillStyle = '#e8c76a'
  for (let x = 16; x < w; x += 32) { g.beginPath(); g.arc(x, y + bh / 2, bh * 0.12, 0, Math.PI * 2); g.fill() }
  // kəmərin altında kiçik panellər (qandillər kimi)
  for (let x = 40; x < w; x += 128) { g.fillRect(x, y + bh + 6, 48, 34); g.fillStyle = '#0b0b0c'; g.fillRect(x + 6, y + bh + 12, 36, 22); g.fillStyle = '#e8c76a' }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}

function floorTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512
  const g = c.getContext('2d')
  const rg = g.createRadialGradient(256, 256, 20, 256, 256, 256)
  rg.addColorStop(0, '#f4f2ee'); rg.addColorStop(1, '#d9d6cf')
  g.fillStyle = rg; g.fillRect(0, 0, 512, 512)
  g.strokeStyle = 'rgba(120,110,95,0.18)'; g.lineWidth = 1.5
  for (let r = 30; r < 256; r += 26) { g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke() }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

function buildScene(scene) {
  const goldMat = new THREE.MeshStandardMaterial({ color: '#d9b45c', metalness: 0.85, roughness: 0.3, emissive: '#3a2a08', emissiveIntensity: 0.25 })
  // Mətaf (mərmər)
  const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 96), new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.55 }))
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)
  const outer = new THREE.Mesh(new THREE.RingGeometry(60, 140, 96), new THREE.MeshStandardMaterial({ color: '#c9c4ba', roughness: 0.8 }))
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.01; scene.add(outer)

  // Kəbə — künclər təxminən dünya tərəflərinə (Həcərül-Əsvəd — şərq künc)
  const W = 12, D = 10.5, H = 13
  const side = kiswaTexture()
  const top = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.9 })
  const kiswa = new THREE.MeshStandardMaterial({ map: side, roughness: 0.85 })
  const kaaba = new THREE.Group()
  const box = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [kiswa, kiswa, top, top, kiswa, kiswa])
  box.position.y = H / 2; box.castShadow = true; box.receiveShadow = true; kaaba.add(box)
  // Şazırvan (alt kənarda mərmər pillə)
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + 0.8, 0.5, D + 0.8), new THREE.MeshStandardMaterial({ color: '#e9e6e0', roughness: 0.5 }))
  base.position.y = 0.25; kaaba.add(base)
  // Yönlər (yuxarıdan baxanda şimal = −z, şərq = +x). Qrup 135° fırlanır: yerli +z üzü →
  // şimal-şərq (qapı divarı), yerli +x üzü → şimal-qərb (Hicr İsmayıl), yerli (−x,+z) küncü → şərq
  // (Həcərül-Əsvəd). Qapı Həcərül-Əsvəd küncünə yaxındır, yerdən ~2 m hündürdə.
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.9, 3.1, 0.25), goldMat)
  door.position.set(-W / 2 + 3.2, 2.13 + 1.55, D / 2 + 0.1); kaaba.add(door)
  const stoneFrame = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 12, 24), new THREE.MeshStandardMaterial({ color: '#cfd4da', metalness: 0.9, roughness: 0.25 }))
  stoneFrame.position.set(-W / 2 - 0.05, 1.5, D / 2 + 0.05); stoneFrame.rotation.y = -Math.PI / 4; kaaba.add(stoneFrame)
  const stone = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshStandardMaterial({ color: '#1a1414', roughness: 0.4 }))
  stone.position.copy(stoneFrame.position); kaaba.add(stone)
  // Hicr İsmayıl — yerli +x üzünün önündə yarımdairə alçaq divar (uclar açıq)
  const arc = []
  for (let i = 0; i <= 40; i++) { const tt = -Math.PI / 2 + (i / 40) * Math.PI; arc.push(new THREE.Vector3(W / 2 + 0.6 + 8 * Math.cos(tt), 0.8, (D / 2 - 1.3) * Math.sin(tt))) }
  const hijr = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc), 80, 0.75, 8, false), new THREE.MeshStandardMaterial({ color: '#efece6', roughness: 0.45 }))
  hijr.scale.y = 1.4; hijr.castShadow = true; kaaba.add(hijr)
  // Məqami-İbrahim — qapının önündə (~11 m) qızılı kiçik örtük
  const maqam = new THREE.Group()
  const mq = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 2.4, 6), new THREE.MeshStandardMaterial({ color: '#e8d6a0', metalness: 0.6, roughness: 0.25, transparent: true, opacity: 0.88 }))
  mq.position.y = 1.2; maqam.add(mq)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.9, 6), goldMat); cap.position.y = 2.85; maqam.add(cap)
  maqam.position.set(-W / 2 + 3.2, 0, D / 2 + 11); kaaba.add(maqam)
  kaaba.rotation.y = Math.PI * 0.75
  scene.add(kaaba)

  // Sütunlu qalereya — iki mərtəbəli tağlar (sadə)
  const colMat = new THREE.MeshStandardMaterial({ color: '#ece8df', roughness: 0.6 })
  const N = 72, R = 64
  const cols = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.55, 0.65, 9, 10), colMat, N)
  const m = new THREE.Matrix4()
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; m.makeTranslation(Math.cos(a) * R, 4.5, Math.sin(a) * R); cols.setMatrixAt(i, m) }
  cols.castShadow = true; scene.add(cols)
  const roof = new THREE.Mesh(new THREE.TorusGeometry(R, 1.4, 8, 96), colMat); roof.rotation.x = Math.PI / 2; roof.position.y = 9.6; scene.add(roof)
  const roof2 = new THREE.Mesh(new THREE.CylinderGeometry(R + 7, R + 7, 1.2, 96, 1, true), colMat); roof2.position.y = 10.2; scene.add(roof2)
  // Minarələr
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3
    const mn = new THREE.Group()
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 52, 12), colMat); shaft.position.y = 26; mn.add(shaft)
    const balc = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1, 12), colMat); balc.position.y = 40; mn.add(balc)
    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.3, 6, 12), goldMat); tip.position.y = 55; mn.add(tip)
    mn.position.set(Math.cos(a) * (R + 14), 0, Math.sin(a) * (R + 14)); scene.add(mn)
  }

  // Təvaf zərrələri — Kəbənin ətrafında halqalar
  const COUNT = 900
  const pos = new Float32Array(COUNT * 3), meta = new Float32Array(COUNT * 2)
  for (let i = 0; i < COUNT; i++) {
    const r = 11 + Math.random() * 22, a = Math.random() * Math.PI * 2
    meta[i * 2] = r; meta[i * 2 + 1] = a
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 0.6 + Math.random() * 0.4; pos[i * 3 + 2] = Math.sin(a) * r
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#ffe7a3', size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }))
  scene.add(pts)
  return { pts, pos, meta, COUNT, goldMat }
}

export default function Kaaba3D({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const wrapRef = useRef(null)
  const api = useRef({})
  const [night, setNight] = useState(() => (typeof document !== 'undefined' ? isNightSky() : false))
  const [noGl, setNoGl] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
    } catch { setNoGl(true); return undefined }
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    renderer.setPixelRatio(Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1))
    renderer.shadowMap.enabled = !coarse
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    wrap.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 900)
    camera.position.set(58, 34, 58)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 5, 0)
    controls.enableDamping = true; controls.dampingFactor = 0.08
    controls.minDistance = 18; controls.maxDistance = 190
    controls.maxPolarAngle = Math.PI * 0.47; controls.minPolarAngle = Math.PI * 0.08
    controls.enablePan = false
    controls.autoRotate = !reduced(); controls.autoRotateSpeed = 0.35
    controls.update()

    const hemi = new THREE.HemisphereLight('#dfefff', '#8a7a60', 0.9)
    const sun = new THREE.DirectionalLight('#fff3dc', 2.4)
    sun.position.set(-60, 90, 40); sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 10, far: 250 })
    const lamps = new THREE.PointLight('#ffd28a', 0, 160, 1.3); lamps.position.set(30, 40, 30)
    scene.add(hemi, sun, lamps)
    const { pts, pos, meta, COUNT, goldMat } = buildScene(scene)

    const setMode = (isNight) => {
      scene.background = new THREE.Color(isNight ? '#0a1430' : '#9fc8ec')
      scene.fog = new THREE.Fog(isNight ? '#0a1430' : '#cfe2f2', 160, 420)
      hemi.intensity = isNight ? 0.35 : 0.9
      hemi.color.set(isNight ? '#7d8fc8' : '#dfefff')
      sun.intensity = isNight ? 0.25 : 2.4
      sun.color.set(isNight ? '#9fb4ff' : '#fff3dc')
      lamps.intensity = isNight ? 520 : 0
      goldMat.emissiveIntensity = isNight ? 0.55 : 0.25
      renderer.toneMappingExposure = isNight ? 1.1 : 1
    }
    api.current.setMode = setMode
    api.current.reset = () => { camera.position.set(58, 34, 58); controls.target.set(0, 5, 0); controls.update() }
    setMode(isNightSky())

    const resize = () => {
      const w = wrap.clientWidth, h = Math.max(260, Math.round(w * (coarse ? 0.9 : 0.56)))
      renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = `${h}px`
      camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(wrap)

    let visible = true, raf = 0, last = performance.now()
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop() }, { threshold: 0.01 })
    io.observe(wrap)
    const still = reduced()
    const loop = () => {
      cancelAnimationFrame(raf)
      if (!visible || document.hidden) return
      raf = requestAnimationFrame(loop)
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now
      if (!still) {
        // təvaf: yuxarıdan baxanda saat əqrəbinin əksinə — bucaq (x→z) azalır
        for (let i = 0; i < COUNT; i++) {
          const r = meta[i * 2], a = (meta[i * 2 + 1] -= dt * (2.2 / r))
          pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 2] = Math.sin(a) * r
        }
        pts.geometry.attributes.position.needsUpdate = true
      }
      controls.update()
      renderer.render(scene, camera)
    }
    const onVis = () => { last = performance.now(); loop() }
    document.addEventListener('visibilitychange', onVis)
    loop()

    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      controls.dispose()
      scene.traverse(o => { o.geometry?.dispose?.(); const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; mats.forEach(mt => { mt.map?.dispose?.(); mt.dispose?.() }) })
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [])

  useEffect(() => { api.current.setMode?.(night) }, [night])

  return (
    <figure className="ui-card k3d" data-testid="kaaba-3d">
      <figcaption className="k3d__head">
        <span className="k3d__title">{t.title}</span>
        <span className="k3d__lead">{t.lead}</span>
      </figcaption>
      <div className="k3d__stage" ref={wrapRef}>
        {noGl && <p className="k3d__nogl">{t.noGl}</p>}
        <div className="k3d__tools">
          <div className="k3d__modes" role="group">
            {[false, true].map(n => (
              <button key={String(n)} type="button" className={`k3d__mode${night === n ? ' is-on' : ''}`} aria-pressed={night === n} onClick={() => setNight(n)}>
                <Icon name={n ? 'moon' : 'sun'} size={14} /> {n ? t.night : t.day}
              </button>
            ))}
          </div>
          <button type="button" className="k3d__reset" onClick={() => api.current.reset?.()} aria-label={t.reset} title={t.reset}><Icon name="refresh" size={16} /></button>
        </div>
      </div>
      <ul className="k3d__legend">
        <li><i className="k3d__sw k3d__sw--kaaba" />{t.legend.kaaba}</li>
        <li><i className="k3d__sw k3d__sw--stone" />{t.legend.stone}</li>
        <li><i className="k3d__sw k3d__sw--hijr" />{t.legend.hijr}</li>
        <li><i className="k3d__sw k3d__sw--maqam" />{t.legend.maqam}</li>
        <li><i className="k3d__sw k3d__sw--tawaf" />{t.legend.tawaf} ↺</li>
      </ul>
      <small className="k3d__note">{t.note}</small>
    </figure>
  )
}
