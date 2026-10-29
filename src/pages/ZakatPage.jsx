import { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { localizeSource } from '../utils/sourceNames'
import '../styles/ZakatPage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'

// Təxmini qiymətlər (USD / qram). Nisab eyni qızıl qiyməti ilə hesablanır —
// əvvəl nisab $50/q, qızıl varlığı isə $75/q ilə sayılırdı (85q qızıl nisabdan
// xeyli yuxarı çıxırdı).
const GOLD_USD_PER_G   = 75
const SILVER_USD_PER_G = 0.90
const NISAB_USD        = 85 * GOLD_USD_PER_G   // 85q qızıl

// Bayraq emojiləri çıxarıldı: Windows-da iki hərf kimi görünür ("AZ AZN ₼")
const CURRENCIES = [
  { code:'AZN', symbol:'₼'   },
  { code:'USD', symbol:'$'   },
  { code:'EUR', symbol:'€'   },
  { code:'RUB', symbol:'₽'   },
  { code:'TRY', symbol:'₺'   },
  { code:'SAR', symbol:'﷼'  },
  { code:'GBP', symbol:'£'   },
  { code:'AED', symbol:'د.إ' },
]
const NUM_LOCALES = { az: 'az-AZ', en: 'en-US', ru: 'ru-RU', tr: 'tr-TR', ar: 'ar-u-nu-latn' }
const FALLBACK = { USD:1, AZN:1.70, EUR:0.92, RUB:91, TRY:32, SAR:3.75, GBP:0.79, AED:3.67 }

const L = {
  salaryLabel:  { az:'Aylıq maaş',           ru:'Зарплата (в месяц)',   ar:'الراتب الشهري',      tr:'Aylık Maaş',          en:'Monthly Salary'      },
  savingsLabel: { az:'Yığım / bank hesabı',   ru:'Сбережения / Банк',   ar:'المدخرات / البنك',   tr:'Birikim / Banka',      en:'Savings / Bank'      },
  otherLabel:   { az:'Digər pul varlıqları',  ru:'Прочие активы',       ar:'أصول أخرى',          tr:'Diğer Varlıklar',      en:'Other Assets'        },
  goldLabel:    { az:'Qızıl (qram)',          ru:'Золото (граммы)',      ar:'الذهب (غرام)',       tr:'Altın (gram)',          en:'Gold (grams)'        },
  silverLabel:  { az:'Gümüş (qram)',          ru:'Серебро (граммы)',     ar:'الفضة (غرام)',       tr:'Gümüş (gram)',          en:'Silver (grams)'      },
  stocksLabel:  { az:'Səhmlər / investisiya', ru:'Акции / Инвестиции',  ar:'أسهم / استثمارات',   tr:'Hisse / Yatırım',       en:'Stocks / Investments'},
  rentLabel:    { az:'İcarə gəliri (aylıq)',  ru:'Доход от аренды (мес.)', ar:'دخل الإيجار (شهري)', tr:'Kira Geliri (aylık)', en:'Rental Income (monthly)' },
  debtLabel:    { az:'Borclar (çıxılacaq)',   ru:'Долги (вычитаются)',  ar:'الديون (تخصم)',      tr:'Borçlar (düşülecek)',    en:'Debts (deducted)'    },
  fitrTitle:    { az:'Fitrə zəkatı',          ru:'Закят аль-Фитр',      ar:'زكاة الفطر',         tr:'Fıtır Sadakası',        en:'Zakat al-Fitr'       },
  fitrDesc:     { az:'Ramazan sonunda hər şəxs üçün ödənir', ru:'Выплачивается в конце Рамадана за каждого', ar:'تُدفع في نهاية رمضان عن كل فرد', tr:'Ramazan sonunda her birey için ödenir', en:'Paid at the end of Ramadan per person' },
  fitrPeople:   { az:'Ailə üzvləri sayı',     ru:'Кол-во членов семьи', ar:'عدد أفراد الأسرة',   tr:'Aile üyesi sayısı',     en:'Number of family members' },
  fitrAmount:   { az:'Fitrə məbləği (1 nəfər)', ru:'Сумма фитра (1 чел.)', ar:'مبلغ الفطرة (شخص)', tr:'Fıtır miktarı (1 kişi)', en:'Fitr amount (per person)' },
  fitrTotal:    { az:'Ümumi fitrə',            ru:'Общий фитр',           ar:'إجمالي الفطرة',      tr:'Toplam fıtır',           en:'Total fitr'          },
  goldPrice:    { az:'Qızıl qiyməti / qram',   ru:'Цена золота / грамм', ar:'سعر الذهب / غرام',  tr:'Altın fiyatı / gram',    en:'Gold price / gram'   },
  silverPrice:  { az:'Gümüş qiyməti / qram',   ru:'Цена серебра / грамм', ar:'سعر الفضة / غرام', tr:'Gümüş fiyatı / gram',   en:'Silver price / gram'  },
  annualIncome: { az:'İllik gəlir',           ru:'Годовой доход',        ar:'الدخل السنوي',       tr:'Yıllık Gelir',         en:'Annual Income'       },
  totalLabel:   { az:'Zəkat hesabı üçün cəm', ru:'Итого для расчёта',  ar:'المجموع للحساب',     tr:'Hesap Toplamı',        en:'Total for Zakat'     },
  nisabLabel:   { az:'Nisab həddi',            ru:'Порог Нисаба',         ar:'حد النصاب',          tr:'Nisap Sınırı',         en:'Nisab Threshold'     },
  aboveNisab:   { az:'Nisab üzərindədir',     ru:'Выше нисаба',          ar:'يبلغ النصاب',        tr:'Nisap üzerinde',       en:'Above Nisab'         },
  belowNisab:   { az:'Nisab altındadır',      ru:'Ниже нисаба',          ar:'دون النصاب',         tr:'Nisap altında',        en:'Below Nisab'         },
  zakatDue:     { az:'Ödənilməli zəkat',      ru:'Закят к уплате',       ar:'الزكاة الواجبة',     tr:'Ödenecek Zekât',       en:'Zakat Due'           },
  nisabNote:    { az:'Nisabdan aşağı — zəkat vacib deyil', ru:'Ниже нисаба — закят не обязателен', ar:'أقل من النصاب — لا زكاة', tr:'Nisap altında — zekât gerekmez', en:'Below nisab — zakat not obligatory' },
  currency:     { az:'Valyuta',               ru:'Валюта',                ar:'العملة',             tr:'Para Birimi',           en:'Currency'            },
  rateLabel:    { az:'1 USD =',               ru:'1 USD =',               ar:'1 دولار =',            tr:'1 USD =',               en:'1 USD ='             },
  rateLoading:  { az:'Yüklənir...',           ru:'Загрузка...',           ar:'تحميل...',           tr:'Yükleniyor...',         en:'Loading...'          },
  assetsTitle:  { az:'Varlıqlarınız',         ru:'Ваши активы',           ar:'أصولك',              tr:'Varlıklarınız',         en:'Your Assets'         },
  monthlyX12:   { az:'× 12 ay',              ru:'× 12 мес.',             ar:'× ١٢ شهراً',         tr:'× 12 ay',              en:'× 12 months'         },
  resultTitle:  { az:'Zəkat nəticəsi',        ru:'Расчёт закята',         ar:'نتيجة الزكاة',       tr:'Zekât Sonucu',          en:'Zakat Result'        },
  perYear:      { az:'/ il',                  ru:'/ год',                  ar:'/ سنة',              tr:'/ yıl',                 en:'/ year'              },
  perMonth:     { az:'/ ay',                  ru:'/ мес.',                 ar:'/ شهر',              tr:'/ ay',                  en:'/ month'             },
  reset:        { az:'Sıfırla',               ru:'Сброс',                  ar:'إعادة',              tr:'Sıfırla',               en:'Reset'               },
  priceNote:    { az:'Qiymətlər təxminidir: qızıl ≈ {g}/q, gümüş ≈ {s}/q', ru:'Цены приблизительные: золото ≈ {g}/г, серебро ≈ {s}/г', ar:'الأسعار تقريبية: الذهب ≈ {g}/غ، الفضة ≈ {s}/غ', tr:'Fiyatlar yaklaşıktır: altın ≈ {g}/g, gümüş ≈ {s}/g', en:'Prices are approximate: gold ≈ {g}/g, silver ≈ {s}/g' },
}
const s = (k, l) => L[k]?.[l] || L[k]?.en || ''

// ── Ayə: mətn yaddaşdan yazılmır, alquran.cloud-dan gəlir ──
// Ərəbcə Osmani yazısı + cari dilin tərcüməsi (ərəbcədə yalnız əsl mətn).
// Sessiya ərzində sessionStorage-də saxlanılır; sorğu alınmasa kart görünmür.
const AYAH_AR = 'quran-uthmani'
const AYAH_EDITIONS = { az:'az.mammadaliyev', en:'en.asad', ru:'ru.kuliev', tr:'tr.diyanet' }

function readAyah(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const d = JSON.parse(raw)
    return d && typeof d.ar === 'string' && d.ar ? d : null
  } catch {
    return null
  }
}

