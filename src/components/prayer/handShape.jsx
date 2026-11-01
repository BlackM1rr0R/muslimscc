// ═══════════════════════════════════════════════════════
// Əl forması — namaz və dəstəmaz təsvirlərində ortaq (öz çəkilmiş SVG)
//
// Stilizə olunmuş, amma tanınan əl: ovuc, dörd barmaq, baş barmaq; arxadan
// baxışda dırnaqlar, ovucdan baxışda ovuc xətləri. Baş/üz/bədən çəkilmir —
// yalnız əl və (istəsən) qolun sxematik "qolluğu" (biləkdən aşağı).
//
// Yerli koordinatlar: biləyin ortası (0,0), barmaqlar yuxarı (−y), SAĞ əlin
// ARXASI görünür → baş barmaq solda (−x). Sol əl və ya ovuc tərəfi — güzgü.
// rot: dərəcə, saat əqrəbi istiqamətində (0 = barmaqlar yuxarı).
// Rənglər: PrayerGuidePage.css (.hd-*), --pp-hand tokenləri.
// ═══════════════════════════════════════════════════════

const PALM = 'M -17 0 C -24 -8 -28 -26 -27 -44 C -26.5 -54 -22 -60 -14 -61 L 13 -61 C 22 -60 27 -54 27 -46 C 27 -28 23 -10 17 0 Z'
const E = 1.7 // kontur qalınlığı (hər tərəfə)

// Barmaq kökləri: [x, y, en, uzunluq]
const F = {
  index: [-17.5, -55, 12.5, 43],
  middle: [-5, -58, 13, 48],
  ring: [7.5, -57, 12, 44],
  little: [19, -51, 10.5, 34],
}
const ORDER = ['little', 'ring', 'middle', 'index']

// Əl formaları: a — barmaq bucaqları; curl — uc buğumun əyilməsi;
// thumb — [x, y, en, uzunluq, bucaq, əyilmə]; fold — yığılmış barmaqlar
const SHAPES = {
  // barmaqlar bitişik, düz (təkbir, səcdə, budda açıq ovuc)
  flat: { a: { index: -3, middle: 0, ring: 2.5, little: 6 }, thumb: [-22, -20, 14.5, 36, -26, 4] },
  // barmaqlar aralı (rüku — dizləri tutur)
  spread: { a: { index: -15, middle: -4, ring: 7, little: 19 }, thumb: [-22, -20, 14.5, 36, -50, 10] },
  // qiyam — sol biləyi tutan sağ əl: barmaqlar bitişik, uclar bükülü
  hold: { a: { index: -2, middle: 0, ring: 2, little: 5 }, curl: 28, thumb: [-22, -20, 14.5, 34, -34, 18] },
  // təşəhhüd — barmaqlar yığılıb, şəhadət barmağı işarə edir
  point: { a: { index: -2, middle: 1, ring: 3, little: 7 }, fold: ['middle', 'ring', 'little'], thumb: [-21, -24, 14, 28, -6, 0] },
}

const rad = (d) => (d * Math.PI) / 180
const r1 = (n) => Math.round(n * 10) / 10

// İki buğumlu barmaq xətti: kök → orta buğum → uc
function seg(bx, by, a, len, curl = 0) {
  const l1 = len * 0.56
  const l2 = len - l1
  const mx = bx + Math.sin(rad(a)) * l1
  const my = by - Math.cos(rad(a)) * l1
  const tx = mx + Math.sin(rad(a + curl)) * l2
  const ty = my - Math.cos(rad(a + curl)) * l2
  return { d: `M ${r1(bx)} ${r1(by)} L ${r1(mx)} ${r1(my)} L ${r1(tx)} ${r1(ty)}`, tx, ty, ux: Math.sin(rad(a + curl)), uy: -Math.cos(rad(a + curl)) }
}

// Dırnaq — ucdan bir az içəridə qısa açıq xətt
function nail(f) {
  const a = 3.2
  const b = 9.5
  return `M ${r1(f.tx - f.ux * b)} ${r1(f.ty - f.uy * b)} L ${r1(f.tx - f.ux * a)} ${r1(f.ty - f.uy * a)}`
}

/**
 * <Hand x y rot s side="R|L" view="back|palm" shape="flat|spread|hold|point" arm={0} />
 * arm — qolluğun uzunluğu (biləkdən aşağı, yerli +y); 0 — yoxdur.
 */
export function Hand({ x = 0, y = 0, rot = 0, s = 1, side = 'R', view = 'back', shape = 'flat', arm = 0, far = false, className = '' }) {
  const mirror = (side === 'L') !== (view === 'palm')
  const sh = SHAPES[shape] || SHAPES.flat
  const fingers = ORDER.map((k) => {
    const [bx, by, w, len] = F[k]
    const folded = !!sh.fold?.includes(k)
    return { k, w, folded, ...seg(bx, by, sh.a[k] ?? 0, folded ? 10 : len, folded ? 0 : (sh.curl || 0)) }
  })
  const [tx, ty, tw, tl, ta, tc] = sh.thumb
  const thumb = seg(tx, ty, ta, tl, tc)
  const palmFront = view === 'palm'
  const thumbEls = (
    <>
      <path d={thumb.d} className="hd-edge" strokeWidth={tw + E * 2} />
      <path d={thumb.d} className="hd-skin-s" strokeWidth={tw} />
      {!palmFront && <path d={nail(thumb)} className="hd-nail" strokeWidth={tw * 0.48} />}
    </>
  )
  return (
    <g className={`hd-hand ${far ? 'is-far' : ''} ${className}`} transform={`translate(${x} ${y}) rotate(${rot}) scale(${mirror ? -s : s} ${s})`}>
      {arm > 0 && (
        <path className="hd-arm" d={`M -19 -8 C -21 ${r1(arm * 0.4)} -24 ${r1(arm * 0.8)} -25 ${arm} L 25 ${arm} C 24 ${r1(arm * 0.8)} 21 ${r1(arm * 0.4)} 19 -8 Z`} />
      )}
      <path d={PALM} className="hd-edge" strokeWidth={E * 2} />
      {!palmFront && thumbEls}
      <path d={PALM} className="hd-skin" />
      {fingers.map(f => (
        <g key={f.k}>
          <path d={f.d} className="hd-edge" strokeWidth={f.w + E * 2} />
          <path d={f.d} className={f.folded ? 'hd-fold-s' : 'hd-skin-s'} strokeWidth={f.w} />
          {!palmFront && !f.folded && <path d={nail(f)} className="hd-nail" strokeWidth={f.w * 0.48} />}
        </g>
      ))}
      {/* barmaq köklərindəki kontur ovucun altında qalsın */}
      <path d={PALM} className="hd-skin" />
      {sh.fold && <path d="M -11 -58 C -2 -62 12 -60 24 -52" className="hd-crease" strokeWidth="1.4" />}
      {palmFront && (
        <>
          <path d="M -22 -36 C -10 -42 8 -44 24 -40" className="hd-crease" strokeWidth="1.3" />
          <path d="M -21 -22 C -12 -26 0 -34 4 -46" className="hd-crease" strokeWidth="1.3" />
          {thumbEls}
        </>
      )}
    </g>
  )
}
