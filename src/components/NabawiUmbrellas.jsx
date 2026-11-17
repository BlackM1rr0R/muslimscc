// ═══════════════════════════════════════════════════════
// NabawiUmbrellas (v7.3) — Məscidi-Nəbəvinin həyətindəki nəhəng çətirlər (3D, three.js)
//
// • Mərmər meydançada sıra-sıra hündür, nazik sütunlar; ağ örtüklü çətirlər səhər
//   açılır, axşam yığılır. Arxa planda sadə, qumdaşı rəngli tağlı divar və iki minarə
//   (sahibin qərarı: günbəz ümumiyyətlə modelləşdirilmir).
// • Açılma payı Mədinənin həqiqi günəşinə görədir: çıxış/batış saytın astronomiyası ilə
//   (utils/nabawiUmbrellas.js → asrShadow / rasdQibla / lunar, Meeus). Çıxışdan sonra ~20
//   dəqiqədə açılır, batışa qədərki ~20 dəqiqədə yığılır — illüstrasiya, həqiqi iş saatları dəyişir.
// • Gün sürgüsü 00:00–24:00 (Mədinə vaxtı, Asia/Riyadh), tarix, "İndi". Günəş — istiqamətli
//   işıq + kölgələr, göyün rəngi Günəşin hündürlüyünə görə, gecə ulduzlar və sütun fənərləri.
// • Barmaqla/siçanla fırlatmaq (öz pointer kodu), ox düymələri; hərəkət azaldılmayıbsa yavaş
//   avtomatik fırlanma. Render yalnız ekrandadırsa, vərəq görünürsə və nəsə dəyişəndə.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { pickUi } from '../utils/uiText'
import Icon from './Icon'
import {
  medinaDate, medinaMidnight, medinaMinutes, dateKey, parseDateKey, fmtHM, medinaSunDay,
  openFraction, phaseOf, sunAt, skyColor, lightLevels, umbrellaGrid, canopyPositions, canopyIndex,
} from '../utils/nabawiUmbrellas'
import '../styles/NabawiUmbrellas.css'

