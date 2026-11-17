// ═══════════════════════════════════════════════════════
// IftarInvite — "İftar dəvət kartı"
//
// • Ev sahibi tarixi seçir (susma: bu gün Ramazandırsa — bu gün, deyilsə —
//   gələn Ramazanın 1-i; hicri təqvim utils/hijri.js), şəhəri seçir (saytın
//   ortaq namaz şəhəri, axtarış — searchCities). İftar vaxtı = həmin günün
//   məğrib vaxtı, saytın namaz cədvəli ilə eyni hesab (utils/iftarInvite.js).
// • Sahələr: ev sahibi, qonaqlara müraciət, ünvan, qısa qeyd (≤120), telefon.
// • 3 dizayn (fənərlər + hilal / mozaika tağı / xurma ağacları), 2 ölçü
//   (story 1080×1920, post 1080×1350). Şəkil Web Share ilə (şəkil + mətn)
//   paylaşılır, olmadıqda yüklənir; dəvət mətni ayrıca kopyalanır.
// • Heç nə serverə getmir. Yalnız ev sahibinin adı (istəyə görə) brauzerdə
//   yadda qalır: localStorage 'muslim_cc_iftar_host'.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { getPrayerLocation, searchCities } from '../utils/prayerLocation'
import { gKey, parseGKey } from '../utils/hijri'
import { canShareFile, preopenWindow, saveBlob } from '../utils/quoteCard'
import { logIftarInvite, todayKey } from '../utils/iftarLog'
import {
  DESIGNS, FORMATS, HOST_KEY, LIMITS, cityLabel, dateLines, defaultIftarDate, fileName, formatOf,
  iftarTime, inviteText, locFromCity, renderInvite, todayIn,
} from '../utils/iftarInvite'
import '../styles/IftarInvite.css'

