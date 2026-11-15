// ═══════════════════════════════════════════════════════
// MosqueBuilder3D (v6.9) — "Məscidi qur": sürüşdürdükcə məscid hissə-hissə yığılır
// (/mosques). Ümumi (konkret olmayan) məscid: bünövrə → sütun və tağlar →
// mehrab → minbər → günbəz → muqərnəs → minarə. Hər hissə yuxarıdan enib yerinə
// oturur; yanda onun nə olduğu və nə üçün olduğu yazılır (memarlıq izahı).
// three.js; render yalnız sürüşmə dəyişəndə və bölmə ekrandadırsa. Hərəkət
// azaldılıbsa — hissələr dərhal yerindədir.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { pickUi } from '../utils/uiText'
import '../styles/MosqueBuilder3D.css'

const STEPS = ['base', 'arcade', 'mihrab', 'minbar', 'dome', 'muqarnas', 'minaret']
const T = {
  az: {
    ey: 'Memarlıq', title: 'Məscidi qur', lead: 'Aşağı sürüşdürün — məscid hissə-hissə yığılacaq.', noGl: 'Bu cihazda 3D (WebGL) dəstəklənmir.', step: 'Addım',
    base: ['Bünövrə və həyət', 'Məscid düz, təmiz bir sahə üzərində qurulur. Çox məscidin qarşısında dəstəmaz alınan və camaatın toplaşdığı həyət olur.'],
    arcade: ['Sütunlar və tağlar', 'Namaz salonunu sıra-sıra sütunlar və onları birləşdirən tağlar daşıyır. Belə salonda saflar uzun və düz düzülür.'],
    mihrab: ['Mehrab', 'Qiblə divarındakı taxça. Qiblə istiqamətini göstərir; imam namazı onun önündə qıldırır. Çox vaxt kaşı və yazı ilə bəzədilir.'],
    minbar: ['Minbər', 'Mehrabın sağındakı pilləli kürsü. Cümə və bayram xütbəsi buradan oxunur ki, xətib camaata görünsün və səsi çatsın.'],
    dome: ['Günbəz', 'Namaz salonunun üstünü örtür, içəridə geniş, sütunsuz məkan yaradır və səsi salona yayır.'],
    muqarnas: ['Muqərnəs', 'Bal pətəyinə bənzəyən pilləli bəzək. Dördkünc divardan dairəvi günbəzə keçidi gözəl və möhkəm edir.'],
    minaret: ['Minarə', 'Uca qüllə. Azan oxunan yer və uzaqdan görünən nişan — məscidin yerini göstərir.'],
  },
  en: {
    ey: 'Architecture', title: 'Build a mosque', lead: 'Scroll down — the mosque will assemble piece by piece.', noGl: '3D (WebGL) is not supported on this device.', step: 'Step',
    base: ['Foundation and courtyard', 'A mosque is built on a level, clean site. Many mosques have a courtyard in front, where people make wudu and gather.'],
    arcade: ['Columns and arches', 'Rows of columns joined by arches carry the prayer hall. In such a hall the rows of worshippers line up long and straight.'],
    mihrab: ['Mihrab', 'The niche in the qibla wall. It shows the direction of the qibla; the imam leads the prayer in front of it. It is often decorated with tiles and calligraphy.'],
    minbar: ['Minbar', 'The stepped pulpit to the right of the mihrab. The Friday and Eid sermons are given from it, so the speaker is seen and heard.'],
    dome: ['Dome', 'It covers the prayer hall, creates a wide space without columns inside and spreads the sound through the hall.'],
    muqarnas: ['Muqarnas', 'Stepped, honeycomb-like ornament. It turns the square walls into the round dome — beautifully and firmly.'],
    minaret: ['Minaret', 'A tall tower. The place of the adhan and a landmark seen from afar — it shows where the mosque is.'],
  },
  ru: {
    ey: 'Архитектура', title: 'Построй мечеть', lead: 'Прокрутите вниз — мечеть соберётся по частям.', noGl: 'На этом устройстве 3D (WebGL) не поддерживается.', step: 'Шаг', // lang-ok[D,WebGL]: texniki termin
    base: ['Основание и двор', 'Мечеть строят на ровном, чистом месте. Перед многими мечетями есть двор, где совершают омовение и собираются люди.'],
    arcade: ['Колонны и арки', 'Молитвенный зал держат ряды колонн, соединённых арками. В таком зале ряды молящихся выстраиваются длинными и ровными.'],
    mihrab: ['Михраб', 'Ниша в стене киблы. Указывает направление киблы; имам руководит молитвой перед ней. Часто украшается изразцами и каллиграфией.'],
    minbar: ['Минбар', 'Ступенчатая кафедра справа от михраба. С неё читают пятничную и праздничную проповедь, чтобы оратора было видно и слышно.'],
    dome: ['Купол', 'Накрывает молитвенный зал, создаёт внутри широкое пространство без колонн и разносит звук по залу.'],
    muqarnas: ['Мукарнас', 'Ступенчатый орнамент, похожий на пчелиные соты. Делает переход от квадратных стен к круглому куполу красивым и прочным.'],
    minaret: ['Минарет', 'Высокая башня. Место азана и ориентир, видный издалека, — показывает, где мечеть.'],
  },
  ar: {
    ey: 'العمارة', title: 'ابنِ مسجدًا', lead: 'مرِّر إلى الأسفل — سيُبنى المسجد قطعةً قطعة.', noGl: 'العرض ثلاثي الأبعاد غير مدعوم على هذا الجهاز.', step: 'الخطوة',
    base: ['الأساس والصحن', 'يُبنى المسجد على أرض مستوية نظيفة، ولكثير من المساجد صحن أمامها للوضوء واجتماع الناس.'],
    arcade: ['الأعمدة والأقواس', 'تحمل بيتَ الصلاة صفوفٌ من الأعمدة تصلها الأقواس، فتستقيم فيه الصفوف طويلة متراصّة.'],
    mihrab: ['المحراب', 'تجويف في جدار القبلة يدل على جهتها، ويصلي الإمام أمامه، ويُزيَّن غالبًا بالقاشاني والخط.'],
    minbar: ['المنبر', 'كرسي ذو درجات عن يمين المحراب، تُلقى منه خطبة الجمعة والعيد ليُرى الخطيب ويُسمع.'],
    dome: ['القبة', 'تسقف بيت الصلاة وتصنع فضاءً واسعًا بلا أعمدة وتنشر الصوت في المكان.'],
    muqarnas: ['المقرنص', 'زخرفة متدرجة تشبه خلايا النحل، تنقل الجدران المربعة إلى القبة المستديرة بجمال وإحكام.'],
    minaret: ['المئذنة', 'برج عالٍ يُرفع منه الأذان، ومَعلم يُرى من بعيد يدل على المسجد.'],
  },
  tr: {
    ey: 'Mimari', title: 'Camiyi kur', lead: 'Aşağı kaydırın — cami parça parça kurulacak.', noGl: 'Bu cihazda 3D (WebGL) desteklenmiyor.', step: 'Adım',
    base: ['Temel ve avlu', 'Cami düz, temiz bir alan üzerine kurulur. Pek çok caminin önünde abdest alınan ve cemaatin toplandığı bir avlu bulunur.'],
    arcade: ['Sütunlar ve kemerler', 'Namaz salonunu sıra sıra sütunlar ve onları birleştiren kemerler taşır. Böyle bir salonda saflar uzun ve düzgün dizilir.'],
    mihrab: ['Mihrap', 'Kıble duvarındaki niş. Kıble yönünü gösterir; imam namazı onun önünde kıldırır. Çoğu zaman çini ve hatla süslenir.'],
    minbar: ['Minber', 'Mihrabın sağındaki basamaklı kürsü. Cuma ve bayram hutbesi buradan okunur ki hatip görülsün ve sesi ulaşsın.'],
    dome: ['Kubbe', 'Namaz salonunu örter, içeride geniş, sütunsuz bir mekân oluşturur ve sesi salona yayar.'],
    muqarnas: ['Mukarnas', 'Bal peteğine benzeyen basamaklı süsleme. Kare duvarlardan yuvarlak kubbeye geçişi güzel ve sağlam kılar.'],
    minaret: ['Minare', 'Yüksek kule. Ezanın okunduğu yer ve uzaktan görülen bir işaret — caminin yerini gösterir.'],
  },
}
const reduced = () => document.documentElement.classList.contains('a11y-reduce-motion') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Hissələr: hər biri öz qrupunda (yerinə enmək üçün)
function build(scene) {
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0, ...o })
  // Kaşı — mavi (yaşıl günbəz yox: sahibin qərarı, removed-by-decision)
  const stone = M('#e6dcc6'), wall = M('#f3ecdc'), tile = M('#2e6fa8', { roughness: 0.35, metalness: 0.1 }), gold = M('#c9a227', { metalness: 0.6, roughness: 0.35, emissive: '#5a4205', emissiveIntensity: 0.25 })
  const wood = M('#8a5a2b'), dark = M('#2d3b36')
  const groups = STEPS.map(() => new THREE.Group())
  const add = (i, geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; groups[i].add(m); return m }
  // 0 — bünövrə + həyət
  add(0, new THREE.BoxGeometry(30, 0.6, 30), stone, 0, 0.3, 4)
  for (let i = -3; i <= 3; i++) for (let j = 0; j < 3; j++) add(0, new THREE.BoxGeometry(3.6, 0.04, 3.6), (i + j) % 2 ? stone : M('#d8cdb3'), i * 4, 0.62, 12 + j * 4)
  add(0, new THREE.CylinderGeometry(1.2, 1.4, 0.8, 24), tile, 0, 1, 15)   // fəvvarə (dəstəmaz)
  // 1 — divarlar, sütunlar, tağlar
  add(1, new THREE.BoxGeometry(22, 7, 0.8), wall, 0, 4.1, -8)            // qiblə divarı
  add(1, new THREE.BoxGeometry(0.8, 7, 16), wall, -11, 4.1, 0)
  add(1, new THREE.BoxGeometry(0.8, 7, 16), wall, 11, 4.1, 0)
  for (const x of [-8, -4, 0, 4, 8]) {
    add(1, new THREE.CylinderGeometry(0.42, 0.5, 5.2, 16), wall, x, 3.2, 7.6)
    add(1, new THREE.BoxGeometry(1.2, 0.4, 1.2), stone, x, 0.8, 7.6)
  }
  for (const x of [-6, -2, 2, 6]) {
    const arch = add(1, new THREE.TorusGeometry(2, 0.38, 10, 24, Math.PI), wall, x, 5.8, 7.6)
    arch.rotation.z = 0
  }
  // Dam yoxdur — içəri (mehrab, minbər) yuxarıdan görünsün; günbəz divarların üstündə
  add(1, new THREE.BoxGeometry(12, 0.5, 12), wall, 0, 7.9, -1)            // günbəzin oturacağı
  // 2 — mehrab (qiblə divarının içində)
  add(2, new THREE.BoxGeometry(3.4, 5, 0.3), tile, 0, 3.1, -7.45)
  const niche = add(2, new THREE.CylinderGeometry(1.1, 1.1, 3.4, 24, 1, true, Math.PI / 2, Math.PI), gold, 0, 2.3, -7.2)
  niche.material = niche.material.clone(); niche.material.side = THREE.DoubleSide
  const hood = add(2, new THREE.SphereGeometry(1.1, 24, 12, Math.PI / 2, Math.PI, 0, Math.PI / 2), gold, 0, 4, -7.2)
  hood.material = hood.material.clone(); hood.material.side = THREE.DoubleSide
  // 3 — minbər (mehrabın sağında — içəridən baxana görə)
  for (let k = 0; k < 7; k++) add(3, new THREE.BoxGeometry(1.2, 0.36 * (k + 1), 0.6), wood, 3.4, 0.6 + 0.18 * (k + 1), -1 - k * 0.6)
  add(3, new THREE.BoxGeometry(1.4, 0.3, 1.4), wood, 3.4, 3.6, -5.6)
  add(3, new THREE.ConeGeometry(0.9, 1.4, 4), gold, 3.4, 4.5, -5.6, Math.PI / 4)
  // 4 — günbəz (təbil + yarımkürə)
  add(4, new THREE.CylinderGeometry(5.2, 5.4, 2.2, 32), wall, 0, 9.3, -1)
  add(4, new THREE.SphereGeometry(5.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), tile, 0, 10.4, -1)
  add(4, new THREE.CylinderGeometry(0.08, 0.12, 1.6, 8), gold, 0, 16.3, -1)
  add(4, new THREE.SphereGeometry(0.35, 16, 12), gold, 0, 17.2, -1)
  // 5 — muqərnəs: təbilin altında pilləli hücrələr (3 cərgə)
  for (let row = 0; row < 3; row++) {
    const n = 32 - row * 4, r = 5.6 - row * 0.25
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + row * 0.1
      add(5, new THREE.BoxGeometry(0.75, 0.42, 0.42), row % 2 ? gold : M('#e7c77d', { metalness: 0.4, roughness: 0.4 }), Math.sin(a) * r, 8.25 + row * 0.42, -1 + Math.cos(a) * r, a)
    }
  }
  // 6 — minarə
  add(6, new THREE.BoxGeometry(2.6, 1.2, 2.6), stone, 13.5, 0.9, 9)
  add(6, new THREE.CylinderGeometry(0.85, 1.05, 18, 20), wall, 13.5, 10.4, 9)
  add(6, new THREE.CylinderGeometry(1.5, 1.2, 0.5, 24), tile, 13.5, 15.2, 9)   // şərəfə
  add(6, new THREE.CylinderGeometry(0.7, 0.75, 3, 16), wall, 13.5, 17.6, 9)
  add(6, new THREE.ConeGeometry(0.95, 3, 20), tile, 13.5, 20.6, 9)
  add(6, new THREE.SphereGeometry(0.22, 12, 10), gold, 13.5, 22.3, 9)
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; add(6, new THREE.BoxGeometry(0.12, 0.7, 0.12), dark, 13.5 + Math.sin(a) * 1.4, 15.7, 9 + Math.cos(a) * 1.4) }
  groups.forEach(g => scene.add(g))
  return { groups, gold }
}

