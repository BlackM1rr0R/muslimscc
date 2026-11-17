// ═══════════════════════════════════════════════════════
// QuranLifeMosaic (vB) — "Ömürlük Quran mozaikası": oxuduğunuz hər ayə bir nur
//
//   <QuranLifeMosaic lang="az" surahName={n => '…'} hrefOf={(s, a) => '/quran?s=…'} onOpen={(s, a) => …} />
//   compact — /account üçün kiçik önizləmə (statistika + rozetlər, ətraflı mətn yoxdur)
//
// • 30 rozet — 30 cüz (data/juzMap — Quran.com cüz sərhədləri). Hər rozetdə cüzün ayələri
//   mərkəzdən çölə 8 qatlı simmetriya ilə (halqa k-da 8·k yer) düzülür — girih üslubu.
//   Cari xətmdə oxunanlar qızılı səkkizguşəli ulduz + işıq; əvvəlki xətmlərdə oxunub,
//   bu dövrdə hələ yox — sakit firuzəyi; oxunmayanlar — surəyə görə növbələşən solğun ton.
//   Hər tamamlanan xətm rozetlərin ətrafına halqa əlavə edir (ən çox 3 görünür).
// • Canvas: 6236 nöqtə rəngə görə qruplaşdırılıb hər qrup BİR fill() ilə çəkilir. Yalnız
//   məlumat / ölçü / seçim / mövzu dəyişəndə yenidən çəkilir (animasiya dövrü yoxdur).
// • Göstərici → ayə (yalnız həmin cüzün ayələri yoxlanır); klaviatura: ← → ayə, ↑ ↓ cüz,
//   Home/End, Enter — ayəni aç. Məlumat: utils/quranLife (quran_life_v1).
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { TOTAL, hasBit, lifeStats, refAt, idxOf } from '../../utils/quranLife'
import { SURAH_START } from '../../utils/quranMap'
import { JUZ_VERSES } from '../../data/juzMap'
import useLife from './useLife'
import '../../styles/QuranLifeMosaic.css'

