// ═══════════════════════════════════════════════════════
// KaffarahCalc (v6.8) — "Fidyə və kəffarə hesablayıcısı" (/qada)
//
//   <KaffarahCalc lang="az" lessonHref="/learn/kaffarah-fidyah" />
//
// HÖKMLƏR YENİ YAZILMIR — saytın "Kəffarə və fidyə" dərsindən (data/lessons/kaffarah-fidyah.js):
//   • fidyə (oruca gücü çatmayan qoca / sağalmaz xəstə): hər gün üçün bir kasıbı yedirmək, qəza yoxdur
//     (Bəqərə 184; Buxari 4505);
//   • and kəffarəsi: 10 kasıbı yedirmək və ya geyindirmək; bacarmasa — 3 gün oruc (Maidə 89);
//   • Ramazan gündüzü cima / zihar: 2 ay ardıcıl oruc; bacarmasa — 60 kasıbı yedirmək (Müslim 1111;
//     Mücadilə 3–4); cimada + günün qəzası;
//   • xəta ilə öldürmə: 2 ay ardıcıl oruc, yedirmə yoxdur (Nisa 92).
//   Miqdar: hər kasıba yarım sa (≈1,5 kq) əsas qida və ya bir doyurucu yemək. Əksəriyyətə görə pul
//   yedirmənin yerinə keçmir — qiymət yalnız qida almaq üçün təxmindir.
// Stillər: src/styles/KaffarahCalc.css
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from './Icon'
import { pickUi } from '../utils/uiText'
import '../styles/KaffarahCalc.css'

const KG_PER_POOR = 1.5

