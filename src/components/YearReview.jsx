// ═══════════════════════════════════════════════════════
// YearReview — "İllik icmal": cari hicri il üzrə şəxsi ibadət xülasəsi.
// Məlumat yalnız bu cihazdan (utils/yearReview.js — saf hesablama).
// Paylaşma: kart kətanda (1080×1350) çəkilir → Web Share və ya yükləmə.
// Stillər: src/styles/YearReview.css (yalnız transform/opacity animasiyası)
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import Icon from './Icon'
import { yearReview } from '../utils/yearReview'
import { loadSnapshot, loadHayd, toKey } from '../utils/prayerTracker'
import { gregorianToHijri, hijriToGregorian, fromLocalDate, gKey } from '../utils/hijri'
import '../styles/YearReview.css'
import { pickUi } from '../utils/uiText'

const YearStory = lazy(() => import('./YearStory'))
// v5.3: miladi il rejimi (dekabrda avtomatik) — "2026 — mənim ilim"
const GREG = {
  az: { hijri: 'Hicri il', greg: (y) => `${y} ili`, title: (y) => `${y} — mənim ilim`, lead: (d) => `1 yanvardan bu günə — ${d} gün. Yalnız bu cihazdakı qeydlər.` },
  en: { hijri: 'Hijri year', greg: (y) => `${y}`, title: (y) => `My ${y}`, lead: (d) => `From 1 January to today — ${d} days. Records on this device only.` },
  ru: { hijri: 'Год хиджры', greg: (y) => `${y} год`, title: (y) => `Мой ${y} год`, lead: (d) => `С 1 января по сегодня — ${d} дн. Только записи на этом устройстве.` },
  ar: { hijri: 'السنة الهجرية', greg: (y) => `${y}م`, title: (y) => `عامي ${y}م`, lead: (d) => `من ١ يناير إلى اليوم — ${d} يومًا. السجلات على هذا الجهاز فقط.` },
  tr: { hijri: 'Hicri yıl', greg: (y) => `${y} yılı`, title: (y) => `${y} — benim yılım`, lead: (d) => `1 Ocak'tan bugüne — ${d} gün. Yalnızca bu cihazdaki kayıtlar.` },
}
const STORY = { az: 'Story kimi bax', en: 'Watch as a story', ru: 'Смотреть как историю', tr: 'Hikâye olarak izle', ar: 'شاهد كقصة' }

const T = {
  az: {
    eyebrow: 'İllik icmal', title: (y) => `Hicri ${y} ilim`,
    lead: (d) => `Məhərrəmin 1-dən bu günə — ${d} gün. Yalnız bu cihazdakı qeydlər.`,
    prayers: 'qılınmış namaz', fullDays: 'tam gün (5/5)', streak: 'ən uzun seriya', quran: 'Quran oxunan gün',
    charity: 'xeyir əməli', active: 'fəal gün', excused: (n) => `${n} üzrlü gün sayılmayıb`,
    yearPct: (p) => `İlin ${p}%-i keçib`, share: 'Şəkil kimi paylaş', saved: 'Şəkil hazırdır',
    empty: 'Bu il hələ qeyd yoxdur — namaz izləyicisində ilk günü işarələyin.', brand: 'muslims.cc',
  },
  en: {
    eyebrow: 'Year in review', title: (y) => `My hijri year ${y}`,
    lead: (d) => `From 1 Muharram to today — ${d} days. Records on this device only.`,
    prayers: 'prayers performed', fullDays: 'full days (5/5)', streak: 'longest streak', quran: 'Quran reading days',
    charity: 'good deeds', active: 'active days', excused: (n) => `${n} excused days not counted`,
    yearPct: (p) => `${p}% of the year has passed`, share: 'Share as image', saved: 'Image ready',
    empty: 'No records this year yet — mark your first day in the prayer tracker.', brand: 'muslims.cc',
  },
  ru: {
    eyebrow: 'Итоги года', title: (y) => `Мой ${y} год хиджры`,
    lead: (d) => `С 1 мухаррама по сегодня — ${d} дн. Только записи на этом устройстве.`,
    prayers: 'совершённых намазов', fullDays: 'полных дней (5/5)', streak: 'самая длинная серия', quran: 'дней чтения Корана',
    charity: 'добрых дел', active: 'активных дней', excused: (n) => `${n} дн. по уважительной причине не учтены`,
    yearPct: (p) => `Прошло ${p}% года`, share: 'Поделиться картинкой', saved: 'Картинка готова',
    empty: 'В этом году записей пока нет — отметьте первый день в трекере намаза.', brand: 'muslims.cc',
  },
  tr: {
    eyebrow: 'Yıllık özet', title: (y) => `Hicri ${y} yılım`,
    lead: (d) => `1 Muharrem'den bugüne — ${d} gün. Yalnızca bu cihazdaki kayıtlar.`,
    prayers: 'kılınan namaz', fullDays: 'tam gün (5/5)', streak: 'en uzun seri', quran: 'Kur\'an okunan gün',
    charity: 'hayır amel', active: 'aktif gün', excused: (n) => `${n} mazeretli gün sayılmadı`,
    yearPct: (p) => `Yılın %${p}'i geçti`, share: 'Görsel olarak paylaş', saved: 'Görsel hazır',
    empty: 'Bu yıl henüz kayıt yok — namaz takipçisinde ilk günü işaretleyin.', brand: 'muslims.cc',
  },
  ar: {
    eyebrow: 'حصاد العام', title: (y) => `عامي الهجري ${y}`,
    lead: (d) => `من ١ محرم إلى اليوم — ${d} يومًا. السجلات على هذا الجهاز فقط.`,
    prayers: 'صلاة مؤداة', fullDays: 'يوم كامل (٥/٥)', streak: 'أطول سلسلة', quran: 'يوم قراءة القرآن',
    charity: 'عمل خير', active: 'يوم نشاط', excused: (n) => `لم تُحتسب ${n} أيام عذر`,
    yearPct: (p) => `مضى ${p}٪ من العام`, share: 'شارك كصورة', saved: 'الصورة جاهزة',
    empty: 'لا سجلات هذا العام بعد — علّم أول يوم في متتبع الصلاة.', brand: 'muslims.cc',
  },
}