const T = {
  az: {
    ey: 'Ömürlük Quran mozaikası', title: 'Oxuduğunuz hər ayə — bir nur',
    lead: 'Oxuyucuda ekranda 1,5 saniyə qalan və ya dinlədiyiniz ayələr, Mushafda 10 saniyə baxdığınız səhifələr burada qızılı yanır. 30 həndəsi naxış — 30 cüz; hər xətm naxışların ətrafına yeni halqa əlavə edir.',
    pct: 'Quranın oxunan hissəsi', ayahs: 'oxunan ayə', surahs: 'tam oxunan surə', khatms: 'xətm', round: 'Cari xətm',
    read: 'Oxunub', unread: 'Hələ oxunmayıb', prev: 'Əvvəlki xətmdə oxunub', ring: 'Hər xətm — bir halqa',
    hint: 'Nöqtəyə toxunun və ya üstünə gəlin; klaviaturada ox düymələri ilə gəzin', open: 'Ayəni aç', juz: 'cüz',
    isRead: 'oxunub', notRead: 'hələ oxunmayıb', first: 'surə ilk dəfə', last: 'son dəfə',
    sum: (n, p) => `Quranın 6236 ayəsi 30 naxışda: ${n} ayə oxunub (${p}%)`,
    khatmDone: 'Xətm tamamlandı! Şəhadətnaməniz «Xətm şəhadətnamələri» bölməsində hazırdır.', cert: 'Şəhadətnaməyə keç',
    note: 'Bu cihazda saxlanılır; hesaba daxil olsanız — bütün cihazlarınızda, ömürlük.', more: 'Mozaikanı Quran səhifəsində aç',
    empty: 'Hələ heç bir ayə qeyd olunmayıb — bir surə açıb oxuyun, nur burada yanacaq.',
  },
  en: {
    ey: 'Lifetime Quran mosaic', title: 'Every verse you read becomes a light',
    lead: 'Verses that stay on screen for 1.5 seconds in the reader or that you listen to, and Mushaf pages you view for 10 seconds, glow gold here. 30 rosettes for the 30 juz; each completed khatm adds a new ring around them.',
    pct: 'of the Quran read', ayahs: 'verses read', surahs: 'surahs read in full', khatms: 'khatms', round: 'Current khatm',
    read: 'Read', unread: 'Not read yet', prev: 'Read in an earlier khatm', ring: 'Each khatm adds a ring',
    hint: 'Tap or hover over a dot; on a keyboard, use the arrow keys', open: 'Open the verse', juz: 'juz',
    isRead: 'read', notRead: 'not read yet', first: 'surah first read', last: 'last read',
    sum: (n, p) => `The 6236 verses of the Quran in 30 rosettes: ${n} verses read (${p}%)`,
    khatmDone: 'Khatm completed! Your certificate is ready in the “Khatm certificates” section.', cert: 'Go to the certificate',
    note: 'Stored on this device; when you are signed in, on all your devices for a lifetime.', more: 'Open the mosaic on the Quran page',
    empty: 'No verses recorded yet. Open a surah and read, and the light will appear here.',
  },
  ru: {
    ey: 'Мозаика Корана на всю жизнь', title: 'Каждый прочитанный аят становится светом',
    lead: 'Аяты, которые в читалке были на экране 1,5 секунды или которые вы прослушали, и страницы мусхафа, открытые 10 секунд, светятся здесь золотом. 30 розеток — 30 джузов; каждый завершённый хатм добавляет к ним новое кольцо.',
    pct: 'Корана прочитано', ayahs: 'прочитанных аятов', surahs: 'сур прочитано полностью', khatms: 'хатмов', round: 'Текущий хатм',
    read: 'Прочитано', unread: 'Ещё не прочитано', prev: 'Прочитано в прошлом хатме', ring: 'Каждый хатм — новое кольцо',
    hint: 'Коснитесь точки или наведите на неё; на клавиатуре — стрелки', open: 'Открыть аят', juz: 'джуз',
    isRead: 'прочитан', notRead: 'ещё не прочитан', first: 'сура впервые', last: 'последний раз',
    sum: (n, p) => `6236 аятов Корана в 30 розетках: прочитано ${n} (${p}%)`,
    khatmDone: 'Хатм завершён! Ваш сертификат готов в разделе «Сертификаты хатма».', cert: 'Перейти к сертификату',
    note: 'Хранится на этом устройстве; если вы вошли в аккаунт, то на всех ваших устройствах навсегда.', more: 'Открыть мозаику на странице Корана',
    empty: 'Пока не отмечено ни одного аята. Откройте суру и читайте, и здесь появится свет.',
  },
  ar: {
    ey: 'فسيفساء القرآن مدى العمر', title: 'كل آية تقرؤها تصير نورًا',
    lead: 'الآيات التي تبقى على الشاشة ثانية ونصفًا في القارئ أو تستمع إليها، وصفحات المصحف التي تنظر فيها عشر ثوانٍ، تتوهّج هنا ذهبًا. ثلاثون وردة للأجزاء الثلاثين، وكل ختمة تضيف حولها حلقة جديدة.',
    pct: 'من القرآن مقروء', ayahs: 'آية مقروءة', surahs: 'سورة مقروءة كاملة', khatms: 'ختمة', round: 'الختمة الحالية',
    read: 'مقروءة', unread: 'لم تُقرأ بعد', prev: 'قُرئت في ختمة سابقة', ring: 'لكل ختمة حلقة',
    hint: 'المس نقطة أو مرّر فوقها؛ وبلوحة المفاتيح استعمل الأسهم', open: 'افتح الآية', juz: 'الجزء',
    isRead: 'مقروءة', notRead: 'لم تُقرأ بعد', first: 'أول قراءة للسورة', last: 'آخر قراءة',
    sum: (n, p) => `آيات القرآن الـ6236 في ثلاثين وردة: قُرئت ${n} آية (${p}%)`,
    khatmDone: 'تمّت الختمة! شهادتك جاهزة في قسم «شهادات الختم».', cert: 'انتقل إلى الشهادة',
    note: 'تُحفظ على هذا الجهاز؛ وإن سجّلت الدخول فعلى كل أجهزتك مدى العمر.', more: 'افتح الفسيفساء في صفحة القرآن',
    empty: 'لم تُسجَّل أي آية بعد. افتح سورة واقرأ فيضيء النور هنا.',
  },
  tr: {
    ey: 'Ömür boyu Kur’an mozaiği', title: 'Okuduğunuz her ayet bir nur olur',
    lead: 'Okuyucuda ekranda 1,5 saniye kalan ya da dinlediğiniz ayetler ve Mushaf’ta 10 saniye baktığınız sayfalar burada altın renginde parlar. 30 rozet 30 cüzü gösterir; her hatim rozetlere yeni bir halka ekler.',
    pct: 'Kur’an’ın okunan kısmı', ayahs: 'okunan ayet', surahs: 'tamamı okunan sure', khatms: 'hatim', round: 'Şimdiki hatim',
    read: 'Okundu', unread: 'Henüz okunmadı', prev: 'Önceki hatimde okundu', ring: 'Her hatim bir halka',
    hint: 'Bir noktaya dokunun veya üzerine gelin; klavyede ok tuşlarını kullanın', open: 'Ayeti aç', juz: 'cüz',
    isRead: 'okundu', notRead: 'henüz okunmadı', first: 'sure ilk kez', last: 'son kez',
    sum: (n, p) => `Kur’an’ın 6236 ayeti 30 rozette: ${n} ayet okundu (%${p})`,
    khatmDone: 'Hatim tamamlandı! Belgeniz «Hatim belgeleri» bölümünde hazır.', cert: 'Belgeye git',
    note: 'Bu cihazda saklanır; hesabınıza giriş yaptıysanız ömür boyu tüm cihazlarınızda.', more: 'Mozaiği Kur’an sayfasında aç',
    empty: 'Henüz hiçbir ayet kaydedilmedi. Bir sure açıp okuyun, nur burada belirecek.',
  },
}

