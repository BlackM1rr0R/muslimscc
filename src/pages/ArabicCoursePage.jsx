// ═══════════════════════════════════════════════════════
// /learn-arabic — "Ərəb əlifbası və Quran oxumağı öyrən" (yeni müsəlmanlar və uşaqlar üçün)
//
// Quruluş: hero (irəliləyiş + "Davam et") → açıq dərs (varsa) → dərs kartları.
// Açıq dərs ünvanın hash-indədir: #letters #harakat #reading #tajweed —
// "Geri" düyməsi dərsdən çıxır, link paylaşmaq olur, marşrut dəyişmir.
// Hər dərs: "Öyrən" (məzmun) və "Yoxla" (viktorina). Nəticə localStorage-da
// (components/arabic/progress.js, try/catch). Məzmun: data/arabicCourse.js.
// ═══════════════════════════════════════════════════════

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import PageLink, { isPlainClick } from '../components/PageLink'
import { LESSONS } from '../data/arabicCourse.js'
import {
  PRONOUNS_DETACHED, PRONOUNS_ATTACHED, DEMONSTRATIVES, NOMINAL_EXAMPLES, VERBAL_EXAMPLES, VERB_FORMS, GRAMMAR_TEXT,
} from '../data/arabicGrammar.js'
import { QURAN_WORDS, QURAN_WORDS_TOTAL, QURAN_WORDS_TOP_SUM } from '../data/quranWords.js'
import { pathFor } from '../seo/routes'
import { ui, pick } from '../components/arabic/strings.js'
import { useCourseAudio } from '../components/arabic/useCourseAudio.js'
import { buildQuiz } from '../components/arabic/quizzes.js'
import {
  readProgress, writeProgress, withResult, isPassed, passedCount, percentDone, resumeLesson, PASS_PERCENT,
} from '../components/arabic/progress.js'
import LetterLesson from '../components/arabic/LetterLesson.jsx'
import Quiz from '../components/arabic/Quiz.jsx'
import { ProgressRing } from '../components/viz'
import '../styles/ArabicCourse.css'

// v3 — hero izahı, açar rəqəmlər və "kursun yolu" (3 mərhələ)
const AX = {
  az: { how: (l, q, p) => `Hər dərsdə əvvəl «${l}» hissəsini oxu və dinlə, sonra «${q}» ilə qısa yoxlamadan keç: ${p}% və yuxarı nəticə dərsi tamamlanmış sayır. İrəliləyiş bu cihazda saxlanılır.`,
    lessons: 'dərs', letters: 'hərf', words: 'ən çox işlənən söz', coverage: 'Quran sözlərinin payı',
    pathEyebrow: 'Kursun yolu', pathTitle: 'Oxumaqdan anlamağa', pathLead: 'Doqquz dərs üç mərhələdədir; hər mərhələ növbətisinin bünövrəsidir.', range: (a, b) => (a === b ? `Dərs ${a}` : `Dərs ${a}–${b}`),
    stages: [['Oxumaq', 'Hərflər, hərəkələr və hecalar — Quran mətnini səsləndirməyi öyrənirsən.'], ['Düzgün tilavət', 'Təcvidin əsas qaydaları — ayələri düzgün oxumaq üçün.'], ['Anlamaq', 'Əvəzliklər, cümlə növləri və Quranın ən çox işlənən 100 sözü.']] },
  en: { how: (l, q, p) => `In each lesson, first read and listen in “${l}”, then take the short check in “${q}”: a score of ${p}% or more completes the lesson. Progress is saved on this device.`,
    lessons: 'lessons', letters: 'letters', words: 'most frequent words', coverage: 'of the Quran’s words',
    pathEyebrow: 'Course path', pathTitle: 'From reading to understanding', pathLead: 'Nine lessons in three stages; each stage is the foundation of the next.', range: (a, b) => (a === b ? `Lesson ${a}` : `Lessons ${a}–${b}`),
    stages: [['Reading', 'Letters, vowel marks and syllables — you learn to sound out the Quranic text.'], ['Correct recitation', 'The basic rules of tajwid — to recite the verses properly.'], ['Understanding', 'Pronouns, sentence types and the 100 most frequent words of the Quran.']] },
  ru: { how: (l, q, p) => `В каждом уроке сначала читайте и слушайте раздел «${l}», затем пройдите короткую проверку «${q}»: результат от ${p}% засчитывает урок. Прогресс сохраняется на этом устройстве.`,
    lessons: 'уроков', letters: 'букв', words: 'самых частых слов', coverage: 'слов Корана',
    pathEyebrow: 'Путь курса', pathTitle: 'От чтения к пониманию', pathLead: 'Девять уроков в трёх этапах; каждый этап — основа следующего.', range: (a, b) => (a === b ? `Урок ${a}` : `Уроки ${a}–${b}`),
    stages: [['Чтение', 'Буквы, огласовки и слоги — вы учитесь озвучивать текст Корана.'], ['Правильное чтение', 'Основные правила таджвида — чтобы читать аяты правильно.'], ['Понимание', 'Местоимения, виды предложений и 100 самых частых слов Корана.']] },
  ar: { how: (l, q, p) => `في كل درس اقرأ واستمع أولًا في «${l}»، ثم أجرِ الاختبار القصير في «${q}»: نتيجة ${p}٪ فأكثر تُتمّ الدرس. يُحفظ تقدمك على هذا الجهاز.`,
    lessons: 'دروس', letters: 'حرفًا', words: 'كلمة الأكثر ورودًا', coverage: 'من كلمات القرآن',
    pathEyebrow: 'مسار الدورة', pathTitle: 'من القراءة إلى الفهم', pathLead: 'تسعة دروس في ثلاث مراحل، كل مرحلة أساس لما بعدها.', range: (a, b) => (a === b ? `الدرس ${a}` : `الدروس ${a}–${b}`),
    stages: [['القراءة', 'الحروف والحركات والمقاطع — تتعلم نطق نص القرآن.'], ['التلاوة الصحيحة', 'أصول أحكام التجويد لقراءة الآيات قراءة صحيحة.'], ['الفهم', 'الضمائر وأنواع الجمل وأكثر ١٠٠ كلمة ورودًا في القرآن.']] },
  tr: { how: (l, q, p) => `Her derste önce “${l}” bölümünü okuyup dinleyin, sonra “${q}” ile kısa sınavı geçin: %${p} ve üzeri sonuç dersi tamamlanmış sayar. İlerleme bu cihazda saklanır.`,
    lessons: 'ders', letters: 'harf', words: 'en sık geçen kelime', coverage: 'Kur’an kelimelerinin payı',
    pathEyebrow: 'Kursun yolu', pathTitle: 'Okumaktan anlamaya', pathLead: 'Dokuz ders üç aşamadadır; her aşama bir sonrakinin temelidir.', range: (a, b) => (a === b ? `Ders ${a}` : `Ders ${a}–${b}`),
    stages: [['Okuma', 'Harfler, harekeler ve heceler — Kur’an metnini seslendirmeyi öğrenirsin.'], ['Doğru tilavet', 'Tecvidin temel kuralları — ayetleri doğru okumak için.'], ['Anlama', 'Zamirler, cümle türleri ve Kur’an’ın en sık geçen 100 kelimesi.']] },
}
// Mərhələ → dərs indeksləri (LESSONS sırası ilə)
const STAGES = [[0, 2], [3, 3], [4, 8]]

