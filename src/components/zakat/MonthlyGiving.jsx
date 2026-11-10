// ═══════════════════════════════════════════════════════
// MonthlyGiving (v5.9) — "Maaşdan aylıq vermək" (/zakat): işləyən adam üçün iki yol
//
//   <MonthlyGiving lang="az" zakatYear={…} aboveNisab={…} money={v => '₼…'} symbol="₼" />
//
// 1) Zəkatı aylıq ƏVVƏLCƏDƏN ödəmək — illik zəkat (yuxarıdakı hesabdan) ÷ 12.
//    Daimi Komitə: "Bir il tamam olmamışdan əvvəl zəkat vermənin eybi yoxdur … ehtiyaclı ailəyə
//    hər ay verilsə" (Fətvalar 9/422 — islamqa.info/en/answers/52852). Peyğəmbər ﷺ Abbasdan iki
//    illik zəkatı əvvəlcədən qəbul etdi (islamqa.info/en/answers/1966). Zəkatı vaxtından SONRA aylara
//    bölüb gecikdirmək olmaz (İbn Qudamə, əl-Muğni 2/290 — eyni cavabda). Zəkat günü yenidən
//    hesablanır: az ödənibsə — fərq verilir.
// 2) Maaşdan könüllü sədəqə — maaşın seçilmiş faizi. Bu zəkat DEYİL və onu əvəz etmir.
// Hesab yalnız bu cihazda (maaş localStorage 'zakat_salary'), heç yerə göndərilmir.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { parseAmount, cleanAmountInput } from '../../utils/parseAmount'
import { pathFor } from '../../seo/routes'
import '../../styles/MonthlyGiving.css'

