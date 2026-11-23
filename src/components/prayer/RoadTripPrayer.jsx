// ═══════════════════════════════════════════════════════
// RoadTripPrayer — "Avtomobil səfərində namaz vaxtları" (/prayer, təyyarə kartının yanında)
//
//   <RoadTripPrayer />            — dil useLang()-dən
//
// • Haradan / haraya: saytın şəhər siyahısı (searchCities), "enlik, uzunluq", siyahıda yoxdursa — "Dünyada axtar"
//   (Open-Meteo geocoding — CityPicker ilə eyni, CSP-də artıq icazəlidir). Seçim saytın namaz şəhərini DƏYİŞMİR.
// • Çıxış vaxtı (başlanğıc şəhərin saatı ilə), orta sürət, istəyə görə yol məsafəsi (naviqatordan) və dayanacaqlar.
//   Marşrutlaşdırma xidməti YOXDUR — yol düz xətt (böyük dairə) kimi götürülür; bunu dürüst yazırıq.
// • Səfər boyu girən namaz vaxtları — utils/roadTrip (flightPrayer-in eyni hesabı, saytın təriflərilə,
//   metod istifadəçinin yerinə görə, əsr — məzhəb seçimi; yalnız bu hesab üçün dəyişmək olar).
// • Hər an: başlanğıc və təyinat saatı, təxmini km, ən yaxın böyük şəhər; dayananda məscid axtarışına keçid.
// • Qəsr/cəm barədə ÖZ HÖKMÜMÜZ YOXDUR: yalnız saytın "Səfər namazı" dərsinə keçid, məsafə barədə — "alimlər fərqli rəydədir".
// • İstifadəçi vəziyyəti (şəhər, metod, məzhəb, tarix) yalnız mount-dan sonra oxunur.
// ═══════════════════════════════════════════════════════
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { isPlainClick } from '../PageLink'
import { useLang } from '../../contexts/LangContext'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { getPrayerLocation, searchCities, searchWorldPlaces, nearestCity, PRAYER_CITIES } from '../../utils/prayerLocation'
import { CALC_METHODS } from '../../utils/prayCalc'
import { currentAsrFactor } from '../../utils/madhab'
import { PRAYER_NAMES } from '../../hooks/usePrayerTimes'
import { zonedToUtc, utcToZoned, parseLatLng, methodKeyFor, fmtDuration } from '../../utils/flightPrayer'
import { planTrip, tripEvents, periodAt, parseNum, fracOf, DEFAULT_SPEED } from '../../utils/roadTrip'
import '../../styles/RoadTripPrayer.css'

// Ru: rəqəmdən sonra sözün forması — bütöv ifadə üçün
const ruForm = (n, one, few, many) => {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}

