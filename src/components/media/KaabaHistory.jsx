// ═══════════════════════════════════════════════════════
// KaabaHistory — "Kəbənin tarixi: zaman səyahəti" (/holy-places)
//
//   <KaabaHistory lang="az" />
//
// • Altı mərhələ (data/kaabaHistory.js): İbrahim və İsmail → Qüreyş → İbn əz-Zubeyr → əl-Həccac →
//   1630 seli və IV Murad → 1996 bərpası. Hər faktın mənbəsi göstərilir (Quran — saytın nəşri,
//   hədis — saytın hədis kitabxanasına keçid, tarix — adı çəkilən əsər).
// • Səhnə yüngül SVG-dir (three.js YOX — Kaaba3D artıq Məscidül-Haramın 3D modelidir; burada iki sxem
//   kifayətdir): yuxarıdan plan (Hicr, İbrahimin bünövrə xətti, qapılar, Həcərül-Əsvəd küncü) və qapı
//   divarının önündən görünüş (hündürlük zira ilə, dam, qapının yeri). Ölçülər yalnız mənbədəki rəqəmlərdir;
//   qalan hər şey sxematikdir. Canlı varlıq təsviri yoxdur.
// • Mərhələ dəyişəndə forma ~0.6 s-də keçir (requestAnimationFrame); hərəkət azaldılıbsa — dərhal.
// • Əlçatanlıq: role="tablist" (← → Home End; RTL-də oxlar tərsinə), panel aria-labelledby, SVG-lər
//   role="img" + mətnli təsvir, formanın xülasəsi mətn kimi də var.
// • Ayə: /data/kaaba-ayah/<dil>.json (scripts/build-kaaba-ayah.mjs) — yalnız mount-dan sonra yüklənir.
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { pickUi, uiDictLang } from '../../utils/uiText'
import { localizeSource } from '../../utils/sourceNames'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import { getSurahLocal } from '../../data/surahNamesAz'
import { useReduced } from '../../motion/reduced'
import { KAABA_STAGES, CUBIT_NOTE } from '../../data/kaabaHistory'
import './KaabaHistory.css'

