import { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { BRAND, MOSQUE, filled, tr } from '../config/mosque'
import { haptic } from '../hooks/useHaptic'
import { localizeSource } from '../utils/sourceNames'
import '../styles/DonatePage.css'
import Breadcrumb from '../components/Breadcrumb'

// ═══════════════════════════════════════════════════════
// Məscidə ianə
//
// Qayda: bu REAL məscidin səhifəsidir. Rekvizitlər YALNIZ
// src/config/mosque.js → MOSQUE.donation-dan oxunur və yalnız
// doldurulubsa göstərilir. Ödəniş qəbulu, məbləğ, irəliləyiş zolağı,
// uydurma layihə YOXDUR.
// ═══════════════════════════════════════════════════════

// src/data/hadiths.js id 624-dan olduğu kimi köçürülüb.
// (1.2 MB-lıq hadiths.js bir hədisə görə import edilmir — mətni dəyişmə.)
// Mənbə hadiths.js-dəki kimi Azərbaycan yazılışındadır — göstərərkən
// localizeSource() onu dilə çevirir ("Bukhari 450", "Бухари 450", "البخاري 450").
const HADITH = {
  id: 624,
  source: 'Buxari 450',
  ar: 'مَنْ بَنَى مَسْجِدًا لِلَّهِ بَنَى اللَّهُ لَهُ مِثْلَهُ فِي الْجَنَّةِ',
  az: 'Kim Allah üçün bir məscid tikərsə, Allah cənnətdə onun üçün bənzərini tikər.',
  en: 'Whoever builds a mosque for Allah, Allah will build for him something similar in Paradise.',
  ru: 'Кто построит мечеть ради Аллаха, тому Аллах построит подобное в раю.',
  tr: 'Kim Allah için bir mescit yaparsa, Allah cennette ona benzerini yapar.',
}

const LABELS = {
  az: {
    title: 'Məscidə ianə',
    subtitle: 'Məscidə dəstək olmaq istəyənlər üçün məlumat',
    hadith: 'Hədis',
    details: 'İanə rekvizitləri',
    recipient: 'Alıcı',
    bank: 'Bank',
    iban: 'IBAN',
    card: 'Kart nömrəsi',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    copyFail: 'Kopyalamaq alınmadı — mətni əl ilə seçin.',
    noPayments: 'Bu sayt onlayn ödəniş qəbul etmir — köçürməni öz bankınız vasitəsilə edə bilərsiniz.',
    soon: 'İanə rekvizitləri tezliklə burada dərc olunacaq.',
    moreInfo: 'Ətraflı məlumat:',
    seeAlso: 'Həmçinin',
    journal: 'Şəxsi sədəqə gündəliyi',
    journalDesc: 'Öz xeyir əməllərinizi qeyd edin',
    zakat: 'Zəkat kalkulyatoru',
    zakatDesc: 'Zəkatınızı hesablayın',
  },
  en: {
    title: 'Donate to the Mosque',
    subtitle: 'Information for those who wish to support the mosque',
    hadith: 'Hadith',
    details: 'Donation details',
    recipient: 'Recipient',
    bank: 'Bank',
    iban: 'IBAN',
    card: 'Card number',
    copy: 'Copy',
    copied: 'Copied',
    copyFail: 'Could not copy — please select the text manually.',
    noPayments: 'This website does not accept online payments — you can make a transfer through your own bank.',
    soon: 'Donation details will be published here soon.',
    moreInfo: 'More information:',
    seeAlso: 'See also',
    journal: 'Personal charity journal',
    journalDesc: 'Keep a record of your own good deeds',
    zakat: 'Zakat calculator',
    zakatDesc: 'Calculate your zakat',
  },
  ru: {
    title: 'Пожертвование мечети',
    subtitle: 'Информация для тех, кто хочет поддержать мечеть',
    hadith: 'Хадис',
    details: 'Реквизиты для пожертвований',
    recipient: 'Получатель',
    bank: 'Банк',
    iban: 'IBAN',
    card: 'Номер карты',
    copy: 'Копировать',
    copied: 'Скопировано',
    copyFail: 'Не удалось скопировать — выделите текст вручную.',
    noPayments: 'Сайт не принимает онлайн-платежи — перевод можно сделать через ваш банк.',
    soon: 'Реквизиты для пожертвований скоро будут опубликованы здесь.',
    moreInfo: 'Подробнее:',
    seeAlso: 'См. также',
    journal: 'Личный дневник милостыни',
    journalDesc: 'Записывайте свои добрые дела',
    zakat: 'Калькулятор закята',
    zakatDesc: 'Рассчитайте свой закят',
  },
  ar: {
    title: 'التبرع للمسجد',
    subtitle: 'معلومات لمن يرغب في دعم المسجد',
    hadith: 'حديث',
    details: 'بيانات التبرع',
    recipient: 'المستفيد',
    bank: 'البنك',
    iban: 'IBAN',
    card: 'رقم البطاقة',
    copy: 'نسخ',
    copied: 'تم النسخ',
    copyFail: 'تعذّر النسخ — يُرجى تحديد النص يدويًا.',
    noPayments: 'لا يقبل هذا الموقع المدفوعات الإلكترونية — يمكنك التحويل عبر مصرفك.',
    soon: 'ستُنشر بيانات التبرع هنا قريبًا.',
    moreInfo: 'لمزيد من المعلومات:',
    seeAlso: 'انظر أيضًا',
    journal: 'يوميات الصدقة الشخصية',
    journalDesc: 'سجّل أعمالك الخيرية',
    zakat: 'حاسبة الزكاة',
    zakatDesc: 'احسب زكاتك',
  },
  tr: {
    title: 'Camiye Bağış',
    subtitle: 'Camiye destek olmak isteyenler için bilgi',
    hadith: 'Hadis',
    details: 'Bağış bilgileri',
    recipient: 'Alıcı',
    bank: 'Banka',
    iban: 'IBAN',
    card: 'Kart numarası',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    copyFail: 'Kopyalanamadı — lütfen metni elle seçin.',
    noPayments: 'Bu site çevrimiçi ödeme kabul etmez — havaleyi kendi bankanız üzerinden yapabilirsiniz.',
    soon: 'Bağış bilgileri yakında burada yayımlanacak.',
    moreInfo: 'Ayrıntılı bilgi:',
    seeAlso: 'Ayrıca bakın',
    journal: 'Kişisel sadaka günlüğü',
    journalDesc: 'Kendi hayır işlerinizi kaydedin',
    zakat: 'Zekât hesaplayıcı',
    zakatDesc: 'Zekâtınızı hesaplayın',
  },
}

// ── Köməkçilər ───────────────────────────────────────

/** Boşluqları sil — kopyalanan dəyər bankın qəbul etdiyi formada olsun. */
function compact(v, { upper = false } = {}) {
  const s = String(v ?? '').replace(/[\s-]+/g, '')
  return upper ? s.toUpperCase() : s
}

/** 4-lü qruplara böl: AZ21NABZ... → "AZ21 NABZ ..." (yalnız göstərmək üçün). */
function group4(s) {
  return s.replace(/(.{4})(?=.)/g, '$1 ')
}

/** Telefonu tel: linki üçün təmizlə (yalnız rəqəmlər və "+"). */
function telHref(phone) {
  return 'tel:' + String(phone).replace(/[^\d+]/g, '')
}

/**
 * Buferə kopyala. navigator.clipboard yalnız təhlükəsiz kontekstdə (https,
 * localhost) işləyir — olmadıqda köhnə textarea + execCommand üsuluna keç.
 */
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* fallback-ə keç */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-1000px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

function CopyIcon({ done }) {
  return done ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

/** Kopyalana bilən sətir (IBAN, kart nömrəsi). */
function CopyRow({ id, label, value, t, status, onCopy }) {
  const done = status?.key === id && status.ok
  const failed = status?.key === id && !status.ok
  const valueRef = useRef(null)

  // Kopyalama alınmadısa, mətni özümüz seçək — istifadəçi dərhal əl ilə kopyalaya bilsin
  useEffect(() => {
    if (!failed || !valueRef.current) return
    try {
      const range = document.createRange()
      range.selectNodeContents(valueRef.current)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    } catch { /* seçim dəstəklənmir — mesaj kifayətdir */ }
  }, [failed])

  // Əl ilə kopyalananda da (Ctrl+C) düymədəki kimi boşluqsuz dəyər getsin.
  // Yalnız bütün dəyər seçiləndə — qismən seçimdə brauzerin öz davranışı qalır.
  const onManualCopy = (e) => {
    const sel = window.getSelection()?.toString() ?? ''
    if (!e.clipboardData || compact(sel, { upper: true }) !== compact(value, { upper: true })) return
    e.clipboardData.setData('text/plain', value)
    e.preventDefault()
  }

  return (
    <div className="dn-row dn-row-copy">
      <dt>{label}</dt>
      <dd>
        <span ref={valueRef} className="dn-mono" dir="ltr" onCopy={onManualCopy}>{group4(value)}</span>
        <button
          type="button"
          className={`dn-copy press${done ? ' is-copied' : ''}`}
          onClick={() => onCopy(id, value)}
          aria-label={`${t.copy}: ${label}`}
        >
          <CopyIcon done={done} />
          <span>{done ? t.copied : t.copy}</span>
        </button>
        {failed && <span className="dn-copy-fail">{t.copyFail}</span>}
      </dd>
    </div>
  )
}

export default function DonatePage({ setPage }) {
  const { lang } = useLang()
  const t = LABELS[lang] || LABELS.en

  // ── Rekvizitlər — yalnız config-dən ──
  const d = MOSQUE.donation || {}
  const iban = compact(d.iban, { upper: true })
  const card = compact(d.cardNumber)
  const hasBank = filled(iban) || filled(card)
  const note = tr(d.note, lang)
  const phone = filled(MOSQUE.phone) ? MOSQUE.phone.trim() : ''

  // ── Kopyalama vəziyyəti ──
  const [copyStatus, setCopyStatus] = useState(null) // { key, ok }
  const timerRef = useRef(null)
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleCopy = async (key, value) => {
    // Toxunma ekranında yüngül titrəmə — kopyalama "hiss" olunsun (await-dən əvvəl:
    // brauzer titrəməni yalnız toxunuşun özü zamanı icazə verir)
    haptic()
    const ok = await copyText(value)
    setCopyStatus({ key, ok })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopyStatus(null), ok ? 2000 : 5000)
  }

  const hadithText = lang === 'ar' ? '' : (HADITH[lang] || HADITH.en)

  const contactLine = phone && (
    <p className="dn-contact">
      {t.moreInfo}{' '}
      <a href={telHref(phone)} dir="ltr">{phone}</a>
    </p>
  )

  return (
    <div className="donate-page">
      {/* Hero */}
      <div className="page-hero theme-donate hero-compact">
        {/* Bütün hero-larda eyni iz: Ana səhifə › … (components/Breadcrumb) */}
        <Breadcrumb setPage={setPage} current={t.title} />
        <div className="page-hero-arabic">{BRAND.arabicMotto}</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="dn-wrap">

        {/* Hədis — Buxari 450 */}
        <figure className="dn-hadith" data-reveal="scale">
          <span className="dn-eyebrow">{t.hadith}</span>
          <blockquote className="dn-quote">
            <p className="dn-hadith-ar" lang="ar" dir="rtl">{HADITH.ar}</p>
            {hadithText && <p className="dn-hadith-text">{hadithText}</p>}
          </blockquote>
          <figcaption className="dn-hadith-source">
            — <bdi>{localizeSource(HADITH.source, lang)}</bdi>
          </figcaption>
        </figure>

        {hasBank ? (
          /* Bank rekvizitləri — yalnız IBAN və ya kart nömrəsi doldurulubsa */
          <section className="dn-card dn-bank" data-reveal data-reveal-delay="60" aria-labelledby="dn-bank-title">
            <h2 id="dn-bank-title" className="dn-card-title">{t.details}</h2>
            <dl className="dn-list">
              {filled(d.recipient) && (
                <div className="dn-row">
                  <dt>{t.recipient}</dt>
                  <dd>{d.recipient}</dd>
                </div>
              )}
              {filled(d.bankName) && (
                <div className="dn-row">
                  <dt>{t.bank}</dt>
                  <dd>{d.bankName}</dd>
                </div>
              )}
              {filled(iban) && (
                <CopyRow id="iban" label={t.iban} value={iban} t={t} status={copyStatus} onCopy={handleCopy} />
              )}
              {filled(card) && (
                <CopyRow id="card" label={t.card} value={card} t={t} status={copyStatus} onCopy={handleCopy} />
              )}
            </dl>
            {filled(note) && <p className="dn-note">{note}</p>}
            <p className="dn-footnote">{t.noPayments}</p>
            {contactLine}
          </section>
        ) : (
          /* Boş vəziyyət — rekvizitlər hələ əlavə olunmayıb */
          <section className="dn-card dn-soon" data-reveal data-reveal-delay="60">
            <span className="dn-soon-icon" aria-hidden="true">🕌</span>
            <p className="dn-soon-text">{t.soon}</p>
            {contactLine}
          </section>
        )}

        {/* Ekran oxuyucuları üçün kopyalama nəticəsi */}
        <p className="dn-sr" aria-live="polite">
          {copyStatus ? (copyStatus.ok ? t.copied : t.copyFail) : ''}
        </p>

        {/* Əlaqəli alətlər */}
        {/* Telefonda iki kart bir qruplaşdırılmış siyahıya çevrilir (CSS) */}
        <nav className="dn-links" data-reveal data-reveal-delay="120" aria-label={t.seeAlso}>
          <h2 className="dn-links-title">{t.seeAlso}</h2>
          <div className="dn-links-grid">
            <button type="button" className="dn-link" onClick={() => setPage('charity')}>
              <span className="dn-link-icon icon-tile--teal" aria-hidden="true">🤲</span>
              <span className="dn-link-body">
                <span className="dn-link-title">{t.journal}</span>
                <span className="dn-link-desc">{t.journalDesc}</span>
              </span>
              <span className="dn-link-arrow" aria-hidden="true">→</span>
            </button>
            <button type="button" className="dn-link" onClick={() => setPage('zakat')}>
              <span className="dn-link-icon icon-tile--gold" aria-hidden="true">🧮</span>
              <span className="dn-link-body">
                <span className="dn-link-title">{t.zakat}</span>
                <span className="dn-link-desc">{t.zakatDesc}</span>
              </span>
              <span className="dn-link-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </nav>

      </div>
    </div>
  )
}
