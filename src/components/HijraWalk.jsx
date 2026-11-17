// ═══════════════════════════════════════════════════════
// HijraWalk (v8) — "Hicrət yolunu piyada qət et": gündəlik gəzintini Məkkə → Mədinə yolunda irəliləyişə çevirir
//
//   <HijraWalk />            (dil — useLang(); istəyə görə lang prop)
//
// • İstifadəçi hər gün getdiyi km-i yazır (və ya addım sayı × addım uzunluğu, standart 0,75 m).
// • Yol, dayanacaqlar, onların mətnləri və mənbələri — saytın öz hicrət xəritəsindən (media/SiraMaps:
//   HIJRA_ROUTE, HJ_STOPS, HJ_SRC; Buxari 3905, 3906, Tövbə 40). Yeni dini mətn yazılmayıb.
//   Yolun uzunluğu həmin təxmini xəttdən hesablanır (haversine) və göstərilir.
// • Xəritə d3-geo + world-atlas (land-110m), Hicaza yaxınlaşdırılıb; yolçu nöqtəsi məsafəyə görə xətt üzərində.
// • Dayanacağı keçəndə kartı açılır; yol bitəndə celebrate(). Ardıcıl günlər, cəm, faiz, orta sürətlə bitmə tarixi.
// • Ailə rejimi: bir neçə yolçu (adlar yalnız bu cihazda), hər biri öz rəngli nöqtəsi ilə. Sonuncu yazını geri al.
// • Saxlama: localStorage muslim_cc_hijra_walk (utils/hijraWalk.js). Şəbəkə yoxdur.
// Stillər: src/styles/HijraWalk.css
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import landUrl from 'world-atlas/land-110m.json?url'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import { useLang } from '../contexts/LangContext'
import { useReduced } from '../motion/reduced.js'
import { celebrate } from '../utils/celebrate'
import { HIJRA_ROUTE, HJ_STOPS, HJ_SRC, HJ_UI, NAMES } from './media/SiraMaps'
import {
  load, save, addEntry, undoLast, addWalker, removeWalker, daysOf, totalKm, streak, estimate,
  cumulative, pointAt, stepsToKm, dateKey, stopKms, DEFAULT_STRIDE,
} from '../utils/hijraWalk'
import '../styles/HijraWalk.css'

