// ═══════════════════════════════════════════════════════
// HijriBirthday (v5.9) — "Hicri doğum günüm" (/hijri)
//
//   <HijriBirthday lang="az" />
//
// • Miladi doğum tarixi → hicri doğum tarixi, hicri və miladi yaş, növbəti hicri doğum günü
//   (miladi tarixi və neçə gün qaldığı), il dairəsində yeri. Məntiq — utils/hijriBirthday.
// • Tarix yalnız bu cihazda saxlanır (localStorage 'hijri_birthday'), heç yerə göndərilmir.
// • "Kart kimi paylaş" — 1080×1920 şəkil (kətan), Web Share / yükləmə.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { fromLocalDate, formatHijri, formatGregorian, parseGKey, gKey } from '../../utils/hijri'
import { hijriBirthday } from '../../utils/hijriBirthday'
import { celebrate } from '../../utils/celebrate'
import '../../styles/HijriBirthday.css'

const T = {
  az: { ey: 'Sizin üçün', title: 'Hicri doğum günüm', lead: 'Doğum tarixinizi yazın — hicri təqvimlə nə vaxt doğulduğunuzu və növbəti hicri doğum gününüzü görün.', label: 'Doğum tarixi (miladi)', born: 'Hicri doğum tarixiniz', ageH: 'Hicri yaş', ageG: 'Miladi yaş', next: 'Növbəti hicri doğum günü', left: '{n} gün qaldı', today: 'Bu gün hicri doğum gününüzdür!', extra: 'Hicri il ~11 gün qısadır — hicri təqvimlə {n} il çox yaşamısınız', lived: 'yaşanmış gün', share: 'Kart kimi paylaş', privacy: 'Tarix yalnız bu cihazda saxlanır.', clear: 'Sil', turns: 'Hicri {n} yaşınız', approx: 'Hicri tarix Ümmül-Qura təqviminə görədir; yerli ay görülməsi ilə 1–2 gün fərq ola bilər.' },
  en: { ey: 'For you', title: 'My Hijri birthday', lead: 'Enter your date of birth — see when you were born in the Hijri calendar and your next Hijri birthday.', label: 'Date of birth (Gregorian)', born: 'Your Hijri date of birth', ageH: 'Hijri age', ageG: 'Gregorian age', next: 'Next Hijri birthday', left: '{n} days to go', today: 'Today is your Hijri birthday!', extra: 'A Hijri year is ~11 days shorter — you have lived {n} more years by the Hijri calendar', lived: 'days lived', share: 'Share as a card', privacy: 'The date is stored only on this device.', clear: 'Clear', turns: 'Your Hijri age {n}', approx: 'The Hijri date follows the Umm al-Qura calendar; local moon sighting can differ by 1–2 days.' },
  ru: { ey: 'Для вас', title: 'Мой день рождения по хиджре', lead: 'Введите дату рождения — узнайте дату по хиджре и следующий день рождения по хиджре.', label: 'Дата рождения (григорианская)', born: 'Ваша дата рождения по хиджре', ageH: 'Возраст по хиджре', ageG: 'Возраст по григорианскому', next: 'Следующий день рождения по хиджре', left: 'осталось дней: {n}', today: 'Сегодня ваш день рождения по хиджре!', extra: 'Год по хиджре короче примерно на 11 дней — по хиджре вы прожили на {n} г. больше', lived: 'прожито дней', share: 'Поделиться карточкой', privacy: 'Дата хранится только на этом устройстве.', clear: 'Удалить', turns: 'Возраст по хиджре: {n}', approx: 'Дата по хиджре — по календарю Умм аль-Кура; при местном наблюдении луны возможна разница в 1–2 дня.' },
  ar: { ey: 'لك', title: 'ميلادي الهجري', lead: 'أدخل تاريخ ميلادك — واعرف تاريخ ميلادك بالهجري وموعد يوم ميلادك الهجري القادم.', label: 'تاريخ الميلاد (ميلادي)', born: 'تاريخ ميلادك بالهجري', ageH: 'العمر بالهجري', ageG: 'العمر بالميلادي', next: 'يوم الميلاد الهجري القادم', left: 'بعد {n} يومًا', today: 'اليوم يوم ميلادك الهجري!', extra: 'السنة الهجرية أقصر بنحو 11 يومًا — عشتَ بالتقويم الهجري {n} سنة أكثر', lived: 'يومًا عشتَها', share: 'شارك كبطاقة', privacy: 'يُحفظ التاريخ على هذا الجهاز فقط.', clear: 'حذف', turns: 'عمرك الهجري {n}', approx: 'التاريخ الهجري وفق تقويم أم القرى؛ وقد يختلف يومًا أو يومين بحسب رؤية الهلال المحلية.' },
  tr: { ey: 'Sizin için', title: 'Hicri doğum günüm', lead: 'Doğum tarihinizi yazın — hicri takvime göre ne zaman doğduğunuzu ve bir sonraki hicri doğum gününüzü görün.', label: 'Doğum tarihi (miladi)', born: 'Hicri doğum tarihiniz', ageH: 'Hicri yaş', ageG: 'Miladi yaş', next: 'Sonraki hicri doğum günü', left: '{n} gün kaldı', today: 'Bugün hicri doğum gününüz!', extra: 'Hicri yıl ~11 gün kısadır — hicri takvimle {n} yıl fazla yaşadınız', lived: 'yaşanan gün', share: 'Kart olarak paylaş', privacy: 'Tarih yalnızca bu cihazda saklanır.', clear: 'Sil', turns: 'Hicri yaşınız {n}', approx: 'Hicri tarih Ümmü’l-Kura takvimine göredir; yerel hilal gözlemiyle 1–2 gün fark olabilir.' },
}
const KEY = 'hijri_birthday'
const fill = (s, n) => String(s).replace('{n}', n)
const load = () => { try { return parseGKey(localStorage.getItem(KEY) || '') } catch { return null } }

