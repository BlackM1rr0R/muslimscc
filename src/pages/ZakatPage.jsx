import { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { localizeSource } from '../utils/sourceNames'
import '../styles/ZakatPage.css'
import Breadcrumb from '../components/Breadcrumb'

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
const FALLBACK = { USD:1, AZN:1.70, EUR:0.92, RUB:91, TRY:32, SAR:3.75, GBP:0.79, AED:3.67 }

const L = {
  salaryLabel:  { az:'Aylıq Maaş',           ru:'Зарплата (в месяц)',   ar:'الراتب الشهري',      tr:'Aylık Maaş',          en:'Monthly Salary'      },
  savingsLabel: { az:'Yığım / Bank Hesabı',   ru:'Сбережения / Банк',   ar:'المدخرات / البنك',   tr:'Birikim / Banka',      en:'Savings / Bank'      },
  otherLabel:   { az:'Digər Pul Varlıqları',  ru:'Прочие активы',       ar:'أصول أخرى',          tr:'Diğer Varlıklar',      en:'Other Assets'        },
  goldLabel:    { az:'Qızıl (qram)',          ru:'Золото (граммы)',      ar:'الذهب (غرام)',       tr:'Altın (gram)',          en:'Gold (grams)'        },
  silverLabel:  { az:'Gümüş (qram)',          ru:'Серебро (граммы)',     ar:'الفضة (غرام)',       tr:'Gümüş (gram)',          en:'Silver (grams)'      },
  stocksLabel:  { az:'Səhmlər / İnvestisiya', ru:'Акции / Инвестиции',  ar:'أسهم / استثمارات',   tr:'Hisse / Yatırım',       en:'Stocks / Investments'},
  rentLabel:    { az:'İcarə Gəliri (aylıq)',  ru:'Доход от аренды (мес.)', ar:'دخل الإيجار (شهري)', tr:'Kira Geliri (aylık)', en:'Rental Income (monthly)' },
  debtLabel:    { az:'Borclar (çıxılacaq)',   ru:'Долги (вычитаются)',  ar:'الديون (تخصم)',      tr:'Borçlar (düşülecek)',    en:'Debts (deducted)'    },
  fitrTitle:    { az:'Fitrə Zəkatı',          ru:'Закят аль-Фитр',      ar:'زكاة الفطر',         tr:'Fıtır Sadakası',        en:'Zakat al-Fitr'       },
  fitrDesc:     { az:'Ramazan sonunda hər şəxs üçün ödənir', ru:'Выплачивается в конце Рамадана за каждого', ar:'تُدفع في نهاية رمضان عن كل فرد', tr:'Ramazan sonunda her birey için ödenir', en:'Paid at the end of Ramadan per person' },
  fitrPeople:   { az:'Ailə üzvləri sayı',     ru:'Кол-во членов семьи', ar:'عدد أفراد الأسرة',   tr:'Aile üyesi sayısı',     en:'Number of family members' },
  fitrAmount:   { az:'Fitrə məbləği (1 nəfər)', ru:'Сумма фитра (1 чел.)', ar:'مبلغ الفطرة (شخص)', tr:'Fıtır miktarı (1 kişi)', en:'Fitr amount (per person)' },
  fitrTotal:    { az:'Ümumi fitrə',            ru:'Общий фитр',           ar:'إجمالي الفطرة',      tr:'Toplam fıtır',           en:'Total fitr'          },
  goldPrice:    { az:'Qızıl qiyməti / qram',   ru:'Цена золота / грамм', ar:'سعر الذهب / غرام',  tr:'Altın fiyatı / gram',    en:'Gold price / gram'   },
  silverPrice:  { az:'Gümüş qiyməti / qram',   ru:'Цена серебра / грамм', ar:'سعر الفضة / غرام', tr:'Gümüş fiyatı / gram',   en:'Silver price / gram'  },
  annualIncome: { az:'İllik Gəlir',           ru:'Годовой доход',        ar:'الدخل السنوي',       tr:'Yıllık Gelir',         en:'Annual Income'       },
  totalLabel:   { az:'Zəkat Hesabı Üçün Cəm', ru:'Итого для расчёта',  ar:'المجموع للحساب',     tr:'Hesap Toplamı',        en:'Total for Zakat'     },
  nisabLabel:   { az:'Nisab Hədd',            ru:'Порог Нисаба',         ar:'حد النصاب',          tr:'Nisap Sınırı',         en:'Nisab Threshold'     },
  aboveNisab:   { az:'Nisab üzərindədir',     ru:'Выше нисаба',          ar:'يبلغ النصاب',        tr:'Nisap üzerinde',       en:'Above Nisab'         },
  belowNisab:   { az:'Nisab altındadır',      ru:'Ниже нисаба',          ar:'دون النصاب',         tr:'Nisap altında',        en:'Below Nisab'         },
  zakatDue:     { az:'Ödənilməli Zəkat',      ru:'Закят к уплате',       ar:'الزكاة الواجبة',     tr:'Ödenecek Zekât',       en:'Zakat Due'           },
  nisabNote:    { az:'Nisabdan aşağı — zəkat vacib deyil', ru:'Ниже нисаба — закят не обязателен', ar:'أقل من النصاب — لا زكاة', tr:'Nisap altında — zekât gerekmez', en:'Below nisab — zakat not obligatory' },
  currency:     { az:'Valyuta',               ru:'Валюта',                ar:'العملة',             tr:'Para Birimi',           en:'Currency'            },
  rateLabel:    { az:'1 USD =',               ru:'1 USD =',               ar:'1 دولار =',            tr:'1 USD =',               en:'1 USD ='             },
  rateLoading:  { az:'Yüklənir...',           ru:'Загрузка...',           ar:'تحميل...',           tr:'Yükleniyor...',         en:'Loading...'          },
  assetsTitle:  { az:'Varlıqlarınız',         ru:'Ваши активы',           ar:'أصولك',              tr:'Varlıklarınız',         en:'Your Assets'         },
  monthlyX12:   { az:'× 12 ay',              ru:'× 12 мес.',             ar:'× ١٢ شهراً',         tr:'× 12 ay',              en:'× 12 months'         },
  resultTitle:  { az:'Zəkat Nəticəsi',        ru:'Расчёт закята',         ar:'نتيجة الزكاة',       tr:'Zekât Sonucu',          en:'Zakat Result'        },
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

// ── Varlıq sahəsi: bütün sətir <label>-dir, harasına toxunulsa sahə fokuslanır ──
// tone — telefonda ikon kafelinin rəngi (motion.css → .icon-tile--*); genişdə sadə emoji
function ZakatField({ icon, tone = '', label, prefix, value, onChange, placeholder = '0.00', side = null, className = '' }) {
  return (
    <label className={`zakat-field-row${className ? ' ' + className : ''}`}>
      <span className={`zakat-field-icon icon-tile icon-tile--sm${tone ? ` icon-tile--${tone}` : ''}`} aria-hidden="true">{icon}</span>
      <span className="zakat-field-body">
        <span className="zakat-field-label">{label}</span>
        <span className="zakat-input-wrap">
          <span className="zakat-cur-prefix">{prefix}</span>
          <input type="number" inputMode="decimal" className="input-base zakat-input"
            min="0" value={value} placeholder={placeholder}
            onChange={e => onChange(e.target.value)} />
        </span>
      </span>
      {side}
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

  // Tək sütunlu düzümdə (≤860px) nəticə kartları ilk ekranın altında qalır —
  // yalnız onda sürüşəndə görünmə (data-reveal) verilir. Genişdə kartlar
  // ilk ekrandadır və səhifə keçidi onsuz da animasiya edir.
  const [revealResults] = useState(() => {
    try { return window.matchMedia('(max-width: 860px)').matches } catch { return false }
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

  const n = v => parseFloat(v) || 0

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
  const fitrTotal   = fitrPerPerson * n(fitrPeople)

  const fmt = v => v === 0 ? '0.00' : v.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })
  const pct  = Math.min((total / nisabLoc) * 100, 100)

  const reset = () => { setSalary(''); setSavings(''); setOther(''); setGold(''); setSilver(''); setStocks(''); setRent(''); setDebt(''); setFitrPeople('1') }

  return (
    <>
      <div className="page-hero hero-compact theme-zakat">
        <Breadcrumb setPage={setPage} current={t.title} />
        <div className="page-hero-arabic">الزَّكَاةُ</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="section">
        <div className="section-inner zakat-layout">

          {/* ══ SOL: Daxiletmə ══ */}
          <div className="zakat-inputs">

            {/* Valyuta */}
            <div className="zakat-currency-block">
              <div className="zakat-currency-header">
                <span className="zakat-block-label">🌍 {s('currency',l)}</span>
                {rateLoading
                  ? <span className="zakat-rate-badge loading">{s('rateLoading',l)}</span>
                  : <span className="zakat-rate-badge">{s('rateLabel',l)} <strong>{fmt(rate)} {cur.symbol}</strong></span>
                }
              </div>
              <div className="zakat-currency-grid" role="group" aria-label={s('currency',l)}>
                {CURRENCIES.map(c => (
                  <button key={c.code}
                    className={`zakat-cur-btn press ${currency === c.code ? 'active' : ''}`}
                    aria-pressed={currency === c.code}
                    onClick={() => setCurrency(c.code)}
                  >
                    <span>{c.code}</span>
                    <small>{c.symbol}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Sahələr */}
            <div className="zakat-block-label">{s('assetsTitle',l)}</div>
            <div className="zakat-fields">

              {/* Maaş — aylıq */}
              <ZakatField icon="💼" tone="slate" label={s('salaryLabel',l)} prefix={cur.symbol}
                value={salary} onChange={setSalary}
                side={salaryMonth > 0 && (
                  <span className="zakat-field-side">
                    <span className="zakat-field-tag">{s('monthlyX12',l)}</span>
                    <span className="zakat-field-annual">{cur.symbol}{fmt(salaryAnnual)}</span>
                  </span>
                )} />

              {/* Yığım */}
              <ZakatField icon="🏦" tone="blue" label={s('savingsLabel',l)} prefix={cur.symbol}
                value={savings} onChange={setSavings} />

              {/* Digər */}
              <ZakatField icon="💳" tone="violet" label={s('otherLabel',l)} prefix={cur.symbol}
                value={other} onChange={setOther} />

              {/* Qızıl */}
              <ZakatField icon="🪙" tone="gold" label={s('goldLabel',l)} prefix="g" placeholder="0"
                value={gold} onChange={setGold}
                side={n(gold) > 0 && (
                  <span className="zakat-field-side">
                    <span className="zakat-field-tag">≈ {cur.symbol}{fmt(goldVal)}</span>
                  </span>
                )} />

              {/* Gümüş */}
              <ZakatField icon="⚪" tone="slate" label={s('silverLabel',l)} prefix="g" placeholder="0"
                value={silver} onChange={setSilver}
                side={n(silver) > 0 && (
                  <span className="zakat-field-side">
                    <span className="zakat-field-tag">≈ {cur.symbol}{fmt(silverVal)}</span>
                  </span>
                )} />

              {/* Səhmlər */}
              <ZakatField icon="📈" tone="teal" label={s('stocksLabel',l)} prefix={cur.symbol}
                value={stocks} onChange={setStocks} />

              {/* İcarə Gəliri */}
              <ZakatField icon="🏠" tone="orange" label={s('rentLabel',l)} prefix={cur.symbol}
                value={rent} onChange={setRent}
                side={n(rent) > 0 && (
                  <span className="zakat-field-side">
                    <span className="zakat-field-tag">{s('monthlyX12',l)}</span>
                    <span className="zakat-field-annual">{cur.symbol}{fmt(rentVal)}</span>
                  </span>
                )} />

              {/* Borclar */}
              <ZakatField icon="📉" tone="rose" label={s('debtLabel',l)} prefix={`−${cur.symbol}`}
                value={debt} onChange={setDebt} className="zakat-field-debt" />
            </div>

            <button className="btn-ghost zakat-reset-btn" onClick={reset}>↺ {s('reset',l)}</button>

            {/* Tək sütunlu düzümdə (≤860px): yazdıqca zəkat məbləği ekranın altında
                görünür (sahələr bitənə qədər yapışqan qalır); toxunanda nəticəyə keçir.
                Genişdə gizlidir — nəticə sütunu yanda görünür. */}
            {totalAssets > 0 && (
              <button type="button" className="zakat-sticky-sum press" onClick={scrollToDue}>
                <span className="zakat-sticky-text">
                  <span className="zakat-sticky-title">{s('zakatDue',l)}</span>
                  <span className={`zakat-sticky-sub ${aboveNisab ? 'yes' : 'no'}`}>
                    {aboveNisab ? s('aboveNisab',l) : s('belowNisab',l)}
                  </span>
                </span>
                <span className="zakat-sticky-amount-wrap">
                  <span key={`${currency}-${zakatYear.toFixed(2)}`} className="zakat-sticky-amount">{cur.symbol}{fmt(zakatYear)}</span>
                  <span className="zakat-sticky-period">{s('perYear',l)}</span>
                </span>
                <span className="zakat-sticky-chev" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* ══ SAĞ: Nəticə ══ */}
          <div className="zakat-result">

            {/* Cəm cədvəli */}
            <div className="zakat-breakdown" {...reveal}>
              <div className="zakat-block-label" style={{marginBottom:14}}>📊 {s('resultTitle',l)}</div>

              <div className="breakdown-row">
                <span className="breakdown-icon">💼</span>
                <div className="breakdown-label-wrap">
                  <span className="breakdown-label">{s('salaryLabel',l)}</span>
                  <span className="breakdown-sub">{cur.symbol}{fmt(salaryMonth)} × 12</span>
                </div>
                <span className="breakdown-val">{cur.symbol}{fmt(salaryAnnual)}</span>
              </div>

              <div className="breakdown-row">
                <span className="breakdown-icon">🏦</span>
                <span className="breakdown-label">{s('savingsLabel',l)}</span>
                <span className="breakdown-val">{cur.symbol}{fmt(savingsVal)}</span>
              </div>

              <div className="breakdown-row">
                <span className="breakdown-icon">💳</span>
                <span className="breakdown-label">{s('otherLabel',l)}</span>
                <span className="breakdown-val">{cur.symbol}{fmt(otherVal)}</span>
              </div>

              {n(gold) > 0 && <div className="breakdown-row">
                <span className="breakdown-icon">🪙</span>
                <span className="breakdown-label">{s('goldLabel',l)}</span>
                <span className="breakdown-val">{cur.symbol}{fmt(goldVal)}</span>
              </div>}

              {n(silver) > 0 && <div className="breakdown-row">
                <span className="breakdown-icon">⚪</span>
                <span className="breakdown-label">{s('silverLabel',l)}</span>
                <span className="breakdown-val">{cur.symbol}{fmt(silverVal)}</span>
              </div>}

              {n(stocks) > 0 && <div className="breakdown-row">
                <span className="breakdown-icon">📈</span>
                <span className="breakdown-label">{s('stocksLabel',l)}</span>
                <span className="breakdown-val">{cur.symbol}{fmt(stocksVal)}</span>
              </div>}

              {n(rent) > 0 && <div className="breakdown-row">
                <span className="breakdown-icon">🏠</span>
                <span className="breakdown-label">{s('rentLabel',l)}</span>
                <span className="breakdown-val">{cur.symbol}{fmt(rentVal)}</span>
              </div>}

              {n(debt) > 0 && <div className="breakdown-row breakdown-debt">
                <span className="breakdown-icon">📉</span>
                <span className="breakdown-label">{s('debtLabel',l)}</span>
                <span className="breakdown-val">−{cur.symbol}{fmt(debtVal)}</span>
              </div>}

              <div className="breakdown-total">
                <span>{s('totalLabel',l)}</span>
                <span className="total-amount">{cur.symbol}{fmt(total)}</span>
              </div>
            </div>

            {/* Nisab progress */}
            <div className={`nisab-card ${aboveNisab ? 'above' : ''}`} {...reveal}>
              <div className="nisab-header">
                <span className="nisab-label">{s('nisabLabel',l)}</span>
                <span className={`nisab-badge ${aboveNisab ? 'yes' : 'no'}`}>
                  {aboveNisab ? '✓ ' + s('aboveNisab',l) : '✗ ' + s('belowNisab',l)}
                </span>
              </div>
              <div className="nisab-value">{cur.symbol}{fmt(nisabLoc)}</div>
              <div className="nisab-note">{t.note}</div>
              <div className="nisab-note nisab-price-note">
                {s('priceNote',l)
                  .replace('{g}', `${cur.symbol}${fmt(goldPrice * rate)}`)
                  .replace('{s}', `${cur.symbol}${fmt(silverPrice * rate)}`)}
              </div>
              {/* Doluluq transform ilə (layout yox) — ZakatPage.css → .nisab-bar */}
              <div className="nisab-bar-wrap">
                <div className="nisab-bar" style={{transform:`scaleX(${pct / 100})`}} />
              </div>
              <div className="nisab-bar-labels">
                <span>{cur.symbol}0</span>
                <span>{cur.symbol}{fmt(nisabLoc)}</span>
              </div>
            </div>

            {/* Zəkat nəticəsi — həmişə görünür */}
            <div ref={dueRef} className={`zakat-due-card ${aboveNisab ? 'active' : 'inactive'}`} {...reveal}>
              <div className="zakat-due-label">{s('zakatDue',l)}</div>

              {aboveNisab ? (
                <>
                  <div className="zakat-due-row">
                    <div className="zakat-due-block">
                      <div className="zakat-due-amount">{cur.symbol}{fmt(zakatYear)}</div>
                      <div className="zakat-due-period">{s('perYear',l)}</div>
                    </div>
                    <div className="zakat-due-divider" />
                    <div className="zakat-due-block">
                      <div className="zakat-due-amount zakat-due-sm">{cur.symbol}{fmt(zakatMonth)}</div>
                      <div className="zakat-due-period">{s('perMonth',l)}</div>
                    </div>
                  </div>
                  <div className="zakat-due-pct">2.5%</div>
                </>
              ) : (
                <>
                  <div className="zakat-due-amount">{cur.symbol}0.00</div>
                  <p className="zakat-due-note">{s('nisabNote',l)}</p>
                </>
              )}
            </div>

            {/* Fitrə Kalkulyatoru */}
            <div className="fitr-card" {...reveal}>
              <div className="fitr-title">🌙 {s('fitrTitle',l)}</div>
              <p className="fitr-desc">{s('fitrDesc',l)}</p>
              <div className="fitr-row">
                <label className="fitr-label" htmlFor="zakat-fitr-people">{s('fitrPeople',l)}</label>
                <input id="zakat-fitr-people" type="number" inputMode="numeric" className="input-base fitr-input" min="1" value={fitrPeople}
                  onChange={e => setFitrPeople(e.target.value)} />
              </div>
              <div className="fitr-row">
                <span className="fitr-label">{s('fitrAmount',l)}</span>
                <span className="fitr-val">{cur.symbol}{fmt(fitrPerPerson)}</span>
              </div>
              <div className="fitr-total-row">
                <span className="fitr-label">{s('fitrTotal',l)}</span>
                <span className="fitr-total-val">{cur.symbol}{fmt(fitrTotal)}</span>
              </div>
            </div>

            {/* Ayə (Bəqərə 2:43) — alquran.cloud-dan; alınmasa kart göstərilmir */}
            {ayah && (
              <figure className="zakat-info-box" {...reveal}>
                <p className="zakat-quran-ar" lang="ar" dir="rtl">{ayah.ar}</p>
                {ayah.text && <p className="zakat-quran">{ayah.text}</p>}
                <figcaption className="zakat-quran-ref">— {localizeSource('Bəqərə 2:43', lang)}</figcaption>
              </figure>
            )}

          </div>
        </div>
      </div>
    </>
  )
}