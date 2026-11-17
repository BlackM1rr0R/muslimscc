// ═══════════════════════════════════════════════════════
// HilalReports (v7.3) — "Hilalı kim gördü?" — müşahidəçilərin xəritəsi
//
//   <HilalReports />            (dil useLang()-dan; lang prop-u ilə əvəz oluna bilər)
//
// • Təzə aydan sonrakı üç axşamda istifadəçi qeyd edir: "Hilalı gördüm" və ya
//   "Baxdım, görmədim" + üsul (göz, durbin, teleskop, kamera). Server: server/sightings.js.
// • Yer: namaz vaxtları üçün ÖZ seçdiyi şəhər (standart yer yox) və ya istəyə görə
//   geolokasiya — klientdə də 1°-lik xanaya yuvarlaqlaşır, dəqiq yer heç yerə getmir.
// • Qeydlər hesablanmış görünmə zonalarının (Odeh, utils/crescentVis.js) üstündə dairələrlə
//   göstərilir: qızılı hissə — gördü, boz — görmədi; ölçü qeydlərin sayından asılıdır.
// • Müşahidə xəritəsidir, hökm deyil — ayın başlanğıcını yerli dini qurum elan edir (həmişə görünür).
// • Yalnız muslims.cc-də və ya ?sightings=1 ilə (utils/hilalReports.js → hrEnabled).
// • Kanvas yalnız məlumat dəyişəndə çəkilir; yeniləmə (60 s) ekrandan kənarda / gizli vərəqdə dayanır.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { geoEquirectangular, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced'
import { crescentEvenings, crescentGrid } from '../utils/crescentVis'
import { getPrayerLocation } from '../utils/prayerLocation'
import { G_MONTHS_SHORT, WEEKDAYS_SHORT } from '../utils/hijri'
import { HR_METHODS, hrEnabled, hrCell, hrEvening, hrTotals, fetchSightings, sendSighting, hrSentFor, hrMarkSent } from '../utils/hilalReports'
import '../styles/HilalReports.css'

