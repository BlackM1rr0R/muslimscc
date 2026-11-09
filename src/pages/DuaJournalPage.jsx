import { useState, useEffect, useCallback, useRef } from 'react'
import { exitDelay } from '../utils/promptCoordinator'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import Icon from '../components/Icon'
import Breadcrumb from '../components/Breadcrumb'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import LessonBlocks, { pick } from '../components/lesson/LessonBlocks'
import { DUA_GUIDE, DUA_GUIDE_LINKS } from '../data/pageGuides/DuaJournalPage'
import { ChartFigure, Donut, ProgressRing } from '../components/viz'
import ActivityHeatmap from '../components/ActivityHeatmap'
import DuaGarden from '../components/DuaGarden'
import DuaJournalInsights from '../components/insights/DuaJournalInsights'
import RelatedLinks from '../components/RelatedLinks'
import { copyText } from '../components/reader/share'
import '../styles/LessonsPage.css'
import '../styles/DuaJournalPage.css'
import { pickUi } from '../utils/uiText'

// ── i18n Labels ──
const LABELS = {
  az: { title:'Dua gündəliyi', subtitle:'Şəxsi dualarınızı yazın və izləyin', active:'Aktiv dualar', answered:'Qəbul olunanlar', edit:'Redaktə et', editTitle:'Duanı redaktə et', add:'Dua əlavə et', placeholder:'Duanızı yazın...', personal:'Şəxsi', family:'Ailə', health:'Sağlamlıq', work:'İş', ummah:'Ümmət', low:'Aşağı', medium:'Orta', high:'Yüksək', markAnswered:'Qəbul oldu', delete:'Sil', noActive:'Aktiv dua yoxdur', noAnswered:'Hələ qəbul olunan yoxdur', answeredOn:'Qəbul tarixi', priority:'Prioritet', category:'Kateqoriya', total:'Ümumi', save:'Saxla', cancel:'Ləğv et', confirmDelete:'Bu dua silinsin?', guideMore:'Ətraflı' },
  en: { title:'Dua Journal', subtitle:'Write and track your personal duas', active:'Active Duas', answered:'Answered', edit:'Edit', editTitle:'Edit dua', add:'Add dua', placeholder:'Write your dua...', personal:'Personal', family:'Family', health:'Health', work:'Work', ummah:'Ummah', low:'Low', medium:'Medium', high:'High', markAnswered:'Answered', delete:'Delete', noActive:'No active duas', noAnswered:'No answered duas yet', answeredOn:'Answered on', priority:'Priority', category:'Category', total:'Total', save:'Save', cancel:'Cancel', confirmDelete:'Delete this dua?', guideMore:'Read more' },
  ru: { title:'Дневник дуа', subtitle:'Записывайте и отслеживайте свои дуа', active:'Активные', answered:'Отвеченные', edit:'Изменить', editTitle:'Изменить дуа', add:'Добавить дуа', placeholder:'Напишите дуа...', personal:'Личное', family:'Семья', health:'Здоровье', work:'Работа', ummah:'Умма', low:'Низкий', medium:'Средний', high:'Высокий', markAnswered:'Отвечено', delete:'Удалить', noActive:'Нет активных дуа', noAnswered:'Пока нет отвеченных', answeredOn:'Дата ответа', priority:'Приоритет', category:'Категория', total:'Всего', save:'Сохранить', cancel:'Отмена', confirmDelete:'Удалить это дуа?', guideMore:'Подробнее' },
  ar: { title:'مذكرة الدعاء', subtitle:'اكتب وتتبع أدعيتك الشخصية', active:'أدعية نشطة', answered:'مستجابة', edit:'تعديل', editTitle:'تعديل الدعاء', add:'أضف دعاء', placeholder:'اكتب دعاءك...', personal:'شخصي', family:'عائلة', health:'صحة', work:'عمل', ummah:'أمة', low:'منخفض', medium:'متوسط', high:'عالي', markAnswered:'استُجيب', delete:'حذف', noActive:'لا أدعية نشطة', noAnswered:'لا أدعية مستجابة بعد', answeredOn:'تاريخ الإجابة', priority:'الأولوية', category:'الفئة', total:'الإجمالي', save:'حفظ', cancel:'إلغاء', confirmDelete:'هل تريد حذف هذا الدعاء؟', guideMore:'للمزيد' },
  tr: { title:'Dua Günlüğü', subtitle:'Kişisel dualarınızı yazın ve takip edin', active:'Aktif dualar', answered:'Kabul edilenler', edit:'Düzenle', editTitle:'Duayı düzenle', add:'Dua ekle', placeholder:'Duanızı yazın...', personal:'Kişisel', family:'Aile', health:'Sağlık', work:'İş', ummah:'Ümmet', low:'Düşük', medium:'Orta', high:'Yüksek', markAnswered:'Kabul edildi', delete:'Sil', noActive:'Aktif dua yok', noAnswered:'Henüz kabul edilen yok', answeredOn:'Kabul tarihi', priority:'Öncelik', category:'Kategori', total:'Toplam', save:'Kaydet', cancel:'İptal', confirmDelete:'Bu dua silinsin mi?', guideMore:'Daha fazlası' },
}

