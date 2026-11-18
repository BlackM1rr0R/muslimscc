// ═══════════════════════════════════════════════════════
// FlightPrayer (v8) — "Təyyarədə namaz vaxtları"
//
//   <FlightPrayer />            — dil useLang()-dən
//
// • Çıxış və gəliş şəhəri (saytın şəhər siyahısı — searchCities; "enlik, uzunluq" da yazmaq olar),
//   çıxış vaxtı (çıxış şəhərinin saatı ilə, IANA qurşağı Intl ilə), uçuş müddəti (s:dd).
// • Marşrut böyük dairədir, sürət sabit; hər dəqiqədə təyyarənin yerində Günəşin hündürlüyü
//   hesablanır (utils/flightPrayer.js). Sübh, günəşin çıxması, zöhr, əsr, məğrib, işa — saytın
//   namaz hesabının EYNİ tərifləri ilə (utils/prayCalc.js → CALC_METHODS; metod istifadəçinin yerinə görə,
//   dəyişmək və Hənəfi əsrini seçmək olar).
// • Hər hadisə: çıxış və gəliş qurşağında saat, uçuşun neçənci dəqiqəsi, təyyarənin yeri (ən yaxın böyük
//   şəhər), Kəbəyə böyük dairə istiqaməti — şimala və uçuş xəttinə görə (təyyarənin burnu məlum deyil).
// • Xəritə: d3-geo + world-atlas qurusu, marşrut, sürgüdəki an üçün gecə-gündüz sərhədi, hadisə nöqtələri.
// • Fiqh hökmü verilmir: səfərdə qəsr/cəm üçün alimə müraciət qeydi; uçuş hündürlüyündə üfüqün enməsi — qeyd.
// Stillər: src/styles/FlightPrayer.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import { geoEqualEarth, geoPath, geoCircle } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { getPrayerLocation, searchCities, nearestCity, PRAYER_CITIES } from '../utils/prayerLocation'
import { CALC_METHODS } from '../utils/prayCalc'
import { currentAsrFactor } from '../utils/madhab'
import { KAABA } from '../utils/rasdQibla'
import {
  flightEvents, greatCircle, distanceKm, trackAt, qiblaFrom, horizonDip, zonedToUtc, utcToZoned,
  parseDuration, fmtDuration, parseLatLng, sunAltitude, subsolarPoint, methodKeyFor, SUNSET_ALT,
} from '../utils/flightPrayer'
import '../styles/FlightPrayer.css'

