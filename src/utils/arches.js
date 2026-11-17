// ═══════════════════════════════════════════════════════
// İslam memarlığında tağlar — saf həndəsə (components/ArchBuilder.jsx üçün)
//
// Koordinatlar riyazi: y yuxarı, dabanlar (tağın başlandığı nöqtələr) y = 0
// xəttində, (−a, 0) və (a, 0); a = aşırım / 2. Hər qövs saat əqrəbinin əksinə
// (a0 < a1) gedir; tağın daxili əyrisi (intrados) sağ dabandan sol dabana
// ardıcıl qövslərdir. Hər element (mərkəz, xətt, qövs) hansı addımda
// göründüyünü `step` ilə bildirir.
//
// Qurulmalar (pərgar və xətkeşlə):
//  1) Nal tağ (Kordova): mərkəz dabanlar xəttindən h = a/√3 yuxarıda, r = 2a/√3,
//     yəni tağ yarımdairəni radiusun yarısı qədər aşır (Gómez-Moreno-nun
//     Kordova xəlifəlik tağları üçün verdiyi nisbət; Vestqot tağları — ⅓);
//     qövs 240°.
//  2) Bərabərtərəfli sivri tağ: mərkəzlər dabanların özündə, r = aşırım;
//     dabanlar və təpə bərabərtərəfli üçbucaq qurur.
//  3) Dördmərkəzli «fars» tağı (panc-o-haft ailəsi): alt mərkəzlər aşırımın
//     dörddə bir nöqtələrində, r₁ = aşırım/4, alt qövslər 45°; yuxarı mərkəzlər
//     alt mərkəzdən 45° qövsün ucuna çəkilən xəttin davamında, dabanlar
//     xəttindən aşağıda, oxun o tayında aşırım/8 məsafədə — qövslər bitişmə
//     nöqtəsində toxunandır (ortaq normal), təpədə sivri.
//  4) Çoxləçəkli tağ: radiusu a olan yarımdairə n bərabər hissəyə bölünür;
//     hər vətərin ortası ləçəyin mərkəzi, vətərin yarısı radiusu; ləçəklər
//     xaricə qabarır, bölgü nöqtələri içəri baxan çıxıntılar (sivri dişlər) olur.
//  5) Osmanlı «pencî» kemeri: aşırım 5 bərabər hissəyə bölünür, mərkəzlər orta
//     hissənin uclarında (oxdan aşırım/10), r = 0,6·aşırım — azca sivri tağ.
// ═══════════════════════════════════════════════════════

export const ARCH_TYPES = ['horseshoe', 'pointed', 'persian', 'multifoil', 'ottoman']
export const FOILS = 7
const TAU = Math.PI * 2

export const arcPoint = (arc, th) => [arc.cx + arc.r * Math.cos(th), arc.cy + arc.r * Math.sin(th)]
/** Qövs boyunca (a0 → a1) vahid toxunan */
export const arcTangent = (th) => [-Math.sin(th), Math.cos(th)]
export const arcStart = (arc) => arcPoint(arc, arc.a0)
export const arcEnd = (arc) => arcPoint(arc, arc.a1)
export const arcSweep = (arc) => arc.a1 - arc.a0

const mk = (id, cx, cy, r, a0, a1, step) => ({ id, cx, cy, r, a0, a1, step })
/** Ox (x = 0) ətrafında güzgü əksi; istiqamət saxlanır (yenə a0 < a1) */
export const mirrorArc = (arc, id) => mk(id, -arc.cx, arc.cy, arc.r, Math.PI - arc.a1, Math.PI - arc.a0, arc.step)

/** İki mərkəzli sivri tağ: mərkəzlər (±c, 0) */
function twoCentred(a, c, steps) {
  const r = a + c
  const top = Math.acos(c / r)
  const right = mk('a0', -c, 0, r, 0, top, steps.right)
  const left = mk('a1', c, 0, r, Math.PI - top, Math.PI, steps.left)
  return { arcs: [right, left], apex: arcEnd(right), r }
}

