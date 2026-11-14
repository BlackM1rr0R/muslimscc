// ═══════════════════════════════════════════════════════
// Icon3D (v6.7) — "Nur" ikon dəsti: bölmələr üçün həcmli İslami ikonlar
//
//   <Icon3D name="quran" size={56} />          — dekorativ (aria-hidden)
//
// • Kafel: zümrüd şüşə (brend palitrası — emerald/sand tokenləri), yuxarıdan işıq, qızılı nazik haşiyə,
//   fonda zəif xatəm (səkkizguşəli ulduz) naxışı.
// • Fiqur: qızılı "döymə metal" — ekstruziya qatı (qalınlıq), yuxarıdan işıqlanan üz, parıltı, yumşaq kölgə.
//   Fiqurlar İslami formalardır: rəhildə mushaf, izometrik Kəbə, mehrab tağı, səccadə, təsbeh, fənər …
// • Hərəkət (CSS, styles/Icon3D.css): ana element hover olanda kafel 3D-də əyilir, fiqur öndə qalxır
//   (paralaks), səthdən işıq zolağı keçir. prefers-reduced-motion / a11y-reduce-motion — hərəkətsiz.
// • Yalnız SVG (şəkil yox), hər ikon ~2–3 KB. Fiqur yoxdursa — adi xətti <Icon> eyni kafeldə.
// Kiçik UI ikonları (ox, info, axtarış) üçün DEYİL — onlar xətti <Icon> olaraq qalır.
// lite — kölgə filtri və fon naxışı yoxdur (siyahılar, telefon menyusu: 60+ sətir, açılış səlis qalsın).
// ═══════════════════════════════════════════════════════
import { useId } from 'react'
import Icon from './Icon'
import '../styles/Icon3D.css'