const HIJRI_YEAR_DAYS = 354.37

function readJSON(key, fb) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fb } catch { return fb }
}

/** Cari hicri (və ya miladi) ilin hesabı (brauzerdə; prerender zamanı null) */
function useYearData(mode = 'hijri') {
  return useMemo(() => {
    if (typeof window === 'undefined') return null
    const now = new Date()
    const h = gregorianToHijri(fromLocalDate(now))
    const start = mode === 'greg' ? new Date(now.getFullYear(), 0, 1) : hijriToGregorian({ year: h.year, month: 1, day: 1 })
    if (!start) return null
    const from = gKey(start), to = toKey(now)
    const qs = readJSON('quran_stats', {})
    const ch = readJSON('charity_log', [])
    const r = yearReview({
      snap: loadSnapshot(), periods: loadHayd().periods,
      quranDates: Array.isArray(qs?.dates) ? qs.dates : [],
      charity: Array.isArray(ch) ? ch : [],
      from, to,
    })
    const yearDays = mode === 'greg' ? 365.25 : HIJRI_YEAR_DAYS
    return { ...r, hYear: mode === 'greg' ? now.getFullYear() : h.year, mode, pct: Math.min(100, Math.round((r.days / yearDays) * 100)) }
  }, [mode])
}

const fmt = (n, lang) => {
  const s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : lang === 'ar' ? '٬' : ' ')
  return lang === 'ar' ? s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : s
}

/** Paylaşma şəkli — 1080×1350 (4:5), saytın tünd yaşıl-qızılı rəngləri */
export function drawReviewCard(ctx, { W = 1080, H = 1350, title, sub, items, brand, rtl }) {
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#0d3b2e'); g.addColorStop(1, '#06201a')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  // İncə həndəsi naxış — səkkizguşəli ulduz konturları
  ctx.strokeStyle = 'rgba(212,175,55,0.08)'; ctx.lineWidth = 2
  for (let y = 0; y < H + 120; y += 120) for (let x = (y / 120) % 2 ? 60 : 0; x < W + 120; x += 120) {
    ctx.save(); ctx.translate(x, y)
    for (const a of [0, Math.PI / 4]) { ctx.rotate(a); ctx.strokeRect(-26, -26, 52, 52) }
    ctx.restore()
  }
  ctx.textAlign = 'center'; ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.fillStyle = '#d4af37'; ctx.font = '600 40px system-ui, sans-serif'
  ctx.fillText(sub, W / 2, 170)
  ctx.fillStyle = '#ffffff'; ctx.font = '700 76px Georgia, serif'
  ctx.fillText(title, W / 2, 270)
  const cols = 2, cw = 420, chh = 230, gap = 40
  const x0 = (W - (cols * cw + gap)) / 2, y0 = 370
  items.forEach((it, i) => {
    const cx = x0 + (i % cols) * (cw + gap), cy = y0 + Math.floor(i / cols) * (chh + gap)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx, cy, cw, chh, 28) : ctx.rect(cx, cy, cw, chh); ctx.fill()
    ctx.fillStyle = '#f3d77a'; ctx.font = '700 96px system-ui, sans-serif'
    ctx.fillText(it.value, cx + cw / 2, cy + 125)
    ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.font = '500 34px system-ui, sans-serif'
    ctx.fillText(it.label, cx + cw / 2, cy + 185)
  })
  ctx.fillStyle = 'rgba(212,175,55,0.9)'; ctx.font = '600 36px system-ui, sans-serif'
  ctx.fillText(brand, W / 2, H - 70)
}

