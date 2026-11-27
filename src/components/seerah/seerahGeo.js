// ═══════════════════════════════════════════════════════
// /seerah xəritəsinin həndəsəsi — öz çəkdiyimiz sadələşdirilmiş kontur (kitabxana, şəkil yoxdur)
//
// • Proyeksiya: ekvidistant, mərkəzi enliyin cos(φ) düzəlişi ilə (SiraMaps.jsx ilə eyni üsul) —
//   nisbi məsafələr düzgündür, sahil xətti əl ilə seçilmiş real nöqtələrdən sadələşdirilib.
// • Əsas çərçivə: Hicaz və Qırmızı dəniz (Təbükdən Taifə qədər); iki böyüdülmüş çərçivə —
//   Məkkə ətrafı (Sevr, Mina, Ərəfat, Hüdeybiyyə, Hüneyn) və Mədinə ətrafı (Quba, Uhud, Xəndək).
// • Hicrət yolu SiraMaps.jsx → HIJRA_ROUTE ilə EYNİDİR (tests/unit/seerah.test.js yoxlayır);
//   oradan import edilmir ki, media.css və digər xəritələr bu səhifənin chunk-ına düşməsin.
// ═══════════════════════════════════════════════════════

export function projector(box, W) {
  const latC = ((box.lat[0] + box.lat[1]) / 2) * Math.PI / 180
  const kx = Math.cos(latC)
  const H = Math.round(W * (box.lat[1] - box.lat[0]) / ((box.lon[1] - box.lon[0]) * kx))
  const p = (lat, lon) => [
    +(((lon - box.lon[0]) / (box.lon[1] - box.lon[0])) * W).toFixed(1),
    +(((box.lat[1] - lat) / (box.lat[1] - box.lat[0])) * H).toFixed(1),
  ]
  const inside = (lat, lon) => lat >= box.lat[0] && lat <= box.lat[1] && lon >= box.lon[0] && lon <= box.lon[1]
  return { p, W, H, box, inside }
}

export const MAIN_BOX = { lat: [20.4, 29.4], lon: [34.6, 41.2] }
export const MAIN_W = 420
// Böyüdülmüş çərçivələr: coğrafi qutu + ölçü + əsas xəritədəki yeri (sol-yuxarı künc)
export const INSETS = {
  makkah: { box: { lat: [21.3, 21.52], lon: [39.54, 40.14] }, w: 196, at: 'bottom-left' },
  madinah: { box: { lat: [24.424, 24.518], lon: [39.556, 39.652] }, w: 118, at: 'top-right' },
}

// Ərəbistan yarımadasının Qırmızı dəniz sahili, şimaldan cənuba (enlik, uzunluq):
// Haql, Məqna, Şeyx Humeyd burnu, Duba, əl-Vəch, Ümlüc, Yənbu, Məstura, Rabiğ, Cidde, Şueybə, əl-Lis
export const ARABIA_COAST = [
  [29.4, 34.96], [29.29, 34.94], [28.9, 34.83], [28.42, 34.76], [28.0, 34.64], [27.9, 34.95], [27.75, 35.18],
  [27.35, 35.69], [26.9, 36.02], [26.24, 36.45], [25.6, 36.86], [25.02, 37.27], [24.6, 37.62], [24.09, 38.06],
  [23.6, 38.52], [23.1, 38.83], [22.8, 39.03], [22.3, 39.08], [21.85, 39.08], [21.48, 39.17], [21.0, 39.38],
  [20.85, 39.5], [20.4, 39.96],
]
// Afrika sahili (Sudan, Misir): Məhəmməd Qol, Həlaib, Şalatin, Ras Banas, Bereniks, Mərsa Ələm
export const AFRICA_COAST = [
  [20.4, 37.24], [20.9, 37.12], [21.6, 36.9], [22.2, 36.65], [22.7, 36.15], [23.13, 35.62], [23.6, 35.55],
  [23.92, 35.8], [23.98, 35.47], [24.5, 35.2], [25.07, 34.9], [25.55, 34.6],
]
// Sina yarımadasının şərq sahili (Əqəbə körfəzinin qərbi): Taba, Nüveybə, Dəhəb
export const SINAI_COAST = [[29.4, 34.86], [28.97, 34.66], [28.5, 34.52], [28.2, 34.6]]

// Hicrətin təxmini yolu: Məkkə → Sevr → sahil yolu → Quba → Mədinə (SiraMaps.jsx → HIJRA_ROUTE)
export const HIJRA_ROUTE = [
  [21.4225, 39.8262], [21.3771, 39.8497], [21.55, 39.42], [22.05, 39.2], [22.7, 39.18], [23.3, 39.1],
  [23.85, 39.25], [24.2, 39.45], [24.4393, 39.6173], [24.4672, 39.6112],
]

// Xəritədən kənar yerlər: kənarın hansı nöqtəsində ox (real uzunluq/enlik istiqaməti ilə)
// aqsa — Qüds (31.78° Ş, 35.23° Ş.U.) yuxarı kənarda; habasha — Aksum (14.1° Ş, 38.7° Ş.U.) aşağı kənarda
export const EDGE_AT = { aqsa: { lon: 35.23, side: 'top' }, habasha: { lon: 38.7, side: 'bottom' } }

export const pathOf = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')

// Yumşaq əyri (Catmull-Rom → Bezier) — SiraMaps.jsx ilə eyni
export function smooth(pts) {
  if (pts.length < 3) return pathOf(pts)
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`
  }
  return d
}

/** Quru çoxbucaqlı: sahil xətti + çərçivənin şərq (east) və ya qərb (west) kənarı ilə bağlanır. */
export function landPath(prj, coast, side) {
  const pts = coast.map(([la, lo]) => prj.p(la, lo))
  const edgeX = side === 'east' ? prj.W + 20 : -20
  const first = pts[0], last = pts[pts.length - 1]
  return `${pathOf(pts)} L${edgeX} ${last[1]} L${edgeX} ${first[1]} Z`
}
