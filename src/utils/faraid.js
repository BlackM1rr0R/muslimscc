// ═══════════════════════════════════════════════════════
// MİRAS (FƏRAİZ) HESABI — saf hesablama mühərriki (React yoxdur)
//
// Əsas: Quran 4:11, 4:12, 4:176 və Sünnə; sabit paylar (fərz), əsəbə,
// həcb (məhrumetmə), övl və rədd çoxluğun tətbiq etdiyi kimi.
// Mübahisəli məsələlərdə seçilən görüşlər (hər biri nəticədə qeyd kimi göstərilir):
//  • Baba (atanın atası) qardaş-bacıları ata kimi məhrum edir — Əbu Bəkr əs-Siddiq,
//    İbn Abbas (Buxari, "Babanın ata və qardaşlarla mirası" babı, 6737–6738-dən əvvəl);
//    İbn Teymiyyə, İbn əl-Qayyim, İbn Baz və İbn Useymin bunu seçib.
//  • Müştərəkə (himariyyə): Hənbəli görüşü — şərikləşmə yoxdur; ana-bir qardaşlar 1/3
//    alır, ata-ana bir qardaşlara heç nə qalmırsa, heç nə almırlar.
//  • Öməriyyətan: ər/arvad + ata + ana (övlad yoxdur, qardaş-bacı ikidən az) — ana
//    qalanın 1/3-ni alır (Ömər, Zeyd, İbn Məsud; dörd məzhəb).
//  • Atanın anası oğlu (ata) ilə birlikdə də varis olur — Hənbəli məzhəbi (Ömər,
//    İbn Məsud; İbn Teymiyyə seçib). Çoxluq onu ata ilə məhrum sayır — qeyddə deyilir.
//  • Rədd ər/arvaddan başqa fərz sahiblərinə qaytarılır.
// Bütün paylar dəqiq kəsrlə (BigInt) hesablanır — cəm tam 1-ə bərabərdir.
// ═══════════════════════════════════════════════════════

// ── Kəsr köməkçisi ──
const babs = (a) => (a < 0n ? -a : a)
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a || 1n }