// ── Dizayn v3: hero, xülasə qrafikləri, bələdçi bölmələrinin başlıqları ──
const V3 = {
  az: {
    lead: 'Allahdan istədiklərini yaz, qəbul olunanları qeyd et — səbr etməyə və şükr etməyə kömək edən şəxsi siyahı.',
    how: 'Necə işlədilir: «Dua əlavə et» düyməsi ilə duanı yaz, kateqoriya seç; istəyin həyata keçəndə «Qəbul oldu» işarələ. Qeydlər yalnız bu cihazda saxlanılır, heç yerə göndərilmir.',
    overview: 'Xülasə', byCat: 'Kateqoriyalar', byCatSub: (n) => `${n} dua üzrə bölgü`, noData: 'Hələ qeyd yoxdur', duasUnit: 'dua',
    chartEmpty: 'İlk duanı əlavə edəndə burada kateqoriyalar üzrə bölgü görünəcək.',
    activity: 'Fəaliyyət', activitySub: 'Son 12 həftə', activityNote: 'Hər xana bir gündür: yazılan və qəbul olunan dualar sayılır.',
    heatAria: (n) => `Son 12 həftədə ${n} gün qeyd var`, less: 'Az', more: 'Çox',
    rateText: 'duanın qəbul olunduğunu qeyd etmisən. Qalanları üçün tələsmə — Allah daha xeyirlisini seçə bilər.',
    emptyActive: 'Yuxarıdakı düymə ilə ilk duanı yaz.', emptyAnswered: 'Duan qəbul olunanda kartdakı «Qəbul oldu» düyməsini bas.',
    guideEyebrow: { adab: 'Ədəb', answer: 'Qəbul', times: 'Vaxtlar' },
    guideLead: { adab: 'Duanın qəbuluna səbəb olan ədəblər — ayə və səhih hədislərlə.', answer: 'Dua heç vaxt boşa getmir: ya istənilən verilir, ya da bir pislik sovuşdurulur.', times: 'Səhih dəlillərə görə duanın qəbuluna daha çox ümid edilən vaxtlar və hallar.' },
    relEyebrow: 'Davamı',
  },
  en: {
    lead: 'Write what you ask Allah for and note what was answered — a private list that helps you stay patient and grateful.',
    how: 'How to use: tap «Add dua», write it and pick a category; when it is fulfilled, mark it «Answered». Entries are kept on this device only and never sent anywhere.',
    overview: 'Overview', byCat: 'Categories', byCatSub: (n) => `Split of ${n} duas`, noData: 'No entries yet', duasUnit: 'duas',
    chartEmpty: 'Once you add your first dua, the split by category will appear here.',
    activity: 'Activity', activitySub: 'Last 12 weeks', activityNote: 'Each square is a day: duas written and duas answered are counted.',
    heatAria: (n) => `Entries on ${n} days in the last 12 weeks`, less: 'Less', more: 'More',
    rateText: 'of your duas are marked as answered. Do not be hasty about the rest — Allah may choose something better.',
    emptyActive: 'Write your first dua with the button above.', emptyAnswered: 'When a dua is answered, press «Answered» on its card.',
    guideEyebrow: { adab: 'Etiquette', answer: 'Answer', times: 'Times' },
    guideLead: { adab: 'The etiquette that helps a dua to be answered — with verses and authentic hadith.', answer: 'A dua is never wasted: either what is asked is given, or an evil is turned away.', times: 'Times and states in which an answer is most hoped for, according to authentic evidence.' },
    relEyebrow: 'Continue',
  },
  ru: {
    lead: 'Записывайте, о чём просите Аллаха, и отмечайте принятое — личный список, который помогает терпеть и благодарить.',
    how: 'Как пользоваться: нажмите «Добавить дуа», напишите его и выберите категорию; когда просьба исполнится, отметьте «Отвечено». Записи хранятся только на этом устройстве и никуда не отправляются.',
    overview: 'Обзор', byCat: 'Категории', byCatSub: (n) => `Распределение ${n} дуа`, noData: 'Пока нет записей', duasUnit: 'дуа',
    chartEmpty: 'Когда вы добавите первое дуа, здесь появится распределение по категориям.',
    activity: 'Активность', activitySub: 'Последние 12 недель', activityNote: 'Каждая клетка — день: учитываются записанные и принятые дуа.',
    heatAria: (n) => `Записи за ${n} дн. в последние 12 недель`, less: 'Меньше', more: 'Больше',
    rateText: 'ваших дуа отмечены как принятые. С остальными не торопитесь — Аллах может избрать лучшее.',
    emptyActive: 'Запишите первое дуа кнопкой выше.', emptyAnswered: 'Когда дуа будет принято, нажмите «Отвечено» на его карточке.',
    guideEyebrow: { adab: 'Этикет', answer: 'Ответ', times: 'Время' },
    guideLead: { adab: 'Этикет, помогающий принятию мольбы, — с аятами и достоверными хадисами.', answer: 'Мольба никогда не пропадает: либо даётся просимое, либо отводится беда.', times: 'Время и состояния, когда ответа особенно надеются, по достоверным доводам.' },
    relEyebrow: 'Далее',
  },
  ar: {
    lead: 'اكتب ما تسأله الله، وعلِّم على ما استُجيب — قائمة خاصة تعينك على الصبر والشكر.',
    how: 'طريقة الاستخدام: اضغط «أضف دعاء» واكتبه واختر الفئة، فإذا تحقق المطلوب فعلِّم «استُجيب». تُحفظ المدخلات على هذا الجهاز فقط ولا تُرسل إلى أي مكان.',
    overview: 'نظرة عامة', byCat: 'الفئات', byCatSub: (n) => `توزيع ${n} من الأدعية`, noData: 'لا مدخلات بعد', duasUnit: 'دعاء',
    chartEmpty: 'عند إضافة أول دعاء يظهر هنا توزيعها بحسب الفئات.',
    activity: 'النشاط', activitySub: 'آخر 12 أسبوعًا', activityNote: 'كل مربع يوم: تُحسب الأدعية المكتوبة والمستجابة.',
    heatAria: (n) => `مدخلات في ${n} يومًا خلال آخر 12 أسبوعًا`, less: 'أقل', more: 'أكثر',
    rateText: 'من أدعيتك معلَّمة بأنها استُجيبت. ولا تستعجل في الباقي، فقد يختار الله لك خيرًا منه.',
    emptyActive: 'اكتب أول دعاء بالزر أعلاه.', emptyAnswered: 'إذا استُجيب دعاء فاضغط «استُجيب» في بطاقته.',
    guideEyebrow: { adab: 'الآداب', answer: 'الإجابة', times: 'الأوقات' },
    guideLead: { adab: 'آداب يُرجى بها قبول الدعاء — بالآيات والأحاديث الصحيحة.', answer: 'الدعاء لا يضيع: إما أن يُعطى المطلوب، وإما أن يُصرف سوء.', times: 'أوقات وأحوال يُرجى فيها الإجابة بحسب الأدلة الصحيحة.' },
    relEyebrow: 'المزيد',
  },
  tr: {
    lead: 'Allah’tan istediklerini yaz, kabul edilenleri işaretle — sabretmene ve şükretmene yardım eden kişisel bir liste.',
    how: 'Nasıl kullanılır: «Dua ekle» ile duanı yaz, kategori seç; isteğin gerçekleşince «Kabul edildi» olarak işaretle. Kayıtlar yalnızca bu cihazda saklanır, hiçbir yere gönderilmez.',
    overview: 'Özet', byCat: 'Kategoriler', byCatSub: (n) => `${n} duanın dağılımı`, noData: 'Henüz kayıt yok', duasUnit: 'dua',
    chartEmpty: 'İlk duanı eklediğinde burada kategorilere göre dağılım görünecek.',
    activity: 'Etkinlik', activitySub: 'Son 12 hafta', activityNote: 'Her kare bir gündür: yazılan ve kabul edilen dualar sayılır.',
    heatAria: (n) => `Son 12 haftada ${n} gün kayıt var`, less: 'Az', more: 'Çok',
    rateText: 'duanın kabul edildiğini işaretledin. Kalanlar için acele etme — Allah daha hayırlısını seçebilir.',
    emptyActive: 'Yukarıdaki düğmeyle ilk duanı yaz.', emptyAnswered: 'Duan kabul edilince kartındaki «Kabul edildi» düğmesine bas.',
    guideEyebrow: { adab: 'Edep', answer: 'Kabul', times: 'Vakitler' },
    guideLead: { adab: 'Duanın kabulüne vesile olan edepler — ayet ve sahih hadislerle.', answer: 'Dua asla boşa gitmez: ya istenen verilir ya da bir kötülük uzaklaştırılır.', times: 'Sahih delillere göre duanın kabulünün en çok umulduğu vakitler ve hâller.' },
    relEyebrow: 'Devamı',
  },
}