// Ağır olmayan, amma ilk ekranda lazım olmayan dərslər ayrıca yüklənir
const HarakatLesson = lazy(() => import('../components/arabic/HarakatLesson.jsx'))
const ReadingLesson = lazy(() => import('../components/arabic/ReadingLesson.jsx'))
const TajweedLesson = lazy(() => import('../components/arabic/TajweedLesson.jsx'))
// ═══════════════════════════════════════════════════════
// QRAMMATİKA VƏ LÜĞƏT DƏRSLƏRİ (5–9): əvəzliklər, işarə əvəzlikləri, ismi
// cümlə, feli cümlə, Quranın ən çox işlənən 100 sözü. Məzmun:
// src/data/arabicGrammar.js (Quran nümunələri Quran.com API-dən söz-söz),
// src/data/quranWords.js (Quranic Arabic Corpus morfologiyasından hesablanıb).
// Yoxlama Quiz.jsx ilə eyni formatdadır; nəticə eyni yaddaşa (progress.js) düşür.
// ═══════════════════════════════════════════════════════

const G = {
  az: {
    meaning: 'Mənası', example: 'Qurandan nümunə', noExample: 'Bu forma Quranda az işlənir — yalnız cədvəldə verilib.',
    roles: { m: 'Mübtəda', k: 'Xəbər', v: 'Fel', f: 'Fail', o: 'Məful', x: 'Ədat' },
    nominal: 'İsmi cümlə', verbal: 'Feli cümlə', examples: 'Qurandan nümunələr',
    qPronoun: 'Bu əvəzlik nə deməkdir?', qPronounRev: (x) => `«${x}» hansı əvəzlikdir?`, qDemo: 'Bu işarə əvəzliyi nə deməkdir?',
    qRole: (r) => `Bu ayədə ${r.toLocaleLowerCase('az')} hansıdır?`, qType: 'Bu cümlə hansı növdəndir?', qWord: 'Bu söz nə deməkdir?', qPhrase: 'Bu ifadə necə tərcümə olunur?',
    thisBook: '«bu kitab» (birləşmə)', thisIsBook: '«bu, kitabdır» (cümlə)',
    coverage: (p) => `Quran sözlərinin ≈${p}%-i`, search: 'Söz və ya məna axtar…', none: 'Heç nə tapılmadı', openSurah: 'Surəni aç',
    rank: 'Sıra', word: 'Söz', count: 'Say', firstAyah: 'İlk ayə',
  },
  en: {
    meaning: 'Meaning', example: 'Example from the Quran', noExample: 'This form is rare in the Quran — it is given in the table only.',
    roles: { m: 'Subject (mubtadaʾ)', k: 'Predicate (khabar)', v: 'Verb (fiʿl)', f: 'Doer (fāʿil)', o: 'Object (mafʿūl)', x: 'Particle' },
    nominal: 'Nominal sentence', verbal: 'Verbal sentence', examples: 'Examples from the Quran',
    qPronoun: 'What does this pronoun mean?', qPronounRev: (x) => `Which pronoun means “${x}”?`, qDemo: 'What does this demonstrative mean?',
    qRole: (r) => `Which part of this verse is the ${r.replace(/ \(.*\)$/, '').toLowerCase()}?`, qType: 'What kind of sentence is this?', qWord: 'What does this word mean?', qPhrase: 'How is this translated?',
    thisBook: '“this book” (a phrase)', thisIsBook: '“this is a book” (a sentence)',
    coverage: (p) => `≈${p}% of the Quran’s words`, search: 'Search a word or meaning…', none: 'Nothing found', openSurah: 'Open the surah',
    rank: 'Rank', word: 'Word', count: 'Count', firstAyah: 'First verse',
  },
  ru: {
    meaning: 'Значение', example: 'Пример из Корана', noExample: 'Эта форма в Коране встречается редко — дана только в таблице.',
    roles: { m: 'Подлежащее (мубтада)', k: 'Сказуемое (хабар)', v: 'Глагол (фи‘ль)', f: 'Деятель (фа‘иль)', o: 'Объект (маф‘уль)', x: 'Частица' },
    nominal: 'Именное предложение', verbal: 'Глагольное предложение', examples: 'Примеры из Корана',
    qPronoun: 'Что означает это местоимение?', qPronounRev: (x) => `Какое местоимение означает «${x}»?`, qDemo: 'Что означает это указательное местоимение?',
    qRole: (r) => `Какая часть этого аята — ${r.replace(/ \(.*\)$/, '').toLowerCase()}?`, qType: 'Какое это предложение?', qWord: 'Что означает это слово?', qPhrase: 'Как это переводится?',
    thisBook: '«эта книга» (словосочетание)', thisIsBook: '«это — книга» (предложение)',
    coverage: (p) => `≈${p}% слов Корана`, search: 'Искать слово или значение…', none: 'Ничего не найдено', openSurah: 'Открыть суру',
    rank: 'Место', word: 'Слово', count: 'Частота', firstAyah: 'Первый аят',
  },
  ar: {
    meaning: 'المعنى', example: 'مثال من القرآن', noExample: 'هذه الصيغة قليلة في القرآن، فاكتفينا بذكرها في الجدول.',
    roles: { m: 'المبتدأ', k: 'الخبر', v: 'الفعل', f: 'الفاعل', o: 'المفعول به', x: 'حرف' },
    nominal: 'جملة اسمية', verbal: 'جملة فعلية', examples: 'أمثلة من القرآن',
    qPronoun: 'ما دلالة هذا الضمير؟', qPronounRev: (x) => `أي ضمير يدل على: ${x}؟`, qDemo: 'لِمَ يُشار بهذا الاسم؟',
    qRole: (r) => `ما ${r} في هذه الآية؟`, qType: 'ما نوع هذه الجملة؟', qWord: 'ما معنى هذه الكلمة؟', qPhrase: 'ما إعراب ما بعد اسم الإشارة هنا؟',
    thisBook: 'بدل أو نعت (مركّب)', thisIsBook: 'خبر (جملة تامة)',
    coverage: (p) => `نحو ${p}٪ من كلمات القرآن`, search: 'ابحث عن كلمة أو معنى…', none: 'لا نتائج', openSurah: 'افتح السورة',
    rank: 'الترتيب', word: 'الكلمة', count: 'العدد', firstAyah: 'أول آية',
  },
  tr: {
    meaning: 'Anlamı', example: 'Kur’an’dan örnek', noExample: 'Bu biçim Kur’an’da az geçer — yalnızca tabloda verilmiştir.',
    roles: { m: 'Mübteda', k: 'Haber', v: 'Fiil', f: 'Fail', o: 'Meful', x: 'Edat' },
    nominal: 'İsim cümlesi', verbal: 'Fiil cümlesi', examples: 'Kur’an’dan örnekler',
    qPronoun: 'Bu zamir ne anlama gelir?', qPronounRev: (x) => `“${x}” hangi zamirdir?`, qDemo: 'Bu işaret zamiri ne anlama gelir?',
    qRole: (r) => `Bu ayette ${r.toLocaleLowerCase('tr')} hangisidir?`, qType: 'Bu cümle hangi türdendir?', qWord: 'Bu kelime ne anlama gelir?', qPhrase: 'Bu ifade nasıl çevrilir?',
    thisBook: '“bu kitap” (tamlama)', thisIsBook: '“bu bir kitaptır” (cümle)',
    coverage: (p) => `Kur’an kelimelerinin ≈%${p}’i`, search: 'Kelime veya anlam ara…', none: 'Sonuç bulunamadı', openSurah: 'Sureyi aç',
    rank: 'Sıra', word: 'Kelime', count: 'Sayı', firstAyah: 'İlk ayet',
  },
}
const gx = (lang) => G[lang] || G.en

