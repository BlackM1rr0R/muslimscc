// ═══════════════════════════════════════════════════════
// /grave-visits — şəxsi qəbir ziyarəti xəritəsi. noindex. YALNIZ bu cihazda (utils/graveVisits →
// grave_visits_v1, profilə aid; E2E sinxronizasiya və ehtiyat nüsxə onu özü daşıyır). Serverə heç nə getmir.
//
// • Yaxının qəbrini işarələyin: ad + koordinat (indiki mövqe — yalnız düyməyə toxunanda, və ya əl ilə) + qeyd.
// • Xəritə: yerli SVG (plitə YÜKLƏNMİR — koordinat üçüncü tərəfə getməsin). "Xəritədə aç" — yalnız toxunuşla OSM.
// • Yaxınlıq: mövqe YALNIZ cihazda yoxlanır — "Yaxınlığı yoxla" düyməsi ilə; icazə artıq verilibsə (Permissions
//   API → granted) səhifə açılanda da. ≤ 150 m → Hisnul-Müslimin «Qəbirləri ziyarət edərkən dua» fəsli (61),
//   mətn + mənbə saytın məlumatından (components/p3/HisnItems).
// • Mərhumların ildönümləri — hesabdakı "Mərhum yaxınlarım" bölməsinə keçid (/account#loved).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import HisnItems, { useHisn } from '../components/p3/HisnItems'
import { Confirm, Msg } from '../components/p3/p3Ui'
import {
  readGraves, saveGrave, removeGrave, nearest, projector, parseLatLng,
  GRAVES_KEY, GRAVES_EVENT, NAME_MAX, NOTE_MAX, NEAR_M,
} from '../utils/graveVisits'
import { EVENT as PROFILE_EVENT } from '../utils/profileCore'
import '../styles/Account.css'
import '../styles/ReadTogether.css'
import '../styles/P3.css'

