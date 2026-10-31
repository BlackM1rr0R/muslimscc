import { NAMES_99 } from '../data/names99'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { T } from '../data/i18n'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import { isPlainClick } from '../components/PageLink'
import { parsePath, pathFor } from '../seo/routes'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { VIRTUE, IHSA, NAME_RULES, ATTR_RULES } from '../data/namesGuide'
import '../styles/NamesPage.css'

// ── Yeni bölmələr: fəzilət, "ihsa" (əzbərlə · anla · ibadət et), əzbərləmə
// (kartlar + yoxlama, localStorage), adlar və sifətlər haqqında qaydalar
// (İbn Useymin, «əl-Qavaid əl-Musla») — məzmun: src/data/namesGuide.js ──
const GUIDE = {
  az: {
    jump: 'Bölmələr', jList: 'Siyahı', jPractice: 'Əzbərlə', jRules: 'Qaydalar',
    virtueTitle: 'Adları öyrənməyin fəziləti', ihsaTitle: 'Adları necə «ihsa» etməli?',
    ihsaLead: 'İbn Useymin: «Onları ihsa etmək — ləfzən əzbərləmək, mənasını anlamaq, kamili isə onların tələbinə uyğun Allaha ibadət etməkdir» («əl-Qavaid əl-Musla»).',
    practiceTitle: 'Əzbərləmə məşqi', practiceLead: 'Kartlarla təkrar et, sonra özünü yoxla. İrəliləyişin bu cihazda saxlanılır.',
    cards: 'Kartlar', quiz: 'Yoxlama', known: (k) => `${k} / 99 ad əzbərlənib`,
    flip: 'Çevir', flipHint: 'Mənasını görmək üçün karta toxun', iKnow: 'Bilirəm', again: 'Təkrar et',
    prev: 'Əvvəlki', next: 'Növbəti', shuffle: 'Qarışdır', ordered: 'Sıra ilə', onlyNew: 'Yalnız öyrənilməyənlər',
    allLearned: 'Hamısını əzbərləmisən — maşaAllah! Bütün kartlara yenidən baxmaq üçün süzgəci söndür.',
    reset: 'İrəliləyişi sıfırla', resetConfirm: 'Əzbərlənmiş adların qeydi silinsin?',
    qMeaning: 'Bu adın mənası hansıdır?', qName: 'Bu məna hansı ada aiddir?', qArabic: 'Bu ad ərəbcə necə yazılır?',
    question: (i, n) => `Sual ${i} / ${n}`, correct: 'Düzdür!', wrong: 'Səhvdir. Düzgün cavab:', finish: 'Nəticəni gör', nextQ: 'Növbəti',
    result: (c, n) => `${c} / ${n} düz cavab`, best: (b) => `Ən yaxşı nəticə: ${b}%`, retry: 'Yenidən başla', start: 'Yoxlamaya başla',
    quizLead: '10 sual: ərəbcə ad — məna və məna — ad. Hər cavabdan sonra düzgün variant göstərilir.',
    rulesTitle: 'Allahın adları və sifətləri haqqında qaydalar', rulesLead: 'Şeyx İbn Useyminin «əl-Qavaid əl-Musla» kitabının əsas qaydaları — qısa izah və kitabda gətirilən dəlillə.',
    nameRules: 'Adlar haqqında qaydalar', attrRules: 'Sifətlər haqqında qaydalar', rule: (n) => `Qayda ${n}`,
    proof: 'Dəlil', quran: 'Quran', sunnah: 'Sünnə', card: (i, n) => `Kart ${i} / ${n}`,
  },
  en: {
    jump: 'Sections', jList: 'List', jPractice: 'Memorise', jRules: 'Principles',
    virtueTitle: 'The virtue of learning the names', ihsaTitle: 'How to “enumerate” (ihsa’) the names',
    ihsaLead: 'Ibn Uthaymin: “Enumerating them means memorising their words and understanding their meaning, and its completion is worshipping Allah according to what they require” (al-Qawa‘id al-Muthla).',
    practiceTitle: 'Memorisation practice', practiceLead: 'Review with flashcards, then test yourself. Your progress is saved on this device.',
    cards: 'Flashcards', quiz: 'Quiz', known: (k) => `${k} of 99 names memorised`,
    flip: 'Flip', flipHint: 'Tap the card to see the meaning', iKnow: 'I know it', again: 'Review again',
    prev: 'Previous', next: 'Next', shuffle: 'Shuffle', ordered: 'In order', onlyNew: 'Only names not yet learned',
    allLearned: 'You have memorised them all — masha’Allah! Turn off the filter to review every card.',
    reset: 'Reset progress', resetConfirm: 'Clear the record of memorised names?',
    qMeaning: 'What does this name mean?', qName: 'Which name has this meaning?', qArabic: 'How is this name written in Arabic?',
    question: (i, n) => `Question ${i} of ${n}`, correct: 'Correct!', wrong: 'Not quite. The right answer:', finish: 'See the result', nextQ: 'Next',
    result: (c, n) => `${c} of ${n} correct`, best: (b) => `Best result: ${b}%`, retry: 'Start again', start: 'Start the quiz',
    quizLead: '10 questions: Arabic name → meaning and meaning → name. The right option is shown after each answer.',
    rulesTitle: 'Principles concerning Allah’s names and attributes', rulesLead: 'The main principles of Shaykh Ibn Uthaymin’s “al-Qawa‘id al-Muthla” — briefly explained, with the evidence he cites.',
    nameRules: 'Principles on the names', attrRules: 'Principles on the attributes', rule: (n) => `Principle ${n}`,
    proof: 'Evidence', quran: 'Quran', sunnah: 'Sunnah', card: (i, n) => `Card ${i} of ${n}`,
  },
  ru: {
    jump: 'Разделы', jList: 'Список', jPractice: 'Заучивание', jRules: 'Правила',
    virtueTitle: 'Достоинство изучения имён', ihsaTitle: 'Как «перечесть» (ихса) имена',
    ihsaLead: 'Ибн Усеймин: «Перечесть их — значит выучить их слова и понять смысл, а завершение этого — поклоняться Аллаху согласно тому, чего они требуют» («аль-Кава‘ид аль-Мусля»).',
    practiceTitle: 'Тренировка заучивания', practiceLead: 'Повторяй с карточками, затем проверь себя. Прогресс сохраняется на этом устройстве.',
    cards: 'Карточки', quiz: 'Проверка', known: (k) => `Выучено ${k} из 99 имён`,
    flip: 'Перевернуть', flipHint: 'Нажми на карточку, чтобы увидеть смысл', iKnow: 'Знаю', again: 'Повторить',
    prev: 'Назад', next: 'Далее', shuffle: 'Перемешать', ordered: 'По порядку', onlyNew: 'Только невыученные',
    allLearned: 'Ты выучил все имена — ма ша Аллах! Отключи фильтр, чтобы повторить все карточки.',
    reset: 'Сбросить прогресс', resetConfirm: 'Удалить отметки о выученных именах?',
    qMeaning: 'Каков смысл этого имени?', qName: 'Какому имени принадлежит этот смысл?', qArabic: 'Как это имя пишется по-арабски?',
    question: (i, n) => `Вопрос ${i} из ${n}`, correct: 'Верно!', wrong: 'Неверно. Правильный ответ:', finish: 'Посмотреть результат', nextQ: 'Далее',
    result: (c, n) => `${c} из ${n} верно`, best: (b) => `Лучший результат: ${b}%`, retry: 'Начать заново', start: 'Начать проверку',
    quizLead: '10 вопросов: арабское имя → смысл и смысл → имя. После каждого ответа показан верный вариант.',
    rulesTitle: 'Правила об именах и атрибутах Аллаха', rulesLead: 'Основные правила книги шейха Ибн Усеймина «аль-Кава‘ид аль-Мусля» — кратко и с доводами, которые он приводит.',
    nameRules: 'Правила об именах', attrRules: 'Правила об атрибутах', rule: (n) => `Правило ${n}`,
    proof: 'Довод', quran: 'Коран', sunnah: 'Сунна', card: (i, n) => `Карточка ${i} из ${n}`,
  },
  ar: {
    jump: 'الأقسام', jList: 'القائمة', jPractice: 'الحفظ', jRules: 'القواعد',
    virtueTitle: 'فضل تعلّم الأسماء الحسنى', ihsaTitle: 'كيف تُحصى الأسماء؟',
    ihsaLead: 'قال ابن عثيمين: «إحصاؤها: حفظها لفظًا، وفهمها معنًى، وتمامه: أن يتعبد لله تعالى بمقتضاها» (القواعد المثلى).',
    practiceTitle: 'تمرين الحفظ', practiceLead: 'راجع بالبطاقات ثم اختبر نفسك. يُحفظ تقدّمك على هذا الجهاز.',
    cards: 'البطاقات', quiz: 'الاختبار', known: (k) => `حفظتَ ${k} من ٩٩ اسمًا`,
    flip: 'اقلب', flipHint: 'المس البطاقة لرؤية الدليل', iKnow: 'أحفظه', again: 'أعده لاحقًا',
    prev: 'السابق', next: 'التالي', shuffle: 'خلط', ordered: 'بالترتيب', onlyNew: 'غير المحفوظة فقط',
    allLearned: 'حفظتَها كلها — ما شاء الله! ألغِ التصفية لمراجعة جميع البطاقات.',
    reset: 'إعادة ضبط التقدّم', resetConfirm: 'هل تريد حذف سجل الأسماء المحفوظة؟',
    qMeaning: 'ما معنى هذا الاسم؟', qName: 'أي اسم له هذا المعنى؟', qArabic: 'كيف يُكتب هذا الاسم بالعربية؟',
    question: (i, n) => `السؤال ${i} من ${n}`, correct: 'صحيح!', wrong: 'خطأ. الجواب الصحيح:', finish: 'عرض النتيجة', nextQ: 'التالي',
    result: (c, n) => `${c} من ${n} إجابات صحيحة`, best: (b) => `أفضل نتيجة: ${b}%`, retry: 'ابدأ من جديد', start: 'ابدأ الاختبار',
    quizLead: 'عشرة أسئلة: اختر الرسم العربي الصحيح للاسم المكتوب بالحروف اللاتينية. يظهر الجواب الصحيح بعد كل إجابة.',
    rulesTitle: 'قواعد في أسماء الله وصفاته', rulesLead: 'أهم قواعد كتاب «القواعد المثلى» للشيخ ابن عثيمين — باختصار مع الدليل الذي ذكره.',
    nameRules: 'قواعد في الأسماء', attrRules: 'قواعد في الصفات', rule: (n) => `القاعدة ${n}`,
    proof: 'الدليل', quran: 'القرآن', sunnah: 'السنة', card: (i, n) => `البطاقة ${i} من ${n}`,
  },
  tr: {
    jump: 'Bölümler', jList: 'Liste', jPractice: 'Ezberle', jRules: 'Kaideler',
    virtueTitle: 'İsimleri öğrenmenin fazileti', ihsaTitle: 'İsimler nasıl “ihsâ” edilir?',
    ihsaLead: 'İbn Useymin: “Onları ihsâ etmek, lafızlarını ezberlemek ve anlamlarını kavramaktır; tamamı ise onların gerektirdiğine göre Allah’a ibadet etmektir” (el-Kavâidü’l-Müslâ).',
    practiceTitle: 'Ezber çalışması', practiceLead: 'Kartlarla tekrar et, sonra kendini sına. İlerlemen bu cihazda saklanır.',
    cards: 'Kartlar', quiz: 'Test', known: (k) => `99 isimden ${k} tanesi ezberlendi`,
    flip: 'Çevir', flipHint: 'Anlamını görmek için karta dokun', iKnow: 'Biliyorum', again: 'Tekrar et',
    prev: 'Önceki', next: 'Sonraki', shuffle: 'Karıştır', ordered: 'Sırayla', onlyNew: 'Yalnızca öğrenilmeyenler',
    allLearned: 'Hepsini ezberledin — maşallah! Tüm kartları tekrar görmek için filtreyi kapat.',
    reset: 'İlerlemeyi sıfırla', resetConfirm: 'Ezberlenen isimlerin kaydı silinsin mi?',
    qMeaning: 'Bu ismin anlamı nedir?', qName: 'Bu anlam hangi isme aittir?', qArabic: 'Bu isim Arapça nasıl yazılır?',
    question: (i, n) => `Soru ${i} / ${n}`, correct: 'Doğru!', wrong: 'Yanlış. Doğru cevap:', finish: 'Sonucu gör', nextQ: 'Sonraki',
    result: (c, n) => `${c} / ${n} doğru`, best: (b) => `En iyi sonuç: %${b}`, retry: 'Yeniden başla', start: 'Teste başla',
    quizLead: '10 soru: Arapça isim → anlam ve anlam → isim. Her cevaptan sonra doğru seçenek gösterilir.',
    rulesTitle: 'Allah’ın isim ve sıfatlarına dair kaideler', rulesLead: 'Şeyh İbn Useymin’in “el-Kavâidü’l-Müslâ” kitabının temel kaideleri — kısa açıklama ve kitapta getirilen delille.',
    nameRules: 'İsimlere dair kaideler', attrRules: 'Sıfatlara dair kaideler', rule: (n) => `Kaide ${n}`,
    proof: 'Delil', quran: 'Kur’an', sunnah: 'Sünnet', card: (i, n) => `Kart ${i} / ${n}`,
  },
}