const T = {
  az: {
    ey: 'Səfər', title: 'Avtomobil səfərində namaz vaxtları', lead: 'Yola çıxmazdan əvvəl baxın: səfər boyu hansı namaz vaxtları girir, təxminən harada və saat neçədə.',
    from: 'Haradan', to: 'Haraya', place: 'Şəhər və ya «enlik, uzunluq»', world: 'Dünyada axtar', searching: 'Axtarılır…', worldNone: 'Heç nə tapılmadı.', worldErr: 'Axtarış alınmadı — internet bağlantısını yoxlayın.',
    found: (n) => `${n} nəticə`,
    dep: 'Çıxış vaxtı (başlanğıc şəhərin saatı ilə)', speed: 'Orta sürət, km/saat', road: 'Yol məsafəsi, km (istəyə görə)', roadHint: (k) => `Naviqatordan yazın. Boşdursa — düz xətt: ${k} km`, stops: 'Dayanacaqlar cəmi, dəqiqə (istəyə görə)',
    method: 'Hesab metodu', abubakr: 'Bakı, Əbu Bəkr məscidi (sübh 18.5°, işa +90 dəq)', diyanet: 'Diyanət (sübh 18°, işa 17°)', hanafi: 'Əsr — Hənəfi (kölgə 2×)',
    go: 'Hesabla',
    err: { place: 'Şəhər tapılmadı — siyahıdan seçin, «Dünyada axtar» düyməsini basın və ya «40.4, 49.9» kimi yazın.', dep: 'Çıxış vaxtını seçin.', speed: 'Orta sürəti 10–200 km/s arasında yazın.', road: 'Yol məsafəsi düz xətdən qısa ola bilməz.', long: 'Bu planlayıcı 72 saata qədər olan səfərlər üçündür.', same: 'Başlanğıc və təyinat eyni yerdir.' },
    dist: 'Məsafə', straight: 'düz xətt', roadKm: 'yol', dur: 'Yolda', arrive: 'Çatma', km: 'km',
    atDep: 'Çıxanda', atArr: 'Çatanda', since: (p, hm) => `${p} vaxtı (${hm}-dən)`, afterSun: (hm) => `Sübh vaxtı günəşin çıxması ilə bitib (${hm})`, unknown: 'Hesablanmadı',
    count: (n) => (n === 0 ? 'Səfər boyu yeni namaz vaxtı girmir.' : `Səfər boyu ${n} namaz vaxtı girir`),
    start: 'Yola çıxış', end: 'Çatma', into: 'Yola çıxandan', fromStart: (k) => `başlanğıcdan ≈ ${k} km`, near: (c, k) => `${c} yaxınlığı (~${k} km)`, coords: 'Təxmini yer',
    mosques: 'Dayananda: yaxınlıqdakı məscidlər', sunriseNote: 'Sübh vaxtının sonu',
    timeline: 'Səfərin zaman xətti',
    model: 'Hesab təxminidir: yol düz xətt kimi götürülür, sürət sabitdir; yer və saat real marşrutdan fərqli ola bilər. Dayananda yerli vaxtı yenidən yoxlayın.',
    qasr: 'Səfərdə namazın qısaldılması (qəsr) və birləşdirilməsi (cəm): səfər sayılan məsafə və şərtlər barədə alimlər fərqli rəydədir. Ətraflı — saytın dərsində:', lesson: 'Səfər namazı: qəsr və cəm',
  },
  en: {
    ey: 'Travel', title: 'Prayer times on a road trip', lead: 'Check before you set off: which prayer times begin during the drive, roughly where and at what time.',
    from: 'From', to: 'To', place: 'City or “lat, lng”', world: 'Search worldwide', searching: 'Searching…', worldNone: 'Nothing found.', worldErr: 'The search failed — check your internet connection.',
    found: (n) => (n === 1 ? '1 result' : `${n} results`),
    dep: 'Departure (local time at the start)', speed: 'Average speed, km/h', road: 'Road distance, km (optional)', roadHint: (k) => `Take it from your navigation app. If empty — straight line: ${k} km`, stops: 'Total stops, minutes (optional)',
    method: 'Calculation method', abubakr: 'Baku, Abu Bakr mosque (Fajr 18.5°, Isha +90 min)', diyanet: 'Diyanet (Fajr 18°, Isha 17°)', hanafi: 'Asr — Hanafi (shadow 2×)',
    go: 'Calculate',
    err: { place: 'City not found — pick one from the list, press “Search worldwide” or type “40.4, 49.9”.', dep: 'Choose the departure time.', speed: 'Enter an average speed between 10 and 200 km/h.', road: 'The road distance can’t be shorter than the straight line.', long: 'This planner is for trips of up to 72 hours.', same: 'The start and the destination are the same place.' },
    dist: 'Distance', straight: 'straight line', roadKm: 'road', dur: 'On the road', arrive: 'Arrival', km: 'km',
    atDep: 'At departure', atArr: 'On arrival', since: (p, hm) => `${p} time (since ${hm})`, afterSun: (hm) => `Fajr time ended at sunrise (${hm})`, unknown: 'Not calculated',
    count: (n) => (n === 0 ? 'No new prayer time begins during the trip.' : n === 1 ? '1 prayer time begins during the trip' : `${n} prayer times begin during the trip`),
    start: 'Departure', end: 'Arrival', into: 'Into the trip', fromStart: (k) => `≈ ${k} km from the start`, near: (c, k) => `near ${c} (~${k} km)`, coords: 'Approximate position',
    mosques: 'When you stop: mosques nearby', sunriseNote: 'End of Fajr time',
    timeline: 'Trip timeline',
    model: 'This is an estimate: the road is taken as a straight line at constant speed, so the real place and time may differ. Check the local time again when you stop.',
    qasr: 'Shortening (qasr) and combining (jamʿ) prayers while travelling: scholars differ on the distance that counts as travel and on the conditions. Read more in the site’s lesson:', lesson: 'The Traveller’s Prayer: Shortening and Combining',
  },
  ru: {
    ey: 'В пути', title: 'Время намаза в поездке на машине', lead: 'Посмотрите перед выездом: какие времена намаза наступят в дороге, примерно где и во сколько.',
    from: 'Откуда', to: 'Куда', place: 'Город или «широта, долгота»', world: 'Искать по всему миру', searching: 'Поиск…', worldNone: 'Ничего не найдено.', worldErr: 'Поиск не удался — проверьте подключение к интернету.',
    found: (n) => `${n} ${ruForm(n, 'результат', 'результата', 'результатов')}`,
    dep: 'Выезд (местное время в начале пути)', speed: 'Средняя скорость, км/ч', road: 'Расстояние по дороге, км (необязательно)', roadHint: (k) => `Возьмите из навигатора. Если пусто — по прямой: ${k} км`, stops: 'Остановки всего, минут (необязательно)',
    method: 'Метод расчёта', abubakr: 'Баку, мечеть Абу Бакр (фаджр 18,5°, иша +90 мин)', diyanet: 'Диянет (фаджр 18°, иша 17°)', hanafi: 'Аср — ханафитский (тень 2×)',
    go: 'Рассчитать',
    err: { place: 'Город не найден — выберите из списка, нажмите «Искать по всему миру» или введите «40.4, 49.9».', dep: 'Выберите время выезда.', speed: 'Укажите среднюю скорость от 10 до 200 км/ч.', road: 'Расстояние по дороге не может быть меньше, чем по прямой.', long: 'Этот планировщик рассчитан на поездки до 72 часов.', same: 'Начало и конец пути — одно и то же место.' },
    dist: 'Расстояние', straight: 'по прямой', roadKm: 'по дороге', dur: 'В пути', arrive: 'Прибытие', km: 'км',
    atDep: 'При выезде', atArr: 'По прибытии', since: (p, hm) => `Время ${p} (с ${hm})`, afterSun: (hm) => `Время фаджра закончилось с восходом (${hm})`, unknown: 'Не рассчитано',
    count: (n) => (n === 0 ? 'За время поездки новое время намаза не наступает.' : `Времена намаза, которые наступят в пути: ${n}`),
    start: 'Выезд', end: 'Прибытие', into: 'С начала пути', fromStart: (k) => `≈ ${k} км от начала`, near: (c, k) => `около: ${c} (~${k} км)`, coords: 'Примерное место',
    mosques: 'На остановке: мечети поблизости', sunriseNote: 'Конец времени фаджра',
    timeline: 'Шкала поездки',
    model: 'Расчёт приблизительный: дорога считается прямой, скорость — постоянной, поэтому реальные место и время могут отличаться. На остановке проверьте местное время ещё раз.',
    qasr: 'Сокращение (каср) и объединение (джам‘) намазов в пути: учёные расходятся во мнениях о расстоянии, которое считается поездкой, и об условиях. Подробнее — в уроке на сайте:', lesson: 'Намаз путника: сокращение (каср) и объединение',
  },
  tr: {
    ey: 'Yolculuk', title: 'Araba yolculuğunda namaz vakitleri', lead: 'Yola çıkmadan önce bakın: yolculuk boyunca hangi namaz vakitleri giriyor, yaklaşık nerede ve saat kaçta.',
    from: 'Nereden', to: 'Nereye', place: 'Şehir veya “enlem, boylam”', world: 'Dünyada ara', searching: 'Aranıyor…', worldNone: 'Hiçbir şey bulunamadı.', worldErr: 'Arama yapılamadı — internet bağlantınızı kontrol edin.',
    found: (n) => `${n} sonuç`,
    dep: 'Çıkış (başlangıç şehrinin yerel saati)', speed: 'Ortalama hız, km/sa', road: 'Yol mesafesi, km (isteğe bağlı)', roadHint: (k) => `Navigasyon uygulamanızdan alın. Boşsa — kuş uçuşu: ${k} km`, stops: 'Toplam mola, dakika (isteğe bağlı)',
    method: 'Hesap yöntemi', abubakr: 'Bakü, Ebu Bekir Camii (imsak 18,5°, yatsı +90 dk)', diyanet: 'Diyanet (imsak 18°, yatsı 17°)', hanafi: 'İkindi — Hanefi (gölge 2×)',
    go: 'Hesapla',
    err: { place: 'Şehir bulunamadı — listeden seçin, “Dünyada ara”ya basın veya “40.4, 49.9” yazın.', dep: 'Çıkış saatini seçin.', speed: 'Ortalama hızı 10–200 km/sa arasında yazın.', road: 'Yol mesafesi kuş uçuşundan kısa olamaz.', long: 'Bu planlayıcı 72 saate kadar olan yolculuklar içindir.', same: 'Başlangıç ve varış aynı yer.' },
    dist: 'Mesafe', straight: 'kuş uçuşu', roadKm: 'yol', dur: 'Yolda', arrive: 'Varış', km: 'km',
    atDep: 'Çıkışta', atArr: 'Varışta', since: (p, hm) => `${p} vakti (${hm}’den beri)`, afterSun: (hm) => `Sabah vakti güneşin doğuşuyla bitti (${hm})`, unknown: 'Hesaplanamadı',
    count: (n) => (n === 0 ? 'Yolculuk boyunca yeni bir namaz vakti girmiyor.' : `Yolculuk boyunca ${n} namaz vakti giriyor`),
    start: 'Çıkış', end: 'Varış', into: 'Yola çıkıştan sonra', fromStart: (k) => `başlangıçtan ≈ ${k} km`, near: (c, k) => `${c} yakını (~${k} km)`, coords: 'Yaklaşık konum',
    mosques: 'Mola verince: yakındaki camiler', sunriseNote: 'Sabah vaktinin sonu',
    timeline: 'Yolculuğun zaman çizelgesi',
    model: 'Hesap yaklaşıktır: yol düz bir çizgi, hız sabit kabul edildi; gerçek yer ve saat farklı olabilir. Mola verdiğinizde yerel vakti yeniden kontrol edin.',
    qasr: 'Yolculukta namazların kısaltılması (kasr) ve birleştirilmesi (cem): yolculuk sayılan mesafe ve şartlar hakkında âlimler farklı görüştedir. Ayrıntılar sitenin dersinde:', lesson: 'Yolcu Namazı: Kasr ve Cem',
  },
  ar: {
    ey: 'السفر', title: 'مواقيت الصلاة في السفر بالسيارة', lead: 'اطّلع قبل الانطلاق: أيّ أوقات الصلاة تدخل أثناء الطريق، وأين تقريبًا، وفي أيّ ساعة.',
    from: 'من', to: 'إلى', place: 'مدينة أو «العرض، الطول»', world: 'ابحث في العالم', searching: 'جارٍ البحث…', worldNone: 'لا نتائج.', worldErr: 'تعذّر البحث — تحقّق من الاتصال بالإنترنت.',
    found: (n) => (n === 1 ? 'نتيجة واحدة' : n === 2 ? 'نتيجتان' : n <= 10 ? `${n} نتائج` : `${n} نتيجة`),
    dep: 'الانطلاق (بالتوقيت المحلي لمكان البداية)', speed: 'متوسط السرعة، كم/س', road: 'مسافة الطريق، كم (اختياري)', roadHint: (k) => `خذها من تطبيق الملاحة. إن تُركت فارغة — خط مستقيم: ${k} كم`, stops: 'مجموع التوقفات بالدقائق (اختياري)',
    method: 'طريقة الحساب', abubakr: 'باكو، مسجد أبي بكر (الفجر 18.5°، العشاء +90 دقيقة)', diyanet: 'رئاسة الشؤون الدينية التركية (الفجر 18°، العشاء 17°)', hanafi: 'العصر — الحنفي (الظل مثلان)',
    go: 'احسب',
    err: { place: 'لم نجد المدينة — اخترها من القائمة، أو اضغط «ابحث في العالم»، أو اكتب «40.4, 49.9».', dep: 'اختر وقت الانطلاق.', speed: 'أدخل متوسط سرعة بين 10 و200 كم/س.', road: 'لا يمكن أن تكون مسافة الطريق أقصر من الخط المستقيم.', long: 'هذا المخطِّط للرحلات التي لا تتجاوز 72 ساعة.', same: 'البداية والوجهة مكان واحد.' },
    dist: 'المسافة', straight: 'خط مستقيم', roadKm: 'الطريق', dur: 'في الطريق', arrive: 'الوصول', km: 'كم',
    atDep: 'عند الانطلاق', atArr: 'عند الوصول', since: (p, hm) => `وقت ${p} (منذ ${hm})`, afterSun: (hm) => `انتهى وقت الفجر بطلوع الشمس (${hm})`, unknown: 'لم يُحسب',
    count: (n) => (n === 0 ? 'لا يدخل وقت صلاة جديد أثناء الرحلة.' : n === 1 ? 'يدخل وقت صلاة واحد أثناء الرحلة' : n === 2 ? 'يدخل وقتا صلاة أثناء الرحلة' : n <= 10 ? `تدخل ${n} أوقات صلاة أثناء الرحلة` : `يدخل ${n} وقتًا للصلاة أثناء الرحلة`),
    start: 'الانطلاق', end: 'الوصول', into: 'منذ الانطلاق', fromStart: (k) => `≈ ${k} كم من البداية`, near: (c, k) => `قرب ${c} (~${k} كم)`, coords: 'الموقع التقريبي',
    mosques: 'عند التوقف: مساجد قريبة', sunriseNote: 'نهاية وقت الفجر',
    timeline: 'الخط الزمني للرحلة',
    model: 'الحساب تقريبي: يُعامل الطريق كخط مستقيم بسرعة ثابتة، فقد يختلف المكان والوقت الحقيقيان. تحقّق من الوقت المحلي مجددًا عند التوقف.',
    qasr: 'قصر الصلاة وجمعها في السفر: اختلف العلماء في المسافة التي تُعدّ سفرًا وفي الشروط. التفصيل في درس الموقع:', lesson: 'صلاة المسافر: القصر والجمع',
  },
}