const T = {
  az: {
    ey: 'Ramazan', title: 'İftar dəvət kartı',
    lead: 'Qonşularınızı, qohumlarınızı iftar süfrəsinə gözəl bir kartla dəvət edin. Tarixi və şəhəri seçin — iftar vaxtı saytın namaz cədvəlindən avtomatik götürülür.',
    date: 'Tarix', city: 'Şəhər', cityPh: 'Şəhər axtarın…', noCity: 'Tapılmadı',
    hosts: 'Ev sahibi', hostsPh: 'Əliyev ailəsi', guests: 'Müraciət', guestsPh: 'Əziz qonşularımız',
    address: 'Ünvan (istəyə görə)', addressPh: 'Küçə, ev, mənzil', note: 'Qısa qeyd (istəyə görə)', notePh: 'Sizi görməyə şad olarıq',
    phone: 'Cavab üçün telefon (istəyə görə)', remember: 'Adı bu cihazda yadda saxla',
    design: 'Dizayn', designs: { lantern: 'Fənərlər', arch: 'Mozaika tağı', palm: 'Xurma ağacları' },
    format: 'Ölçü', formats: { story: 'Story 9:16', post: 'Post 4:5' },
    iftar: 'İftar (məğrib)', download: 'Şəkli yüklə', share: 'Paylaş', copy: 'Mətni kopyala',
    copied: 'Dəvət mətni kopyalandı', savedCopied: 'Şəkil yükləndi, mətn kopyalandı', preview: 'Dəvət kartının önizləməsi',
    note2: 'İftar vaxtı — seçilmiş şəhər üçün saytın namaz cədvəlindəki məğrib vaxtıdır. Hicri tarix Ümmül-Qura təqvimi ilədir; yerli elan bir gün fərqlənə bilər. Heç nə serverə göndərilmir.',
    count: (n, m) => `${n}/${m}`,
  },
  en: {
    ey: 'Ramadan', title: 'Iftar invitation card',
    lead: 'Invite neighbours and family to break the fast with a beautiful card. Pick the date and city — the iftar time comes automatically from the site’s prayer timetable.',
    date: 'Date', city: 'City', cityPh: 'Search a city…', noCity: 'Not found',
    hosts: 'Host', hostsPh: 'The Aliyev family', guests: 'Greeting', guestsPh: 'Dear neighbours',
    address: 'Address (optional)', addressPh: 'Street, house, flat', note: 'Short note (optional)', notePh: 'We would be glad to see you',
    phone: 'RSVP phone (optional)', remember: 'Remember the name on this device',
    design: 'Design', designs: { lantern: 'Lanterns', arch: 'Mosaic arch', palm: 'Date palms' },
    format: 'Size', formats: { story: 'Story 9:16', post: 'Post 4:5' },
    iftar: 'Iftar (Maghrib)', download: 'Download image', share: 'Share', copy: 'Copy text',
    copied: 'Invitation text copied', savedCopied: 'Image saved, text copied', preview: 'Invitation card preview',
    note2: 'The iftar time is the Maghrib time from the site’s prayer timetable for the chosen city. The Hijri date follows the Umm al-Qura calendar; local announcements may differ by a day. Nothing is sent to a server.',
    count: (n, m) => `${n}/${m}`,
  },
  ru: {
    ey: 'Рамадан', title: 'Открытка-приглашение на ифтар',
    lead: 'Пригласите соседей и родных на ифтар красивой открыткой. Выберите дату и город — время ифтара берётся из расписания намазов сайта автоматически.',
    date: 'Дата', city: 'Город', cityPh: 'Найти город…', noCity: 'Не найдено',
    hosts: 'Хозяева', hostsPh: 'Семья Алиевых', guests: 'Обращение', guestsPh: 'Дорогие соседи',
    address: 'Адрес (необязательно)', addressPh: 'Улица, дом, квартира', note: 'Короткая записка (необязательно)', notePh: 'Будем рады вас видеть',
    phone: 'Телефон для ответа (необязательно)', remember: 'Запомнить имя на этом устройстве',
    design: 'Дизайн', designs: { lantern: 'Фонари', arch: 'Мозаичная арка', palm: 'Финиковые пальмы' },
    format: 'Размер', formats: { story: 'Сторис 9:16', post: 'Пост 4:5' },
    iftar: 'Ифтар (магриб)', download: 'Скачать картинку', share: 'Поделиться', copy: 'Копировать текст',
    copied: 'Текст приглашения скопирован', savedCopied: 'Картинка сохранена, текст скопирован', preview: 'Предпросмотр открытки',
    note2: 'Время ифтара — время магриба из расписания намазов сайта для выбранного города. Дата по хиджре — по календарю Умм аль-Кура; местное объявление может отличаться на день. Ничего не отправляется на сервер.',
    count: (n, m) => `${n}/${m}`,
  },
  ar: {
    ey: 'رمضان', title: 'بطاقة دعوة إفطار',
    lead: 'ادعُ جيرانك وأهلك إلى مائدة الإفطار ببطاقة جميلة. اختر التاريخ والمدينة، ويؤخذ وقت الإفطار تلقائيًا من جدول مواقيت الصلاة في الموقع.',
    date: 'التاريخ', city: 'المدينة', cityPh: 'ابحث عن مدينة…', noCity: 'لا نتائج',
    hosts: 'صاحب الدعوة', hostsPh: 'عائلة علييف', guests: 'المخاطَب', guestsPh: 'جيراننا الأعزاء',
    address: 'العنوان (اختياري)', addressPh: 'الشارع، المنزل، الشقة', note: 'ملاحظة قصيرة (اختياري)', notePh: 'يسعدنا حضوركم',
    phone: 'هاتف للتأكيد (اختياري)', remember: 'تذكّر الاسم على هذا الجهاز',
    design: 'التصميم', designs: { lantern: 'فوانيس', arch: 'قوس فسيفساء', palm: 'نخيل' },
    format: 'المقاس', formats: { story: 'قصة 9:16', post: 'منشور 4:5' },
    iftar: 'الإفطار (المغرب)', download: 'تنزيل الصورة', share: 'مشاركة', copy: 'نسخ النص',
    copied: 'نُسخ نص الدعوة', savedCopied: 'حُفظت الصورة ونُسخ النص', preview: 'معاينة بطاقة الدعوة',
    note2: 'وقت الإفطار هو وقت المغرب من جدول مواقيت الصلاة في الموقع للمدينة المختارة. التاريخ الهجري وفق تقويم أم القرى، وقد يختلف الإعلان المحلي بيوم. لا يُرسل شيء إلى الخادم.',
    count: (n, m) => `${n}/${m}`,
  },
  tr: {
    ey: 'Ramazan', title: 'İftar davet kartı',
    lead: 'Komşularınızı ve akrabalarınızı güzel bir kartla iftar sofrasına davet edin. Tarihi ve şehri seçin — iftar saati sitenin namaz takviminden otomatik alınır.',
    date: 'Tarih', city: 'Şehir', cityPh: 'Şehir arayın…', noCity: 'Bulunamadı',
    hosts: 'Ev sahibi', hostsPh: 'Aliyev ailesi', guests: 'Hitap', guestsPh: 'Sevgili komşularımız',
    address: 'Adres (isteğe bağlı)', addressPh: 'Sokak, ev, daire', note: 'Kısa not (isteğe bağlı)', notePh: 'Sizi görmekten mutluluk duyarız',
    phone: 'Dönüş için telefon (isteğe bağlı)', remember: 'Adı bu cihazda hatırla',
    design: 'Tasarım', designs: { lantern: 'Fenerler', arch: 'Mozaik kemer', palm: 'Hurma ağaçları' },
    format: 'Boyut', formats: { story: 'Story 9:16', post: 'Gönderi 4:5' },
    iftar: 'İftar (akşam)', download: 'Görseli indir', share: 'Paylaş', copy: 'Metni kopyala',
    copied: 'Davet metni kopyalandı', savedCopied: 'Görsel indirildi, metin kopyalandı', preview: 'Davet kartı önizlemesi',
    note2: 'İftar saati, seçilen şehir için sitenin namaz takvimindeki akşam vaktidir. Hicri tarih Ümmü’l-Kura takvimine göredir; yerel ilan bir gün farklı olabilir. Hiçbir şey sunucuya gönderilmez.',
    count: (n, m) => `${n}/${m}`,
  },
}