/**
 * Tağı qur. span — aşırım (istənilən vahid). Qaytarır: qövslər, köməkçi
 * qövslər/xətlər, mərkəzlər, nöqtələr, addım sayı, voussoir sayı, qalınlıq.
 */
export function buildArch(type, span) {
  const a = span / 2
  const d = 0.24 * a // daş qatının qalınlığı
  const B = [a, 0], A = [-a, 0]
  const g = { type, span, a, d, arcs: [], guides: [], lines: [], centres: [], marks: [], steps: 4, voussoirs: 15, apex: null }
  const spanLine = { id: 'span', from: A, to: B, step: 0, kind: 'span' }
  g.lines.push(spanLine)
  g.marks.push({ id: 'A', p: A, step: 0, label: 'A' }, { id: 'B', p: B, step: 0, label: 'B' })

  if (type === 'horseshoe') {
    const h = a / Math.sqrt(3), r = 2 * a / Math.sqrt(3)
    const th0 = -Math.atan2(h, a)
    g.arcs.push(mk('a0', 0, h, r, th0, Math.PI - th0, 2))
    g.centres.push({ id: 'O', p: [0, h], step: 1, label: 'O' })
    g.lines.push(
      { id: 'axis', from: [0, -0.15 * a], to: [0, h + r + 0.1 * a], step: 1, kind: 'guide' },
      { id: 'dia', from: [-r, h], to: [r, h], step: 1, kind: 'guide' },
      { id: 'rA', from: [0, h], to: A, step: 1, kind: 'radius' },
      { id: 'rB', from: [0, h], to: B, step: 1, kind: 'radius' },
    )
    g.apex = [0, h + r]
    g.steps = 4
    g.voussoirs = 19
    g.alfiz = { x0: -(r + d) - 0.08 * a, x1: r + d + 0.08 * a, y0: 0, y1: h + r + d + 0.08 * a, step: 3 }
  } else if (type === 'pointed' || type === 'ottoman') {
    const ott = type === 'ottoman'
    const c = ott ? span / 10 : a
    const s = { right: 2, left: 3 }
    const { arcs, apex } = twoCentred(a, c, s)
    g.arcs.push(...arcs)
    g.apex = apex
    // bərabərtərəflidə mərkəzlər dabanların özüdür (A, B yazısı artıq var)
    g.centres.push({ id: 'C1', p: [-c, 0], step: 1, label: ott ? 'M₁' : null }, { id: 'C2', p: [c, 0], step: 1, label: ott ? 'M₂' : null })
    if (ott) {
      for (let k = 1; k < 5; k++) g.marks.push({ id: `t${k}`, p: [-a + k * span / 5, 0], step: 0, tick: true })
    }
    g.lines.push(
      { id: 'r1', from: [-c, 0], to: B, step: 1, kind: 'radius' },
      { id: 'r2', from: [c, 0], to: A, step: 1, kind: 'radius' },
      { id: 'q1', from: [-c, 0], to: apex, step: 3, kind: 'radius' },
      { id: 'q2', from: [c, 0], to: apex, step: 3, kind: 'radius' },
    )
    g.marks.push({ id: 'C', p: apex, step: 3, label: 'C' })
    g.steps = 5
    g.voussoirs = 16
  } else if (type === 'persian') {
    const c = a / 2, r1 = a / 2, beta = Math.PI / 4
    const O1 = [c, 0]
    const E = arcPoint({ cx: c, cy: 0, r: r1 }, beta)
    const ox = -a / 4
    const t = (c - ox) / Math.cos(beta)
    const O3 = [c - t * Math.cos(beta), -t * Math.sin(beta)]
    const R2 = r1 + t
    const top = Math.acos(-O3[0] / R2)
    const lowR = mk('a0', c, 0, r1, 0, beta, 1)
    const upR = mk('a1', O3[0], O3[1], R2, beta, top, 3)
    g.arcs.push(lowR, upR, mirrorArc(upR, 'a2'), mirrorArc(lowR, 'a3'))
    g.apex = arcEnd(upR)
    for (let k = 1; k < 4; k++) g.marks.push({ id: `t${k}`, p: [-a + k * span / 4, 0], step: 0, tick: true })
    g.centres.push(
      { id: 'O1', p: O1, step: 1, label: 'O₁' }, { id: 'O2', p: [-c, 0], step: 1, label: 'O₂' },
      { id: 'O3', p: O3, step: 2, label: 'O₃' }, { id: 'O4', p: [-O3[0], O3[1]], step: 2, label: 'O₄' },
    )
    g.marks.push({ id: 'E1', p: E, step: 1 }, { id: 'E2', p: [-E[0], E[1]], step: 1 }, { id: 'C', p: g.apex, step: 3, label: 'C' })
    g.lines.push(
      { id: 'e1', from: O1, to: E, step: 1, kind: 'radius' },
      { id: 'e2', from: [-c, 0], to: [-E[0], E[1]], step: 1, kind: 'radius' },
      { id: 'x1', from: E, to: O3, step: 2, kind: 'guide' },
      { id: 'x2', from: [-E[0], E[1]], to: [-O3[0], O3[1]], step: 2, kind: 'guide' },
      { id: 'q1', from: O3, to: g.apex, step: 3, kind: 'radius' },
      { id: 'q2', from: [-O3[0], O3[1]], to: g.apex, step: 3, kind: 'radius' },
    )
    g.steps = 5
    g.voussoirs = 16
  } else if (type === 'multifoil') {
    const n = FOILS
    const half = Math.PI / (2 * n)
    const rho = a * Math.sin(half)
    g.guides.push(mk('base', 0, 0, a, 0, Math.PI, 1))
    g.centres.push({ id: 'O', p: [0, 0], step: 1, label: 'O' })
    for (let k = 0; k < n; k++) {
      const mid = (2 * k + 1) * half
      const m = [a * Math.cos(half) * Math.cos(mid), a * Math.cos(half) * Math.sin(mid)]
      g.arcs.push(mk(`a${k}`, m[0], m[1], rho, mid - Math.PI / 2, mid + Math.PI / 2, 3))
      g.centres.push({ id: `M${k}`, p: m, step: 2, small: true })
      if (k > 0) {
        const D = [a * Math.cos(2 * k * half), a * Math.sin(2 * k * half)]
        g.marks.push({ id: `D${k}`, p: D, step: 2 })
        g.lines.push({ id: `od${k}`, from: [0, 0], to: D, step: 2, kind: 'guide' })
      }
    }
    g.apex = [0, a * Math.cos(half) + rho]
    g.foil = { n, rho, rc: a * Math.cos(half) }
    g.steps = 5
    g.voussoirs = 15
  } else {
    throw new Error(`unknown arch type ${type}`)
  }
  g.vStep = g.steps - 1
  return g
}