const T = {
  az: { u: 'km', ey: 'Hicrət yolu', title: 'Hicrət yolunu piyada qət et', lead: 'Hər gün neçə kilometr getdiyinizi yazın və Məkkədən Mədinəyə hicrət yolunda irəliləyin. Hər dayanacağı keçəndə onun hekayəsi açılır.',
    len: 'Yolun uzunluğu', lenNote: 'xəritədəki təxmini xətt üzrə', km: 'Kilometr', steps: 'Addım', stride: 'Addım uzunluğu (m)', date: 'Tarix', add: 'Əlavə et', undo: 'Sonuncunu geri al',
    total: 'Gedilən yol', pct: 'Tamamlanıb', streak: 'Ardıcıl günlər', eta: 'Təxmini bitmə', pace: 'Orta sürət', perDay: 'km/gün', days: (n) => `${n} gün`, left: (k) => `${k} km qaldı`,
    done: 'Mədinəyə çatdınız! Hicrət yolunu tamamladınız.', family: 'Ailə rejimi', me: 'Mən', name: 'Ad', addW: 'Yolçu əlavə et', remove: 'Sil', local: 'Adlar yalnız bu cihazda saxlanır.',
    walker: 'Kim üçün', stops: 'Dayanacaqlar', locked: 'Hələ çatmamısınız', map: 'Hicrət yolunun xəritəsi və sizin yeriniz', bad: 'Düzgün rəqəm yazın (0–200 km).', eq: (k) => `≈ ${k} km`,
    note: 'Yolun xətti təxminidir (saytın hicrət xəritəsi ilə eyni). Dayanacaq mətnləri — Buxari 3905, 3906 rəvayətlərinin və Tövbə 40-ın qısa xülasəsi.' },
  en: { u: 'km', ey: 'The Hijrah route', title: 'Walk the Hijrah route', lead: 'Log how many kilometres you walk each day and advance along the Hijrah route from Mecca to Medina. Each stop’s story unlocks as you pass it.',
    len: 'Route length', lenNote: 'along the approximate line on the map', km: 'Kilometres', steps: 'Steps', stride: 'Stride length (m)', date: 'Date', add: 'Add', undo: 'Undo last entry',
    total: 'Walked', pct: 'Complete', streak: 'Day streak', eta: 'Estimated finish', pace: 'Average pace', perDay: 'km/day', days: (n) => `${n} ${n === 1 ? 'day' : 'days'}`, left: (k) => `${k} km to go`,
    done: 'You reached Medina! You have completed the Hijrah route.', family: 'Family mode', me: 'Me', name: 'Name', addW: 'Add walker', remove: 'Remove', local: 'Names are stored only on this device.',
    walker: 'Walker', stops: 'Stops', locked: 'Not reached yet', map: 'Map of the Hijrah route and your position', bad: 'Enter a valid number (0–200 km).', eq: (k) => `≈ ${k} km`,
    note: 'The line of the route is approximate (the same as the site’s Hijrah map). Stop texts are short summaries of al-Bukhari 3905, 3906 and at-Tawbah 40.' },
  ru: { u: 'км', ey: 'Путь хиджры', title: 'Пройдите путь хиджры пешком', lead: 'Записывайте, сколько километров вы прошли за день, и продвигайтесь по пути хиджры из Мекки в Медину. Пройдя остановку, вы открываете её историю.',
    len: 'Длина пути', lenNote: 'по примерной линии на карте', km: 'Километры', steps: 'Шаги', stride: 'Длина шага (м)', date: 'Дата', add: 'Добавить', undo: 'Отменить последнюю запись',
    total: 'Пройдено', pct: 'Выполнено', streak: 'Дней подряд', eta: 'Примерный финиш', pace: 'Средний темп', perDay: 'км/день', days: (n) => `${n} дн.`, left: (k) => `осталось ${k} км`,
    done: 'Вы дошли до Медины! Путь хиджры пройден.', family: 'Семейный режим', me: 'Я', name: 'Имя', addW: 'Добавить участника', remove: 'Удалить', local: 'Имена хранятся только на этом устройстве.',
    walker: 'Кто идёт', stops: 'Остановки', locked: 'Ещё не дошли', map: 'Карта пути хиджры и ваше место на ней', bad: 'Введите правильное число (0–200 км).', eq: (k) => `≈ ${k} км`,
    note: 'Линия пути приблизительна (та же, что на карте хиджры на сайте). Тексты остановок — краткий пересказ аль-Бухари 3905, 3906 и ат-Тауба 40.' },
  ar: { u: 'كم', ey: 'طريق الهجرة', title: 'امشِ طريق الهجرة', lead: 'سجّل كم كيلومترًا تمشي كل يوم، وتقدّم على طريق الهجرة من مكة إلى المدينة. كلما تجاوزت محطة انكشفت قصتها.',
    len: 'طول الطريق', lenNote: 'على الخط التقريبي في الخريطة', km: 'كيلومترات', steps: 'خطوات', stride: 'طول الخطوة (م)', date: 'التاريخ', add: 'أضف', undo: 'تراجع عن آخر إدخال',
    total: 'المقطوع', pct: 'المنجز', streak: 'أيام متتالية', eta: 'الوصول المتوقع', pace: 'متوسط السرعة', perDay: 'كم/يوم', days: (n) => `${n} يوم`, left: (k) => `بقي ${k} كم`,
    done: 'وصلتَ إلى المدينة! أتممتَ طريق الهجرة.', family: 'وضع العائلة', me: 'أنا', name: 'الاسم', addW: 'أضف مشاركًا', remove: 'احذف', local: 'تُحفظ الأسماء على هذا الجهاز فقط.',
    walker: 'لمن', stops: 'المحطات', locked: 'لم تصل بعد', map: 'خريطة طريق الهجرة وموضعك عليها', bad: 'أدخل رقمًا صحيحًا (0–200 كم).', eq: (k) => `≈ ${k} كم`,
    note: 'خط الطريق تقريبي (هو نفسه في خريطة الهجرة على الموقع). نصوص المحطات تلخيص موجز لروايتي البخاري 3905 و3906 وآية التوبة 40.' },
  tr: { u: 'km', ey: 'Hicret yolu', title: 'Hicret yolunu yürüyerek kat et', lead: 'Her gün kaç kilometre yürüdüğünüzü yazın ve Mekke’den Medine’ye hicret yolunda ilerleyin. Her durağı geçince onun hikâyesi açılır.',
    len: 'Yolun uzunluğu', lenNote: 'haritadaki yaklaşık çizgiye göre', km: 'Kilometre', steps: 'Adım', stride: 'Adım uzunluğu (m)', date: 'Tarih', add: 'Ekle', undo: 'Son kaydı geri al',
    total: 'Yürünen', pct: 'Tamamlandı', streak: 'Art arda gün', eta: 'Tahmini bitiş', pace: 'Ortalama hız', perDay: 'km/gün', days: (n) => `${n} gün`, left: (k) => `${k} km kaldı`,
    done: 'Medine’ye ulaştınız! Hicret yolunu tamamladınız.', family: 'Aile modu', me: 'Ben', name: 'Ad', addW: 'Yürüyüşçü ekle', remove: 'Sil', local: 'İsimler yalnızca bu cihazda saklanır.',
    walker: 'Kimin için', stops: 'Duraklar', locked: 'Henüz ulaşmadınız', map: 'Hicret yolunun haritası ve konumunuz', bad: 'Geçerli bir sayı girin (0–200 km).', eq: (k) => `≈ ${k} km`,
    note: 'Yolun çizgisi yaklaşıktır (sitedeki hicret haritasıyla aynı). Durak metinleri Buhârî 3905, 3906 ve Tevbe 40’ın kısa özetidir.' },
}