const T = {
  az: { kg: 'kq', ey: 'Hesablayıcı', title: 'Fidyə və kəffarə', lead: 'Növü seçin — nə vacib olduğunu, neçə kasıbın yedirilməli olduğunu və təxmini qida miqdarını görün. Hökmlər saytın "Kəffarə və fidyə" dərsindəndir.',
    kinds: { fidya: 'Fidyə (qoca / sağalmaz xəstə)', oath: 'And kəffarəsi', jima: 'Ramazan gündüzü cima', zihar: 'Zihar', killing: 'Xəta ilə öldürmə' },
    days: 'Oruc tutulmayan günlər', oaths: 'Pozulmuş andların sayı', price: '1 kq əsas qidanın qiyməti (istəyə bağlı)', poor: 'kasıb yedirilir', food: 'əsas qida', cost: 'qida üçün təxmini xərc',
    order: 'Ardıcıllıq', fast2: '2 ay ardıcıl oruc', fast3: '3 gün oruc', feed: (n) => `${n} kasıbı yedirmək`, clothe: '10 kasıbı geyindirmək (seçim)', or: 'bacarmasa', plus: '+ həmin günün qəzası və tövbə', noFeed: 'Bu kəffarədə yedirmə yoxdur (Nisa 92)', noQada: 'qəza yoxdur',
    meal: 'və ya hər kasıba bir doyurucu yemək', money: 'Alimlərin əksəriyyətinə görə yedirmək əvəzinə pul vermək kəffarə kimi keçmir — qida alıb paylamaq və ya etibarlı xeyriyyəyə həvalə etmək olar.', lesson: 'Dərs: kəffarə və fidyə', src: 'Mənbə' },
  en: { kg: 'kg', ey: 'Calculator', title: 'Fidyah and kaffarah', lead: 'Choose the type to see what is required, how many poor people to feed and the approximate amount of food. The rulings come from the site’s lesson on kaffarah and fidyah.',
    kinds: { fidya: 'Fidyah (elderly / chronically ill)', oath: 'Oath expiation', jima: 'Intercourse during a Ramadan day', zihar: 'Zihar', killing: 'Accidental killing' },
    days: 'Days of fasting missed', oaths: 'Number of broken oaths', price: 'Price of 1 kg of staple food (optional)', poor: 'poor people fed', food: 'staple food', cost: 'approximate cost of food',
    order: 'Order', fast2: 'Fast 2 consecutive months', fast3: 'Fast 3 days', feed: (n) => `Feed ${n} poor people`, clothe: 'Clothe 10 poor people (option)', or: 'if unable', plus: '+ make up that day and repent', noFeed: 'This expiation has no feeding (an-Nisa 92)', noQada: 'no making up',
    meal: 'or one filling meal for each poor person', money: 'According to most scholars, giving money instead of food does not count as expiation — buy food and distribute it, or entrust a reliable charity to do so.', lesson: 'Lesson: kaffarah and fidyah', src: 'Source' },
  ru: { kg: 'кг', ey: 'Калькулятор', title: 'Фидья и каффара', lead: 'Выберите вид — увидите, что обязательно, сколько бедных нужно накормить и примерное количество еды. Положения взяты из урока сайта «Каффара и фидья».',
    kinds: { fidya: 'Фидья (пожилой / неизлечимо больной)', oath: 'Искупление клятвы', jima: 'Близость днём в Рамадан', zihar: 'Зихар', killing: 'Убийство по ошибке' },
    days: 'Пропущенные дни поста', oaths: 'Число нарушенных клятв', price: 'Цена 1 кг основной еды (необязательно)', poor: 'бедных накормить', food: 'основной еды', cost: 'примерная стоимость еды',
    order: 'Порядок', fast2: 'Пост 2 месяца подряд', fast3: 'Пост 3 дня', feed: (n) => `Накормить бедных: ${n}`, clothe: 'Одеть 10 бедных (на выбор)', or: 'если не в силах', plus: '+ возместить этот день и покаяться', noFeed: 'В этом искуплении кормления нет (ан-Ниса, 92)', noQada: 'возмещать не нужно',
    meal: 'или одна сытная трапеза каждому бедному', money: 'По мнению большинства учёных, деньги вместо еды не засчитываются как искупление — купите еду и раздайте или поручите надёжной благотворительной организации.', lesson: 'Урок: каффара и фидья', src: 'Источник' },
  ar: { kg: 'كغ', ey: 'حاسبة', title: 'الفدية والكفارة', lead: 'اختر النوع لترى ما يجب، وعدد المساكين الذين يُطعَمون، والمقدار التقريبي من الطعام. الأحكام من درس «الكفارة والفدية» في الموقع.',
    kinds: { fidya: 'الفدية (الشيخ الكبير / المريض الذي لا يُرجى برؤه)', oath: 'كفارة اليمين', jima: 'الجماع في نهار رمضان', zihar: 'الظهار', killing: 'القتل الخطأ' },
    days: 'أيام الصيام الفائتة', oaths: 'عدد الأيمان المحنوث فيها', price: 'سعر كيلوغرام من القوت (اختياري)', poor: 'مسكينًا يُطعَم', food: 'من قوت البلد', cost: 'تكلفة الطعام التقريبية',
    order: 'الترتيب', fast2: 'صيام شهرين متتابعين', fast3: 'صيام ثلاثة أيام', feed: (n) => `إطعام ${n} مسكينًا`, clothe: 'كسوة عشرة مساكين (على التخيير)', or: 'فإن لم يستطع', plus: '+ قضاء ذلك اليوم والتوبة', noFeed: 'لا إطعام في هذه الكفارة (النساء 92)', noQada: 'لا قضاء',
    meal: 'أو وجبة مشبعة لكل مسكين', money: 'عند أكثر العلماء لا تجزئ القيمة النقدية عن الإطعام — اشترِ الطعام ووزّعه أو وكّل جمعية خيرية موثوقة.', lesson: 'درس: الكفارة والفدية', src: 'المصدر' },
  tr: { kg: 'kg', ey: 'Hesaplayıcı', title: 'Fidye ve kefaret', lead: 'Türü seçin — neyin gerektiğini, kaç fakirin doyurulacağını ve yaklaşık yiyecek miktarını görün. Hükümler sitenin "Kefaret ve fidye" dersindendir.',
    kinds: { fidya: 'Fidye (yaşlı / iyileşmesi umulmayan hasta)', oath: 'Yemin kefareti', jima: 'Ramazan gündüzü cima', zihar: 'Zıhar', killing: 'Hata ile öldürme' },
    days: 'Tutulamayan oruç günleri', oaths: 'Bozulan yemin sayısı', price: '1 kg temel gıdanın fiyatı (isteğe bağlı)', poor: 'fakir doyurulur', food: 'temel gıda', cost: 'gıda için tahmini masraf',
    order: 'Sıra', fast2: '2 ay peş peşe oruç', fast3: '3 gün oruç', feed: (n) => `${n} fakiri doyurmak`, clothe: '10 fakiri giydirmek (seçenek)', or: 'gücü yetmezse', plus: '+ o günün kazası ve tövbe', noFeed: 'Bu kefarette doyurma yoktur (Nisâ 92)', noQada: 'kaza yok',
    meal: 'veya her fakire bir doyurucu yemek', money: 'Âlimlerin çoğuna göre yiyecek yerine para vermek kefaret yerine geçmez — yiyecek alıp dağıtın veya güvenilir bir hayır kurumuna vekâlet verin.', lesson: 'Ders: kefaret ve fidye', src: 'Kaynak' },
}
const SRC = { fidya: 'Bəqərə 184; Buxari 4505', oath: 'Maidə 89', jima: 'Müslim 1111; Buxari 1936', zihar: 'Mücadilə 3–4', killing: 'Nisa 92' }
const SRC_EN = { fidya: 'al-Baqarah 184; Bukhari 4505', oath: 'al-Ma’idah 89', jima: 'Muslim 1111; Bukhari 1936', zihar: 'al-Mujadilah 3–4', killing: 'an-Nisa 92' }

