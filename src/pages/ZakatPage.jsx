import { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import { localizeSource } from '../utils/sourceNames'
import '../styles/ZakatPage.css'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { navGroupLabel, navGroupOf } from '../data/navigation'

// ═══ ZƏKAT HESABI — Sələf alimlərinin fətvalarına uyğun ═══
// • Zəkat nisaba çatan və üzərindən bir hicri il (hövl) keçən mala düşür. Aylıq maaş
//   (və icarə gəliri) ×12 edilib zəkat malına qatılmır — maaşın özü zəkat malı deyil,
//   ondan yığılıb əldə bir il qalan hissə sayılır (Daimi Komitə, Fətvalar 9/280 —
//   https://islamqa.info/en/answers/26113). Əvvəlki "maaş × 12" və "icarə × 12" sahələri çıxarıldı.
// • Kağız pulun nisabı: 85 q qızıl VƏ YA 595 q gümüşün dəyəri; kasıblar üçün hansı daha
//   faydalıdırsa o götürülür (Daimi Komitə, Fətvalar 9/254, 9/257 —
//   https://islamqa.info/en/answers/2795). Bu gün gümüş nisabı aşağıdır — standart seçim gümüşdür,
//   istifadəçi qızılı seçə bilər.
// • Fitrə pulla deyil, ərzaqla verilir: hər nəfərə bir sa' (≈3 kq) əsas qida
//   (Buxari 1503, 1506 — https://islamqa.info/en/answers/1396; yerli əsas qida —
//   https://islamqa.info/en/answers/145564, İbn Useymin, Məcmu Fətava 18/282).
//
// Təxmini qiymətlər (USD / qram) — istifadəçi bugünkü bazar qiymətini özü yaza bilər.
const GOLD_USD_PER_G   = 75
const SILVER_USD_PER_G = 0.90
const NISAB_GOLD_G   = 85
const NISAB_SILVER_G = 595
// Bir sa' ≈ 3 kq (https://islamqa.info/en/answers/1396)
const SAA_KG = 3

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
  savingsLabel: { az:'Yığım / bank hesabı',   ru:'Сбережения / Банк',   ar:'المدخرات / البنك',   tr:'Birikim / Banka',      en:'Savings / Bank'      },
  otherLabel:   { az:'Digər pul varlıqları',  ru:'Прочие активы',       ar:'أصول أخرى',          tr:'Diğer Varlıklar',      en:'Other Assets'        },
  goldLabel:    { az:'Qızıl (qram)',          ru:'Золото (граммы)',      ar:'الذهب (غرام)',       tr:'Altın (gram)',          en:'Gold (grams)'        },
  silverLabel:  { az:'Gümüş (qram)',          ru:'Серебро (граммы)',     ar:'الفضة (غرام)',       tr:'Gümüş (gram)',          en:'Silver (grams)'      },
  stocksLabel:  { az:'Ticarət malları / səhmlər', ru:'Товары для торговли / акции', ar:'عروض التجارة / الأسهم', tr:'Ticaret malları / hisseler', en:'Trade goods / shares' },
  stocksHint:   { az:'Satış üçün saxlanılan malın bugünkü bazar dəyəri', ru:'Текущая рыночная стоимость товара, хранимого для продажи', ar:'القيمة السوقية الحالية لما يُعدّ للبيع', tr:'Satış için tutulan malın bugünkü piyasa değeri', en:'Current market value of goods held for sale' },
  hawlTitle:    { az:'Zəkat hansı mala düşür?', ru:'С какого имущества выплачивается закят?', ar:'على أي مال تجب الزكاة؟', tr:'Zekât hangi mala düşer?', en:'What is zakat due on?' },
  hawlNote:     { az:'Zəkat nisaba çatan və üzərindən bir hicri il (hövl) keçən pul, qızıl, gümüş və ticarət malına düşür. Maaşın və icarə gəlirinin özü zəkat malı deyil: onlardan yığılıb əlinizdə bir il qalan hissəni "Yığım" sahəsinə yazın.', ru:'Закят выплачивается с денег, золота, серебра и товаров для торговли, достигших нисаба, если над ними прошёл один лунный год (хауль). Зарплата и арендный доход сами по себе не являются имуществом для закята: впишите в поле «Сбережения» ту их часть, которая накоплена и пролежала у вас год.', ar:'تجب الزكاة في النقود والذهب والفضة وعروض التجارة إذا بلغت النصاب وحال عليها الحول الهجري. والراتب ودخل الإيجار ليسا مالًا زكويًا بذاتهما: اكتب في خانة «المدخرات» ما ادّخرته منهما وبقي عندك حولًا.', tr:'Zekât, nisaba ulaşan ve üzerinden bir hicri yıl (havl) geçen para, altın, gümüş ve ticaret malına düşer. Maaş ve kira gelirinin kendisi zekât malı değildir: bunlardan biriktirip elinizde bir yıl kalan kısmı "Birikim" alanına yazın.', en:'Zakat is due on money, gold, silver and trade goods that reach the nisab and have been held for one lunar year (hawl). A salary or rental income is not itself zakatable: enter the part you have saved and held for a year under "Savings".' },
  hawlSrc:      { az:'Daimi Komitə fətvaları, 9/280', ru:'Фетвы Постоянного комитета, 9/280', ar:'فتاوى اللجنة الدائمة، ٩/٢٨٠', tr:'Daimi Komite fetvaları, 9/280', en:'Fatawa al-Lajnah al-Daimah, 9/280' },
  nisabBasis:   { az:'Nisab nəyə görə hesablansın?', ru:'По чему считать нисаб?', ar:'على أي أساس يُحسب النصاب؟', tr:'Nisap neye göre hesaplansın?', en:'Calculate the nisab by' },
  basisSilver:  { az:'Gümüş — 595 q', ru:'Серебро — 595 г', ar:'الفضة — ٥٩٥ غ', tr:'Gümüş — 595 g', en:'Silver — 595 g' },
  basisGold:    { az:'Qızıl — 85 q', ru:'Золото — 85 г', ar:'الذهب — ٨٥ غ', tr:'Altın — 85 g', en:'Gold — 85 g' },
  nisabExplain: { az:'Kağız pulun nisabı 85 q qızılın və ya 595 q gümüşün dəyəridir. Daimi Komitə hansı kasıblar üçün daha faydalıdırsa onu əsas götürməyi bildirib; bu gün bu, adətən gümüşdür.', ru:'Нисаб бумажных денег — стоимость 85 г золота или 595 г серебра. Постоянный комитет указал брать то, что полезнее для бедных; сегодня это обычно серебро.', ar:'نصاب الأوراق النقدية قيمة ٨٥ غرامًا من الذهب أو ٥٩٥ غرامًا من الفضة، وقد أفتت اللجنة الدائمة بالأخذ بالأنفع للفقراء، وهو اليوم غالبًا الفضة.', tr:'Kâğıt paranın nisabı 85 g altının veya 595 g gümüşün değeridir. Daimi Komite fakirler için hangisi daha faydalıysa onun esas alınmasını bildirmiştir; bugün bu genellikle gümüştür.', en:'The nisab for paper money is the value of 85 g of gold or 595 g of silver. The Permanent Committee advised using whichever is more beneficial to the poor; today that is usually silver.' },
  nisabSrc:     { az:'Daimi Komitə fətvaları, 9/254, 9/257', ru:'Фетвы Постоянного комитета, 9/254, 9/257', ar:'فتاوى اللجنة الدائمة، ٩/٢٥٤، ٩/٢٥٧', tr:'Daimi Komite fetvaları, 9/254, 9/257', en:'Fatawa al-Lajnah al-Daimah, 9/254, 9/257' },
  priceHint:    { az:'Bugünkü bazar qiymətini yaza bilərsiniz', ru:'Можно указать сегодняшнюю рыночную цену', ar:'يمكنك إدخال سعر السوق اليوم', tr:'Bugünkü piyasa fiyatını yazabilirsiniz', en:'You can enter today’s market price' },
  debtLabel:    { az:'Borclar (çıxılacaq)',   ru:'Долги (вычитаются)',  ar:'الديون (تخصم)',      tr:'Borçlar (düşülecek)',    en:'Debts (deducted)'    },
  fitrTitle:    { az:'Fitrə zəkatı',          ru:'Закят аль-Фитр',      ar:'زكاة الفطر',         tr:'Fıtır Sadakası',        en:'Zakat al-Fitr'       },
  fitrDesc:     { az:"Bayram namazından əvvəl hər ailə üzvü üçün bir sa' (≈3 kq) əsas qida verilir", ru:"До праздничной молитвы за каждого члена семьи выдаётся один са' (≈3 кг) основной еды", ar:'تُخرج قبل صلاة العيد صاعًا (≈٣ كغ) من قوت البلد عن كل فرد', tr:"Bayram namazından önce her aile üyesi için bir sâ' (≈3 kg) temel gıda verilir", en:"One saa' (≈3 kg) of staple food per family member, given before the Eid prayer" },
  fitrPeople:   { az:'Ailə üzvləri sayı',     ru:'Кол-во членов семьи', ar:'عدد أفراد الأسرة',   tr:'Aile üyesi sayısı',     en:'Number of family members' },
  fitrAmount:   { az:'Hər nəfərə', ru:'На одного человека', ar:'عن كل فرد', tr:'Kişi başına', en:'Per person' },
  fitrTotal:    { az:'Cəmi əsas qida', ru:'Всего основной еды', ar:'إجمالي القوت', tr:'Toplam temel gıda', en:'Total staple food' },
  kg:           { az:'kq', ru:'кг', ar:'كغ', tr:'kg', en:'kg' },
  fitrNote:     { az:'Sünnəyə görə fitrə pulla deyil, ərzaqla (düyü, un, xurma, buğda və s. — yerli əsas qida) verilir.', ru:'По Сунне закят аль-фитр выдаётся не деньгами, а едой (рис, мука, финики, пшеница и т. п. — местная основная пища).', ar:'السنة إخراج زكاة الفطر طعامًا لا نقودًا: من قوت البلد كالأرز والدقيق والتمر والقمح.', tr:'Sünnete göre fıtır sadakası parayla değil, gıdayla (pirinç, un, hurma, buğday vb. — yerel temel gıda) verilir.', en:'According to the Sunnah, zakat al-fitr is given as food, not money (rice, flour, dates, wheat etc. — the local staple).' },
  sourceLabel:  { az:'Mənbə', ru:'Источник', ar:'المصدر', tr:'Kaynak', en:'Source' },
  goldPrice:    { az:'Qızıl qiyməti / qram',   ru:'Цена золота / грамм', ar:'سعر الذهب / غرام',  tr:'Altın fiyatı / gram',    en:'Gold price / gram'   },
  silverPrice:  { az:'Gümüş qiyməti / qram',   ru:'Цена серебра / грамм', ar:'سعر الفضة / غرام', tr:'Gümüş fiyatı / gram',   en:'Silver price / gram'  },
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
  resultTitle:  { az:'Zəkat nəticəsi',        ru:'Расчёт закята',         ar:'نتيجة الزكاة',       tr:'Zekât Sonucu',          en:'Zakat Result'        },
  perYear:      { az:'/ hicri il',            ru:'/ лунный год',           ar:'/ حول',              tr:'/ hicri yıl',           en:'/ lunar year'        },
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
function ZakatField({ icon, tone = '', label, prefix, value, onChange, placeholder = '0', hint = null, className = '' }) {
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
  const [savings,     setSavings]     = useState('')
  const [other,       setOther]       = useState('')
  const [gold,        setGold]        = useState('')
  const [silver,      setSilver]      = useState('')
  const [stocks,      setStocks]      = useState('')
  const [debt,        setDebt]        = useState('')
  const [fitrPeople,  setFitrPeople]  = useState('1')
  // Nisab əsası: 'silver' (kasıblar üçün daha faydalı — standart) və ya 'gold'
  const [nisabBasis,  setNisabBasis]  = useState('silver')
  // İstifadəçinin yazdığı qiymət (seçilmiş valyutada, 1 qram); boşdursa təxmini qiymət
  const [goldPriceIn,   setGoldPriceIn]   = useState('')
  const [silverPriceIn, setSilverPriceIn] = useState('')
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

  // Mənfi, sonsuz (1e999) və ya boş dəyər hesabı pozmasın: yalnız sonlu, ≥ 0 ədəd.
  // Əvvəl "-5000" yığımı cəmdən çıxırdı, mənfi borc isə cəmə əlavə olunurdu.
  const n = v => { const x = parseFloat(v); return Number.isFinite(x) && x > 0 ? x : 0 }

  // 1 qramın qiyməti seçilmiş valyutada (istifadəçi yazıbsa — onun dəyəri)
  const goldPrice   = n(goldPriceIn)   || GOLD_USD_PER_G * rate
  const silverPrice = n(silverPriceIn) || SILVER_USD_PER_G * rate
  const nisabLoc = nisabBasis === 'gold' ? NISAB_GOLD_G * goldPrice : NISAB_SILVER_G * silverPrice

  // Yalnız bir il saxlanılan varlıqlar (maaş/icarə ×12 YOXDUR — bax faylın başı)
  const savingsVal   = n(savings)
  const otherVal     = n(other)
  const goldVal      = n(gold) * goldPrice
  const silverVal    = n(silver) * silverPrice
  const stocksVal    = n(stocks)
  const debtVal      = n(debt)

  const totalAssets = savingsVal + otherVal + goldVal + silverVal + stocksVal
  const total       = Math.max(totalAssets - debtVal, 0)
  const aboveNisab  = total >= nisabLoc
  const zakatYear   = aboveNisab ? total * 0.025 : 0

  // Fitrə — ərzaqla: hər nəfərə bir sa' (≈3 kq) əsas qida
  const fitrCount   = Math.floor(n(fitrPeople))   // 2.5 nəfər olmur
  const fitrTotalKg = SAA_KG * fitrCount
  const fmtKg = v => `${v.toLocaleString(NUM_LOCALES[lang] || 'en-US', { maximumFractionDigits: 1 })} ${s('kg', l)}`

  // Rəqəm formatı saytın dilinə görədir (əvvəl brauzerin dili idi: ru səhifədə "1,234.56",
  // sıfır isə həmişə "0.00" — eyni kartda iki fərqli format). Ərəbcədə latın rəqəmləri.
  const fmt = v => (Number.isFinite(v) ? v : 0).toLocaleString(NUM_LOCALES[lang] || 'en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
  const pct  = Math.min((total / nisabLoc) * 100, 100)
  // Pul sahələrinin yer tutucusu da saytın dilinə görə ("0,00" ru/az/tr-də;
  // əvvəl hər dildə "0.00" idi, nəticə kartlarında isə "0,00")
  const moneyPh = fmt(0)

  const reset = () => { setSavings(''); setOther(''); setGold(''); setSilver(''); setStocks(''); setDebt(''); setFitrPeople('1'); setGoldPriceIn(''); setSilverPriceIn('') }

  // Cəm cədvəlinin sətirləri (sıfır olan isteğe bağlı sətirlər gizlənir)
  const rows = [
    { k: 'savings', icon: 'shield',    label: s('savingsLabel',l), val: savingsVal, show: true },
    { k: 'other',   icon: 'list',      label: s('otherLabel',l),   val: otherVal, show: true },
    { k: 'gold',    icon: 'zakat',     label: s('goldLabel',l),    val: goldVal, show: n(gold) > 0 },
    { k: 'silver',  icon: 'zakat',     label: s('silverLabel',l),  val: silverVal, show: n(silver) > 0 },
    { k: 'stocks',  icon: 'analytics', label: s('stocksLabel',l),  val: stocksVal, show: n(stocks) > 0 },
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
            {/* Hövl qaydası: yalnız bir il saxlanılan mal (maaş/icarə ×12 deyil) */}
            <div className="zakat-hawl-note" role="note">
              <strong>{s('hawlTitle',l)}</strong>
              <p>{s('hawlNote',l)}</p>
              <p className="zakat-src">{s('sourceLabel',l)}: <a href="https://islamqa.info/en/answers/26113" target="_blank" rel="noopener noreferrer">{s('hawlSrc',l)}</a></p>
            </div>
            <div className="zakat-fields" data-reveal="stagger">

              {/* Yığım */}
              <ZakatField icon="shield" label={s('savingsLabel',l)} prefix={cur.symbol} placeholder={moneyPh}
                value={savings} onChange={setSavings} />

              {/* Digər */}
              <ZakatField icon="list" label={s('otherLabel',l)} prefix={cur.symbol} placeholder={moneyPh}
                value={other} onChange={setOther} />

              {/* Səhmlər */}
              <ZakatField icon="analytics" label={s('stocksLabel',l)} prefix={cur.symbol} placeholder={moneyPh}
                value={stocks} onChange={setStocks} hint={s('stocksHint',l)} />

              {/* Qızıl */}
              <ZakatField icon="zakat" tone="accent" label={s('goldLabel',l)} prefix="g" placeholder="0"
                value={gold} onChange={setGold}
                hint={n(gold) > 0 && <b className="zakat-ltr ui-num">≈ {cur.symbol}{fmt(goldVal)}</b>} />

              {/* Gümüş */}
              <ZakatField icon="zakat" tone="neutral" label={s('silverLabel',l)} prefix="g" placeholder="0"
                value={silver} onChange={setSilver}
                hint={n(silver) > 0 && <b className="zakat-ltr ui-num">≈ {cur.symbol}{fmt(silverVal)}</b>} />

              {/* Qızıl və gümüşün 1 qram qiyməti — istifadəçi bugünkü qiyməti yaza bilər */}
              <ZakatField icon="zakat" tone="accent" label={s('goldPrice',l)} prefix={cur.symbol} placeholder={fmt(GOLD_USD_PER_G * rate)}
                value={goldPriceIn} onChange={setGoldPriceIn} hint={s('priceHint',l)} />
              <ZakatField icon="zakat" tone="neutral" label={s('silverPrice',l)} prefix={cur.symbol} placeholder={fmt(SILVER_USD_PER_G * rate)}
                value={silverPriceIn} onChange={setSilverPriceIn} hint={s('priceHint',l)} />

              {/* Borclar */}
              <ZakatField icon="minus" tone="neutral" label={s('debtLabel',l)} prefix={`−${cur.symbol}`} placeholder={moneyPh}
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
              {/* Nisab əsası seçimi — gümüş (standart) və ya qızıl */}
              <div className="nisab-basis" role="group" aria-label={s('nisabBasis',l)}>
                <span className="nisab-basis-label">{s('nisabBasis',l)}</span>
                <div className="nisab-basis-opts">
                  {['silver', 'gold'].map(b => (
                    <button key={b} type="button" className="ui-chip nisab-basis-btn" aria-pressed={nisabBasis === b}
                      onClick={() => setNisabBasis(b)}>
                      {s(b === 'silver' ? 'basisSilver' : 'basisGold', l)}
                    </button>
                  ))}
                </div>
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
              <p className="nisab-note">{s('nisabExplain',l)}</p>
              <p className="nisab-note zakat-src">{s('sourceLabel',l)}: <a href="https://islamqa.info/en/answers/2795" target="_blank" rel="noopener noreferrer">{s('nisabSrc',l)}</a></p>
              <p className="nisab-note nisab-price-note">
                {s('priceNote',l)
                  .replace('{g}', `${cur.symbol}${fmt(goldPrice)}`)
                  .replace('{s}', `${cur.symbol}${fmt(silverPrice)}`)}
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
              <span className="fitr-val ui-num">≈ {fmtKg(SAA_KG)}</span>
            </div>
            <div className="fitr-total-row">
              <span className="fitr-label">{s('fitrTotal',l)}</span>
              <span className="fitr-total-val zakat-money ui-num">≈ {fmtKg(fitrTotalKg)}</span>
            </div>
            <p className="fitr-note">{s('fitrNote',l)}</p>
            <p className="fitr-note zakat-src">{s('sourceLabel',l)}: {localizeSource('Buxari 1503, 1506', lang)} · <a href="https://islamqa.info/en/answers/1396" target="_blank" rel="noopener noreferrer">islamqa.info 1396</a></p>
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
