// ═══════════════════════════════════════════════════════
// Məşrəbiyyə — günəş işığı (/prayer, namaz vaxtları səhifəsi)
//
// • Otaq sadə perspektivdə (canvas 2D, əl ilə 3D → 2D proyeksiya). Ön divarda taxta
//   şəbəkəli pəncərə — məşrəbiyyə (səkkizguşəli ulduz naxışı, xatəm).
// • Günəşin həqiqi yeri seçilmiş şəhər üçün (utils/rasdQibla.js — Meeus); pəncərə ekvatora
//   baxır. Hər deşik Günəşin istiqamətində döşəməyə / yan divarlara proyeksiya olunur
//   (utils/mashrabiya.js — şüa–müstəvi kəsişməsi), işıq ləkələri isti rənglə əlavə edilir.
// • Sürüşdürücü — bugünkü gün (günəş çıxışından 40 dəq əvvəl … batışdan 40 dəq sonra),
//   üstündə namaz işarələri (usePrayerTimes — saytın öz cədvəli). İşarəyə basanda vaxt
//   oraya keçir və həmin anın qısa izahı göstərilir.
// • Ekrandan kənarda çəkilmir; yalnız vaxt / ölçü dəyişəndə yenidən çəkilir. Hərəkəti
//   azalt rejimində "günü oynat" yoxdur. Şəbəkə, şəkil, kitabxana yoxdur.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { useReduced } from '../motion/reduced'
import usePrayerTimes, { PRAYER_NAMES } from '../hooks/usePrayerTimes'
import { getPrayerLocation } from '../utils/prayerLocation'
import { asrDay, localDayStart } from '../utils/asrShadow'
import {
  ROOM, WINDOW, wallAzimuth, sunInRoom, lightPatches, latticeOpenings, firstHit, localMidnight, hhmmToMs,
} from '../utils/mashrabiya'
import '../styles/MashrabiyaLight.css'

const RAD = Math.PI / 180
const MIN = 60000
const PAD = 40 * MIN
const MARKS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib']
const NEAR = 25 * MIN           // işarəyə bu qədər yaxın — onun izahı göstərilir