const T = {
  az: {
    ey: 'Mədinə', title: 'Peyğəmbər məscidinin çətirləri',
    lead: 'Mədinədə Məscidi-Nəbəvinin həyətlərində onlarla nəhəng çətir dayanır. Səhər günəş çıxandan sonra onların ağ örtükləri açılır və həyətdə namaz qılanları yandırıcı istidən qoruyur, axşam isə yenidən hündür sütunlarının ətrafına yığılır. Vaxtı sürüşdürün — səhnə Mədinənin həmin günkü həqiqi günəşi ilə işıqlanır.',
    time: 'Mədinə vaxtı', date: 'Tarix', now: 'İndi', rise: 'Günəş çıxır', set: 'Günəş batır', alt: 'Günəşin hündürlüyü', open: 'Açıqlıq',
    ph: { closed: 'Çətirlər yığılıb', opening: 'Çətirlər açılır', open: 'Çətirlər açıqdır', closing: 'Çətirlər yığılır' },
    slider: 'Günün vaxtı (Mədinə)', drag: 'Səhnəni fırlatmaq üçün sürüşdürün',
    noGl: 'Bu cihazda 3D (WebGL) dəstəklənmir. Vaxtı sürüşdürüb çətirlərin vəziyyətini yenə də izləyə bilərsiniz.',
    note: 'Günəşin çıxışı və batışı Mədinə üçün hesablanır (Meeus, Asia/Riyadh vaxtı). Çətirlərin burada açılıb-yığılma vaxtı sadəcə illüstrasiyadır — həqiqi iş saatları mövsümə və havaya görə dəyişir.', // lang-ok[Meeus,Asia,Riyadh]: müəllif adı və vaxt qurşağı
  },
  en: {
    ey: 'Medina', title: 'The umbrellas of the Prophet’s Mosque',
    lead: 'Dozens of giant umbrellas stand in the courtyards of al-Masjid an-Nabawi in Medina. In the morning, after sunrise, their white membranes open and shade the worshippers in the courtyard from the burning heat; in the evening they fold back around their tall columns. Move the time — the scene is lit by Medina’s real sun for that day.',
    time: 'Medina time', date: 'Date', now: 'Now', rise: 'Sunrise', set: 'Sunset', alt: 'Sun’s altitude', open: 'Open',
    ph: { closed: 'Umbrellas closed', opening: 'Umbrellas opening', open: 'Umbrellas open', closing: 'Umbrellas closing' },
    slider: 'Time of day (Medina)', drag: 'Drag to turn the scene',
    noGl: '3D (WebGL) is not supported on this device. You can still move the time and follow the umbrellas’ state.',
    note: 'Sunrise and sunset are calculated for Medina (Meeus, Asia/Riyadh time). The opening and closing times shown here are only an illustration — real operating times vary with the season and the weather.',
  },
  ru: {
    ey: 'Медина', title: 'Зонты Мечети Пророка',
    lead: 'Во дворах Мечети Пророка в Медине стоят десятки огромных зонтов. Утром, после восхода, их белые мембраны раскрываются и защищают молящихся во дворе от палящего зноя, а вечером снова складываются вокруг высоких колонн. Двигайте время — сцену освещает настоящее солнце Медины в этот день.',
    time: 'Время Медины', date: 'Дата', now: 'Сейчас', rise: 'Восход', set: 'Закат', alt: 'Высота Солнца', open: 'Раскрытие',
    ph: { closed: 'Зонты сложены', opening: 'Зонты раскрываются', open: 'Зонты раскрыты', closing: 'Зонты складываются' },
    slider: 'Время суток (Медина)', drag: 'Потяните, чтобы повернуть сцену',
    noGl: 'На этом устройстве 3D (WebGL) не поддерживается. Вы всё равно можете двигать время и следить за состоянием зонтов.', // lang-ok[D,WebGL]: texniki termin
    note: 'Восход и закат рассчитаны для Медины (по Меёсу, время Эр-Рияда). Время раскрытия и складывания здесь — лишь иллюстрация: настоящий график зависит от сезона и погоды.',
  },
  ar: {
    ey: 'المدينة المنورة', title: 'مظلات المسجد النبوي',
    lead: 'تقف في ساحات المسجد النبوي بالمدينة المنورة عشرات المظلات الضخمة. في الصباح، بعد شروق الشمس، تنفتح أغشيتها البيضاء فتظلّل المصلين في الساحة من شدة الحر، وفي المساء تنطوي من جديد حول أعمدتها العالية. حرّك الوقت — فالمشهد تضيئه شمس المدينة الحقيقية في ذلك اليوم.',
    time: 'توقيت المدينة', date: 'التاريخ', now: 'الآن', rise: 'الشروق', set: 'الغروب', alt: 'ارتفاع الشمس', open: 'الانفتاح',
    ph: { closed: 'المظلات مطوية', opening: 'المظلات تنفتح', open: 'المظلات مفتوحة', closing: 'المظلات تنطوي' },
    slider: 'وقت اليوم (المدينة)', drag: 'اسحب لتدوير المشهد',
    noGl: 'العرض ثلاثي الأبعاد غير مدعوم على هذا الجهاز، ويمكنك مع ذلك تحريك الوقت ومتابعة حال المظلات.',
    note: 'يُحسب الشروق والغروب للمدينة المنورة (طريقة ميوس، بتوقيت الرياض). أوقات فتح المظلات وطيّها هنا للتوضيح فقط، والمواعيد الفعلية تختلف بحسب الموسم والطقس.',
  },
  tr: {
    ey: 'Medine', title: 'Mescid-i Nebevî’nin şemsiyeleri',
    lead: 'Medine’de Mescid-i Nebevî’nin avlularında onlarca dev şemsiye durur. Sabah güneş doğduktan sonra beyaz örtüleri açılır ve avluda namaz kılanları kavurucu sıcaktan korur; akşam ise yüksek sütunlarının etrafına yeniden kapanır. Saati kaydırın — sahne o gün Medine’nin gerçek güneşiyle aydınlanır.',
    time: 'Medine saati', date: 'Tarih', now: 'Şimdi', rise: 'Güneş doğuyor', set: 'Güneş batıyor', alt: 'Güneşin yüksekliği', open: 'Açıklık',
    ph: { closed: 'Şemsiyeler kapalı', opening: 'Şemsiyeler açılıyor', open: 'Şemsiyeler açık', closing: 'Şemsiyeler kapanıyor' },
    slider: 'Günün saati (Medine)', drag: 'Sahneyi döndürmek için sürükleyin',
    noGl: 'Bu cihazda 3D (WebGL) desteklenmiyor. Yine de saati kaydırıp şemsiyelerin durumunu izleyebilirsiniz.',
    note: 'Gün doğumu ve batımı Medine için hesaplanır (Meeus, Asia/Riyadh saati). Şemsiyelerin burada açılıp kapanma saatleri yalnızca bir illüstrasyondur — gerçek çalışma saatleri mevsime ve havaya göre değişir.',
  },
}