/** Quran nümunəsi: vurğulanmış söz, istinad, qısa məna */
function QuranLine({ ex, lang }) {
  const t = ui(lang)
  if (!ex) return <p className="ac-small ag-noex">{gx(lang).noExample}</p>
  const i = ex.hl ? ex.w.indexOf(ex.hl) : -1
  return (
    <div className="ag-ex">
      <p className="ag-ex__ar ui-arabic" lang="ar" dir="rtl">
        {i >= 0 ? <>{ex.w.slice(0, i)}<mark className="ag-hl">{ex.hl}</mark>{ex.w.slice(i + ex.hl.length)}</> : ex.w}
      </p>
      <p className="ag-ex__meta">
        <span className="ag-ex__t">{pick(ex.t, lang)}</span>
        <span className="ac-ref"><span>{t.quran}</span> <bdi className="ui-num">{ex.ref}</bdi></span>
      </p>
    </div>
  )
}

function WordCard({ item, lang }) {
  return (
    <li className="ui-card ag-card">
      <div className="ag-card__head">
        <span className="ag-card__ar ui-arabic" lang="ar" dir="rtl">{item.ar}</span>
        <span className="ag-card__names">
          <span className="ac-tl" lang="und-Latn" dir="ltr">{item.tl}</span>
          <span className="ag-card__m">{pick(item.m, lang)}</span>
        </span>
      </div>
      <QuranLine ex={item.ex} lang={lang} />
    </li>
  )
}