// İki dairədən hilal (xarici dairənin işıqlı tərəfi): kəsişmə nöqtələri hesablanır
function crescent(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy)
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a))
  const mx = x1 + (a * dx) / d, my = y1 + (a * dy) / d
  const p = [mx + (h * dy) / d, my - (h * dx) / d], q = [mx - (h * dy) / d, my + (h * dx) / d]
  const f = (n) => n.toFixed(2)
  return `M${f(p[0])} ${f(p[1])}A${r1} ${r1} 0 1 0 ${f(q[0])} ${f(q[1])}A${r2} ${r2} 0 1 1 ${f(p[0])} ${f(p[1])}Z`
}
// Səkkizguşəli ulduz (xatəm): iki kvadratın birləşməsi — tək kontur
function khatam(cx, cy, R) {
  const r = R * 0.7654   // iki kvadratın kəsişməsi: cos45° / cos22.5°
  const pts = []
  for (let i = 0; i < 16; i++) {
    const ang = (Math.PI / 8) * i - Math.PI / 2
    const rr = i % 2 === 0 ? R : r
    pts.push(`${(cx + rr * Math.cos(ang)).toFixed(2)} ${(cy + rr * Math.sin(ang)).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}
const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

// Hər fiqur: parts — { d, t: ton, s?: stroke tonu, w?: xətt qalınlığı, solid?: ekstruziyaya düşmür } və ya { text, x, y, fs, t }
// tonlar: gold, goldDark, paper, ink, inkTop, glow, line (nazik qızılı-qəhvəyi xətt)
const G = {
  quran: { parts: [
    { d: 'M22 43.5 26 43.5 43 57 39 57Z', t: 'gold' },
    { d: 'M42 43.5 38 43.5 21 57 25 57Z', t: 'gold' },
    { d: 'M32 22.5C26 18.8 17.5 18.8 9.5 21V44C17.5 41.8 26 41.8 32 45.5 38 41.8 46.5 41.8 54.5 44V21C46.5 18.8 38 18.8 32 22.5Z', t: 'gold' },
    { d: 'M32 22C26.5 17.2 19 17 12 18.6V41.4C19 39.8 26.5 40 32 43.5Z', t: 'paper', solid: true },
    { d: 'M32 22C37.5 17.2 45 17 52 18.6V41.4C45 39.8 37.5 40 32 43.5Z', t: 'paper', solid: true },
    { d: 'M15.5 24.5C20 23.6 25 23.8 28.5 25.6M15.5 29.5C20 28.6 25 28.8 28.5 30.6M15.5 34.5C20 33.6 25 33.8 28.5 35.6M35.5 25.6C39 23.8 44 23.6 48.5 24.5M35.5 30.6C39 28.8 44 28.6 48.5 29.5M35.5 35.6C39 33.8 44 33.6 48.5 34.5', s: 'line', w: 1.3, solid: true },
  ] },
  qibla: { flat: true, parts: [
    { d: 'M32 12.5 51 20.8 32 29.1 13 20.8Z', t: 'inkTop' },
    { d: 'M13 20.8 32 29.1V52.5L13 44.2Z', t: 'ink' },
    { d: 'M32 29.1 51 20.8V44.2L32 52.5Z', t: 'inkSide' },
    { d: 'M13 25.4 32 33.7V37.4L13 29.1Z', t: 'gold' },
    { d: 'M32 33.7 51 25.4V29.1L32 37.4Z', t: 'goldDark' },
    { d: 'M40.5 39.2 45.5 37V44.6L40.5 46.8Z', t: 'gold' },
    { d: 'M13 20.8 32 29.1 51 20.8', s: 'glint', w: 0.9 },
  ] },
  prayer: { parts: [
    { d: 'M17 53V30.5C17 21.5 24.5 15.5 32 10.5 39.5 15.5 47 21.5 47 30.5V53ZM22.5 53H41.5V31.2C41.5 25 37 20.6 32 17.4 27 20.6 22.5 25 22.5 31.2Z', t: 'gold', rule: 'evenodd' },
    { d: circle(32, 38, 7.6), t: 'paper', solid: true },
    { d: 'M32 38V32.6M32 38 35.8 40.4', s: 'ink', w: 1.7, solid: true },
    { d: crescent(32, 6.6, 2.6, 33.4, 5.6, 2.2), t: 'gold' },
  ] },
  prayerguide: { parts: [
    { d: 'M17 11H47V53H17Z', t: 'gold' },
    { d: 'M20.5 14.5H43.5V49.5H20.5Z', t: 'paper', solid: true },
    { d: 'M24.5 47V29.5C24.5 24 28.4 20.2 32 17.8 35.6 20.2 39.5 24 39.5 29.5V47Z', t: 'gold', solid: true },
    { d: 'M28 47V31C28 27.5 30 25 32 23.4 34 25 36 27.5 36 31V47Z', t: 'paper', solid: true },
    { d: 'M19 8V10.5M23 8V10.5M27 8V10.5M31 8V10.5M35 8V10.5M39 8V10.5M43 8V10.5M45 8V10.5M19 53.5V56M23 53.5V56M27 53.5V56M31 53.5V56M35 53.5V56M39 53.5V56M43 53.5V56M45 53.5V56', s: 'gold', w: 1.4 },
  ] },
  hadith: { parts: [
    { d: 'M17 16H47V48H17Z', t: 'paper' },
    { d: 'M15 10.5H49A3.8 3.8 0 0 1 49 18.1H15A3.8 3.8 0 0 1 15 10.5Z', t: 'gold' },
    { d: 'M15 45.9H49A3.8 3.8 0 0 1 49 53.5H15A3.8 3.8 0 0 1 15 45.9Z', t: 'gold' },
    { d: 'M22 24H42M22 29.5H42M22 35H42M22 40.5H34', s: 'line', w: 1.6, solid: true },
  ] },
  learn: { parts: [
    { d: 'M13 41H49A2.5 2.5 0 0 1 51.5 43.5V49.5A2.5 2.5 0 0 1 49 52H13Z', t: 'gold' },
    { d: 'M15.5 43.2H48V49.8H15.5Z', t: 'paper', solid: true },
    { d: 'M16 29.5H47.5A2.5 2.5 0 0 1 50 32V37.6A2.5 2.5 0 0 1 47.5 40.1H16Z', t: 'goldDark' },
    { d: 'M18.5 31.7H47V37.9H18.5Z', t: 'paper', solid: true },
    { d: 'M20.5 10.5 46 21.5 44.6 24.8 19.1 13.8Z', t: 'ink' },
    { d: 'M46 21.5 50.5 25.2 44.6 24.8Z', t: 'gold' },
    { d: khatam(31, 46.5, 3.2), t: 'goldDark', solid: true },
  ] },
  duas: { parts: [
    { d: 'M14.6 38.5V21M18.3 38.5V17.5M22 38.5V18.5M25.6 38.5V22', s: 'gold', w: 3.3 },
    { d: 'M12.9 33.5H27.3V45A6.5 6.5 0 0 1 20.8 51.5H19.4A6.5 6.5 0 0 1 12.9 45Z', t: 'gold' },
    { d: 'M26.2 45.5 30.4 37', s: 'gold', w: 3.6 },
    { d: 'M16.45 36.5V30M20.15 36.5V27M23.8 36.5V28', s: 'line', w: 0.6, solid: true },
    { d: 'M49.4 38.5V21M45.7 38.5V17.5M42 38.5V18.5M38.4 38.5V22', s: 'gold', w: 3.3 },
    { d: 'M36.7 33.5H51.1V45A6.5 6.5 0 0 1 44.6 51.5H43.2A6.5 6.5 0 0 1 36.7 45Z', t: 'gold' },
    { d: 'M37.8 45.5 33.6 37', s: 'gold', w: 3.6 },
    { d: 'M47.55 36.5V30M43.85 36.5V27M40.2 36.5V28', s: 'line', w: 0.6, solid: true },
  ] },
  jamaat: { parts: [
    { d: 'M9.5 50H54.5V53.5H9.5Z', t: 'goldDark' },
    { d: circle(17.5, 27.5, 3.6), t: 'gold' },
    { d: 'M11.5 50V39A6 6 0 0 1 23.5 39V50Z', t: 'gold' },
    { d: circle(46.5, 27.5, 3.6), t: 'gold' },
    { d: 'M40.5 50V39A6 6 0 0 1 52.5 39V50Z', t: 'gold' },
    { d: circle(32, 21.5, 4.4), t: 'gold' },
    { d: 'M24.8 50V36.2A7.2 7.2 0 0 1 39.2 36.2V50Z', t: 'gold' },
    { d: 'M32 11 33 13.2 35.4 13.2 33.5 14.6 34.2 16.9 32 15.5 29.8 16.9 30.5 14.6 28.6 13.2 31 13.2Z', t: 'paper', solid: true },
  ] },
  hisn: { parts: [
    { d: 'M32 9.5 50 15.8V30C50 41.5 42 49.5 32 54.5 22 49.5 14 41.5 14 30V15.8Z', t: 'gold' },
    { d: 'M32 14 45.5 18.8V30C45.5 39 39.5 45.6 32 49.6 24.5 45.6 18.5 39 18.5 30V18.8Z', t: 'goldDark', solid: true },
    { d: khatam(32, 30.5, 9.5), t: 'paper', solid: true },
  ] },
  tracker: { parts: [
    { d: 'M15.5 12H48.5A4 4 0 0 1 52.5 16V50A4 4 0 0 1 48.5 54H15.5A4 4 0 0 1 11.5 50V16A4 4 0 0 1 15.5 12Z', t: 'gold' },
    { d: 'M16 18H48V50H16Z', t: 'paper', solid: true },
    { d: 'M24.5 8.5H39.5A2.5 2.5 0 0 1 42 11V15.5H22V11A2.5 2.5 0 0 1 24.5 8.5Z', t: 'goldDark' },
    { d: 'M19.5 25.5 21.8 27.8 25.8 23.2M19.5 34 21.8 36.3 25.8 31.7M19.5 42.5 21.8 44.8 25.8 40.2', s: 'emeraldInk', w: 1.9, solid: true },
    { d: 'M29.5 25.8H44M29.5 34.3H44M29.5 42.8H39', s: 'line', w: 1.6, solid: true },
  ] },
  duajournal: { parts: [
    { d: 'M17 9.5H45.5A4 4 0 0 1 49.5 13.5V50.5A4 4 0 0 1 45.5 54.5H17Z', t: 'gold' },
    { d: 'M14.5 9.5H21V54.5H14.5Z', t: 'goldDark' },
    { d: khatam(35.5, 30, 9.5), t: 'paper', solid: true },
    { d: 'M41 54V60.5L43.4 58.2 45.8 60.5V54Z', t: 'goldDark' },
  ] },
  qada: { parts: [
    { d: 'M18.5 9H45.5V13.5H18.5ZM18.5 50.5H45.5V55H18.5Z', t: 'goldDark' },
    { d: 'M21 13.5H43V17C43 24 36.5 28 34 32 36.5 36 43 40 43 47V50.5H21V47C21 40 27.5 36 30 32 27.5 28 21 24 21 17Z', t: 'gold' },
    { d: 'M24.5 17H39.5C39 21.5 34.6 25 32 29 29.4 25 25 21.5 24.5 17Z', t: 'glow', solid: true },
    { d: 'M25 47.5C26.5 42.8 29.6 40.2 32 39.2 34.4 40.2 37.5 42.8 39 47.5Z', t: 'glow', solid: true },
    { d: 'M32 30V39', s: 'glowLine', w: 1, solid: true },
  ] },
  dhikr: { parts: [
    { d: circle(32, 29, 14), s: 'line', w: 1 },
    ...Array.from({ length: 17 }, (_, i) => {
      const a = (90 + 22 + (i * 316) / 16) * Math.PI / 180   // aşağıda (imam muncuğu) boşluq
      return { d: circle(+(32 + 14 * Math.cos(a)).toFixed(2), +(29 + 14 * Math.sin(a)).toFixed(2), 2.7), t: 'gold' }
    }),
    { d: 'M29.2 42.5H34.8L35.6 47.5H28.4Z', t: 'gold' },
    { d: 'M28.6 47.5H35.4L38 56.5H26Z', t: 'goldDark' },
    { d: 'M30 49V56M32 49V56.5M34 49V56', s: 'line', w: 0.9, solid: true },
  ] },
  names: { parts: [
    { d: khatam(32, 32, 21.5), t: 'gold' },
    { d: circle(32, 32, 11), t: 'paper', solid: true },
    { text: '٩٩', x: 32, y: 36.4, fs: 11.5, t: 'goldDark', solid: true },
  ] },
  calendar: { parts: [
    { d: crescent(30, 33, 18, 38.5, 27, 15.5), t: 'gold' },
    { d: khatam(45.5, 41.5, 5.2), t: 'gold' },
  ] },
  zakat: { parts: [
    ...[50, 44.5, 39].map((y) => ({ d: `M14 ${y - 3}H38V${y}A12 3.8 0 0 1 14 ${y}Z`, t: 'goldDark' })),
    ...[46.2, 40.7, 35.2].map((y) => ({ d: `M14 ${y}A12 3.8 0 0 1 38 ${y}A12 3.8 0 0 1 14 ${y}Z`, t: 'gold', solid: true })),
    { d: circle(42, 24, 11), t: 'gold' },
    { d: circle(42, 24, 8.4), t: 'goldDark', solid: true },
    { d: crescent(41.5, 24.5, 5.4, 43.8, 22.6, 4.6), t: 'paper', solid: true },
  ] },
  hajjguide: { parts: [
    { d: 'M32 47A20 7 0 1 1 32.01 47Z', s: 'gold', w: 1.6 },
    { d: 'M32 15 44.5 20.4 32 25.8 19.5 20.4Z', t: 'inkTop', solid: true },
    { d: 'M19.5 20.4 32 25.8V41L19.5 35.6Z', t: 'ink', solid: true },
    { d: 'M32 25.8 44.5 20.4V35.6L32 41Z', t: 'inkSide', solid: true },
    { d: 'M19.5 23.4 32 28.8V31.2L19.5 25.8Z', t: 'gold', solid: true },
    { d: 'M32 28.8 44.5 23.4V25.8L32 31.2Z', t: 'goldDark', solid: true },
  ] },
  mosques: { parts: [
    { d: 'M17 40H47V54H17Z', t: 'gold' },
    { d: 'M19.5 40C19.5 29 26.5 24 32 20.5 37.5 24 44.5 29 44.5 40Z', t: 'gold' },
    { d: 'M31.3 13.5H32.7V20.6H31.3Z', t: 'gold' },
    { d: crescent(32, 11.4, 2.6, 33.3, 10.3, 2.1), t: 'gold' },
    { d: 'M9.5 54V24H14.5V54ZM9 24 12 15.5 15 24Z', t: 'gold' },
    { d: 'M49.5 54V24H54.5V54ZM49 24 52 15.5 55 24Z', t: 'gold' },
    { d: 'M28.5 54V47.5A3.5 3.5 0 0 1 35.5 47.5V54Z', t: 'ink', solid: true },
  ] },
  ramadan: { parts: [
    { d: circle(32, 9.5, 2.6), s: 'gold', w: 1.4 },
    { d: 'M24 18H40L36.5 12.4H27.5Z', t: 'gold' },
    { d: 'M21.5 18H42.5L45 39.5 38.5 50H25.5L19 39.5Z', t: 'gold' },
    { d: 'M25.6 21.5H38.4L40.3 38.6 35.6 46.4H28.4L23.7 38.6Z', t: 'glow', solid: true },
    { d: 'M32 21.5V46.4M24.6 30H39.4', s: 'goldDark', w: 1.2, solid: true },
    { d: 'M26 50H38V54.5H26Z', t: 'goldDark' },
  ] },
  history: { parts: [
    { d: 'M23 51.5H41V56H23Z', t: 'goldDark' },
    { d: 'M26.8 52 28.4 21H35.6L37.2 52Z', t: 'gold' },
    { d: 'M23.5 30H40.5V33.4H23.5Z', t: 'goldDark' },
    { d: 'M24.8 21H39.2V24H24.8Z', t: 'gold' },
    { d: 'M27.6 21 32 9.5 36.4 21Z', t: 'gold' },
    { d: 'M30.4 38.5A1.6 1.6 0 0 1 33.6 38.5V44H30.4Z', t: 'ink', solid: true },
  ] },
  kids: { flat: true, parts: [
    { d: 'M21 21.5 32 26.3 21 31.1 10 26.3Z', t: 'goldTop' },
    { d: 'M10 26.3 21 31.1V44.5L10 39.7Z', t: 'gold' },
    { d: 'M21 31.1 32 26.3V39.7L21 44.5Z', t: 'goldDark' },
    { d: 'M43 26.5 54 31.3 43 36.1 32 31.3Z', t: 'paperTop' },
    { d: 'M32 31.3 43 36.1V49.5L32 44.7Z', t: 'paper' },
    { d: 'M43 36.1 54 31.3V44.7L43 49.5Z', t: 'paperSide' },
    { d: khatam(43, 31.3, 3), t: 'goldDark' },
    { d: crescent(21, 26.3, 3, 22.2, 25.4, 2.5), t: 'goldDark' },
  ] },
}

export const ICON3D_NAMES = Object.keys(G)

export default function Icon3D({ name, size = 56, className = '', lite = false }) {
  const uid = useId().replace(/:/g, '')
  const g = G[name]
  const id = (k) => `i3${uid}${k}`
  const tone = (t) => (t ? `url(#${id(t)})` : 'none')
  const strokeOf = (s) => ({ line: '#8c6414', glint: 'rgba(255,255,255,.35)', emeraldInk: '#13705a', glowLine: '#f2b84b' }[s] || tone(s))
  const depth = g && !g.flat ? g.parts.filter(p => !p.solid && !p.text) : []
  // v6.7 (perf): yalnız bu fiqurun işlətdiyi qradiyentlər (əvvəl hər ikonda 14 — ana səhifədə ~900 SVG düyünü)
  const used = new Set(g ? g.parts.flatMap(p => [p.t, p.s]).filter(Boolean) : [])
  return (
    <span className={`i3d ${className}`} style={{ '--i3d': `${size}px` }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size} focusable="false">
        <defs>
          <linearGradient id={id('tile')} x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stopColor="#3fae8c" /><stop offset=".45" stopColor="#13705a" /><stop offset="1" stopColor="#062a21" /></linearGradient>
          <linearGradient id={id('hi')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".42" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /></linearGradient>
          <linearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f0e2c2" stopOpacity=".95" /><stop offset=".5" stopColor="#c09445" stopOpacity=".35" /><stop offset="1" stopColor="#d8b46a" stopOpacity=".8" /></linearGradient>
          {used.has('gold') && <linearGradient id={id('gold')} x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stopColor="#fff6dc" /><stop offset=".35" stopColor="#e6cc95" /><stop offset=".7" stopColor="#c09445" /><stop offset="1" stopColor="#8c6414" /></linearGradient>}
          {used.has('goldTop') && <linearGradient id={id('goldTop')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff9e8" /><stop offset="1" stopColor="#e6cc95" /></linearGradient>}
          {used.has('goldDark') && <linearGradient id={id('goldDark')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c09445" /><stop offset="1" stopColor="#5c410c" /></linearGradient>}
          {used.has('paper') && <linearGradient id={id('paper')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffdf6" /><stop offset="1" stopColor="#efe1bf" /></linearGradient>}
          {used.has('paperTop') && <linearGradient id={id('paperTop')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#f3e8cd" /></linearGradient>}
          {used.has('paperSide') && <linearGradient id={id('paperSide')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e2cfa3" /><stop offset="1" stopColor="#c9b27c" /></linearGradient>}
          {used.has('ink') && <linearGradient id={id('ink')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b2b2b" /><stop offset="1" stopColor="#0b0b0b" /></linearGradient>}
          {used.has('inkSide') && <linearGradient id={id('inkSide')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a3a3a" /><stop offset="1" stopColor="#151515" /></linearGradient>}
          {used.has('inkTop') && <linearGradient id={id('inkTop')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5a5a5a" /><stop offset="1" stopColor="#2a2a2a" /></linearGradient>}
          {used.has('glow') && <radialGradient id={id('glow')} cx=".5" cy=".55" r=".6"><stop offset="0" stopColor="#fffbe6" /><stop offset=".55" stopColor="#ffd86b" /><stop offset="1" stopColor="#e39a2a" /></radialGradient>}
          {!lite && <filter id={id('sh')} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2.2" stdDeviation="1.6" floodColor="#031a14" floodOpacity=".55" /></filter>}
          <clipPath id={id('clip')}><rect x="2" y="2" width="60" height="60" rx="17" /></clipPath>
        </defs>
        <g className="i3d__tile">
          <rect x="2" y="2" width="60" height="60" rx="17" fill={tone('tile')} />
          <g clipPath={`url(#${id('clip')})`}>
            {!lite && <path d={khatam(32, 32, 30)} fill="none" stroke="#fff" strokeOpacity=".07" strokeWidth="1.2" />}
            {!lite && <path d={khatam(32, 32, 19)} fill="none" stroke="#fff" strokeOpacity=".05" strokeWidth="1" />}
            <rect x="2" y="2" width="60" height="30" fill={tone('hi')} />
            <ellipse cx="32" cy="66" rx="34" ry="12" fill="#000" opacity=".22" />
          </g>
          <rect x="2.6" y="2.6" width="58.8" height="58.8" rx="16.4" fill="none" stroke={tone('rim')} strokeWidth="1.1" />
        </g>
        <g className="i3d__g">
          {g ? (
            <g filter={lite ? undefined : `url(#${id('sh')})`}>
              {depth.length > 0 && (
                <g transform="translate(0 1.8)" className="i3d__depth">
                  {depth.map((p, i) => <path key={i} d={p.d} fillRule={p.rule} fill={p.t ? '#5c410c' : 'none'} stroke={p.s ? '#5c410c' : undefined} strokeWidth={p.w} strokeLinecap="round" />)}
                </g>
              )}
              {g.parts.map((p, i) => (p.text
                ? <text key={i} x={p.x} y={p.y} textAnchor="middle" fontSize={p.fs} fontWeight="700" fill={tone(p.t)} fontFamily="'Amiri','Noto Naskh Arabic','Times New Roman',serif">{p.text}</text>
                : <path key={i} d={p.d} fillRule={p.rule} fill={p.t ? tone(p.t) : 'none'} stroke={p.s ? strokeOf(p.s) : undefined} strokeWidth={p.w} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </g>
          ) : (
            <foreignObject x="16" y="16" width="32" height="32"><Icon name={name} size={32} className="i3d__fallback" /></foreignObject>
          )}
        </g>
      </svg>
    </span>
  )
}