const KIND_ICON = { fajr: 'moonStar', sunrise: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }

const fmtCache = new Map()
function fmtTime(ms, tz, lang) {
  const key = `${lang}|${tz}`
  let f = fmtCache.get(key)
  if (!f) {
    const o = { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
    try { f = new Intl.DateTimeFormat(lang, o) } catch { f = new Intl.DateTimeFormat('en', o) }
    fmtCache.set(key, f)
  }
  return f.format(new Date(ms))
}
const numFmt = new Map()
function fmtNum(n, lang) {
  let f = numFmt.get(lang)
  if (!f) { try { f = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }) } catch { f = new Intl.NumberFormat('en') } numFmt.set(lang, f) }
  return f.format(n)
}

const cityLabel = (c, lang) => (c.label && (c.label[lang] || c.label.en)) || c.name || ''
const fromCity = (c, lang) => ({ lat: c.lat, lng: c.lng, tz: c.tz, label: cityLabel(c, lang) })
const fromWorld = (p) => ({ lat: p.lat, lng: p.lng, tz: p.tz, label: [p.name, p.region, p.countryName].filter(Boolean).join(', ') })

/** Mətn → yer: seçilmiş, "enlik, uzunluq" və ya siyahının ilk nəticəsi */
function resolvePlace(q, sel, lang) {
  const s = q.trim()
  if (!s) return null
  if (sel && s === sel.label) return sel
  const ll = parseLatLng(s)
  if (ll) { const n = nearestCity(ll.lat, ll.lng); return { ...ll, tz: n?.city.tz || 'UTC', label: s } }
  const hit = searchCities(s)[0]
  return hit ? fromCity(hit, lang) : null
}