// ── Sabit həndəsə (bir dəfə) ──
const JUZ_START = [...JUZ_VERSES.map(parts => idxOf(parts[0][0], parts[0][1])), TOTAL]
const SURAH_ODD = (() => { const o = new Uint8Array(TOTAL); SURAH_START.forEach((st, s) => { if (s % 2) o.fill(1, st, SURAH_START[s + 1] ?? TOTAL) }); return o })()
const JUZ_OF = (() => { const o = new Uint8Array(TOTAL); for (let j = 0; j < 30; j++) o.fill(j, JUZ_START[j], JUZ_START[j + 1]); return o })()
// Vahid rozet: hər ayənin [x, y] (−1…1) və cüzün halqa sayı K
const UNIT = new Float32Array(TOTAL * 2)
const RINGS = new Uint8Array(30)
for (let j = 0; j < 30; j++) {
  const a0 = JUZ_START[j], n = JUZ_START[j + 1] - a0
  let K = 0
  while (1 + 4 * K * (K + 1) < n) K++
  RINGS[j] = Math.max(1, K)
  let i = a0
  UNIT[i * 2] = 0; UNIT[i * 2 + 1] = 0; i++
  for (let k = 1; k <= K && i < a0 + n; k++) {
    const cnt = Math.min(8 * k, a0 + n - i)
    const off = -Math.PI / 2 + (k % 2 ? Math.PI / (8 * k) : 0)
    for (let q = 0; q < cnt; q++, i++) {
      const ang = off + (q * 2 * Math.PI) / cnt
      UNIT[i * 2] = (Math.cos(ang) * k) / RINGS[j]
      UNIT[i * 2 + 1] = (Math.sin(ang) * k) / RINGS[j]
    }
  }
}

const cssVar = (el, name, fb) => (getComputedStyle(el).getPropertyValue(name).trim() || fb)
const pctText = (x) => { const v = x * 100; return v > 0 && v < 0.1 ? '0.1' : v >= 99.95 && v < 100 ? '99.9' : v.toFixed(v >= 10 ? 0 : 1) }

function octagon(ctx, x, y, r) {
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py)
  }
  ctx.closePath()
}
function star8(ctx, x, y, r) {
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 8, rr = i % 2 ? r * 0.5 : r
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py)
  }
  ctx.closePath()
}