function drawCard(ctx, { W = 1080, H = 1920, title, hDate, gDate, age, next, rtl }) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0a1630'); bg.addColorStop(0.55, '#1b2f5c'); bg.addColorStop(1, '#0b1428')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  for (let i = 0; i < 120; i++) { ctx.globalAlpha = 0.2 + rnd() * 0.7; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H * 0.6, rnd() * 2.6 + 0.6, 0, Math.PI * 2); ctx.fill() }
  ctx.globalAlpha = 1
  // 12 ay dairəsi — doğum ayı qızılı
  const cx = W / 2, cy = H * 0.34, R = 250
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(231,199,125,.35)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()
  for (let m = 0; m < 12; m++) {
    const a = -Math.PI / 2 + (m / 12) * Math.PI * 2, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R
    const on = m === age.month - 1
    ctx.fillStyle = on ? '#f3d27a' : 'rgba(255,255,255,.35)'
    ctx.beginPath(); ctx.arc(x, y, on ? 26 : 10, 0, Math.PI * 2); ctx.fill()
    if (on) { ctx.save(); ctx.shadowColor = '#f3d27a'; ctx.shadowBlur = 50; ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill(); ctx.restore() }
  }
  ctx.textAlign = 'center'; ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.fillStyle = '#f3d27a'; ctx.font = '800 200px system-ui, sans-serif'; ctx.fillText(String(age.n), cx, cy + 70)
  ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '600 44px system-ui, sans-serif'; ctx.fillText(age.label, cx, cy + 140)
  ctx.fillStyle = '#fff'; ctx.font = '800 76px system-ui, sans-serif'; ctx.fillText(title, cx, H * 0.6)
  ctx.fillStyle = '#f3d27a'; ctx.font = '700 64px system-ui, sans-serif'; ctx.fillText(hDate, cx, H * 0.6 + 110)
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '500 44px system-ui, sans-serif'; ctx.fillText(gDate, cx, H * 0.6 + 180)
  if (next) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '600 44px system-ui, sans-serif'; ctx.fillText(next, cx, H * 0.6 + 300) }
  ctx.fillStyle = 'rgba(231,199,125,.9)'; ctx.font = '700 40px system-ui, sans-serif'; ctx.direction = 'ltr'; ctx.fillText('muslims.cc', cx, H - 110)
}