// v3.2: siyahı alət zolağı — axtarış, kateqoriya süzgəci, sıralama, kopyala (5 dil)
const TOOLS = {
  az: { search: 'Dualarda axtar...', clear: 'Axtarışı təmizlə', all: 'Hamısı', sort: 'Sıralama', newest: 'Yenilər', oldest: 'Köhnələr', prio: 'Prioritet', copyList: 'Siyahını kopyala', copied: 'Kopyalandı', none: 'Bu süzgəcə uyğun dua yoxdur.', reset: 'Süzgəci sıfırla', filter: 'Kateqoriyaya görə süzgəc' },
  en: { search: 'Search your duas...', clear: 'Clear search', all: 'All', sort: 'Sort', newest: 'Newest', oldest: 'Oldest', prio: 'Priority', copyList: 'Copy list', copied: 'Copied', none: 'No duas match this filter.', reset: 'Reset filters', filter: 'Filter by category' },
  ru: { search: 'Поиск в дуа...', clear: 'Очистить поиск', all: 'Все', sort: 'Сортировка', newest: 'Новые', oldest: 'Старые', prio: 'Приоритет', copyList: 'Копировать список', copied: 'Скопировано', none: 'Нет дуа по этому фильтру.', reset: 'Сбросить фильтры', filter: 'Фильтр по категории' },
  ar: { search: 'ابحث في أدعيتك...', clear: 'مسح البحث', all: 'الكل', sort: 'الترتيب', newest: 'الأحدث', oldest: 'الأقدم', prio: 'الأولوية', copyList: 'انسخ القائمة', copied: 'تم النسخ', none: 'لا توجد أدعية بهذا التصفية.', reset: 'إلغاء التصفية', filter: 'التصفية حسب الفئة' },
  tr: { search: 'Dualarında ara...', clear: 'Aramayı temizle', all: 'Tümü', sort: 'Sıralama', newest: 'En yeni', oldest: 'En eski', prio: 'Öncelik', copyList: 'Listeyi kopyala', copied: 'Kopyalandı', none: 'Bu filtreye uyan dua yok.', reset: 'Filtreleri sıfırla', filter: 'Kategoriye göre filtre' },
}
const PRIO_RANK = { high: 0, medium: 1, low: 2 }