function useAyah(ref, lang) {
  const edition = lang === 'ar' ? '' : (AYAH_EDITIONS[lang] || AYAH_EDITIONS.en)
  const key = `zakat_ayah_${ref.replace(':', '_')}_${lang}`
  const [state, setState] = useState(() => ({ key, data: readAyah(key) }))

  useEffect(() => {
    const cached = readAyah(key)
    if (cached) { setState({ key, data: cached }); return undefined }
    setState({ key, data: null })

    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10000)
    const eds = edition ? `${AYAH_AR},${edition}` : AYAH_AR
    fetch(`https://api.alquran.cloud/v1/ayah/${ref}/editions/${eds}`, { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(json => {
        const list = Array.isArray(json?.data) ? json.data : (json?.data ? [json.data] : [])
        const arabic = list.find(a => a?.edition?.identifier === AYAH_AR)
        const trans = edition ? list.find(a => a?.edition?.identifier === edition) : null
        if (!arabic?.text || (edition && !trans?.text)) throw new Error('bad response')
        const data = { ar: arabic.text, text: trans?.text || '' }
        try { sessionStorage.setItem(key, JSON.stringify(data)) } catch { /* yaddaş bağlıdır */ }
        if (alive) setState({ key, data })
      })
      .catch(() => { if (alive) setState({ key, data: null }) })
      .finally(() => clearTimeout(timer))

    return () => {
      alive = false
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [key, ref, edition])

  // Dil dəyişəndə köhnə dilin ayəsi bir anlıq da görünməsin
  return state.key === key ? state.data : readAyah(key)
}

// "Hərəkəti azalt" seçilibmi? (say-artım animasiyası onda dərhal son dəyəri göstərir)
const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/** Say-artım (count-up): dəyər dəyişəndə rəqəm köhnədən yenisinə ~0.65 san.
 *  ərzində yumşaq "axır" (yalnız mətn dəyişir — layout/transform yoxdur).
 *  Hesablama düsturuna toxunmur: yalnız GÖSTƏRİLƏN rəqəmdir, son kadr
 *  dəqiq hədəf dəyərdir. Hərəkət azaldılıbsa — dərhal son dəyər. */
function useCountUp(target, duration = 650) {
  const [shown, setShown] = useState(target)
  const from = useRef(target)
  const raf = useRef(0)
  useEffect(() => {
    const start = from.current
    if (start === target) return undefined
    if (prefersReducedMotion() || typeof requestAnimationFrame === 'undefined') {
      from.current = target
      setShown(target)
      return undefined
    }
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      const val = p === 1 ? target : start + (target - start) * eased
      from.current = val
      setShown(val)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return shown
}

/** Animasiyalı pul məbləği: <Money value={…} symbol="₼" fmt={fmt} /> */
function Money({ value, symbol, fmt, className = '' }) {
  const v = useCountUp(value)
  return <span className={`zakat-money ui-num${className ? ' ' + className : ''}`}>{symbol}{fmt(v)}</span>
}

// ── Varlıq sahəsi (dizayn v2): ikon + etiket → valyuta önəkli sahə → izah.
// Bütün blok <label>-dir: ikona və ya yazıya toxunmaq da sahəni fokuslayır.
// tone — ikon kafelinin variantı (ui-icon-tile--accent | --neutral | susma brend)
function ZakatField({ icon, tone = '', label, prefix, value, onChange, placeholder = '0.00', hint = null, className = '' }) {
  return (
    <label className={`ui-field zakat-field${className ? ' ' + className : ''}`}>
      <span className="zakat-field-head">
        <span className={`ui-icon-tile ui-icon-tile--sm${tone ? ` ui-icon-tile--${tone}` : ''}`}><Icon name={icon} /></span>
        <span className="ui-field__label">{label}</span>
      </span>
      <span className="zakat-input-wrap">
        <span className="zakat-cur-prefix" aria-hidden="true"><bdi>{prefix}</bdi></span>
        <input type="number" inputMode="decimal" className="ui-input zakat-input"
          min="0" value={value} placeholder={placeholder}
          aria-invalid={parseFloat(value) < 0 || undefined}
          onChange={e => onChange(e.target.value)} />
      </span>
      {hint && <span className="ui-field__hint zakat-field-hint">{hint}</span>}
    </label>
  )
}

export default function ZakatPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.zakat || T.az.zakat
  const l = ['az','ru','ar','tr'].includes(lang) ? lang : 'en'

  const [currency,    setCurrency]    = useState('AZN')
  const [rates,       setRates]       = useState(FALLBACK)
  const [rateLoading, setRateLoading] = useState(true)
  const [salary,      setSalary]      = useState('')
  const [savings,     setSavings]     = useState('')
  const [other,       setOther]       = useState('')
  const [gold,        setGold]        = useState('')
  const [silver,      setSilver]      = useState('')
  const [stocks,      setStocks]      = useState('')
  const [rent,        setRent]        = useState('')
  const [debt,        setDebt]        = useState('')
  const [fitrPeople,  setFitrPeople]  = useState('1')
  const goldPrice   = GOLD_USD_PER_G
  const silverPrice = SILVER_USD_PER_G
  const ayah = useAyah('2:43', lang)
  const dueRef = useRef(null)

  // Tək sütunlu düzümdə (<1180px) nəticə kartları ilk ekranın altında qalır —
  // yalnız onda sürüşəndə görünmə (data-reveal) verilir. Genişdə kartlar
  // ilk ekrandadır və səhifə keçidi onsuz da animasiya edir.
  const [revealResults] = useState(() => {
    try { return window.matchMedia('(max-width: 1179.98px)').matches } catch { return false }
  })
  const reveal = revealResults ? { 'data-reveal': '' } : {}

  // Yapışqan cəm zolağına toxunanda "Ödənilməli Zəkat" kartına keç
  const scrollToDue = () => {
    let smooth = true
    try { smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { /* köhnə brauzer */ }
    dueRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' })
  }

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(d => {
        if (d.rates) {
          const r = {}
          CURRENCIES.forEach(c => { r[c.code] = d.rates[c.code] || FALLBACK[c.code] })
          setRates(r)
        }
      })
      .catch(() => {})
      .finally(() => setRateLoading(false))
  }, [])

  const cur      = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]
  const rate     = rates[currency] || 1
  const nisabLoc = NISAB_USD * rate  // nisab seçilmiş valyutada

  // Mənfi, sonsuz (1e999) və ya boş dəyər hesabı pozmasın: yalnız sonlu, ≥ 0 ədəd.
  // Əvvəl "-5000" yığımı cəmdən çıxırdı, mənfi borc isə cəmə əlavə olunurdu.
  const n = v => { const x = parseFloat(v); return Number.isFinite(x) && x > 0 ? x : 0 }

  const salaryMonth  = n(salary)
  const salaryAnnual = salaryMonth * 12
  const savingsVal   = n(savings)
  const otherVal     = n(other)
  const goldVal      = n(gold) * goldPrice * rate
  const silverVal    = n(silver) * silverPrice * rate
  const stocksVal    = n(stocks)
  const rentVal      = n(rent) * 12
  const debtVal      = n(debt)

  const totalAssets = salaryAnnual + savingsVal + otherVal + goldVal + silverVal + stocksVal + rentVal
  const total       = Math.max(totalAssets - debtVal, 0)
  const aboveNisab  = total >= nisabLoc
  const zakatYear   = aboveNisab ? total * 0.025 : 0
  const zakatMonth  = zakatYear / 12

  // Fitrə
  const FITR_USD    = 12 // ~$12 per person
  const fitrPerPerson = FITR_USD * rate
  const fitrTotal   = fitrPerPerson * Math.floor(n(fitrPeople))   // 2.5 nəfər olmur

  // Rəqəm formatı saytın dilinə görədir (əvvəl brauzerin dili idi: ru səhifədə "1,234.56",
  // sıfır isə həmişə "0.00" — eyni kartda iki fərqli format). Ərəbcədə latın rəqəmləri.
  const fmt = v => (Number.isFinite(v) ? v : 0).toLocaleString(NUM_LOCALES[lang] || 'en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
  const pct  = Math.min((total / nisabLoc) * 100, 100)

  const reset = () => { setSalary(''); setSavings(''); setOther(''); setGold(''); setSilver(''); setStocks(''); setRent(''); setDebt(''); setFitrPeople('1') }

  // Cəm cədvəlinin sətirləri (sıfır olan isteğe bağlı sətirlər gizlənir)
  const rows = [
    { k: 'salary',  icon: 'user',      label: s('salaryLabel',l),  val: salaryAnnual, sub: `${cur.symbol}${fmt(salaryMonth)} × 12`, show: true },
    { k: 'savings', icon: 'shield',    label: s('savingsLabel',l), val: savingsVal, show: true },
    { k: 'other',   icon: 'list',      label: s('otherLabel',l),   val: otherVal, show: true },
    { k: 'gold',    icon: 'zakat',     label: s('goldLabel',l),    val: goldVal, show: n(gold) > 0 },
    { k: 'silver',  icon: 'zakat',     label: s('silverLabel',l),  val: silverVal, show: n(silver) > 0 },
    { k: 'stocks',  icon: 'analytics', label: s('stocksLabel',l),  val: stocksVal, show: n(stocks) > 0 },
    { k: 'rent',    icon: 'home',      label: s('rentLabel',l),    val: rentVal, show: n(rent) > 0 },
  ]

  return (
    <div className="zakat-page">
      {/* Hero — dizayn v2: sakit kağız fon + xatəm naxışı, bir <h1> */}
      <header className="ui-page-hero zakat-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('zakat'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {lang !== 'ar' && <p className="zakat-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">الزَّكَاةُ</p>}
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container zakat-layout">

          {/* ══ Daxiletmə ══ */}
          <div className="ui-card zakat-inputs">

            {/* Valyuta */}
            <div className="zakat-currency-block">
              <div className="zakat-currency-header">
                <span className="zakat-block-label" id="zakat-cur-label">
                  <Icon name="globe" size={16} /> {s('currency',l)}
                </span>
                {rateLoading
                  ? <span className="ui-badge zakat-rate-badge">{s('rateLoading',l)}</span>
                  : <span className="ui-badge ui-badge--brand zakat-rate-badge">{s('rateLabel',l)} <strong className="ui-num">{fmt(rate)} {cur.symbol}</strong></span>
                }
              </div>
              <div className="zakat-currency-grid" role="group" aria-labelledby="zakat-cur-label">
                {CURRENCIES.map(c => (
                  <button key={c.code} type="button"
                    className="ui-chip zakat-cur-btn"
                    aria-pressed={currency === c.code}
                    onClick={() => setCurrency(c.code)}
                  >
                    <span>{c.code}</span>
                    <small aria-hidden="true">{c.symbol}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Sahələr */}
            <h2 className="zakat-block-label zakat-assets-title">{s('assetsTitle',l)}</h2>
            <div className="zakat-fields" data-reveal="stagger">

              {/* Maaş — aylıq */}
              <ZakatField icon="user" label={s('salaryLabel',l)} prefix={cur.symbol}
                value={salary} onChange={setSalary}
                hint={salaryMonth > 0 && <>{s('monthlyX12',l)} = <b className="zakat-ltr ui-num">{cur.symbol}{fmt(salaryAnnual)}</b></>} />

              {/* Yığım */}
              <ZakatField icon="shield" label={s('savingsLabel',l)} prefix={cur.symbol}
                value={savings} onChange={setSavings} />

              {/* Digər */}
              <ZakatField icon="list" label={s('otherLabel',l)} prefix={cur.symbol}
                value={other} onChange={setOther} />

              {/* Səhmlər */}
              <ZakatField icon="analytics" label={s('stocksLabel',l)} prefix={cur.symbol}
                value={stocks} onChange={setStocks} />

              {/* Qızıl */}
              <ZakatField icon="zakat" tone="accent" label={s('goldLabel',l)} prefix="g" placeholder="0"
                value={gold} onChange={setGold}
                hint={n(gold) > 0 && <b className="zakat-ltr ui-num">≈ {cur.symbol}{fmt(goldVal)}</b>} />

              {/* Gümüş */}
              <ZakatField icon="zakat" tone="neutral" label={s('silverLabel',l)} prefix="g" placeholder="0"
                value={silver} onChange={setSilver}
                hint={n(silver) > 0 && <b className="zakat-ltr ui-num">≈ {cur.symbol}{fmt(silverVal)}</b>} />

              {/* İcarə gəliri */}
              <ZakatField icon="home" label={s('rentLabel',l)} prefix={cur.symbol}
                value={rent} onChange={setRent}
                hint={n(rent) > 0 && <>{s('monthlyX12',l)} = <b className="zakat-ltr ui-num">{cur.symbol}{fmt(rentVal)}</b></>} />

              {/* Borclar */}
              <ZakatField icon="minus" tone="neutral" label={s('debtLabel',l)} prefix={`−${cur.symbol}`}
                value={debt} onChange={setDebt} className="zakat-field-debt" />
            </div>

            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm zakat-reset-btn" onClick={reset}>
              <Icon name="refresh" className="ui-btn__icon" /> {s('reset',l)}
            </button>

            {/* Tək sütunlu düzümdə: yazdıqca zəkat məbləği ekranın altında
                görünür (sahələr bitənə qədər yapışqan qalır); toxunanda nəticəyə keçir.
                İki sütunlu düzümdə gizlidir — nəticə sütunu yanda görünür. */}
            {totalAssets > 0 && (
              <button type="button" className="zakat-sticky-sum" onClick={scrollToDue}>
                <span className="zakat-sticky-text">
                  <span className="zakat-sticky-title">{s('zakatDue',l)}</span>
                  <span className={`zakat-sticky-sub ${aboveNisab ? 'yes' : 'no'}`}>
                    {aboveNisab ? s('aboveNisab',l) : s('belowNisab',l)}
                  </span>
                </span>
                <span className="zakat-sticky-amount-wrap">
                  <Money value={zakatYear} symbol={cur.symbol} fmt={fmt} className="zakat-sticky-amount" />
                  <span className="zakat-sticky-period">{s('perYear',l)}</span>
                </span>
                <Icon name="chevronDown" size={18} className="zakat-sticky-chev" />
              </button>
            )}
          </div>

          {/* ══ Nəticə ══ */}
          <div className="zakat-result">

            {/* Zəkat nəticəsi — həmişə görünür; nisab keçiləndə kart tünd
                zümrüdə keçir və bir dəfə yumşaq "açılır" (key) */}
            <div ref={dueRef} key={aboveNisab ? 'on' : 'off'}
              className={`ui-card zakat-due-card ${aboveNisab ? 'ui-card--inverse active' : 'ui-card--sunken inactive'}`}
              {...reveal}>
              <div className="zakat-due-label">{s('zakatDue',l)}</div>

              {aboveNisab ? (
                <>
                  <div className="zakat-due-row">
                    <div className="zakat-due-block">
                      <Money value={zakatYear} symbol={cur.symbol} fmt={fmt} className="zakat-due-amount" />
                      <div className="zakat-due-period">{s('perYear',l)}</div>
                    </div>
                    <div className="zakat-due-divider" aria-hidden="true" />
                    <div className="zakat-due-block">
                      <Money value={zakatMonth} symbol={cur.symbol} fmt={fmt} className="zakat-due-amount zakat-due-sm" />
                      <div className="zakat-due-period">{s('perMonth',l)}</div>
                    </div>
                  </div>
                  <span className="zakat-due-pct ui-num">2.5%</span>
                </>
              ) : (
                <>
                  <div className="zakat-due-amount zakat-money ui-num">{cur.symbol}{fmt(0)}</div>
                  <p className="zakat-due-note">{s('nisabNote',l)}</p>
                </>
              )}
            </div>

            {/* Nisab irəliləyişi */}
            <div className={`ui-card nisab-card ${aboveNisab ? 'above' : ''}`} {...reveal}>
              <div className="nisab-header">
                <span className="zakat-block-label">{s('nisabLabel',l)}</span>
                <span className={`ui-badge nisab-badge ${aboveNisab ? 'yes' : 'no'}`}>
                  <Icon name={aboveNisab ? 'check' : 'info'} size={14} />
                  {aboveNisab ? s('aboveNisab',l) : s('belowNisab',l)}
                </span>
              </div>
              <div className="nisab-value zakat-money ui-num">{cur.symbol}{fmt(nisabLoc)}</div>
              {/* Doluluq transform ilə (layout yox) — ZakatPage.css → .nisab-bar */}
              <div className="nisab-bar-wrap" role="progressbar" aria-label={s('nisabLabel',l)}
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
                <div className="nisab-bar" style={{ transform: `scaleX(${pct / 100})` }} />
              </div>
              <div className="nisab-bar-labels ui-num">
                <span className="zakat-ltr">{cur.symbol}0</span>
                <span className="zakat-ltr">{cur.symbol}{fmt(nisabLoc)}</span>
              </div>
              <p className="nisab-note">{t.note}</p>
              <p className="nisab-note nisab-price-note">
                {s('priceNote',l)
                  .replace('{g}', `${cur.symbol}${fmt(goldPrice * rate)}`)
                  .replace('{s}', `${cur.symbol}${fmt(silverPrice * rate)}`)}
              </p>
            </div>

            {/* Cəm cədvəli */}
            <div className="ui-card zakat-breakdown" {...reveal}>
              <h2 className="zakat-block-label zakat-breakdown-title">
                <Icon name="analytics" size={16} /> {s('resultTitle',l)}
              </h2>
              <ul className="breakdown-list">
                {rows.filter(r => r.show).map(r => (
                  <li key={r.k} className="breakdown-row">
                    <span className="breakdown-icon" aria-hidden="true"><Icon name={r.icon} size={16} /></span>
                    <span className="breakdown-label-wrap">
                      <span className="breakdown-label">{r.label}</span>
                      {r.sub && <span className="breakdown-sub zakat-ltr ui-num">{r.sub}</span>}
                    </span>
                    <span className="breakdown-val ui-num">{cur.symbol}{fmt(r.val)}</span>
                  </li>
                ))}
                {n(debt) > 0 && (
                  <li className="breakdown-row breakdown-debt">
                    <span className="breakdown-icon" aria-hidden="true"><Icon name="minus" size={16} /></span>
                    <span className="breakdown-label">{s('debtLabel',l)}</span>
                    <span className="breakdown-val ui-num">−{cur.symbol}{fmt(debtVal)}</span>
                  </li>
                )}
              </ul>
              <div className="breakdown-total">
                <span>{s('totalLabel',l)}</span>
                <Money value={total} symbol={cur.symbol} fmt={fmt} className="total-amount" />
              </div>
            </div>
          </div>

          {/* Fitrə kalkulyatoru */}
          <div className="ui-card fitr-card" {...reveal}>
            <div className="fitr-head">
              <span className="ui-icon-tile ui-icon-tile--accent"><Icon name="moonStar" /></span>
              <div>
                <h2 className="fitr-title">{s('fitrTitle',l)}</h2>
                <p className="fitr-desc">{s('fitrDesc',l)}</p>
              </div>
            </div>
            <div className="fitr-row">
              <label className="fitr-label" htmlFor="zakat-fitr-people">{s('fitrPeople',l)}</label>
              <input id="zakat-fitr-people" type="number" inputMode="numeric" className="ui-input fitr-input" min="1" value={fitrPeople}
                onChange={e => setFitrPeople(e.target.value)} />
            </div>
            <div className="fitr-row">
              <span className="fitr-label">{s('fitrAmount',l)}</span>
              <span className="fitr-val ui-num">{cur.symbol}{fmt(fitrPerPerson)}</span>
            </div>
            <div className="fitr-total-row">
              <span className="fitr-label">{s('fitrTotal',l)}</span>
              <Money value={fitrTotal} symbol={cur.symbol} fmt={fmt} className="fitr-total-val" />
            </div>
          </div>
        </div>

        {/* Ayə (Bəqərə 2:43) — alquran.cloud-dan; alınmasa kart göstərilmir */}
        {ayah && (
          <div className="ui-container">
            <figure className="zakat-info-box" data-reveal="scale">
              <div className="ui-pattern" aria-hidden="true" />
              <div className="ui-ornament" aria-hidden="true"><span className="ui-ornament__star" /></div>
              <p className="zakat-quran-ar ui-arabic" lang="ar" dir="rtl">{ayah.ar}</p>
              {ayah.text && <blockquote className="zakat-quran">«{ayah.text}»</blockquote>}
              <figcaption className="zakat-quran-ref">— {localizeSource('Bəqərə 2:43', lang)}</figcaption>
            </figure>
          </div>
        )}
      </section>
    </div>
  )
}