const T = {
  az: { ey: 'Hər ay', title: 'Maaşdan aylıq vermək', lead: 'İşləyib aylıq maaş alırsınızsa, zəkatı və sədəqəni ilin sonuna saxlamadan hər ay verə bilərsiniz.', tabZ: 'Zəkatı aylıq ödə', tabS: 'Könüllü sədəqə',
    zText: 'İllik zəkatınızı 12 aya bölüb hər ay əvvəlcədən verin. Daimi Komitə bir il tamam olmamışdan əvvəl zəkat verməyi, o cümlədən ehtiyaclı ailəyə hər ay verməyi caiz bilib.', zMonthly: 'Ayda', zYear: 'İllik zəkat', zMonths: '12 ay', zNone: 'Yuxarıdakı hesaba görə hazırda varlığınız nisaba çatmır — zəkat düşmür. Aylıq sədəqə verə bilərsiniz.', zEmpty: 'Əvvəlcə yuxarıda yığımınızı yazın — aylıq hissə burada çıxacaq.',
    zRules: ['Əvvəlcədən vermək olar; vaxtı keçəndən sonra aylara bölüb gecikdirmək olmaz.', 'Zəkat günü varlığınızı yenidən hesablayın: az ödənibsə — fərqi verin.', 'Zəkat yalnız ona haqqı olanlara verilir (Tövbə 9:60).'],
    zSrc: 'Daimi Komitə fətvaları, 9/422', zSrc2: 'Abbasın zəkatı əvvəlcədən verməsi',
    sText: 'Maaşınızdan hər ay seçdiyiniz faiz qədər sədəqə ayırın. Bu, zəkat deyil və zəkatı əvəz etmir — zəkat düşürsə, ayrıca verilir.', salary: 'Aylıq maaşınız', pct: 'Faiz', sMonthly: 'Ayda sədəqə', sYear: 'İldə', track: 'Sədəqə izləyicisi', custom: 'Başqa', privacy: 'Yalnız bu cihazda saxlanır.' },
  en: { ey: 'Every month', title: 'Giving monthly from your salary', lead: 'If you work for a monthly salary, you can give zakat and charity every month instead of waiting for the end of the year.', tabZ: 'Pay zakat monthly', tabS: 'Voluntary charity',
    zText: 'Split your yearly zakat into 12 months and give it in advance each month. The Permanent Committee held it permissible to give zakat before a full year has passed, including giving it to a needy family every month.', zMonthly: 'Per month', zYear: 'Yearly zakat', zMonths: '12 months', zNone: 'According to the calculation above your wealth does not reach the nisab now — no zakat is due. You can give monthly charity.', zEmpty: 'First enter your savings above — the monthly share will appear here.',
    zRules: ['Paying in advance is allowed; splitting it into months after it is due (delaying it) is not.', 'On your zakat day, recalculate your wealth: if you paid less — give the difference.', 'Zakat goes only to those entitled to it (at-Tawbah 9:60).'],
    zSrc: 'Fatwas of the Permanent Committee, 9/422', zSrc2: 'al-‘Abbas paying zakat in advance',
    sText: 'Set aside the percentage you choose from your salary every month as charity. This is not zakat and does not replace it — if zakat is due, it is given separately.', salary: 'Your monthly salary', pct: 'Percent', sMonthly: 'Charity per month', sYear: 'Per year', track: 'Charity tracker', custom: 'Other', privacy: 'Stored only on this device.' },
  ru: { ey: 'Каждый месяц', title: 'Ежемесячно из зарплаты', lead: 'Если вы работаете и получаете зарплату, закят и садаку можно давать каждый месяц, не откладывая до конца года.', tabZ: 'Закят помесячно', tabS: 'Добровольная садака',
    zText: 'Разделите годовой закят на 12 месяцев и выплачивайте его заранее каждый месяц. Постоянный комитет счёл допустимым выплату закята до истечения года, в том числе ежемесячно нуждающейся семье.', zMonthly: 'В месяц', zYear: 'Закят за год', zMonths: '12 месяцев', zNone: 'По расчёту выше ваше имущество сейчас не достигает нисаба — закят не обязателен. Можно давать ежемесячную садаку.', zEmpty: 'Сначала укажите сбережения выше — здесь появится ежемесячная часть.',
    zRules: ['Выплачивать заранее можно; дробить по месяцам после наступления срока (откладывать) нельзя.', 'В день закята пересчитайте имущество: если выплачено меньше — доплатите разницу.', 'Закят дают только тем, кто имеет на него право (ат-Тауба 9:60).'],
    zSrc: 'Фетвы Постоянного комитета, 9/422', zSrc2: 'аль-Аббас выплатил закят заранее',
    sText: 'Откладывайте каждый месяц выбранный процент зарплаты на садаку. Это не закят и не заменяет его — если закят обязателен, он выплачивается отдельно.', salary: 'Ваша месячная зарплата', pct: 'Процент', sMonthly: 'Садака в месяц', sYear: 'В год', track: 'Учёт садаки', custom: 'Другое', privacy: 'Хранится только на этом устройстве.' },
  ar: { ey: 'كل شهر', title: 'العطاء الشهري من الراتب', lead: 'إن كنت تعمل براتب شهري فيمكنك إخراج الزكاة والصدقة كل شهر بدل انتظار آخر السنة.', tabZ: 'الزكاة شهريًا', tabS: 'صدقة تطوع',
    zText: 'قسّم زكاتك السنوية على 12 شهرًا وأخرجها مقدَّمًا كل شهر. وقد أجازت اللجنة الدائمة إخراج الزكاة قبل تمام الحول، ومن ذلك إعطاؤها لأسرة محتاجة كل شهر.', zMonthly: 'شهريًا', zYear: 'زكاة السنة', zMonths: '12 شهرًا', zNone: 'بحسب الحساب أعلاه لا يبلغ مالك النصاب الآن — فلا زكاة عليك. ويمكنك التصدق شهريًا.', zEmpty: 'أدخل مدخراتك أعلاه أولًا — ستظهر الحصة الشهرية هنا.',
    zRules: ['يجوز التعجيل؛ ولا يجوز تقسيطها على الأشهر بعد وجوبها (تأخيرها).', 'يوم الزكاة أعد حساب مالك: إن نقص ما دفعته — فأخرج الفرق.', 'لا تُعطى الزكاة إلا لمستحقيها (التوبة 60).'],
    zSrc: 'فتاوى اللجنة الدائمة، ٩/٤٢٢', zSrc2: 'تعجيل العباس زكاته',
    sText: 'اقتطع من راتبك كل شهر النسبة التي تختارها صدقةً. وهذه ليست زكاة ولا تقوم مقامها — فإن وجبت الزكاة أُخرجت مستقلة.', salary: 'راتبك الشهري', pct: 'النسبة', sMonthly: 'الصدقة شهريًا', sYear: 'سنويًا', track: 'متابعة الصدقات', custom: 'أخرى', privacy: 'يُحفظ على هذا الجهاز فقط.' },
  tr: { ey: 'Her ay', title: 'Maaştan aylık vermek', lead: 'Çalışıp aylık maaş alıyorsanız zekâtı ve sadakayı yıl sonunu beklemeden her ay verebilirsiniz.', tabZ: 'Zekâtı aylık öde', tabS: 'Gönüllü sadaka',
    zText: 'Yıllık zekâtınızı 12 aya bölüp her ay peşin verin. Daimi Komite, yıl dolmadan zekât vermeyi, muhtaç bir aileye her ay vermek dahil, caiz görmüştür.', zMonthly: 'Aylık', zYear: 'Yıllık zekât', zMonths: '12 ay', zNone: 'Yukarıdaki hesaba göre şu an malınız nisaba ulaşmıyor — zekât düşmez. Aylık sadaka verebilirsiniz.', zEmpty: 'Önce yukarıya birikiminizi yazın — aylık pay burada çıkacak.',
    zRules: ['Peşin vermek caizdir; vakti geldikten sonra aylara bölüp geciktirmek caiz değildir.', 'Zekât günü malınızı yeniden hesaplayın: eksik ödendiyse farkı verin.', 'Zekât yalnızca hak sahiplerine verilir (Tevbe 9:60).'],
    zSrc: 'Daimi Komite fetvaları, 9/422', zSrc2: 'Abbas’ın zekâtı peşin vermesi',
    sText: 'Maaşınızdan her ay seçtiğiniz yüzde kadar sadaka ayırın. Bu zekât değildir ve zekâtın yerini tutmaz — zekât düşüyorsa ayrıca verilir.', salary: 'Aylık maaşınız', pct: 'Yüzde', sMonthly: 'Aylık sadaka', sYear: 'Yılda', track: 'Sadaka takibi', custom: 'Diğer', privacy: 'Yalnızca bu cihazda saklanır.' },
}
const PCTS = [1, 2.5, 5, 10]
const KEY = 'zakat_salary'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null } }