const T = {
  az: {
    ey: 'Tarix', title: 'Kəbənin tarixi — zaman səyahəti', lead: 'Kəbə neçə dəfə yenidən tikilib və forması necə dəyişib? Mərhələni seçin — sxem dəyişir, altında hər faktın mənbəsi var.',
    stages: 'Mərhələlər', prev: 'Əvvəlki', next: 'Növbəti', step: (i, n) => `${n} mərhələdən ${i}-ci`,
    plan: 'Yuxarıdan plan', elev: 'Qapı divarının önündən', facts: 'Faktlar və mənbələr', src: 'Mənbə', read: 'Hədisi oxu',
    height: 'Hündürlük', hijr: 'Hicr (Hətim)', hijrIn: 'qismən binanın içində', hijrOut: 'binadan kənarda', roof: 'Dam', roofYes: 'var', roofNo: 'yox',
    doors: 'Qapılar', doorsNone: 'mənbədə göstərilmir', doorsEast: 'bir qapı, yerdən yuxarıda', doorsTwo: 'iki qapı (şərq və qərb), yerlə bərabər',
    lg: { stone: 'Həcərül-Əsvəd küncü', door: 'Qapı', hijr: 'Hicrin divarı', found: 'İbrahimin bünövrəsi (təxmini)', water: 'Sel' },
    north: 'Ş', cubits: 'zira', schematic: 'Sxematik təsvir: tərəflərin nisbəti təxminidir, yalnız mənbədə verilən rəqəmlər (zira) miqyasla çəkilib.',
    planLabel: (s) => `Plan: ${s}`, elevLabel: (s) => `Önündən görünüş: ${s}`,
    ayah: 'Ayə', trBy: (b) => `Tərcümə: ${b}`, ayahErr: 'Ayənin mətni yüklənmədi.',
  },
  en: {
    ey: 'History', title: 'History of the Kaaba — a journey through time', lead: 'How many times has the Kaaba been rebuilt, and how did its shape change? Pick a stage — the drawing changes, and every fact below shows its source.',
    stages: 'Stages', prev: 'Previous', next: 'Next', step: (i, n) => `Stage ${i} of ${n}`,
    plan: 'Plan from above', elev: 'View of the door wall', facts: 'Facts and sources', src: 'Source', read: 'Read the hadith',
    height: 'Height', hijr: 'Hijr (Hatim)', hijrIn: 'partly inside the building', hijrOut: 'outside the building', roof: 'Roof', roofYes: 'yes', roofNo: 'no',
    doors: 'Doors', doorsNone: 'not given in the sources', doorsEast: 'one door, above ground level', doorsTwo: 'two doors (east and west), at ground level',
    lg: { stone: 'Black Stone corner', door: 'Door', hijr: 'Hijr wall', found: 'Ibrahim’s foundations (approx.)', water: 'Flood' },
    north: 'N', cubits: 'cubits', schematic: 'Schematic drawing: the proportions of the sides are approximate; only the figures given in the sources (in cubits) are drawn to scale.',
    planLabel: (s) => `Plan: ${s}`, elevLabel: (s) => `Front view: ${s}`,
    ayah: 'Verse', trBy: (b) => `Translation: ${b}`, ayahErr: 'The verse text could not be loaded.',
  },
  ru: {
    ey: 'История', title: 'История Каабы — путешествие во времени', lead: 'Сколько раз перестраивали Каабу и как менялась её форма? Выберите этап — схема изменится, а под ней у каждого факта указан источник.',
    stages: 'Этапы', prev: 'Назад', next: 'Далее', step: (i, n) => `Этап ${i} из ${n}`,
    plan: 'План сверху', elev: 'Вид на стену с дверью', facts: 'Факты и источники', src: 'Источник', read: 'Читать хадис',
    height: 'Высота', hijr: 'Хиджр (Хатим)', hijrIn: 'частично внутри здания', hijrOut: 'вне здания', roof: 'Крыша', roofYes: 'есть', roofNo: 'нет',
    doors: 'Двери', doorsNone: 'в источниках не указаны', doorsEast: 'одна дверь, выше уровня земли', doorsTwo: 'две двери (восток и запад), вровень с землёй',
    lg: { stone: 'Угол Чёрного камня', door: 'Дверь', hijr: 'Стена Хиджра', found: 'Основания Ибрахима (примерно)', water: 'Наводнение' },
    north: 'С', cubits: 'локтей', schematic: 'Схема: соотношение сторон приблизительное; в масштабе нарисованы только числа из источников (в локтях).',
    planLabel: (s) => `План: ${s}`, elevLabel: (s) => `Вид спереди: ${s}`,
    ayah: 'Аят', trBy: (b) => `Перевод: ${b}`, ayahErr: 'Не удалось загрузить текст аята.',
  },
  tr: {
    ey: 'Tarih', title: 'Kâbe’nin tarihi — zamanda yolculuk', lead: 'Kâbe kaç kez yeniden yapıldı ve biçimi nasıl değişti? Bir aşama seçin — çizim değişir, altında her bilginin kaynağı yer alır.',
    stages: 'Aşamalar', prev: 'Önceki', next: 'Sonraki', step: (i, n) => `${n} aşamadan ${i}.`,
    plan: 'Yukarıdan plan', elev: 'Kapı duvarının önünden', facts: 'Bilgiler ve kaynaklar', src: 'Kaynak', read: 'Hadisi oku',
    height: 'Yükseklik', hijr: 'Hicr (Hatîm)', hijrIn: 'kısmen binanın içinde', hijrOut: 'binanın dışında', roof: 'Çatı', roofYes: 'var', roofNo: 'yok',
    doors: 'Kapılar', doorsNone: 'kaynaklarda belirtilmiyor', doorsEast: 'bir kapı, yerden yukarıda', doorsTwo: 'iki kapı (doğu ve batı), yerle bir seviyede',
    lg: { stone: 'Hacerü’l-Esved köşesi', door: 'Kapı', hijr: 'Hicr duvarı', found: 'İbrahim’in temelleri (yaklaşık)', water: 'Sel' },
    north: 'K', cubits: 'zira', schematic: 'Şematik çizim: kenarların oranı yaklaşıktır; yalnızca kaynaklarda verilen sayılar (zira) ölçekli çizilmiştir.',
    planLabel: (s) => `Plan: ${s}`, elevLabel: (s) => `Önden görünüm: ${s}`,
    ayah: 'Ayet', trBy: (b) => `Meal: ${b}`, ayahErr: 'Ayetin metni yüklenemedi.',
  },
  ar: {
    ey: 'التاريخ', title: 'تاريخ الكعبة — رحلة عبر الزمن', lead: 'كم مرة أُعيد بناء الكعبة، وكيف تغيّر شكلها؟ اختر مرحلة فيتغيّر الرسم، وتحته مصدر كل معلومة.',
    stages: 'المراحل', prev: 'السابق', next: 'التالي', step: (i, n) => `المرحلة ${i} من ${n}`,
    plan: 'مخطط من الأعلى', elev: 'منظر جدار الباب', facts: 'معلومات ومصادر', src: 'المصدر', read: 'اقرأ الحديث',
    height: 'الارتفاع', hijr: 'الحِجر (الحطيم)', hijrIn: 'جزء منه داخل البناء', hijrOut: 'خارج البناء', roof: 'السقف', roofYes: 'نعم', roofNo: 'لا',
    doors: 'الأبواب', doorsNone: 'لم تذكرها المصادر هنا', doorsEast: 'باب واحد مرتفع عن الأرض', doorsTwo: 'بابان (شرقي وغربي) لاصقان بالأرض',
    lg: { stone: 'ركن الحجر الأسود', door: 'الباب', hijr: 'جدار الحِجر', found: 'قواعد إبراهيم (تقريبًا)', water: 'السيل' },
    north: 'ش', cubits: 'ذراعًا', schematic: 'رسم تخطيطي: نِسَب الأضلاع تقريبية، ولم يُرسم بالمقياس إلا الأرقام الواردة في المصادر (بالذراع).',
    planLabel: (s) => `المخطط: ${s}`, elevLabel: (s) => `المنظر الأمامي: ${s}`,
    ayah: 'الآية', trBy: (b) => `الترجمة: ${b}`, ayahErr: 'تعذّر تحميل نص الآية.',
  },
}

