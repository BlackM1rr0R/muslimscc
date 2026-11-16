// ═══════════════════════════════════════════════════════
// KidsCertificate — uşaq üçün təbrik kartı (/kids → "Təbrik kartı")
//
// Valideyn uşağın adını yazır, nailiyyəti seçir (ilk namaz, Fatihə, dəstəmaz,
// ilk oruc…) — kart kətanda çəkilir: şəkil kimi yüklə, paylaş və ya çap et.
// Ad heç yerə göndərilmir (yalnız bu cihazda, son yazılan ad yadda qalır).
// Çap: kartın şəkli <body>-yə portal ilə qoyulur, @media print yalnız onu göstərir.
// ═══════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { drawKidsCard } from '../utils/kidsCard'
import { saveBlob, preopenWindow, canShareFile } from '../utils/quoteCard'
import '../styles/KidsCertificate.css'

const NAME_KEY = 'muslim_cc_kids_card_name'
const DUA = 'بارك الله فيك'
const DEEDS = ['prayer', 'fatiha', 'wudu', 'fast', 'surah', 'quran']

const T = {
  az: { title: 'Təbrik kartı', lead: 'Uşağınız ilk namazını qıldı, Fatihəni əzbərlədi və ya ilk orucunu tutdu? Adını yazın — çap ediləcək təbrik kartı hazırlansın.', name: 'Uşağın adı', namePh: 'Məs.: Əli', deed: 'Nə öyrəndi?', date: 'Tarix', head: 'Təbrik edirik!', make: 'Kartı yarat', save: 'Şəkli yüklə', share: 'Paylaş', print: 'Çap et', dua: 'بارك الله فيك — "Allah sənə bərəkət versin"', privacy: 'Ad heç yerə göndərilmir — kart bu cihazda çəkilir.', alt: (n) => `${n} üçün təbrik kartı`,
    deeds: { prayer: 'ilk namazını qıldı', fatiha: 'Fatihə surəsini əzbərlədi', wudu: 'dəstəmaz almağı öyrəndi', fast: 'ilk orucunu tutdu', surah: 'yeni surə əzbərlədi', quran: 'Quranı oxumağa başladı' } },
  en: { title: 'Certificate card', lead: 'Did your child pray their first prayer, memorise al-Fatiha or keep their first fast? Write their name — a printable card will be made.', name: 'Child’s name', namePh: 'E.g. Ali', deed: 'What did they learn?', date: 'Date', head: 'Congratulations!', make: 'Make the card', save: 'Download image', share: 'Share', print: 'Print', dua: 'بارك الله فيك — “May Allah bless you”', privacy: 'The name is not sent anywhere — the card is drawn on this device.', alt: (n) => `Certificate card for ${n}`,
    deeds: { prayer: 'prayed their first prayer', fatiha: 'memorised Surah al-Fatiha', wudu: 'learned how to make wudu', fast: 'kept their first fast', surah: 'memorised a new surah', quran: 'started reading the Quran' } },
  ru: { title: 'Поздравительная открытка', lead: 'Ваш ребёнок совершил первый намаз, выучил «аль-Фатиху» или впервые постился? Напишите имя — получится открытка для печати.', name: 'Имя ребёнка', namePh: 'Напр.: Али', deed: 'Чему научился?', date: 'Дата', head: 'Поздравляем!', make: 'Создать открытку', save: 'Скачать изображение', share: 'Поделиться', print: 'Печать', dua: 'بارك الله فيك — «Да благословит тебя Аллах»', privacy: 'Имя никуда не отправляется — открытка рисуется на этом устройстве.', alt: (n) => `Открытка для: ${n}`,
    deeds: { prayer: 'совершил(а) первый намаз', fatiha: 'выучил(а) суру «аль-Фатиха»', wudu: 'научился(ась) совершать омовение', fast: 'впервые держал(а) пост', surah: 'выучил(а) новую суру', quran: 'начал(а) читать Коран' } },
  tr: { title: 'Tebrik kartı', lead: 'Çocuğunuz ilk namazını kıldı, Fâtiha’yı ezberledi ya da ilk orucunu tuttu mu? Adını yazın — yazdırılabilir bir tebrik kartı hazırlansın.', name: 'Çocuğun adı', namePh: 'Örn.: Ali', deed: 'Ne öğrendi?', date: 'Tarih', head: 'Tebrikler!', make: 'Kartı oluştur', save: 'Resmi indir', share: 'Paylaş', print: 'Yazdır', dua: 'بارك الله فيك — “Allah seni mübarek kılsın”', privacy: 'Ad hiçbir yere gönderilmez — kart bu cihazda çizilir.', alt: (n) => `${n} için tebrik kartı`,
    deeds: { prayer: 'ilk namazını kıldı', fatiha: 'Fâtiha sûresini ezberledi', wudu: 'abdest almayı öğrendi', fast: 'ilk orucunu tuttu', surah: 'yeni bir sûre ezberledi', quran: 'Kur’an okumaya başladı' } },
  ar: { title: 'بطاقة تهنئة', lead: 'هل صلّى طفلك أول صلاة، أو حفظ الفاتحة، أو صام أول يوم؟ اكتب اسمه لتُصنع له بطاقة تهنئة قابلة للطباعة.', name: 'اسم الطفل', namePh: 'مثال: علي', deed: 'ماذا تعلّم؟', date: 'التاريخ', head: 'مبارك!', make: 'اصنع البطاقة', save: 'نزّل الصورة', share: 'شارك', print: 'اطبع', dua: 'بارك الله فيك', privacy: 'لا يُرسل الاسم إلى أي مكان — تُرسم البطاقة على هذا الجهاز.', alt: (n) => `بطاقة تهنئة لـ${n}`,
    deeds: { prayer: 'صلّى أول صلاة', fatiha: 'حفظ سورة الفاتحة', wudu: 'تعلّم الوضوء', fast: 'صام أول يوم', surah: 'حفظ سورة جديدة', quran: 'بدأ قراءة القرآن' } },
}