const HALF = 7          // çətirin yarım tərəfi (səhnə vahidi)
const COL_H = 13        // sütunun hündürlüyü
const ROWS = 3, COLS = 6
const S_SEG = 6, A_SEG = 3

// Mərmər döşəmənin teksturası (kanvasda; yoxdursa — düz rəng)
function marbleTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256
  const g = c.getContext?.('2d')
  if (!g) return null
  g.fillStyle = '#f3f0ea'; g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = `rgba(150,140,130,${0.04 + Math.random() * 0.06})`; g.lineWidth = 0.6 + Math.random()
    g.beginPath(); const x = Math.random() * 256, y = Math.random() * 256
    g.moveTo(x, y); g.bezierCurveTo(x + 30, y + Math.random() * 20, x + 50, y - 10, x + 80, y + Math.random() * 30); g.stroke()
  }
  g.strokeStyle = 'rgba(120,110,100,.35)'; g.lineWidth = 2
  g.strokeRect(1, 1, 254, 254)
  g.strokeStyle = 'rgba(176,150,110,.5)'; g.lineWidth = 3
  g.beginPath(); g.moveTo(128, 30); g.lineTo(226, 128); g.lineTo(128, 226); g.lineTo(30, 128); g.closePath(); g.stroke()
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 24); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}

function buildScene(scene) {
  const sand = new THREE.MeshStandardMaterial({ color: '#d8c19b', roughness: 0.9 })
  const sandDark = new THREE.MeshStandardMaterial({ color: '#9c8462', roughness: 0.95 })
  const stone = new THREE.MeshStandardMaterial({ color: '#ece6dc', roughness: 0.55 })
  const lampMat = new THREE.MeshStandardMaterial({ color: '#fff3d0', emissive: '#ffcf7a', emissiveIntensity: 0, roughness: 0.4 })
  const membrane = new THREE.MeshStandardMaterial({ color: '#fbfaf6', roughness: 0.75, side: THREE.DoubleSide, emissive: '#fff7e6', emissiveIntensity: 0.04 })
  const tex = marbleTexture()
  const floorMat = new THREE.MeshStandardMaterial({ color: tex ? '#ffffff' : '#efebe3', map: tex, roughness: 0.35, metalness: 0.02 })

  // Mərmər meydança
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(170, 140), floorMat)
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)

  // Arxa plan: şimalda tağlı divar (günbəzsiz), yanlarda alçaq divarlar, iki minarə
  const wall = new THREE.Mesh(new THREE.BoxGeometry(150, 16, 4), sand)
  wall.position.set(0, 8, -42); wall.castShadow = wall.receiveShadow = true; scene.add(wall)
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(152, 1.2, 5), stone)
  cornice.position.set(0, 16.2, -42); scene.add(cornice)
  const arch = new THREE.Shape()
  arch.moveTo(-2.1, 0); arch.lineTo(-2.1, 7); arch.absarc(0, 7, 2.1, Math.PI, 0, true); arch.lineTo(2.1, 0); arch.lineTo(-2.1, 0)
  const archGeo = new THREE.ShapeGeometry(arch, 10)
  for (let x = -70; x <= 70; x += 7) {
    const a = new THREE.Mesh(archGeo, sandDark); a.position.set(x, 0.6, -39.95); scene.add(a)
  }
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(3, 10, 84), sand)
    side.position.set(sx * 76, 5, 0); side.castShadow = side.receiveShadow = true; scene.add(side)
    // Minarə: kvadrat əsas, səkkizbucaqlı gövdə, iki şərəfə, konusvari ucluq
    const m = new THREE.Group(); m.position.set(sx * 62, 0, -44)
    const base = new THREE.Mesh(new THREE.BoxGeometry(7, 20, 7), sand); base.position.y = 10
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 22, 8), sand); shaft.position.y = 31
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.2, 1.2, 8), stone); b1.position.y = 34
    const s2 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 9, 8), sand); s2.position.y = 46.5
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.5, 1, 8), stone); b2.position.y = 46
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.9, 7, 8), stone); cap.position.y = 54.5
    for (const p of [base, shaft, b1, s2, b2, cap]) { p.castShadow = true; m.add(p) }
    scene.add(m)
  }

  // Çətirlər: ümumi örtük həndəsəsi (hamısı eyni anda açılır)
  const canopyGeo = new THREE.BufferGeometry()
  const pos = canopyPositions(0, HALF, S_SEG, A_SEG)
  canopyGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  canopyGeo.setIndex(canopyIndex(S_SEG, A_SEG))
  canopyGeo.computeVertexNormals()
  const colGeo = new THREE.CylinderGeometry(0.32, 0.4, COL_H, 12)
  const plinthGeo = new THREE.BoxGeometry(1.4, 0.8, 1.4)
  const capGeo = new THREE.CylinderGeometry(0.55, 0.35, 0.8, 12)
  const lampGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 12)
  for (const p of umbrellaGrid(ROWS, COLS, HALF * 2 + 0.3)) {
    const col = new THREE.Mesh(colGeo, stone); col.position.set(p.x, COL_H / 2, p.z + 6)
    const pl = new THREE.Mesh(plinthGeo, stone); pl.position.set(p.x, 0.4, p.z + 6)
    const cap = new THREE.Mesh(capGeo, stone); cap.position.set(p.x, COL_H - 0.2, p.z + 6)
    const lamp = new THREE.Mesh(lampGeo, lampMat); lamp.position.set(p.x, 2.4, p.z + 6)
    const can = new THREE.Mesh(canopyGeo, membrane); can.position.set(p.x, COL_H, p.z + 6)
    col.castShadow = cap.castShadow = can.castShadow = true
    can.receiveShadow = col.receiveShadow = true
    scene.add(col, pl, cap, lamp, can)
  }

  // Ulduzlar (yalnız gecə görünür)
  const N = 420, sp = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const u = Math.random(), v = Math.random() * 0.95
    const th = u * Math.PI * 2, el = Math.asin(0.08 + v * 0.92)
    sp[i * 3] = Math.cos(el) * Math.cos(th) * 380; sp[i * 3 + 1] = Math.sin(el) * 380; sp[i * 3 + 2] = Math.cos(el) * Math.sin(th) * 380
  }
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3))
  const starMat = new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })
  const stars = new THREE.Points(starGeo, starMat); scene.add(stars)

  // Günəş diski
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(7, 20, 12), new THREE.MeshBasicMaterial({ color: '#fff4cc', fog: false }))
  scene.add(sunDisc)

  return { canopyGeo, pos, lampMat, membrane, starMat, sunDisc }
}