// Sxemin ölçüləri (zira): qapı divarı (ŞmŞ) 24, Hicr divarı (ŞmQ) 20 — sxematik; Hicrdən əlavə ~6 (Buxari 1586)
const NE = 24, NW = 20, EXT = 6
const shapeVals = (s) => ({
  ext: s.hijr ? EXT : 0,
  h: s.h,
  roof: s.roof ? 1 : 0,
  lift: s.doors === 'east-raised' ? 4 : 0,
  door: s.doors === 'none' ? 0 : 1,
  west: s.doors === 'two-ground' ? 1 : 0,
  // Hicrin ayrıca divarı yalnız Hicr binadan kənarda olanda çəkilir (Qüreyşdən sonra)
  wall: s.hijr ? 0 : 1,
})
const lerp = (a, b, k) => {
  const o = {}
  for (const key of Object.keys(a)) o[key] = a[key] + (b[key] - a[key]) * k
  return o
}
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)

const ayahCache = new Map()
function loadAyah(f) {
  if (!ayahCache.has(f)) {
    ayahCache.set(f, fetch(`/data/kaaba-ayah/${f}.json`).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .catch(e => { ayahCache.delete(f); throw e }))
  }
  return ayahCache.get(f)
}

/** Yuxarıdan plan: sağda qapı divarı (ŞmŞ), yuxarıda Hicr tərəfi (ŞmQ), sağ-aşağı künc — Həcərül-Əsvəd */
function PlanSvg({ v, flood, t, label }) {
  const k = 6, bottom = 262, x0 = 92, w = NW * k
  const top = bottom - (NE + v.ext) * k
  const foundTop = bottom - (NE + EXT) * k
  // Hicr divarı: binadan bir az aralı yarımdairə (iki ucunda keçid)
  const hijrBase = top - 4
  const hx1 = x0 + 6, hx2 = x0 + w - 6
  const hry = Math.max(24, 15 * k - v.ext * k)
  const doorY = bottom - 7 * k
  return (
    <svg viewBox="0 0 300 290" role="img" aria-label={label} className="kh__svg">
      <rect x="0" y="0" width="300" height="290" rx="14" className="kh__ground" />
      {flood && <rect x="0" y="0" width="300" height="290" rx="14" className="kh__water" />}
      {/* İbrahimin bünövrə xətti (təxmini) */}
      <rect x={x0} y={foundTop} width={w} height={(NE + EXT) * k} className="kh__found" />
      {/* Hicrin divarı */}
      <path d={`M${hx1} ${hijrBase} C ${hx1} ${hijrBase - hry * 1.3}, ${hx2} ${hijrBase - hry * 1.3}, ${hx2} ${hijrBase}`} className="kh__hijr" opacity={v.wall} />
      {/* Bina */}
      <rect x={x0} y={top} width={w} height={(NE + v.ext) * k} rx="1.5" className="kh__body" />
      {/* Qapılar */}
      <rect x={x0 + w - 3} y={doorY} width="6" height={4 * k} rx="1" className="kh__door" opacity={v.door} />
      <rect x={x0 - 3} y={doorY} width="6" height={4 * k} rx="1" className="kh__door" opacity={v.west} />
      {/* Həcərül-Əsvəd küncü */}
      <circle cx={x0 + w} cy={bottom} r="5" className="kh__stone" />
      {/* Şimal oxu (Kəbənin küncləri təxminən dünya tərəflərinə baxır) */}
      <g transform="translate(262 40) rotate(45)" className="kh__north" aria-hidden="true">
        <path d="M0 -14 L5 4 L0 0 L-5 4 Z" />
      </g>
      <text x="262" y="68" textAnchor="middle" className="kh__nlabel" aria-hidden="true">{t.north}</text>
    </svg>
  )
}