const T = {
  az: {
    ey: 'Memarlıq və işıq', title: 'Məşrəbiyyə — günəş işığı',
    lead: 'Taxta pəncərə şəbəkəsindən keçən günəş otağın döşəməsinə naxış salır. Vaxtı sürüşdürün — naxış Günəşin sizin şəhərdəki həqiqi yeri ilə birlikdə hərəkət edir.',
    slider: 'Günün vaxtı', now: 'İndi', play: 'Günü oynat', pause: 'Dayandır',
    local: 'Yerli vaxt', alt: 'Günəşin hündürlüyü', azim: 'Günəşin azimutu',
    facesS: 'Pəncərə cənuba baxır', facesN: 'Pəncərə şimala baxır', marks: 'Namaz vaxtları',
    canvas: 'Məşrəbiyyəli otaq: günəş işığının döşəmədəki naxışı',
    cap: {
      fajr: 'Sübh: Günəş hələ üfüqün altındadır — otaqda yalnız alaqaranlıq var.',
      sunrise: 'Günəşin çıxışı: alçaq şüalar naxışı pəncərədən uzağa salır.',
      dhuhr: 'Zöhr: Günəş günün ən yüksək yerindədir — kölgələr ən qısadır, işıq naxışı pəncərəyə ən yaxın düşür.',
      asr: 'Əsr: alimlərin əksəriyyətinə görə əşyanın kölgəsi öz boyu ilə günorta kölgəsinin cəminə çatanda başlayır (Hənəfi məzhəbində — boyunun iki misli). Naxış artıq xeyli uzaqlaşıb.',
      maghrib: 'Məğrib: Günəş batır — işıq naxışı otaqdan çəkilir.',
      day: 'Günəş alçaldıqca naxış pəncərədən uzaqlaşır və uzanır, yuxarı qalxdıqca yaxınlaşır.',
      behind: 'Günəş divarın o biri tərəfindədir — birbaşa işıq pəncərəyə düşmür.',
      night: 'Günəş üfüqün altındadır — birbaşa işıq yoxdur.',
    },
    hist: 'Məşrəbiyyə (ərəbcə «məşrəbiyyə») ənənəvi İslam memarlığında oyma taxta pəncərə şəbəkəsidir. Qahirə, Hicaz, Bağdad kimi yerlərin köhnə evlərində o, otağı kölgədə saxlayır, içəridəkiləri kənar baxışdan qoruyur, havanın dolaşmasına imkan verir və işığı naxış şəklində içəri buraxır.',
    note: 'Günəşin yeri astronomik düsturlarla hesablanır. Saytdakı namaz vaxtları öz metodu ilə hesablanır — işarələr onlardır.',
  },
  en: {
    ey: 'Architecture and light', title: 'Mashrabiya — sunlight',
    lead: 'Sunlight passing through a wooden window lattice casts a pattern on the floor. Move the time — the pattern follows the Sun’s real position over your city.',
    slider: 'Time of day', now: 'Now', play: 'Play the day', pause: 'Pause',
    local: 'Local time', alt: 'Sun altitude', azim: 'Sun azimuth',
    facesS: 'The window faces south', facesN: 'The window faces north', marks: 'Prayer times',
    canvas: 'A room with a mashrabiya: the pattern of sunlight on the floor',
    cap: {
      fajr: 'Fajr: the Sun is still below the horizon — only twilight fills the room.',
      sunrise: 'Sunrise: low rays throw the pattern far from the window.',
      dhuhr: 'Dhuhr: the Sun is at its highest — shadows are shortest and the light pattern falls closest to the window.',
      asr: 'Asr: for most scholars it begins when an object’s shadow equals its own length plus its noon shadow (in the Hanafi school, twice its length). The pattern has moved well away.',
      maghrib: 'Maghrib: the Sun sets — the light pattern leaves the room.',
      day: 'As the Sun sinks the pattern moves away from the window and stretches; as it rises it draws closer.',
      behind: 'The Sun is on the other side of the wall — no direct light reaches the window.',
      night: 'The Sun is below the horizon — there is no direct light.',
    },
    hist: 'The mashrabiya (Arabic mashrabiyya) is the carved wooden window lattice of traditional Islamic architecture. In old houses of Cairo, the Hijaz, Baghdad and elsewhere it kept rooms shaded, gave privacy to those inside, let the air move, and let light in as a pattern.',
    note: 'The Sun’s position is computed with astronomical formulas. The site’s prayer times use their own method — the markers are those times.',
  },
  ru: {
    ey: 'Архитектура и свет', title: 'Машрабия — солнечный свет',
    lead: 'Солнце, проходя сквозь деревянную оконную решётку, рисует узор на полу. Двигайте время — узор следует за настоящим положением Солнца над вашим городом.',
    slider: 'Время суток', now: 'Сейчас', play: 'Проиграть день', pause: 'Пауза',
    local: 'Местное время', alt: 'Высота Солнца', azim: 'Азимут Солнца',
    facesS: 'Окно смотрит на юг', facesN: 'Окно смотрит на север', marks: 'Время намаза',
    canvas: 'Комната с машрабией: узор солнечного света на полу',
    cap: {
      fajr: 'Фаджр: Солнце ещё под горизонтом — в комнате лишь сумерки.',
      sunrise: 'Восход: низкие лучи отбрасывают узор далеко от окна.',
      dhuhr: 'Зухр: Солнце в наивысшей точке — тени самые короткие, узор света ближе всего к окну.',
      asr: 'Аср: по мнению большинства учёных, начинается, когда тень предмета равна его высоте плюс полуденная тень (в ханафитском мазхабе — двойной высоте). Узор уже заметно отошёл.',
      maghrib: 'Магриб: Солнце заходит — узор света уходит из комнаты.',
      day: 'Когда Солнце опускается, узор отходит от окна и вытягивается; когда поднимается — приближается.',
      behind: 'Солнце по другую сторону стены — прямой свет в окно не попадает.',
      night: 'Солнце под горизонтом — прямого света нет.',
    },
    hist: 'Машрабия (араб. «машрабийя») — резная деревянная оконная решётка традиционной исламской архитектуры. В старых домах Каира, Хиджаза, Багдада и других мест она давала комнате тень, скрывала живущих от чужих глаз, пропускала воздух и впускала свет узором.',
    note: 'Положение Солнца вычисляется по астрономическим формулам. Время намаза на сайте считается своим методом — метки показывают его.',
  },
  ar: {
    ey: 'العمارة والضوء', title: 'المشربية — ضوء الشمس',
    lead: 'تمرّ أشعة الشمس عبر الشبكة الخشبية للنافذة فترسم نقشًا على الأرض. حرّك الوقت — فيتبع النقش موضع الشمس الحقيقي فوق مدينتك.',
    slider: 'وقت النهار', now: 'الآن', play: 'شغّل اليوم', pause: 'إيقاف',
    local: 'الوقت المحلي', alt: 'ارتفاع الشمس', azim: 'سمت الشمس',
    facesS: 'النافذة تواجه الجنوب', facesN: 'النافذة تواجه الشمال', marks: 'مواقيت الصلاة',
    canvas: 'غرفة بمشربية: نقش ضوء الشمس على الأرض',
    cap: {
      fajr: 'الفجر: الشمس ما زالت تحت الأفق — لا يملأ الغرفة إلا الشفق.',
      sunrise: 'الشروق: الأشعة المنخفضة تلقي النقش بعيدًا عن النافذة.',
      dhuhr: 'الظهر: الشمس في أعلى موضع لها — الظلال أقصر ما تكون، ونقش الضوء أقرب ما يكون إلى النافذة.',
      asr: 'العصر: عند جمهور العلماء يبدأ إذا صار ظل الشيء مثله مع ظل الزوال (وعند الحنفية مثليه). وقد ابتعد النقش كثيرًا.',
      maghrib: 'المغرب: تغرب الشمس — فينسحب نقش الضوء من الغرفة.',
      day: 'كلما انخفضت الشمس ابتعد النقش عن النافذة واستطال، وكلما ارتفعت اقترب.',
      behind: 'الشمس خلف الجدار — لا يصل ضوء مباشر إلى النافذة.',
      night: 'الشمس تحت الأفق — لا ضوء مباشر.',
    },
    hist: 'المشربية شبكة خشبية منقوشة للنوافذ في العمارة الإسلامية التقليدية. في البيوت القديمة في القاهرة والحجاز وبغداد وغيرها كانت تظلّل الغرف، وتستر أهل البيت عن الأنظار، وتسمح بمرور الهواء، وتُدخل الضوء نقشًا.',
    note: 'يُحسب موضع الشمس بالمعادلات الفلكية. أما مواقيت الصلاة في الموقع فتُحسب بطريقتها — والعلامات هي تلك المواقيت.',
  },
  tr: {
    ey: 'Mimari ve ışık', title: 'Meşrebiye — güneş ışığı',
    lead: 'Ahşap pencere kafesinden geçen güneş odanın zeminine desen düşürür. Saati kaydırın — desen, Güneş’in şehrinizdeki gerçek konumuyla birlikte hareket eder.',
    slider: 'Günün saati', now: 'Şimdi', play: 'Günü oynat', pause: 'Durdur',
    local: 'Yerel saat', alt: 'Güneş’in yüksekliği', azim: 'Güneş’in azimutu',
    facesS: 'Pencere güneye bakıyor', facesN: 'Pencere kuzeye bakıyor', marks: 'Namaz vakitleri',
    canvas: 'Meşrebiyeli oda: güneş ışığının zemindeki deseni',
    cap: {
      fajr: 'Sabah: Güneş henüz ufkun altında — odada yalnızca alacakaranlık var.',
      sunrise: 'Güneş doğuyor: alçak ışınlar deseni pencereden uzağa düşürür.',
      dhuhr: 'Öğle: Güneş günün en yüksek noktasında — gölgeler en kısa, ışık deseni pencereye en yakın.',
      asr: 'İkindi: âlimlerin çoğuna göre bir cismin gölgesi kendi boyu artı öğle gölgesi kadar olunca başlar (Hanefî mezhebinde boyunun iki katı). Desen epey uzaklaştı.',
      maghrib: 'Akşam: Güneş batıyor — ışık deseni odadan çekiliyor.',
      day: 'Güneş alçaldıkça desen pencereden uzaklaşır ve uzar; yükseldikçe yaklaşır.',
      behind: 'Güneş duvarın öbür tarafında — pencereye doğrudan ışık düşmüyor.',
      night: 'Güneş ufkun altında — doğrudan ışık yok.',
    },
    hist: 'Meşrebiye (Arapça «meşrebiyye»), geleneksel İslam mimarisinde oyma ahşap pencere kafesidir. Kahire, Hicaz, Bağdat gibi yerlerin eski evlerinde odayı gölgede tutar, içeridekileri dış bakışlardan korur, havanın dolaşmasını sağlar ve ışığı desen hâlinde içeri alırdı.',
    note: 'Güneş’in konumu astronomik formüllerle hesaplanır. Sitedeki namaz vakitleri kendi yöntemiyle hesaplanır — işaretler o vakitlerdir.',
  },
}