const W = 360, H = 440
const COLORS = ['#c47a12', '#2f6fb3', '#b03f84', '#1f7a58', '#6b4fc4', '#c0453d', '#7a5c3a', '#0f8a9a', '#8a6d00']
let landCache = null
const loadLand = () => (landCache ||= fetch(landUrl).then(r => r.json()).then(t => feature(t, t.objects.land)))
const projection = geoMercator()
  .fitExtent([[12, 12], [W - 12, H - 12]], { type: 'MultiPoint', coordinates: [[37.75, 21.05], [40.35, 21.05], [37.75, 24.75], [40.35, 24.75]] })
  .clipExtent([[0, 0], [W, H]])
const geo = geoPath(projection)
const P = ([lat, lon]) => projection([lon, lat])
const CUM = cumulative(HIJRA_ROUTE)
const ROUTE_KM = CUM[CUM.length - 1]
const STOP_KM = stopKms(HJ_STOPS, CUM)
const fmt1 = (x) => (Math.round(x * 10) / 10).toFixed(1)
const L = (o, lang) => (o && pickUi(o, lang, 'en')) || ''

/** Yolun 0…km hissəsi (keçilmiş xətt) */
function doneLine(km) {
  if (!(km > 0)) return null
  const pts = HIJRA_ROUTE.filter((_, i) => CUM[i] < km).map(([a, b]) => [b, a])
  const end = pointAt(HIJRA_ROUTE, km, CUM)
  pts.push([end[1], end[0]])
  return pts.length > 1 ? geo({ type: 'LineString', coordinates: pts }) : null
}

