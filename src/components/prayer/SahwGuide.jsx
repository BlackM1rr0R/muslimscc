// ═══════════════════════════════════════════════════════
// SahwGuide (v6.2) — "Səhv səcdəsi bələdçisi" (/prayerguide)
//
//   <SahwGuide lang="az" />
//
// • Qərar ağacı: "Nə oldu?" → (şübhədə: "meyliniz var?") → nə etmək lazımdır, addım-addım.
//   Hər nəticənin altında Buxari/Müslim hədisi — saytın kitabxanasında açılır (data/sahwGuide.js).
// • Səcdənin salamdan əvvəl/sonra olması hədisdəki kimi göstərilir; məzhəblərin bu barədə
//   fərqli ictihadı və hər ikisinin etibarlı olduğu qeyd olunur (Nəvəvi, Şərh Müslim).
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { pathFor } from '../../seo/routes'
import { SAHW_TREE, SAHW_REFS, SAHW_HOW } from '../../data/sahwGuide'
import { BOOKS, BOOK_DATA } from '../../data/hadithLibrary'
import '../../styles/SahwGuide.css'

const T = {
  az: { ey: 'Səhv səcdəsi', title: 'Namazda səhv etdim — nə edim?', lead: 'Sualı cavablandırın — hədislərdə gələn qaydanı addım-addım göstərək. Hər addımın mənbəsi altında.', before: 'Səcdə salamdan ƏVVƏL', after: 'Səcdə salamdan SONRA', how: 'Səcdə necə edilir', src: 'Mənbə', back: 'Geri', reset: 'Yenidən başla',
    madhab: 'Səcdənin salamdan əvvəl ya sonra edilməsi barədə məzhəblərin fərqli ictihadı var. Qadi İyad və Nəvəvi qeyd edir ki, hər iki halda namaz etibarlıdır — fərq yalnız hansının daha fəzilətli olmasındadır (Nəvəvi, «Şərhu Səhih Müslim», səhv babı).',
    scope: 'Burada yalnız Buxari və Müslimin hədislərində açıq gələn hallar var. Başqa vəziyyət üçün etibar etdiyiniz alimdən soruşun.' },
  en: { ey: 'Prostration of forgetfulness', title: 'I made a mistake in the prayer — what do I do?', lead: 'Answer the question and we will show the rule found in the hadiths, step by step. The source of each step is below it.', before: 'Prostration BEFORE the salam', after: 'Prostration AFTER the salam', how: 'How the prostration is made', src: 'Source', back: 'Back', reset: 'Start again',
    madhab: 'The schools of law differ in their ijtihad on whether the prostration comes before or after the salam. Qadi ‘Iyad and an-Nawawi note that the prayer is valid either way — the difference is only over which is better (an-Nawawi, “Sharh Sahih Muslim”, chapter on forgetfulness).',
    scope: 'Only the cases stated plainly in the hadiths of al-Bukhari and Muslim are covered here. For any other situation, ask a scholar you trust.' },
  ru: { ey: 'Земной поклон забывчивости', title: 'Я ошибся в намазе — что делать?', lead: 'Ответьте на вопрос — и мы покажем правило из хадисов шаг за шагом. Источник каждого шага — под ним.', before: 'Поклон ДО саляма', after: 'Поклон ПОСЛЕ саляма', how: 'Как совершается поклон', src: 'Источник', back: 'Назад', reset: 'Начать заново',
    madhab: 'Мазхабы расходятся в иджтихаде о том, совершать ли поклон до или после саляма. Кади Ийад и ан-Навави отмечают, что намаз действителен в обоих случаях — разница лишь в том, что лучше (ан-Навави, «Шарх Сахих Муслим», глава о забывчивости).',
    scope: 'Здесь только случаи, прямо упомянутые в хадисах аль-Бухари и Муслима. В иной ситуации спросите учёного, которому доверяете.' },
  ar: { ey: 'سجود السهو', title: 'سهوت في الصلاة — ماذا أفعل؟', lead: 'أجب عن السؤال لنعرض لك الحكم الوارد في الأحاديث خطوة خطوة. مصدر كل خطوة تحتها.', before: 'السجود قبل السلام', after: 'السجود بعد السلام', how: 'صفة السجود', src: 'المصدر', back: 'رجوع', reset: 'ابدأ من جديد',
    madhab: 'للمذاهب اجتهاد مختلف في كون السجود قبل السلام أو بعده. وقد ذكر القاضي عياض والنووي أنه لو سجد قبل السلام أو بعده أجزأه ولا تفسد صلاته، وإنما الخلاف في الأفضل (النووي، شرح صحيح مسلم، باب السهو).',
    scope: 'هنا فقط الحالات الواردة صراحة في أحاديث البخاري ومسلم. ولغيرها فاسأل عالمًا تثق به.' },
  tr: { ey: 'Sehiv secdesi', title: 'Namazda yanıldım — ne yapayım?', lead: 'Soruyu cevaplayın — hadislerde geçen hükmü adım adım gösterelim. Her adımın kaynağı altında.', before: 'Secde selamdan ÖNCE', after: 'Secde selamdan SONRA', how: 'Secde nasıl yapılır', src: 'Kaynak', back: 'Geri', reset: 'Baştan başla',
    madhab: 'Secdenin selamdan önce mi sonra mı yapılacağı konusunda mezheplerin farklı içtihadı vardır. Kadı İyâz ve Nevevî, her iki durumda da namazın geçerli olduğunu, farkın yalnızca hangisinin daha faziletli olduğunda bulunduğunu belirtir (Nevevî, «Şerhu Sahîhi Müslim», sehiv bâbı).',
    scope: 'Burada yalnızca Buhârî ve Müslim hadislerinde açıkça geçen durumlar var. Başka bir durum için güvendiğiniz bir âlime danışın.' },
}