// ── Rəng köməkçiləri ──
const lerp = (a, b, k) => a + (b - a) * k
const mix = (c1, c2, k) => [lerp(c1[0], c2[0], k), lerp(c1[1], c2[1], k), lerp(c1[2], c2[2], k)]
const rgb = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`
const clamp01 = (x) => Math.max(0, Math.min(1, x))

const WALL = [214, 178, 136], SIDE = [196, 158, 118], FLOOR = [160, 112, 74], CEIL = [150, 118, 88]
const WOOD = [74, 44, 22], NIGHT = [34, 44, 82]

/** Kamera: otağın arxasından (kəsik görünüş), bir az yuxarıdan aşağı baxır */
function camera(W, H) {
  const narrow = W < 560
  const Cy = 1.7, Cz = ROOM.d + (narrow ? 1.1 : 1.6)
  const pitch = 8 * RAD, sp = Math.sin(pitch), cp = Math.cos(pitch)
  const F = W * (narrow ? 0.98 : 0.8)
  const cx = W / 2, cy = H * (narrow ? 0.4 : 0.37)
  return (p) => {
    const px = p[0], py = p[1] - Cy, pz = p[2] - Cz
    const depth = -py * sp - pz * cp
    const up = py * cp - pz * sp
    return [cx + (F * px) / depth, cy - (F * up) / depth]
  }
}

function pathOf(ctx, pts, P) {
  pts.forEach((p, i) => { const s = P(p); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]) })
  ctx.closePath()
}

function hull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo = [], up = []
  for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q) }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q) }
  return lo.slice(0, -1).concat(up.slice(0, -1))
}

/** Səhnəni çək. sun: sunInRoom(); patches: lightPatches(); light — işıq üçün ikinci canvas */
function drawScene(ctx, light, W, H, dpr, sun, patches, openings) {
  const { w, h, d } = ROOM
  const P = camera(W, H)
  const alt = sun.alt
  // Ümumi (səpələnmiş) işıq və gecə çaları
  const amb = alt <= -8 ? 0.3 : alt <= 0 ? 0.3 + ((alt + 8) / 8) * 0.18 : 0.48 + 0.22 * clamp01(alt / 30)
  const nightK = alt < 2 ? clamp01((2 - alt) / 10) * 0.6 : 0
  const tone = (base, k = 1) => mix(base.map(v => v * amb * k), NIGHT, nightK)

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = rgb(tone(CEIL, 0.7)); ctx.fillRect(0, 0, W, H)

  const fill = (pts, c) => { ctx.beginPath(); pathOf(ctx, pts, P); ctx.fillStyle = c; ctx.fill() }
  // Tavan, yan divarlar, döşəmə, ön divar
  fill([[-w / 2, h, 0], [w / 2, h, 0], [w / 2, h, d], [-w / 2, h, d]], rgb(tone(CEIL, 0.85)))
  fill([[-w / 2, 0, 0], [-w / 2, h, 0], [-w / 2, h, d], [-w / 2, 0, d]], rgb(tone(SIDE, 0.92)))
  fill([[w / 2, 0, 0], [w / 2, h, 0], [w / 2, h, d], [w / 2, 0, d]], rgb(tone(SIDE, 0.85)))
  fill([[-w / 2, 0, 0], [w / 2, 0, 0], [w / 2, 0, d], [-w / 2, 0, d]], rgb(tone(FLOOR)))
  fill([[-w / 2, 0, 0], [w / 2, 0, 0], [w / 2, h, 0], [-w / 2, h, 0]], rgb(tone(WALL)))

  // Döşəmə plitələri
  ctx.strokeStyle = 'rgba(40,22,10,.18)'; ctx.lineWidth = 1
  ctx.beginPath()
  const step = 0.55
  for (let z = step; z < d; z += step) { const a = P([-w / 2, 0, z]), b = P([w / 2, 0, z]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]) }
  for (let x = -w / 2 + step; x < w / 2 - 1e-6; x += step) { const a = P([x, 0, 0]), b = P([x, 0, d]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]) }
  ctx.stroke()
  // Künclər
  ctx.strokeStyle = 'rgba(40,22,10,.22)'
  ctx.beginPath()
  for (const s of [-1, 1]) for (const y of [0, h]) { const a = P([s * w / 2, y, 0]), b = P([s * w / 2, y, d]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]) }
  ctx.stroke()

  // Pəncərə: arxada səma, üstündə taxta şəbəkə
  const { x0, x1, y0, y1 } = WINDOW
  const front = !!sun.dir
  const skyLo = alt > 8 ? [222, 236, 248] : alt > 0 ? mix([255, 186, 120], [222, 236, 248], alt / 8)
    : alt > -8 ? mix([44, 54, 96], [255, 186, 120], (alt + 8) / 8) : [20, 26, 52]
  const skyHi = mix(skyLo, alt > 0 ? [150, 190, 232] : [12, 16, 40], 0.55)
  const a0 = P([x0, y0, 0]), a1 = P([x1, y1, 0])
  const sky = ctx.createLinearGradient(0, a1[1], 0, a0[1])
  sky.addColorStop(0, rgb(skyHi)); sky.addColorStop(1, rgb(front ? mix(skyLo, [255, 240, 205], 0.5) : skyLo))
  ctx.fillStyle = sky
  ctx.fillRect(a0[0], a1[1], a1[0] - a0[0], a0[1] - a1[1])
  // Çərçivə, taxt və üst qurşaq
  const fr = 0.07
  const woodC = mix(WOOD.map(v => v * (0.75 + amb * 0.5)), NIGHT, nightK * 0.5)
  fill([[x0 - fr, y0 - fr - 0.05, 0], [x1 + fr, y0 - fr - 0.05, 0], [x1 + fr, y1 + fr, 0], [x0 - fr, y1 + fr, 0]], rgb(woodC))
  fill([[x0 - fr - 0.06, y1 + fr, 0], [x1 + fr + 0.06, y1 + fr, 0], [x1 + fr + 0.03, y1 + fr + 0.16, 0], [x0 - fr - 0.03, y1 + fr + 0.16, 0]], rgb(mix(woodC, [0, 0, 0], 0.12)))
  ctx.beginPath()
  pathOf(ctx, [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], P)
  for (const o of openings) pathOf(ctx, o.map(([x, y]) => [x, y, 0]), P)
  ctx.save()
  ctx.clip()
  ctx.fillStyle = sky
  ctx.fillRect(a0[0], a1[1], a1[0] - a0[0], a0[1] - a1[1])
  ctx.restore()
  // Çərçivənin içi (deşiklər çıxılmaqla) — taxta
  ctx.beginPath()
  pathOf(ctx, [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], P)
  for (const o of openings) pathOf(ctx, o.map(([x, y]) => [x, y, 0]), P)
  ctx.fillStyle = rgb(mix(woodC, [0, 0, 0], 0.08))
  ctx.fill('evenodd')
  if (front) {
    ctx.strokeStyle = 'rgba(255,214,150,.28)'; ctx.lineWidth = 0.8
    ctx.beginPath()
    for (const o of openings) pathOf(ctx, o.map(([x, y]) => [x, y, 0]), P)
    ctx.stroke()
  }

  if (!front || !patches.length) return
  // ── İşıq: ayrıca canvas-da kəskin ləkələr, sonra əlavə (lighter) qarışıqla yumşaq ──
  const warm = mix([255, 150, 72], [255, 234, 190], clamp01(alt / 30))
  const lc = light.getContext('2d')
  lc.setTransform(dpr, 0, 0, dpr, 0, 0)
  lc.clearRect(0, 0, W, H)
  const sinA = Math.sin(alt * RAD)
  const kFloor = 0.4 + 0.38 * clamp01(sinA / 0.6)
  const kWall = 0.3 + 0.45 * Math.abs(sun.dir.x)
  // Toz içində şüa dəstəsi
  const corners = [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]]
  const hits = corners.map(c => firstHit(c, sun.dir)).filter(Boolean)
  if (hits.length === 4) {
    const pts = hull([...corners, ...hits].map(P))
    const cw = P([(x0 + x1) / 2, (y0 + y1) / 2, 0])
    const hc = P(hits.reduce((s, q) => [s[0] + q[0] / 4, s[1] + q[1] / 4, s[2] + q[2] / 4], [0, 0, 0]))
    const g = lc.createLinearGradient(cw[0], cw[1], hc[0], hc[1])
    g.addColorStop(0, rgb(warm, 0.2)); g.addColorStop(1, rgb(warm, 0.03))
    lc.beginPath()
    pts.forEach((s, i) => (i ? lc.lineTo(s[0], s[1]) : lc.moveTo(s[0], s[1])))
    lc.closePath(); lc.fillStyle = g; lc.fill()
  }
  for (const { surface, poly } of patches) {
    if (surface === 'back') continue        // kameranın arxasındadır
    lc.beginPath(); pathOf(lc, poly, P)
    lc.fillStyle = rgb(warm, surface === 'floor' ? kFloor : kWall)
    lc.fill()
  }
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'lighter'
  if ('filter' in ctx) {
    ctx.filter = `blur(${(1.6 * dpr).toFixed(1)}px)`
    ctx.drawImage(light, 0, 0)
    ctx.filter = 'none'
    ctx.globalAlpha = 0.45
    ctx.drawImage(light, 0, 0)
  } else {
    // filter dəstəklənmirsə: bir neçə sürüşdürülmüş qat — yumşaq kənar
    ctx.globalAlpha = 0.3
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) ctx.drawImage(light, dx * dpr, dy * dpr)
  }
  ctx.restore()
}

export default function MashrabiyaLight() {
  const { lang = 'az' } = useLang() || {}
  const u = pickUi(T, lang, 'en')
  const reduced = useReduced()
  const pt = usePrayerTimes()
  const loc = pt.location || getPrayerLocation()
  const { lat, lng } = loc
  const tz = loc.tz || Intl.DateTimeFormat().resolvedOptions().timeZone
  const wallAz = wallAzimuth(lat)

  const [nowMs, setNowMs] = useState(() => Date.now())
  const [t, setT] = useState(nowMs)
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(false)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const root = useRef(null), wrap = useRef(null), cvs = useRef(null), lightCvs = useRef(null)

  // Bugünkü günün aralığı
  const day = useMemo(() => {
    const midnight = localMidnight(nowMs, tz)
    const a = asrDay(localDayStart(nowMs, tz), lat, lng)
    const start = a.sunrise ? a.sunrise - PAD : midnight
    const end = a.sunset ? a.sunset + PAD : midnight + 24 * 60 * MIN
    return { midnight, start, end }
  }, [nowMs, tz, lat, lng])

  // Şəhər / gün dəyişəndə vaxt "indi"yə qayıdır
  useEffect(() => { setT(Date.now()) }, [day.start])
  const tc = Math.max(day.start, Math.min(day.end, t))
  const tRef = useRef(tc)
  useEffect(() => { tRef.current = tc }, [tc])

  const fmt = useMemo(() => {
    try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) }
    catch { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) }
  }, [tz])

  const marks = useMemo(() => (pt.prayers || [])
    .filter(p => MARKS.includes(p.key))
    .map(p => ({ key: p.key, adhan: p.adhan, at: hhmmToMs(p.adhan, day.midnight) }))
    .filter(m => m.at != null && m.at >= day.start && m.at <= day.end), [pt.prayers, day])

  const openings = useMemo(() => latticeOpenings(), [])
  const sun = useMemo(() => sunInRoom(tc, lat, lng, wallAz), [tc, lat, lng, wallAz])
  const patches = useMemo(() => lightPatches(openings, sun.dir), [openings, sun])

  // Ölçü
  useEffect(() => {
    const el = wrap.current
    if (!el) return undefined
    const measure = () => {
      const w = Math.round(el.clientWidth)
      setSize(s => (s.w === w ? s : { w, h: Math.round(w * (w < 560 ? 0.9 : 0.62)) }))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Görünürlük — ekrandan kənarda çəkmə
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Çəkmə — yalnız vaxt / ölçü dəyişəndə
  useEffect(() => {
    const c = cvs.current
    if (!c || !visible || !size.w) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const bw = Math.round(size.w * dpr), bh = Math.round(size.h * dpr)
    if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh }
    if (!lightCvs.current) lightCvs.current = document.createElement('canvas')
    const l = lightCvs.current
    if (l.width !== bw || l.height !== bh) { l.width = bw; l.height = bh }
    const ctx = c.getContext('2d')
    if (ctx) drawScene(ctx, l, size.w, size.h, dpr, sun, patches, openings)
  }, [sun, patches, openings, size, visible])

  // "Günü oynat" — ekranda olanda, hərəkəti azalt rejimində yox
  useEffect(() => {
    if (!playing || !visible || reduced) return undefined
    let raf = 0, last = 0, cur = Math.max(day.start, tRef.current)
    const tick = (ts) => {
      const dt = last ? Math.min(64, ts - last) : 16
      last = ts
      cur = Math.min(day.end, cur + dt * 60 * MIN / 1000)   // 1 san → 1 saat
      setT(cur)
      if (cur >= day.end) setPlaying(false); else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, visible, reduced, day])

  const goNow = () => { setPlaying(false); const n = Date.now(); setNowMs(n); setT(n) }
  const togglePlay = () => {
    if (!playing && tc >= day.end - MIN) setT(day.start)
    setPlaying(p => !p)
  }

  const span = day.end - day.start
  const pct = (ms) => ((ms - day.start) / span) * 100
  const near = marks.reduce((b, m) => (Math.abs(m.at - tc) <= NEAR && (!b || Math.abs(m.at - tc) < Math.abs(b.at - tc)) ? m : b), null)
  const caption = near ? u.cap[near.key] : sun.alt <= 0 ? u.cap.night : !sun.dir ? u.cap.behind : u.cap.day
  const timeLabel = fmt.format(new Date(tc))

  return (
    <section ref={root} className="ui-card mshr" aria-labelledby="mshr-title" data-testid="mashrabiya" data-alt={sun.alt.toFixed(1)}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h3 id="mshr-title" className="mshr__title">{u.title}</h3>
      <p className="mshr__lead">{u.lead}</p>

      <div ref={wrap} className="mshr__stage">
        <canvas ref={cvs} className="mshr__canvas" data-testid="mashrabiya-canvas" role="img"
          aria-label={`${u.canvas}. ${u.local} ${timeLabel}, ${u.alt} ${sun.alt.toFixed(1)}°`}
          style={size.w ? { height: `${size.h}px` } : undefined} />
        <span className="mshr__face">{wallAz === 180 ? u.facesS : u.facesN}</span>
      </div>

      <div className="mshr__ctrl">
        <div className="mshr__track">
          <input type="range" className="mshr__range" min={0} max={Math.round(span / MIN)} step={1}
            value={Math.round((tc - day.start) / MIN)} aria-label={u.slider} aria-valuetext={timeLabel}
            onChange={(e) => { setPlaying(false); setT(day.start + Number(e.target.value) * MIN) }} />
          <div className="mshr__marks" role="group" aria-label={u.marks}>
            {marks.map((m, i) => (
              <button key={m.key} type="button" data-prayer={m.key}
                className={`mshr__mark${i % 2 ? ' mshr__mark--low' : ''}${near?.key === m.key ? ' is-on' : ''}`}
                style={{ '--x': `${pct(m.at).toFixed(2)}%` }}
                onClick={() => { setPlaying(false); setT(m.at) }}>
                <span className="mshr__mark-n">{pickUi(PRAYER_NAMES[m.key], lang, 'en')}</span>
                <span className="mshr__mark-t">{m.adhan}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mshr__btns">
          <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={goNow}>{u.now}</button>
          {!reduced && (
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" aria-pressed={playing} onClick={togglePlay}>
              {playing ? u.pause : u.play}
            </button>
          )}
        </div>
      </div>

      <dl className="mshr__read">
        <div><dt>{u.local}</dt><dd>{timeLabel}</dd></div>
        <div><dt>{u.alt}</dt><dd>{sun.alt.toFixed(1)}°</dd></div>
        <div><dt>{u.azim}</dt><dd>{Math.round(sun.az)}°</dd></div>
      </dl>
      <p className="mshr__cap" aria-live="polite">{caption}</p>
      <p className="mshr__hist">{u.hist}</p>
      <p className="mshr__note">{u.note}</p>
    </section>
  )
}