const PREVIEW_SCALE = 0.5

function readHost() {
  try { return localStorage.getItem(HOST_KEY) || '' } catch { return '' }
}
function writeHost(v) {
  try {
    if (v) localStorage.setItem(HOST_KEY, v)
    else localStorage.removeItem(HOST_KEY)
  } catch { /* yaddaş bağlıdır */ }
}

async function copyText(s) {
  try { await navigator.clipboard.writeText(s); return true } catch { /* köhnə üsul */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch { return false }
}

function toBlob(canvas) {
  return new Promise(res => {
    if (canvas.toBlob) canvas.toBlob(res, 'image/png')
    else res(null)
  })
}

export default function IftarInvite() {
  const { lang } = useLang()
  const u = pickUi(T, lang, 'en')
  const [loc, setLoc] = useState(() => getPrayerLocation())
  const [dateKey, setDateKey] = useState(() => gKey(defaultIftarDate(todayIn(getPrayerLocation().tz))))
  const [hosts, setHosts] = useState(readHost)
  const [remember, setRemember] = useState(() => !!readHost())
  const [guests, setGuests] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')
  const [design, setDesign] = useState('lantern')
  const [format, setFormat] = useState('story')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [fontsTick, setFontsTick] = useState(0)
  const canvasRef = useRef(null)

  const g = useMemo(() => parseGKey(dateKey) || defaultIftarDate(todayIn(loc.tz)), [dateKey, loc.tz])
  const time = useMemo(() => iftarTime(g, loc), [g, loc])
  const city = cityLabel(loc, lang)
  const dl = useMemo(() => dateLines(g, lang), [g, lang])
  const fields = useMemo(() => ({ hosts, guests, address, note, phone }), [hosts, guests, address, note, phone])
  const results = useMemo(() => (query.trim() ? searchCities(query).slice(0, 6) : []), [query])
  const card = useMemo(() => ({ design, lang, fields, g, time, city }), [design, lang, fields, g, time, city])

  // Şriftlər yüklənəndə önizləmə yenidən çəkilsin
  useEffect(() => {
    let alive = true
    try {
      const sample = 'İftar dəvəti Ramazan 0123456789 Ифтар دعوة إفطار'
      Promise.all([
        document.fonts.load(`700 40px Amiri`, sample),
        document.fonts.load(`400 40px Inter`, sample),
        document.fonts.load(`800 40px Inter`, sample),
        lang === 'ar' ? document.fonts.load('600 40px "IBM Plex Sans Arabic"', 'دعوة') : null,
      ]).then(() => { if (alive) setFontsTick(t => t + 1) }, () => {})
    } catch { /* document.fonts yoxdur */ }
    return () => { alive = false }
  }, [lang])

  // Önizləmə — yalnız məlumat dəyişəndə (bir kadrda birləşdirilir)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return undefined
    const id = requestAnimationFrame(() => {
      const f = formatOf(format)
      const w = Math.round(f.w * PREVIEW_SCALE), h = Math.round(f.h * PREVIEW_SCALE)
      if (c.width !== w) c.width = w
      if (c.height !== h) c.height = h
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.setTransform(PREVIEW_SCALE, 0, 0, PREVIEW_SCALE, 0, 0)
      ctx.clearRect(0, 0, f.w, f.h)
      renderInvite(ctx, card, f.w, f.h)
    })
    return () => cancelAnimationFrame(id)
  }, [card, format, fontsTick])

  useEffect(() => {
    if (!status) return undefined
    const id = setTimeout(() => setStatus(''), 3500)
    return () => clearTimeout(id)
  }, [status])

  const pickCity = (c) => {
    const next = locFromCity(c)
    setLoc(next)
    setQuery('')
  }

  const onHostsBlur = () => { if (remember) writeHost(hosts.trim()) }
  const onRemember = (e) => {
    const on = e.target.checked
    setRemember(on)
    writeHost(on ? hosts.trim() : '')
  }

  const message = () => inviteText({ fields, g, time, city, lang })

  // Ramazan albomu üçün yalnız say (kimə / hara yazılmır) — utils/iftarLog
  const logMade = () => logIftarInvite(todayKey())
  const exportBlob = async () => {
    const f = formatOf(format)
    const c = document.createElement('canvas')
    c.width = f.w; c.height = f.h
    const ctx = c.getContext('2d')
    if (!ctx) return null
    renderInvite(ctx, card, f.w, f.h)
    return toBlob(c)
  }

  const download = async () => {
    const win = preopenWindow()
    setBusy(true)
    try {
      const blob = await exportBlob()
      if (blob) { saveBlob(blob, fileName(g, format), win); logMade() }
    } finally { setBusy(false) }
  }

  const share = async () => {
    setBusy(true)
    try {
      const blob = await exportBlob()
      if (!blob) return
      logMade()
      const text = message()
      const file = new File([blob], fileName(g, format), { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file], text, title: u.title }) } catch { /* istifadəçi imtina etdi */ }
      } else {
        saveBlob(blob, fileName(g, format))
        if (await copyText(text)) setStatus(u.savedCopied)
      }
    } finally { setBusy(false) }
  }

  const copy = async () => { if (await copyText(message())) setStatus(u.copied) }

  return (
    <section className="ui-card ii" aria-labelledby="ii-title" data-testid="iftar-invite" data-maghrib={time}>
      <span className="ui-eyebrow">{u.ey}</span>
      <h2 id="ii-title" className="ii__title">{u.title}</h2>
      <p className="ii__lead">{u.lead}</p>

      <div className="ii__grid">
        <div className="ii__form">
          <div className="ii__row">
            <label className="ui-field" htmlFor="ii-date">
              <span className="ui-field__label">{u.date}</span>
              <input id="ii-date" data-testid="ii-date" type="date" className="ui-input" value={dateKey}
                onChange={e => { if (parseGKey(e.target.value)) setDateKey(e.target.value) }} />
            </label>
            <div className="ii__when" aria-live="polite">
              <span className="ii__when-l">{u.iftar}</span>
              <strong className="ii__when-t" data-testid="ii-time">{time || '—'}</strong>
              <span className="ii__when-d">{dl.hijri}</span>
            </div>
          </div>

          <div className="ui-field ii__city">
            <label className="ui-field__label" htmlFor="ii-city">{u.city}: <b>{city}</b></label>
            <input id="ii-city" type="search" className="ui-input" value={query} placeholder={u.cityPh}
              autoComplete="off" data-testid="ii-city" onChange={e => setQuery(e.target.value)} />
            {query.trim() && (
              <ul className="ii__results" role="listbox" aria-label={u.city}>
                {results.length ? results.map(c => (
                  <li key={c.id}>
                    <button type="button" className="ii__res" role="option" aria-selected={c.id === loc.id} onClick={() => pickCity(c)}>
                      <Icon name="pin" size={14} />{c.label[lang] || c.label.en}
                    </button>
                  </li>
                )) : <li className="ii__none">{u.noCity}</li>}
              </ul>
            )}
          </div>

          <div className="ii__row">
            <label className="ui-field" htmlFor="ii-hosts">
              <span className="ui-field__label">{u.hosts}</span>
              <input id="ii-hosts" className="ui-input" value={hosts} maxLength={LIMITS.hosts} placeholder={u.hostsPh} dir="auto"
                data-testid="ii-hosts" onChange={e => setHosts(e.target.value)} onBlur={onHostsBlur} />
            </label>
            <label className="ui-field" htmlFor="ii-guests">
              <span className="ui-field__label">{u.guests}</span>
              <input id="ii-guests" className="ui-input" value={guests} maxLength={LIMITS.guests} placeholder={u.guestsPh} dir="auto"
                data-testid="ii-guests" onChange={e => setGuests(e.target.value)} />
            </label>
          </div>
          <label className="ii__check">
            <input type="checkbox" checked={remember} onChange={onRemember} /> {u.remember}
          </label>

          <label className="ui-field" htmlFor="ii-address">
            <span className="ui-field__label">{u.address}</span>
            <input id="ii-address" className="ui-input" value={address} maxLength={LIMITS.address} placeholder={u.addressPh} dir="auto"
              data-testid="ii-address" onChange={e => setAddress(e.target.value)} />
          </label>
          <label className="ui-field" htmlFor="ii-note">
            <span className="ui-field__label">{u.note}</span>
            <textarea id="ii-note" className="ui-input ii__note-in" rows={2} value={note} maxLength={LIMITS.note} placeholder={u.notePh} dir="auto"
              data-testid="ii-note" aria-describedby="ii-note-count" onChange={e => setNote(e.target.value)} />
            <span id="ii-note-count" className="ii__count">{u.count(note.length, LIMITS.note)}</span>
          </label>
          <label className="ui-field" htmlFor="ii-phone">
            <span className="ui-field__label">{u.phone}</span>
            <input id="ii-phone" type="tel" className="ui-input" value={phone} maxLength={LIMITS.phone} placeholder="+994 50 000 00 00" dir="ltr"
              data-testid="ii-phone" onChange={e => setPhone(e.target.value)} />
          </label>

          <div className="ui-field">
            <span className="ui-field__label" id="ii-design-l">{u.design}</span>
            <div className="ii__chips" role="group" aria-labelledby="ii-design-l">
              {DESIGNS.map(d => (
                <button key={d} type="button" className="ui-chip ii__chip" data-design={d} aria-pressed={design === d} onClick={() => setDesign(d)}>
                  <span className={`ii__sw ii__sw--${d}`} aria-hidden="true" />{u.designs[d]}
                </button>
              ))}
            </div>
          </div>
          <div className="ui-field">
            <span className="ui-field__label" id="ii-format-l">{u.format}</span>
            <div className="ii__chips" role="group" aria-labelledby="ii-format-l">
              {FORMATS.map(f => (
                <button key={f.id} type="button" className="ui-chip" data-format={f.id} aria-pressed={format === f.id} onClick={() => setFormat(f.id)}>
                  {u.formats[f.id]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ii__stage">
          <canvas ref={canvasRef} className={`ii__canvas ii__canvas--${format}`} role="img" aria-label={`${u.preview}: ${u.title}, ${dl.hijri}, ${u.iftar} ${time}, ${city}`} />
          <div className="ii__btns">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share} disabled={busy} data-testid="ii-share">
              <Icon name="share" size={16} />{u.share}
            </button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={download} disabled={busy} data-testid="ii-download">
              <Icon name="download" size={16} />{u.download}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={copy} data-testid="ii-copy">
              <Icon name="copy" size={16} />{u.copy}
            </button>
          </div>
          <p className="ii__status" role="status">{status}</p>
        </div>
      </div>
      <p className="ii__note">{u.note2}</p>
    </section>
  )
}
