// Hilal yolu (components/CrescentPath.jsx) — ayın fazası və işıqlı hissənin yolu (saf; tests/unit/crescent-path.test.js)

/** Günün ayı: işıqlanma 0…1 və tərəf (artan — sağdan işıqlı) */
export function moonOf(day) {
  const age = day - 0.5            // hilal görünəndən bəri günlər
  const ph = (age / 29.53) % 1      // 0 — təzə ay, 0.5 — bədr
  return { lit: (1 - Math.cos(2 * Math.PI * ph)) / 2, waxing: ph < 0.5 }
}

/** Ayın işıqlı hissəsinin SVG yolu (r radiuslu, mərkəz 0,0) */
export function litPath(r, lit, waxing) {
  const k = Math.abs(1 - 2 * lit) * r          // terminatorun ellips yarımoxu
  const outer = waxing ? 1 : 0                  // xarici qövs tərəfi
  const inner = lit < 0.5 ? 1 - outer : outer
  return `M0,${-r} A${r},${r} 0 0 ${outer} 0,${r} A${k.toFixed(2)},${r} 0 0 ${inner} 0,${-r} Z`
}

