// ═══════════════════════════════════════════════════════
// SurahCity3D (v6.3) — "Surələr şəhəri" (/quran)
//
//   <SurahCity3D lang="az" surahName={n => …} onOpen={n => …} />
//
// • 114 surə — 114 bina. Hündürlük ayə sayına görə (mushafIndex SURAH_TABLE), rəng — Məkki (qızılı)
//   və ya Mədəni (zümrüd); küçə NAZİL OLMA SIRASI ilə uzanır (data/surahRevelation.js — Quran.com,
//   məşhur cədvəl, qəti deyil — qeyd göstərilir). Məkkidən Mədəniyə ilk keçiddə "Hicrət qapısı".
// • Çək — fırlat, təkər/iki barmaq — yaxınlaş; "Küçə ilə uç" — kamera nazil olma sırası ilə uçur.
//   Binaya toxun və ya siyahıdan seç → kart (ad, ayə sayı, sıra) və "Surəni aç".
// • Ekrandan çıxanda dayanır; hərəkət azaldılıbsa — uçuş yoxdur. WebGL yoxdursa — siyahı qalır.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { SURAH_TABLE } from '../../data/mushafIndex'
import { surahCityData } from '../../utils/surahCity'
import '../../styles/SurahCity3D.css'

const T = {
  az: { ey: 'Surələr şəhəri', title: '114 surə — 114 bina', lead: 'Binanın hündürlüyü surənin ayə sayına görədir; qızılı — Məkki, zümrüd — Mədəni surələr. Küçə nazil olma sırası ilə uzanır. Çəkib fırladın, binaya toxunun.', fly: 'Küçə ilə uç', stop: 'Dayandır', pick: 'Surə seç', ayahs: 'ayə', order: 'Nazil olma sırası', makki: 'Məkki', madani: 'Mədəni', open: 'Surəni aç', hijra: 'Hicrət', noGl: 'Bu cihazda 3D görünüş açılmadı — surəni siyahıdan seçin.', note: 'Nazil olma sırası alimlərin ictihadına əsaslanan məşhur cədvəldir (Quran.com), qəti deyil.' },
  en: { ey: 'City of surahs', title: '114 surahs — 114 buildings', lead: 'Each building’s height follows the number of ayahs in the surah; gold — Meccan, emerald — Medinan surahs. The street runs in the order of revelation. Drag to turn, tap a building.', fly: 'Fly down the street', stop: 'Stop', pick: 'Choose a surah', ayahs: 'ayahs', order: 'Order of revelation', makki: 'Meccan', madani: 'Medinan', open: 'Open the surah', hijra: 'Hijrah', noGl: '3D view did not open on this device — choose a surah from the list.', note: 'The order of revelation is a well-known table based on scholars’ ijtihad (Quran.com); it is not definitive.' },
  // lang-ok[D,Quran]: 3D və Quran.com — texniki/sayt adı
  ru: { ey: 'Город сур', title: '114 сур — 114 зданий', lead: 'Высота здания — по числу аятов в суре; золотые — мекканские, изумрудные — мединские суры. Улица идёт в порядке ниспослания. Поворачивайте перетаскиванием, касайтесь зданий.', fly: 'Пролететь по улице', stop: 'Стоп', pick: 'Выберите суру', ayahs: 'аятов', order: 'Порядок ниспослания', makki: 'Мекканская', madani: 'Мединская', open: 'Открыть суру', hijra: 'Хиджра', noGl: 'На этом устройстве 3D не открылся — выберите суру из списка.', note: 'Порядок ниспослания — известная таблица, основанная на иджтихаде учёных (Quran.com); она не окончательна.' },
  // lang-ok[D,Quran]: 3D və Quran.com — texniki/sayt adı
  ar: { ey: 'مدينة السور', title: '114 سورة — 114 بناء', lead: 'ارتفاع كل بناء بعدد آيات السورة؛ الذهبي مكي والزمردي مدني. والشارع على ترتيب النزول. اسحب للتدوير والمس بناءً.', fly: 'حلّق على الشارع', stop: 'إيقاف', pick: 'اختر سورة', ayahs: 'آية', order: 'ترتيب النزول', makki: 'مكية', madani: 'مدنية', open: 'افتح السورة', hijra: 'الهجرة', noGl: 'لم يُفتح العرض ثلاثي الأبعاد على هذا الجهاز — اختر السورة من القائمة.', note: 'ترتيب النزول جدول مشهور قائم على اجتهاد العلماء (Quran.com)، وليس قطعيًا.' },
  // lang-ok[D,Quran]: 3D və Quran.com — texniki/sayt adı
  tr: { ey: 'Sureler şehri', title: '114 sure — 114 bina', lead: 'Binanın yüksekliği surenin âyet sayısına göredir; altın — Mekkî, zümrüt — Medenî sureler. Cadde iniş sırasına göre uzanır. Sürükleyip döndürün, binaya dokunun.', fly: 'Cadde boyunca uç', stop: 'Durdur', pick: 'Sure seç', ayahs: 'âyet', order: 'İniş sırası', makki: 'Mekkî', madani: 'Medenî', open: 'Sureyi aç', hijra: 'Hicret', noGl: 'Bu cihazda 3D görünüm açılamadı — sureyi listeden seçin.', note: 'İniş sırası, âlimlerin içtihadına dayanan meşhur bir tablodur (Quran.com); kesin değildir.' },
}
const GOLD = '#d9b26a', EMERALD = '#2fae86'
const motionOk = () => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('a11y-reduce-motion') } catch { return true } }