/** Qövsün SVG yolu (y aşağı çevrilir); frac — çəkilmiş hissə (0…1) */
export function arcPath(arc, frac = 1, move = true) {
  const f = Math.max(0, Math.min(1, frac))
  const end = arc.a0 + f * arcSweep(arc)
  const p0 = arcStart(arc), p1 = arcPoint(arc, end)
  const large = f * arcSweep(arc) > Math.PI ? 1 : 0
  const n = (v) => +v.toFixed(2)
  const head = move ? `M${n(p0[0])} ${n(-p0[1])}` : ''
  return `${head}A${n(arc.r)} ${n(arc.r)} 0 ${large} 0 ${n(p1[0])} ${n(-p1[1])}`
}

/** Bütün daxili əyri bir yol kimi */
export function intradosPath(g) {
  return g.arcs.map((arc, i) => arcPath(arc, 1, i === 0)).join('')
}

/** İki çevrənin kəsişməsi — `near` nöqtəsinə ən yaxını */
function circleX(c1, r1, c2, r2, near) {
  const dx = c2[0] - c1[0], dy = c2[1] - c1[1], D = Math.hypot(dx, dy)
  const l = (r1 * r1 - r2 * r2 + D * D) / (2 * D)
  const h = Math.sqrt(Math.max(0, r1 * r1 - l * l))
  const mx = c1[0] + (l * dx) / D, my = c1[1] + (l * dy) / D
  const p = [mx - (h * dy) / D, my + (h * dx) / D], q = [mx + (h * dy) / D, my - (h * dx) / D]
  return Math.hypot(p[0] - near[0], p[1] - near[1]) <= Math.hypot(q[0] - near[0], q[1] - near[1]) ? p : q
}
const norm = (th) => ((th % TAU) + TAU) % TAU
/** θ-nı [lo − π, lo + π) aralığına gətir */
const near = (th, ref) => ref + norm(th - ref + Math.PI) - Math.PI