const CATEGORIES = ['personal', 'family', 'health', 'work', 'ummah']
const PRIORITIES = ['low', 'medium', 'high']
const STORAGE_KEY = 'dua_journal'

// Kateqoriya ikonları (Icon.jsx adları; prioritet rəngləri CSS-dədir: .dj-dot--low|medium|high)
const CATEGORY_ICONS = { personal:'user', family:'jamaat', health:'donate', work:'list', ummah:'globe' }

// Tarix interfeys dilində: "28 oktyabr 2026" (yaddaşda ISO "2026-10-28" qalır)
const LOCALE = { az:'az-AZ', en:'en-GB', ru:'ru-RU', ar:'ar', tr:'tr-TR' }
const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
function formatDate(iso, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  if (!m) return iso || ''
  // Bəzi brauzerlərdə az-AZ ay adları yoxdur ("2026 M10 28") — özümüz yazırıq
  if (lang === 'az') return `${+m[3]} ${AZ_MONTHS[+m[2] - 1] || m[2]} ${m[1]}`
  try {
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(LOCALE[lang] || 'az-AZ', { day:'numeric', month:'long', year:'numeric' })
  } catch { return iso }
}

// Yerli tarix (ISO "2026-10-28"). toISOString() UTC verir — Bakıda gecə
// 00:00–04:00 arası əlavə olunan dua dünənin tarixi ilə yazılırdı
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Pozuq / köhnə məlumat səhifəni çökdürməsin: yalnız mətni olan qeydlər
// saxlanılır, əskik sahələr standart dəyərlə doldurulur, id təkrarsız olur
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : null
    const list = Array.isArray(data?.duas) ? data.duas : []
    const seen = new Set()
    const duas = list
      .filter(d => d && typeof d === 'object' && typeof d.text === 'string' && d.text.trim())
      .map((d, i) => {
        let id = typeof d.id === 'string' || typeof d.id === 'number' ? String(d.id) : ''
        if (!id || seen.has(id)) id = `r${i}-${Math.random().toString(36).slice(2, 6)}`
        seen.add(id)
        return {
          id,
          text: d.text,
          category: CATEGORIES.includes(d.category) ? d.category : 'personal',
          priority: PRIORITIES.includes(d.priority) ? d.priority : 'medium',
          date: typeof d.date === 'string' ? d.date : '',
          answered: d.answered === true,
          answeredDate: typeof d.answeredDate === 'string' ? d.answeredDate : null,
        }
      })
    return { duas }
  } catch { return { duas: [] } }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

