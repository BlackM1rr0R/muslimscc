// ═══════════════════════════════════════════════════════
// MuqattaatMap (v6.5) — "Müqəttəə hərfləri": الم, حم … ilə başlayan 29 surə (/quran)
//
//   <MuqattaatMap lang="az" surahName={n => '…'} onOpen={s => …} />
//
// • Yuxarıda 14 hərf (hər birində neçə surəni açdığı), altda 29 surə Mushaf sırası ilə — açılış
//   Osmani nəşrindən hərfi-hərfinə (data/muqattaat.js, testlə). Hərfə toxun → onunla başlayan surələr
//   işıqlanır; surəyə toxun → onun hərfləri işıqlanır və oxunuşu göstərilir.
// • Mənaları barədə şərh yazılmır (alimlərin müxtəlif görüşləri var) — yalnız harada gəldikləri.
// Stillər: src/styles/MuqattaatMap.css
// ═══════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { MUQATTAAT, LETTERS, lettersOf, letterCounts, COMBOS, plainLetters } from '../../data/muqattaat'
import '../../styles/MuqattaatMap.css'

const T = {
  az: { ey: 'Müqəttəə hərfləri', title: '29 surə hərflərlə başlayır', lead: 'Bəzi surələr ayrı-ayrı oxunan hərflərlə açılır: الم, حم, يس … Hərfə toxunun — onunla başlayan surələri görün; surəyə toxunun — hərflərini görün.',
    surahs: 'surə', letters: 'hərf', combos: 'müxtəlif birləşmə', half: '28 hərfli əlifbanın düz yarısı', opens: n => `${n} surəni açır`, read: 'Oxunuşu', open: 'Surəni aç', all: 'Hamısı',
    note: 'Bu hərflərin mənası barədə alimlərin müxtəlif görüşləri var; burada yalnız harada gəldikləri göstərilir. Mətn — saytdakı Osmani mushafı.' },
  en: { ey: 'The disconnected letters', title: '29 surahs open with letters', lead: 'Some surahs open with letters read one by one: الم, حم, يس … Tap a letter to see the surahs it opens; tap a surah to see its letters.',
    surahs: 'surahs', letters: 'letters', combos: 'different combinations', half: 'exactly half of the 28-letter alphabet', opens: n => `opens ${n} ${n === 1 ? 'surah' : 'surahs'}`, read: 'Read as', open: 'Open the surah', all: 'All',
    note: 'Scholars hold different views on the meaning of these letters; this only shows where they occur. Text: the site’s Uthmani mushaf.' },
  ru: { ey: 'Отдельные буквы', title: '29 сур начинаются с букв', lead: 'Некоторые суры открываются буквами, которые читаются по отдельности: الم, حم, يس … Коснитесь буквы — увидите суры, которые она открывает; коснитесь суры — увидите её буквы.',
    surahs: 'сур', letters: 'букв', combos: 'разных сочетаний', half: 'ровно половина 28-буквенного алфавита', opens: n => `открывает сур: ${n}`, read: 'Чтение', open: 'Открыть суру', all: 'Все',
    note: 'О значении этих букв у учёных разные мнения; здесь показано только, где они встречаются. Текст — османский мусхаф сайта.' },
  ar: { ey: 'الحروف المقطعة', title: '29 سورة تُفتتح بالحروف', lead: 'تُفتتح بعض السور بحروف تُقرأ مفرّقة: الم، حم، يس… المس حرفًا لترى السور التي يفتتحها، والمس سورة لترى حروفها.',
    surahs: 'سورة', letters: 'حرفًا', combos: 'تركيبًا مختلفًا', half: 'نصف حروف الهجاء الثمانية والعشرين تمامًا', opens: n => `يفتتح ${n} سورة`, read: 'تُقرأ', open: 'افتح السورة', all: 'الكل',
    note: 'للعلماء أقوال في معاني هذه الحروف، وهنا يُبيَّن موضعها فقط. النص من المصحف العثماني في الموقع.' },
  tr: { ey: 'Hurûf-ı mukattaa', title: '29 sure harflerle başlar', lead: 'Bazı sureler tek tek okunan harflerle açılır: الم, حم, يس … Bir harfe dokunun — onunla başlayan sureleri görün; bir sureye dokunun — harflerini görün.',
    surahs: 'sure', letters: 'harf', combos: 'farklı birleşim', half: '28 harfli alfabenin tam yarısı', opens: n => `${n} sureyi açar`, read: 'Okunuşu', open: 'Sureyi aç', all: 'Tümü',
    note: 'Bu harflerin anlamı hakkında âlimlerin farklı görüşleri vardır; burada yalnızca nerede geçtikleri gösterilir. Metin: sitedeki Osmanlı (Osmânî) mushafı.' },
}