/** Qapı divarının önündən görünüş: solda Həcərül-Əsvəd küncü, sağda Hicr tərəfi; hündürlük zira miqyası ilə */
function ElevSvg({ v, flood, t, label, hLabel }) {
  const k = 5, ground = 196, x0 = 64
  const w = (NE + v.ext) * k
  const h = v.h * k
  const topY = ground - h
  const ticks = [0, 5, 10, 15, 20, 25, 30]
  const doorX = x0 + 3 * k, doorW = 4 * k, doorH = 6 * k
  const doorBottom = ground - v.lift * k
  const hijrX = x0 + w + 8
  return (
    <svg viewBox="0 0 300 220" role="img" aria-label={label} className="kh__svg">
      <rect x="0" y="0" width="300" height="220" rx="14" className="kh__sky" />
      {/* Miqyas (zira) */}
      <g className="kh__ruler" aria-hidden="true">
        <line x1="34" x2="34" y1={ground} y2={ground - 30 * k} />
        {ticks.map(c => (
          <g key={c}>
            <line x1="30" x2="38" y1={ground - c * k} y2={ground - c * k} />
            <text x="26" y={ground - c * k + 3} textAnchor="end">{c}</text>
          </g>
        ))}
      </g>
      <rect x="0" y={ground} width="300" height={220 - ground} className="kh__floor" />
      {/* Hicrin alçaq divarı */}
      <rect x={hijrX} y={ground - 2.6 * k} width={Math.max(0, 288 - hijrX)} height={2.6 * k} rx="2" className="kh__hijrwall" opacity={v.wall} />
      {/* Bina */}
      <rect x={x0} y={topY} width={w} height={h} className="kh__body" />
      <g className="kh__courses" aria-hidden="true">
        {Array.from({ length: Math.floor(v.h / 3) }, (_, i) => (
          <line key={i} x1={x0} x2={x0 + w} y1={ground - (i + 1) * 3 * k} y2={ground - (i + 1) * 3 * k} />
        ))}
      </g>
      {/* Dam: varsa düz xətt və parapet, yoxdursa — açıq (qırıq xətt) */}
      <line x1={x0} x2={x0 + w} y1={topY} y2={topY} className="kh__roof" opacity={v.roof} />
      <line x1={x0} x2={x0 + w} y1={topY} y2={topY} className="kh__open" opacity={1 - v.roof} />
      {/* Qapı */}
      <rect x={doorX} y={doorBottom - doorH} width={doorW} height={doorH} rx="1.5" className="kh__door" opacity={v.door} />
      {/* Həcərül-Əsvəd küncü */}
      <circle cx={x0 + 2} cy={ground - 3 * k} r="4.5" className="kh__stone" />
      {/* Hündürlük yazısı */}
      <text x={x0 + w / 2} y={Math.max(14, topY - 8)} textAnchor="middle" className="kh__hlabel">{hLabel}</text>
      {flood && <path d={`M0 ${ground - 14} q 15 -6 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 V 220 H 0 Z`} className="kh__flood" />}
      <text x={292} y={ground + 16} textAnchor="end" className="kh__unit" aria-hidden="true">{t.cubits}</text>
    </svg>
  )
}

