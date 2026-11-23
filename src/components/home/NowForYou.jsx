// ═══════════════════════════════════════════════════════
// "İndi sizin üçün" — ana səhifədə günün vaxtına uyğun 1–3 təklif
//
// • Seçim utils/nowForYou.js-dədir (saf məntiq): namaz vaxtları
//   (usePrayerTimes — seçilmiş şəhər və onun saat qurşağı), hicri tarix
//   (utils/hijri — saytın qalan yerləri ilə eyni) və həftə günü.
// • Yalnız saytın MÖVCUD bölmələrinə aparır (səhər rejimi, yatmazdan əvvəl,
//   Ramazan, Zülhiccə dərsi, sünnə orucları, cümə). Başlıqlar interfeys
//   yazısıdır; "səbəb" sətri yalnız məlumatdır (vaxt, tarix, gün) — yeni dini
//   mətn yoxdur.
// • Prerender / ilk render: yalnız boz yer tutucu (eyni hündürlük). Təkliflər
//   mount-dan SONRA hesablanır — ilk kadr hər yerdə eynidir, sıçrayış yoxdur.
//   Hündürlük say-dan asılı deyil: telefonda üfüqi sürüşən sıra, böyük
//   ekranda 3 sütun (HomePage.css → .hp-now).
// • Dəqiqədə bir yenilənir; səhifə yenidən görünəndə də.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'
import usePrayerTimes, { PRAYER_NAMES } from '../../hooks/usePrayerTimes'
import { pathFor } from '../../seo/routes'
import { isPlainClick } from '../PageLink'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { gregorianToHijri, addGDays, weekdayOf, formatHijri } from '../../utils/hijri'
import { pickNowItems, hmToSecs, secsToHm } from '../../utils/nowForYou'