// Kitabxanada həmin hədisin ünvanı: #kitab/bölmə/nömrə
function refHref(r, lang) {
  const sec = (BOOK_DATA[r.book]?.sections || []).find(s => s[1] && r.lib >= s[2] && r.lib <= s[3])
  const base = pathFor('hadithbooks', lang)
  return sec ? `${base}#${r.book}/${sec[0]}/${r.lib}` : `${base}#${r.book}`
}

export default function SahwGuide({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const [path, setPath] = useState(['start'])     // keçilən düyünlər
  const [picked, setPicked] = useState([])         // seçilən cavablar (mətn)
  const cur = SAHW_TREE[path[path.length - 1]]
  const choose = (label, next) => { setPath(p => [...p, next]); setPicked(x => [...x, label]) }
  const back = () => { setPath(p => p.slice(0, -1)); setPicked(x => x.slice(0, -1)) }
  const reset = () => { setPath(['start']); setPicked([]) }

  const Refs = ({ ids }) => (
    <p className="shw__refs">
      <span>{t.src}:</span>
      {ids.map(id => {
        const r = SAHW_REFS[id], b = BOOKS.find(x => x.key === r.book)
        return <a key={id} className="shw__ref ui-num" href={refHref(r, lang)} data-testid="shw-ref">{pickUi(b?.name, lang)}, {r.n}</a>
      })}
    </p>
  )

  return (
    <section className="ui-container pg-container shw-wrap" aria-labelledby="shw-title">
      <div className="shw ui-card" data-testid="sahw-guide">
        <div className="shw__head">
          <span className="ui-eyebrow">{t.ey}</span>
          <h2 id="shw-title" className="ui-title ui-title--sm">{t.title}</h2>
          <p className="ui-lead">{t.lead}</p>
        </div>
        {picked.length > 0 && (
          <ol className="shw__trail">
            {picked.map((p, i) => <li key={i}><Icon name="check" size={14} /> {pickUi(p, lang)}</li>)}
          </ol>
        )}
        <div className="shw__stage" key={path.join('/')} aria-live="polite">
          {!cur.res ? (
            <>
              <p className="shw__q">{pickUi(cur.q, lang)}</p>
              <div className="shw__opts">
                {cur.opts.map(([label, next], i) => (
                  <button key={next} type="button" className="shw__opt" style={{ '--i': i }} onClick={() => choose(label, next)} data-testid={`shw-${next}`}>
                    <span>{pickUi(label, lang)}</span> <Icon name="chevron" size={16} className="ui-flip-rtl" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="shw__res" data-testid="shw-result">
              <span className={`shw__when is-${cur.when}`} data-testid="shw-when">{cur.when === 'before' ? t.before : t.after}</span>
              <ol className="shw__steps">
                {cur.steps.map((s, i) => <li key={i} style={{ '--i': i }}><span className="shw__n ui-num">{i + 1}</span> <span>{pickUi(s, lang)}</span></li>)}
              </ol>
              <Refs ids={cur.refs} />
              <details className="shw__how">
                <summary>{t.how}</summary>
                <p>{pickUi(SAHW_HOW.text, lang)}</p>
                <Refs ids={SAHW_HOW.refs} />
              </details>
            </div>
          )}
        </div>
        {path.length > 1 && (
          <div className="shw__nav">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={back}><Icon name="chevron" size={14} className="shw__flip" /> {t.back}</button>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={reset} data-testid="shw-reset"><Icon name="refresh" className="ui-btn__icon" /> {t.reset}</button>
          </div>
        )}
        <p className="shw__note"><Icon name="info" size={14} /> {t.madhab}</p>
        <p className="shw__note">{t.scope}</p>
      </div>
    </section>
  )
}