/**
 * Bitişmə nöqtəsində toxunanlar arasındakı bucaq (radian). 0 — hamar (toxunan),
 * > 0 — künc (sivri təpə, ləçək dişi).
 */
export function joinAngle(arcL, arcR) {
  const t1 = arcTangent(arcL.a1), t2 = arcTangent(arcR.a0)
  return Math.acos(Math.max(-1, Math.min(1, t1[0] * t2[0] + t1[1] * t2[1])))
}

/** Xarici əyri (extrados): eyni mərkəzli, r + d qövslər; künclərdə kəsişməyə qədər */
export function extradosArcs(g) {
  const ext = g.arcs.map(arc => ({ ...arc, r: arc.r + g.d }))
  for (let i = 0; i + 1 < g.arcs.length; i++) {
    if (joinAngle(g.arcs[i], g.arcs[i + 1]) < 1e-6) continue
    const P = arcEnd(g.arcs[i])
    const nP = [P[0] + (P[0] - g.arcs[i].cx) / g.arcs[i].r * g.d, P[1] + (P[1] - g.arcs[i].cy) / g.arcs[i].r * g.d]
    const X = circleX([ext[i].cx, ext[i].cy], ext[i].r, [ext[i + 1].cx, ext[i + 1].cy], ext[i + 1].r, nP)
    ext[i].a1 = near(Math.atan2(X[1] - ext[i].cy, X[0] - ext[i].cx), ext[i].a1)
    ext[i + 1].a0 = near(Math.atan2(X[1] - ext[i + 1].cy, X[0] - ext[i + 1].cx), ext[i + 1].a0)
  }
  return ext
}

/** Çoxləçəkli tağın daxili əyrisi: O-dan φ bucağı ilə çıxan şüa üzərində məsafə */
export function foilRadius(g, phi) {
  const { n, rho, rc } = g.foil
  const k = Math.max(0, Math.min(n - 1, Math.floor(phi / (Math.PI / n))))
  const mid = (2 * k + 1) * Math.PI / (2 * n)
  const proj = rc * Math.cos(phi - mid)
  return proj + Math.sqrt(Math.max(0, proj * proj - rc * rc + rho * rho))
}

/**
 * Daşlar (voussoir) — çoxbucaqlılar (riyazi koordinat). Qövslü tağlarda
 * daxili əyri bərabər uzunluqlu hissələrə bölünür, oynaqlar əyriyə
 * perpendikulyardır (qövsün mərkəzinə doğru); çoxləçəklidə oynaqlar O-dan radial.
 */