function PlaceField({ id, label, hint, value, onChange, onPick, lang, t }) {
  const [open, setOpen] = useState(false)
  const [world, setWorld] = useState({ status: 'idle', list: [] })
  const ctrl = useRef(null)
  const local = useMemo(() => (value.trim() ? searchCities(value).slice(0, 6).map(c => ({ key: `c-${c.id}`, p: fromCity(c, lang), sub: c.country })) : []), [value, lang])
  const list = world.status === 'done' ? world.list : local
  const exact = list.length === 1 && list[0].p.label === value
  const show = open && list.length > 0 && !exact
  useEffect(() => () => ctrl.current?.abort(), [])
  const searchWorld = async () => {
    ctrl.current?.abort()
    const c = typeof AbortController !== 'undefined' ? new AbortController() : null
    ctrl.current = c
    setWorld({ status: 'loading', list: [] })
    try {
      const res = await searchWorldPlaces(value, lang, c?.signal)
      setWorld({ status: 'done', list: res.slice(0, 8).map(p => ({ key: `w-${p.gid}`, p: fromWorld(p), sub: p.country })) })
      setOpen(true)
    } catch (e) {
      if (e?.name !== 'AbortError') setWorld({ status: 'error', list: [] })
    }
  }
  const pick = (p) => { onPick(p); setOpen(false); setWorld({ status: 'idle', list: [] }) }
  const statusTxt = world.status === 'loading' ? t.searching
    : world.status === 'error' ? t.worldErr
      : world.status === 'done' ? (world.list.length ? t.found(world.list.length) : t.worldNone)
        : (show ? t.found(list.length) : '')
  return (
    <div className="rtp__field rtp__place">
      <label htmlFor={`rtp-${id}`}>{label}</label>
      <div className="rtp__placerow">
        <input id={`rtp-${id}`} data-testid={`rtp-${id}`} className="ui-input" type="text" autoComplete="off" placeholder={hint}
          value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); if (world.status !== 'idle') setWorld({ status: 'idle', list: [] }) }}
          onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' && show) { e.preventDefault(); pick(list[0].p) } else if (e.key === 'Escape') setOpen(false) }}
          role="combobox" aria-autocomplete="list" aria-expanded={show} aria-controls={show ? `rtp-${id}-list` : undefined} aria-describedby={`rtp-${id}-st`} />
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm rtp__world" onClick={searchWorld}
          disabled={value.trim().length < 2 || world.status === 'loading'} data-testid={`rtp-${id}-world`}>
          <Icon name="globe" size={14} /> {t.world}
        </button>
      </div>
      <p id={`rtp-${id}-st`} className="rtp__st" role="status">{statusTxt}</p>
      {show && (
        <ul id={`rtp-${id}-list`} className="rtp__sugg">
          {list.map(x => (
            <li key={x.key}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(x.p)}>
                <Icon name="pin" size={14} /> <span>{x.p.label}</span> {x.sub ? <small>{x.sub}</small> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function RoadTripPrayer() {
  const { lang = 'az' } = useLang() || {}
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const uid = useId().replace(/:/g, '')
  const [ready, setReady] = useState(false)
  const [fromQ, setFromQ] = useState('')
  const [toQ, setToQ] = useState('')
  const [fromSel, setFromSel] = useState(null)
  const [toSel, setToSel] = useState(null)
  const [dep, setDep] = useState('')
  const [speed, setSpeed] = useState(String(DEFAULT_SPEED))
  const [road, setRoad] = useState('')
  const [stops, setStops] = useState('')
  const [methodKey, setMethodKey] = useState('abubakr')
  const [hanafi, setHanafi] = useState(false)
  const [plan, setPlan] = useState(null)
  const [err, setErr] = useState('')
  const resultRef = useRef(null)

  // Şəxsi vəziyyət yalnız mount-dan sonra: saytın namaz şəhəri, metod, məzhəb, sabahın tarixi
  useEffect(() => {
    const loc = getPrayerLocation()
    const own = PRAYER_CITIES.find(c => c.id === loc.id)
    const from = own ? fromCity(own, lang) : { lat: loc.lat, lng: loc.lng, tz: loc.tz, label: (loc.city && (loc.city[lang] || loc.city.en)) || `${loc.lat}, ${loc.lng}` }
    setFromSel(from); setFromQ(from.label)
    setDep(`${utcToZoned(Date.now() + 86400000, from.tz).slice(0, 10)}T08:00`)
    setMethodKey(methodKeyFor(loc.method))
    setHanafi(currentAsrFactor() === 2)
    setReady(true)
  }, [lang])

  const straightPreview = useMemo(() => {
    const a = resolvePlace(fromQ, fromSel, lang), b = resolvePlace(toQ, toSel, lang)
    if (!a || !b) return null
    const p = planTrip({ from: a, to: b, depMs: 0 })
    return Math.round(p.straightKm)
  }, [fromQ, toQ, fromSel, toSel, lang])

  const go = () => {
    const from = resolvePlace(fromQ, fromSel, lang), to = resolvePlace(toQ, toSel, lang)
    if (!from || !to) { setErr(t.err.place); return }
    const depMs = zonedToUtc(dep, from.tz)
    if (!Number.isFinite(depMs)) { setErr(t.err.dep); return }
    const sp = parseNum(speed)
    const p = planTrip({ from, to, depMs, speedKmh: sp ?? 0, roadKm: parseNum(road), stopMin: parseNum(stops) || 0 })
    if (!p.ok) { setErr(t.err[p.error] || t.err.place); return }
    setErr('')
    setFromSel(from); setToSel(to); setFromQ(from.label); setToQ(to.label)
    setPlan({ from, to, depMs, ...p })
    requestAnimationFrame(() => resultRef.current?.focus())
  }

  const method = useMemo(() => ({ ...CALC_METHODS[methodKey], asrFactor: hanafi ? 2 : 1 }), [methodKey, hanafi])
  const events = useMemo(() => (plan ? tripEvents({ ...plan, method }) : []), [plan, method])
  const periods = useMemo(() => (plan ? { dep: periodAt(plan.from, plan.depMs, method), arr: periodAt(plan.to, plan.arriveMs, method) } : null), [plan, method])

  const onNav = (e, key, param) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    navigate(pathFor(key, lang, param))
    window.scrollTo(0, 0)
  }
  const pName = (k) => pickUi(PRAYER_NAMES[k], lang, 'en')
  const periodTxt = (pr, tz) => {
    if (!pr) return t.unknown
    const hm = fmtTime(pr.ms, tz, lang)
    return pr.kind === 'sunrise' ? t.afterSun(hm) : t.since(pName(pr.kind), hm)
  }
  const where = (e) => (e.near ? t.near(cityLabel(e.near.city, lang), fmtNum(Math.round(e.near.km / 10) * 10, lang)) : `${e.lat.toFixed(2)}, ${e.lng.toFixed(2)}`)
  const sameTz = plan && plan.from.tz === plan.to.tz
  const mosquesHref = pathFor('mosques', lang)
  const lessonHref = pathFor('learn', lang, 'travel-prayer')

  return (
    <section className="ui-card rtp" data-testid="road-trip-prayer" data-ready={ready ? '1' : '0'} data-events={plan ? events.length : ''} aria-labelledby={`${uid}-t`}>
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id={`${uid}-t`} className="rtp__title"><Icon name="onroad" size={22} /> {t.title}</h2>
      <p className="rtp__lead">{t.lead}</p>

      <form className="rtp__form" onSubmit={(e) => { e.preventDefault(); go() }} noValidate>
        <PlaceField id="from" label={t.from} hint={t.place} value={fromQ} onChange={setFromQ} onPick={(p) => { setFromSel(p); setFromQ(p.label) }} lang={lang} t={t} />
        <PlaceField id="to" label={t.to} hint={t.place} value={toQ} onChange={setToQ} onPick={(p) => { setToSel(p); setToQ(p.label) }} lang={lang} t={t} />
        <div className="rtp__field">
          <label htmlFor={`${uid}-dep`}>{t.dep}</label>
          <input id={`${uid}-dep`} data-testid="rtp-dep" className="ui-input" type="datetime-local" value={dep} onChange={(e) => setDep(e.target.value)} />
        </div>
        <div className="rtp__field">
          <label htmlFor={`${uid}-speed`}>{t.speed}</label>
          <input id={`${uid}-speed`} data-testid="rtp-speed" className="ui-input" type="number" inputMode="numeric" min="10" max="200" step="5" value={speed} onChange={(e) => setSpeed(e.target.value)} />
        </div>
        <div className="rtp__field">
          <label htmlFor={`${uid}-road`}>{t.road}</label>
          <input id={`${uid}-road`} data-testid="rtp-road" className="ui-input" type="number" inputMode="numeric" min="1" step="1" value={road}
            placeholder={straightPreview != null ? String(straightPreview) : ''} onChange={(e) => setRoad(e.target.value)} aria-describedby={`${uid}-roadh`} />
          <small id={`${uid}-roadh`} className="rtp__hint">{straightPreview != null ? t.roadHint(fmtNum(straightPreview, lang)) : ''}</small>
        </div>
        <div className="rtp__field">
          <label htmlFor={`${uid}-stops`}>{t.stops}</label>
          <input id={`${uid}-stops`} data-testid="rtp-stops" className="ui-input" type="number" inputMode="numeric" min="0" step="5" value={stops} onChange={(e) => setStops(e.target.value)} />
        </div>
        <div className="rtp__opts" role="group" aria-label={t.method}>
          <span className="rtp__optl" aria-hidden="true">{t.method}</span>
          {['abubakr', 'diyanet'].map(k => (
            <button key={k} type="button" className="ui-chip" aria-pressed={methodKey === k} onClick={() => setMethodKey(k)} data-testid={`rtp-m-${k}`}>{t[k]}</button>
          ))}
          <button type="button" className="ui-chip" aria-pressed={hanafi} onClick={() => setHanafi(v => !v)} data-testid="rtp-hanafi">{t.hanafi}</button>
        </div>
        <button type="submit" className="ui-btn ui-btn--primary rtp__go" data-testid="rtp-go" disabled={!ready}><Icon name="clock" size={16} /> {t.go}</button>
        {err && <p className="rtp__err" role="alert" data-testid="rtp-err">{err}</p>}
      </form>

      {plan && (
        <div className="rtp__result" ref={resultRef} tabIndex={-1} aria-labelledby={`${uid}-sum`} data-testid="rtp-result">
          <p id={`${uid}-sum`} className="rtp__sum">
            <b>{plan.from.label}</b> → <b>{plan.to.label}</b>
          </p>
          <dl className="rtp__stats">
            <div><dt>{t.dist}</dt><dd className="ui-num">{fmtNum(Math.round(plan.km), lang)} {t.km} <small>({parseNum(road) ? t.roadKm : t.straight})</small></dd></div>
            <div><dt>{t.dur}</dt><dd className="ui-num">{fmtDuration(plan.durMin)}</dd></div>
            <div><dt>{t.arrive}</dt><dd className="ui-num">{fmtTime(plan.arriveMs, plan.to.tz, lang)}</dd></div>
            <div><dt>{t.atDep}</dt><dd>{periodTxt(periods?.dep, plan.from.tz)}</dd></div>
            <div><dt>{t.atArr}</dt><dd>{periodTxt(periods?.arr, plan.to.tz)}</dd></div>
          </dl>

          <p className="rtp__count" role="status" data-testid="rtp-count">{t.count(events.filter(e => e.kind !== 'sunrise').length)}</p>

          {/* Zaman xətti (vizual) — siyahı ekran oxuyucusu üçün əsasdır */}
          <div className="rtp__bar" aria-hidden="true" title={t.timeline}>
            <span className="rtp__bar-line" />
            {events.map((e, i) => (
              <span key={i} className={`rtp__mark rtp__mark--${e.kind}`} style={{ insetInlineStart: `${fracOf(e.ms, plan.depMs, plan.durMin) * 100}%` }}>
                <Icon name={KIND_ICON[e.kind]} size={12} />
              </span>
            ))}
          </div>

          <ol className="rtp__events" aria-label={t.timeline}>
            <li className="rtp__item rtp__item--start">
              <div className="rtp__ihead"><span className="rtp__dot"><Icon name="pin" size={16} /></span><strong>{t.start}</strong><span className="rtp__el ui-num">{fmtTime(plan.depMs, plan.from.tz, lang)}</span></div>
              <p className="rtp__pos">{plan.from.label}</p>
            </li>
            {events.map((e, i) => (
              <li key={i} className={`rtp__item rtp__item--${e.kind}`} data-testid="rtp-event" data-event={e.kind}>
                <div className="rtp__ihead">
                  <span className="rtp__dot"><Icon name={KIND_ICON[e.kind]} size={16} /></span>
                  <strong>{e.kind === 'sunrise' ? `${pName('sunrise')} · ${t.sunriseNote}` : pName(e.kind)}</strong>
                  <span className="rtp__el ui-num">+{fmtDuration(e.elapsedMin)}</span>
                </div>
                <dl className="rtp__idl">
                  <div><dt>{plan.from.label}</dt><dd className="ui-num">{fmtTime(e.ms, plan.from.tz, lang)}</dd></div>
                  {!sameTz && <div><dt>{plan.to.label}</dt><dd className="ui-num">{fmtTime(e.ms, plan.to.tz, lang)}</dd></div>}
                  <div className="rtp__wide"><dt>{t.coords}</dt><dd>{where(e)} · <span className="ui-num">{t.fromStart(fmtNum(e.km, lang))}</span></dd></div>
                </dl>
                {e.kind !== 'sunrise' && (
                  <a className="rtp__link" href={mosquesHref} onClick={(ev) => onNav(ev, 'mosques')}><Icon name="mosques" size={14} /> {t.mosques}</a>
                )}
              </li>
            ))}
            <li className="rtp__item rtp__item--end">
              <div className="rtp__ihead"><span className="rtp__dot"><Icon name="pin" size={16} /></span><strong>{t.end}</strong><span className="rtp__el ui-num">{fmtTime(plan.arriveMs, plan.to.tz, lang)}</span></div>
              <p className="rtp__pos">{plan.to.label} · <span className="ui-num">+{fmtDuration(plan.durMin)}</span></p>
            </li>
          </ol>
        </div>
      )}

      <ul className="rtp__notes">
        <li>{t.model}</li>
        <li className="rtp__qasr">
          <Icon name="learn" size={14} />
          <span>{t.qasr} <a href={lessonHref} onClick={(e) => onNav(e, 'learn', 'travel-prayer')} data-testid="rtp-lesson">{t.lesson}</a></span>
        </li>
      </ul>
    </section>
  )
}

