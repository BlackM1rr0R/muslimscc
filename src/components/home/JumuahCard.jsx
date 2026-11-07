// ═══════════════════════════════════════════════════════
// Cümə rejimi (v5.3) — yalnız cümə günü ana səhifədə (şəhərin saat qurşağı)
//
//   • Cümə namazına geri sayım (zöhr azanı — usePrayerTimes), keçibsə "qılındı"
//   • Kəhf surəsi: oxu düyməsi (/quran/18) + "oxudum" işarəsi
//   • Salavat sayğacı: hər toxunuş +1, hər 100-də halqa dolur (yaddaş: bu cihaz)
//   Hədislər — saytın hədis bazasından (hadiths.js id 574, 1982), dərəcə ilə:
//   Əbu Davud 1047 (səhih, əl-Albani), əl-Hakim 2/399 (səhih, əl-Albani —
//   Səhihul-Cami 6470). Ərəbcədən başqa dillərə tərcümə yalnız 4 əsas dildə
//   (az/en/ru/tr) var — qalan dillərdə ərəb mətni + ingiliscə göstərilir.
//   Sınaq: ?jumuah=1 — istənilən gün göstərir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import usePrayerTimes from '../../hooks/usePrayerTimes'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import { haptic } from '../../hooks/useHaptic'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import '../../styles/JumuahCard.css'

const KEY = 'jumuah_v1'
const T = {
  az: { ey: 'Cümə günü', title: 'Cümə mübarək', sub: 'Həftənin ən fəzilətli günü — üç kiçik əməl.', toJumuah: 'Cümə namazına', done: 'Cümə namazının vaxtı keçdi — Allah qəbul etsin', at: 'Zöhr azanı', kahf: 'Kəhf surəsi', kahfRead: 'Oxu', kahfDone: 'Oxudum', salawat: 'Salavat', tap: 'Toxunun: +1', today: 'bu gün', hadith: 'Hədis' },
  en: { ey: 'Friday', title: 'Jumu‘ah Mubarak', sub: 'The best day of the week — three small deeds.', toJumuah: 'Until Jumu‘ah', done: 'Jumu‘ah time has passed — may Allah accept it', at: 'Dhuhr adhan', kahf: 'Surah al-Kahf', kahfRead: 'Read', kahfDone: 'I read it', salawat: 'Salawat', tap: 'Tap: +1', today: 'today', hadith: 'Hadith' },
  ru: { ey: 'Пятница', title: 'Благословенной пятницы', sub: 'Лучший день недели — три небольших дела.', toJumuah: 'До пятничной молитвы', done: 'Время пятничной молитвы прошло — да примет Аллах', at: 'Азан зухра', kahf: 'Сура аль-Кахф', kahfRead: 'Читать', kahfDone: 'Прочитал', salawat: 'Салават', tap: 'Нажмите: +1', today: 'сегодня', hadith: 'Хадис' },
  ar: { ey: 'يوم الجمعة', title: 'جمعة مباركة', sub: 'خير يوم طلعت عليه الشمس — ثلاثة أعمال يسيرة.', toJumuah: 'حتى صلاة الجمعة', done: 'مضى وقت الجمعة — تقبّل الله', at: 'أذان الظهر', kahf: 'سورة الكهف', kahfRead: 'اقرأ', kahfDone: 'قرأتها', salawat: 'الصلاة على النبي ﷺ', tap: 'المس: +1', today: 'اليوم', hadith: 'الحديث' },
  tr: { ey: 'Cuma günü', title: 'Hayırlı Cumalar', sub: 'Haftanın en faziletli günü — üç küçük amel.', toJumuah: 'Cuma namazına', done: 'Cuma namazının vakti geçti — Allah kabul etsin', at: 'Öğle ezanı', kahf: 'Kehf suresi', kahfRead: 'Oku', kahfDone: 'Okudum', salawat: 'Salavat', tap: 'Dokunun: +1', today: 'bugün', hadith: 'Hadis' },
}
// Hədis mətnləri — hadiths.js-dən olduğu kimi (tərcümə yalnız 4 dildə; dil lüğətinə düşmür)
const H_SALAWAT = {
  ar: 'أَكْثِرُوا الصَّلَاةَ عَلَيَّ يَوْمَ الْجُمُعَةِ', src: 'Əbu Davud 1047', grade: 'Səhih — əl-Albani',
  tr_: { az: 'Cümə günü mənə çox salavat gətirin.', en: 'Send abundant salawat upon me on Friday.', ru: 'Чаще благословляйте меня в пятницу.', tr: 'Cuma günü bana çokça salavat getirin.' },
}
const H_KAHF = {
  ar: 'مَنْ قَرَأَ سُورَةَ الْكَهْفِ يَوْمَ الْجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ', src: 'əl-Hakim 2/399', grade: 'Səhih — əl-Albani (Səhihul-Cami 6470)',
  tr_: { az: 'Kim cümə günü Kəhf surəsini oxusa, iki cümə arası nur ilə aydınlanar.', en: 'Whoever reads Surah al-Kahf on Friday, light will illuminate for him between the two Fridays.', ru: 'Кто прочтёт суру аль-Кахф в пятницу, его осветит свет между двумя пятницами.', tr: 'Kim cuma günü Kehf suresini okursa iki cuma arası nurla aydınlanır.' },
}
const SRC_LOCAL = {
  'Əbu Davud 1047': { az: 'Əbu Davud 1047', en: 'Abu Dawud 1047', ru: 'Абу Дауд 1047', ar: 'أبو داود 1047', tr: 'Ebû Dâvûd 1047' },
  'əl-Hakim 2/399': { az: 'əl-Hakim 2/399', en: 'al-Hakim 2/399', ru: 'аль-Хаким 2/399', ar: 'الحاكم 2/399', tr: 'Hâkim 2/399' },
  'Səhih — əl-Albani': { az: 'Səhih — əl-Albani', en: 'Sahih — al-Albani', ru: 'Сахих — аль-Албани', ar: 'صحيح — الألباني', tr: 'Sahih — Elbânî' },
  'Səhih — əl-Albani (Səhihul-Cami 6470)': { az: 'Səhih — əl-Albani (Səhihul-Cami 6470)', en: 'Sahih — al-Albani (Sahih al-Jami‘ 6470)', ru: 'Сахих — аль-Албани (Сахих аль-Джами‘ 6470)', ar: 'صحيح — الألباني (صحيح الجامع 6470)', tr: 'Sahih — Elbânî (Sahîhu’l-Câmi‘ 6470)' },
}
const loc = (s, lang) => SRC_LOCAL[s]?.[lang] || SRC_LOCAL[s]?.en || s