function SourceChip({ src, lang, t, onNav }) {
  const L = (o) => (typeof o === 'string' ? o : pickUi(o, lang, 'en'))
  if (src.kind === 'hadith') {
    const href = `${pathFor('hadithbooks', lang)}#${src.book}/${src.sec}/${src.n}`
    return (
      <a href={href} className="kh__src kh__src--link" onClick={(e) => onNav(e, href)} data-testid="kh-hadith-link">
        <Icon name="hadithbooks" size={14} /> <span>{localizeSource(src.label, lang)}</span>
        <span className="ui-sr-only"> — {t.read}</span>
      </a>
    )
  }
  if (src.kind === 'quran') return <span className="kh__src"><Icon name="quran" size={14} /> {localizeSource(src.label, lang)}</span>
  return <span className="kh__src"><Icon name="books" size={14} /> {L(src.label)}</span>
}

export default function KaabaHistory({ lang = 'az' }) {
  const t = pickUi(T, lang, 'en')
  const L = (o) => pickUi(o, lang, 'en')
  const navigate = useNavigate()
  const reduced = useReduced()
  const uid = useId().replace(/:/g, '')
  const [idx, setIdx] = useState(0)
  const [v, setV] = useState(() => shapeVals(KAABA_STAGES[0].shape))
  const vRef = useRef(v)
  const tabsRef = useRef([])
  const [ayah, setAyah] = useState(null)
  const [ayahErr, setAyahErr] = useState(false)
  const stage = KAABA_STAGES[idx]
  const n = KAABA_STAGES.length
  const rtl = lang === 'ar'

  // Forma keçidi (rAF); hərəkət azaldılıbsa — dərhal
  useEffect(() => {
    const target = shapeVals(KAABA_STAGES[idx].shape)
    const from = vRef.current
    if (reduced || typeof requestAnimationFrame !== 'function') { vRef.current = target; setV(target); return undefined }
    let raf = 0
    const t0 = performance.now(), dur = 620
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur)
      const cur = lerp(from, target, ease(p))
      vRef.current = cur
      setV(cur)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [idx, reduced])

  // Ayə — yalnız mount-dan sonra (əlavə dildə həmin dilin tərcüməsi)
  useEffect(() => {
    let alive = true
    const f = (lang === 'en' && uiDictLang()) || lang
    loadAyah(f).catch(() => loadAyah('en')).then(d => { if (alive) { setAyah(d); setAyahErr(false) } }).catch(() => { if (alive) setAyahErr(true) })
    return () => { alive = false }
  }, [lang])

  const go = (i, focus = false) => {
    const j = (i + n) % n
    setIdx(j)
    if (focus) tabsRef.current[j]?.focus()
  }
  const onTabKey = (e) => {
    const fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (e.key === fwd) { e.preventDefault(); go(idx + 1, true) }
    else if (e.key === back) { e.preventDefault(); go(idx - 1, true) }
    else if (e.key === 'Home') { e.preventDefault(); go(0, true) }
    else if (e.key === 'End') { e.preventDefault(); go(n - 1, true) }
  }
  const onNav = (e, href) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(href)
    window.scrollTo(0, 0)
  }

  const s = stage.shape
  const hLabel = L(s.hLabel)
  const hijrTxt = s.hijr ? t.hijrIn : t.hijrOut
  const doorsTxt = s.doors === 'two-ground' ? t.doorsTwo : s.doors === 'east-raised' ? t.doorsEast : t.doorsNone
  const roofTxt = s.roof ? t.roofYes : t.roofNo
  const summary = `${t.height}: ${hLabel}; ${t.hijr}: ${hijrTxt}; ${t.doors}: ${doorsTxt}; ${t.roof}: ${roofTxt}`
  const ref = stage.ayah
  const ayahAr = ref && ayah?.ar?.[ref]
  const ayahTr = ref && lang !== 'ar' && ayah?.tr?.[ref]
  const [sn, an] = ref ? ref.split(':').map(Number) : [0, 0]
  const surah = ref ? (getSurahLocal(sn, lang)?.name || '') : ''

  return (
    <section className="ui-card kh" data-testid="kaaba-history" data-stage={stage.id} aria-labelledby={`${uid}-title`}>
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id={`${uid}-title`} className="kh__title">{t.title}</h2>
      <p className="kh__lead">{t.lead}</p>

      <div className="kh__tabs" role="tablist" aria-label={t.stages} onKeyDown={onTabKey}>
        {KAABA_STAGES.map((st, i) => (
          <button key={st.id} ref={(el) => { tabsRef.current[i] = el }} type="button" role="tab" id={`${uid}-tab-${st.id}`}
            aria-selected={i === idx} aria-controls={`${uid}-panel`} tabIndex={i === idx ? 0 : -1}
            className="kh__tab" data-stage={st.id} onClick={() => go(i)}>
            <span className="kh__tabn ui-num" aria-hidden="true">{i + 1}</span>
            <span className="kh__tabt">{L(st.title)}</span>
          </button>
        ))}
      </div>

      <div className="kh__panel" role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${stage.id}`}>
        <div className="kh__head" aria-live="polite">
          <p className="kh__era">{L(stage.era)}</p>
          <h3 className="kh__stitle">{L(stage.title)}</h3>
          <p className="kh__step ui-num">{t.step(idx + 1, n)}</p>
        </div>

        <div className="kh__scene">
          <figure className="kh__fig">
            <figcaption>{t.plan}</figcaption>
            <PlanSvg v={v} flood={!!stage.flood} t={t} label={t.planLabel(summary)} />
          </figure>
          <figure className="kh__fig">
            <figcaption>{t.elev}</figcaption>
            <ElevSvg v={v} flood={!!stage.flood} t={t} label={t.elevLabel(summary)} hLabel={hLabel} />
          </figure>
        </div>
        <ul className="kh__legend" aria-hidden="true">
          <li><i className="kh__sw kh__sw--stone" /> {t.lg.stone}</li>
          <li><i className="kh__sw kh__sw--door" /> {t.lg.door}</li>
          <li><i className="kh__sw kh__sw--hijr" /> {t.lg.hijr}</li>
          <li><i className="kh__sw kh__sw--found" /> {t.lg.found}</li>
          {stage.flood && <li><i className="kh__sw kh__sw--water" /> {t.lg.water}</li>}
        </ul>

        <dl className="kh__sum" data-testid="kh-summary">
          <div><dt>{t.height}</dt><dd className="ui-num">{hLabel}</dd></div>
          <div><dt>{t.hijr}</dt><dd>{hijrTxt}</dd></div>
          <div><dt>{t.doors}</dt><dd>{doorsTxt}</dd></div>
          <div><dt>{t.roof}</dt><dd>{roofTxt}</dd></div>
        </dl>

        {ref && (
          <blockquote className="kh__ayah" data-testid="kh-ayah">
            <p className="kh__ayah-h">{t.ayah} · <span className="ui-num">{surah ? `${surah} ` : ''}{sn}:{an}</span></p>
            {ayahAr && <p className="ui-arabic kh__ar" lang="ar" dir="rtl">{ayahAr}</p>}
            {ayahTr && <p className="kh__tr">{ayahTr}</p>}
            {ayahTr && ayah?.by && <p className="kh__by">{t.trBy(ayah.by)}</p>}
            {ayahErr && !ayahAr && <p className="kh__by">{t.ayahErr}</p>}
          </blockquote>
        )}

        <h4 className="kh__fh">{t.facts}</h4>
        <ol className="kh__facts">
          {stage.facts.map((f, i) => (
            <li key={i} className="kh__fact" data-testid="kh-fact">
              <p>{L(f.text)}</p>
              <p className="kh__srcs"><span className="kh__srcl">{t.src}:</span> {f.source.map((src, j) => <SourceChip key={j} src={src} lang={lang} t={t} onNav={onNav} />)}</p>
            </li>
          ))}
        </ol>

        <div className="kh__nav">
          <button type="button" className="ui-btn ui-btn--ghost" onClick={() => go(idx - 1)} data-testid="kh-prev">
            <Icon name="chevronLeft" size={16} className="ui-flip-rtl" /> {t.prev}
          </button>
          <button type="button" className="ui-btn ui-btn--primary" onClick={() => go(idx + 1)} data-testid="kh-next">
            {t.next} <Icon name="chevron" size={16} className="ui-flip-rtl" />
          </button>
        </div>
      </div>

      <p className="kh__note"><Icon name="ruler" size={14} /> {t.schematic} {L(CUBIT_NOTE.text)} <span className="kh__src">{L(CUBIT_NOTE.source[0].label)}</span></p>
    </section>
  )
}