const T = {
  az: {
    ey: 'Səfər', title: 'Təyyarədə namaz vaxtları', lead: 'Uçuş boyu namaz vaxtları harada və saat neçədə girir? Marşrutu, çıxış vaxtını və müddəti yazın — təyyarənin yolu boyunca Günəşin hündürlüyü hər dəqiqə hesablanır.',
    from: 'Haradan', to: 'Haraya', place: 'Şəhər və ya «enlik, uzunluq»', dep: 'Çıxış vaxtı (çıxış şəhərinin saatı ilə)', dur: 'Uçuş müddəti (saat:dəqiqə)', go: 'Hesabla',
    method: 'Hesab metodu', abubakr: 'Bakı, Əbu Bəkr məscidi (sübh 18.5°, işa +90 dəq)', diyanet: 'Diyanət (sübh 18°, işa 17°)', hanafi: 'Əsr — Hənəfi (kölgə 2×)',
    ev: { fajr: 'Sübh vaxtı girir', sunrise: 'Günəş çıxır', dhuhr: 'Zöhr', asr: 'Əsr', maghrib: 'Məğrib', isha: 'İşa' },
    elapsed: 'Uçuşdan sonra', pos: 'Təyyarənin yeri', near: '{c} yaxınlığı (~{k} km)', qibla: 'Qiblə', north: '{n}° (şimaldan saat əqrəbi ilə)',
    right: 'uçuş istiqamətindən ~{n}° sağa', left: 'uçuş istiqamətindən ~{n}° sola', ahead: 'təxminən uçuş istiqamətində', behind: 'təxminən arxaya',
    none: 'Bu uçuş ərzində yeni namaz vaxtı girmir.', errPlace: 'Şəhər tapılmadı — siyahıdan seçin və ya «40.4, 49.9» kimi yazın.', errDur: 'Müddəti «7:45» kimi yazın (10 dəqiqədən 22 saata qədər).', errDep: 'Çıxış vaxtını seçin.',
    slider: 'Uçuşun anı', sunAlt: 'Günəşin hündürlüyü', dist: 'Məsafə', km: 'km', night: 'Gecə', twi: 'Sübh/işa alaqaranlığı', map: 'Marşrut, gecə-gündüz sərhədi və namaz vaxtları', kaaba: 'Kəbə',
    n: 'şm. e.', s: 'c. e.', e: 'ş. u.', w: 'q. u.', dep2: 'Çıxış', arr2: 'Gəliş',
    head: 'Təyyarənin burnunun istiqaməti məlum deyil — qiblə şimala və uçuş xəttinə görə göstərilir.',
    dip: 'Uçuş hündürlüyündə (~11 km) görünən üfüq təxminən {d}° aşağı enir: təyyarədən günəş yerdəkindən bir qədər gec batır və tez çıxır. Vaxtlar burada saytın adi tərifləri ilə hesablanıb.',
    model: 'Hesab təxminidir: marşrut böyük dairə, sürət sabit götürülüb — real uçuş yolu fərqli ola bilər. Günəşin yeri — Meeus düsturları; yüksək enlik düzəlişləri tətbiq olunmur.', // lang-ok[Meeus]: müəllif adı
    scholar: 'Səfərdə namazların qısaldılması və birləşdirilməsi barədə alimə müraciət edin.',
  },
  en: {
    ey: 'Travel', title: 'Prayer times on a plane', lead: 'Where and when do prayer times begin during a flight? Enter the route, departure time and duration — the Sun’s altitude is computed every minute along the aircraft’s path.',
    from: 'From', to: 'To', place: 'City or “lat, lng”', dep: 'Departure (local time of the departure city)', dur: 'Flight duration (h:mm)', go: 'Calculate',
    method: 'Calculation method', abubakr: 'Baku, Abu Bakr mosque (Fajr 18.5°, Isha +90 min)', diyanet: 'Diyanet (Fajr 18°, Isha 17°)', hanafi: 'Asr — Hanafi (shadow 2×)',
    ev: { fajr: 'Fajr begins', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    elapsed: 'Into the flight', pos: 'Aircraft position', near: 'near {c} (~{k} km)', qibla: 'Qibla', north: '{n}° (clockwise from north)',
    right: '~{n}° to the right of the direction of flight', left: '~{n}° to the left of the direction of flight', ahead: 'roughly straight ahead', behind: 'roughly behind',
    none: 'No new prayer time begins during this flight.', errPlace: 'City not found — pick one from the list or type “40.4, 49.9”.', errDur: 'Enter the duration like “7:45” (10 minutes to 22 hours).', errDep: 'Choose the departure time.',
    slider: 'Moment of the flight', sunAlt: 'Sun’s altitude', dist: 'Distance', km: 'km', night: 'Night', twi: 'Fajr/Isha twilight', map: 'Route, day–night line and prayer times', kaaba: 'Kaaba',
    n: 'N', s: 'S', e: 'E', w: 'W', dep2: 'Departure', arr2: 'Arrival',
    head: 'The aircraft’s heading is unknown — the qibla is given relative to north and to the flight track.',
    dip: 'At cruising altitude (~11 km) the visible horizon dips by about {d}°: from the plane the Sun sets a little later and rises a little earlier than on the ground. Times here use the site’s standard definitions.',
    model: 'This is an estimate: a great-circle route at constant speed — the real flight path may differ. Sun position: Meeus formulas; no high-latitude adjustments are applied.',
    scholar: 'Ask a scholar about shortening and combining prayers while travelling.',
  },
  ru: {
    ey: 'В пути', title: 'Время намаза в самолёте', lead: 'Где и когда наступает время намаза в полёте? Укажите маршрут, время вылета и продолжительность — высота Солнца считается каждую минуту вдоль пути самолёта.',
    from: 'Откуда', to: 'Куда', place: 'Город или «широта, долгота»', dep: 'Вылет (местное время города вылета)', dur: 'Время в пути (ч:мм)', go: 'Рассчитать',
    method: 'Метод расчёта', abubakr: 'Баку, мечеть Абу Бакр (фаджр 18,5°, иша +90 мин)', diyanet: 'Диянет (фаджр 18°, иша 17°)', hanafi: 'Аср — ханафитский (тень 2×)',
    ev: { fajr: 'Начало фаджра', sunrise: 'Восход', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша' },
    elapsed: 'С начала полёта', pos: 'Положение самолёта', near: 'около: {c} (~{k} км)', qibla: 'Кибла', north: '{n}° (от севера по часовой)',
    right: '~{n}° правее направления полёта', left: '~{n}° левее направления полёта', ahead: 'примерно по курсу', behind: 'примерно сзади',
    none: 'За время этого полёта новое время намаза не наступает.', errPlace: 'Город не найден — выберите из списка или введите «40.4, 49.9».', errDur: 'Введите время как «7:45» (от 10 минут до 22 часов).', errDep: 'Выберите время вылета.',
    slider: 'Момент полёта', sunAlt: 'Высота Солнца', dist: 'Расстояние', km: 'км', night: 'Ночь', twi: 'Сумерки фаджра/иши', map: 'Маршрут, граница дня и ночи и времена намаза', kaaba: 'Кааба',
    n: 'с. ш.', s: 'ю. ш.', e: 'в. д.', w: 'з. д.', dep2: 'Вылет', arr2: 'Прилёт',
    head: 'Куда смотрит нос самолёта, неизвестно — кибла дана относительно севера и линии полёта.',
    dip: 'На высоте полёта (~11 км) видимый горизонт опускается примерно на {d}°: с самолёта Солнце садится чуть позже и восходит чуть раньше, чем на земле. Здесь время считается по обычным определениям сайта.',
    model: 'Расчёт приблизительный: маршрут — дуга большого круга, скорость постоянна; реальный путь может отличаться. Положение Солнца — формулы Миуса; поправки для высоких широт не применяются.',
    scholar: 'О сокращении и объединении намазов в пути спросите учёного.',
  },
  ar: {
    ey: 'السفر', title: 'مواقيت الصلاة في الطائرة', lead: 'أين ومتى يدخل وقت الصلاة أثناء الرحلة؟ أدخل المسار ووقت الإقلاع ومدة الرحلة — يُحسب ارتفاع الشمس كل دقيقة على طول مسار الطائرة.',
    from: 'من', to: 'إلى', place: 'مدينة أو «العرض، الطول»', dep: 'الإقلاع (بالتوقيت المحلي لمدينة الإقلاع)', dur: 'مدة الرحلة (ساعة:دقيقة)', go: 'احسب',
    method: 'طريقة الحساب', abubakr: 'باكو، مسجد أبي بكر (الفجر 18.5°، العشاء +90 دقيقة)', diyanet: 'رئاسة الشؤون الدينية التركية (الفجر 18°، العشاء 17°)', hanafi: 'العصر — الحنفي (الظل مثلان)',
    ev: { fajr: 'دخول الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
    elapsed: 'منذ الإقلاع', pos: 'موقع الطائرة', near: 'قرب {c} (~{k} كم)', qibla: 'القبلة', north: '{n}° (من الشمال باتجاه عقارب الساعة)',
    right: 'نحو {n}° يمين اتجاه الطيران', left: 'نحو {n}° يسار اتجاه الطيران', ahead: 'تقريبًا في اتجاه الطيران', behind: 'تقريبًا إلى الخلف',
    none: 'لا يدخل وقت صلاة جديد خلال هذه الرحلة.', errPlace: 'لم نجد المدينة — اخترها من القائمة أو اكتب «40.4, 49.9».', errDur: 'اكتب المدة هكذا «7:45» (من 10 دقائق إلى 22 ساعة).', errDep: 'اختر وقت الإقلاع.',
    slider: 'لحظة من الرحلة', sunAlt: 'ارتفاع الشمس', dist: 'المسافة', km: 'كم', night: 'الليل', twi: 'شفق الفجر/العشاء', map: 'المسار وخط الليل والنهار ومواقيت الصلاة', kaaba: 'الكعبة',
    n: 'ش', s: 'ج', e: 'شرقًا', w: 'غربًا', dep2: 'الإقلاع', arr2: 'الوصول',
    head: 'اتجاه مقدمة الطائرة غير معروف — تُعطى القبلة بالنسبة إلى الشمال وإلى خط الطيران.',
    dip: 'على ارتفاع الطيران (~11 كم) ينخفض الأفق المرئي نحو {d}°: فتغرب الشمس من الطائرة متأخرة قليلًا وتشرق مبكرة قليلًا مقارنة بالأرض. والمواقيت هنا محسوبة بتعريفات الموقع المعتادة.',
    model: 'الحساب تقريبي: المسار دائرة عظمى والسرعة ثابتة — وقد يختلف المسار الحقيقي. موضع الشمس بصيغ ميوس، ولا تُطبَّق تعديلات خطوط العرض العليا.',
    scholar: 'اسأل عالمًا عن قصر الصلاة وجمعها في السفر.',
  },
  tr: {
    ey: 'Yolculuk', title: 'Uçakta namaz vakitleri', lead: 'Uçuş boyunca namaz vakitleri nerede ve saat kaçta giriyor? Rotayı, kalkış saatini ve süreyi yazın — uçağın yolu boyunca Güneş’in yüksekliği her dakika hesaplanır.',
    from: 'Nereden', to: 'Nereye', place: 'Şehir veya “enlem, boylam”', dep: 'Kalkış (kalkış şehrinin yerel saati)', dur: 'Uçuş süresi (sa:dk)', go: 'Hesapla',
    method: 'Hesap yöntemi', abubakr: 'Bakü, Ebu Bekir Camii (imsak 18,5°, yatsı +90 dk)', diyanet: 'Diyanet (imsak 18°, yatsı 17°)', hanafi: 'İkindi — Hanefi (gölge 2×)',
    ev: { fajr: 'İmsak (sabah vakti girer)', sunrise: 'Güneş doğar', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
    elapsed: 'Kalkıştan sonra', pos: 'Uçağın konumu', near: '{c} yakını (~{k} km)', qibla: 'Kıble', north: '{n}° (kuzeyden saat yönünde)',
    right: 'uçuş yönünün ~{n}° sağı', left: 'uçuş yönünün ~{n}° solu', ahead: 'yaklaşık uçuş yönünde', behind: 'yaklaşık arkada',
    none: 'Bu uçuş sırasında yeni bir namaz vakti girmiyor.', errPlace: 'Şehir bulunamadı — listeden seçin veya “40.4, 49.9” yazın.', errDur: 'Süreyi “7:45” gibi yazın (10 dakikadan 22 saate kadar).', errDep: 'Kalkış saatini seçin.',
    slider: 'Uçuşun anı', sunAlt: 'Güneş’in yüksekliği', dist: 'Mesafe', km: 'km', night: 'Gece', twi: 'İmsak/yatsı alacakaranlığı', map: 'Rota, gece-gündüz çizgisi ve namaz vakitleri', kaaba: 'Kâbe',
    n: 'K', s: 'G', e: 'D', w: 'B', dep2: 'Kalkış', arr2: 'Varış',
    head: 'Uçağın burnunun yönü bilinmiyor — kıble kuzeye ve uçuş hattına göre verilir.',
    dip: 'Uçuş yüksekliğinde (~11 km) görünen ufuk yaklaşık {d}° alçalır: uçaktan Güneş yerdekinden biraz geç batar, biraz erken doğar. Vakitler burada sitenin olağan tanımlarıyla hesaplandı.',
    model: 'Hesap yaklaşıktır: rota büyük daire, hız sabit kabul edildi — gerçek uçuş yolu farklı olabilir. Güneş’in konumu Meeus formülleriyle; yüksek enlem düzeltmeleri uygulanmaz.',
    scholar: 'Yolculukta namazların kısaltılması ve birleştirilmesi hakkında bir âlime danışın.',
  },
}

const KIND_ICON = { fajr: 'moonStar', sunrise: 'sunrise', dhuhr: 'sun', asr: 'sunLow', maghrib: 'sunset', isha: 'moon' }
const W = 640, H = 340
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k])

let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)))

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

