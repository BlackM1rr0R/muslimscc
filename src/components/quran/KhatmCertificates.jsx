// ═══════════════════════════════════════════════════════
// Xətm şəhadətnamələri (vB) — /quran (Xətm planının altında) və /account
//
// • Xətm aşkarlanır (utils/khatmCert): Xətm planı 604 səhifə bitəndə və ya ömürlük mozaikada
//   6236 ayənin hamısı oxunanda. Hər xətm üçün şəhadətnamə təklif olunur.
// • Forma: ad (hesaba daxil olubsa — hesabdakı ad), başlanğıc və son günü, istəyə bağlı ithaf.
//   Kətanda çəkilir (1600×1131, A4 albom) → PNG yüklə, çap et. Şəkil heç yerə göndərilmir.
// • Kolleksiya: quran_khatm_certs_v1 (ehtiyat nüsxə + hesab sinxronizasiyası) — hər şəhadətnamə
//   istənilən vaxt yenidən yüklənə bilər. Dini mətn: yalnız saytdakı Bəsmələ.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { useAuthUser } from '../../api/userSession'
import { BASMALA_DISPLAY } from '../../utils/quranText'
import { saveBlob, preopenWindow } from '../../utils/quoteCard'
import {
  CERTS_EVENT, CERTS_KEY, NAME_MAX, DED_MAX, readCerts, writeCerts, upsertCert, removeCert,
  khatmEvents, certData, certFileName, durationDays, drawKhatmCert,
} from '../../utils/khatmCert'
import { localDay } from '../../utils/quranLife'
import useLife from './useLife'
import '../../styles/KhatmCertificates.css'

export const PLAN_EVENT = 'quran-khatm-plan-change'
const PLAN_KEY = 'quran_khatm_plan'