export default function DuaJournalPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(LABELS, lang)
  const fmtDate = (iso) => formatDate(iso, lang)

  const [duas, setDuas] = useState([])
  const [tab, setTab] = useState('active')
  const [jq, setJq] = useState('')
  const [jcat, setJcat] = useState('all')
  const [jsort, setJsort] = useState('newest')
  const [jcopied, setJcopied] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const [category, setCategory] = useState('personal')
  const [priority, setPriority] = useState('medium')
  // Redaktə olunan duanın id-si (null — yeni dua)
  const [editingId, setEditingId] = useState(null)
  // Qəbul olunan / silinən kart qısa çıxış animasiyası ilə gedir
  const [leaving, setLeaving] = useState(null)
  const [leaveKind, setLeaveKind] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    const data = loadData()
    setDuas(data.duas || [])
  }, [])

  const persist = useCallback((updated) => {
    setDuas(updated)
    saveData({ duas: updated })
  }, [])

  const resetForm = () => {
    setText('')
    setCategory('personal')
    setPriority('medium')
    setEditingId(null)
    setShowForm(false)
  }

  const addDua = () => {
    if (!text.trim()) return
    if (editingId) {
      persist(duas.map(d => d.id === editingId ? { ...d, text: text.trim(), category, priority } : d))
      resetForm()
      return
    }
    const newDua = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: text.trim(),
      category,
      priority,
      date: todayISO(),
      answered: false,
      answeredDate: null,
    }
    persist([newDua, ...duas])
    resetForm()
  }

  // Redaktə: forma duanın mətni ilə açılır və görünən yerə gəlir
  const startEdit = (dua) => {
    setEditingId(dua.id)
    setText(dua.text)
    setCategory(dua.category)
    setPriority(dua.priority)
    setShowForm(true)
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }

  // Kart çıxış animasiyası bitəndən sonra siyahıdan çıxır (hərəkət azaldılıbsa dərhal).
  // Sürətli təkrar klik ikinci dəfə işləməsin
  // v4: "Qəbul oldu" — kart qızılı işıqla yuxarı "yüksəlir" (daha uzun çıxış, 560ms)
  const leaveThen = (id, fn, ms = 220, kind = '') => {
    if (leaving) return
    setLeaving(id)
    setLeaveKind(kind)
    setTimeout(() => { fn(); setLeaving(null); setLeaveKind('') }, exitDelay(ms))
  }

  const markAnswered = (id) => {
    haptic()
    leaveThen(id, () => setDuas(cur => {
      const updated = cur.map(d => d.id === id ? { ...d, answered: true, answeredDate: todayISO() } : d)
      saveData({ duas: updated })
      return updated
    }), 560, 'answer')
  }

  // Silmə geri qaytarılmır — təsadüfi toxunuşa qarşı təsdiq soruşulur
  const deleteDua = (id) => {
    if (!window.confirm(t.confirmDelete)) return
    if (editingId === id) resetForm()
    leaveThen(id, () => setDuas(cur => {
      const updated = cur.filter(d => d.id !== id)
      saveData({ duas: updated })
      return updated
    }))
  }

  const cancelForm = resetForm

  const activeDuas = duas.filter(d => !d.answered)
  const answeredDuas = duas.filter(d => d.answered)
  const tabList = tab === 'active' ? activeDuas : answeredDuas
  const tl = pickUi(TOOLS, lang, 'en')
  const fq = jq.trim().toLocaleLowerCase(lang)
  const list = tabList
    .filter(d => (jcat === 'all' || d.category === jcat) && (!fq || String(d.text || '').toLocaleLowerCase(lang).includes(fq)))
    .sort((a, b) => {
      if (jsort === 'prio') return (PRIO_RANK[a.priority] ?? 1) - (PRIO_RANK[b.priority] ?? 1) || String(b.date).localeCompare(String(a.date))
      const c = String(a.date).localeCompare(String(b.date)) || (Number(a.id) || 0) - (Number(b.id) || 0)
      return jsort === 'oldest' ? c : -c
    })
  const filteredOut = tabList.length > 0 && list.length === 0
  const copyList = async () => {
    const body = list.map((d, i) => `${i + 1}. ${d.text}${d.date ? ` (${fmtDate(d.date)})` : ''}`).join('\n')
    if (await copyText(`${tab === 'active' ? t.active : t.answered}\n\n${body}`)) {
      setJcopied(true)
      setTimeout(() => setJcopied(false), 1800)
    }
  }

  const v = pickUi(V3, lang, 'en')
  const today = new Date()
  const todayIso = todayISO()
  // Fəaliyyət: hər gün neçə dua yazılıb + neçəsi qəbul olunub (son 12 həftə)
  const activity = {}
  for (const d of duas) {
    if (d.date) activity[d.date] = (activity[d.date] || 0) + 1
    if (d.answered && d.answeredDate) activity[d.answeredDate] = (activity[d.answeredDate] || 0) + 1
  }
  const actDays = Object.keys(activity).filter(k => k <= todayIso).length
  // Rəng kateqoriyaya bağlıdır (sıraya yox): 4 viz rəngi + 5-ci üçün neytral
  const CAT_TONE = { personal: 1, family: 2, health: 3, work: 4, ummah: 'muted' }
  const catSegs = CATEGORIES.map(c => ({ key: c, label: t[c], tone: CAT_TONE[c], value: duas.filter(d => d.category === c).length })).filter(s => s.value > 0)
  const rate = duas.length ? Math.round((answeredDuas.length / duas.length) * 100) : 0

  return (
    <div className="dua-journal-page">
      {/* Hero — v3 kompakt: solda izah, sağda qısa xülasə */}
      <header className="ui-page-hero ui-page-hero--split dj-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text" data-reveal="stagger">
            <Breadcrumb setPage={setPage} current={t.title} />
            <span className="ui-eyebrow">{navGroupLabel(navGroupOf('duajournal'), lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{v.lead}</p>
            <p className="ui-page-hero__how"><Icon name="shield" size={16} /> {v.how}</p>
          </div>
          <div className="ui-page-hero__aside">
            <div className="ui-card dj-summary">
              <ProgressRing value={answeredDuas.length} max={Math.max(1, duas.length)} size={84} thickness={8}
                label={t.answered} sub={`${answeredDuas.length} / ${duas.length}`} />
              <dl className="dj-summary__kv">
                <div><dt>{t.active}</dt><dd className="ui-num">{activeDuas.length}</dd></div>
                <div><dt>{t.answered}</dt><dd key={answeredDuas.length} className="ui-num dj-roll">{answeredDuas.length}</dd></div>
                <div><dt>{t.total}</dt><dd className="ui-num">{duas.length}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container dj-split">
          {/* ── Gündəlik: əlavə et, forma, tablar, kartlar ── */}
          <div className="dua-journal-layout">
            <DuaGarden duas={duas} lang={lang} />
            {/* Əlavə et — telefonda tam en (baş barmaqla rahat) */}
            {!showForm && (
              <button type="button" className="ui-btn ui-btn--primary dua-add-btn" onClick={() => setShowForm(true)}>
                <Icon name="plus" className="ui-btn__icon" /> {t.add}
              </button>
            )}

            {/* Forma — Esc: ləğv, Ctrl/⌘+Enter: saxla */}
            {showForm && (
              <div className="ui-card dua-form" ref={formRef}
                onKeyDown={e => {
                  if (e.key === 'Escape') cancelForm()
                  else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addDua()
                }}>
                <label className="ui-field">
                  <span className="ui-field__label">{editingId ? t.editTitle : t.add}</span>
                  <textarea
                    dir="auto"
                    className="ui-input dua-textarea"
                    placeholder={t.placeholder}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    autoFocus
                  />
                </label>
                <div className="dua-form-options">
                  <div className="dua-form-group">
                    <span className="ui-field__label" id="dj-cat-label">{t.category}</span>
                    <div className="dua-form-chips" role="group" aria-labelledby="dj-cat-label">
                      {CATEGORIES.map(c => (
                        <button key={c} type="button" className="ui-chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
                          <Icon name={CATEGORY_ICONS[c]} size={16} /> {t[c]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="dua-form-group">
                    <span className="ui-field__label" id="dj-prio-label">{t.priority}</span>
                    <div className="dua-form-chips" role="group" aria-labelledby="dj-prio-label">
                      {PRIORITIES.map(p => (
                        <button key={p} type="button" className="ui-chip" aria-pressed={priority === p} onClick={() => setPriority(p)}>
                          <span className={`dua-priority-dot dj-dot--${p}`} aria-hidden="true" />
                          {t[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="dua-form-actions">
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={cancelForm}>
                    <Icon name="close" className="ui-btn__icon" /> {t.cancel}
                  </button>
                  <button type="button" className="ui-btn ui-btn--primary" onClick={addDua} disabled={!text.trim()}>
                    <Icon name="check" className="ui-btn__icon" /> {t.save}
                  </button>
                </div>
              </div>
            )}

            {/* Tablar — say dəyişəndə nişan kiçik "pop" edir */}
            <div className="ui-tabs dua-tabs" role="tablist">
              <button type="button" role="tab" id="dj-tab-active" aria-selected={tab === 'active'} aria-controls="dj-panel"
                className="ui-tab dua-tab" onClick={() => setTab('active')}>
                {t.active} <span key={activeDuas.length} className="ui-tab__count dua-tab-count ui-num ui-enter-pop">{activeDuas.length}</span>
              </button>
              <button type="button" role="tab" id="dj-tab-answered" aria-selected={tab === 'answered'} aria-controls="dj-panel"
                className="ui-tab dua-tab" onClick={() => setTab('answered')}>
                {t.answered} <span key={answeredDuas.length} className="ui-tab__count dua-tab-count ui-num ui-enter-pop">{answeredDuas.length}</span>
              </button>
            </div>

            {tabList.length > 0 && (
              <div className="dj-tools">
                <div className="dj-tools__row">
                  <div className="dj-search">
                    <Icon name="search" size={17} className="dj-search__icon" />
                    <input className="ui-input dj-search__input" type="search" value={jq} onChange={e => setJq(e.target.value)}
                      placeholder={tl.search} aria-label={tl.search} enterKeyHint="search" />
                    {jq && (
                      <button type="button" className="ui-icon-btn dj-search__clear" onClick={() => setJq('')} aria-label={tl.clear} title={tl.clear}>
                        <Icon name="close" size={15} />
                      </button>
                    )}
                  </div>
                  <div className="ui-segmented dj-sort" role="radiogroup" aria-label={tl.sort}>
                    {['newest', 'oldest', 'prio'].map(k => (
                      <button key={k} type="button" role="radio" aria-checked={jsort === k} onClick={() => setJsort(k)}>{tl[k]}</button>
                    ))}
                  </div>
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm dj-copy" onClick={copyList} disabled={!list.length}>
                    <Icon name={jcopied ? 'check' : 'copy'} className="ui-btn__icon" /> {jcopied ? tl.copied : tl.copyList}
                  </button>
                </div>
                <div className="dj-tools__chips" role="group" aria-label={tl.filter}>
                  <button type="button" className="ui-chip" aria-pressed={jcat === 'all'} onClick={() => setJcat('all')}>{tl.all}</button>
                  {CATEGORIES.map(c => {
                    const n = tabList.filter(d => d.category === c).length
                    return n > 0 ? (
                      <button key={c} type="button" className="ui-chip" aria-pressed={jcat === c} onClick={() => setJcat(c)}>
                        <Icon name={CATEGORY_ICONS[c]} size={14} /> {t[c]} <span className="dj-chip-n ui-num">{n}</span>
                      </button>
                    ) : null
                  })}
                </div>
              </div>
            )}

            <div className="dj-list" id="dj-panel" role="tabpanel" aria-labelledby={tab === 'active' ? 'dj-tab-active' : 'dj-tab-answered'}>
              {filteredOut && (
                <div className="ui-empty dua-empty" role="status">
                  <Icon name="search" />
                  <strong>{tl.none}</strong>
                  <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => { setJq(''); setJcat('all') }}>
                    <Icon name="refresh" className="ui-btn__icon" /> {tl.reset}
                  </button>
                </div>
              )}
              {tabList.length === 0 && (
                <div className="ui-empty dua-empty" key={`empty-${tab}`} data-reveal="fade">
                  <Icon name={tab === 'active' ? 'duajournal' : 'sparkle'} />
                  <strong>{tab === 'active' ? t.noActive : t.noAnswered}</strong>
                  <p>{tab === 'active' ? v.emptyActive : v.emptyAnswered}</p>
                </div>
              )}
              {list.map((dua, i) => (
                <article
                  key={dua.id}
                  className={`ui-card dj-card dj-cat--${dua.category}${dua.answered ? ' dj-card-answered' : ''}${leaving === dua.id ? ` is-leaving${leaveKind === 'answer' ? ' is-answering' : ''}` : ''}${editingId === dua.id ? ' is-editing' : ''}`}
                  data-reveal="" data-reveal-delay={Math.min(i, 7) * 40}
                >
                  <div className="dj-card-top">
                    <span className="dua-category-badge">
                      <Icon name={CATEGORY_ICONS[dua.category] || 'user'} size={14} /> {t[dua.category]}
                    </span>
                    <span className="dj-prio" title={`${t.priority}: ${t[dua.priority]}`}>
                      <span className={`dua-priority-dot dj-dot--${dua.priority}`} aria-hidden="true" />
                      <span className="dj-prio-label">{t[dua.priority]}</span>
                    </span>
                  </div>
                  <p className="dj-card-text" dir="auto">{dua.text}</p>
                  <div className="dj-card-meta">
                    <span className="dj-card-date">
                      <Icon name="calendar" size={14} /> {fmtDate(dua.date)}
                    </span>
                    {dua.answered && dua.answeredDate && (
                      <span className="dj-card-answered-date">
                        <Icon name="check" size={14} /> {t.answeredOn}: {fmtDate(dua.answeredDate)}
                      </span>
                    )}
                  </div>
                  <div className="dj-card-actions">
                    {!dua.answered && (
                      <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm dua-action-btn" onClick={() => markAnswered(dua.id)}>
                        <Icon name="check" className="ui-btn__icon" /> {t.markAnswered}
                      </button>
                    )}
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm dua-action-btn dua-edit-btn" onClick={() => startEdit(dua)}>
                      <Icon name="edit" className="ui-btn__icon" /> {t.edit}
                    </button>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm dua-action-btn dua-delete-btn" onClick={() => deleteDua(dua.id)} title={t.delete}>
                      {/* Dar telefonda yalnız ikon (mətn ekran oxuyucusu üçün qalır) */}
                      <Icon name="trash" className="ui-btn__icon" /> <span className="dua-delete-label">{t.delete}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* ── Yan panel: xülasə qrafikləri ── */}
          <aside className="dj-side" aria-label={v.overview}>
            <ChartFigure title={v.byCat} sub={duas.length ? v.byCatSub(duas.length) : v.noData}>
              {catSegs.length > 0
                ? <Donut size={112} thickness={14} segments={catSegs} center={{ value: String(duas.length), label: v.duasUnit }} />
                : <p className="dj-side__empty">{v.chartEmpty}</p>}
            </ChartFigure>
            <ChartFigure title={v.activity} sub={v.activitySub} note={v.activityNote}>
              <ActivityHeatmap days={84} today={today}
                levelOf={(k) => Math.min(4, activity[k] || 0)}
                titleOf={(k) => `${fmtDate(k)}: ${activity[k] || 0}`}
                label={v.heatAria(actDays)} less={v.less} more={v.more} />
            </ChartFigure>
            {duas.length > 0 && (
              <p className="dj-side__rate"><b className="ui-num">{rate}%</b> {v.rateText}</p>
            )}
          </aside>
        </div>
      </section>

      {/* viz v2: analitika — KPI, dinamika, kateqoriyalar, təqvim, lent */}
      <DuaJournalInsights duas={duas} today={todayIso} categories={CATEGORIES} catLabels={Object.fromEntries(CATEGORIES.map(c => [c, t[c]]))} lang={lang} />

      {/* ── Duanın ədəbi, "qəbul oldu"nun mənası, qəbul vaxtları (mənbəli) ── */}
      {DUA_GUIDE.map((sec, i) => (
        <section key={sec.id} id={`dj-${sec.id}`} className={`ui-section ui-section--tight dj-guide-sec${i % 2 === 0 ? ' ui-section--alt' : ''}`} aria-labelledby={`dj-${sec.id}-title`}>
          {/* Geniş konteyner: addımlar kart şəbəkəsi, ayə/hədis yan-yana */}
          <div className="ui-container">
            <div className="ui-section-head" data-reveal>
              <span className="ui-eyebrow">{v.guideEyebrow[sec.id]}</span>
              <h2 id={`dj-${sec.id}-title`} className="ui-title dj-guide-title">{pick(sec.title, lang)}</h2>
              {v.guideLead[sec.id] && <p className="ui-lead">{v.guideLead[sec.id]}</p>}
            </div>
            <LessonBlocks blocks={sec.blocks} lang={lang} />
          </div>
        </section>
      ))}

      {/* Əlaqəli bölmələr — dua mətnləri burada təkrarlanmır */}
      <section className="ui-section ui-section--tight" aria-labelledby="dj-rel-h">
        <div className="ui-container ui-container--narrow">
          <div className="ui-section-head">
            <span className="ui-eyebrow">{v.relEyebrow}</span>
            <h2 className="ui-title ui-title--sm" id="dj-rel-h">{t.guideMore}</h2>
          </div>
          <RelatedLinks items={DUA_GUIDE_LINKS.map(l => ({ ...l, icon: l.learn ? 'learn' : l.to, title: l.label }))} />
        </div>
      </section>
    </div>
  )
}