export function voussoirs(g, count = g.voussoirs) {
  const out = []
  if (g.foil) {
    const Re = g.foil.rc + g.foil.rho + g.d
    const cusps = Array.from({ length: g.foil.n - 1 }, (_, k) => (k + 1) * Math.PI / g.foil.n)
    for (let j = 0; j < count; j++) {
      const p0 = (j * Math.PI) / count, p1 = ((j + 1) * Math.PI) / count
      const phis = []
      for (let s = 0; s <= 8; s++) phis.push(p0 + ((p1 - p0) * s) / 8)
      cusps.forEach(c => { if (c > p0 && c < p1) phis.push(c) })
      phis.sort((x, y) => x - y)
      const inner = phis.map(f => { const r = foilRadius(g, f); return [r * Math.cos(f), r * Math.sin(f)] })
      const outer = phis.slice().reverse().map(f => [Re * Math.cos(f), Re * Math.sin(f)])
      out.push([...inner, ...outer])
    }
    return out
  }
  const ext = extradosArcs(g)
  const lens = g.arcs.map(arc => arc.r * arcSweep(arc))
  const L = lens.reduce((s, x) => s + x, 0)
  // s uzunluğundakı (qövs, bucaq)
  const at = (s) => {
    let acc = 0
    for (let i = 0; i < g.arcs.length; i++) {
      if (s <= acc + lens[i] + 1e-9 || i === g.arcs.length - 1) {
        const f = Math.max(0, Math.min(1, (s - acc) / lens[i]))
        return { i, th: g.arcs[i].a0 + f * arcSweep(g.arcs[i]) }
      }
      acc += lens[i]
    }
    return null
  }
  const starts = []
  let acc = 0
  lens.forEach(l => { starts.push(acc); acc += l })
  // oynaq radialdır; künc (sivri təpə) ucunda xarici əyri oxda birləşdiyi nöqtəyə gedir
  const extTh = ({ i, th }) => {
    const arc = g.arcs[i], e = ext[i]
    if (th >= arc.a1 - 1e-12) return e.a1
    if (th <= arc.a0 + 1e-12) return e.a0
    return Math.max(e.a0, Math.min(e.a1, th))
  }
  const outerOf = (pts) => {
    const res = []
    pts.forEach((p, k) => {
      const th = extTh(p)
      if (k > 0 && pts[k - 1].i === p.i) {
        const prev = extTh(pts[k - 1])
        for (let s = 1; s < 4; s++) res.push(arcPoint(ext[p.i], prev + ((th - prev) * s) / 4))
      }
      res.push(arcPoint(ext[p.i], th))
    })
    return res.reverse()
  }
  for (let j = 0; j < count; j++) {
    const s0 = (j * L) / count, s1 = ((j + 1) * L) / count
    const samples = []
    for (let s = 0; s <= 6; s++) samples.push({ s: s0 + ((s1 - s0) * s) / 6 })
    const pts = samples.map(({ s }) => at(s))
    // daşın başlanğıcı qövsün tam sonundadırsa, növbəti qövsün başlanğıcı kimi götür
    const f0 = pts[0]
    if (f0.i < g.arcs.length - 1 && f0.th >= g.arcs[f0.i].a1 - 1e-12) pts[0] = { i: f0.i + 1, th: g.arcs[f0.i + 1].a0 }
    // qövs sərhədləri bu daşın içindədirsə hər iki tərəfi əlavə et (künc saxlanır)
    starts.forEach((st, i) => {
      if (i > 0 && st > s0 + 1e-9 && st < s1 - 1e-9) {
        const k = pts.findIndex(p => p.i >= i)
        pts.splice(k < 0 ? pts.length : k, 0, { i: i - 1, th: g.arcs[i - 1].a1 }, { i, th: g.arcs[i].a0 })
      }
    })
    const inner = pts.map(p => arcPoint(g.arcs[p.i], p.th))
    out.push([...inner, ...outerOf(pts)])
  }
  return out
}

/** Çoxbucaqlı → SVG yolu (y çevrilir) */
export const polyPath = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${(-p[1]).toFixed(2)}`).join('') + 'Z'

/** Tağın ən yuxarı nöqtəsi (çərçivə üçün), xarici qat daxil */
export function archExtent(g) {
  let top = 0, half = g.a
  if (g.foil) return { top: g.foil.rc + g.foil.rho + g.d, half: g.foil.rc + g.foil.rho + g.d }
  extradosArcs(g).forEach(e => {
    for (let s = 0; s <= 24; s++) {
      const p = arcPoint(e, e.a0 + (arcSweep(e) * s) / 24)
      top = Math.max(top, p[1]); half = Math.max(half, Math.abs(p[0]))
    }
  })
  return { top, half }
}