export default function HijraWalk({ lang: langProp }) {
  const ctx = useLang()
  const lang = langProp || ctx?.lang || 'az'
  const t = pickUi(T, lang, 'en')
  const hu = pickUi(HJ_UI, lang, 'en') || HJ_UI.en
  const reduced = useReduced()
  const [st, setSt] = useState(() => load())
  const [who, setWho] = useState('me')
  const [mode, setMode] = useState('km')
  const [val, setVal] = useState('')
  const [date, setDate] = useState(() => dateKey())
  const [err, setErr] = useState(false)
  const [family, setFamily] = useState(() => load().walkers.length > 0)
  const [newName, setNewName] = useState('')
  const [land, setLand] = useState(null)
  const [live, setLive] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => { let ok = true; loadLand().then(l => { if (ok) setLand(l) }).catch(() => {}); return () => { ok = false } }, [])
  // Nəbz animasiyası yalnız görünəndə
  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const today = dateKey()
  const walkers = useMemo(() => [{ id: 'me', name: t.me }, ...st.walkers], [st.walkers, t.me])
  const curW = walkers.some(w => w.id === who) ? who : 'me'
  const days = daysOf(st, curW)
  const km = totalKm(days)
  const pct = Math.min(100, (km / ROUTE_KM) * 100)
  const startOf = (d) => Object.keys(d).sort()[0] || null
  const est = estimate(days, curW === 'me' ? (st.startedAt || startOf(days)) : startOf(days), ROUTE_KM, today)
  const str = streak(days, today)
  const finished = km >= ROUTE_KM
  const landPath = useMemo(() => (land ? geo(land) : null), [land])
  const routePath = useMemo(() => geo({ type: 'LineString', coordinates: HIJRA_ROUTE.map(([a, b]) => [b, a]) }), [])
  const donePath = useMemo(() => doneLine(Math.min(km, ROUTE_KM)), [km])
  const stride = st.stride || DEFAULT_STRIDE
  const preview = mode === 'steps' ? stepsToKm(val, stride) : null

  const commit = (next) => { setSt(next); save(next) }

  const onAdd = (e) => {
    e.preventDefault()
    const n = mode === 'steps' ? stepsToKm(val, stride) : Number(String(val).replace(',', '.'))
    const next = addEntry(st, date > today ? today : date, n, curW)
    if (next === st) { setErr(true); return }
    setErr(false); setVal('')
    const after = totalKm(daysOf(next, curW))
    commit(next)
    if (km < ROUTE_KM && after >= ROUTE_KM) celebrate({ size: 'big' })
    else if (STOP_KM.some(s => s > 0 && km < s && after >= s)) celebrate({ size: 'small' })
  }
  const onAddWalker = (e) => {
    e.preventDefault()
    const next = addWalker(st, newName)
    if (next !== st) { commit(next); setNewName(''); setWho(next.walkers[next.walkers.length - 1].id) }
  }
  const fmtDate = (k) => {
    const [y, m, d] = k.split('-').map(Number)
    try { return new Date(y, m - 1, d).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return k }
  }
  const lbl = (k, dx, dy, anchor) => { const [x, y] = P(HIJRA_ROUTE[k === 'mecca' ? 0 : k === 'thawr' ? 1 : k === 'quba' ? 8 : 9]); return { x: x + dx, y: y + dy, textAnchor: anchor } }
  const sea = P([22.6, 38.35])

  return (
    <section ref={rootRef} className={`ui-card hw${live && !reduced ? ' is-live' : ''}`} data-testid="hijra-walk" data-km={fmt1(km)} aria-labelledby="hw-title">
      <span className="ui-eyebrow">{t.ey}</span>
      <h2 id="hw-title" className="hw__title">{t.title}</h2>
      <p className="hw__lead">{t.lead}</p>
      <p className="hw__len">{t.len}: <b className="ui-num" data-testid="hw-route-km">{Math.round(ROUTE_KM)} {t.u}</b> <span>({t.lenNote})</span></p>

      <div className="hw__grid">
        <figure className="hw__stage">
          <svg className="hw__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.map} dir="ltr">
            <rect className="hw__sea" width={W} height={H} />
            {landPath && <path className="hw__land" d={landPath} />}
            <text className="hw__sealbl" x={sea[0]} y={sea[1]} transform={`rotate(-62 ${sea[0]} ${sea[1]})`} textAnchor="middle">{L(NAMES.sea, lang)}</text>
            <path className="hw__route" d={routePath} />
            {donePath && <path className="hw__done" d={donePath} />}
            {HJ_STOPS.map((s, i) => {
              const [x, y] = P(HIJRA_ROUTE[s.at])
              return <circle key={s.k} cx={x} cy={y} r={s.k === 'mecca' || s.k === 'medina' ? 5 : 3.6} className={`hw__stop${km >= STOP_KM[i] ? ' is-on' : ''}${s.approx ? ' is-approx' : ''}`} />
            })}
            <text className="hw__lbl" {...lbl('mecca', 9, 4, 'start')}>{L(NAMES.mecca, lang)}</text>
            <text className="hw__lbl hw__lbl--s" {...lbl('thawr', -8, 14, 'end')}>{L(NAMES.thawr, lang)}</text>
            <text className="hw__lbl" {...lbl('medina', 8, -6, 'start')}>{L(NAMES.medina, lang)}</text>
            <text className="hw__lbl hw__lbl--s" {...lbl('quba', -8, 12, 'end')}>{L(NAMES.quba, lang)}</text>
            {(family ? walkers : walkers.slice(0, 1)).map((w, i) => {
              const d = totalKm(daysOf(st, w.id))
              const [x, y] = P(pointAt(HIJRA_ROUTE, d, CUM))
              const on = w.id === curW
              return (
                <g key={w.id} className={`hw__walker${on ? ' is-cur' : ''}`} style={{ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`, '--hw-c': COLORS[i % COLORS.length] }}>
                  {on && <circle className="hw__pulse" r="9" />}
                  <circle className="hw__dot" r={on ? 6.5 : 5} />
                  <title>{`${w.name}: ${fmt1(d)} ${t.u}`}</title>
                </g>
              )
            })}
          </svg>
          <div className="hw__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={t.pct}>
            <i style={{ transform: `scaleX(${(pct / 100).toFixed(4)})` }} />
          </div>
        </figure>

        <div className="hw__panel">
          {family && (
            <div className="hw__walkers" role="group" aria-label={t.walker}>
              {walkers.map((w, i) => (
                <span key={w.id} className="hw__wchip">
                  <button type="button" className="ui-chip" aria-pressed={w.id === curW} onClick={() => setWho(w.id)} style={{ '--hw-c': COLORS[i % COLORS.length] }}>
                    <i className="hw__swatch" aria-hidden="true" />{w.name} <span className="ui-num">{fmt1(totalKm(daysOf(st, w.id)))}</span>
                  </button>
                  {w.id !== 'me' && (
                    <button type="button" className="hw__x" aria-label={`${t.remove}: ${w.name}`} onClick={() => { commit(removeWalker(st, w.id)); if (curW === w.id) setWho('me') }}>
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          <form className="hw__form" onSubmit={onAdd}>
            <div className="hw__modes" role="group">
              <button type="button" className="ui-chip" aria-pressed={mode === 'km'} onClick={() => setMode('km')}>{t.km}</button>
              <button type="button" className="ui-chip" aria-pressed={mode === 'steps'} onClick={() => setMode('steps')}>{t.steps}</button>
            </div>
            <div className="hw__row">
              <label className="hw__field">
                <span>{mode === 'km' ? t.km : t.steps}</span>
                <input data-testid="hw-km" type="number" inputMode="decimal" min="0" step={mode === 'km' ? '0.1' : '1'} max={mode === 'km' ? '200' : '300000'}
                  value={val} onChange={(e) => { setVal(e.target.value); setErr(false) }} aria-invalid={err || undefined} />
              </label>
              <label className="hw__field">
                <span>{t.date}</span>
                <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} />
              </label>
            </div>
            {mode === 'steps' && (
              <div className="hw__row">
                <label className="hw__field">
                  <span>{t.stride}</span>
                  <input type="number" min="0.3" max="1.5" step="0.01" value={stride}
                    onChange={(e) => { const s = Number(e.target.value); if (s >= 0.3 && s <= 1.5) commit({ ...st, stride: s }) }} />
                </label>
                <p className="hw__eq ui-num" aria-live="polite">{t.eq(fmt1(preview || 0))}</p>
              </div>
            )}
            {err && <p className="hw__err" role="alert">{t.bad}</p>}
            <div className="hw__btns">
              <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="hw-add"><Icon name="plus" size={16} /> {t.add}</button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" data-testid="hw-undo" disabled={!st.log.length} onClick={() => commit(undoLast(st))}>
                <Icon name="refresh" size={16} /> {t.undo}
              </button>
            </div>
          </form>

          <dl className="hw__stats">
            <div><dt>{t.total}</dt><dd className="ui-num">{fmt1(km)} <small>{t.u}</small></dd></div>
            <div><dt>{t.pct}</dt><dd className="ui-num" data-testid="hw-pct">{Math.floor(pct)}%</dd></div>
            <div><dt>{t.streak}</dt><dd className="ui-num">{t.days(str)}</dd></div>
            <div><dt>{t.pace}</dt><dd className="ui-num">{est?.pace != null ? `${fmt1(est.pace)}` : '—'} <small>{t.perDay}</small></dd></div>
            <div className="hw__wide"><dt>{t.eta}</dt><dd className="ui-num">{finished ? '✓' : est ? `${fmtDate(est.finish)} · ${t.days(est.daysLeft)}` : '—'}</dd></div>
          </dl>
          {finished && <p className="hw__done-msg" data-testid="hw-done"><Icon name="star" size={18} /> {t.done}</p>}

          <label className="hw__fam">
            <input type="checkbox" checked={family} onChange={(e) => { setFamily(e.target.checked); if (!e.target.checked) setWho('me') }} /> {t.family}
          </label>
          {family && (
            <form className="hw__addw" onSubmit={onAddWalker}>
              <input type="text" maxLength={24} placeholder={t.name} aria-label={t.name} value={newName} onChange={(e) => setNewName(e.target.value)} />
              <button type="submit" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={!newName.trim() || st.walkers.length >= 8}><Icon name="user" size={16} /> {t.addW}</button>
              <p className="hw__note">{t.local}</p>
            </form>
          )}
        </div>
      </div>

      <h3 className="hw__h3">{t.stops}</h3>
      <ol className="hw__cards">
        {HJ_STOPS.map((s, i) => {
          const open = km >= STOP_KM[i]
          const src = L(HJ_SRC[s.src], lang) || s.src
          return (
            <li key={s.k} className={`hw__card${open ? ' is-open' : ''}`} data-testid={`hw-stop-${s.k}`} data-open={open ? '1' : '0'}>
              <div className="hw__card-head">
                <span className="hw__km ui-num">{Math.round(STOP_KM[i])} {t.u}</span>
                <strong>{L(s.t, lang)}</strong>
              </div>
              {open ? (
                <>
                  <p>{L(s.d, lang)}</p>
                  <p className="hw__src">{src}{s.approx ? ` · ${hu.approx}` : ''}</p>
                </>
              ) : (
                <p className="hw__locked">{t.locked} · <span className="ui-num">{t.left(fmt1(STOP_KM[i] - km))}</span></p>
              )}
            </li>
          )
        })}
      </ol>
      <p className="hw__note">{t.note}</p>
    </section>
  )
}