export default function MonthlyGiving({ lang = 'az', zakatYear = 0, aboveNisab = false, hasInput = false, money, symbol = '' }) {
  const t = pickUi(T, lang)
  const [tab, setTab] = useState('z')
  const [salary, setSalary] = useState('')
  const [pct, setPct] = useState(2.5)
  const [customPct, setCustomPct] = useState('')
  useEffect(() => { const d = read(); if (d) { setSalary(d.salary || ''); if (d.pct) setPct(d.pct) } }, [])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ salary, pct })) } catch { /* */ } }, [salary, pct])
  const sal = Math.max(0, parseAmount(salary) || 0)
  const p = pct === 'custom' ? Math.max(0, Math.min(100, parseAmount(customPct) || 0)) : pct
  const monthlyS = sal * p / 100
  const monthlyZ = aboveNisab ? zakatYear / 12 : 0

  return (
    <section className="ui-section ui-section--tight mg" aria-labelledby="mg-title" data-testid="monthly-giving">
      <div className="ui-container">
        <div className="ui-card mg__card">
          <div className="mg__head">
            <span className="ui-eyebrow">{t.ey}</span>
            <h2 id="mg-title" className="ui-title">{t.title}</h2>
            <p className="ui-lead">{t.lead}</p>
          </div>
          <div className="ui-segmented mg__tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'z'} onClick={() => setTab('z')} data-testid="mg-tab-z">{t.tabZ}</button>
            <button type="button" role="tab" aria-selected={tab === 's'} onClick={() => setTab('s')} data-testid="mg-tab-s">{t.tabS}</button>
          </div>

          {tab === 'z' ? (
            <div className="mg__pane" role="tabpanel">
              <p className="mg__text">{t.zText}</p>
              {!hasInput ? <p className="mg__note">{t.zEmpty}</p> : !aboveNisab ? <p className="mg__note">{t.zNone}</p> : (
                <div className="mg__result" data-testid="mg-zakat">
                  <div className="mg__big"><span>{t.zMonthly}</span><b className="ui-num">{money(monthlyZ)}</b></div>
                  <div className="mg__eq ui-num">{money(monthlyZ)} × {t.zMonths} = {money(zakatYear)} <small>({t.zYear})</small></div>
                  <ol className="mg__months" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <li key={i} style={{ '--i': i }} />)}</ol>
                </div>
              )}
              <ul className="mg__rules">{t.zRules.map((r, i) => <li key={i}><Icon name="check" size={14} /> {r}</li>)}</ul>
              <p className="mg__src">
                <a href="https://islamqa.info/en/answers/52852" target="_blank" rel="noopener noreferrer">{t.zSrc}</a>
                {' · '}
                <a href="https://islamqa.info/en/answers/1966" target="_blank" rel="noopener noreferrer">{t.zSrc2}</a>
              </p>
            </div>
          ) : (
            <div className="mg__pane" role="tabpanel">
              <p className="mg__text">{t.sText}</p>
              <div className="mg__inputs">
                <label className="ui-field mg__field">
                  <span className="ui-field__label">{t.salary}</span>
                  <span className="mg__inwrap"><span aria-hidden="true">{symbol}</span>
                    <input type="text" inputMode="decimal" autoComplete="off" className="ui-input" value={salary} placeholder="0" onChange={e => setSalary(cleanAmountInput(e.target.value))} data-testid="mg-salary" />
                  </span>
                </label>
                <div className="mg__field">
                  <span className="ui-field__label">{t.pct}</span>
                  <div className="mg__pcts" role="radiogroup" aria-label={t.pct}>
                    {PCTS.map(x => <button key={x} type="button" role="radio" aria-checked={pct === x} className={`ui-chip${pct === x ? ' is-on' : ''}`} onClick={() => setPct(x)}>{String(x).replace('.', lang === 'en' ? '.' : ',')}%</button>)}
                    <button type="button" role="radio" aria-checked={pct === 'custom'} className={`ui-chip${pct === 'custom' ? ' is-on' : ''}`} onClick={() => setPct('custom')}>{t.custom}</button>
                    {pct === 'custom' && <input type="text" inputMode="decimal" className="ui-input mg__custom" value={customPct} placeholder="%" aria-label={t.pct} onChange={e => setCustomPct(cleanAmountInput(e.target.value))} />}
                  </div>
                </div>
              </div>
              {sal > 0 && (
                <div className="mg__result" data-testid="mg-sadaqa">
                  <div className="mg__big"><span>{t.sMonthly}</span><b className="ui-num">{money(monthlyS)}</b></div>
                  <div className="mg__eq ui-num">{t.sYear}: {money(monthlyS * 12)}</div>
                </div>
              )}
              <p className="mg__src"><Icon name="shield" size={14} /> {t.privacy} · <a href={pathFor('charity', lang)}>{t.track} →</a></p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