export default function YearReview() {
  const { lang } = useLang()
  const base = pickUi(T, lang)
  const gt = pickUi(GREG, lang, 'en')
  // Dekabrda miladi il önə çıxır (ilin sonu icmalı); istifadəçi dəyişə bilər
  const [mode, setMode] = useState(() => (typeof window !== 'undefined' && new Date().getMonth() === 11 ? 'greg' : 'hijri'))
  const t = mode === 'greg' ? { ...base, title: gt.title, lead: gt.lead } : base
  const d = useYearData(mode)
  const [msg, setMsg] = useState('')
  const [story, setStory] = useState(false)
  // Ana səhifədən (Mənim günüm → "Mənim ilim") #year-review ilə gəlinəndə bura sürüşür
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash !== '#year-review') return undefined
    const t2 = setTimeout(() => document.getElementById('year-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350)
    return () => clearTimeout(t2)
  }, [])
  if (!d) return null

  const items = [
    { k: 'prayers', icon: 'prayer', v: d.prayers, l: t.prayers },
    { k: 'full', icon: 'check', v: d.fullDays, l: t.fullDays },
    { k: 'streak', icon: 'bolt', v: d.bestStreak, l: t.streak },
    { k: 'quran', icon: 'quran', v: d.quranDays, l: t.quran },
    { k: 'charity', icon: 'donate', v: d.charity, l: t.charity },
    { k: 'active', icon: 'sparkle', v: d.activeDays, l: t.active },
  ]
  const yearLabel = lang === 'ar' ? String(d.hYear).replace(/\d/g, (x) => '٠١٢٣٤٥٦٧٨٩'[x]) : String(d.hYear)
  const empty = d.activeDays === 0

  async function share() {
    try {
      const c = document.createElement('canvas'); c.width = 1080; c.height = 1350
      drawReviewCard(c.getContext('2d'), {
        title: t.title(yearLabel), sub: t.eyebrow, brand: t.brand, rtl: lang === 'ar',
        items: items.map(i => ({ value: fmt(i.v, lang), label: i.l })),
      })
      const blob = await new Promise(res => c.toBlob(res, 'image/png'))
      if (!blob) return
      const file = new File([blob], `muslims-cc-${d.hYear}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file] }); return } catch (e) {
          if (e?.name === 'AbortError') return            // istifadəçi ləğv etdi
        }                                                  // başqa xəta — yükləməyə keç
      }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      setMsg(t.saved)
    } catch { /* istifadəçi paylaşmanı ləğv etdi */ }
  }

  return (
    <section id="year-review" className="ui-section ui-section--tight yr" aria-labelledby="yr-title" data-testid="year-review">
      <div className="ui-container">
        <div className="yr__card">
          <div className="yr__glow" aria-hidden="true" />
          <div className="yr__head">
            <span className="ui-eyebrow">{t.eyebrow}</span>
            <div className="yr__mode" role="group" aria-label={t.eyebrow}>
              <button type="button" aria-pressed={mode === 'hijri'} onClick={() => setMode('hijri')}>{gt.hijri}</button>
              <button type="button" aria-pressed={mode === 'greg'} onClick={() => setMode('greg')} data-testid="yr-greg">{gt.greg(new Date().getFullYear())}</button>
            </div>
            <h2 id="yr-title" className="yr__title">{t.title(yearLabel)}</h2>
            <p className="yr__lead">{t.lead(fmt(d.days, lang))}</p>
            <div className="yr__year" role="img" aria-label={t.yearPct(fmt(d.pct, lang))}>
              <span className="yr__year-bar"><i style={{ transform: `scaleX(${d.pct / 100})` }} /></span>
              <small>{t.yearPct(fmt(d.pct, lang))}</small>
            </div>
          </div>
          {empty ? <p className="yr__empty">{t.empty}</p> : (
            <ul className="yr__grid">
              {items.map((it, i) => (
                <li key={it.k} className="yr__item" style={{ '--i': i }} data-testid={`yr-${it.k}`}>
                  <Icon name={it.icon} size={20} />
                  <b className="ui-num" data-count={it.v}>{fmt(it.v, lang)}</b>
                  <span>{it.l}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="yr__foot">
            {d.excusedDays > 0 && <small className="yr__note">{t.excused(fmt(d.excusedDays, lang))}</small>}
            {!empty && (
              <button type="button" className="ui-btn ui-btn--primary yr__story" onClick={() => setStory(true)} data-testid="yr-story">
                <Icon name="play" size={16} /> {pickUi(STORY, lang, 'en')}
              </button>
            )}
            {!empty && (
              <button type="button" className="ui-btn ui-btn--ghost yr__share" onClick={share} data-testid="yr-share">
                <Icon name="share" size={16} /> {t.share}
              </button>
            )}
            <span className="yr__msg" role="status">{msg}</span>
          </div>
          {story && (
            <Suspense fallback={null}>
              <YearStory lang={lang} title={t.title(yearLabel)} lead={t.lead(fmt(d.days, lang))} onShare={share} onClose={() => setStory(false)}
                scenes={items.filter(it => it.k === 'prayers' || it.v > 0).map(it => ({
                  key: it.k, icon: it.icon, value: fmt(it.v, lang), label: it.l,
                  sub: it.k === 'prayers' ? `${fmt(d.fullDays, lang)} ${t.fullDays}` : it.k === 'active' ? t.yearPct(fmt(d.pct, lang)) : '',
                }))} />
            </Suspense>
          )}
        </div>
      </div>
    </section>
  )
}