const GRAVE_CHAPTER = 61
const fmtDist = (m, lang) => {
  const loc = lang === 'az' ? 'az-Latn-AZ' : lang
  try {
    return m < 1000
      ? new Intl.NumberFormat(loc, { style: 'unit', unit: 'meter', maximumFractionDigits: 0 }).format(Math.round(m))
      : new Intl.NumberFormat(loc, { style: 'unit', unit: 'kilometer', maximumFractionDigits: 1 }).format(m / 1000)
  } catch { return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km` }
}

export const GV = {
  az: {
    eyebrow: 'Dua və zikr', title: 'Qəbir ziyarəti xəritəsi',
    lead: 'Yaxınlarınızın qəbrinin yerini qeyd edin. Qəbiristanlığa gələndə səhifə qəbir ziyarətinin duasını göstərir. Hər şey yalnız sizin cihazınızda qalır.',
    privacy: 'Nöqtələr yalnız bu cihazda (və hesabınızın uçdan-uca şifrəli sinxronizasiyasında) saxlanılır. Mövqeyiniz heç yerə göndərilmir və xəritə plitələri yüklənmir.',
    add: 'Qəbir əlavə et', edit: 'Redaktə et', save: 'Yadda saxla', cancel: 'Ləğv et', del: 'Sil', delAsk: 'Silinsin?', yes: 'Bəli, sil',
    name: 'Kimin qəbri', namePh: 'məs. Nənəm', note: 'Qeyd (istəyə bağlı)', notePh: 'məs. sıra 4, ağacın yanında',
    coords: 'Koordinatlar (coğrafi enlik, uzunluq)', coordsPh: '40.4093, 49.8671', here: 'İndiki mövqeyimi götür', locating: 'Mövqe təyin olunur…',
    needName: 'Adı yazın.', needCoords: 'Koordinatı yazın və ya indiki mövqeyi götürün.', badCoords: 'Koordinat yanlışdır.', full: 'Siyahı doludur.', saved: 'Yadda saxlanıldı.',
    geoDenied: 'Mövqeyə icazə verilmədi. Brauzer ayarlarından icazə verə bilərsiniz.', geoFail: 'Mövqe alınmadı. Bir az sonra yenidən cəhd edin.', geoNone: 'Bu brauzer mövqeni dəstəkləmir.',
    check: 'Yaxınlığı yoxla', checking: 'Yoxlanılır…', near: (n) => `Siz ${n} qəbrinin yaxınlığındasınız`, notNear: 'Yaxınlıqda işarələnmiş qəbir yoxdur.', nearest: (n, d) => `Ən yaxını: ${n} — ${d}`,
    distance: (d) => `Sizdən ${d}`, openMap: 'Xəritədə aç', empty: 'Hələ qəbir əlavə edilməyib.',
    duaTitle: 'Qəbirləri ziyarət edərkən dua', openHisn: 'Hisnul-Müslimdə aç', showDua: 'Qəbir ziyarətinin duası',
    map: 'İşarələnmiş qəbirlərin sxemi', you: 'Siz', loved: 'Mərhum yaxınlarım üçün dua xatırlatmaları', list: 'Qəbirlər',
  },
  en: {
    eyebrow: 'Duas and dhikr', title: 'Grave visit map',
    lead: 'Pin the place of a loved one’s grave. When you come to the cemetery, the page shows the dua for visiting graves. Everything stays only on your device.',
    privacy: 'Pins are stored only on this device (and in your account’s end-to-end encrypted sync). Your location is never sent anywhere and no map tiles are loaded.',
    add: 'Add a grave', edit: 'Edit', save: 'Save', cancel: 'Cancel', del: 'Delete', delAsk: 'Delete it?', yes: 'Yes, delete',
    name: 'Whose grave', namePh: 'e.g. Grandmother', note: 'Note (optional)', notePh: 'e.g. row 4, next to the tree',
    coords: 'Coordinates (latitude, longitude)', coordsPh: '40.4093, 49.8671', here: 'Use my current location', locating: 'Finding your location…',
    needName: 'Please enter a name.', needCoords: 'Enter coordinates or use your current location.', badCoords: 'The coordinates are not valid.', full: 'The list is full.', saved: 'Saved.',
    geoDenied: 'Location permission was not given. You can allow it in your browser settings.', geoFail: 'Could not get your location. Please try again later.', geoNone: 'This browser does not support location.',
    check: 'Check if I am near', checking: 'Checking…', near: (n) => `You are near the grave of ${n}`, notNear: 'There is no pinned grave near you.', nearest: (n, d) => `Nearest: ${n} — ${d}`,
    distance: (d) => `${d} from you`, openMap: 'Open in map', empty: 'No graves added yet.',
    duaTitle: 'Dua when visiting graves', openHisn: 'Open in Hisn al-Muslim', showDua: 'The dua for visiting graves',
    map: 'Sketch of pinned graves', you: 'You', loved: 'Dua reminders for my departed loved ones', list: 'Graves',
  },
  ru: {
    eyebrow: 'Дуа и зикр', title: 'Карта посещения могил',
    lead: 'Отметьте место могилы близкого человека. Когда вы придёте на кладбище, страница покажет дуа при посещении могил. Всё хранится только на вашем устройстве.',
    privacy: 'Отметки хранятся только на этом устройстве (и в сквозной зашифрованной синхронизации аккаунта). Ваше местоположение никуда не отправляется, тайлы карты не загружаются.',
    add: 'Добавить могилу', edit: 'Изменить', save: 'Сохранить', cancel: 'Отмена', del: 'Удалить', delAsk: 'Удалить?', yes: 'Да, удалить',
    name: 'Чья могила', namePh: 'напр. Бабушка', note: 'Заметка (необязательно)', notePh: 'напр. ряд 4, у дерева',
    coords: 'Координаты (широта, долгота)', coordsPh: '40.4093, 49.8671', here: 'Взять моё местоположение', locating: 'Определяем местоположение…',
    needName: 'Введите имя.', needCoords: 'Введите координаты или возьмите текущее местоположение.', badCoords: 'Неверные координаты.', full: 'Список заполнен.', saved: 'Сохранено.',
    geoDenied: 'Доступ к местоположению не разрешён. Его можно включить в настройках браузера.', geoFail: 'Не удалось определить местоположение. Попробуйте позже.', geoNone: 'Этот браузер не поддерживает геолокацию.',
    check: 'Проверить, рядом ли я', checking: 'Проверяем…', near: (n) => `Вы рядом с могилой: ${n}`, notNear: 'Рядом нет отмеченных могил.', nearest: (n, d) => `Ближайшая: ${n} — ${d}`,
    distance: (d) => `${d} от вас`, openMap: 'Открыть на карте', empty: 'Могилы пока не добавлены.',
    duaTitle: 'Дуа при посещении могил', openHisn: 'Открыть в «Хисн аль-муслим»', showDua: 'Дуа при посещении могил',
    map: 'Схема отмеченных могил', you: 'Вы', loved: 'Напоминания о дуа за ушедших близких', list: 'Могилы',
  },
  tr: {
    eyebrow: 'Dua ve zikir', title: 'Kabir ziyareti haritası',
    lead: 'Bir yakınınızın kabrinin yerini işaretleyin. Kabristana geldiğinizde sayfa kabir ziyareti duasını gösterir. Her şey yalnızca cihazınızda kalır.',
    privacy: 'İşaretler yalnızca bu cihazda (ve hesabınızın uçtan uca şifreli eşitlemesinde) saklanır. Konumunuz hiçbir yere gönderilmez ve harita karoları yüklenmez.',
    add: 'Kabir ekle', edit: 'Düzenle', save: 'Kaydet', cancel: 'Vazgeç', del: 'Sil', delAsk: 'Silinsin mi?', yes: 'Evet, sil',
    name: 'Kimin kabri', namePh: 'ör. Babaannem', note: 'Not (isteğe bağlı)', notePh: 'ör. 4. sıra, ağacın yanında',
    coords: 'Koordinat (enlem, boylam)', coordsPh: '40.4093, 49.8671', here: 'Şu anki konumumu al', locating: 'Konum belirleniyor…',
    needName: 'Lütfen bir ad yazın.', needCoords: 'Koordinat yazın veya şu anki konumu alın.', badCoords: 'Koordinat geçersiz.', full: 'Liste dolu.', saved: 'Kaydedildi.',
    geoDenied: 'Konum izni verilmedi. Tarayıcı ayarlarından izin verebilirsiniz.', geoFail: 'Konum alınamadı. Biraz sonra tekrar deneyin.', geoNone: 'Bu tarayıcı konumu desteklemiyor.',
    check: 'Yakında mıyım, kontrol et', checking: 'Kontrol ediliyor…', near: (n) => `${n} kabrinin yakınındasınız`, notNear: 'Yakınınızda işaretli kabir yok.', nearest: (n, d) => `En yakını: ${n} — ${d}`,
    distance: (d) => `Size ${d} uzaklıkta`, openMap: 'Haritada aç', empty: 'Henüz kabir eklenmedi.',
    duaTitle: 'Kabir ziyareti duası', openHisn: 'Hısnu’l-Müslim’de aç', showDua: 'Kabir ziyaretinin duası',
    map: 'İşaretli kabirlerin krokisi', you: 'Siz', loved: 'Vefat eden yakınlarım için dua hatırlatmaları', list: 'Kabirler',
  },
  ar: {
    eyebrow: 'الأدعية والأذكار', title: 'خريطة زيارة القبور',
    lead: 'حدّد مكان قبر من تحب. عندما تأتي إلى المقبرة تعرض الصفحة دعاء زيارة القبور. كل شيء يبقى على جهازك فقط.',
    privacy: 'تُحفظ العلامات على هذا الجهاز فقط (وفي المزامنة المشفّرة من طرف إلى طرف في حسابك). لا يُرسَل موقعك إلى أي مكان ولا تُحمَّل بلاطات الخرائط.',
    add: 'أضف قبرًا', edit: 'تعديل', save: 'حفظ', cancel: 'إلغاء', del: 'حذف', delAsk: 'هل يُحذف؟', yes: 'نعم، احذف',
    name: 'قبر مَن', namePh: 'مثل: جدتي', note: 'ملاحظة (اختياري)', notePh: 'مثل: الصف 4 بجانب الشجرة',
    coords: 'الإحداثيات (خط العرض، خط الطول)', coordsPh: '40.4093, 49.8671', here: 'استخدم موقعي الحالي', locating: 'جارٍ تحديد الموقع…',
    needName: 'يرجى كتابة الاسم.', needCoords: 'اكتب الإحداثيات أو استخدم موقعك الحالي.', badCoords: 'الإحداثيات غير صحيحة.', full: 'القائمة ممتلئة.', saved: 'تم الحفظ.',
    geoDenied: 'لم يُسمح بالوصول إلى الموقع. يمكنك السماح به من إعدادات المتصفح.', geoFail: 'تعذّر تحديد موقعك. حاول مرة أخرى لاحقًا.', geoNone: 'هذا المتصفح لا يدعم تحديد الموقع.',
    check: 'تحقّق إن كنت قريبًا', checking: 'جارٍ التحقق…', near: (n) => `أنت قرب قبر ${n}`, notNear: 'لا يوجد قبر محدَّد قريب منك.', nearest: (n, d) => `الأقرب: ${n} — ${d}`,
    distance: (d) => `على بعد ${d} منك`, openMap: 'افتح في الخريطة', empty: 'لم تُضَف قبور بعد.',
    duaTitle: 'دعاء زيارة القبور', openHisn: 'افتح في حصن المسلم', showDua: 'دعاء زيارة القبور',
    map: 'مخطط القبور المحدَّدة', you: 'أنت', loved: 'تذكير بالدعاء لأحبّائي الراحلين', list: 'القبور',
  },
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { reject(Object.assign(new Error('none'), { code: 'none' })); return }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ la: p.coords.latitude, lo: p.coords.longitude, acc: p.coords.accuracy }),
      (e) => reject(Object.assign(new Error('geo'), { code: e && e.code === 1 ? 'denied' : 'fail' })),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  })
}
const geoErr = (e, t) => (e?.code === 'denied' ? t.geoDenied : e?.code === 'none' ? t.geoNone : t.geoFail)
const EMPTY = { id: '', n: '', coords: '', no: '' }

function GraveSketch({ list, pos, sel, onSel, t }) {
  const W = 320, H = 200
  const pr = useMemo(() => projector(pos ? [...list, pos] : list, W, H), [list, pos])
  if (!list.length) return null
  return (
    <svg className="p3-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.map} data-testid="gv-map">
      <rect x="0" y="0" width={W} height={H} rx="12" className="p3-map__bg" />
      {list.map((g) => (
        <g key={g.id} className={`p3-map__pin${g.id === sel ? ' is-sel' : ''}`} transform={`translate(${pr.x(g.la, g.lo)} ${pr.y(g.la, g.lo)})`} onClick={() => onSel(g.id)}>
          <circle r={g.id === sel ? 8 : 6} />
          <title>{g.n}</title>
        </g>
      ))}
      {pos && (
        <g className="p3-map__you" transform={`translate(${pr.x(pos.la, pos.lo)} ${pr.y(pos.la, pos.lo)})`}>
          <circle r="5" /><circle r="11" className="p3-map__halo" />
          <title>{t.you}</title>
        </g>
      )}
    </svg>
  )
}

export default function GraveVisitsPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(GV, lang, 'en')
  const [data, setData] = useState({ v: 1, l: [] })     // prerender = boş; mount-dan sonra oxunur
  const [form, setForm] = useState(null)               // null | { id, n, coords, no }
  const [msg, setMsg] = useState(null)
  const [pos, setPos] = useState(null)
  const [geo, setGeo] = useState('')                   // '' | 'busy' | 'form'
  const [geoMsg, setGeoMsg] = useState(null)
  const [sel, setSel] = useState('')
  const [showDua, setShowDua] = useState(false)

  const load = useCallback(() => setData(readGraves()), [])
  useEffect(() => {
    load()
    const onStorage = (e) => { if (!e.key || e.key === GRAVES_KEY || e.key.endsWith(`:${GRAVES_KEY}`)) load() }
    window.addEventListener(GRAVES_EVENT, load)
    window.addEventListener(PROFILE_EVENT, load)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(GRAVES_EVENT, load); window.removeEventListener(PROFILE_EVENT, load); window.removeEventListener('storage', onStorage) }
  }, [load])

  const check = useCallback(async () => {
    setGeo('busy'); setGeoMsg(null)
    try { setPos(await getPosition()) } catch (e) { setGeoMsg({ tone: 'bad', text: geoErr(e, t) }) } finally { setGeo('') }
  }, [t])
  // İcazə artıq verilibsə — açılanda bir dəfə yoxla (yeni icazə sorğusu YOX)
  useEffect(() => {
    let alive = true
    if (!readGraves().l.length) return undefined
    try {
      navigator.permissions?.query({ name: 'geolocation' }).then((p) => { if (alive && p.state === 'granted') check() }).catch(() => {})
    } catch { /* Permissions API yoxdur */ }
    return () => { alive = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const near = useMemo(() => nearest(data.l, pos), [data, pos])
  const nearHit = near[0] && near[0].m <= NEAR_M ? near[0].g : null
  const hisn = useHisn(lang, Boolean(nearHit) || showDua)
  const distOf = useMemo(() => Object.fromEntries(near.map((x) => [x.g.id, x.m])), [near])

  const startAdd = () => { setForm({ ...EMPTY }); setMsg(null) }
  const startEdit = (g) => { setForm({ id: g.id, n: g.n, coords: `${g.la}, ${g.lo}`, no: g.no || '' }); setMsg(null) }
  const useHere = async () => {
    setGeo('form'); setMsg(null)
    try {
      const p = await getPosition()
      setPos(p)
      setForm((f) => (f ? { ...f, coords: `${p.la.toFixed(6)}, ${p.lo.toFixed(6)}` } : f))
    } catch (e) { setMsg({ tone: 'bad', text: geoErr(e, t) }) } finally { setGeo('') }
  }
  const onSave = (e) => {
    e.preventDefault()
    if (!form.n.trim()) { setMsg({ tone: 'bad', text: t.needName }); document.getElementById('gv-name')?.focus(); return }
    if (!form.coords.trim()) { setMsg({ tone: 'bad', text: t.needCoords }); return }
    const c = parseLatLng(form.coords)
    if (!c) { setMsg({ tone: 'bad', text: t.badCoords }); document.getElementById('gv-coords')?.focus(); return }
    const r = saveGrave({ id: form.id || undefined, n: form.n, la: c.la, lo: c.lo, no: form.no })
    if (!r.ok) { setMsg({ tone: 'bad', text: r.full ? t.full : t.badCoords }); return }
    setData(r.data); setForm(null); setSel(r.item.id); setMsg({ tone: 'ok', text: t.saved })
  }
  const mapHref = (g) => `https://www.openstreetmap.org/?mlat=${g.la}&mlon=${g.lo}#map=18/${g.la}/${g.lo}`

  return (
    <div className="acc-account p3-page">
      <section className="ui-page-hero">
        <div className="ui-container ui-container--narrow">
          <p className="ui-eyebrow">{t.eyebrow}</p>
          <h1 className="ui-title">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </section>
      <div className="ui-container ui-container--narrow acc-sections">
        <p className="rt-note"><Icon name="lock" size={16} /> {t.privacy}</p>

        {nearHit && (
          <section className="ui-card acc-section p3-near" aria-labelledby="gv-near-h" data-testid="gv-near">
            <h2 className="acc-section__title" id="gv-near-h"><Icon name="pin" size={18} /> <bdi>{t.near(nearHit.n)}</bdi></h2>
            <HisnItems map={hisn} ids={[GRAVE_CHAPTER]} lang={lang} siteLang={siteLang} openLabel={t.openHisn} testId="gv-dua" />
          </section>
        )}

        <section className="ui-card acc-section" aria-labelledby="gv-list-h" data-testid="gv-list">
          <h2 className="acc-section__title" id="gv-list-h">{t.list}</h2>
          <GraveSketch list={data.l} pos={pos} sel={sel} onSel={setSel} t={t} />
          {data.l.length > 0 && (
            <div className="p3-row">
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={geo !== ''} onClick={check} data-testid="gv-check">
                <Icon name="compass" className="ui-btn__icon" /> {geo === 'busy' ? t.checking : t.check}
              </button>
            </div>
          )}
          <div aria-live="polite">
            {geoMsg ? <Msg msg={geoMsg} /> : pos && !nearHit && near[0] ? <p className="rt-note" data-testid="gv-not-near">{t.notNear} {t.nearest(near[0].g.n, fmtDist(near[0].m, lang))}</p> : null}
          </div>
          {data.l.length === 0 && !form && <p className="rt-note" data-testid="gv-empty">{t.empty}</p>}
          <ul className="p3-graves">
            {data.l.map((g) => (
              <li key={g.id} className={`p3-grave${g.id === sel ? ' is-sel' : ''}`} data-testid="gv-item">
                <div className="p3-grave__main">
                  <strong><bdi>{g.n}</bdi></strong>
                  {g.no && <span className="rt-note" dir="auto">{g.no}</span>}
                  {distOf[g.id] != null && <span className="rt-note">{t.distance(fmtDist(distOf[g.id], lang))}</span>}
                </div>
                <div className="p3-row">
                  <a className="ui-btn ui-btn--ghost ui-btn--sm" href={mapHref(g)} target="_blank" rel="noopener noreferrer nofollow"><Icon name="external" className="ui-btn__icon" /> {t.openMap}</a>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => startEdit(g)}><Icon name="edit" className="ui-btn__icon" /> {t.edit}</button>
                  <Confirm label={t.del} ask={t.delAsk} yes={t.yes} cancel={t.cancel} onYes={() => { setData(removeGrave(g.id)); if (sel === g.id) setSel('') }} testId="gv-del" />
                </div>
              </li>
            ))}
          </ul>
          {!form && <div><button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={startAdd} data-testid="gv-add"><Icon name="plus" className="ui-btn__icon" /> {t.add}</button></div>}
          {form && (
            <form className="acc-form p3-form" onSubmit={onSave} noValidate data-testid="gv-form">
              <div className="ui-field">
                <label className="ui-field__label" htmlFor="gv-name">{t.name}</label>
                <input id="gv-name" className="ui-input" dir="auto" maxLength={NAME_MAX} value={form.n} placeholder={t.namePh} onChange={(e) => setForm((f) => ({ ...f, n: e.target.value }))} autoComplete="off" />
              </div>
              <div className="ui-field">
                <label className="ui-field__label" htmlFor="gv-coords">{t.coords}</label>
                <input id="gv-coords" className="ui-input" dir="ltr" inputMode="decimal" value={form.coords} placeholder={t.coordsPh} onChange={(e) => setForm((f) => ({ ...f, coords: e.target.value }))} autoComplete="off" />
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm p3-here" disabled={geo !== ''} onClick={useHere} data-testid="gv-here">
                  <Icon name="pin" className="ui-btn__icon" /> {geo === 'form' ? t.locating : t.here}
                </button>
              </div>
              <div className="ui-field">
                <label className="ui-field__label" htmlFor="gv-note">{t.note}</label>
                <textarea id="gv-note" className="ui-input" rows={2} dir="auto" maxLength={NOTE_MAX} value={form.no} placeholder={t.notePh} onChange={(e) => setForm((f) => ({ ...f, no: e.target.value }))} />
              </div>
              <div className="p3-row">
                <button type="submit" className="ui-btn ui-btn--primary ui-btn--sm" data-testid="gv-save"><Icon name="check" className="ui-btn__icon" /> {t.save}</button>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setForm(null); setMsg(null) }}>{t.cancel}</button>
              </div>
            </form>
          )}
          <Msg msg={msg} />
        </section>

        {!nearHit && (
          <section className="ui-card acc-section" aria-labelledby="gv-dua-h">
            <h2 className="acc-section__title" id="gv-dua-h"><Icon name="hisn" size={18} /> {t.duaTitle}</h2>
            {showDua ? <HisnItems map={hisn} ids={[GRAVE_CHAPTER]} lang={lang} siteLang={siteLang} openLabel={t.openHisn} testId="gv-dua-all" />
              : <div><button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" aria-expanded="false" onClick={() => setShowDua(true)} data-testid="gv-show-dua">{t.showDua}</button></div>}
          </section>
        )}

        <p><a className="ui-btn ui-btn--ghost ui-btn--sm" href={`${pathFor('account', siteLang)}#loved`}><Icon name="clock" className="ui-btn__icon" /> {t.loved}</a></p>
      </div>
    </div>
  )
}