const T = {
  az: {
    ey: 'Hilal müşahidəsi', title: 'Hilalı kim gördü?',
    lead: 'Təzə aydan sonrakı axşamlarda müsəlmanlar hilalı axtarır. Baxmısınızsa, xəritədə qeyd edin: gördünüz, ya baxdınız, amma görmədiniz. Qeydlər hesablanmış görünmə zonalarının üstündə göstərilir.',
    note: 'Bu, istifadəçilərin yoxlanılmamış müşahidə xəritəsidir, hökm deyil. Ayın başlanğıcını yerli dini qurumunuz elan edir — ona tabe olun.',
    privacy: 'Yalnız 1°-lik xana (~110 km), axşamın tarixi, nəticə və üsul göndərilir. Ad, IP və dəqiq yer saxlanmır.',
    seen: 'Hilalı gördüm', notSeen: 'Baxdım, görmədim', how: 'Necə baxdınız?',
    eye: 'Gözlə', binoculars: 'Durbinlə', telescope: 'Teleskopla', camera: 'Kamera ilə', // lang-ok[Teleskopla,Kamera]: «teleskop», «kamera» az sözləridir
    where: 'Sizin xana', useGeo: 'Yerimi təyin et', geoFail: 'Yeri təyin etmək alınmadı.', noLoc: 'Qeyd üçün namaz vaxtlarında şəhərinizi seçin və ya yerinizi təyin edin.',
    thanks: 'Təşəkkürlər! Qeydiniz xəritəyə əlavə olundu.', once: 'Bu axşam artıq qeyd göndərmisiniz.', err: 'Göndərmək alınmadı, bir az sonra yenidən cəhd edin.',
    closed: 'Qeyd yalnız təzə aydan sonrakı üç axşamda, öz axşamınızda açıqdır.', eve: 'axşamı', today: 'bu axşam',
    legSeen: 'gördü', legNot: 'görmədi', you: 'sizin xana', seenN: 'gördü', notN: 'görmədi', cells: 'xana',
    zones: 'Fon — hesablanmış görünmə zonaları (Odeh meyarı): yaşıl — gözlə, sarı — durbinlə, narıncı — yalnız optika ilə.', // lang-ok[Odeh]: alimin adı
    map: 'Hilal müşahidələri xəritəsi', empty: 'Bu axşam üçün hələ qeyd yoxdur.', pick: 'Seçilmiş xana', methods: 'Üsullar',
  },
  en: {
    ey: 'Crescent sighting', title: 'Who saw the crescent?',
    lead: 'On the evenings after the new moon, Muslims look for the crescent. If you looked, add it to the map: you saw it, or you looked but did not see it. Reports are shown on top of the calculated visibility zones.',
    note: 'This is a map of unverified observations by users, not a ruling. Your local religious authority announces the start of the month — follow it.',
    privacy: 'Only a 1° cell (~110 km), the evening’s date, the result and the method are sent. No name, IP or exact location is stored.',
    seen: 'I saw the crescent', notSeen: 'I looked, didn’t see it', how: 'How did you look?',
    eye: 'Naked eye', binoculars: 'Binoculars', telescope: 'Telescope', camera: 'Camera',
    where: 'Your cell', useGeo: 'Use my location', geoFail: 'Could not get your location.', noLoc: 'To report, choose your city for prayer times or use your location.',
    thanks: 'Thank you! Your report was added to the map.', once: 'You have already reported this evening.', err: 'Could not send — please try again later.',
    closed: 'Reporting is open only on the three evenings after the new moon, on your own evening.', eve: 'evening', today: 'this evening',
    legSeen: 'saw it', legNot: 'didn’t see it', you: 'your cell', seenN: 'saw', notN: 'didn’t see', cells: 'cells',
    zones: 'Background — calculated visibility zones (Odeh criterion): green — naked eye, yellow — with optics, perhaps by eye, orange — optics only.',
    map: 'Map of crescent sighting reports', empty: 'No reports for this evening yet.', pick: 'Selected cell', methods: 'Methods',
  },
  ru: {
    ey: 'Наблюдение месяца', title: 'Кто увидел молодой месяц?',
    lead: 'В вечера после новолуния мусульмане ищут молодой месяц. Если вы смотрели, отметьте на карте: увидели или смотрели, но не увидели. Отметки показаны поверх расчётных зон видимости.',
    note: 'Это карта непроверенных наблюдений пользователей, а не решение. Начало месяца объявляет ваше местное духовное управление — следуйте ему.',
    privacy: 'Отправляются только ячейка 1° (~110 км), дата вечера, результат и способ. Имя, сетевой адрес и точное место не хранятся.',
    seen: 'Я увидел месяц', notSeen: 'Смотрел, не увидел', how: 'Как вы смотрели?',
    eye: 'Глазом', binoculars: 'В бинокль', telescope: 'В телескоп', camera: 'Камерой',
    where: 'Ваша ячейка', useGeo: 'Определить моё место', geoFail: 'Не удалось определить место.', noLoc: 'Чтобы отметить, выберите город для времени молитв или определите своё место.',
    thanks: 'Спасибо! Ваша отметка добавлена на карту.', once: 'Вы уже отправили отметку этим вечером.', err: 'Не удалось отправить, попробуйте позже.',
    closed: 'Отметки открыты только в три вечера после новолуния, в ваш собственный вечер.', eve: 'вечер', today: 'этот вечер',
    legSeen: 'увидели', legNot: 'не увидели', you: 'ваша ячейка', seenN: 'увидели', notN: 'не увидели', cells: 'ячеек',
    zones: 'Фон — расчётные зоны видимости (критерий Одеха): зелёный — глазом, жёлтый — в оптику, возможно и глазом, оранжевый — только в оптику.',
    map: 'Карта наблюдений молодого месяца', empty: 'Для этого вечера отметок пока нет.', pick: 'Выбранная ячейка', methods: 'Способы',
  },
  ar: {
    ey: 'رصد الهلال', title: 'من رأى الهلال؟',
    lead: 'في الأمسيات التي تلي الاقتران يتحرّى المسلمون الهلال. إن تحرّيته فسجّل ذلك على الخريطة: رأيته، أو تحرّيته ولم تره. تظهر البلاغات فوق مناطق الرؤية المحسوبة.',
    note: 'هذه خريطة لمشاهدات المستخدمين غير الموثّقة، وليست حكمًا. الجهة الدينية المحلية هي التي تعلن بداية الشهر — فاتّبعها.',
    privacy: 'لا يُرسل إلا مربّع بدرجة واحدة (نحو ١١٠ كم) وتاريخ المساء والنتيجة والوسيلة. لا يُحفظ اسم ولا عنوان شبكة ولا موضع دقيق.',
    seen: 'رأيت الهلال', notSeen: 'تحرّيت ولم أره', how: 'كيف تحرّيته؟',
    eye: 'بالعين المجردة', binoculars: 'بالمنظار', telescope: 'بالتلسكوب', camera: 'بالكاميرا',
    where: 'مربّعك', useGeo: 'حدّد موقعي', geoFail: 'تعذّر تحديد الموقع.', noLoc: 'للإبلاغ اختر مدينتك لمواقيت الصلاة أو حدّد موقعك.',
    thanks: 'شكرًا لك! أُضيف بلاغك إلى الخريطة.', once: 'لقد أرسلت بلاغًا هذا المساء.', err: 'تعذّر الإرسال، حاول لاحقًا.',
    closed: 'الإبلاغ متاح فقط في الأمسيات الثلاث بعد الاقتران، في مسائك أنت.', eve: 'مساء', today: 'هذا المساء',
    legSeen: 'رأوه', legNot: 'لم يروه', you: 'مربّعك', seenN: 'رأوه', notN: 'لم يروه', cells: 'مربّعات',
    zones: 'الخلفية — مناطق الرؤية المحسوبة (معيار عودة): الأخضر بالعين، والأصفر بالمنظار وربما بالعين، والبرتقالي بالمنظار فقط.',
    map: 'خريطة بلاغات رؤية الهلال', empty: 'لا بلاغات لهذا المساء بعد.', pick: 'المربّع المختار', methods: 'الوسائل',
  },
  tr: {
    ey: 'Hilal gözlemi', title: 'Hilali kim gördü?',
    lead: 'Yeni aydan sonraki akşamlarda Müslümanlar hilali arar. Baktıysanız haritaya işaretleyin: gördünüz ya da baktınız ama göremediniz. Bildirimler hesaplanmış görünürlük bölgelerinin üzerinde gösterilir.',
    note: 'Bu, kullanıcıların doğrulanmamış gözlem haritasıdır, hüküm değildir. Ayın başlangıcını yerel dinî kurumunuz ilan eder — ona uyun.',
    privacy: 'Yalnızca 1°’lik hücre (~110 km), akşamın tarihi, sonuç ve yöntem gönderilir. Ad, IP ve tam konum saklanmaz.',
    seen: 'Hilali gördüm', notSeen: 'Baktım, göremedim', how: 'Nasıl baktınız?',
    eye: 'Çıplak gözle', binoculars: 'Dürbünle', telescope: 'Teleskopla', camera: 'Kamerayla',
    where: 'Hücreniz', useGeo: 'Konumumu bul', geoFail: 'Konum alınamadı.', noLoc: 'Bildirmek için namaz vakitlerinde şehrinizi seçin ya da konumunuzu bulun.',
    thanks: 'Teşekkürler! Bildiriminiz haritaya eklendi.', once: 'Bu akşam zaten bildirim gönderdiniz.', err: 'Gönderilemedi, biraz sonra yeniden deneyin.',
    closed: 'Bildirim yalnızca yeni aydan sonraki üç akşamda, kendi akşamınızda açıktır.', eve: 'akşamı', today: 'bu akşam',
    legSeen: 'gördü', legNot: 'göremedi', you: 'hücreniz', seenN: 'gördü', notN: 'göremedi', cells: 'hücre',
    zones: 'Arka plan — hesaplanmış görünürlük bölgeleri (Odeh kriteri): yeşil — gözle, sarı — dürbünle, belki gözle de, turuncu — yalnızca optikle.',
    map: 'Hilal gözlem bildirimleri haritası', empty: 'Bu akşam için henüz bildirim yok.', pick: 'Seçilen hücre', methods: 'Yöntemler',
  },
}