// Sünnə dəlilinin mənbə adları (names99.js → proof.s latın yazılışındadır)
const BOOKS = {
  Bukhari: { en: 'Bukhari', az: 'Buxari', ru: 'Бухари', ar: 'البخاري', tr: 'Buhârî' },
  Muslim: { en: 'Muslim', az: 'Müslim', ru: 'Муслим', ar: 'مسلم', tr: 'Müslim' },
  'Abu Dawud': { en: 'Abu Dawud', az: 'Əbu Davud', ru: 'Абу Дауд', ar: 'أبو داود', tr: 'Ebû Dâvûd' },
  Tirmidhi: { en: 'Tirmidhi', az: 'Tirmizi', ru: 'Тирмизи', ar: 'الترمذي', tr: 'Tirmizî' },
  Nasai: { en: 'Nasa’i', az: 'Nəsai', ru: 'Насаи', ar: 'النسائي', tr: 'Nesâî' },
  Tabarani: { en: 'at-Tabarani', az: 'Təbərani', ru: 'Табарани', ar: 'الطبراني', tr: 'Taberânî' },
  Bayhaqi: { en: 'al-Bayhaqi', az: 'Beyhəqi', ru: 'Байхаки', ar: 'البيهقي', tr: 'Beyhakî' },
  'al-Mujam al-Awsat': { en: 'al-Mu‘jam al-Awsat', az: 'əl-Mucəm əl-Əvsat', ru: 'аль-Му‘джам аль-Аусат', ar: 'المعجم الأوسط', tr: 'el-Mu‘cemü’l-Evsat' },
  'Shuab al-Iman': { en: 'Shu‘ab al-Iman', az: 'Şuabul-İman', ru: 'Шу‘аб аль-иман', ar: 'شعب الإيمان', tr: 'Şuabü’l-Îmân' },
}
const AR_DIGITS = (s) => String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
function proofText(name, lang) {
  const g = GUIDE[lang] || GUIDE.en
  if (name.proof?.q) return `${g.quran} ${name.proof.q}`
  let s = name.proof?.s || ''
  if (lang !== 'en') {
    for (const [k, v] of Object.entries(BOOKS)) s = s.split(k).join(v[lang] || k)
    if (lang === 'ar') s = AR_DIGITS(s).replace(/;/g, '؛').replace(/,/g, '،')
  }
  return `${g.sunnah}: ${s}`
}