export class Fraction {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d)
    if (d === 0n) throw new Error('Fraction: zero denominator')
    if (d < 0n) { n = -n; d = -d }
    const g = bgcd(n, d)
    this.n = n / g
    this.d = d / g
  }
  static of(n, d = 1) { return new Fraction(n, d) }
  add(o) { return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d) }
  sub(o) { return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d) }
  mul(o) { return typeof o === 'object' ? new Fraction(this.n * o.n, this.d * o.d) : new Fraction(this.n * BigInt(o), this.d) }
  div(o) { return typeof o === 'object' ? new Fraction(this.n * o.d, this.d * o.n) : new Fraction(this.n, this.d * BigInt(o)) }
  cmp(o) { const x = this.n * o.d - o.n * this.d; return x > 0n ? 1 : x < 0n ? -1 : 0 }
  isZero() { return this.n === 0n }
  toNumber() { return Number(this.n) / Number(this.d) }
  toString() { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}` }
}
const F = (n, d = 1) => new Fraction(n, d)
const ZERO = F(0)
const ONE = F(1)
const sum = (list) => list.reduce((a, b) => a.add(b), ZERO)

// Varislərin sırası (nəticə cədvəli də bu sıradadır)
export const HEIR_KEYS = [
  'husband', 'wife',
  'father', 'mother', 'paternalGrandfather', 'paternalGrandmother', 'maternalGrandmother',
  'sons', 'daughters', 'sonsSons', 'sonsDaughters',
  'fullBrothers', 'fullSisters', 'paternalBrothers', 'paternalSisters',
  'maternalBrothers', 'maternalSisters',
  'fullNephews', 'paternalNephews', 'fullUncles', 'paternalUncles', 'fullCousins', 'paternalCousins',
]

// Hər varisin ən çox sayı (tək şəxslər 1, arvad 4)
export const HEIR_MAX = {
  husband: 1, wife: 4, father: 1, mother: 1,
  paternalGrandfather: 1, paternalGrandmother: 1, maternalGrandmother: 1,
}

// Ölənin cinsinə görə mümkün olmayan varislər
export function heirAllowed(key, deceased) {
  if (key === 'husband') return deceased === 'female'
  if (key === 'wife') return deceased === 'male'
  return true
}

const MALE_KEYS = new Set(['husband', 'father', 'paternalGrandfather', 'sons', 'sonsSons',
  'fullBrothers', 'paternalBrothers', 'maternalBrothers',
  'fullNephews', 'paternalNephews', 'fullUncles', 'paternalUncles', 'fullCousins', 'paternalCousins'])
export const isMaleHeir = (key) => MALE_KEYS.has(key)

const toCount = (v, max = 99) => {
  const x = Math.floor(Number(v))
  if (!Number.isFinite(x) || x <= 0) return 0
  return Math.min(x, max)
}
const toMoney = (v) => {
  const x = Number(v)
  return Number.isFinite(x) && x > 0 ? x : 0
}

/**
 * Mirası bölür.
 * @returns {{ net:number, gross:number, wasiyyah:number, wasiyyahCapped:boolean,
 *   shares: Array<{heir, count, fraction, fractionEach, fard, portionEach, total, type, reasonKey}>,
 *   awl:boolean, radd:boolean, unallocated:string, notes:string[] }}
 */
export function calculateInheritance(input = {}) {
  const deceased = input.deceased === 'female' ? 'female' : 'male'
  const raw = input.heirs || {}
  const h = {}
  for (const k of HEIR_KEYS) {
    h[k] = heirAllowed(k, deceased) ? toCount(raw[k], HEIR_MAX[k] || 99) : 0
  }
  if (typeof raw.husband === 'boolean') h.husband = deceased === 'female' && raw.husband ? 1 : 0
  for (const k of ['father', 'mother', 'paternalGrandfather', 'paternalGrandmother', 'maternalGrandmother']) {
    if (typeof raw[k] === 'boolean') h[k] = raw[k] ? 1 : 0
  }

  // ── Mal: kəfən-dəfn → borc → vəsiyyət (qalanın 1/3-dən çox deyil) ──
  const estate = toMoney(input.estate)
  const funeral = toMoney(input.funeral)
  const debts = toMoney(input.debts)
  const afterDebts = Math.max(estate - funeral - debts, 0)
  const wasiyyahAsked = toMoney(input.wasiyyah)
  const wasiyyahMax = afterDebts / 3
  const wasiyyah = Math.min(wasiyyahAsked, wasiyyahMax)
  const wasiyyahCapped = wasiyyahAsked > wasiyyahMax + 1e-9
  const net = Math.max(afterDebts - wasiyyah, 0)

  const notes = []
  if (estate > 0 && funeral + debts >= estate) notes.push('debtsExceed')
  if (wasiyyahCapped) notes.push('wasiyyahCapped')

  // ── Ümumi göstəricilər ──
  const maleDesc = h.sons + h.sonsSons > 0
  const femaleDesc = h.daughters + h.sonsDaughters > 0
  const anyDesc = maleDesc || femaleDesc
  const siblingsCount = h.fullBrothers + h.fullSisters + h.paternalBrothers + h.paternalSisters
    + h.maternalBrothers + h.maternalSisters
  const father = h.father > 0
  const grandfather = !father && h.paternalGrandfather > 0

  // Nəticə sətirləri: { heir, count, fard (Fraction|null), kind, reasonKey, weight }
  const rows = {}
  const blocked = (heir, reasonKey) => { rows[heir] = { heir, count: h[heir], type: 'blocked', reasonKey, fard: null } }
  const fard = (heir, fr, reasonKey) => { rows[heir] = { heir, count: h[heir], type: 'fard', fard: fr, reasonKey } }

  // ── 1. Ər-arvad ──
  if (h.husband) fard('husband', anyDesc ? F(1, 4) : F(1, 2), anyDesc ? 'spouseWithChild' : 'spouseNoChild')
  if (h.wife) fard('wife', anyDesc ? F(1, 8) : F(1, 4), anyDesc ? 'spouseWithChild' : 'spouseNoChild')
  const spouseKey = h.husband ? 'husband' : h.wife ? 'wife' : null

  // ── 2. Övladlar ──
  if (h.daughters && !h.sons) {
    fard('daughters', h.daughters === 1 ? F(1, 2) : F(2, 3), h.daughters === 1 ? 'daughterOne' : 'daughtersMany')
  }
  // Oğul nəvələri
  if (h.sonsSons && h.sons) blocked('sonsSons', 'blockedBySon')
  if (h.sonsDaughters) {
    if (h.sons) blocked('sonsDaughters', 'blockedBySon')
    else if (!h.sonsSons) {
      if (h.daughters >= 2) blocked('sonsDaughters', 'blockedByTwoDaughters')
      else if (h.daughters === 1) fard('sonsDaughters', F(1, 6), 'sonsDaughterTakmila')
      else fard('sonsDaughters', h.sonsDaughters === 1 ? F(1, 2) : F(2, 3), h.sonsDaughters === 1 ? 'daughterOne' : 'daughtersMany')
    }
  }

  // ── 3. Ata və baba ──
  if (father) {
    if (maleDesc) fard('father', F(1, 6), 'fatherWithSon')
    else if (femaleDesc) fard('father', F(1, 6), 'fatherWithDaughter') // + qalan (əsəbə)
  }
  if (h.paternalGrandfather) {
    if (father) blocked('paternalGrandfather', 'blockedByFather')
    else if (maleDesc) fard('paternalGrandfather', F(1, 6), 'fatherWithSon')
    else if (femaleDesc) fard('paternalGrandfather', F(1, 6), 'fatherWithDaughter')
  }

  // ── 4. Ana ──
  const umariyyah = father && h.mother && spouseKey && !anyDesc && siblingsCount < 2
  if (h.mother) {
    if (anyDesc) fard('mother', F(1, 6), 'motherWithChild')
    else if (siblingsCount >= 2) fard('mother', F(1, 6), 'motherWithSiblings')
    else if (umariyyah) {
      const spouseShare = rows[spouseKey].fard
      fard('mother', ONE.sub(spouseShare).mul(F(1, 3)), 'umariyyah')
      notes.push('umariyyah')
    } else fard('mother', F(1, 3), 'motherThird')
  }

  // ── 5. Nənələr (birlikdə 1/6, bərabər) ──
  const grannies = []
  if (h.maternalGrandmother) {
    if (h.mother) blocked('maternalGrandmother', 'blockedByMother')
    else grannies.push('maternalGrandmother')
  }
  if (h.paternalGrandmother) {
    if (h.mother) blocked('paternalGrandmother', 'blockedByMother')
    else {
      grannies.push('paternalGrandmother')
      if (father) notes.push('grandmotherWithFather')
    }
  }
  for (const g of grannies) fard(g, F(1, 6).div(grannies.length), grannies.length > 1 ? 'grandmothersShare' : 'grandmotherSixth')

  // ── 6. Ana-bir qardaş-bacılar ──
  const matCount = h.maternalBrothers + h.maternalSisters
  if (matCount) {
    let why = null
    if (anyDesc) why = 'blockedByDescendant'
    else if (father) why = 'blockedByFather'
    else if (grandfather) why = 'blockedByGrandfather'
    for (const k of ['maternalBrothers', 'maternalSisters']) {
      if (!h[k]) continue
      if (why) blocked(k, why)
      // Kişi və qadın bərabər: hər nəfərə eyni pay
      else fard(k, (matCount === 1 ? F(1, 6) : F(1, 3)).mul(h[k]).div(matCount), matCount === 1 ? 'maternalOne' : 'maternalShareThird')
    }
  }

  // ── 7. Ata-ana bir və ata-bir qardaş-bacılar ──
  const sibBlock = h.sons ? 'blockedBySon' : h.sonsSons ? 'blockedBySonsSon'
    : father ? 'blockedByFather' : grandfather ? 'blockedByGrandfather' : null
  if (grandfather && (h.fullBrothers + h.fullSisters + h.paternalBrothers + h.paternalSisters + matCount) > 0) {
    notes.push('grandfatherSiblings')
  }

  // Ata-ana bir bacı(lar) qızlarla birgə əsəbədirmi (əsəbə məəl-ğayr)?
  const fullSisterWithGhayr = !sibBlock && h.fullSisters && !h.fullBrothers && femaleDesc
  const fullSistersFard = !sibBlock && h.fullSisters && !h.fullBrothers && !femaleDesc
  if (h.fullSisters && fullSistersFard) {
    fard('fullSisters', h.fullSisters === 1 ? F(1, 2) : F(2, 3), h.fullSisters === 1 ? 'sisterOne' : 'sistersMany')
  }
  for (const k of ['fullBrothers', 'fullSisters']) if (h[k] && sibBlock) blocked(k, sibBlock)

  // Ata-bir
  const patBlock = sibBlock || (h.fullBrothers ? 'blockedByFullBrother'
    : fullSisterWithGhayr ? 'blockedByFullSisterAsabah' : null)
  if (h.paternalBrothers && patBlock) blocked('paternalBrothers', patBlock)
  let patSisterWithGhayr = false
  if (h.paternalSisters) {
    if (patBlock) blocked('paternalSisters', patBlock)
    else if (!h.paternalBrothers) {
      if (h.fullSisters >= 2) blocked('paternalSisters', 'blockedByTwoFullSisters')
      else if (h.fullSisters === 1) fard('paternalSisters', F(1, 6), 'paternalSisterTakmila')
      else if (femaleDesc) patSisterWithGhayr = true
      else fard('paternalSisters', h.paternalSisters === 1 ? F(1, 2) : F(2, 3), h.paternalSisters === 1 ? 'sisterOne' : 'sistersMany')
    }
  }

  // ── 8. Əsəbə: qalan ən yaxın kişi qohuma (yanında bacı/qız varsa 2:1) ──
  // Hər mərhələ: [kişi açar, qadın açar (bil-ğayr), məəl-ğayr qadın?]
  const asabahOrder = [
    { m: 'sons', f: 'daughters' },
    { m: 'sonsSons', f: 'sonsDaughters' },
    { m: 'father', self: father },
    { m: 'paternalGrandfather', self: grandfather },
    { m: 'fullBrothers', f: 'fullSisters' },
    { f: 'fullSisters', withGhayr: fullSisterWithGhayr },
    { m: 'paternalBrothers', f: 'paternalSisters' },
    { f: 'paternalSisters', withGhayr: patSisterWithGhayr },
    { m: 'fullNephews' }, { m: 'paternalNephews' }, { m: 'fullUncles' },
    { m: 'paternalUncles' }, { m: 'fullCousins' }, { m: 'paternalCousins' },
  ]
  let asabah = null // { members: [{key, weight}] }
  for (const step of asabahOrder) {
    if (step.withGhayr) { asabah = { members: [{ key: step.f, weight: 1 }], reason: 'sisterWithDaughters' }; break }
    if (!step.m || !h[step.m]) continue
    if (rows[step.m]?.type === 'blocked') continue
    if (step.self === false) continue
    const members = [{ key: step.m, weight: 2 }]
    // Qadın yoldaş: kişi ilə birgə əsəbə (fərz payı varsa ləğv olunur)
    if (step.f && h[step.f] && rows[step.f]?.type !== 'blocked') {
      // Oğul nəvəsi: qızlar fərz alıbsa (oğul yoxdur), oğul qızları qardaşları ilə qalanı bölür
      members.push({ key: step.f, weight: 1 })
    }
    asabah = { members, reason: step.m === 'sons' || step.m === 'sonsSons' ? 'asabahChildren'
      : (step.m === 'fullBrothers' || step.m === 'paternalBrothers') && members.length > 1 ? 'asabahSiblings' : 'asabahSelf' }
    break
  }
  // Əsəbə olan qadın yoldaşların fərz sətrini sil (onlar əsəbə ilə alır)
  if (asabah) for (const mem of asabah.members) {
    if (rows[mem.key]?.type === 'fard' && mem.key !== 'father' && mem.key !== 'paternalGrandfather') delete rows[mem.key]
  }

  // Qalan əsəbə namizədləri (qardaşoğlu, əmi, əmioğlu …) — daha yaxın əsəbə ilə məhrum
  const asabahKeys = new Set(asabah ? asabah.members.map(x => x.key) : [])
  for (const k of HEIR_KEYS) {
    if (h[k] && !rows[k] && !asabahKeys.has(k)) {
      blocked(k, 'blockedByNearer')
      rows[k].blockedBy = asabah ? asabah.members[0].key : null
    }
  }

  // ── 9. Fərz cəmi, övl, əsəbə, rədd ──
  const fardRows = Object.values(rows).filter(r => r.type === 'fard')
  const fardSum = sum(fardRows.map(r => r.fard))
  const final = {} // heir -> Fraction (bütün qrup üçün)
  let awl = false, radd = false, unallocated = ZERO

  if (fardSum.cmp(ONE) > 0) {
    awl = true
    for (const r of fardRows) final[r.heir] = r.fard.mul(F(fardSum.d, fardSum.n))
    notes.push('awl')
  } else {
    for (const r of fardRows) final[r.heir] = r.fard
  }
  const remainder = awl ? ZERO : ONE.sub(fardSum)

  if (asabah) {
    const units = asabah.members.reduce((a, m) => a + m.weight * h[m.key], 0)
    for (const m of asabah.members) {
      const part = remainder.mul(m.weight * h[m.key]).div(units)
      final[m.key] = (final[m.key] || ZERO).add(part)
    }
    if (remainder.isZero()) {
      for (const m of asabah.members) if (!rows[m.key] || rows[m.key].type !== 'fard') {
        rows[m.key] = { heir: m.key, count: h[m.key], type: 'asabah', fard: null, reasonKey: 'noRemainder' }
      }
      const mushtarakah = (h.husband && (h.mother || grannies.length) && h.maternalBrothers + h.maternalSisters >= 2
        && asabah.members[0].key === 'fullBrothers')
      if (mushtarakah) notes.push('mushtarakah')
    }
    for (const m of asabah.members) {
      if (rows[m.key]?.type === 'fard') { rows[m.key].type = 'fard+asabah'; rows[m.key].reasonKey = 'fatherWithDaughter' }
      else if (!rows[m.key]) rows[m.key] = { heir: m.key, count: h[m.key], type: 'asabah', fard: null,
        reasonKey: asabah.reason === 'sisterWithDaughters' ? 'sisterWithDaughters' : asabah.reason }
    }
  } else if (!awl && remainder.cmp(ZERO) > 0) {
    const raddRows = fardRows.filter(r => r.heir !== 'husband' && r.heir !== 'wife')
    if (raddRows.length) {
      radd = true
      notes.push('radd')
      const spouseShare = spouseKey ? rows[spouseKey].fard : ZERO
      const raddBase = sum(raddRows.map(r => r.fard))
      const pool = ONE.sub(spouseShare)
      for (const r of raddRows) final[r.heir] = pool.mul(r.fard).div(raddBase)
    } else {
      unallocated = remainder
      notes.push(fardRows.length ? 'remainderNoHeirs' : 'noHeirs')
    }
  } else if (!fardRows.length) {
    unallocated = ONE
    notes.push('noHeirs')
  }

  // ── 10. Nəticə ──
  const shares = []
  for (const key of HEIR_KEYS) {
    const r = rows[key]
    if (!r || !h[key]) continue
    const total = r.type === 'blocked' ? ZERO : (final[key] || ZERO)
    const each = total.div(h[key])
    const type = r.type === 'fard+asabah' ? 'fard' : r.type
    shares.push({
      heir: key,
      count: h[key],
      type,
      asabah: r.type === 'fard+asabah' || r.type === 'asabah',
      fard: r.fard ? r.fard.toString() : null,
      fraction: total.toString(),
      fractionEach: each.toString(),
      portionEach: net * each.toNumber(),
      total: net * total.toNumber(),
      reasonKey: r.reasonKey,
      blockedBy: r.blockedBy || null,
    })
  }

  return {
    gross: estate, net, wasiyyah, wasiyyahCapped,
    shares, awl, radd,
    unallocated: unallocated.toString(),
    notes: [...new Set(notes)],
  }
}

/** Kəsrlərin cəmi (yoxlama və test üçün) */
export function sumFractions(list) {
  return sum(list.map(s => {
    const [n, d = '1'] = String(s).split('/')
    return F(n, d)
  })).toString()
}