const ZONE_RGB = [[53, 194, 122], [155, 211, 90], [240, 169, 58], null]   // A, B, C, D (CrescentVisibilityMap ilə eyni)
const SEEN = '#ffd257', NOT = '#9aa9c4'
const W = 1080, LAT_MAX = 64, LAT_MIN = -60
const H = Math.round(W * (LAT_MAX - LAT_MIN) / 360)
const REFRESH_MS = 60 * 1000

let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)).catch(e => { landCache = null; throw e }))
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10)

export default function HilalReports({ lang: langProp }) {
  const ctx = useLang()
  const lang = langProp || ctx?.lang || 'az'
  const t = pickUi(T, lang, 'en')
  const reducedMotion = useReduced()
  const on = useMemo(() => hrEnabled(), [])
  const ev = useMemo(() => (on ? crescentEvenings(Date.now()) : null), [on])
  const own = useMemo(() => {
    if (typeof window === 'undefined') return null
    const l = getPrayerLocation()
    return l && !l.isDefault ? hrCell(l.lat, l.lng) : null
  }, [])
  const [geoCell, setGeoCell] = useState(null)
  const [geo, setGeo] = useState('')          // '' | 'busy' | 'fail'
  const cell = own || geoCell

  // Bu axşam (istifadəçinin xanasına görə) — üç axşamdan biridirsə qeyd açıqdır
  const tonight = hrEvening(Date.now(), cell ? cell.lng : 0)
  const dates = useMemo(() => (ev ? ev.days.map(isoDay) : []), [ev])
  const tonightIdx = dates.indexOf(tonight)
  const [sel, setSel] = useState(() => (tonightIdx >= 0 ? tonightIdx : 1))
  const [method, setMethod] = useState('eye')
  const [cells, setCells] = useState([])
  const [status, setStatus] = useState('')    // '' | 'busy' | 'ok' | 'once' | 'err'
  const [sent, setSent] = useState(() => hrSentFor())
  const [grid, setGrid] = useState(null)
  const [land, setLand] = useState(null)
  const [pick, setPick] = useState(null)
  const rootRef = useRef(null)
  const cvRef = useRef(null)
  const gridCache = useRef({})
  const visRef = useRef(true)

  const proj = useMemo(() => geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, (LAT_MAX * Math.PI / 180) * (W / (2 * Math.PI))]), [])
  useEffect(() => { if (on) loadLand().then(setLand).catch(() => {}) }, [on])

  // Zonalar — səhifəni dondurmasın deyə növbəti tikdə, axşam başına bir dəfə (3°-lik şəbəkə)
  useEffect(() => {
    if (!ev) return undefined
    const k = sel
    setGrid(gridCache.current[k] || null)
    if (gridCache.current[k]) return undefined
    const id = setTimeout(() => { gridCache.current[k] = crescentGrid(ev.conj, ev.days[k], 3, LAT_MIN, LAT_MAX); setGrid(gridCache.current[k]) }, 30)
    return () => clearTimeout(id)
  }, [ev, sel])

  // Qeydlər: axşam dəyişəndə + 60 s-dən bir (yalnız görünəndə və vərəq açıq olanda)
  const date = dates[sel]
  const load = useCallback(() => {
    if (!date) return
    fetchSightings(date).then(setCells).catch(() => {})
  }, [date])
  useEffect(() => {
    if (!on || !date) return undefined
    load()
    const el = rootRef.current
    let io = null
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => { visRef.current = e.isIntersecting }, { rootMargin: '100px' })
      io.observe(el)
    }
    const id = setInterval(() => { if (visRef.current && document.visibilityState === 'visible') load() }, REFRESH_MS)
    const onVis = () => { if (document.visibilityState === 'visible' && visRef.current) load() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); io?.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [on, date, load])

  // Çəkiliş — yalnız məlumat dəyişəndə (animasiya yoxdur)
  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const g = cv.getContext('2d')
    if (!g) return
    const path = geoPath(proj, g)
    g.clearRect(0, 0, W, H)
    g.fillStyle = '#0b1530'; g.fillRect(0, 0, W, H)
    if (land) { g.beginPath(); path(land); g.fillStyle = '#1b2a4a'; g.fill() }
    if (grid) {
      const zi = document.createElement('canvas')
      zi.width = grid.cols; zi.height = grid.rows
      const zc = zi.getContext('2d')
      if (zc) {
        const img = zc.createImageData(grid.cols, grid.rows)
        for (let i = 0; i < grid.codes.length; i++) {
          const c = ZONE_RGB[grid.codes[i]]
          if (!c) continue
          img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255
        }
        zc.putImageData(img, 0, 0)
        const ch = H / (grid.rows - 1)
        g.save(); g.globalAlpha = 0.42; g.imageSmoothingEnabled = true
        g.drawImage(zi, 0, 0, grid.cols, grid.rows, 0, -ch / 2, W, H + ch)
        g.restore()
      }
    }
    if (land) { g.beginPath(); path(land); g.strokeStyle = 'rgba(220,232,255,.4)'; g.lineWidth = 0.8; g.stroke() }
    // Qeydlər: dairə — qızılı pay "gördü", boz pay "görmədi"
    const sorted = [...cells].sort((a, b) => (b.seen + b.notSeen) - (a.seen + a.notSeen))
    for (const c of sorted) {
      const n = (c.seen || 0) + (c.notSeen || 0)
      if (!n || c.lat > LAT_MAX + 2 || c.lat < LAT_MIN - 2) continue
      const [x, y] = proj([c.lng, c.lat])
      const r = Math.min(22, 5 + 3 * Math.sqrt(n))
      const a0 = -Math.PI / 2, a1 = a0 + (2 * Math.PI * (c.seen || 0)) / n
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = NOT; g.fill()
      if (c.seen) { g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, a0, a1); g.closePath(); g.fillStyle = SEEN; g.fill() }
      g.lineWidth = 2; g.strokeStyle = '#0b1530'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke()
    }
    if (cell) {
      const [x, y] = proj([cell.lng, cell.lat])
      g.setLineDash([4, 3]); g.lineWidth = 2; g.strokeStyle = '#ffffff'
      g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.stroke(); g.setLineDash([])
    }
    if (pick) {
      const [x, y] = proj([pick.lng, pick.lat])
      g.lineWidth = 2.5; g.strokeStyle = '#e2b857'; g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2); g.stroke()
    }
  }, [grid, land, cells, cell, pick, proj])

  const onTap = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H
    let best = null, bd = Infinity
    for (const c of cells) {
      const [cx, cy] = proj([c.lng, c.lat])
      const d = Math.hypot(cx - x, cy - y)
      if (d < bd) { bd = d; best = c }
    }
    setPick(best && bd < 36 ? best : null)
  }

  const locate = () => {
    if (!navigator.geolocation) { setGeo('fail'); return }
    setGeo('busy')
    navigator.geolocation.getCurrentPosition(
      (p) => { setGeoCell(hrCell(p.coords.latitude, p.coords.longitude)); setGeo('') },
      () => setGeo('fail'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    )
  }

  const canReport = !!cell && tonightIdx >= 0 && sent !== tonight && status !== 'busy'
  const report = async (seen) => {
    if (!canReport) return
    setStatus('busy')
    const res = await sendSighting({ lat: cell.lat, lng: cell.lng, seen, method })
    if (res === 'ok' || res === 'once') { hrMarkSent(tonight); setSent(tonight) }
    if (res === 'ok') {
      // Dərhal xəritədə göstər (serverin GET keşi 30 s-dir); sonrakı yükləmə onu əvəz edir
      if (date === tonight) {
        setCells((prev) => {
          const i = prev.findIndex(c => c.lat === cell.lat && c.lng === cell.lng)
          const base = i >= 0 ? prev[i] : { lat: cell.lat, lng: cell.lng, seen: 0, notSeen: 0, methods: Object.fromEntries(HR_METHODS.map(m => [m, 0])) }
          const next = { ...base, seen: base.seen + (seen ? 1 : 0), notSeen: base.notSeen + (seen ? 0 : 1), methods: { ...base.methods, [method]: (base.methods?.[method] || 0) + 1 } }
          return i >= 0 ? prev.map((c, j) => (j === i ? next : c)) : [...prev, next]
        })
      }
    }
    setStatus(res === 'ok' ? 'ok' : res === 'once' ? 'once' : 'err')
  }

  if (!on || !ev) return null
  const tot = hrTotals(cells)
  const fmtDay = (ms) => { const d = new Date(ms + 12 * 3600000); return `${pickUi(WEEKDAYS_SHORT, lang)[d.getUTCDay()]}, ${d.getUTCDate()} ${pickUi(G_MONTHS_SHORT, lang)[d.getUTCMonth()]}` }
  const coord = (c) => `${c.lat}°, ${c.lng}°`

  return (
    <section ref={rootRef} className={`ui-card hr${reducedMotion ? ' is-reduced' : ''}`} aria-labelledby="hr-title" data-testid="hilal-reports"
      data-cells={cells.length} data-date={date}>
      <div className="hr__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="hr-title" className="hr__title">{t.title}</h2>
        <p className="hr__lead">{t.lead}</p>
      </div>
      <p className="hr__note" role="note" data-testid="hr-note"><Icon name="info" size={16} /> <span>{t.note}</span></p>

      <div className="hr__days" role="group" aria-label={t.title}>
        {ev.days.map((d, i) => (
          <button key={d} type="button" className="ui-chip" aria-pressed={sel === i} onClick={() => { setSel(i); setPick(null) }} data-testid={`hr-day-${i}`}>
            {fmtDay(d)} {i === tonightIdx ? `· ${t.today}` : t.eve}
          </button>
        ))}
      </div>

      <div className="hr__map">
        <canvas ref={cvRef} width={W} height={H} className="hr__cv" role="img" aria-label={t.map} onClick={onTap} data-testid="hr-canvas"
          data-ready={grid ? 'true' : 'false'} />
      </div>
      <ul className="hr__legend">
        <li><i style={{ background: SEEN }} /> {t.legSeen}</li>
        <li><i style={{ background: NOT }} /> {t.legNot}</li>
        <li><i className="is-you" /> {t.you}</li>
      </ul>
      <p className="hr__zones">{t.zones}</p>

      <p className="hr__tot ui-num" aria-live="polite" data-testid="hr-totals">
        {tot.cells ? <><b className="is-seen">{tot.seen}</b> {t.seenN} · <b>{tot.notSeen}</b> {t.notN} · {tot.cells} {t.cells}</> : t.empty}
      </p>
      {pick && (
        <div className="hr__pick" data-testid="hr-pick">
          <span className="hr__pick-l">{t.pick} · <span className="ui-num" dir="ltr">{coord(pick)}</span></span>
          <b className="ui-num"><span className="is-seen">{pick.seen}</span> {t.seenN} · {pick.notSeen} {t.notN}</b>
          {pick.methods && (
            <span className="hr__pick-m">{t.methods}: {HR_METHODS.filter(m => pick.methods[m]).map(m => `${t[m]} ${pick.methods[m]}`).join(' · ')}</span>
          )}
        </div>
      )}

      <div className="hr__form">
        <div className="hr__where">
          <Icon name="pin" size={16} />
          {cell
            ? <span>{t.where}: <b className="ui-num" dir="ltr" data-testid="hr-cell">{coord(cell)}</b></span>
            : <span>{t.noLoc}</span>}
          {!own && (
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={locate} disabled={geo === 'busy'} data-testid="hr-geo">
              <Icon name="target" size={14} /> {t.useGeo}
            </button>
          )}
          {geo === 'fail' && <span className="hr__err">{t.geoFail}</span>}
        </div>
        <fieldset className="hr__methods">
          <legend>{t.how}</legend>
          {HR_METHODS.map(m => (
            <button key={m} type="button" className="ui-chip" aria-pressed={method === m} onClick={() => setMethod(m)} data-testid={`hr-m-${m}`}>{t[m]}</button>
          ))}
        </fieldset>
        <div className="hr__btns">
          <button type="button" className="ui-btn ui-btn--primary" disabled={!canReport} onClick={() => report(true)} data-testid="hr-seen">
            <Icon name="moonStar" size={16} /> {t.seen}
          </button>
          <button type="button" className="ui-btn ui-btn--secondary" disabled={!canReport} onClick={() => report(false)} data-testid="hr-notseen">
            <Icon name="eye" size={16} /> {t.notSeen}
          </button>
        </div>
        <p className="hr__status" role="status" data-testid="hr-status" data-state={status || (sent === tonight ? 'sent' : '')}>
          {status === 'ok' ? t.thanks : status === 'once' || (!status && sent === tonight) ? t.once : status === 'err' ? t.err : tonightIdx < 0 ? t.closed : ''}
        </p>
        <p className="hr__privacy"><Icon name="shield" size={14} /> {t.privacy}</p>
      </div>
    </section>
  )
}