export default function NabawiUmbrellas() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const [init] = useState(() => { const n = Date.now(); return { date: medinaDate(n), min: Math.round(medinaMinutes(n)) } })
  const [date, setDate] = useState(init.date)
  const [min, setMin] = useState(init.min)
  const [noGl, setNoGl] = useState(false)
  const wrapRef = useRef(null)
  const apiRef = useRef(null)

  const day = useMemo(() => medinaSunDay(date), [date])
  const ms = medinaMidnight(date) + min * 60000
  const sun = useMemo(() => sunAt(ms), [ms])
  const open = openFraction(min, day)
  const phase = phaseOf(min, day)
  const sky = skyColor(sun.alt)

  // Səhnə — bir dəfə qurulur
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' })
      if (!renderer.getContext()) throw new Error('no gl')
    } catch { setNoGl(true); return undefined }
    const small = Math.min(window.innerWidth, window.innerHeight) < 700
    renderer.setPixelRatio(Math.min(small ? 1.5 : 1.75, window.devicePixelRatio || 1))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    wrap.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#88b4e0')
    scene.fog = new THREE.Fog('#88b4e0', 140, 420)
    const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 900)
    const hemi = new THREE.HemisphereLight('#fff6e6', '#b9a789', 1.2); scene.add(hemi)
    const sunL = new THREE.DirectionalLight('#fff0d4', 2.4)
    sunL.castShadow = true
    sunL.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048)
    Object.assign(sunL.shadow.camera, { left: -85, right: 85, top: 85, bottom: -85, near: 1, far: 400 })
    sunL.shadow.bias = -0.0004; sunL.shadow.normalBias = 0.04
    scene.add(sunL, sunL.target)
    const moonL = new THREE.DirectionalLight('#9fb4ff', 0); moonL.position.set(-60, 120, 40); scene.add(moonL)
    const parts = buildScene(scene)

    // Kamera orbiti
    const cam = { yaw: 0.35, pitch: 0.36, r: 115, target: new THREE.Vector3(0, 7, -2) }
    let state = { open: -1, vec: [0, 1, 0], alt: 30, sky: '#88b4e0' }
    let dirty = true, raf = 0, visible = false, last = 0, dragging = false, idleUntil = 0
    let auto = false

    const place = () => {
      const r = cam.r * (camera.aspect < 1 ? 1.45 : 1)
      camera.position.set(
        cam.target.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * r,
        cam.target.y + Math.sin(cam.pitch) * r,
        cam.target.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * r,
      )
      camera.lookAt(cam.target)
    }
    const render = () => { place(); renderer.render(scene, camera); dirty = false }
    const loop = (t) => {
      raf = 0
      if (!visible || document.hidden) return
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t
      const spinning = auto && !dragging && t > idleUntil
      if (spinning) { cam.yaw += dt * 0.06; dirty = true }
      if (dirty) render()
      if (spinning || dragging) raf = requestAnimationFrame(loop)
      else last = 0
    }
    const kick = () => { dirty = true; if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop) }

    const apply = (s) => {
      if (Math.abs(s.open - state.open) > 0.0005) {
        canopyPositions(s.open, HALF, S_SEG, A_SEG, parts.pos)
        parts.canopyGeo.attributes.position.needsUpdate = true
        parts.canopyGeo.computeVertexNormals()
        parts.canopyGeo.computeBoundingSphere()
      }
      const lv = lightLevels(s.alt)
      const [x, y, z] = s.vec
      sunL.position.set(x * 200, y * 200, z * 200); sunL.target.position.set(0, 0, 0)
      sunL.intensity = lv.sun
      sunL.castShadow = lv.sun > 0.02
      const warm = Math.max(0, Math.min(1, 1 - s.alt / 18))
      sunL.color.setRGB(1, 0.94 - 0.22 * warm, 0.84 - 0.4 * warm)
      hemi.intensity = lv.ambient
      const night = Math.max(0, Math.min(1, (-s.alt - 2) / 10))
      moonL.intensity = 0.35 * night
      parts.lampMat.emissiveIntensity = 2.2 * night
      parts.membrane.emissiveIntensity = 0.04 + 0.1 * night
      parts.starMat.opacity = night
      parts.sunDisc.visible = s.alt > -1.5
      parts.sunDisc.position.set(x * 360, y * 360, z * 360)
      scene.background.set(s.sky); scene.fog.color.set(s.sky)
      renderer.toneMappingExposure = 0.85 + 0.25 * (1 - night)
      state = s
      kick()
    }
    apiRef.current = {
      apply,
      setAuto: (on) => { auto = on; kick() },
    }

    // Göstərici ilə fırlatma
    let px = 0, py = 0, pid = null
    const down = (e) => {
      if (e.button != null && e.button !== 0) return
      dragging = true; pid = e.pointerId; px = e.clientX; py = e.clientY
      try { wrap.setPointerCapture(e.pointerId) } catch { /* */ }
      kick()
    }
    const move = (e) => {
      if (!dragging || e.pointerId !== pid) return
      cam.yaw -= (e.clientX - px) * 0.006
      cam.pitch = Math.max(0.08, Math.min(1.25, cam.pitch + (e.clientY - py) * 0.004))
      px = e.clientX; py = e.clientY; dirty = true
    }
    const up = (e) => {
      if (e.pointerId !== pid) return
      dragging = false; pid = null; idleUntil = performance.now() + 5000; kick()
    }
    const key = (e) => {
      const k = { ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, 0.06], ArrowDown: [0, -0.06] }[e.key]
      if (!k) return
      e.preventDefault()
      cam.yaw += k[0]; cam.pitch = Math.max(0.08, Math.min(1.25, cam.pitch + k[1]))
      idleUntil = performance.now() + 5000; kick()
    }
    wrap.addEventListener('pointerdown', down)
    wrap.addEventListener('pointermove', move)
    wrap.addEventListener('pointerup', up)
    wrap.addEventListener('pointercancel', up)
    wrap.addEventListener('keydown', key)

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'
      camera.aspect = w / h; camera.updateProjectionMatrix()
      kick()
    }
    const ro = new ResizeObserver(resize); ro.observe(wrap)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick() })
    io.observe(wrap)
    const vis = () => { if (!document.hidden) kick() }
    document.addEventListener('visibilitychange', vis)
    resize()

    return () => {
      apiRef.current = null
      cancelAnimationFrame(raf)
      io.disconnect(); ro.disconnect()
      document.removeEventListener('visibilitychange', vis)
      wrap.removeEventListener('pointerdown', down)
      wrap.removeEventListener('pointermove', move)
      wrap.removeEventListener('pointerup', up)
      wrap.removeEventListener('pointercancel', up)
      wrap.removeEventListener('keydown', key)
      scene.traverse(o => {
        o.geometry?.dispose?.()
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
        mats.forEach(m => { m.map?.dispose?.(); m.dispose?.() })
      })
      sunL.shadow.map?.dispose?.()
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [])

  // Vaxt/tarix dəyişəndə səhnəni yenilə
  useEffect(() => { apiRef.current?.apply({ open, vec: sun.vec, alt: sun.alt, sky }) }, [open, sun, sky, noGl])
  useEffect(() => { apiRef.current?.setAuto(!reduced) }, [reduced, noGl])

  const goNow = () => { const n = Date.now(); setDate(medinaDate(n)); setMin(Math.round(medinaMinutes(n))) }
  const pct = (m) => `${((m / 1440) * 100).toFixed(2)}%`
  // Sürgünün altındakı zolaq: gecə — gündüz, açıq dövr vurğulanır
  const band = day.riseMin != null && day.setMin != null
    ? `linear-gradient(90deg, var(--nu-night) 0 ${pct(day.riseMin)}, var(--nu-day) ${pct(day.riseMin)} ${pct(day.riseMin + 20)}, var(--nu-open) ${pct(day.riseMin + 20)} ${pct(day.setMin - 20)}, var(--nu-day) ${pct(day.setMin - 20)} ${pct(day.setMin)}, var(--nu-night) ${pct(day.setMin)} 100%)`
    : 'var(--nu-night)'
  const round2 = Math.round(open * 100) / 100

  return (
    <section className="ui-card nu" aria-labelledby="nu-title" data-testid="nabawi-umbrellas" data-open={String(round2)} data-phase={phase}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="nu-title" className="nu__title">{u.title}</h2>
      <p className="nu__lead">{u.lead}</p>

      <div className="nu__stage" ref={wrapRef} tabIndex={noGl ? -1 : 0} role="group" aria-label={`${u.title} — ${u.ph[phase]}, ${fmtHM(min)}`} style={{ background: sky }}>
        {noGl && (
          <div className="nu__nogl">
            <p>{u.noGl}</p>
            <div className="nu__fallback" aria-hidden="true"><span style={{ transform: `scaleX(${0.12 + 0.88 * open})` }} /><i /></div>
          </div>
        )}
        <span className="nu__badge" aria-live="polite"><Icon name={sun.alt > 0 ? 'sun' : 'moon'} size={16} /> {u.ph[phase]}</span>
        {!noGl && <span className="nu__hint">{u.drag}</span>}
      </div>

      <div className="nu__controls">
        <div className="nu__row">
          <label className="nu__clock">
            <span>{u.time}</span>
            <strong className="ui-num" dir="ltr">{fmtHM(min)}</strong>
          </label>
          <label className="nu__date">
            <span>{u.date}</span>
            <input type="date" value={dateKey(date)} data-testid="nu-date"
              onChange={e => { const d = parseDateKey(e.target.value); if (d) setDate(d) }} />
          </label>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="nu-now" onClick={goNow}>
            <Icon name="prayer" size={16} /> {u.now}
          </button>
        </div>
        <div className="nu__slider" dir="ltr">
          <div className="nu__band" style={{ background: band }} aria-hidden="true" />
          <input type="range" min="0" max="1440" step="1" value={min} data-testid="nu-time"
            aria-label={u.slider} aria-valuetext={`${fmtHM(min)} — ${u.ph[phase]}`}
            onChange={e => setMin(+e.target.value)} />
          <div className="nu__ticks" aria-hidden="true"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
        </div>
        <dl className="nu__read">
          <div><dt>{u.rise}</dt><dd className="ui-num" dir="ltr">{day.riseMin != null ? fmtHM(day.riseMin) : '—'}</dd></div>
          <div><dt>{u.set}</dt><dd className="ui-num" dir="ltr">{day.setMin != null ? fmtHM(day.setMin) : '—'}</dd></div>
          <div><dt>{u.alt}</dt><dd className="ui-num" dir="ltr">{sun.alt.toFixed(1)}°</dd></div>
          <div><dt>{u.open}</dt><dd className="ui-num" dir="ltr">{Math.round(open * 100)}%</dd></div>
        </dl>
      </div>
      <p className="nu__note">{u.note}</p>
    </section>
  )
}