// Küçə: nazil olma sırası u ∈ [0,1] boyunca ilan kimi əyri
const road = (u) => new THREE.Vector3(Math.sin(u * Math.PI * 3) * 16, 0, 64 - u * 128)

export default function SurahCity3D({ lang = 'az', surahName = (n) => SURAH_TABLE[n - 1]?.[5], onOpen }) {
  const t = pickUi(T, lang)
  const wrapRef = useRef(null)
  const labelRef = useRef(null)
  const api = useRef({})
  const [sel, setSel] = useState(null)
  const [flying, setFlying] = useState(false)
  const [noGl, setNoGl] = useState(false)
  const data = useMemo(() => surahCityData(), [])
  const byOrder = useMemo(() => [...data].sort((a, b) => a.order - b.order), [data])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined
    let renderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' }) } catch { setNoGl(true); return undefined }
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    renderer.setPixelRatio(Math.min(coarse ? 1.5 : 2, window.devicePixelRatio || 1))
    const el = renderer.domElement
    wrap.prepend(el); el.setAttribute('aria-hidden', 'true')
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a1226')
    scene.fog = new THREE.Fog('#0a1226', 70, 190)
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400)
    scene.add(new THREE.HemisphereLight('#cfe0ff', '#1a1408', 0.85))
    const sun = new THREE.DirectionalLight('#fff1d0', 1.3); sun.position.set(30, 60, 20); scene.add(sun)

    // Yer və küçə
    const ground = new THREE.Mesh(new THREE.CircleGeometry(150, 64), new THREE.MeshStandardMaterial({ color: '#141c33', roughness: 1 }))
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground)
    const pts = Array.from({ length: 241 }, (_, i) => road(i / 240))
    const roadGeo = new THREE.BufferGeometry()
    const verts = []
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], d = b.clone().sub(a).normalize(), nrm = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(1.6)
      const a1 = a.clone().add(nrm), a2 = a.clone().sub(nrm), b1 = b.clone().add(nrm), b2 = b.clone().sub(nrm)
      verts.push(a1.x, 0.01, a1.z, a2.x, 0.01, a2.z, b1.x, 0.01, b1.z, a2.x, 0.01, a2.z, b2.x, 0.01, b2.z, b1.x, 0.01, b1.z)
    }
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); roadGeo.computeVertexNormals()
    scene.add(new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ color: '#2a3352', roughness: 0.9, side: THREE.DoubleSide })))
    const mid = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => p.clone().setY(0.03))), new THREE.LineDashedMaterial({ color: '#e2b857', dashSize: 0.8, gapSize: 0.8, transparent: true, opacity: 0.7 }))
    mid.computeLineDistances(); scene.add(mid)

    // Binalar
    const boxGeo = new THREE.BoxGeometry(1, 1, 1)
    const capGeo = new THREE.BoxGeometry(1.08, 0.12, 1.08)
    const N = byOrder.length
    const meshes = []
    byOrder.forEach((s, i) => {
      const u = (i + 0.5) / N
      const p = road(u), q = road(Math.min(1, u + 0.002)), d = q.clone().sub(p).normalize()
      const side = i % 2 ? 1 : -1, off = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(side * 3.1)
      const h = 0.8 + 11 * Math.sqrt(s.ayahs / 286)
      const color = new THREE.Color(s.madani ? EMERALD : GOLD)
      const m = new THREE.Mesh(boxGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1, emissive: color, emissiveIntensity: 0.08 }))
      m.scale.set(1.7, h, 1.7); m.position.set(p.x + off.x, h / 2, p.z + off.z)
      m.userData = { n: s.n, h }
      scene.add(m); meshes.push(m)
      const cap = new THREE.Mesh(capGeo, new THREE.MeshBasicMaterial({ color: s.madani ? '#9ff0d4' : '#fff0c2' }))
      cap.scale.set(1.7, 1, 1.7); cap.position.set(m.position.x, h + 0.06, m.position.z); scene.add(cap)
    })
    // Hicrət qapısı — sırada ilk Mədəni surədən əvvəl
    const firstMad = byOrder.findIndex(s => s.madani)
    let gateAt = null
    if (firstMad > 0) {
      const u = firstMad / N, p = road(u), q = road(u + 0.003), d = q.clone().sub(p).normalize()
      const gate = new THREE.Group()
      const postGeo = new THREE.BoxGeometry(0.35, 5, 0.35)
      const mat = new THREE.MeshStandardMaterial({ color: '#f3e6b5', emissive: '#e2b857', emissiveIntensity: 0.35 })
      const l = new THREE.Mesh(postGeo, mat); l.position.set(-2.2, 2.5, 0); gate.add(l)
      const r = new THREE.Mesh(postGeo, mat); r.position.set(2.2, 2.5, 0); gate.add(r)
      const top = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.18, 8, 32, Math.PI), mat); top.position.y = 5; gate.add(top)
      gate.position.copy(p); gate.rotation.y = Math.atan2(d.x, d.z) + Math.PI / 2
      scene.add(gate); gateAt = p.clone().setY(7.6)
    }

    // Kamera: hədəf ətrafında orbit (çəkmək), yaxınlaşma (təkər / iki barmaq)
    const orbit = { az: 0.7, el: 0.62, dist: 120, target: new THREE.Vector3(0, 0, 0) }
    const goal = { az: orbit.az, el: orbit.el, dist: 88, target: orbit.target.clone() }
    const smooth = motionOk()
    let fly = null
    const pointers = new Map()
    let pinch0 = null, moved = 0
    const onDown = (e) => { pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; el.setPointerCapture?.(e.pointerId); fly = null; api.current.onFly?.(false) }
    const onMove = (e) => {
      const p = pointers.get(e.pointerId)
      if (!p) return hover(e)
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const [a2, b2] = [...pointers.values()]
        const d2 = Math.hypot(a2.x - b2.x, a2.y - b2.y)
        if (pinch0 == null) pinch0 = d
        goal.dist = Math.max(18, Math.min(170, goal.dist * (d / Math.max(1, d2))))
        return undefined
      }
      const dx = e.clientX - p.x, dy = e.clientY - p.y
      moved += Math.abs(dx) + Math.abs(dy)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      goal.az -= dx * 0.006; goal.el = Math.max(0.12, Math.min(1.35, goal.el + dy * 0.004))
      return undefined
    }
    const onUp = (e) => {
      const wasTap = pointers.size === 1 && moved < 8
      pointers.delete(e.pointerId); pinch0 = null
      if (wasTap) pick(e, true)
    }
    const onWheel = (e) => { e.preventDefault(); goal.dist = Math.max(18, Math.min(170, goal.dist * (1 + Math.sign(e.deltaY) * 0.12))) }
    const ray = new THREE.Raycaster(), mv = new THREE.Vector2()
    let hovered = null
    const hit = (e) => {
      const r = el.getBoundingClientRect()
      mv.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(mv, camera)
      return ray.intersectObjects(meshes)[0]?.object || null
    }
    const hover = (e) => {
      if (coarse) return
      const o = hit(e)
      if (o === hovered) return
      if (hovered && hovered.userData.n !== api.current.sel) hovered.material.emissiveIntensity = 0.08
      hovered = o
      if (o) o.material.emissiveIntensity = 0.45
      el.style.cursor = o ? 'pointer' : 'grab'
    }
    const pick = (e) => { const o = hit(e); if (o) api.current.onPick?.(o.userData.n) }
    el.addEventListener('pointerdown', onDown); el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })

    api.current.focus = (n) => {
      meshes.forEach(m => { m.material.emissiveIntensity = m.userData.n === n ? 0.55 : 0.08 })
      const m = meshes.find(x => x.userData.n === n)
      if (!m) return
      goal.target.copy(m.position).setY(m.userData.h / 2); goal.dist = Math.min(goal.dist, 34)
      if (!smooth) { orbit.target.copy(goal.target); orbit.dist = goal.dist }
    }
    api.current.fly = (on) => {
      if (!on || !smooth) { fly = null; return }
      fly = { t0: performance.now(), last: -1 }
    }

    const resize = () => {
      const w = wrap.clientWidth, h = Math.max(380, Math.round(w * (coarse ? 1.1 : 0.52)))
      renderer.setSize(w, h, false); el.style.width = '100%'; el.style.height = `${h}px`
      camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(wrap)
    let visible = true, raf = 0
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop() }, { threshold: 0.01 })
    io.observe(wrap)
    const v = new THREE.Vector3()
    const FLY_MS = 42000
    const loop = () => {
      cancelAnimationFrame(raf)
      if (!visible || document.hidden) return
      raf = requestAnimationFrame(loop)
      if (fly) {
        const u = Math.min(1, (performance.now() - fly.t0) / FLY_MS)
        const p = road(u), ahead = road(Math.min(1, u + 0.03))
        camera.position.set(p.x, 7, p.z + 2)
        camera.lookAt(ahead.x, 2.5, ahead.z)
        const i = Math.min(N - 1, Math.floor(u * N))
        if (i !== fly.last) { fly.last = i; api.current.onPick?.(byOrder[i].n, true) }
        if (u >= 1) { fly = null; api.current.onFly?.(false) }
      } else {
        const k = smooth ? 0.08 : 1
        orbit.az += (goal.az - orbit.az) * k; orbit.el += (goal.el - orbit.el) * k; orbit.dist += (goal.dist - orbit.dist) * k
        orbit.target.lerp(goal.target, k)
        if (smooth && pointers.size === 0 && api.current.sel == null) goal.az += 0.0009
        camera.position.set(
          orbit.target.x + Math.cos(orbit.el) * Math.sin(orbit.az) * orbit.dist,
          orbit.target.y + Math.sin(orbit.el) * orbit.dist,
          orbit.target.z + Math.cos(orbit.el) * Math.cos(orbit.az) * orbit.dist,
        )
        camera.lookAt(orbit.target)
      }
      renderer.render(scene, camera)
      // Etiket: seçilmiş binanın üstündə; Hicrət qapısı
      const r = el.getBoundingClientRect()
      const lab = labelRef.current
      const m = meshes.find(x => x.userData.n === api.current.sel)
      if (lab) {
        if (m) {
          v.copy(m.position).setY(m.userData.h + 0.6).project(camera)
          lab.style.transform = `translate(${((v.x + 1) / 2 * r.width).toFixed(1)}px, ${((1 - v.y) / 2 * r.height).toFixed(1)}px) translate(-50%, -110%)`
          lab.style.opacity = v.z < 1 ? '1' : '0'
        } else lab.style.opacity = '0'
      }
      const gl = api.current.gateLabel
      if (gl && gateAt) {
        v.copy(gateAt).project(camera)
        gl.style.transform = `translate(${((v.x + 1) / 2 * r.width).toFixed(1)}px, ${((1 - v.y) / 2 * r.height).toFixed(1)}px) translate(-50%, -100%)`
        gl.style.opacity = v.z < 1 ? '1' : '0'
      }
    }
    const onVis = () => loop()
    document.addEventListener('visibilitychange', onVis)
    loop()
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis)
      el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp); el.removeEventListener('wheel', onWheel)
      scene.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.() }); renderer.dispose(); el.remove()
    }
  }, [byOrder])

  api.current.sel = sel
  api.current.onPick = (n, fromFly) => { setSel(n); if (!fromFly) api.current.focus?.(n) }
  api.current.onFly = (on) => setFlying(on)
  const s = sel ? data[sel - 1] : null
  const toggleFly = () => { const on = !flying; setFlying(on); api.current.fly?.(on) }

  return (
    <section className="scy ui-card" aria-labelledby="scy-title" data-testid="surah-city">
      <div className="scy__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h3 id="scy-title" className="ui-title ui-title--sm">{t.title}</h3>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <div className="scy__bar">
        {motionOk() && !noGl && (
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={toggleFly} aria-pressed={flying} data-testid="scy-fly">
            <Icon name={flying ? 'pause' : 'play'} className="ui-btn__icon" /> {flying ? t.stop : t.fly}
          </button>
        )}
        <label className="scy__pick"><span className="ui-sr-only">{t.pick}</span>
          <select value={sel || ''} onChange={e => { const n = Number(e.target.value); if (n) { api.current.onPick(n); } }} data-testid="scy-select">
            <option value="">{t.pick}</option>
            {data.map(x => <option key={x.n} value={x.n}>{x.n}. {surahName(x.n)}</option>)}
          </select>
        </label>
        <span className="scy__key"><i style={{ background: GOLD }} /> {t.makki} <i style={{ background: EMERALD }} /> {t.madani}</span>
      </div>
      <div className="scy__stage" ref={wrapRef}>
        {noGl && <p className="scy__nogl">{t.noGl}</p>}
        <span className="scy__label" ref={labelRef} aria-hidden="true">{s ? surahName(s.n) : ''}</span>
        <span className="scy__gate" ref={el => { api.current.gateLabel = el }} aria-hidden="true">{t.hijra}</span>
      </div>
      {s && (
        <div className="scy__card" aria-live="polite" data-testid="scy-card">
          <b className="scy__name">{s.n}. {surahName(s.n)} <span className="ui-arabic" lang="ar">{SURAH_TABLE[s.n - 1][4]}</span></b>
          <span className="ui-num">{s.ayahs} {t.ayahs}</span>
          <span className={`scy__place is-${s.madani ? 'mad' : 'mak'}`}>{s.madani ? t.madani : t.makki}</span>
          <span className="ui-num">{t.order}: {s.order}</span>
          {onOpen && <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => onOpen(s.n)} data-testid="scy-open">{t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" /></button>}
        </div>
      )}
      <p className="scy__note"><Icon name="info" size={14} /> {t.note}</p>
    </section>
  )
}
