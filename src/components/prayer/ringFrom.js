// ProgressRing (components/viz) qövsünün uzunluğu — "dolma" animasiyası üçün
// (ToolsMotion.css → .tm-ring: stroke-dashoffset bu dəyərdən 0-a enir).
export function ringFrom(value, max, size, thickness) {
  const r = (size - thickness) / 2
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return `${(frac * 2 * Math.PI * r).toFixed(1)}px`
}
