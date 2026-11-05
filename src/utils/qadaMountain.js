// Qəza dağı (components/QadaMountain.jsx) — cığırın həndəsəsi (saf; tests/unit/qada-mountain.test.js)
// Cığır ətəkdən zirvəyə ilan kimi qalxır; bütün nöqtələr dağın siluetinin içindədir (viewBox 600×300).
export const TRAIL = [
  [150, 290], [360, 262], [230, 226], [390, 192], [270, 160], [380, 128], [300, 98], [360, 70], [318, 46], [330, 24],
]
// Düşərgələr: yolun hər 10%-i (sonuncu — zirvə)
export const CAMPS = Array.from({ length: 10 }, (_, i) => (i + 1) / 10)

export const trailPath = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')

/** Cığır boyu p (0…1) nöqtəsi — uzunluğa görə xətti interpolyasiya */
export function pointAt(pts, p) {
  const seg = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    seg.push(l); total += l
  }
  let rest = Math.max(0, Math.min(1, Number(p) || 0)) * total
  for (let i = 0; i < seg.length; i++) {
    if (rest <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, rest / seg[i]) : 0
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
      return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k }
    }
    rest -= seg[i]
  }
  return { x: pts[0][0], y: pts[0][1] }
}