function PronounsLesson({ lang }) {
  const T = GRAMMAR_TEXT.pronouns
  return (
    <div className="ag-lesson">
      <p className="ac-text ag-intro">{pick(T.intro, lang)}</p>
      <h3 className="ac-h3">{pick(T.detached, lang)} <span className="ac-h3__ar ui-arabic" lang="ar">الضمائر المنفصلة</span></h3>
      <ul className="ag-grid">{PRONOUNS_DETACHED.map(p => <WordCard key={p.id} item={p} lang={lang} />)}</ul>
      <p className="ac-muted ag-note">{pick(T.dualNote, lang)}</p>
      <h3 className="ac-h3">{pick(T.attached, lang)} <span className="ac-h3__ar ui-arabic" lang="ar">الضمائر المتصلة</span></h3>
      <p className="ac-muted ag-note">{pick(T.attachedNote, lang)}</p>
      <ul className="ag-grid">{PRONOUNS_ATTACHED.map(p => <WordCard key={p.id} item={p} lang={lang} />)}</ul>
    </div>
  )
}

function DemonstrativesLesson({ lang }) {
  const T = GRAMMAR_TEXT.demonstratives
  return (
    <div className="ag-lesson">
      <p className="ac-text ag-intro">{pick(T.intro, lang)}</p>
      <h3 className="ac-h3">{pick(T.near, lang)} <span className="ac-h3__ar ui-arabic" lang="ar">للقريب</span></h3>
      <ul className="ag-grid">{DEMONSTRATIVES.filter(d => d.near).map(d => <WordCard key={d.id} item={d} lang={lang} />)}</ul>
      <h3 className="ac-h3">{pick(T.far, lang)} <span className="ac-h3__ar ui-arabic" lang="ar">للبعيد</span></h3>
      <ul className="ag-grid">{DEMONSTRATIVES.filter(d => !d.near).map(d => <WordCard key={d.id} item={d} lang={lang} />)}</ul>
      <div className="ui-card ui-card--sunken ag-rule">
        <h3 className="ac-h4">{pick(T.ruleTitle, lang)}</h3>
        <div className="ag-rule__pair">
          <p className="ag-rule__ar ui-arabic" lang="ar" dir="rtl">هَٰذَا ٱلْكِتَابُ</p>
          <p className="ag-rule__ar ui-arabic" lang="ar" dir="rtl">هَٰذَا كِتَابٌ</p>
        </div>
        <p className="ac-text">{pick(T.rule, lang)}</p>
      </div>
    </div>
  )
}

/** Cümlə: hər hissə öz rolu ilə (rəngli alt xətt + etiket) */
function SentenceParts({ ex, lang }) {
  const g = gx(lang)
  const t = ui(lang)
  return (
    <li className="ui-card ag-sent">
      <div className="ag-sent__parts" dir="rtl" lang="ar">
        {ex.parts.map(([w, role], i) => (
          <span key={i} className={`ag-part ag-part--${role}`}>
            <span className="ag-part__ar ui-arabic">{w}</span>
            <span className="ag-part__role" lang={lang} dir="auto">{g.roles[role]}</span>
          </span>
        ))}
      </div>
      <p className="ag-ex__meta">
        <span className="ag-ex__t">{pick(ex.t, lang)}</span>
        <span className="ac-ref"><span>{t.quran}</span> <bdi className="ui-num">{ex.ref}</bdi></span>
      </p>
    </li>
  )
}

function NominalLesson({ lang }) {
  const T = GRAMMAR_TEXT.nominal
  return (
    <div className="ag-lesson">
      <p className="ac-text ag-intro">{pick(T.intro, lang)}</p>
      <div className="ag-legend" aria-hidden="true">
        <span className="ag-part ag-part--m"><span className="ag-part__role">{gx(lang).roles.m}</span></span>
        <span className="ag-part ag-part--k"><span className="ag-part__role">{gx(lang).roles.k}</span></span>
      </div>
      <h3 className="ac-h3">{gx(lang).examples}</h3>
      <ul className="ag-sents">{NOMINAL_EXAMPLES.map(ex => <SentenceParts key={ex.ref} ex={ex} lang={lang} />)}</ul>
      <p className="ac-muted ag-note">{pick(T.khabarTypes, lang)}</p>
    </div>
  )
}