const T = {
  az: {
    ey: 'Xətm', title: 'Xətm şəhadətnamələri',
    lead: 'Quranı xətm etdiniz? Adınızla zərif şəhadətnamə hazırlayın: PNG kimi yükləyin və ya çap edin. Hər xətm kolleksiyanızda qalır.',
    none: 'Hələ xətm yoxdur. Xətm planını bitirdikdə və ya ömürlük mozaikada bütün ayələr yandıqda şəhadətnamə burada təklif olunacaq.',
    pending: 'Şəhadətnaməsi hazırlanmamış xətm', src: { plan: 'Xətm planı', life: 'Ömürlük mozaika' },
    create: 'Şəhadətnamə hazırla', name: 'Ad', namePh: 'Şəhadətnamədə yazılacaq ad', start: 'Başlanğıc', end: 'Xətm günü',
    ded: 'İthaf (istəyə bağlı)', dedPh: 'Məs.: Ailəm üçün',
    dedNote: 'Mərhum yaxınınıza ithaf edirsinizsə, onu duada yad edin. Mərhum üçün dua etməkdə ittifaq var; Quran oxumağın savabını bağışlamaq barədə alimlər ixtilaf ediblər.', make: 'Şəhadətnaməni yarat', cancel: 'Bağla',
    errName: 'Adı yazın.', errDates: 'Tarixləri yoxlayın: başlanğıc xətm günündən əvvəl olmalı, gələcək tarix olmaz.',
    download: 'PNG yüklə', print: 'Çap et', del: 'Sil', delAsk: 'Bu şəhadətnamə kolleksiyadan silinsin?', made: 'Şəhadətnamə hazırdır.', privateNote: 'İbadətiniz sizinlə Allah arasındadır — bu şəkil yalnız sizin üçündür.',
    coll: 'Kolleksiyam', days: (n) => `${n} gün`, alt: (n) => `${n} üçün xətm şəhadətnaməsi`,
    privacy: 'Ad və şəkil heç yerə göndərilmir — şəhadətnamə bu cihazda çəkilir; kolleksiya hesabınızla sinxronlanır.',
    c: { title: 'Xətm şəhadətnaməsi', intro: 'Bu şəhadətnamə təsdiq edir ki,', deed: 'Qurani-Kərimi əvvəldən sona qədər oxuyub xətm etmişdir' },
  },
  en: {
    ey: 'Khatm', title: 'Khatm certificates',
    lead: 'Completed the Quran? Make an elegant certificate with your name, then download it as a PNG or print it. Every khatm stays in your collection.',
    none: 'No khatm yet. When you finish the khatm plan, or when every verse lights up in the lifetime mosaic, a certificate will be offered here.',
    pending: 'Khatm without a certificate yet', src: { plan: 'Khatm plan', life: 'Lifetime mosaic' },
    create: 'Make a certificate', name: 'Name', namePh: 'The name to appear on the certificate', start: 'Start', end: 'Khatm date',
    ded: 'Dedication (optional)', dedPh: 'E.g. For my family',
    dedNote: 'If you dedicate it to a loved one who has passed away, remember them in dua. Dua for the deceased is agreed upon; scholars differ on gifting the reward of recitation.', make: 'Create the certificate', cancel: 'Close',
    errName: 'Please enter a name.', errDates: 'Check the dates: the start must be before the khatm date, and future dates are not allowed.',
    download: 'Download PNG', print: 'Print', del: 'Delete', delAsk: 'Remove this certificate from the collection?', made: 'Your certificate is ready.', privateNote: 'Your worship is between you and Allah — this image is for you.',
    coll: 'My collection', days: (n) => (n === 1 ? '1 day' : `${n} days`), alt: (n) => `Khatm certificate for ${n}`,
    privacy: 'The name and image are not sent anywhere: the certificate is drawn on this device, and the collection syncs with your account.',
    c: { title: 'Certificate of Khatm', intro: 'This is to certify that', deed: 'has completed the reading of the Holy Quran from beginning to end' },
  },
  ru: {
    ey: 'Хатм', title: 'Сертификаты хатма',
    lead: 'Вы завершили чтение Корана? Создайте изящный сертификат со своим именем: скачайте PNG или распечатайте. Каждый хатм остаётся в вашей коллекции.',
    none: 'Хатма пока нет. Когда вы закончите план хатма или в мозаике засветятся все аяты, здесь появится предложение сертификата.',
    pending: 'Хатм без сертификата', src: { plan: 'План хатма', life: 'Мозаика на всю жизнь' },
    create: 'Создать сертификат', name: 'Имя', namePh: 'Имя для сертификата', start: 'Начало', end: 'Дата хатма',
    ded: 'Посвящение (необязательно)', dedPh: 'Напр.: Для моей семьи',
    dedNote: 'Если вы посвящаете его ушедшему близкому, помяните его в дуа. О дуа за умершего учёные единодушны; о дарении награды за чтение Корана их мнения расходятся.', make: 'Создать сертификат', cancel: 'Закрыть',
    errName: 'Введите имя.', errDates: 'Проверьте даты: начало должно быть раньше даты хатма, будущие даты недопустимы.',
    download: 'Скачать PNG', print: 'Печать', del: 'Удалить', delAsk: 'Удалить этот сертификат из коллекции?', made: 'Сертификат готов.', privateNote: 'Ваше поклонение — между вами и Аллахом. Это изображение только для вас.',
    coll: 'Моя коллекция', days: (n) => `${n} дн.`, alt: (n) => `Сертификат хатма: ${n}`,
    privacy: 'Имя и изображение никуда не отправляются: сертификат рисуется на этом устройстве, а коллекция синхронизируется с аккаунтом.',
    c: { title: 'Сертификат хатма', intro: 'Настоящим подтверждается, что', deed: 'прочитал(а) Священный Коран от начала до конца' },
  },
  ar: {
    ey: 'الختمة', title: 'شهادات الختم',
    lead: 'أتممت ختم القرآن؟ أنشئ شهادة أنيقة باسمك، ثم نزّلها صورة PNG أو اطبعها. تبقى كل ختمة في مجموعتك.',
    none: 'لا ختمة بعد. عندما تُتمّ خطة الختمة، أو تضيء كل الآيات في فسيفساء العمر، تُقترح الشهادة هنا.',
    pending: 'ختمة بلا شهادة بعد', src: { plan: 'خطة الختمة', life: 'فسيفساء العمر' },
    create: 'أنشئ شهادة', name: 'الاسم', namePh: 'الاسم الذي يُكتب على الشهادة', start: 'البداية', end: 'يوم الختم',
    ded: 'إهداء (اختياري)', dedPh: 'مثال: لعائلتي',
    dedNote: 'إن أهديتها لقريب متوفى فاذكره في دعائك. الدعاء للميت متفق عليه، واختلف العلماء في إهداء ثواب القراءة.', make: 'أنشئ الشهادة', cancel: 'إغلاق',
    errName: 'اكتب الاسم.', errDates: 'تحقّق من التاريخين: يجب أن تسبق البداية يوم الختم، ولا يُقبل تاريخ في المستقبل.',
    download: 'نزّل PNG', print: 'اطبع', del: 'احذف', delAsk: 'هل تحذف هذه الشهادة من المجموعة؟', made: 'شهادتك جاهزة.', privateNote: 'عبادتك بينك وبين الله — هذه الصورة لك وحدك.',
    coll: 'مجموعتي', days: (n) => `${n} يومًا`, alt: (n) => `شهادة ختم لـ${n}`,
    privacy: 'لا يُرسل الاسم ولا الصورة إلى أي مكان: تُرسم الشهادة على هذا الجهاز، وتُزامَن المجموعة مع حسابك.',
    c: { title: 'شهادة ختم القرآن الكريم', intro: 'تشهد هذه الوثيقة بأنّ', deed: 'قد أتمّ قراءة القرآن الكريم من أوله إلى آخره' },
  },
  tr: {
    ey: 'Hatim', title: 'Hatim belgeleri',
    lead: 'Kur’an’ı hatmettiniz mi? Adınızla zarif bir belge hazırlayın: PNG olarak indirin veya yazdırın. Her hatim koleksiyonunuzda kalır.',
    none: 'Henüz hatim yok. Hatim planını bitirdiğinizde ya da ömür boyu mozaikte tüm ayetler parladığında belge burada önerilecek.',
    pending: 'Belgesi hazırlanmamış hatim', src: { plan: 'Hatim planı', life: 'Ömür boyu mozaik' },
    create: 'Belge hazırla', name: 'Ad', namePh: 'Belgede yazılacak ad', start: 'Başlangıç', end: 'Hatim günü',
    ded: 'İthaf (isteğe bağlı)', dedPh: 'Örn.: Ailem için',
    dedNote: 'Vefat etmiş bir yakınınıza ithaf ediyorsanız onu duada anın. Ölüye dua edilmesinde ittifak vardır; okunan Kur’an’ın sevabının bağışlanması konusunda âlimler ihtilaf etmiştir.', make: 'Belgeyi oluştur', cancel: 'Kapat',
    errName: 'Adı yazın.', errDates: 'Tarihleri kontrol edin: başlangıç hatim gününden önce olmalı, gelecek tarih olamaz.',
    download: 'PNG indir', print: 'Yazdır', del: 'Sil', delAsk: 'Bu belge koleksiyondan silinsin mi?', made: 'Belgeniz hazır.', privateNote: 'İbadetiniz sizinle Allah arasındadır — bu görsel yalnızca sizin için.',
    coll: 'Koleksiyonum', days: (n) => `${n} gün`, alt: (n) => `${n} için hatim belgesi`,
    privacy: 'Ad ve görsel hiçbir yere gönderilmez: belge bu cihazda çizilir, koleksiyon hesabınızla eşitlenir.',
    c: { title: 'Hatim belgesi', intro: 'Bu belge onaylar ki', deed: 'Kur’an-ı Kerim’i baştan sona okuyarak hatmetmiştir' },
  },
}