const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
function readState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && s.date === todayKey()) return { salawat: s.salawat | 0, kahf: !!s.kahf }
  } catch { /* yaddaş bağlıdır */ }
  return { salawat: 0, kahf: false }
}
const fmt = (ms) => {
  const m = Math.max(0, Math.round(ms / 60000))
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}

function Quote({ h, lang, l }) {
  const tr = lang === 'ar' ? '' : (h.tr_[lang] || h.tr_.en)
  return (
    <figure className="jm-quote">
      <blockquote className="jm-quote__ar ui-arabic" lang="ar" dir="rtl">{h.ar}</blockquote>
      {tr && <p className="jm-quote__tr">{tr}</p>}
      <figcaption className="jm-quote__src">{l.hadith} · {loc(h.src, lang)} · <span className="jm-quote__grade">{loc(h.grade, lang)}</span></figcaption>
    </figure>
  )
}

export default function JumuahCard() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const l = pickUi(T, lang, 'en')
  const { isFriday, prayers, next } = usePrayerTimes()
  const forced = useMemo(() => { try { return new URLSearchParams(window.location.search).has('jumuah') } catch { return false } }, [])
  const [st, setSt] = useState(readState)
  const [bump, setBump] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id) }, [])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ date: todayKey(), ...st })) } catch { /* */ } }, [st])

  const addSalawat = useCallback(() => {
    haptic(8)
    setSt(s => ({ ...s, salawat: s.salawat + 1 }))
    setBump(b => b + 1)
  }, [])
  const toggleKahf = () => { haptic(10); setSt(s => ({ ...s, kahf: !s.kahf })) }

  if (!isFriday && !forced) return null

  const dhuhr = prayers?.find(p => p.key === 'dhuhr')
  const toDhuhr = next?.key === 'dhuhr' && !next.tomorrow ? next.at - now : null
  const span = next?.prevAt ? next.at - next.prevAt : 0
  const ringP = toDhuhr != null && span > 0 ? Math.min(1, Math.max(0, 1 - toDhuhr / span)) : 1
  const R = 44, C = 2 * Math.PI * R
  const lap = st.salawat % 100, laps = Math.floor(st.salawat / 100)
  const kahfHref = pathFor('quran', lang, '18')
  const go = (e) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(kahfHref) }

  return (
    <section className="ui-section ui-section--tight jm" aria-labelledby="jm-ttl" data-reveal="fade">
      <div className="ui-container">
        <div className="jm__card">
          <span className="jm__glow" aria-hidden="true" />
          <span className="jm__star" aria-hidden="true" />
          <header className="jm__head">
            <span className="ui-eyebrow jm__ey">{l.ey}</span>
            <h2 id="jm-ttl" className="jm__title">{l.title}</h2>
            <p className="jm__sub">{l.sub}</p>
          </header>

          <div className="jm__grid">
            {/* 1. Cümə namazına geri sayım */}
            <div className={`jm__cell jm__time${toDhuhr == null ? ' is-done' : ''}`}>
              <span className="jm__ringbox">
              <svg className="jm__ring" viewBox="0 0 100 100" aria-hidden="true">
                <circle className="jm__ring-track" cx="50" cy="50" r={R} />
                <circle className="jm__ring-bar" cx="50" cy="50" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - ringP)} />
              </svg>
              <span className="jm__ring-c" aria-hidden="true">{toDhuhr == null ? <Icon name="check" size={34} strokeWidth={2.4} /> : <Icon name="prayer" size={28} />}</span>
              </span>
              <div className="jm__time-txt">
                {toDhuhr != null ? (
                  <>
                    <span className="jm__k">{l.toJumuah}</span>
                    <b className="jm__big ui-num"><bdi dir="ltr">{fmt(toDhuhr)}</bdi></b>
                  </>
                ) : <span className="jm__k jm__k--done"><Icon name="check" size={16} /> {l.done}</span>}
                {dhuhr && <span className="jm__at">{l.at} <b className="ui-num">{dhuhr.adhan}</b></span>}
              </div>
            </div>

            {/* 2. Kəhf surəsi */}
            <div className={`jm__cell jm__kahf${st.kahf ? ' is-done' : ''}`}>
              <span className="jm__k">{l.kahf}</span>
              <span className="jm__kahf-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">الكهف</span>
              <div className="jm__kahf-actions">
                <a className="ui-btn ui-btn--sm jm__btn" href={kahfHref} onClick={go}><Icon name="quran" className="ui-btn__icon" /> {l.kahfRead}</a>
                <button type="button" className={`ui-btn ui-btn--sm jm__btn jm__btn--ghost${st.kahf ? ' is-on' : ''}`} aria-pressed={st.kahf} onClick={toggleKahf}>
                  <Icon name="check" className="ui-btn__icon" /> {l.kahfDone}
                </button>
              </div>
              <Quote h={H_KAHF} lang={lang} l={l} />
            </div>

            {/* 3. Salavat sayğacı */}
            <div className="jm__cell jm__sal">
              <span className="jm__k">{l.salawat}</span>
              <button type="button" className="jm__tap" onClick={addSalawat} aria-label={`${l.salawat}: ${st.salawat}. ${l.tap}`}>
                <svg className="jm__ring jm__ring--sal" viewBox="0 0 100 100" aria-hidden="true">
                  <circle className="jm__ring-track" cx="50" cy="50" r={R} />
                  <circle className="jm__ring-bar" cx="50" cy="50" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - lap / 100)} />
                </svg>
                {bump > 0 && <span key={bump} className="jm__ripple" aria-hidden="true" />}
                <span className="jm__tap-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ</span>
                <b key={`n${bump}`} className="jm__count ui-num">{st.salawat}</b>
                <span className="jm__tap-hint" aria-hidden="true">{l.tap}{laps > 0 ? ` · ×${laps}00` : ''}</span>
              </button>
              <Quote h={H_SALAWAT} lang={lang} l={l} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