export default function QuranLifeMosaic({ lang = 'az', surahName = (s) => String(s), hrefOf, onOpen, compact = false, certHref, moreHref, onMore }) {
  const t = pickUi(T, lang, 'en')
  const life = useLife()
  const stats = useMemo(() => lifeStats(life), [life])
  const [sel, setSel] = useState(null)
  const [hover, setHover] = useState(null)
  const [theme, setTheme] = useState(0)
  const wrapRef = useRef(null), cvRef = useRef(null)
  const geo = useRef({ cols: 6, tile: 100, pos: new Float32Array(TOTAL * 2), dot: new Float32Array(30) })
  const rtl = lang === 'ar'

  // Mövzu (açıq/tünd) dəyişəndə rənglər yenidən oxunsun
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return undefined
    const mo = new MutationObserver(() => setTheme(x => x + 1))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    return () => mo.disconnect()
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current, cv = cvRef.current
    if (!wrap || !cv) return undefined
    const layout = () => {
      const w = Math.max(240, wrap.clientWidth)
      const cols = compact ? (w < 420 ? 6 : 10) : (w < 480 ? 3 : w < 760 ? 5 : 6)
      const tile = w / cols, rows = Math.ceil(30 / cols)
      const g = geo.current
      g.cols = cols; g.tile = tile
      for (let j = 0; j < 30; j++) {
        const col = j % cols, row = Math.floor(j / cols)
        const cx = (rtl ? cols - 1 - col : col) * tile + tile / 2, cy = row * tile + tile / 2
        const R = tile * 0.38
        g.dot[j] = Math.max(0.6, (R / RINGS[j]) * 0.36)
        for (let i = JUZ_START[j]; i < JUZ_START[j + 1]; i++) { g.pos[i * 2] = cx + UNIT[i * 2] * R; g.pos[i * 2 + 1] = cy + UNIT[i * 2 + 1] * R }
      }
      const h = rows * tile, dpr = window.devicePixelRatio || 1
      cv.style.width = `${w}px`; cv.style.height = `${h}px`
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
    }
    const draw = () => {
      const ctx = cv.getContext('2d')
      if (!ctx) return
      const { cols, tile, pos, dot } = geo.current
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      const c = {
        read: cssVar(wrap, '--qlm-read', '#d4a12a'), glow: cssVar(wrap, '--qlm-glow', 'rgba(232,180,60,.28)'),
        un1: cssVar(wrap, '--qlm-un1', '#e4ddcc'), un2: cssVar(wrap, '--qlm-un2', '#d6cfbd'), prev: cssVar(wrap, '--qlm-prev', '#6fb3a6'),
        frame: cssVar(wrap, '--qlm-frame', 'rgba(120,100,60,.28)'), label: cssVar(wrap, '--qlm-label', '#7a6a48'),
        rings: [cssVar(wrap, '--qlm-ring1', '#c9962a'), cssVar(wrap, '--qlm-ring2', '#2f8f7a'), cssVar(wrap, '--qlm-ring3', '#3b6db3')],
        sel: cssVar(wrap, '--qlm-sel', '#c2410c'),
      }
      const k = life.k
      // çərçivə + xətm halqaları + cüz nömrəsi
      ctx.lineWidth = 1
      for (let j = 0; j < 30; j++) {
        const col = j % cols, row = Math.floor(j / cols)
        const cx = (rtl ? cols - 1 - col : col) * tile + tile / 2, cy = row * tile + tile / 2, R = tile * 0.38
        ctx.strokeStyle = c.frame; ctx.beginPath(); octagon(ctx, cx, cy, R * 1.12); ctx.stroke()
        for (let r = 0; r < Math.min(k, 3); r++) {
          ctx.strokeStyle = c.rings[r]; ctx.lineWidth = Math.max(1, tile * 0.012)
          ctx.beginPath(); octagon(ctx, cx, cy, R * (1.17 + r * 0.045)); ctx.stroke()
        }
        ctx.lineWidth = 1
        if (!compact && tile >= 70) {
          ctx.fillStyle = c.label; ctx.font = `600 ${Math.round(Math.max(9, tile * 0.075))}px system-ui, sans-serif`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          // künc: rozetin xaricində, plitənin yuxarı başlanğıc küncündə
          ctx.fillText(String(j + 1), rtl ? cx + tile * 0.4 : cx - tile * 0.4, cy - tile * 0.4)
        }
      }
      // nöqtələr — rəng qrupları, hər qrup bir fill
      const groups = [[c.un1, []], [c.un2, []], [c.prev, []]]
      const lit = []
      for (let i = 0; i < TOTAL; i++) {
        if (hasBit(life.c, i) || (!k && hasBit(life.e, i))) lit.push(i)
        else if (k && hasBit(life.e, i)) groups[2][1].push(i)
        else groups[SURAH_ODD[i]][1].push(i)
      }
      for (const [col, list] of groups) {
        if (!list.length) continue
        ctx.fillStyle = col; ctx.beginPath()
        for (const i of list) { const r = dot[JUZ_OF[i]] * 0.82; ctx.moveTo(pos[i * 2] + r, pos[i * 2 + 1]); ctx.arc(pos[i * 2], pos[i * 2 + 1], r, 0, Math.PI * 2) }
        ctx.fill()
      }
      if (lit.length) {
        ctx.fillStyle = c.glow; ctx.beginPath()
        for (const i of lit) { const r = dot[JUZ_OF[i]] * 1.7; ctx.moveTo(pos[i * 2] + r, pos[i * 2 + 1]); ctx.arc(pos[i * 2], pos[i * 2 + 1], r, 0, Math.PI * 2) }
        ctx.fill()
        ctx.fillStyle = c.read; ctx.beginPath()
        for (const i of lit) star8(ctx, pos[i * 2], pos[i * 2 + 1], dot[JUZ_OF[i]] * 1.25)
        ctx.fill()
      }
      if (sel != null) {
        const r = Math.max(4, dot[JUZ_OF[sel]] * 2.2)
        ctx.strokeStyle = c.sel; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(pos[sel * 2], pos[sel * 2 + 1], r, 0, Math.PI * 2); ctx.stroke()
      }
    }
    layout(); draw()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { layout(); draw() }) : null
    ro?.observe(wrap)
    return () => ro?.disconnect()
  }, [life, sel, theme, compact, rtl])

  const idxAt = (e) => {
    const r = cvRef.current.getBoundingClientRect(), { cols, tile, pos, dot } = geo.current
    const x = e.clientX - r.left, y = e.clientY - r.top
    const vcol = Math.floor(x / tile), row = Math.floor(y / tile)
    const col = rtl ? cols - 1 - vcol : vcol
    if (col < 0 || col >= cols || row < 0) return null
    const j = row * cols + col
    if (j >= 30) return null
    let best = null, bd = Infinity
    for (let i = JUZ_START[j]; i < JUZ_START[j + 1]; i++) {
      const d = (pos[i * 2] - x) ** 2 + (pos[i * 2 + 1] - y) ** 2
      if (d < bd) { bd = d; best = i }
    }
    const lim = Math.max(dot[j] * 2.4, 7)
    return bd <= lim * lim ? best : null
  }
  const openIdx = (i) => { const r = refAt(i); if (r) onOpen?.(r.s, r.a) }
  const onKey = (e) => {
    const fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft'
    const cur = sel ?? -1
    let next = null
    if (e.key === fwd) next = Math.min(TOTAL - 1, cur + 1)
    else if (e.key === back) next = Math.max(0, cur < 0 ? 0 : cur - 1)
    else if (e.key === 'ArrowDown') next = JUZ_START[Math.min(29, cur < 0 ? 0 : JUZ_OF[cur] + 1)]
    else if (e.key === 'ArrowUp') next = JUZ_START[Math.max(0, cur < 0 ? 0 : JUZ_OF[cur] - 1)]
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TOTAL - 1
    else if (e.key === 'Enter' && sel != null && onOpen) { e.preventDefault(); openIdx(sel); return }
    if (next != null) { e.preventDefault(); setSel(next) }
  }

  const cur = hover ?? sel
  const ref = cur != null ? refAt(cur) : null
  const curRead = cur != null && (hasBit(life.c, cur) || hasBit(life.e, cur))
  const days = ref ? life.d[ref.s] : null
  const selRef = sel != null ? refAt(sel) : null
  const pctAll = pctText(stats.pct)

  return (
    <section className={`ui-card qlm${compact ? ' qlm--compact' : ''}`} data-testid="life-mosaic" data-read={stats.ever} data-khatms={stats.khatms}
      aria-labelledby={compact ? undefined : 'qlm-title'} aria-label={compact ? t.ey : undefined} id={compact ? undefined : 'life-mosaic'}>
      {!compact && (
        <div className="qlm__head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="qlm-title" className="ui-title ui-title--sm">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
      )}
      <dl className="qlm__stats" data-testid="lm-stats">
        <div className="qlm__stat qlm__stat--big"><dt>{t.pct}</dt><dd><span className="ui-num" dir="ltr">{pctAll}%</span></dd></div>
        <div className="qlm__stat"><dt>{t.ayahs}</dt><dd><span className="ui-num" data-testid="lm-ayahs">{stats.ever}</span><small className="ui-num" dir="ltr"> / {TOTAL}</small></dd></div>
        <div className="qlm__stat"><dt>{t.surahs}</dt><dd><span className="ui-num">{stats.surahsDone}</span><small className="ui-num" dir="ltr"> / 114</small></dd></div>
        <div className="qlm__stat"><dt>{t.khatms}</dt><dd><span className="ui-num" data-testid="lm-khatms">{stats.khatms}</span></dd></div>
        {stats.khatms > 0 && <div className="qlm__stat"><dt>{t.round}</dt><dd><span className="ui-num" dir="ltr">{pctText(stats.round)}%</span></dd></div>}
      </dl>
      <div className="qlm__wrap" ref={wrapRef}>
        <canvas ref={cvRef} className="qlm__cv" role="img" tabIndex={0} data-testid="lm-canvas"
          aria-label={t.sum(stats.ever, pctAll)} aria-describedby={compact ? undefined : 'qlm-info'}
          onPointerMove={e => setHover(idxAt(e))} onPointerLeave={() => setHover(null)}
          onPointerDown={e => { const i = idxAt(e); if (i != null) setSel(i) }} onKeyDown={onKey} />
        {stats.ever === 0 && <p className="qlm__empty">{t.empty}</p>}
      </div>
      <div className="qlm__foot">
        <ul className="qlm__legend">
          <li><i className="qlm__sw qlm__sw--read" aria-hidden="true" />{t.read}</li>
          <li><i className="qlm__sw qlm__sw--un" aria-hidden="true" />{t.unread}</li>
          {stats.khatms > 0 && <li><i className="qlm__sw qlm__sw--prev" aria-hidden="true" />{t.prev}</li>}
          {!compact && <li><i className="qlm__sw qlm__sw--ring" aria-hidden="true" />{t.ring}</li>}
        </ul>
        <p className="qlm__info" id="qlm-info" aria-live="polite" data-testid="lm-info">
          {ref ? <>
            <b>{surahName(ref.s)}</b> <span className="ui-num" dir="ltr">{ref.s}:{ref.a}</span>
            {' · '}{t.juz} <span className="ui-num">{JUZ_OF[cur] + 1}</span>
            {' · '}<span className={curRead ? 'qlm__yes' : ''}>{curRead ? t.isRead : t.notRead}</span>
            {days && <> · {t.first} <span className="ui-num" dir="ltr">{days[0]}</span>{days[1] !== days[0] && <>, {t.last} <span className="ui-num" dir="ltr">{days[1]}</span></>}</>}
          </> : t.hint}
        </p>
        {selRef && (hrefOf || onOpen) && (
          <a className="ui-btn ui-btn--secondary ui-btn--sm" data-testid="lm-open" href={hrefOf ? hrefOf(selRef.s, selRef.a) : undefined}
            onClick={e => { if (!onOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); onOpen(selRef.s, selRef.a) }}>
            {t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" />
          </a>
        )}
      </div>
      {stats.khatms > 0 && certHref && (
        <p className="qlm__khatm" role="note"><Icon name="sparkle" size={16} /> {t.khatmDone} <a href={certHref}>{t.cert}</a></p>
      )}
      {compact && moreHref && (
        <a className="ui-btn ui-btn--ghost ui-btn--sm qlm__more" href={moreHref}
          onClick={e => { if (!onMore || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); onMore() }}>
          {t.more} <Icon name="chevron" size={14} className="ui-flip-rtl" />
        </a>
      )}
      {!compact && <p className="qlm__note"><Icon name="shield" size={14} /> {t.note}</p>}
    </section>
  )
}