const T = {
  az: {
    ey: 'İndi', title: 'İndi sizin üçün',
    morning: 'Səhər rejimi', bedtime: 'Yatmazdan əvvəlki sünnələr', iftar: 'İftar və səhur vaxtları', taraweeh: 'Təravih qeydi',
    dhulhijjah: 'Zülhiccənin on günü', arafah: 'Ərəfə günü', arafahTomorrow: 'Sabah Ərəfə günüdür',
    fastToday: 'Bu gün sünnə orucu günüdür', fastTomorrow: 'Sabah sünnə orucu günüdür', fridayEve: 'Sabah cümədir', focus: 'Quranla bir neçə dəqiqə',
    afterFajr: 'Sübhdən sonra · {time}', afterIsha: 'İşadan sonra · {time}', iftarAt: 'Məğrib (iftar): {time}', next: 'Növbəti namaz: {prayer} {time}', fridayWhy: 'Cümənin fəziləti və hökmləri',
    mon: 'Bazar ertəsi', thu: 'Cümə axşamı', bid: 'Ağ günlər (13–15)', shawwal: 'Şəvvalın altı günü', ashura: 'Aşura', tasua: 'Tasua', loading: 'Təkliflər hazırlanır',
  },
  en: {
    ey: 'Right now', title: 'Now for you',
    morning: 'Morning routine', bedtime: 'Bedtime Sunnah', iftar: 'Iftar and suhur times', taraweeh: 'Taraweeh log',
    dhulhijjah: 'The ten days of Dhul-Hijjah', arafah: 'The Day of Arafah', arafahTomorrow: 'Tomorrow is the Day of Arafah',
    fastToday: 'Today is a Sunnah fast day', fastTomorrow: 'Tomorrow is a Sunnah fast day', fridayEve: 'Tomorrow is Friday', focus: 'A few minutes with the Quran',
    afterFajr: 'After Fajr · {time}', afterIsha: 'After Isha · {time}', iftarAt: 'Maghrib (iftar): {time}', next: 'Next prayer: {prayer} at {time}', fridayWhy: 'Friday — virtues and rulings',
    mon: 'Monday', thu: 'Thursday', bid: 'The white days (13–15)', shawwal: 'Six days of Shawwal', ashura: 'Ashura', tasua: 'Tasu‘a', loading: 'Preparing suggestions',
  },
  ru: {
    ey: 'Сейчас', title: 'Сейчас для вас',
    morning: 'Утренний распорядок', bedtime: 'Сунна перед сном', iftar: 'Время ифтара и сухура', taraweeh: 'Журнал таравиха',
    dhulhijjah: 'Десять дней зуль-хиджи', arafah: 'День Арафа', arafahTomorrow: 'Завтра день Арафа',
    fastToday: 'Сегодня день желательного поста', fastTomorrow: 'Завтра день желательного поста', fridayEve: 'Завтра пятница', focus: 'Несколько минут с Кораном',
    afterFajr: 'После фаджра · {time}', afterIsha: 'После иша · {time}', iftarAt: 'Магриб (ифтар): {time}', next: 'Следующий намаз: {prayer} в {time}', fridayWhy: 'Пятница — достоинства и нормы',
    mon: 'Понедельник', thu: 'Четверг', bid: 'Белые дни (13–15)', shawwal: 'Шесть дней шавваля', ashura: 'Ашура', tasua: 'Тасуа', loading: 'Готовим подсказки',
  },
  ar: {
    ey: 'الآن', title: 'الآن لك',
    morning: 'برنامج الصباح', bedtime: 'سنن النوم', iftar: 'مواقيت الإفطار والسحور', taraweeh: 'سجل التراويح',
    dhulhijjah: 'عشر ذي الحجة', arafah: 'يوم عرفة', arafahTomorrow: 'غدًا يوم عرفة',
    fastToday: 'اليوم من أيام صيام السنة', fastTomorrow: 'غدًا من أيام صيام السنة', fridayEve: 'غدًا الجمعة', focus: 'دقائق مع القرآن',
    afterFajr: 'بعد الفجر · {time}', afterIsha: 'بعد العشاء · {time}', iftarAt: 'المغرب (الإفطار): {time}', next: 'الصلاة التالية: {prayer} في {time}', fridayWhy: 'الجمعة — الفضل والأحكام',
    mon: 'الاثنين', thu: 'الخميس', bid: 'الأيام البيض (13–15)', shawwal: 'ست من شوال', ashura: 'عاشوراء', tasua: 'تاسوعاء', loading: 'جارٍ تجهيز الاقتراحات',
  },
  tr: {
    ey: 'Şimdi', title: 'Şimdi sizin için',
    morning: 'Sabah rutini', bedtime: 'Uyumadan önceki sünnetler', iftar: 'İftar ve sahur vakitleri', taraweeh: 'Teravih kaydı',
    dhulhijjah: 'Zilhicce’nin on günü', arafah: 'Arefe günü', arafahTomorrow: 'Yarın Arefe günü',
    fastToday: 'Bugün sünnet oruç günü', fastTomorrow: 'Yarın sünnet oruç günü', fridayEve: 'Yarın cuma', focus: 'Kur’an ile birkaç dakika',
    afterFajr: 'Sabah namazından sonra · {time}', afterIsha: 'Yatsıdan sonra · {time}', iftarAt: 'Akşam (iftar): {time}', next: 'Sıradaki namaz: {prayer} {time}', fridayWhy: 'Cuma — fazileti ve hükümleri',
    mon: 'Pazartesi', thu: 'Perşembe', bid: 'Beyaz günler (13–15)', shawwal: 'Şevval’in altı günü', ashura: 'Aşure', tasua: 'Tasua', loading: 'Öneriler hazırlanıyor',
  },
}

const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''))
const parseDate = (k) => { const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(k || ''); return m ? { year: +m[3], month: +m[2], day: +m[1] } : null }
const fromDevice = () => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } }
const safeHijri = (g) => { try { return gregorianToHijri(g) } catch { return null } }

// SPA keçidindən sonra #hissəyə sürüşdür (səhifə tənbəl yüklənir — element bir az sonra yaranır)
function scrollToWhenReady(id) {
  let n = 0
  const tick = () => {
    const el = document.getElementById(id) || document.querySelector(`[data-testid="${id}"]`)
    if (el) {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
      return
    }
    if (++n < 40) setTimeout(tick, 150)
  }
  setTimeout(tick, 120)
}