export default function MosqueBuilder3D({ lang = 'az' }) {
  const u = pickUi(T, lang, 'en')
  const secRef = useRef(null)
  const wrapRef = useRef(null)
  const [step, setStep] = useState(0)
  const [noGl, setNoGl] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current, sec = secRef.current
    if (!wrap || !sec) return undefined
    let renderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }) } catch { setNoGl(true); return undefined }
    renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    wrap.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 400)
    scene.add(new THREE.HemisphereLight('#fff8ea', '#b8a888', 1.6))
    const sun = new THREE.DirectionalLight('#fff1d6', 2.0); sun.position.set(30, 50, 40); scene.add(sun)
    const fill = new THREE.DirectionalLight('#dfe9ff', 0.9); fill.position.set(-40, 30, 20); scene.add(fill)
    const { groups } = build(scene)
    const still = reduced()

    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight
      renderer.setSize(w, h, false); renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%'
      camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix()
      render()
    }
    let p = 0
    const render = () => {
      // p: 0 … STEPS.length (sürüşmə)
      groups.forEach((g, i) => {
        const t = still ? (p > i ? 1 : 0) : Math.max(0, Math.min(1, (p - i) * 1.25))
        g.visible = t > 0
        const e = 1 - Math.pow(1 - t, 3)
        g.position.y = (1 - e) * 26
        g.scale.setScalar(0.85 + 0.15 * e)
      })
      // Kamera həyət tərəfindədir (+z) — içəridəki mehrab və minbər görünsün; yavaş fırlanır
      const a = -0.55 + p * 0.15
      const r = (camera.aspect < 1 ? 80 : 54) - p * 0.8
      camera.position.set(Math.sin(a) * r, 26 + p * 0.5, Math.cos(a) * r + 2)
      camera.lookAt(0, 5, 1)
      renderer.render(scene, camera)
    }
    let raf = 0, active = false
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const r = sec.getBoundingClientRect()
        const total = r.height - window.innerHeight
        const prog = Math.max(0, Math.min(1, -r.top / Math.max(1, total)))
        p = prog * (STEPS.length + 0.4)
        setStep(Math.min(STEPS.length - 1, Math.floor(p)))
        render()
      })
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !active) { active = true; window.addEventListener('scroll', onScroll, { passive: true }); onScroll() }
      else if (!e.isIntersecting && active) { active = false; window.removeEventListener('scroll', onScroll) }
    })
    io.observe(sec)
    const ro = new ResizeObserver(resize); ro.observe(wrap)
    resize()
    return () => {
      io.disconnect(); ro.disconnect(); window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf)
      scene.traverse(o => { o.geometry?.dispose?.(); const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; mats.forEach(m => m.dispose?.()) })
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [])

  const k = STEPS[step]
  return (
    <section className="mb3" ref={secRef} aria-labelledby="mb3-title" data-testid="mosque-builder" style={{ '--steps': STEPS.length }}>
      <div className="mb3__sticky">
        <div className="mb3__head">
          <span className="ui-eyebrow">{u.ey}</span>
          <h2 id="mb3-title" className="mb3__title">{u.title}</h2>
          <p className="mb3__lead">{u.lead}</p>
        </div>
        <div className="mb3__stage" ref={wrapRef}>
          {noGl && <p className="mb3__nogl">{u.noGl}</p>}
        </div>
        <div className="mb3__card" aria-live="polite" data-testid="mosque-step">
          <span className="mb3__n ui-num">{u.step} {step + 1} / {STEPS.length}</span>
          <h3 className="mb3__h">{u[k][0]}</h3>
          <p className="mb3__p">{u[k][1]}</p>
          <ol className="mb3__dots" aria-hidden="true">{STEPS.map((s, i) => <li key={s} className={i <= step ? 'on' : ''} />)}</ol>
        </div>
      </div>
    </section>
  )
}