function VerbalLesson({ lang }) {
  const T = GRAMMAR_TEXT.verbal
  return (
    <div className="ag-lesson">
      <p className="ac-text ag-intro">{pick(T.intro, lang)}</p>
      <h3 className="ac-h3">{pick(T.formsTitle, lang)}</h3>
      <ul className="ag-grid ag-grid--3">
        {VERB_FORMS.map(f => (
          <li key={f.id} className="ui-card ag-card">
            <span className="ac-h4 ag-card__label">{pick(f.name, lang)}</span>
            <div className="ag-card__head">
              <span className="ag-card__ar ui-arabic" lang="ar" dir="rtl">{f.ex.w}</span>
              <span className="ag-card__names">
                <span className="ac-tl" lang="und-Latn" dir="ltr">{f.ex.tl}</span>
                <span className="ag-card__m">{pick(f.ex.t, lang)}</span>
              </span>
            </div>
            <span className="ac-ref"><span>{ui(lang).quran}</span> <bdi className="ui-num">{f.ex.ref}</bdi></span>
          </li>
        ))}
      </ul>
      <h3 className="ac-h3">{gx(lang).examples}</h3>
      <ul className="ag-sents">{VERBAL_EXAMPLES.map(ex => <SentenceParts key={ex.ref} ex={ex} lang={lang} />)}</ul>
      <p className="ac-muted ag-note">{pick(T.hidden, lang)}</p>
    </div>
  )
}

function VocabLesson({ lang }) {
  const T = GRAMMAR_TEXT.vocab
  const g = gx(lang)
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const pct = Math.round((QURAN_WORDS_TOP_SUM / QURAN_WORDS_TOTAL) * 100)
  const norm = (s) => String(s).replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا')
  const list = QURAN_WORDS.filter(w => (cat === 'all' || w.cat === cat) && (!q.trim() ||
    norm(w.ar).includes(norm(q.trim())) || pick(w.m, lang).toLocaleLowerCase().includes(q.trim().toLocaleLowerCase())))
  return (
    <div className="ag-lesson">
      <p className="ac-text ag-intro">{pick(T.intro, lang)}</p>
      <div className="ag-stat">
        <span className="ui-stat__num ui-num">{pct}%</span>
        <span className="ag-stat__label">{g.coverage(pct)}</span>
      </div>
      <div className="ag-vocab-tools">
        <div className="ag-chips" role="group" aria-label={pick(T.cats.all, lang)}>
          {['all', 'noun', 'verb', 'particle'].map(c => (
            <button key={c} type="button" className="ui-chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{pick(T.cats[c], lang)}</button>
          ))}
        </div>
        <input className="ui-input ag-vocab-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={g.search} aria-label={g.search} />
      </div>
      {list.length === 0 ? <p className="ac-muted">{g.none}</p> : (
        <ol className="ag-vocab">
          {list.map(w => (
            <li key={w.r} className="ag-vocab__row">
              <span className="ag-vocab__r ui-num" aria-label={g.rank}>{w.r}</span>
              <span className="ag-vocab__ar ui-arabic" lang="ar" dir="rtl">{w.ar}</span>
              <span className="ag-vocab__m">{pick(w.m, lang)}</span>
              <span className="ag-vocab__n"><bdi className="ui-num">{w.n}</bdi> {pick(T.times, lang)}</span>
              <a className="ac-ref ag-vocab__ref" href={pathFor('quran', lang, Number(w.ref.split(':')[0]))} title={g.openSurah}>
                {pick(T.firstIn, lang)}: <bdi className="ui-num">{w.ref}</bdi>
              </a>
            </li>
          ))}
        </ol>
      )}
      <p className="ac-small ag-credit">{pick(T.credit, lang)}</p>
    </div>
  )
}