export default function NowForYou() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const { prayers, date, nowSecs, loading } = usePrayerTimes()
  // Mount-dan sonra: ilk render (və prerender) yalnız yer tutucudur
  const [ready, setReady] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    setReady(true)
    const id = setInterval(() => setTick((x) => x + 1), 60000)
    const vis = () => { if (document.visibilityState === 'visible') setTick((x) => x + 1) }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis) }
  }, [])

  const data = useMemo(() => {
    if (!ready || loading) return null
    const times = {}
    for (const p of prayers || []) times[p.key] = hmToSecs(p.adhan)
    const g = parseDate(date) || fromDevice()
    const g1 = addGDays(g, 1)
    let secs = nowSecs
    if (!Number.isFinite(secs)) { const d = new Date(); secs = d.getHours() * 3600 + d.getMinutes() * 60 }
    const hijri = safeHijri(g)
    const items = pickNowItems({
      secs, times, weekday: weekdayOf(g), hijri,
      tomorrow: { weekday: weekdayOf(g1), hijri: safeHijri(g1) },
    })
    return { items, hijri }
    // tick — dəqiqəlik yenilənmə
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, loading, prayers, date, nowSecs, tick])

  const items = data?.items || null
  const reasonText = (it) => {
    const r = it.reason
    const pn = (k) => PRAYER_NAMES[k]?.[lang] || PRAYER_NAMES[k]?.en || k
    if (r.kind === 'after') return fill(r.prayer === 'isha' ? t.afterIsha : t.afterFajr, { time: secsToHm(r.at) })
    if (r.kind === 'iftar') return fill(t.iftarAt, { time: secsToHm(r.at) })
    if (r.kind === 'next') return fill(t.next, { prayer: pn(r.prayer), time: secsToHm(r.at) })
    if (r.kind === 'fast') return t[r.r] || ''
    if (r.kind === 'tomorrowFriday') return t.fridayWhy
    if (r.kind === 'hijri' && data.hijri) return formatHijri(data.hijri, lang)
    return ''
  }

  return (
    <section className="ui-section ui-section--tight hp-now" aria-labelledby="hp-now-ttl" data-testid="now-for-you">
      <div className="ui-container">
        <div className="hp-now__head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="hp-now-ttl" className="ui-title ui-title--sm">{t.title}</h2>
        </div>
        {items ? (
          <ul className="hp-now__list" data-count={items.length}>
            {items.map((it) => {
              const href = `${pathFor(it.page, lang, it.param)}${it.hash ? `#${it.hash}` : ''}`
              const onClick = (e) => {
                if (!isPlainClick(e)) return
                e.preventDefault()
                navigate(pathFor(it.page, lang, it.param))
                window.scrollTo(0, 0)
                if (it.hash) scrollToWhenReady(it.hash)
              }
              return (
                <li key={it.id} className="hp-now__li">
                  <a className="ui-card ui-card--interactive hp-now__item" href={href} onClick={onClick} data-now={it.id}>
                    <span className="ui-icon-tile ui-icon-tile--sm hp-now__ic" aria-hidden="true"><Icon name={it.icon} size={20} /></span>
                    <span className="hp-now__txt">
                      <span className="hp-now__ttl">{t[it.id]}</span>
                      <span className="hp-now__why">{reasonText(it)}</span>
                    </span>
                    <Icon name="arrow" size={16} className="hp-now__go ui-flip-rtl" />
                  </a>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="hp-now__list hp-now__list--skel" aria-busy="true" aria-label={t.loading}>
            <span className="ui-skeleton hp-now__sk" aria-hidden="true" />
            <span className="ui-skeleton hp-now__sk hp-now__sk--2" aria-hidden="true" />
            <span className="ui-skeleton hp-now__sk hp-now__sk--3" aria-hidden="true" />
          </div>
        )}
      </div>
    </section>
  )
}
