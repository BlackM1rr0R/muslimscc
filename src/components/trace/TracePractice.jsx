// ═══════════════════════════════════════════════════════
// TracePractice (v7) — "Barmaqla yaz" xəttatlıq məşqi
//
//   <TracePractice lang="az" />                 — /learn-arabic: 28 hərf + 5 qısa zikr
//   <TracePractice lang="az" kid storageKey="kids_trace_v1" />  — /kids: hərflər + Bismillah,
//                                                  qalın fırça, yumşaq hədd, sıra tələb olunmur
// • Hərflər — tək (isolated) forma, data/arabicCourse.js-dən (adları 5 dildə).
// • İrəliləyiş localStorage-da ({ id: ulduz | 'm' — yazmadan tamamlanıb }), try/catch.
// • Hərfin adı + transliterasiyası + tələffüz səsi (public/audio/arabic/<id>.wav, kursla eyni).
// • Mövqe formaları (yalnız böyüklər rejimi): tək / əvvəldə / ortada / sonda — data/arabicCourse.js
//   letterForms (tətvil ilə). İrəliləyiş açarı "<id>@<forma>"; sayğac yalnız əsas (tək) formanı sayır.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react'
import TraceCanvas from './TraceCanvas'
import Icon from '../Icon'
import { useCourseAudio, letterAudioUrl } from '../arabic/useCourseAudio'
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
  az: { forms: 'Forma', form: { isolated: 'Tək', initial: 'Əvvəldə', medial: 'Ortada', final: 'Sonda' }, listen: 'Dinlə', stop: 'Dayandır',
    letters: 'Hərflər', phrases: 'Qısa zikrlər', progress: (a, b) => `${a} / ${b} tamamlanıb`, letter: 'Hərf', pick: 'Yazmaq üçün seçin', reset: 'İrəliləyişi sıfırla',
    note: 'Yazı nəsx xəttindədir (Amiri). İrəliləyiş yalnız bu cihazda saxlanılır.', kidNote: 'Hərfin üstündən barmağınla yaz — qızılı rəngə boyanacaq!' },
  en: { forms: 'Form', form: { isolated: 'Isolated', initial: 'Initial', medial: 'Medial', final: 'Final' }, listen: 'Listen', stop: 'Stop',
    letters: 'Letters', phrases: 'Short dhikr', progress: (a, b) => `${a} / ${b} completed`, letter: 'Letter', pick: 'Choose what to write', reset: 'Reset progress',
    note: 'The writing is in Naskh script (Amiri). Progress is saved on this device only.', kidNote: 'Write over the letter with your finger — it turns gold!' },
  ru: { forms: 'Форма', form: { isolated: 'Отдельно', initial: 'В начале', medial: 'В середине', final: 'В конце' }, listen: 'Слушать', stop: 'Остановить',
    letters: 'Буквы', phrases: 'Короткие зикры', progress: (a, b) => `выполнено ${a} из ${b}`, letter: 'Буква', pick: 'Выберите, что написать', reset: 'Сбросить прогресс',
    // lang-ok[Amiri]: şrift adıdır
    note: 'Письмо — почерк насх (шрифт Amiri). Прогресс сохраняется только на этом устройстве.', kidNote: 'Обведи букву пальцем — она станет золотой!' },
  ar: { forms: 'الشكل', form: { isolated: 'منفصلة', initial: 'في الأول', medial: 'في الوسط', final: 'في الآخر' }, listen: 'استمع', stop: 'إيقاف',
    letters: 'الحروف', phrases: 'أذكار قصيرة', progress: (a, b) => `أُتمّ ${a} من ${b}`, letter: 'حرف', pick: 'اختر ما تكتبه', reset: 'إعادة التقدّم',
    // lang-ok[Amiri]: şrift adıdır
    note: 'الكتابة بخط النسخ (Amiri)، ويُحفظ التقدّم على هذا الجهاز فقط.', kidNote: 'اكتب فوق الحرف بإصبعك — سيصير ذهبيًّا!' },
  tr: { forms: 'Biçim', form: { isolated: 'Tek başına', initial: 'Başta', medial: 'Ortada', final: 'Sonda' }, listen: 'Dinle', stop: 'Durdur',
    letters: 'Harfler', phrases: 'Kısa zikirler', progress: (a, b) => `${a} / ${b} tamamlandı`, letter: 'Harf', pick: 'Yazmak için seçin', reset: 'İlerlemeyi sıfırla',
    note: 'Yazı nesih hattıyladır (Amiri). İlerleme yalnızca bu cihazda saklanır.', kidNote: 'Harfin üzerinden parmağınla yaz — altın rengine boyanacak!' },
}