// ── Yoxlama sualları (Quiz.jsx formatı) ──
function shuffleArr(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
/** Düzgün cavab + fərqli etiketli səhv variantlar */
function optionsFor(correct, pool, n = 4) {
  const seen = new Set([correct.label])
  const out = [correct]
  for (const o of shuffleArr(pool)) {
    if (out.length >= n) break
    if (o.key === correct.key || seen.has(o.label)) continue
    seen.add(o.label); out.push(o)
  }
  return shuffleArr(out)
}
function wordQuiz(items, lang, n, textFwd, textRev) {
  const meaningOpt = (x) => ({ key: x.id, label: pick(x.m, lang), ar: false })
  const arOpt = (x) => ({ key: x.id, label: x.ar, ar: true })
  return shuffleArr(items).slice(0, n).map((x, i) => (i % 2 === 0 || !textRev
    ? { id: `w-${x.id}`, kind: 'meaning', answer: x.id, prompt: { text: textFwd, ar: x.ar }, options: optionsFor(meaningOpt(x), items.map(meaningOpt)) }
    : { id: `r-${x.id}`, kind: 'arabic', answer: x.id, prompt: { text: textRev(pick(x.m, lang)) }, options: optionsFor(arOpt(x), items.map(arOpt)) }))
}
function sentenceText(ex) { return ex.parts.map(p => p[0]).join(' ') }
function roleQ(ex, role, lang, idx) {
  const g = gx(lang)
  const groups = ex.parts.map(([w, r], i) => ({ key: `${i}-${r}`, label: w, ar: true, role: r }))
  const correct = groups.find(o => o.role === role)
  return { id: `role-${ex.ref}-${role}-${idx}`, kind: 'role', answer: correct.key, prompt: { text: g.qRole(g.roles[role]), ar: sentenceText(ex), ref: ex.ref }, options: shuffleArr(groups.map(({ role: _r, ...o }) => o)) }
}
function typeQs(lang, n) {
  const g = gx(lang)
  const all = [...NOMINAL_EXAMPLES.map(e => [e, 'nominal']), ...VERBAL_EXAMPLES.map(e => [e, 'verbal'])]
  return shuffleArr(all).slice(0, n).map(([ex, type]) => ({
    id: `type-${ex.ref}`, kind: 'type', answer: type, prompt: { text: g.qType, ar: sentenceText(ex), ref: ex.ref },
    options: [{ key: 'nominal', label: g.nominal, ar: false }, { key: 'verbal', label: g.verbal, ar: false }],
  }))
}
const GRAMMAR_QUIZ = {
  pronouns: (lang) => wordQuiz([...PRONOUNS_DETACHED, ...PRONOUNS_ATTACHED], lang, 8, gx(lang).qPronoun, gx(lang).qPronounRev),
  demonstratives: (lang) => {
    const g = gx(lang)
    const phrase = [
      { id: 'p-def', ar: 'هَٰذَا ٱلْكِتَابُ', answer: 'phrase' },
      { id: 'p-indef', ar: 'هَٰذَا كِتَابٌ', answer: 'sentence' },
    ].map(p => ({ id: p.id, kind: 'phrase', answer: p.answer, prompt: { text: g.qPhrase, ar: p.ar },
      options: [{ key: 'phrase', label: g.thisBook, ar: false }, { key: 'sentence', label: g.thisIsBook, ar: false }] }))
    return shuffleArr([...wordQuiz(DEMONSTRATIVES, lang, 6, g.qDemo, null), ...phrase])
  },
  nominal: (lang) => shuffleArr([...NOMINAL_EXAMPLES.map((ex, i) => roleQ(ex, i % 2 ? 'm' : 'k', lang, i)), ...typeQs(lang, 3)]),
  verbal: (lang) => shuffleArr([...VERBAL_EXAMPLES.map((ex, i) => roleQ(ex, ex.parts.some(p => p[1] === 'f') ? (i % 2 && ex.parts.some(p => p[1] === 'o') ? 'o' : 'f') : 'o', lang, i)), ...typeQs(lang, 3)]),
  vocab: (lang) => {
    const items = QURAN_WORDS.map(w => ({ id: `v${w.r}`, ar: w.ar, m: w.m }))
    return wordQuiz(items, lang, 10, gx(lang).qWord, null)
  },
}
const makeQuiz = (id, lang) => (GRAMMAR_QUIZ[id] ? GRAMMAR_QUIZ[id](lang) : buildQuiz(id, lang))

const LESSON_VIEW = {
  letters: LetterLesson, harakat: HarakatLesson, reading: ReadingLesson, tajweed: TajweedLesson,
  pronouns: PronounsLesson, demonstratives: DemonstrativesLesson, nominal: NominalLesson, verbal: VerbalLesson, vocab: VocabLesson,
}

const LESSON_ICON = { letters: 'type', harakat: 'sparkle', reading: 'quran', tajweed: 'volume', pronouns: 'names', demonstratives: 'arrow', nominal: 'list', verbal: 'learn', vocab: 'glossary' }

export default function ArabicCoursePage({ setPage }) {
  const { lang } = useLang()
  const t = ui(lang)
  const location = useLocation()
  const navigate = useNavigate()
  const audio = useCourseAudio()
  const lessonRef = useRef(null)

  const hashId = decodeURIComponent(location.hash.replace(/^#/, ''))
  const active = LESSONS.some(l => l.id === hashId) ? hashId : null
  const activeIdx = LESSONS.findIndex(l => l.id === active)
  const lesson = activeIdx >= 0 ? LESSONS[activeIdx] : null

  const [progress, setProgress] = useState(readProgress)
  const [mode, setMode] = useState('learn')
  const [quiz, setQuiz] = useState(null)
  const [quizRun, setQuizRun] = useState(0)

  const save = useCallback((fn) => setProgress(p => { const np = fn(p); writeProgress(np); return np }), [])

  // Dərs dəyişdi: "Öyrən" rejimi, səs dayanır, son dərs yadda qalır, dərs görünən yerə gəlir
  const stopAudio = audio.stop
  useEffect(() => {
    setMode('learn')
    setQuiz(null)
    stopAudio()
    if (!active) return
    save(p => (p.last === active ? p : { ...p, last: active }))
    requestAnimationFrame(() => {
      const el = lessonRef.current
      if (!el) return
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    })
  }, [active, save, stopAudio])

  // Dil dəyişəndə açıq yoxlamanın variantları yeni dildə qurulsun
  useEffect(() => {
    if (mode === 'quiz' && active) { setQuiz(makeQuiz(active, lang)); setQuizRun(r => r + 1) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const openLesson = (id) => {
    // Eyni dərs artıq açıqdırsa hash dəyişmir — sadəcə dərsə sürüşdür
    if (id === active) lessonRef.current?.scrollIntoView({ block: 'start' })
    else navigate({ hash: `#${id}` })
  }
  const closeLesson = () => navigate({ hash: '' })
  const onLessonLink = (id) => (e) => { if (!isPlainClick(e)) return; e.preventDefault(); openLesson(id) }

  const startQuiz = () => {
    audio.stop()
    setQuiz(makeQuiz(active, lang))
    setQuizRun(r => r + 1)
    setMode('quiz')
  }
  const showLearn = () => { audio.stop(); setMode('learn') }
  const onFinish = (percent) => save(p => withResult(p, active, percent))

  const done = passedCount(progress)
  const pct = percentDone(progress)
  const started = Object.keys(progress.best).length > 0 || !!progress.last
  const allDone = done === LESSONS.length
  const resumeId = resumeLesson(progress)
  const ctaLabel = allDone ? t.review : started ? t.resume : t.start
  const View = lesson ? LESSON_VIEW[lesson.id] : null
  const ax = AX[lang] || AX.en
  const coverage = Math.round((QURAN_WORDS_TOP_SUM / QURAN_WORDS_TOTAL) * 100)

  return (
    <div className="ac-root">
      {/* ── Hero (v3: kompakt split — solda izah və əsas düymə, sağda irəliləyiş halqası) ── */}
      <header className="ui-page-hero ui-page-hero--split ac-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{t.eyebrow}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {ax.how(t.learn, t.quiz, PASS_PERCENT)}</p>
            <ul className="ui-page-hero__stats">
              <li><b data-count={LESSONS.length}>{LESSONS.length}</b><span>{ax.lessons}</span></li>
              <li><b data-count="28">28</b><span>{ax.letters}</span></li>
              <li><b data-count={QURAN_WORDS.length}>{QURAN_WORDS.length}</b><span>{ax.words}</span></li>
              <li><b data-count={coverage}>≈{coverage}%</b><span>{ax.coverage}</span></li>
            </ul>
            <div className="ui-page-hero__actions ac-hero__actions">
              <a className="ui-btn ui-btn--primary ac-cta" href={`#${resumeId}`} onClick={onLessonLink(resumeId)}>
                <Icon name={started ? 'play' : 'arrow'} className={`ui-btn__icon ${started ? '' : 'ui-flip-rtl'}`} />
                {ctaLabel}
                {started && !allDone && <span className="ac-cta__sub">· {pick(LESSONS.find(l => l.id === resumeId).title, lang)}</span>}
              </a>
            </div>
          </div>
          <div className="ui-page-hero__aside">
            <div className="ui-card ac-progress" role="group" aria-label={t.progress}>
              <div className="ac-progress__ring">
                <ProgressRing value={pct} max={100} size={88} thickness={8} showPercent={false} />
                <span className="ac-progress__num ui-num">{pct}%</span>
              </div>
              <div className="ac-progress__text">
                <span className="ac-progress__label">{t.progress}</span>
                <span className="ac-progress__sub">{t.lessonsDone(done, LESSONS.length)}</span>
                {/* Mərhələ nöqtələri: hər dərs bir nöqtə */}
                <ol className="ac-progress__dots" aria-hidden="true">
                  {LESSONS.map(l => <li key={l.id} className={isPassed(progress, l.id) ? 'is-done' : progress.best[l.id] != null ? 'is-tried' : ''} />)}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Açıq dərs ── */}
      {lesson && (
        <section ref={lessonRef} className="ui-section ac-lesson" aria-labelledby="ac-lesson-title" id={`lesson-${lesson.id}`}>
          <div className="ui-container">
            <div className="ac-lesson__head">
              <div className="ac-lesson__titles">
                <span className="ui-eyebrow">{t.lesson(activeIdx + 1)}</span>
                <h2 id="ac-lesson-title" className="ui-title">{pick(lesson.title, lang)}</h2>
                <p className="ac-muted">{pick(lesson.desc, lang)}</p>
              </div>
              <div className="ac-lesson__tools">
                <div className="ac-seg" role="group" aria-label={pick(lesson.title, lang)}>
                  <button type="button" className="ac-seg__btn" aria-pressed={mode === 'learn'} onClick={showLearn}>
                    <Icon name="quran" size={18} /> {t.learn}
                  </button>
                  <button type="button" className="ac-seg__btn" aria-pressed={mode === 'quiz'} onClick={startQuiz}>
                    <Icon name="quiz" size={18} /> {t.quiz}
                    {isPassed(progress, lesson.id) && <Icon name="check" size={16} strokeWidth={2.4} className="ac-seg__ok" />}
                  </button>
                </div>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={closeLesson}>
                  <Icon name="arrow" className="ui-btn__icon ac-back" /> {t.toLessons}
                </button>
              </div>
            </div>

            <div className="ac-lesson__body" key={`${lesson.id}-${mode}`}>
              {mode === 'quiz' && quiz ? (
                <Quiz key={quizRun} lang={lang} questions={quiz} audio={audio} onFinish={onFinish}
                  onRetry={startQuiz} onBack={showLearn}
                  hasNext={activeIdx < LESSONS.length - 1}
                  onNextLesson={() => openLesson(LESSONS[activeIdx + 1].id)} />
              ) : (
                <Suspense fallback={<div className="ui-skeleton ui-skeleton--card ac-skeleton" aria-hidden="true" />}>
                  <View lang={lang} audio={audio} />
                  <div className="ac-lesson__end">
                    <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" onClick={startQuiz}>
                      <Icon name="quiz" className="ui-btn__icon" /> {t.startQuiz}
                    </button>
                    <div className="ac-lesson__pager">
                      {activeIdx > 0 && (
                        <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`#${LESSONS[activeIdx - 1].id}`} onClick={onLessonLink(LESSONS[activeIdx - 1].id)}>
                          <Icon name="arrow" className="ui-btn__icon ac-back" /> {t.prevLesson}
                        </a>
                      )}
                      {activeIdx < LESSONS.length - 1 && (
                        <a className="ui-btn ui-btn--secondary ui-btn--sm" href={`#${LESSONS[activeIdx + 1].id}`} onClick={onLessonLink(LESSONS[activeIdx + 1].id)}>
                          {t.nextLesson} <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
                        </a>
                      )}
                    </div>
                  </div>
                </Suspense>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Dərs kartları ── */}
      <section className={`ui-section ${lesson ? 'ui-section--alt' : ''} ac-lessons`} aria-labelledby="ac-lessons-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <h2 id="ac-lessons-h" className="ui-title">{t.lessonsHead}</h2>
            <p className="ui-lead">{t.lessonsLead}</p>
          </div>
          {!lesson && (
            <div className="ac-path" data-reveal>
              <span className="ui-eyebrow">{ax.pathEyebrow}</span>
              <h3 className="ui-title ui-title--sm">{ax.pathTitle}</h3>
              <p className="ac-muted ac-path__lead">{ax.pathLead}</p>
              <ol className="ui-steps ui-steps--row ac-path__steps">
                {STAGES.map(([from, to], i) => {
                  const ids = LESSONS.slice(from, to + 1).map(l => l.id)
                  const stageDone = ids.every(id => isPassed(progress, id))
                  return (
                    <li key={i} className={`ui-step${stageDone ? ' is-done' : ''}`}>
                      <span className="ui-step__n" aria-hidden="true">{stageDone ? <Icon name="check" size={14} strokeWidth={2.6} /> : i + 1}</span>
                      <div className="ui-step__body">
                        <span className="ac-path__range ui-num">{ax.range(from + 1, to + 1)}</span>
                        <h4 className="ui-step__title">{ax.stages[i][0]}</h4>
                        <p className="ui-step__text">{ax.stages[i][1]}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
          <ol className="ac-lesson-grid" data-reveal="stagger">
            {LESSONS.map((l, i) => {
              const best = progress.best[l.id]
              const passed = isPassed(progress, l.id)
              return (
                <li key={l.id}>
                  <a href={`#${l.id}`} onClick={onLessonLink(l.id)} aria-current={active === l.id ? 'true' : undefined}
                    className={`ui-card ui-card--interactive ac-lesson-card ${passed ? 'is-done' : ''} ${active === l.id ? 'is-active' : ''}`}>
                    <div className="ac-lesson-card__top">
                      <span className="ac-lesson-card__n ui-num" aria-hidden="true">{i + 1}</span>
                      <span className="ui-icon-tile ui-icon-tile--sm"><Icon name={LESSON_ICON[l.id]} /></span>
                      <span className={`ui-badge ${passed ? 'ui-badge--brand' : ''} ac-lesson-card__badge`}>
                        {passed && <Icon name="check" size={12} strokeWidth={2.6} />}
                        {passed ? t.done : best != null ? t.best(best) : t.notStarted}
                      </span>
                    </div>
                    <p className="ac-lesson-card__glyph ui-arabic" lang="ar" aria-hidden="true">{l.glyph}</p>
                    <h3 className="ui-card__title">{pick(l.title, lang)}</h3>
                    <p className="ui-card__text">{pick(l.desc, lang)}</p>
                    <div className="ac-lesson-card__meter" aria-hidden="true"><span style={{ '--p': (best ?? 0) / 100 }} /></div>
                    <span className="ui-link ac-lesson-card__link">
                      {t.open} <Icon name="arrow" size={16} className="ui-link__arrow ui-flip-rtl" />
                    </span>
                  </a>
                </li>
              )
            })}
          </ol>
          <p className="ac-credits">
            {t.credits}{' '}
            <PageLink to="licenses" setPage={setPage} className="ui-link">{t.licenses}</PageLink>
          </p>
        </div>
      </section>
    </div>
  )
}