export default function HijriBirthday({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const [birth, setBirth] = useState(null)
  const [msg, setMsg] = useState('')
  useEffect(() => { setBirth(load()) }, [])
  const today = useMemo(() => fromLocalDate(new Date()), [])
  const r = useMemo(() => (birth ? hijriBirthday(birth, today) : null), [birth, today])
  useEffect(() => { if (r?.isToday) celebrate() }, [r?.isToday])

  const onChange = (e) => {
    const g = parseGKey(e.target.value)
    setBirth(g)
    try { if (g) localStorage.setItem(KEY, gKey(g)); else localStorage.removeItem(KEY) } catch { /* */ }
  }
  const clear = () => { setBirth(null); try { localStorage.removeItem(KEY) } catch { /* */ } }
  const share = async () => {
    if (!r) return
    try {
      const c = document.createElement('canvas'); c.width = 1080; c.height = 1920
      drawCard(c.getContext('2d'), {
        title: t.title, hDate: formatHijri(r.hBirth, lang), gDate: formatGregorian(birth, lang),
        age: { n: r.ageH, label: t.ageH, month: r.hBirth.month },
        next: r.isToday ? t.today : r.nextG ? `${t.next}: ${formatGregorian(r.nextG, lang)}` : '', rtl: lang === 'ar',
      })
      const blob = await new Promise(res => c.toBlob(res, 'image/png'))
      const file = new File([blob], 'hijri-birthday.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: t.title }); return } catch (e) { if (e?.name === 'AbortError') return } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      setMsg('✓')
    } catch { setMsg('') }
  }
  // Növbəti doğum gününə qədər irəliləyiş (hicri il ~354 gün)
  const prog = r && r.daysUntil != null ? Math.max(0, Math.min(1, 1 - r.daysUntil / 354)) : 0

  return (
    <section className="ui-section ui-section--tight hbd" aria-labelledby="hbd-title" data-testid="hijri-birthday">
      <div className="ui-container">
        <div className="ui-card hbd__card">
          <div className="hbd__intro">
            <span className="ui-eyebrow">{t.ey}</span>
            <h2 id="hbd-title" className="ui-title">{t.title}</h2>
            <p className="ui-lead">{t.lead}</p>
            <label className="hbd__field">
              <span>{t.label}</span>
              <input type="date" className="ui-input" value={birth ? gKey(birth) : ''} max={gKey(today)} min="1900-01-01" onChange={onChange} data-testid="hbd-input" />
            </label>
            <p className="hbd__privacy"><Icon name="shield" size={14} /> {t.privacy}</p>
          </div>
          {r && (
            <div className={`hbd__result${r.isToday ? ' is-today' : ''}`} aria-live="polite">
              <div className="hbd__ring" style={{ '--p': prog }} aria-hidden="true">
                <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" className="hbd__track" /><circle cx="60" cy="60" r="52" className="hbd__bar" pathLength="1" /></svg>
                <span className="hbd__age ui-num">{r.ageH}</span>
                <span className="hbd__agel">{t.ageH}</span>
              </div>
              <div className="hbd__info">
                <span className="hbd__k">{t.born}</span>
                <strong className="hbd__h ui-num" data-testid="hbd-hijri">{formatHijri(r.hBirth, lang)}</strong>
                {r.isToday ? <p className="hbd__today">{t.today}</p> : r.nextG && (
                  <p className="hbd__next"><span className="hbd__k">{t.next}</span> <b className="ui-num">{formatGregorian(r.nextG, lang)}</b> · <span className="ui-num">{fill(t.left, r.daysUntil)}</span></p>
                )}
                <ul className="hbd__stats">
                  <li><b className="ui-num">{r.ageG}</b><span>{t.ageG}</span></li>
                  <li><b className="ui-num">{String(r.daysLived).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</b><span>{t.lived}</span></li>
                </ul>
                {r.extraYears > 0 && <p className="hbd__extra">{fill(t.extra, r.extraYears)}</p>}
                <div className="hbd__btns">
                  <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share} data-testid="hbd-share"><Icon name="share" className="ui-btn__icon" />{t.share}</button>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={clear}>{t.clear}</button>
                  {msg && <span role="status" className="hbd__ok">{msg}</span>}
                </div>
                <p className="hbd__note">{t.approx}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
