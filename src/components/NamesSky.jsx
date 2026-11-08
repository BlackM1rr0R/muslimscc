// ═══════════════════════════════════════════════════════
// NamesSky (v5.8) — Allahın 99 adı ulduzlu göy qübbəsində (/names, "Səma" rejimi)
//
//   <NamesSky names={NAMES_99} known={[1, 5]} onOpen={(n) => …} lang="az" />
//
// • Planetari kimi: siz mərkəzdəsiniz, adlar ətrafdakı qübbədə ulduz kimi (ərəbcə yazı
//   + işıq). Əzbərlənmiş adlar qızılı və parlaq, qalanları sönük-ağ.
// • Barmaqla / siçanla ətrafa baxmaq (OrbitControls, kamera mərkəzdə), yavaş öz-özünə
//   fırlanma (hərəkət azaldılıbsa yoxdur). Ada toxunanda — adın pəncərəsi (onOpen).
// • three.js — ayrıca lazy chunk; ekranda deyilsə render dayanır. Mətnlər kətanda çəkilir.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { pickUi } from '../utils/uiText'
import '../styles/NamesSky.css'

const T = {
  az: { lead: 'Ətrafa baxın — 99 ad göy qübbəsindədir. Qızılı olanlar əzbərlədikləriniz. Ada toxunun.', known: '{n} / 99 əzbərlənib', noGl: 'Bu cihazda 3D (WebGL) dəstəklənmir.' },
  en: { lead: 'Look around — the 99 names fill the sky. Golden ones are those you have memorised. Tap a name.', known: '{n} / 99 memorised', noGl: '3D (WebGL) is not supported on this device.' },
  // lang-ok[D,WebGL]: texniki ad / mənbə adı (Quran.com)
  ru: { lead: 'Оглянитесь — 99 имён на небосводе. Золотые — те, что вы выучили. Коснитесь имени.', known: 'Выучено: {n} / 99', noGl: 'На этом устройстве 3D (WebGL) не поддерживается.' },
  // lang-ok[D,WebGL]: texniki ad / mənbə adı (Quran.com)
  ar: { lead: 'انظر حولك — الأسماء التسعة والتسعون في القبة. الذهبية هي ما حفظته. المس اسمًا.', known: 'حُفظ {n} / 99', noGl: 'العرض ثلاثي الأبعاد (WebGL) غير مدعوم على هذا الجهاز.' },
  // lang-ok[D,WebGL]: texniki ad / mənbə adı (Quran.com)
  tr: { lead: 'Etrafınıza bakın — 99 isim gök kubbede. Altın renkliler ezberledikleriniz. Bir isme dokunun.', known: '{n} / 99 ezberlendi', noGl: 'Bu cihazda 3D (WebGL) desteklenmiyor.' },
}
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-motion-user')

/** Qübbədə bərabər paylanma (Fibonacci kürəsi, yalnız yuxarı yarım + üfüq) */
export function domePos(i, n = 99, R = 40) {
  const y = 0.95 - (i / (n - 1)) * 1.15            // 0.95 … −0.2 (üfüqdən bir az aşağı)
  const r = Math.sqrt(Math.max(0, 1 - y * y))
  const th = i * 2.399963229728653                 // qızıl bucaq
  return [Math.cos(th) * r * R, y * R, Math.sin(th) * r * R]
}

function nameTexture(ar, gold) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128
  const g = c.getContext('2d')
  const rg = g.createRadialGradient(128, 64, 0, 128, 64, 90)
  rg.addColorStop(0, gold ? 'rgba(240,207,126,.55)' : 'rgba(170,190,255,.28)'); rg.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = rg; g.fillRect(0, 0, 256, 128)
  g.font = '600 54px "Amiri", "Noto Naskh Arabic", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'rtl'
  g.shadowColor = gold ? 'rgba(255,214,120,.9)' : 'rgba(200,215,255,.7)'; g.shadowBlur = 14
  g.fillStyle = gold ? '#ffe7a3' : 'rgba(235,240,255,.82)'
  g.fillText(ar, 128, 66)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function NamesSky({ names = [], known = [], onOpen, lang = 'az' }) {
  const t = pickUi(T, lang)
  const wrapRef = useRef(null)
  const openRef = useRef(onOpen)
  openRef.current = onOpen
  const [noGl, setNoGl] = useState(false)
  const knownKey = known.join(',')

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
    scene.background = new THREE.Color('#050a1c')
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 300)
    camera.position.set(0, -0.0055, 0.0085)   // ~35° yuxarı baxır (əzbərlənənlər zenitdədir)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.07
    controls.rotateSpeed = -0.35                  // içəridən baxanda istiqamət təbii olsun
    controls.minPolarAngle = Math.PI * 0.18; controls.maxPolarAngle = Math.PI * 0.62
    controls.autoRotate = !reduced(); controls.autoRotateSpeed = 0.25

    // Fon ulduzları + Süd yolu zolağı
    const N = 2200, pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), R = 90; pos[i * 3] = R * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = R * Math.cos(ph); pos[i * 3 + 2] = R * Math.sin(ph) * Math.sin(th) }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#c9d4ff', size: 0.35, transparent: true, opacity: 0.75 })))
    // Üfüq (qaranlıq yer)
    const ground = new THREE.Mesh(new THREE.CircleGeometry(120, 48), new THREE.MeshBasicMaterial({ color: '#02040b' }))
    ground.rotation.x = -Math.PI / 2; ground.position.y = -26; scene.add(ground)

    const kset = new Set(known)
    const sprites = names.map((nm, i) => {
      const gold = kset.has(nm.n)
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTexture(nm.ar, gold), transparent: true, depthWrite: false }))
      const s = gold ? 9.5 : 8
      sp.scale.set(s, s / 2, 1); sp.position.set(...domePos(i, names.length)); sp.userData = { n: nm.n }
      scene.add(sp)
      return sp
    })

    const resize = () => {
      const w = wrap.clientWidth, h = Math.max(320, Math.round(w * (coarse ? 1.1 : 0.55)))
      renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = `${h}px`
      camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(wrap)

    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2()
    let down = null
    const el = renderer.domElement
    const onDown = (e) => { down = { x: e.clientX, y: e.clientY } }
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { down = null; return }
      down = null
      const r = el.getBoundingClientRect()
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ptr, camera)
      const hit = ray.intersectObjects(sprites)[0]
      if (hit) { controls.autoRotate = false; openRef.current?.(hit.object.userData.n) }
    }
    el.addEventListener('pointerdown', onDown); el.addEventListener('pointerup', onUp)

    let visible = true, raf = 0
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop() }, { threshold: 0.01 })
    io.observe(wrap)
    const loop = () => {
      cancelAnimationFrame(raf)
      if (!visible || document.hidden) return
      raf = requestAnimationFrame(loop)
      controls.update(); renderer.render(scene, camera)
    }
    const onVis = () => loop()
    document.addEventListener('visibilitychange', onVis)
    loop()
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis)
      el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointerup', onUp)
      controls.dispose()
      scene.traverse(o => { o.geometry?.dispose?.(); o.material?.map?.dispose?.(); o.material?.dispose?.() })
      renderer.dispose(); el.remove()
    }
  }, [names, knownKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="nsky" data-testid="names-sky">
      <div className="nsky__stage" ref={wrapRef}>
        {noGl && <p className="nsky__nogl">{t.noGl}</p>}
        <span className="nsky__badge ui-num">{t.known.replace('{n}', known.length)}</span>
      </div>
      <p className="nsky__lead">{t.lead}</p>
    </div>
  )
}
