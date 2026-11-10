// ═══════════════════════════════════════════════════════
// TracePractice (v7) — "Barmaqla yaz" xəttatlıq məşqi
//
//   <TracePractice lang="az" />                 — /learn-arabic: 28 hərf + 5 qısa zikr
//   <TracePractice lang="az" kid storageKey="kids_trace_v1" />  — /kids: hərflər + Bismillah,
//                                                  qalın fırça, yumşaq hədd, sıra tələb olunmur
// • Hərflər — tək (isolated) forma, data/arabicCourse.js-dən (adları 5 dildə).
// • İrəliləyiş localStorage-da ({ id: ulduz | 'm' — yazmadan tamamlanıb }), try/catch.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import TraceCanvas from './TraceCanvas'
import { LETTERS } from '../../data/arabicCourse.js'
import { pickUi } from '../../utils/uiText'

const PHRASES = [
  { id: 'bismillah', ar: 'بسم الله', name: { az: 'Bismillah — Allahın adı ilə', en: 'Bismillah — in the name of Allah', ru: 'Бисмиллях — с именем Аллаха', ar: 'البسملة', tr: 'Bismillah — Allah’ın adıyla' } },
  { id: 'hamdulillah', ar: 'الحمد لله', name: { az: 'Əlhəmdulillah — həmd Allaha məxsusdur', en: 'Alhamdulillah — all praise is for Allah', ru: 'Альхамдулиллях — хвала Аллаху', ar: 'التحميد', tr: 'Elhamdülillah — hamd Allah’a mahsustur' } },
  { id: 'subhanallah', ar: 'سبحان الله', name: { az: 'Subhanallah — Allah hər nöqsandan pakdır', en: 'Subhanallah — glory be to Allah', ru: 'Субханаллах — пречист Аллах', ar: 'التسبيح', tr: 'Sübhanallah — Allah her eksiklikten münezzehtir' } },
  { id: 'allahuakbar', ar: 'الله أكبر', name: { az: 'Allahu əkbər — Allah ən böyükdür', en: 'Allahu akbar — Allah is the Greatest', ru: 'Аллаху акбар — Аллах велик', ar: 'التكبير', tr: 'Allahu ekber — Allah en büyüktür' } },
  { id: 'tahlil', ar: 'لا إله إلا الله', name: { az: 'La ilahə illallah — Allahdan başqa haqq məbud yoxdur', en: 'La ilaha illallah — none has the right to be worshipped but Allah', ru: 'Ля иляха илляЛлах — нет божества, достойного поклонения, кроме Аллаха', ar: 'التهليل', tr: 'Lâ ilâhe illallah — Allah’tan başka hak ilah yoktur' } },
]

const T = {
  az: { letters: 'Hərflər', phrases: 'Qısa zikrlər', progress: (a, b) => `${a} / ${b} tamamlanıb`, letter: 'Hərf', pick: 'Yazmaq üçün seçin', reset: 'İrəliləyişi sıfırla',
    note: 'Yazı nəsx xəttindədir (Amiri). İrəliləyiş yalnız bu cihazda saxlanılır.', kidNote: 'Hərfin üstündən barmağınla yaz — qızılı rəngə boyanacaq!' },
  en: { letters: 'Letters', phrases: 'Short dhikr', progress: (a, b) => `${a} / ${b} completed`, letter: 'Letter', pick: 'Choose what to write', reset: 'Reset progress',
    note: 'The writing is in Naskh script (Amiri). Progress is saved on this device only.', kidNote: 'Write over the letter with your finger — it turns gold!' },
  ru: { letters: 'Буквы', phrases: 'Короткие зикры', progress: (a, b) => `выполнено ${a} из ${b}`, letter: 'Буква', pick: 'Выберите, что написать', reset: 'Сбросить прогресс',
    // lang-ok[Amiri]: şrift adıdır
    note: 'Письмо — почерк насх (шрифт Amiri). Прогресс сохраняется только на этом устройстве.', kidNote: 'Обведи букву пальцем — она станет золотой!' },
  ar: { letters: 'الحروف', phrases: 'أذكار قصيرة', progress: (a, b) => `أُتمّ ${a} من ${b}`, letter: 'حرف', pick: 'اختر ما تكتبه', reset: 'إعادة التقدّم',
    // lang-ok[Amiri]: şrift adıdır
    note: 'الكتابة بخط النسخ (Amiri)، ويُحفظ التقدّم على هذا الجهاز فقط.', kidNote: 'اكتب فوق الحرف بإصبعك — سيصير ذهبيًّا!' },
  tr: { letters: 'Harfler', phrases: 'Kısa zikirler', progress: (a, b) => `${a} / ${b} tamamlandı`, letter: 'Harf', pick: 'Yazmak için seçin', reset: 'İlerlemeyi sıfırla',
    note: 'Yazı nesih hattıyladır (Amiri). İlerleme yalnızca bu cihazda saklanır.', kidNote: 'Harfin üzerinden parmağınla yaz — altın rengine boyanacak!' },
}