const read = (key) => { try { const v = JSON.parse(localStorage.getItem(key) || '{}'); return v && typeof v === 'object' ? v : {} } catch { return {} } }
const write = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* yaddaş bağlıdır */ } }

export default function TracePractice({ lang = 'az', kid = false, storageKey = 'arabic_trace_v1' }) {
  const t = pickUi(T, lang, 'en')
  const items = useMemo(() => {
    const letters = LETTERS.map(l => ({ id: l.id, ar: l.ch, kind: 'letter', name: l.name, tl: l.tl, audio: l.audio, forms: l.forms }))
    const phrases = (kid ? PHRASES.slice(0, 1) : PHRASES).map(p => ({ ...p, kind: 'word' }))
    return { letters, phrases }
  }, [kid])
  const all = useMemo(() => [...items.letters, ...items.phrases], [items])
  const [tab, setTab] = useState('letters')
  const [cur, setCur] = useState(items.letters[0].id)
  const [prog, setProg] = useState({})
  // Mövqe forması (hərflər arasında keçəndə saxlanılır — eyni formanı bütün hərflərdə məşq etmək üçün)
  const [form, setForm] = useState('isolated')
  const audio = useCourseAudio()
  const stopAudio = audio.stop
  // Başqa hərfə keçəndə əvvəlkinin səsi kəsilir
  useEffect(() => { stopAudio() }, [cur, stopAudio])
  useEffect(() => { setProg(read(storageKey)) }, [storageKey])

  const item = all.find(i => i.id === cur) || all[0]
  const list = tab === 'letters' ? items.letters : items.phrases
  const doneN = all.filter(i => prog[i.id] != null).length
  const isLetter = item.kind === 'letter'
  const curForm = isLetter && !kid ? form : 'isolated'
  const fkey = (f) => (f === 'isolated' ? item.id : `${item.id}@${f}`)
  const pkey = fkey(curForm)
  const text = isLetter ? item.forms[curForm] : item.ar

  const onDone = (r) => {
    setProg(p => {
      const prev = p[pkey]
      const val = r.manual ? (prev ?? 'm') : Math.max(typeof prev === 'number' ? prev : 0, r.stars)
      const next = { ...p, [pkey]: val }
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
      <div className="trp__info">
        <p className="trp__title">
          {isLetter ? `${t.letter}: ` : ''}<b lang="ar" dir="rtl">{item.ar}</b> <span>{name(item)}</span>
          {isLetter && item.tl && <span className="trp__tl" lang="ar-Latn" data-testid="trace-tl"> · {item.tl}</span>}
        </p>
        {isLetter && item.audio && (
          <button type="button" className={`ui-btn ui-btn--ghost ui-btn--sm trp__listen${audio.playing === item.id ? ' is-playing' : ''}`}
            aria-pressed={audio.playing === item.id} onClick={() => audio.play(item.id, [letterAudioUrl(item.audio)])}>
            <Icon name={audio.playing === item.id ? 'pause' : 'volume'} className="ui-btn__icon" />
            {audio.playing === item.id ? t.stop : t.listen}
          </button>
        )}
      </div>
      {isLetter && !kid && (
        <div className="trp__forms" role="group" aria-label={t.forms}>
          {['isolated', 'initial', 'medial', 'final'].map(f => (
            <button key={f} type="button" className={`ui-chip trp__form${prog[fkey(f)] != null ? ' is-done' : ''}`} aria-pressed={curForm === f} onClick={() => setForm(f)}>
              <span className="trp__form-ar" lang="ar" dir="rtl" aria-hidden="true">{item.forms[f]}</span>
              <span>{t.form[f]}{prog[fkey(f)] != null ? ' ✓' : ''}</span>
            </button>
          ))}
        </div>
      )}
      <TraceCanvas key={pkey} text={text} kind={item.kind} lang={lang} kid={kid}
        done={prog[pkey] != null} onDone={onDone} onNext={goNext} label={isLetter && curForm !== 'isolated' ? `${name(item)} — ${t.form[curForm]}` : name(item)} />
      <p className="trp__note">{kid ? t.kidNote : t.note}</p>
      {!kid && doneN > 0 && (
        <p className="trp__note"><button type="button" className="ui-link" onClick={reset}>{t.reset}</button></p>
      )}
    </div>
  )
}