const cityLabel = (c, lang) => (c.label && (c.label[lang] || c.label.en)) || c.name || ''
const fromCityObj = (c, lang) => ({ lat: c.lat, lng: c.lng, tz: c.tz, label: cityLabel(c, lang), id: c.id })

/** Mətn → yer: seçilmiş, "enlik, uzunluq" və ya axtarışın ilk nəticəsi */
function resolvePlace(q, sel, lang) {
  if (sel && q.trim() === sel.label) return sel
  const ll = parseLatLng(q)
  if (ll) { const n = nearestCity(ll.lat, ll.lng); return { ...ll, tz: n?.city.tz || 'UTC', label: q.trim() } }
  const hit = searchCities(q)[0]
  return q.trim() && hit ? fromCityObj(hit, lang) : null
}

function PlaceInput({ id, label, hint, value, onChange, onPick, lang }) {
  const [open, setOpen] = useState(false)
  const list = useMemo(() => (value.trim() ? searchCities(value).slice(0, 6) : []), [value])
  const show = open && list.length > 0 && !(list.length === 1 && cityLabel(list[0], lang) === value)
  return (
    <div className="fp__field fp__place">
      <label htmlFor={`fp-${id}`}>{label}</label>
      <input id={`fp-${id}`} data-testid={`fp-${id}`} className="ui-input" type="text" autoComplete="off" placeholder={hint}
        value={value} onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={(e) => { if (e.key === 'Enter' && show) { e.preventDefault(); onPick(list[0]); setOpen(false) } else if (e.key === 'Escape') setOpen(false) }}
        aria-autocomplete="list" aria-expanded={show} aria-controls={`fp-${id}-list`} />
      {show && (
        <ul id={`fp-${id}-list`} className="fp__sugg" role="listbox">
          {list.map(c => (
            <li key={c.id} role="option" aria-selected="false">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(c); setOpen(false) }}>
                <Icon name="pin" size={14} /> {cityLabel(c, lang)} <small>{c.country}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function defaults(lang) {
  const loc = getPrayerLocation()
  const own = PRAYER_CITIES.find(c => c.id === loc.id)
  const from = own ? fromCityObj(own, lang) : { lat: loc.lat, lng: loc.lng, tz: loc.tz, label: (loc.city && (loc.city[lang] || loc.city.en)) || `${loc.lat}, ${loc.lng}` }
  const toCity = PRAYER_CITIES.find(c => c.id === (own?.id === 'New York' ? 'Baku' : 'New York'))
  const to = fromCityObj(toCity, lang)
  const dep = `${utcToZoned(Date.now() + 86400000, from.tz).slice(0, 10)}T16:00`
  const dur = estimate(from, to)
  return { from, to, dep, dur, methodKey: methodKeyFor(loc.method) }
}
// Təxmini müddət: ~830 km/s + 30 dəq (qalxma/enmə)
const estimate = (a, b) => fmtDuration(Math.round((distanceKm(a, b) / 830) * 60 / 5) * 5 + 30)

const fmtLat = (v, t) => `${Math.abs(v).toFixed(1)}° ${v >= 0 ? t.n : t.s}`
const fmtLng = (v, t) => `${Math.abs(v).toFixed(1)}° ${v >= 0 ? t.e : t.w}`

function relText(rel, t) {
  const a = Math.abs(Math.round(rel))
  if (a <= 10) return t.ahead
  if (a >= 170) return t.behind
  return fill(rel > 0 ? t.right : t.left, { n: a })
}

export default function FlightPrayer() {
  const { lang = 'az' } = useLang() || {}
  const t = pickUi(T, lang, 'en')
  const [init] = useState(() => defaults(lang))
  const [fromQ, setFromQ] = useState(init.from.label)
  const [toQ, setToQ] = useState(init.to.label)
  const [fromSel, setFromSel] = useState(init.from)
  const [toSel, setToSel] = useState(init.to)
  const [dep, setDep] = useState(init.dep)
  const [dur, setDur] = useState(init.dur)
  const [durTouched, setDurTouched] = useState(false)
  const [methodKey, setMethodKey] = useState(init.methodKey)
  // J1: başlanğıc dəyər — istifadəçinin məzhəb seçimi (utils/madhab); burada yalnız bu hesab üçün dəyişir
  const [hanafi, setHanafi] = useState(() => currentAsrFactor() === 2)
  const [plan, setPlan] = useState(() => ({ from: init.from, to: init.to, depMs: zonedToUtc(init.dep, init.from.tz), durMin: parseDuration(init.dur) }))
  const [err, setErr] = useState('')
  const [minute, setMinute] = useState(0)
  const [land, setLand] = useState(null)
  useEffect(() => { let ok = true; loadLand().then(l => { if (ok) setLand(l) }).catch(() => {}); return () => { ok = false } }, [])

  const pick = (which) => (c) => {
    const p = fromCityObj(c, lang)
    if (which === 'from') { setFromSel(p); setFromQ(p.label) } else { setToSel(p); setToQ(p.label) }
    const a = which === 'from' ? p : toSel, b = which === 'from' ? fromSel : p
    if (!durTouched && a && b) setDur(estimate(a, b))
  }

  const go = () => {
    const from = resolvePlace(fromQ, fromSel, lang), to = resolvePlace(toQ, toSel, lang)
    if (!from || !to) { setErr(t.errPlace); return }
    const durMin = parseDuration(dur)
    if (!(durMin >= 10 && durMin <= 22 * 60)) { setErr(t.errDur); return }
    const depMs = zonedToUtc(dep, from.tz)
    if (!Number.isFinite(depMs)) { setErr(t.errDep); return }
    setErr('')
    setFromSel(from); setToSel(to)
    setPlan({ from, to, depMs, durMin })
    setMinute(0)
  }

  const method = useMemo(() => ({ ...CALC_METHODS[methodKey], asrFactor: hanafi ? 2 : 1 }), [methodKey, hanafi])
  const route = useMemo(() => greatCircle(plan.from, plan.to), [plan])
  const events = useMemo(() => flightEvents({ ...plan, method }), [plan, method])
  const distKm = useMemo(() => distanceKm(plan.from, plan.to), [plan])

  // Proyeksiya marşruta uyğunlaşdırılır (qısa marşrutda ən azı ~30°-lik pəncərə)
  const { projection, path, line } = useMemo(() => {
    const pts = Array.from({ length: 65 }, (_, i) => { const p = route(i / 64); return [p.lng, p.lat] })
    const mid = route(0.5), pad = Math.max(8, 15 - distKm / 1000)
    const box = [[mid.lng - pad, mid.lat - pad / 2], [mid.lng + pad, mid.lat + pad / 2]]
    const proj = geoEqualEarth().rotate([-mid.lng, 0]).fitExtent([[24, 24], [W - 24, H - 24]], { type: 'MultiPoint', coordinates: [...pts, ...box] })
    const gp = geoPath(proj)
    return { projection: proj, path: gp, line: gp({ type: 'LineString', coordinates: pts }) }
  }, [route, distKm])

  const landD = useMemo(() => (land ? path(land) : null), [land, path])
  const nowMs = plan.depMs + minute * 60000
  const pos = route(minute / plan.durMin)
  const track = trackAt(route, minute / plan.durMin)
  const altNow = sunAltitude(nowMs, pos.lat, pos.lng)
  const night = useMemo(() => {
    const ss = subsolarPoint(nowMs)
    const anti = [ss.lng + 180, -ss.lat]
    return {
      night: path(geoCircle().center(anti).radius(90 + SUNSET_ALT)()),
      deep: path(geoCircle().center(anti).radius(90 - method.fajr)()),
    }
  }, [nowMs, path, method.fajr])

  const where = (p) => {
    const n = nearestCity(p.lat, p.lng)
    const coords = `${fmtLat(p.lat, t)}, ${fmtLng(p.lng, t)}`
    return n && n.km < 300 ? `${coords} · ${fill(t.near, { c: cityLabel(n.city, lang), k: Math.round(n.km / 10) * 10 })}` : coords
  }
  const sameTz = plan.from.tz === plan.to.tz
  const plane = projection([pos.lng, pos.lat])
  const ahead = route(Math.min(1, minute / plan.durMin + 0.01))
  const pa = projection([ahead.lng, ahead.lat])
  const planeRot = plane && pa ? Math.atan2(pa[1] - plane[1], pa[0] - plane[0]) * 180 / Math.PI : 0
  const kaabaXY = projection([KAABA.lng, KAABA.lat])
  const kaabaIn = kaabaXY && kaabaXY[0] > 0 && kaabaXY[0] < W && kaabaXY[1] > 0 && kaabaXY[1] < H
  const ends = [projection([plan.from.lng, plan.from.lat]), projection([plan.to.lng, plan.to.lat])]
  const qNow = qiblaFrom(pos, track)

  return (
    <section className="ui-card fp" data-testid="flight-prayer" data-events={events.length} aria-labelledby="fp-title">
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id="fp-title" className="fp__title">{t.title}</h2>
      <p className="fp__lead">{t.lead}</p>

      <form className="fp__form" onSubmit={(e) => { e.preventDefault(); go() }}>
        <PlaceInput id="from" label={t.from} hint={t.place} value={fromQ} onChange={setFromQ} onPick={pick('from')} lang={lang} />
        <PlaceInput id="to" label={t.to} hint={t.place} value={toQ} onChange={setToQ} onPick={pick('to')} lang={lang} />
        <div className="fp__field">
          <label htmlFor="fp-dep">{t.dep}</label>
          <input id="fp-dep" data-testid="fp-dep" className="ui-input" type="datetime-local" value={dep} onChange={(e) => setDep(e.target.value)} />
        </div>
        <div className="fp__field">
          <label htmlFor="fp-dur">{t.dur}</label>
          <input id="fp-dur" data-testid="fp-dur" className="ui-input" type="text" inputMode="numeric" placeholder="7:45" value={dur}
            onChange={(e) => { setDur(e.target.value); setDurTouched(true) }} />
        </div>
        <div className="fp__opts">
          <span className="fp__optl">{t.method}</span>
          {['abubakr', 'diyanet'].map(k => (
            <button key={k} type="button" className="ui-chip" aria-pressed={methodKey === k} onClick={() => setMethodKey(k)} data-testid={`fp-m-${k}`}>{t[k]}</button>
          ))}
          <button type="button" className="ui-chip" aria-pressed={hanafi} onClick={() => setHanafi(v => !v)} data-testid="fp-hanafi">{t.hanafi}</button>
        </div>
        <button type="submit" className="ui-btn ui-btn--primary fp__go" data-testid="fp-go"><Icon name="compass" size={16} /> {t.go}</button>
        {err && <p className="fp__err" role="alert">{err}</p>}
      </form>

      <p className="fp__sum ui-num">
        <b>{plan.from.label}</b> → <b>{plan.to.label}</b> · {t.dist} {Math.round(distKm).toLocaleString(lang)} {t.km} · {fmtDuration(plan.durMin)}
      </p>

      <div className="fp__grid">
        <figure className="fp__map">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.map}>
            <defs><clipPath id="fp-clip"><rect width={W} height={H} rx="12" /></clipPath></defs>
            <g clipPath="url(#fp-clip)">
              <rect width={W} height={H} className="fp__sea" />
              {landD && <path d={landD} className="fp__land" />}
              <path d={night.night} className="fp__night" />
              <path d={night.deep} className="fp__deep" />
              <path d={line} className="fp__route" />
              {kaabaIn && (
                <g className="fp__kaaba" transform={`translate(${kaabaXY[0]} ${kaabaXY[1]})`}>
                  <rect x="-4.5" y="-4.5" width="9" height="9" rx="1" />
                  <text y="-8" textAnchor="middle">{t.kaaba}</text>
                </g>
              )}
              {ends.map((xy, i) => xy && <circle key={i} cx={xy[0]} cy={xy[1]} r="4.5" className="fp__end" />)}
              {events.map((e, i) => {
                const xy = projection([e.lng, e.lat])
                return xy && (
                  <circle key={i} cx={xy[0]} cy={xy[1]} r="6" className={`fp__ev fp__ev--${e.kind}`}
                    onClick={() => setMinute(Math.round(e.elapsedMin))}><title>{t.ev[e.kind]}</title></circle>
                )
              })}
              {plane && (
                <g transform={`translate(${plane[0]} ${plane[1]}) rotate(${planeRot})`} className="fp__plane">
                  <path d="M10 0 L-6 -7 L-3 0 L-6 7 Z" />
                </g>
              )}
            </g>
          </svg>
          <figcaption className="fp__legend">
            <span><i className="fp__sw fp__sw--night" /> {t.night}</span>
            <span><i className="fp__sw fp__sw--deep" /> {t.twi}</span>
          </figcaption>
          <label className="fp__slider">
            <span>{t.slider}: <b className="ui-num">+{fmtDuration(minute)}</b></span>
            <input type="range" min="0" max={plan.durMin} step="1" value={minute} onChange={(e) => setMinute(+e.target.value)} data-testid="fp-time" />
          </label>
          <dl className="fp__now">
            <div><dt>{plan.from.label}</dt><dd className="ui-num">{fmtTime(nowMs, plan.from.tz, lang)}</dd></div>
            {!sameTz && <div><dt>{plan.to.label}</dt><dd className="ui-num">{fmtTime(nowMs, plan.to.tz, lang)}</dd></div>}
            <div><dt>{t.sunAlt}</dt><dd className="ui-num">{altNow.toFixed(1)}°</dd></div>
            <div><dt>{t.qibla}</dt><dd className="ui-num">{Math.round(qNow.bearing)}°</dd></div>
          </dl>
          <p className="fp__pos">{where(pos)}</p>
        </figure>

        <div className="fp__list">
          {events.length === 0 && <p className="fp__none" data-testid="fp-none">{t.none}</p>}
          <ol className="fp__events">
            {events.map((e, i) => (
              <li key={i} data-event={e.kind} data-testid="fp-event" className={`fp__item fp__item--${e.kind}`}>
                <button type="button" className="fp__ihead" onClick={() => setMinute(Math.round(e.elapsedMin))}>
                  <span className="fp__dot"><Icon name={KIND_ICON[e.kind]} size={16} /></span>
                  <strong>{t.ev[e.kind]}</strong>
                  <span className="fp__el ui-num">+{fmtDuration(e.elapsedMin)}</span>
                </button>
                <dl className="fp__idl">
                  <div><dt>{t.dep2} · {plan.from.label}</dt><dd className="ui-num">{fmtTime(e.ms, plan.from.tz, lang)}</dd></div>
                  <div><dt>{t.arr2} · {plan.to.label}</dt><dd className="ui-num">{fmtTime(e.ms, plan.to.tz, lang)}</dd></div>
                  <div className="fp__wide"><dt>{t.pos}</dt><dd>{where(e)}</dd></div>
                  <div className="fp__wide"><dt>{t.qibla}</dt><dd><span className="ui-num">{fill(t.north, { n: Math.round(e.qibla) })}</span> · {relText(e.rel, t)}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <ul className="fp__notes">
        <li>{t.head}</li>
        <li>{fill(t.dip, { d: Math.round(horizonDip(11)) })}</li>
        <li>{t.model}</li>
        <li className="fp__scholar"><Icon name="info" size={14} /> {t.scholar}</li>
      </ul>
    </section>
  )
}