export default function KaffarahCalc({ lang = 'az', lessonHref }) {
  const t = pickUi(T, lang)
  const [kind, setKind] = useState('fidya')
  const [n, setN] = useState(30)
  const [price, setPrice] = useState('')
  const count = Math.max(1, Math.min(10000, Math.round(Number(n) || 1)))
  const poor = kind === 'fidya' ? count : kind === 'oath' ? 10 * count : (kind === 'jima' || kind === 'zihar') ? 60 : 0
  const kg = poor * KG_PER_POOR
  const p = Number(String(price).replace(',', '.'))
  const fmt = (x) => x.toLocaleString(lang === 'ar' ? 'ar' : lang, { maximumFractionDigits: 1 })

  const steps = {
    fidya: [t.feed(count) + ` — ${t.noQada}`],
    oath: [t.feed(10 * count), t.clothe, `${t.or} → ${t.fast3}${count > 1 ? ` × ${count}` : ''}`],
    jima: [t.fast2, `${t.or} → ${t.feed(60)}`, t.plus],
    zihar: [t.fast2, `${t.or} → ${t.feed(60)}`],
    killing: [t.fast2, t.noFeed],
  }[kind]

  return (
    <section className="ui-section ui-section--tight">
      <div className="ui-container">
        <div className="kfc ui-card" data-testid="kaffarah-calc">
          <div className="kfc__head">
            <span className="ui-eyebrow">{t.ey}</span>
            <h2 className="ui-title ui-title--sm">{t.title}</h2>
            <p className="ui-lead">{t.lead}</p>
          </div>
          <div className="kfc__kinds" role="radiogroup" aria-label={t.title}>
            {Object.keys(t.kinds).map(k => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} className={`kfc__kind${kind === k ? ' is-on' : ''}`} onClick={() => setKind(k)} data-testid={`kfc-${k}`}>{t.kinds[k]}</button>
            ))}
          </div>
          <div className="kfc__grid">
            <div className="kfc__inputs">
              {(kind === 'fidya' || kind === 'oath') && (
                <label className="kfc__field">
                  <span>{kind === 'fidya' ? t.days : t.oaths}</span>
                  <input type="number" min="1" max="10000" inputMode="numeric" value={n} onChange={e => setN(e.target.value)} className="ui-input" data-testid="kfc-n" />
                </label>
              )}
              {poor > 0 && (
                <label className="kfc__field">
                  <span>{t.price}</span>
                  <input type="text" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} className="ui-input" placeholder="—" data-testid="kfc-price" />
                </label>
              )}
              <div className="kfc__order">
                <span className="kfc__cap">{t.order}</span>
                <ol>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
              </div>
            </div>
            <dl className="kfc__out" aria-live="polite">
              {poor > 0 ? <>
                <div><dt className="ui-num" data-testid="kfc-poor">{fmt(poor)}</dt><dd>{t.poor}</dd></div>
                <div><dt className="ui-num" data-testid="kfc-kg">≈ {fmt(kg)} {t.kg}</dt><dd>{t.food} <small>({t.meal})</small></dd></div>
                {p > 0 && <div><dt className="ui-num" data-testid="kfc-cost">≈ {fmt(kg * p)}</dt><dd>{t.cost}</dd></div>}
              </> : <div><dt className="kfc__big">{t.fast2}</dt><dd>{t.noFeed}</dd></div>}
            </dl>
          </div>
          <p className="kfc__note"><Icon name="info" size={14} /> {t.money}</p>
          <p className="kfc__src">{t.src}: {(lang === 'az' ? SRC : SRC_EN)[kind]}{lessonHref && <> · <a className="ui-link" href={lessonHref}>{t.lesson}</a></>}</p>
        </div>
      </div>
    </section>
  )
}