const DATE_LOC = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }
function fmtDate(key, lang) {
  const [y, m, d] = String(key).split('-').map(Number)
  try { return new Date(y, m - 1, d).toLocaleDateString(DATE_LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return key }
}
function readPlan() { try { return JSON.parse(localStorage.getItem(PLAN_KEY) || 'null') } catch { return null } }

async function renderCert(cert, t, lang) {
  try { await document.fonts?.load?.('700 64px "Amiri"') } catch { /* ehtiyat şrift */ }
  const c = document.createElement('canvas')
  c.width = 1600; c.height = 1131
  drawKhatmCert(c.getContext('2d'), {
    name: cert.name, rtl: lang === 'ar',
    t: { ...t.c, basmala: BASMALA_DISPLAY, period: `${fmtDate(cert.start, lang)} — ${fmtDate(cert.end, lang)}`, duration: t.days(durationDays(cert.start, cert.end)), ded: cert.ded, brand: 'muslims.cc' },
  })
  return new Promise((ok) => c.toBlob(ok, 'image/png'))
}

export default function KhatmCertificates({ lang = 'az', bare = false }) {
  const t = pickUi(T, lang, 'en')
  const life = useLife()
  const { user } = useAuthUser()
  const [certs, setCerts] = useState(readCerts)
  const [plan, setPlan] = useState(readPlan)
  const [form, setForm] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [img, setImg] = useState(null)   // { url, blob, cert }
  const [printing, setPrinting] = useState(false)
  const nameRef = useRef(null)
  const today = localDay()

  useEffect(() => {
    const reCerts = () => setCerts(readCerts())
    const rePlan = () => setPlan(readPlan())
    const onStorage = (e) => { if (!e.key || e.key === CERTS_KEY) reCerts(); if (!e.key || e.key === PLAN_KEY) rePlan() }
    window.addEventListener(CERTS_EVENT, reCerts)
    window.addEventListener(PLAN_EVENT, rePlan)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(CERTS_EVENT, reCerts); window.removeEventListener(PLAN_EVENT, rePlan); window.removeEventListener('storage', onStorage) }
  }, [])
  useEffect(() => () => { if (img?.url) URL.revokeObjectURL(img.url) }, [img])
  useEffect(() => { if (form) nameRef.current?.focus() }, [form?.id]) // eslint-disable-line react-hooks/exhaustive-deps -- yalnız forma açılanda

  const ev = useMemo(() => khatmEvents({ plan, ks: life.ks, certs }), [plan, life, certs])
  const lastName = certs.length ? certs[certs.length - 1].name : ''

  const open = (k) => {
    setErr('')
    setForm({ id: k.id, src: k.src, start: k.start, end: k.end, name: user?.displayName || lastName || '', ded: '' })
  }
  const make = async (e) => {
    e.preventDefault()
    if (busy || !form) return
    const d = certData({ ...form, today })
    if (d.error) { setErr(d.error === 'name' ? t.errName : t.errDates); return }
    setErr(''); setBusy(true)
    const cert = { id: form.id, src: form.src, start: d.start, end: d.end, name: d.name, ded: d.ded, made: today }
    const next = upsertCert(readCerts(), cert)
    writeCerts(next)
    setCerts(next)
    const blob = await renderCert(cert, t, lang)
    setBusy(false)
    if (!blob) return
    setForm(null)
    setImg({ url: URL.createObjectURL(blob), blob, cert })
  }
  const download = async (cert, blob) => {
    const win = preopenWindow()
    const b = blob || await renderCert(cert, t, lang)
    if (b) saveBlob(b, certFileName(cert.name, cert.end), win)
  }
  const print = async (cert) => {
    let cur = img
    if (!cur || cur.cert.id !== cert.id) {
      const blob = await renderCert(cert, t, lang)
      if (!blob) return
      cur = { url: URL.createObjectURL(blob), blob, cert }
      setImg(cur)
    }
    setPrinting(true)
    document.documentElement.classList.add('kcx-printing')
    const done = () => { document.documentElement.classList.remove('kcx-printing'); setPrinting(false); window.removeEventListener('afterprint', done) }
    window.addEventListener('afterprint', done)
    setTimeout(() => { window.print(); setTimeout(done, 1000) }, 80)
  }
  const del = (id) => {
    if (!window.confirm(t.delAsk)) return
    const next = removeCert(readCerts(), id)
    writeCerts(next); setCerts(next)
    if (img?.cert.id === id) setImg(null)
  }

  return (
    <section className={`kcx${bare ? ' kcx--bare' : ' ui-card'}`} id={bare ? undefined : 'khatm-certs'} data-testid="khatm-certs" aria-labelledby={bare ? undefined : 'kcx-title'}>
      {!bare && (
        <div className="kcx__head">
          <span className="ui-icon-tile" aria-hidden="true"><Icon name="sparkle" /></span>
          <div>
            <span className="ui-eyebrow">{t.ey}</span>
            <h2 className="kcx__title" id="kcx-title">{t.title}</h2>
            <p className="kcx__lead">{t.lead}</p>
          </div>
        </div>
      )}
      {!ev.all.length && !certs.length && <p className="kcx__none">{t.none}</p>}

      {ev.pending.length > 0 && (
        <ul className="kcx__pending" role="list">
          {ev.pending.map(k => (
            <li key={k.id} className="kcx__pend">
              <span className="kcx__seal" aria-hidden="true"><Icon name="mushaf" size={20} /></span>
              <span className="kcx__pend-text">
                <b>{t.pending}</b>
                <span>{t.src[k.src]} · <span className="ui-num">{fmtDate(k.start, lang)} — {fmtDate(k.end, lang)}</span> · {t.days(durationDays(k.start, k.end))}</span>
              </span>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => open(k)} aria-expanded={form?.id === k.id} data-testid="kcx-create">
                <Icon name="sparkle" className="ui-btn__icon" /> {t.create}
              </button>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <form className="kcx__form" onSubmit={make} noValidate data-testid="kcx-form">
          <label className="ui-field kcx__wide" htmlFor="kcx-name">
            <span className="ui-field__label">{t.name}</span>
            <input id="kcx-name" ref={nameRef} className="ui-input" value={form.name} maxLength={NAME_MAX} placeholder={t.namePh} autoComplete="name" required
              aria-invalid={err === t.errName || undefined} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="ui-field" htmlFor="kcx-start">
            <span className="ui-field__label">{t.start}</span>
            <input id="kcx-start" type="date" className="ui-input" value={form.start} max={form.end || today} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
          </label>
          <label className="ui-field" htmlFor="kcx-end">
            <span className="ui-field__label">{t.end}</span>
            <input id="kcx-end" type="date" className="ui-input" value={form.end} min={form.start} max={today} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
          </label>
          <label className="ui-field kcx__wide" htmlFor="kcx-ded">
            <span className="ui-field__label">{t.ded}</span>
            <input id="kcx-ded" className="ui-input" value={form.ded} maxLength={DED_MAX} placeholder={t.dedPh} aria-describedby="kcx-ded-note" onChange={e => setForm(f => ({ ...f, ded: e.target.value }))} />
          </label>
          <p className="kcx__note kcx__wide" id="kcx-ded-note" data-testid="kcx-ded-note">{t.dedNote}</p>
          {err && <p className="kcx__err kcx__wide" role="alert">{err}</p>}
          <div className="kcx__actions kcx__wide">
            <button type="submit" className="ui-btn ui-btn--primary" disabled={busy} data-testid="kcx-make"><Icon name="check" className="ui-btn__icon" /> {t.make}</button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => { setForm(null); setErr('') }}>{t.cancel}</button>
          </div>
        </form>
      )}

      {img && (
        <div className="kcx__result" data-testid="kcx-result">
          <p className="ui-sr-only" role="status">{t.made}</p>
          <img className="kcx__img" src={img.url} alt={t.alt(img.cert.name)} width="1600" height="1131" />
          <div className="kcx__actions">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={() => download(img.cert, img.blob)} data-testid="kcx-download">
              <Icon name="download" className="ui-btn__icon" /> {t.download}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => print(img.cert)}><Icon name="list" className="ui-btn__icon" /> {t.print}</button>
          </div>
          {/* "Paylaş" yoxdur (sahibin qərarı, 2026-11-18) — şəhadətnamə yalnız özü üçün */}
          <p className="kcx__note" data-testid="kcx-private-note">{t.privateNote}</p>
        </div>
      )}

      {certs.length > 0 && (
        <div className="kcx__coll">
          <h3 className="kcx__h3">{t.coll} <span className="ui-num">{certs.length}</span></h3>
          <ul className="kcx__list" role="list" data-testid="kcx-list">
            {[...certs].reverse().map(c => (
              <li key={c.id} className="kcx__item">
                <span className="kcx__medal" aria-hidden="true">
                  <svg viewBox="0 0 40 40" width="36" height="36"><g fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9" y="9" width="22" height="22" /><rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)" /></g><circle cx="20" cy="20" r="5" fill="currentColor" /></svg>
                </span>
                <span className="kcx__item-text">
                  <b>{c.name}</b>
                  <span className="ui-num">{fmtDate(c.start, lang)} — {fmtDate(c.end, lang)} · {t.days(durationDays(c.start, c.end))}</span>
                  {c.ded && <i>“{c.ded}”</i>}
                </span>
                <span className="kcx__item-btns">
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => download(c)} aria-label={`${t.download} — ${c.name}, ${c.end}`}>
                    <Icon name="download" className="ui-btn__icon" /><span className="kcx__lbl">{t.download}</span>
                  </button>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => print(c)} aria-label={`${t.print} — ${c.name}, ${c.end}`}>
                    <Icon name="list" className="ui-btn__icon" />
                  </button>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => del(c.id)} aria-label={`${t.del} — ${c.name}, ${c.end}`}>
                    <Icon name="trash" className="ui-btn__icon" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="kcx__privacy"><Icon name="shield" size={14} /> {t.privacy}</p>
      {printing && img && createPortal(<div className="kcx-print" aria-hidden="true"><img src={img.url} alt="" /></div>, document.body)}
    </section>
  )
}