export default function MuqattaatMap({ lang = 'az', surahName = (s) => String(s), onOpen }) {
  const t = pickUi(T, lang)
  const counts = useMemo(() => letterCounts(), [])
  const [letter, setLetter] = useState(null)
  const [sel, setSel] = useState(null)
  const selM = MUQATTAAT.find(m => m.s === sel)
  const selLetters = selM ? lettersOf(selM) : []
  const nameOf = (ch) => (lang === 'ar' ? ch : pickUi(LETTERS.find(l => l.ch === ch)?.name || {}, lang))
  const reading = selM ? selM.open.map(w => [...plainLetters(w)].map(nameOf).join(' ')).join(' · ') : ''

  return (
    <section className="ui-card mqm" data-testid="muqattaat" aria-labelledby="mqm-title">
      <div className="mqm__head">
        <span className="ui-eyebrow">{t.ey}</span>
        <h2 id="mqm-title" className="ui-title ui-title--sm">{t.title}</h2>
        <p className="ui-lead">{t.lead}</p>
      </div>
      <dl className="mqm__stats">
        <div><dt className="ui-num">29</dt><dd>{t.surahs}</dd></div>
        <div><dt className="ui-num">14</dt><dd>{t.letters} — {t.half}</dd></div>
        <div><dt className="ui-num">{COMBOS.length}</dt><dd>{t.combos}</dd></div>
      </dl>
      <div className="mqm__letters" role="group" aria-label={t.letters}>
        <button type="button" className={`mqm__all${letter == null && sel == null ? ' is-on' : ''}`} onClick={() => { setLetter(null); setSel(null) }}>{t.all}</button>
        {LETTERS.map(l => {
          const on = letter === l.ch || selLetters.includes(l.ch)
          return (
            <button key={l.ch} type="button" className={`mqm__letter${on ? ' is-on' : ''}`} aria-pressed={letter === l.ch}
              onClick={() => { setLetter(v => (v === l.ch ? null : l.ch)); setSel(null) }} data-testid="mqm-letter" data-ch={l.ch}
              title={`${nameOf(l.ch)} — ${t.opens(counts[l.ch])}`}>
              <span className="mqm__ch ui-arabic" lang="ar">{l.ch}</span>
              <span className="mqm__ln">{lang !== 'ar' && nameOf(l.ch)}</span>
              <span className="mqm__lc ui-num">{counts[l.ch]}</span>
            </button>
          )
        })}
      </div>
      <p className="mqm__hint" aria-live="polite" data-testid="mqm-hint">
        {letter ? <><b className="ui-arabic" lang="ar">{letter}</b> {lang !== 'ar' && `(${nameOf(letter)})`} — {t.opens(counts[letter])}</> : ' '}
      </p>
      <ol className="mqm__surahs" data-testid="mqm-surahs">
        {MUQATTAAT.map(m => {
          const ls = lettersOf(m)
          const lit = letter ? ls.includes(letter) : sel ? m.s === sel : true
          return (
            <li key={m.s}>
              <button type="button" className={`mqm__surah${lit ? ' is-lit' : ''}${sel === m.s ? ' is-sel' : ''}`} aria-pressed={sel === m.s}
                onClick={() => { setSel(v => (v === m.s ? null : m.s)); setLetter(null) }} data-testid="mqm-surah" data-s={m.s} data-lit={lit ? '1' : '0'}>
                <span className="mqm__open ui-arabic" lang="ar" dir="rtl">{m.open.join(' ')}</span>
                <span className="mqm__sn"><span className="ui-num">{m.s}.</span> {surahName(m.s)}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {selM && (
        <div className="mqm__card" data-testid="mqm-card">
          <span className="mqm__big ui-arabic" lang="ar" dir="rtl">{selM.open.join(' ')}</span>
          <div className="mqm__cardtxt">
            <b>{surahName(selM.s)} <span className="ui-num">({selM.s})</span></b>
            {lang !== 'ar' && <span>{t.read}: <i data-testid="mqm-reading">{reading}</i></span>}
          </div>
          {onOpen && <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => onOpen(selM.s)}>{t.open} <Icon name="chevron" size={14} className="ui-flip-rtl" /></button>}
        </div>
      )}
      <p className="mqm__note"><Icon name="info" size={14} /> {t.note}</p>
    </section>
  )
}