const read = (key) => { try { const v = JSON.parse(localStorage.getItem(key) || '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} } }
const write = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* yaddaş bağlıdır */ } }

export default function TracePractice({ lang = 'az', kid = false, storageKey = 'arabic_trace_v1' }) {
  const t = pickUi(T, lang, 'en')
  const items = useMemo(() => {
    const letters = LETTERS.map(l => ({ id: l.id, ar: l.ch, kind: 'letter', name: l.name }))
    const phrases = (kid ? PHRASES.slice(0, 1) : PHRASES).map(p => ({ ...p, kind: 'word' }))
    return { letters, phrases }
  }, [kid])
  const all = useMemo(() => [...items.letters, ...items.phrases], [items])
  const [tab, setTab] = useState('letters')
  const [cur, setCur] = useState(items.letters[0].id)
  const [prog, setProg] = useState({})
  useEffect(() => { setProg(read(storageKey)) }, [storageKey])

  const item = all.find(i => i.id === cur) || all[0]
  const list = tab === 'letters' ? items.letters : items.phrases
  const doneN = all.filter(i => prog[i.id] != null).length

  const onDone = (r) => {
    setProg(p => {
      const prev = p[item.id]
      const val = r.manual ? (prev ?? 'm') : Math.max(typeof prev === 'number' ? prev : 0, r.stars)
      const next = { ...p, [item.id]: val }
      write(storageKey, next)
      return next
    })
  }
  const goNext = () => {
    const i = all.findIndex(x => x.id === item.id)
    const nx = all[(i + 1) % all.length]
    setCur(nx.id)
    setTab(nx.kind === 'letter' ? 'letters' : 'phrases')
  }
  const reset = () => { setProg({}); write(storageKey, {}) }
  const name = (o) => pickUi(o.name, lang, 'en')

  return (
    <div className={`trp${kid ? ' trp--kid' : ''}`} data-testid={kid ? 'kids-trace' : 'trace-practice'}>
      <div className="trp__head">
        <div className="trp__tabs" role="group" aria-label={t.pick}>
          <button type="button" className="ui-chip" aria-pressed={tab === 'letters'} onClick={() => setTab('letters')}>{t.letters}</button>
          <button type="button" className="ui-chip" aria-pressed={tab === 'phrases'} onClick={() => setTab('phrases')}>{t.phrases}</button>
        </div>
        <span className="trp__count ui-num" aria-live="polite">{t.progress(doneN, all.length)}</span>
      </div>
      <ul className={`trp__grid${tab === 'phrases' ? ' trp__grid--phr' : ''}`} aria-label={tab === 'letters' ? t.letters : t.phrases}>
        {list.map(i => (
          <li key={i.id}>
            <button type="button" className={`trp__item${prog[i.id] != null ? ' is-done' : ''}`} aria-current={i.id === item.id ? 'true' : undefined}
              lang="ar" dir="rtl" aria-label={`${name(i)}${prog[i.id] != null ? ' ✓' : ''}`} onClick={() => setCur(i.id)}>
              {i.ar}
            </button>
          </li>
        ))}
      </ul>
      <p className="trp__title">
        {item.kind === 'letter' ? `${t.letter}: ` : ''}<b lang="ar" dir="rtl">{item.ar}</b> <span>{name(item)}</span>
      </p>
      <TraceCanvas key={item.id} text={item.ar} kind={item.kind} lang={lang} kid={kid}
        done={prog[item.id] != null} onDone={onDone} onNext={goNext} label={name(item)} />
      <p className="trp__note">{kid ? t.kidNote : t.note}</p>
      {!kid && doneN > 0 && (
        <p className="trp__note"><button type="button" className="ui-link" onClick={reset}>{t.reset}</button></p>
      )}
    </div>
  )
}