// ── Əzbərləmə məşqinin yaddaşı (localStorage, try/catch) ──
const PRACTICE_KEY = 'names99_practice_v1'
function readPractice() {
  try {
    const v = JSON.parse(localStorage.getItem(PRACTICE_KEY))
    const known = Array.isArray(v?.known) ? v.known.filter(n => Number.isInteger(n) && n >= 1 && n <= 99) : []
    const best = Number.isFinite(v?.best) ? Math.max(0, Math.min(100, Math.round(v.best))) : null
    return { known: [...new Set(known)], best }
  } catch { return { known: [], best: null } }
}
function writePractice(p) {
  try { localStorage.setItem(PRACTICE_KEY, JSON.stringify(p)) } catch { /* yaddaş bağlıdır */ }
}
function shuffleArr(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

const QUIZ_LEN = 10
/** Yoxlama sualları: ar — latın yazılışı → ərəbcə; digər dillər — ərəbcə → məna və məna → ərəbcə */
function buildNamesQuiz(lang) {
  const pool = NAMES_99.filter(n => lang === 'ar' || meaningOf(n, lang))
  return shuffleArr(pool).slice(0, QUIZ_LEN).map((n, i) => {
    const others = shuffleArr(pool.filter(x => x.n !== n.n && (lang === 'ar' || meaningOf(x, lang) !== meaningOf(n, lang)))).slice(0, 3)
    const opts = shuffleArr([n, ...others])
    if (lang === 'ar') return { id: `a${n.n}`, kind: 'arabic', prompt: n.tr, promptLtr: true, answer: n.n, options: opts.map(x => ({ key: x.n, label: x.ar, ar: true })) }
    if (i % 2 === 0) return { id: `m${n.n}`, kind: 'meaning', prompt: n.ar, promptAr: true, sub: n.tr, answer: n.n, options: opts.map(x => ({ key: x.n, label: meaningOf(x, lang) })) }
    return { id: `n${n.n}`, kind: 'name', prompt: meaningOf(n, lang), answer: n.n, options: opts.map(x => ({ key: x.n, label: x.ar, ar: true, sub: x.tr })) }
  })
}

function NamesPractice({ lang }) {
  const g = GUIDE[lang] || GUIDE.en
  const [mode, setMode] = useState('cards')
  const [store, setStore] = useState(readPractice)
  const save = useCallback((fn) => setStore(p => { const np = fn(p); writePractice(np); return np }), [])
  const knownSet = useMemo(() => new Set(store.known), [store.known])

  // ── Kartlar ──
  const [order, setOrder] = useState(() => NAMES_99.map(n => n.n))
  const [onlyNew, setOnlyNew] = useState(false)
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  // "Yalnız öyrənilməyənlər" süzgəci: sessiya ərzində bilinən kimi işarələnən kart dərhal çıxmasın deyə
  // dəstə süzgəc açılanda bir dəfə qurulur
  const [deckSeed, setDeckSeed] = useState(0)
  const deck = useMemo(() => (onlyNew ? order.filter(n => !knownSet.has(n)) : order),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [order, onlyNew, deckSeed])
  const idx = deck.length ? Math.min(pos, deck.length - 1) : 0
  const cur = deck.length ? NAMES_99[deck[idx] - 1] : null

  const go = (d) => { setFlipped(false); setPos(p => (deck.length ? (Math.min(p, deck.length - 1) + d + deck.length) % deck.length : 0)) }
  const mark = (yes) => {
    if (!cur) return
    save(p => {
      const s = new Set(p.known)
      if (yes) s.add(cur.n); else s.delete(cur.n)
      return { ...p, known: [...s].sort((a, b) => a - b) }
    })
    go(1)
  }
  const onCardKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f) }
  }
  const resetAll = () => {
    if (typeof window !== 'undefined' && !window.confirm(g.resetConfirm)) return
    save(p => ({ ...p, known: [] }))
    setDeckSeed(s => s + 1)
  }

  // ── Yoxlama ──
  const [quiz, setQuiz] = useState(null)
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const nextRef = useRef(null)
  const startQuiz = () => { setQuiz(buildNamesQuiz(lang)); setQi(0); setPicked(null); setScore(0); setDone(false) }
  // Dil dəyişəndə açıq yoxlama yeni dildə qurulsun
  useEffect(() => { setQuiz(q => (q ? buildNamesQuiz(lang) : q)); setQi(0); setPicked(null); setScore(0); setDone(false) }, [lang])
  useEffect(() => { if (picked != null) nextRef.current?.focus() }, [picked])
  const q = quiz?.[qi]
  const choose = (key) => { if (picked != null) return; setPicked(key); if (key === q.answer) setScore(s => s + 1) }
  const nextQ = () => {
    if (qi + 1 >= quiz.length) {
      const pct = Math.round((score / quiz.length) * 100)
      setDone(true)
      save(p => ({ ...p, best: Math.max(p.best ?? 0, pct) }))
      return
    }
    setQi(qi + 1); setPicked(null)
  }

  const knownPct = Math.round((store.known.length / 99) * 100)

  return (
    <div className="np-practice">
      <div className="np-practice__top">
        <div className="np-seg" role="group" aria-label={g.practiceTitle}>
          <button type="button" className="ui-chip" aria-pressed={mode === 'cards'} onClick={() => setMode('cards')}>
            <Icon name="names" size={16} /> {g.cards}
          </button>
          <button type="button" className="ui-chip" aria-pressed={mode === 'quiz'} onClick={() => setMode('quiz')}>
            <Icon name="quiz" size={16} /> {g.quiz}
          </button>
        </div>
        <div className="np-meter">
          <span className="np-meter__label">{g.known(store.known.length)}</span>
          <div className="np-meter__bar" role="progressbar" aria-valuemin={0} aria-valuemax={99} aria-valuenow={store.known.length} aria-label={g.known(store.known.length)}>
            <span style={{ '--p': knownPct / 100 }} />
          </div>
          {store.best != null && <span className="np-meter__best">{g.best(store.best)}</span>}
        </div>
      </div>

      {mode === 'cards' && (
        <div className="np-cards">
          <div className="np-cards__tools">
            <label className="np-check">
              <input type="checkbox" checked={onlyNew} onChange={e => { setOnlyNew(e.target.checked); setPos(0); setFlipped(false); setDeckSeed(s => s + 1) }} />
              <span>{g.onlyNew}</span>
            </label>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setOrder(shuffleArr(NAMES_99.map(n => n.n))); setPos(0); setFlipped(false) }}>
              <Icon name="refresh" className="ui-btn__icon" /> {g.shuffle}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setOrder(NAMES_99.map(n => n.n)); setPos(0); setFlipped(false) }}>
              <Icon name="list" className="ui-btn__icon" /> {g.ordered}
            </button>
          </div>

          {cur ? (
            <>
              <button type="button" className={`ui-card np-flash${flipped ? ' is-flipped' : ''}${knownSet.has(cur.n) ? ' is-known' : ''}`}
                onClick={() => setFlipped(f => !f)} onKeyDown={onCardKey} aria-pressed={flipped}
                aria-label={`${g.card(idx + 1, deck.length)} — ${g.flip}`}>
                <span className="np-flash__count ui-num" dir="ltr">{idx + 1} / {deck.length}</span>
                {knownSet.has(cur.n) && <Icon name="check" size={18} strokeWidth={2.4} className="np-flash__known" />}
                <span className="np-flash__ar ui-arabic" lang="ar" dir="rtl">{cur.ar}</span>
                {flipped ? (
                  <span className="np-flash__back" key="b">
                    <span className="np-flash__tl" dir="ltr">{cur.tr}</span>
                    {meaningOf(cur, lang) && <span className="np-flash__meaning">{meaningOf(cur, lang)}</span>}
                    <span className="np-flash__proof">{g.proof}: {proofText(cur, lang)}</span>
                  </span>
                ) : (
                  <span className="np-flash__hint" key="f">{g.flipHint}</span>
                )}
              </button>
              <div className="np-cards__nav">
                <button type="button" className="ui-icon-btn" onClick={() => go(-1)} aria-label={g.prev}><Icon name="chevronLeft" className="ui-flip-rtl" /></button>
                <button type="button" className="ui-btn ui-btn--secondary" onClick={() => mark(false)}>
                  <Icon name="refresh" className="ui-btn__icon" /> {g.again}
                </button>
                <button type="button" className="ui-btn ui-btn--primary" onClick={() => mark(true)}>
                  <Icon name="check" className="ui-btn__icon" /> {g.iKnow}
                </button>
                <button type="button" className="ui-icon-btn" onClick={() => go(1)} aria-label={g.next}><Icon name="chevron" className="ui-flip-rtl" /></button>
              </div>
            </>
          ) : (
            <p className="ui-card ui-card--sunken np-empty">{g.allLearned}</p>
          )}
          {store.known.length > 0 && (
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm np-reset" onClick={resetAll}>{g.reset}</button>
          )}
        </div>
      )}

      {mode === 'quiz' && (
        <div className="ui-card np-quiz">
          {!quiz ? (
            <div className="np-quiz__intro">
              <p>{g.quizLead}</p>
              <button type="button" className="ui-btn ui-btn--primary" onClick={startQuiz}>
                <Icon name="quiz" className="ui-btn__icon" /> {g.start}
              </button>
            </div>
          ) : done ? (
            <div className="np-quiz__result" role="status">
              <p className="np-quiz__score ui-num">{Math.round((score / quiz.length) * 100)}%</p>
              <p>{g.result(score, quiz.length)}</p>
              {store.best != null && <p className="np-meter__best">{g.best(store.best)}</p>}
              <button type="button" className="ui-btn ui-btn--primary" onClick={startQuiz}>
                <Icon name="refresh" className="ui-btn__icon" /> {g.retry}
              </button>
            </div>
          ) : (
            <div className="np-quiz__q" key={q.id}>
              <div className="np-quiz__head">
                <span className="np-quiz__count ui-num">{g.question(qi + 1, quiz.length)}</span>
                <div className="np-meter__bar" aria-hidden="true"><span style={{ '--p': (qi + (picked != null ? 1 : 0)) / quiz.length }} /></div>
              </div>
              <p className="np-quiz__text" id={`np-q-${qi}`}>{q.kind === 'meaning' ? g.qMeaning : q.kind === 'name' ? g.qName : g.qArabic}</p>
              <p className={`np-quiz__prompt${q.promptAr ? ' ui-arabic' : ''}`} lang={q.promptAr ? 'ar' : undefined} dir={q.promptAr ? 'rtl' : q.promptLtr ? 'ltr' : undefined}>{q.prompt}</p>
              <ul className={`np-options${q.options.some(o => o.ar) ? ' np-options--ar' : ''}`} aria-labelledby={`np-q-${qi}`}>
                {q.options.map((o, k) => {
                  const st = picked == null ? '' : o.key === q.answer ? ' is-correct' : o.key === picked ? ' is-wrong' : ' is-dim'
                  return (
                    <li key={o.key}>
                      <button type="button" className={`np-option${st}`} onClick={() => choose(o.key)} aria-pressed={picked === o.key}
                        disabled={picked != null && o.key !== picked && o.key !== q.answer}>
                        <span className="np-option__n ui-num" aria-hidden="true">{k + 1}</span>
                        <span className={o.ar ? 'np-option__ar ui-arabic' : 'np-option__label'} lang={o.ar ? 'ar' : undefined} dir={o.ar ? 'rtl' : undefined}>{o.label}</span>
                        {picked != null && o.key === q.answer && <Icon name="check" size={18} strokeWidth={2.4} className="np-option__mark" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="np-quiz__feedback" role="status" aria-live="polite">
                {picked != null && (
                  <p className={`np-feedback ${picked === q.answer ? 'is-right' : 'is-wrong'}`}>
                    {picked === q.answer ? g.correct : <>{g.wrong} <strong dir="auto">{NAMES_99[q.answer - 1].tr}{lang !== 'ar' && meaningOf(NAMES_99[q.answer - 1], lang) ? ` — ${meaningOf(NAMES_99[q.answer - 1], lang)}` : ''}</strong></>}
                  </p>
                )}
              </div>
              <div className="np-quiz__actions">
                <button ref={nextRef} type="button" className="ui-btn ui-btn--primary" disabled={picked == null} onClick={nextQ}>
                  {qi + 1 >= quiz.length ? g.finish : g.nextQ} <Icon name="arrow" className="ui-btn__icon ui-btn__icon--end ui-flip-rtl" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RuleList({ rules, lang, g, idPrefix }) {
  return (
    <ol className="np-rules">
      {rules.map(r => (
        <li key={r.n}>
          <details className="ui-card np-rule" id={`${idPrefix}-${r.n}`}>
            <summary className="np-rule__sum">
              <span className="np-rule__n ui-num" aria-hidden="true">{r.n}</span>
              <span className="np-rule__titles">
                <span className="np-rule__eyebrow">{g.rule(r.n)}</span>
                <span className="np-rule__title">{r.title[lang] || r.title.en}</span>
              </span>
              <Icon name="chevron" size={18} className="np-rule__chev" />
            </summary>
            <div className="np-rule__body">
              <p>{r.text[lang] || r.text.en}</p>
              {r.ayah && (
                <figure className="np-ayah">
                  <p className="np-ayah__ar ui-arabic" lang="ar" dir="rtl">﴿{r.ayah.ar}﴾</p>
                  <figcaption className="np-ayah__ref">{g.proof}: {g.quran} <bdi className="ui-num">{r.ayah.ref}</bdi></figcaption>
                </figure>
              )}
            </div>
          </details>
        </li>
      ))}
    </ol>
  )
}

const NOT_FOUND = { az:'Ad tapılmadı', en:'Not found', ru:'Ничего не найдено', ar:'لم يتم العثور على شيء', tr:'Bulunamadı' }

// Ərəb axtarışı hərəkəsiz də işləsin: "رحمن" → "ٱلرَّحۡمَٰنُ"
const normAr = (s) => String(s || '').replace(/[ً-ٰٟۖ-ۭـ\s]/g, '').replace(/[ٱأإآ]/g, 'ا')
const HAS_ARABIC = /[؀-ۿ]/

// Kartdakı məna sətri. Ərəbcədə "məna" adın özüdür — göstərilmir.
// NAMES_99-da "tr" sahəsi transliterasiyadır; türkcə məna "tr_meaning"-dədir.
// Başqa dilə (ingiliscəyə) düşmür — hər dilin öz mətni var.
const meaningOf = (name, lang) => lang === 'ar' ? '' : lang === 'tr' ? (name.tr_meaning || '') : (name[lang] || '')

// Siyahının mənbəyi (bax: src/data/names99.js başlığı). Tirmizi 3507-dəki
// sadalama ravinin əlavəsidir; adlar 99-la məhdud deyil (Əhməd 3712).
const LIST_SOURCE = {
  az: 'Siyahı: Şeyx İbn Useymin, «əl-Qavaid əl-Musla» — Quran və səhih Sünnədən toplanmış 99 ad. Allahın adları 99-la məhdud deyil (Əhməd, 3712).',
  en: 'List: Shaykh Ibn Uthaymeen, “al-Qawaid al-Muthla” — 99 names gathered from the Quran and the authentic Sunnah. Allah’s names are not limited to 99 (Ahmad, 3712).',
  ru: 'Список: шейх Ибн Усеймин, «аль-Кава‘ид аль-Мусля» — 99 имён, собранных из Корана и достоверной Сунны. Имена Аллаха не ограничены числом 99 (Ахмад, 3712).',
  ar: 'القائمة: الشيخ ابن عثيمين، «القواعد المثلى» — تسعة وتسعون اسمًا جُمعت من الكتاب والسنة الصحيحة. وأسماء الله غير محصورة بعدد معين (أحمد، ٣٧١٢).',
  tr: 'Liste: Şeyh İbn Useymin, “el-Kavâidü’l-Müslâ” — Kur’an ve sahih Sünnet’ten derlenen 99 isim. Allah’ın isimleri 99 ile sınırlı değildir (Ahmed, 3712).',
}

// Kartın açılan pəncərəsinin kiçik mətnləri (5 dil)
const UI = {
  az: { open:'Ətraflı bax', close:'Bağla', prev:'Əvvəlki ad', next:'Növbəti ad', count:'ad', of:'/ 99' },
  en: { open:'View details', close:'Close', prev:'Previous name', next:'Next name', count:'names', of:'/ 99' },
  ru: { open:'Подробнее', close:'Закрыть', prev:'Предыдущее имя', next:'Следующее имя', count:'имён', of:'/ 99' },
  ar: { open:'عرض التفاصيل', close:'إغلاق', prev:'الاسم السابق', next:'الاسم التالي', count:'اسمًا', of:'/ 99' },
  tr: { open:'Ayrıntılı bak', close:'Kapat', prev:'Önceki isim', next:'Sonraki isim', count:'isim', of:'/ 99' },
}

export default function NamesPage({ setPage }) {
  const { lang } = useLang()
  const t = T[lang]?.names || T.az.names
  const ui = UI[lang] || UI.en
  const g = GUIDE[lang] || GUIDE.en
  const [search, setSearch] = useState('')
  const location = useLocation()
  const routerNavigate = useNavigate()
  // Açılmış ad (kartın "açılması" — mərkəzi pəncərə) ünvandan gəlir:
  // /names/2-ar-rahman — hər adın indekslənən öz səhifəsi var (src/seo/routes.js).
  // null — bağlı (/names). Geri düyməsi pəncərəni bağlayır (tarixçə girişi).
  const { key: routeKey, param } = parsePath(location.pathname)
  const openIdx = routeKey === 'names' && param ? param - 1 : null
  const lastFocus = useRef(null)
  const closeRef = useRef(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return NAMES_99
    if (HAS_ARABIC.test(q)) {
      const nq = normAr(q)
      return NAMES_99.filter(n => normAr(n.ar).includes(nq))
    }
    return NAMES_99.filter(n =>
      n.tr.toLowerCase().includes(q) ||
      (lang === 'tr' ? (n.tr_meaning || '') : (n[lang] || '')).toLowerCase().includes(q) ||
      (n.en || '').toLowerCase().includes(q) ||
      String(n.n) === q
    )
  }, [search, lang])

  const opened = openIdx != null ? NAMES_99[openIdx] : null

  // Siyahıdan açılış — yeni tarixçə girişi (Geri → siyahı)
  const openName = (n, el) => {
    lastFocus.current = el || null
    routerNavigate(pathFor('names', lang, n), { state: { namesList: true } })
  }
  // Kartın linki (<a href>): adi klik pəncərəni açır, Ctrl/orta klik — yeni tabda
  const onCardClick = (n) => (e) => {
    if (!isPlainClick(e)) return
    e.preventDefault()
    openName(n, e.currentTarget)
  }
  // Bağla: siyahıdan açılıbsa tarixçədə geri, birbaşa linklə gəlibsə /names-ə
  const closeName = useCallback(() => {
    if (window.history.state?.usr?.namesList) routerNavigate(-1)
    else routerNavigate(pathFor('names', lang), { replace: true })
  }, [routerNavigate, lang])
  // Əvvəlki / növbəti: girişi əvəz et — "geri" yenə siyahıya aparsın
  const step = useCallback((d) => {
    if (openIdx == null) return
    const n = ((openIdx + d + NAMES_99.length) % NAMES_99.length) + 1
    routerNavigate(pathFor('names', lang, n), { replace: true, state: window.history.state?.usr ?? null })
  }, [routerNavigate, lang, openIdx])
  // Klaviatura effekti hər addımda yenidən qurulmasın (fokus düymədə qalsın)
  const closeRefFn = useRef(closeName)
  const stepRef = useRef(step)
  closeRefFn.current = closeName
  stepRef.current = step

  // Pəncərə bağlandı — fokus açan karta qayıtsın (klaviatura ilə gəzən itməsin)
  const wasOpen = useRef(openIdx != null)
  useEffect(() => {
    const open = openIdx != null
    if (wasOpen.current && !open) {
      const el = lastFocus.current
      requestAnimationFrame(() => { if (el?.isConnected) el.focus?.() })
    }
    wasOpen.current = open
  }, [openIdx])

  // Pəncərə açıqdır: Esc — bağla, ←/→ — əvvəlki/növbəti (ərəbcədə güzgülənir)
  useEffect(() => {
    if (openIdx == null) return undefined
    closeRef.current?.focus()
    const rtl = document.documentElement.dir === 'rtl'
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRefFn.current() }
      // Fokus pəncərədən çıxmasın (Tab arxadakı səhifəyə keçirdi)
      else if (e.key === 'Tab') {
        const card = document.querySelector('.names-modal-card')
        const items = card ? [...card.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')] : []
        if (!items.length) return
        const first = items[0], last = items[items.length - 1]
        if (!card.contains(document.activeElement)) { e.preventDefault(); first.focus() }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
      else if (e.key === 'ArrowRight') stepRef.current(rtl ? -1 : 1)
      else if (e.key === 'ArrowLeft') stepRef.current(rtl ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIdx == null]) // eslint-disable-line react-hooks/exhaustive-deps
  // Telefonda "Geri" (jest / düymə) pəncərəni bağlayır: pəncərə ünvanın
  // özüdür (/names/<n>-<slug>) — Geri əvvəlki ünvana, yəni siyahıya qayıdır

  return (
    <div className="names-page">
      {/* Hero — dizayn v2 (sakit kağız fon + xatəm naxışı), bir <h1>.
          Ərəbcədə başlıq onsuz da ərəbcədir — təkrar sətir göstərilmir */}
      <header className="ui-page-hero names-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container" data-reveal="stagger">
          <Breadcrumb setPage={setPage} current={t.title} />
          <span className="ui-eyebrow">{navGroupLabel(navGroupOf('names'), lang)}</span>
          <h1 className="ui-display">{t.title}</h1>
          {lang !== 'ar' && <p className="names-hero-ar ui-arabic" lang="ar" dir="rtl" aria-hidden="true">أَسۡمَاءُ ٱللَّهِ ٱلۡحُسۡنَىٰ</p>}
          <p className="ui-lead">{t.subtitle}</p>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container">
          {/* Bölmələrə keçid */}
          <nav className="np-jump" aria-label={g.jump}>
            <a className="ui-chip" href="#names-list">{g.jList}</a>
            <a className="ui-chip" href="#names-practice">{g.jPractice}</a>
            <a className="ui-chip" href="#names-rules">{g.jRules}</a>
          </nav>

          {/* Fəzilət hədisi — ortada, qızılı ornamentlə (Buxari 2736, 7392; Müslim 2677) */}
          <figure className="names-hadith-banner" data-reveal="blur" aria-labelledby="np-virtue-h">
            <div className="ui-ornament" data-reveal="" aria-hidden="true"><span className="ui-ornament__star" /></div>
            <h2 className="np-h3" id="np-virtue-h">{g.virtueTitle}</h2>
            <p className="names-hadith-ar ui-arabic" lang="ar" dir="rtl">{VIRTUE.ar}</p>
            {lang !== 'ar' && <blockquote className="names-hadith-text">{VIRTUE.text[lang] || VIRTUE.text.en}</blockquote>}
            <figcaption className="names-hadith-ref">— {VIRTUE.ref[lang] || VIRTUE.ref.en}</figcaption>
            <ul className="np-notes">
              {(VIRTUE.notes[lang] || VIRTUE.notes.en).map((x, i) => <li key={i}>{x}</li>)}
            </ul>
            <p className="names-hadith-ref names-list-source">{LIST_SOURCE[lang] || LIST_SOURCE.az}</p>
          </figure>

          {/* İhsa — üç mərtəbə */}
          <section className="np-block" aria-labelledby="np-ihsa-h">
            <div className="ui-section-head" data-reveal>
              <h2 className="ui-title" id="np-ihsa-h">{g.ihsaTitle}</h2>
              <p className="ui-lead">{g.ihsaLead}</p>
            </div>
            <ol className="np-ihsa" data-reveal="stagger">
              {IHSA.map((s, i) => (
                <li key={s.id} className="ui-card np-ihsa__item">
                  <div className="ui-card__head">
                    <span className="ui-icon-tile ui-icon-tile--accent"><Icon name={s.icon} /></span>
                    <h3 className="ui-card__title"><span className="ui-num np-ihsa__n">{i + 1}.</span> {s.title[lang] || s.title.en}</h3>
                  </div>
                  <p className="ui-card__text">{s.text[lang] || s.text.en}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="names-toolbar" id="names-list">
            <label className="names-search">
              <span className="ui-sr-only">{t.searchPh}</span>
              <Icon name="search" size={18} className="names-search-ic" />
              <input
                type="search"
                className="ui-input"
                placeholder={t.searchPh}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </label>
            <p className="names-count" aria-live="polite">
              <span className="ui-num">{filtered.length}</span> {ui.count}
            </p>
          </div>

          {/* 99 ad şəbəkəsi — kartlar ekrana girəndə yumşaq böyüyərək görünür
              (ilk 8-i növbə ilə, sonrakılar sütuna görə kiçik fərqlə). Karta
              toxunanda ad iri pəncərədə "açılır" */}
          <ol className="names-grid">
            {filtered.map((name, i) => {
              const meaning = meaningOf(name, lang)
              return (
                <li key={name.n} data-reveal="zoom" data-reveal-delay={i < 8 ? i * 40 : (i % 4) * 40}>
                  <a className="name-card" href={pathFor('names', lang, name.n)}
                    onClick={onCardClick(name.n)}
                    aria-haspopup="dialog">
                    {/* Əlçatan ad kartın görünən mətnidir (nömrə, ərəbcə ad,
                        transliterasiya, məna) + gizli "Ətraflı bax". Əvvəl ayrıca
                        aria-label ərəbcə adı daşımırdı (WCAG 2.5.3 "Label in Name") */}
                    <span className="name-num ui-num">{name.n}</span>
                    <span className="name-arabic" lang="ar" dir="rtl">{name.ar}</span>
                    <span className="name-translit" dir="ltr">{name.tr}</span>
                    {meaning && <span className="name-meaning">{meaning}</span>}
                    <span className="ui-sr-only">{ui.open}</span>
                  </a>
                </li>
              )
            })}
          </ol>

          {filtered.length === 0 && (
            <div className="names-empty" data-reveal="fade">
              <span className="ui-icon-tile ui-icon-tile--lg ui-icon-tile--neutral"><Icon name="search" /></span>
              <p>{NOT_FOUND[lang] || NOT_FOUND.en}</p>
            </div>
          )}
        </div>
      </section>

      {/* Əzbərləmə məşqi — kartlar və yoxlama */}
      <section className="ui-section ui-section--alt np-section" id="names-practice" aria-labelledby="np-practice-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <h2 className="ui-title" id="np-practice-h">{g.practiceTitle}</h2>
            <p className="ui-lead">{g.practiceLead}</p>
          </div>
          <NamesPractice lang={lang} />
        </div>
      </section>

      {/* Qaydalar — İbn Useymin, «əl-Qavaid əl-Musla» */}
      <section className="ui-section np-section" id="names-rules" aria-labelledby="np-rules-h">
        <div className="ui-container">
          <div className="ui-section-head" data-reveal>
            <h2 className="ui-title" id="np-rules-h">{g.rulesTitle}</h2>
            <p className="ui-lead">{g.rulesLead}</p>
          </div>
          <div className="np-rules-cols">
            <div>
              <h3 className="np-h3">{g.nameRules}</h3>
              <RuleList rules={NAME_RULES} lang={lang} g={g} idPrefix="name-rule" />
            </div>
            <div>
              <h3 className="np-h3">{g.attrRules}</h3>
              <RuleList rules={ATTR_RULES} lang={lang} g={g} idPrefix="attr-rule" />
            </div>
          </div>
        </div>
      </section>

      {/* Açılmış ad — mərkəzi pəncərə (arxa fona toxunanda bağlanır) */}
      {opened && createPortal(
        <div className="names-modal" onClick={(e) => { if (e.target === e.currentTarget) closeName() }}>
          <div className="names-modal-card ui-card" role="dialog" aria-modal="true" aria-labelledby="names-modal-title">
            <div className="ui-pattern" aria-hidden="true" />
            <div className="names-modal-top">
              <span className="ui-badge ui-badge--accent ui-num" dir="ltr">{opened.n} {ui.of}</span>
              <button type="button" ref={closeRef} className="ui-icon-btn" onClick={closeName} aria-label={ui.close}>
                <Icon name="close" />
              </button>
            </div>
            {/* key — ad dəyişəndə məzmun yenidən yumşaq görünür */}
            <div className="names-modal-body" key={opened.n}>
              <p className="names-modal-ar ui-arabic" lang="ar" dir="rtl">{opened.ar}</p>
              <div className="ui-ornament" aria-hidden="true"><span className="ui-ornament__star" /></div>
              <h2 className="names-modal-title" id="names-modal-title" dir="ltr">{opened.tr}</h2>
              {meaningOf(opened, lang) && <p className="names-modal-meaning">{meaningOf(opened, lang)}</p>}
              <p className="names-modal-proof">{g.proof}: {proofText(opened, lang)}</p>
            </div>
            <div className="names-modal-nav">
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => step(-1)} aria-label={ui.prev}>
                <Icon name="chevronLeft" className="ui-btn__icon ui-flip-rtl" />
                <span className="names-nav-label">{ui.prev}</span>
              </button>
              <button type="button" className="ui-btn ui-btn--secondary" onClick={() => step(1)} aria-label={ui.next}>
                <span className="names-nav-label">{ui.next}</span>
                <Icon name="chevron" className="ui-btn__icon ui-flip-rtl" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
