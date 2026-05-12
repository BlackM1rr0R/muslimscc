import { useState, useEffect, useMemo } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import SEO, { getPageMeta } from '../components/SEO'
import '../styles/ZakatPage.css'

// Nisab ≈ 85q qızıl × $50/g ≈ $4,250
const NISAB_USD = 4250

const CURRENCIES = [
  { code:'AZN', symbol:'₼',   flag:'🇦🇿' },
  { code:'USD', symbol:'$',   flag:'🇺🇸' },
  { code:'EUR', symbol:'€',   flag:'🇪🇺' },
  { code:'RUB', symbol:'₽',   flag:'🇷🇺' },
  { code:'TRY', symbol:'₺',   flag:'🇹🇷' },
  { code:'SAR', symbol:'﷼',  flag:'🇸🇦' },
  { code:'GBP', symbol:'£',   flag:'🇬🇧' },
  { code:'AED', symbol:'د.إ', flag:'🇦🇪' },
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
  rateLabel:    { az:'1 USD =',               ru:'1 USD =',               ar:'1 USD =',            tr:'1 USD =',               en:'1 USD ='             },
  rateLoading:  { az:'Yüklənir...',           ru:'Загрузка...',           ar:'تحميل...',           tr:'Yükleniyor...',         en:'Loading...'          },
  assetsTitle:  { az:'Varlıqlarınız',         ru:'Ваши активы',           ar:'أصولك',              tr:'Varlıklarınız',         en:'Your Assets'         },
  monthlyX12:   { az:'× 12 ay',              ru:'× 12 мес.',             ar:'× ١٢ شهراً',         tr:'× 12 ay',              en:'× 12 months'         },
  resultTitle:  { az:'Zəkat Nəticəsi',        ru:'Расчёт закята',         ar:'نتيجة الزكاة',       tr:'Zekât Sonucu',          en:'Zakat Result'        },
  perYear:      { az:'/ il',                  ru:'/ год',                  ar:'/ سنة',              tr:'/ yıl',                 en:'/ year'              },
  perMonth:     { az:'/ ay',                  ru:'/ мес.',                 ar:'/ شهر',              tr:'/ ay',                  en:'/ month'             },
  reset:        { az:'Sıfırla',               ru:'Сброс',                  ar:'إعادة',              tr:'Sıfırla',               en:'Reset'               },
}
const s = (k, l) => L[k]?.[l] || L[k]?.en || ''

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
  const [goldPrice]   = useState(75)   // ~$75/gram orta
  const [silverPrice] = useState(0.90) // ~$0.90/gram orta

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
      <SEO title={getPageMeta('zakat', lang)?.title} description={getPageMeta('zakat', lang)?.description} page="/zakat" />
      <div className="page-hero theme-zakat">
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
              <div className="zakat-currency-grid">
                {CURRENCIES.map(c => (
                  <button key={c.code}
                    className={`zakat-cur-btn ${currency === c.code ? 'active' : ''}`}
                    onClick={() => setCurrency(c.code)}
                  >
                    <span>{c.flag}</span>
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
              <div className="zakat-field-row">
                <span className="zakat-field-icon">💼</span>
                <div className="zakat-field-body">
                  <label>{s('salaryLabel',l)}</label>
                  <div className="zakat-input-wrap">
                    <span className="zakat-cur-prefix">{cur.symbol}</span>
                    <input type="number" className="input-base zakat-input"
                      min="0" value={salary} placeholder="0.00"
                      onChange={e => setSalary(e.target.value)} />
                  </div>
                </div>
                {salaryMonth > 0 && (
                  <div className="zakat-field-side">
                    <div className="zakat-field-tag">{s('monthlyX12',l)}</div>
                    <div className="zakat-field-annual">{cur.symbol}{fmt(salaryAnnual)}</div>
                  </div>
                )}
              </div>

              {/* Yığım */}
              <div className="zakat-field-row">
                <span className="zakat-field-icon">🏦</span>
                <div className="zakat-field-body">
                  <label>{s('savingsLabel',l)}</label>
                  <div className="zakat-input-wrap">
                    <span className="zakat-cur-prefix">{cur.symbol}</span>
                    <input type="number" className="input-base zakat-input"
                      min="0" value={savings} placeholder="0.00"
                      onChange={e => setSavings(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Digər */}
              <div className="zakat-field-row">
                <span className="zakat-field-icon">💳</span>
                <div className="zakat-field-body">
                  <label>{s('otherLabel',l)}</label>
                  <div className="zakat-input-wrap">
                    <span className="zakat-cur-prefix">{cur.symbol}</span>
                    <input type="number" className="input-base zakat-input"
                      min="0" value={other} placeholder="0.00"
                      onChange={e => setOther(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Qızıl */}
              <div className="zakat-field-row">
                <span className="zakat-field-icon">🪙</span>
                <div className="zakat-field-body">
                  <label>{s('goldLabel',l)}</label>
                  <div className="zakat-input-wrap">
                    <span className="zakat-cur-prefix">g</span>
                    <input type="number" className="input-base zakat-input"
                      min="0" value={gold} placeholder="0"
                      onChange={e => setGold(e.target.value)} />
                  </div>
                </div>
                {n(gold) > 0 && (
                  <div className="zakat-field-side">
                    <div className="zakat-field-tag">≈ {cur.symbol}{fmt(goldVal)}</div>
                  </div>
                )}
              </div>

              {/* Gümüş */}
              <div className="zakat-field-row">
                <span className="zakat-field-icon">⚪</span>
                <div className="zakat-field-body">
                  <label>{s('silverLabel',l)}</label>
                  <div className="zakat-input-wrap">
                    <span className="zakat-cur-prefix">g</span>
                    <input type="number" className="input-base zakat-input"
                      min="0" value={silver} placeholder="0"
                      onChange={e => setSilver(e.target.value)} />
                  </div>
                </div>
                {n(silver) > 0 && (
                  <div className="zakat-field-side">
                    <div className="zakat-field-tag">≈ {cur.symbol}{fmt(silverVal)}</div>
                  </div>
                )}
              </div>

              {/* Səhmlər */}
              <div className="zakat-field-row">
                <span className="zakat-field-icon">📈</span>
                <div className="zakat-field-body">
                  <label>{s('stocksLabel',l)}</label>
                  <div className="zakat-input-wrap">
                    <span className="zakat-cur-prefix">{cur.symbol}</span>
                    <input type="number" className="input-base zakat-input"
                      min="0" value={stocks} placeholder="0.00"
                      onChange={e => setStocks(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* İcarə Gəliri */}
              <div className="zakat-field-row">
                <span className="zakat-field-icon">🏠</span>
                <div className="zakat-field-body">
                  <label>{s('rentLabel',l)}</label>
                  <div className="zakat-input-wrap">
                    <span className="zakat-cur-prefix">{cur.symbol}</span>
                    <input type="number" className="input-base zakat-input"
                      min="0" value={rent} placeholder="0.00"
                      onChange={e => setRent(e.target.value)} />
                  </div>
                </div>
                {n(rent) > 0 && (
                  <div className="zakat-field-side">
                    <div className="zakat-field-tag">{s('monthlyX12',l)}</div>
                    <div className="zakat-field-annual">{cur.symbol}{fmt(rentVal)}</div>
                  </div>
                )}
              </div>

              {/* Borclar */}
              <div className="zakat-field-row zakat-field-debt">
                <span className="zakat-field-icon">📉</span>
                <div className="zakat-field-body">
                  <label>{s('debtLabel',l)}</label>
                  <div className="zakat-input-wrap">
                    <span className="zakat-cur-prefix">−{cur.symbol}</span>
                    <input type="number" className="input-base zakat-input"
                      min="0" value={debt} placeholder="0.00"
                      onChange={e => setDebt(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <button className="btn-ghost zakat-reset-btn" onClick={reset}>↺ {s('reset',l)}</button>
          </div>

          {/* ══ SAĞ: Nəticə ══ */}
          <div className="zakat-result">

            {/* Cəm cədvəli */}
            <div className="zakat-breakdown">
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
            <div className={`nisab-card ${aboveNisab ? 'above' : ''}`}>
              <div className="nisab-header">
                <span className="nisab-label">{s('nisabLabel',l)}</span>
                <span className={`nisab-badge ${aboveNisab ? 'yes' : 'no'}`}>
                  {aboveNisab ? '✓ ' + s('aboveNisab',l) : '✗ ' + s('belowNisab',l)}
                </span>
              </div>
              <div className="nisab-value">{cur.symbol}{fmt(nisabLoc)}</div>
              <div className="nisab-note">{t.note}</div>
              <div className="nisab-bar-wrap">
                <div className="nisab-bar" style={{width:`${pct}%`}} />
              </div>
              <div className="nisab-bar-labels">
                <span>{cur.symbol}0</span>
                <span>{cur.symbol}{fmt(nisabLoc)}</span>
              </div>
            </div>

            {/* Zəkat nəticəsi — həmişə görünür */}
            <div className={`zakat-due-card ${aboveNisab ? 'active' : 'inactive'}`}>
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
            <div className="fitr-card">
              <div className="fitr-title">🌙 {s('fitrTitle',l)}</div>
              <p className="fitr-desc">{s('fitrDesc',l)}</p>
              <div className="fitr-row">
                <label className="fitr-label">{s('fitrPeople',l)}</label>
                <input type="number" className="input-base fitr-input" min="1" value={fitrPeople}
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

            {/* Ayə */}
            <div className="zakat-info-box">
              <span className="zakat-quran-ar">وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ</span>
              <p className="zakat-quran">
                {lang==='az'?'"Namazı qılın, zəkat verin." — Bəqərə 2:43':
                 lang==='ru'?'«Совершайте намаз и выплачивайте закят» — Аль-Бакара 2:43':
                 lang==='ar'?'"وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ" — البقرة ٢:٤٣':
                 lang==='tr'?'"Namazı kılın ve zekâtı verin." — Bakara 2:43':
                 '"Establish prayer and give zakat." — Al-Baqarah 2:43'}
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}