const todayKey = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }
const DATE_LOC = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }
function fmtDate(key, lang) {
  const [y, m, d] = key.split('-').map(Number)
  try { return new Date(y, m - 1, d).toLocaleDateString(DATE_LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return key }
}

export default function KidsCertificate() {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const [name, setName] = useState(() => { try { return localStorage.getItem(NAME_KEY) || '' } catch { return '' } })
  const [deed, setDeed] = useState('prayer')
  const [date, setDate] = useState(todayKey)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const blobRef = useRef(null)

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  const make = async (e) => {
    e?.preventDefault()
    const nm = name.trim()
    if (!nm || busy) return
    setBusy(true)
    try { localStorage.setItem(NAME_KEY, nm) } catch { /* yaddaş bağlıdır */ }
    try { await document.fonts?.load?.('700 64px "Amiri"') } catch { /* şrift yoxdursa ehtiyat şrift */ }
    const c = document.createElement('canvas')
    c.width = 1600; c.height = 1131
    drawKidsCard(c.getContext('2d'), { title: t.head, name: nm, deed: t.deeds[deed], date: fmtDate(date, lang), dua: DUA, rtl: lang === 'ar' })
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'))
    setBusy(false)
    if (!blob) return
    blobRef.current = blob
    setUrl(URL.createObjectURL(blob))
  }

  const fileName = () => `muslims-cc-${(name.trim() || 'card').replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.png`
  const save = () => { const win = preopenWindow(); if (blobRef.current) saveBlob(blobRef.current, fileName(), win) }
  const share = async () => {
    if (!blobRef.current) return
    const file = new File([blobRef.current], fileName(), { type: 'image/png' })
    if (canShareFile(file)) { try { await navigator.share({ files: [file], title: t.head }) } catch { /* imtina */ } return }
    save()
  }
  const print = () => {
    document.documentElement.classList.add('kc-printing')
    const done = () => { document.documentElement.classList.remove('kc-printing'); window.removeEventListener('afterprint', done) }
    window.addEventListener('afterprint', done)
    setTimeout(() => { window.print(); setTimeout(done, 1000) }, 50)
  }

  return (
    <div className="kc" data-testid="kids-certificate">
      <p className="kc-lead">{t.lead}</p>
      <form className="kc-form ui-card" onSubmit={make}>
        <label className="ui-field" htmlFor="kc-name">
          <span className="ui-field__label">{t.name}</span>
          <input id="kc-name" className="ui-input" value={name} maxLength={40} placeholder={t.namePh} autoComplete="off"
            onChange={(e) => setName(e.target.value)} required />
        </label>
        <div className="ui-field">
          <span className="ui-field__label" id="kc-deed-l">{t.deed}</span>
          <div className="kc-deeds" role="group" aria-labelledby="kc-deed-l">
            {DEEDS.map((k) => (
              <button key={k} type="button" className="ui-chip" aria-pressed={deed === k} onClick={() => setDeed(k)}>{t.deeds[k]}</button>
            ))}
          </div>
        </div>
        <label className="ui-field kc-date" htmlFor="kc-date">
          <span className="ui-field__label">{t.date}</span>
          <input id="kc-date" type="date" className="ui-input" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value || todayKey())} />
        </label>
        <button type="submit" className="ui-btn ui-btn--primary" disabled={!name.trim() || busy}>
          <Icon name="sparkle" className="ui-btn__icon" /> {t.make}
        </button>
        <p className="kc-privacy"><Icon name="shield" size={14} /> {t.privacy}</p>
      </form>

      {url && (
        <div className="kc-result">
          <img className="kc-img" src={url} alt={t.alt(name.trim())} width="1600" height="1131" />
          <p className="kc-dua" dir="auto">{t.dua}</p>
          <div className="kc-actions">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share}><Icon name="share" className="ui-btn__icon" /> {t.share}</button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={save}><Icon name="download" className="ui-btn__icon" /> {t.save}</button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm kc-print-btn" onClick={print}><Icon name="list" className="ui-btn__icon" /> {t.print}</button>
          </div>
          {createPortal(<div className="kc-print" aria-hidden="true"><img src={url} alt="" /></div>, document.body)}
        </div>
      )}
    </div>
  )
}
