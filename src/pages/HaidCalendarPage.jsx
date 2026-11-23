// ═══════════════════════════════════════════════════════
// /private-calendar — Qadın təqvimi: heyz və nifas (P1). Noindex, neytral ünvan və meta başlığı.
//
// • İstifadəçi başlanğıc / son günləri yazır (utils/haidLog — haid_log_v1, profilə aid; ehtiyat nüsxə və
//   hesabın E2E şifrəli sinxronizasiyası onu daşıyır). Yaddaş yalnız mount-dan sonra oxunur.
// • Hökm (saytın /qada səhifəsindəki mətnlə EYNİ, Müslim 335): heyz/nifas günlərinin namazı qəza edilmir,
//   tutulmayan Ramazan orucu qəza edilir → Ramazana düşən günlər (utils/haidRamadan, Ümmül-Qura — təxmini)
//   siyahısı və istifadəçinin təsdiqi ilə qəza izləyicisinə (utils/qada, /qada) əlavə.
// • İstihazə, ən az / ən çox müddət — HÖKM VERİLMİR (məzhəbə görə fərqlidir): yalnız istifadəçinin öz
//   yazdığı uzunluqlar göstərilir + lüğət/dərs keçidləri və "alimdən soruşun" qeydi.
// • Diskret: neytral başlıq seçimi ("Şəxsi təqvim"), bildiriş YOXDUR.
// ═══════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import HeroOrnament from '../components/HeroOrnament'
import Breadcrumb from '../components/Breadcrumb'
import Icon from '../components/Icon'
import { isPlainClick } from '../components/PageLink'
import { navGroupLabel, navGroupOf } from '../data/navigation'
import { pathFor } from '../seo/routes'
import { pickUi } from '../utils/uiText'
import { dayLabel } from '../utils/dayLabel'
import {
  readHaid, saveHaidEntry, removeHaidEntry, markAdded, setNeutral, spanDays, lengthsByKind, localDay,
  HAID_KEY, HAID_EVENT, HAID_KINDS, NOTE_MAX,
} from '../utils/haidLog'
import { makeupList } from '../utils/haidRamadan'
import { loadQada, saveQada, adjustOwed } from '../utils/qada'
import '../styles/HaidCalendarPage.css'

const ruForm = (n, one, few, many) => {
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}
const arDays = (n) => (n === 1 ? 'يوم واحد' : n === 2 ? 'يومان' : n <= 10 ? `${n} أيام` : `${n} يومًا`)
const arFasts = (n) => (n === 1 ? 'يوم صيام واحد' : n === 2 ? 'يومَي صيام' : n <= 10 ? `${n} أيام صيام` : `${n} يومَ صيام`)

const T = {
  az: {
    title: 'Heyz və nifas təqvimi', neutralTitle: 'Şəxsi təqvim',
    lead: 'Aybaşı (heyz) və zahılıq (nifas) günlərinizi gizli qeyd edin; hansı Ramazan oruclarının qəzası tutulacağını görün.',
    neutralLead: 'Yalnız sizə görünən şəxsi təqvim.',
    private: 'Qeydlər yalnız sizdədir: bu cihazda, ehtiyat nüsxədə və hesabın şifrəli sinxronizasiyasında. Bildiriş göndərilmir.',
    neutral: 'Neytral başlıq', neutralHint: 'Ekranı başqası görəndə səhifənin başlığı sadəcə "Şəxsi təqvim" olur.',
    rulingTitle: 'Saytdakı hökm', ruling: 'Qadın heyz və nifas günlərində qılmadığı namazları qəza etmir, tutmadığı orucları isə qəza edir.',
    rulingSrc: 'Aişə (Allah ondan razı olsun) — Müslim 335', rulingMore: 'Qəza izləyicisində ətraflı',
    madhab: 'İstihazə, heyz və nifasın ən az və ən çox müddəti barədə hökmlər məzhəblərə görə fərqlidir. Bu təqvim qanın heyz, nifas və ya istihazə olduğunu həll etmir — yalnız öz yazdığınız günləri göstərir. Öz vəziyyətiniz üçün alimdən soruşun.',
    learn: 'Öyrənmək üçün', links: { hayd: 'Lüğət: heyz', nifas: 'Lüğət: nifas', istihadah: 'Lüğət: istihazə', ghusl: 'Dərs: qüsl', fidyah: 'Dərs: oruc qəzası, kəffarə və fidyə' },
    addTitle: 'Yeni qeyd', editTitle: 'Qeydi redaktə et', kind: 'Növ', kinds: { hayd: 'Heyz (aybaşı)', nifas: 'Nifas (doğuşdan sonra)' },
    start: 'Başlanğıc günü', end: 'Son günü', endHint: 'Hələ davam edirsə boş saxlayın.', note: 'Qeyd (istəyə bağlı)',
    save: 'Yadda saxla', update: 'Dəyişikliyi saxla', cancel: 'Ləğv et', edit: 'Redaktə et', del: 'Sil', endToday: 'Bu gün bitdi',
    confirmDel: 'Bu qeyd silinsin?', yes: 'Bəli, sil', no: 'Xeyr',
    badStart: 'Başlanğıc günü bu gündən sonra ola bilməz.', badEnd: 'Son gün başlanğıcdan əvvəl və ya bu gündən sonra ola bilməz.',
    added: 'Qeyd əlavə olundu.', updated: 'Qeyd yeniləndi.', deleted: 'Qeyd silindi.',
    list: 'Qeydlərim', empty: 'Hələ qeyd yoxdur.', ongoing: 'davam edir',
    days: (n) => `${n} gün`, dayN: (n) => `${n}-ci gün`, ramadanDays: (n) => `Ramazana ${n} gün düşür (təxmini)`,
    makeupTitle: 'Qəzası tutulacaq Ramazan orucları', makeupEmpty: 'Qeydlərinizdə Ramazana düşən gün yoxdur.',
    makeupNote: 'Ramazan günləri Ümmül-Qura təqvimi ilə hesablanır və ölkənizdəki başlanğıcdan bir gün fərqlənə bilər. Yalnız həqiqətən oruc tutmadığınız günləri sayın.',
    count: 'Oruc sayı', addBtn: (n) => `Qəza izləyicisinə ${n} oruc əlavə et`, addedMsg: (n) => `Qəza izləyicisinə ${n} oruc əlavə olundu.`,
    already: (n) => `Artıq əlavə olunub: ${n}`, openQada: 'Qəza izləyicisini aç',
    lengthsTitle: 'Öz yazdığım uzunluqlar', lengthsNote: 'Yalnız sizin məlumatınız üçün — hökm deyil.', noLengths: 'Hələ bitmiş qeyd yoxdur.',
  },
  en: {
    title: 'Hayd and nifas calendar', neutralTitle: 'Private calendar',
    lead: 'Privately note the days of your period (hayd) and of postnatal bleeding (nifas), and see which Ramadan fasts to make up.',
    neutralLead: 'A private calendar only you can see.',
    private: 'Your entries stay with you: on this device, in your backup and in your account’s encrypted sync. No notifications are sent.',
    neutral: 'Neutral title', neutralHint: 'When someone else can see your screen, the page title just says “Private calendar”.',
    rulingTitle: 'The ruling on the site', ruling: 'A woman does not make up the prayers of her days of menstruation and postnatal bleeding, but she does make up the fasts.',
    rulingSrc: 'Aishah (may Allah be pleased with her) — Muslim 335', rulingMore: 'More in the qada tracker',
    madhab: 'Rulings on istihadah and on the shortest and longest durations of hayd and nifas differ between the schools of fiqh. This calendar does not decide whether bleeding is hayd, nifas or istihadah — it only shows the days you logged. Ask a scholar about your own situation.',
    learn: 'To learn more', links: { hayd: 'Glossary: hayd', nifas: 'Glossary: nifas', istihadah: 'Glossary: istihadah', ghusl: 'Lesson: ghusl', fidyah: 'Lesson: making up fasts, kaffarah and fidyah' },
    addTitle: 'New entry', editTitle: 'Edit entry', kind: 'Type', kinds: { hayd: 'Hayd (period)', nifas: 'Nifas (after childbirth)' },
    start: 'First day', end: 'Last day', endHint: 'Leave empty if it is still ongoing.', note: 'Note (optional)',
    save: 'Save', update: 'Save changes', cancel: 'Cancel', edit: 'Edit', del: 'Delete', endToday: 'Ended today',
    confirmDel: 'Delete this entry?', yes: 'Yes, delete', no: 'No',
    badStart: 'The first day cannot be after today.', badEnd: 'The last day cannot be before the first day or after today.',
    added: 'Entry added.', updated: 'Entry updated.', deleted: 'Entry deleted.',
    list: 'My entries', empty: 'No entries yet.', ongoing: 'ongoing',
    days: (n) => (n === 1 ? '1 day' : `${n} days`), dayN: (n) => `day ${n}`, ramadanDays: (n) => (n === 1 ? '1 day in Ramadan (approx.)' : `${n} days in Ramadan (approx.)`),
    makeupTitle: 'Ramadan fasts to make up', makeupEmpty: 'None of your entries falls in Ramadan.',
    makeupNote: 'Ramadan days are counted with the Umm al-Qura calendar and may differ by a day from the start in your country. Count only the days you really did not fast.',
    count: 'Number of fasts', addBtn: (n) => (n === 1 ? 'Add 1 fast to my qada tracker' : `Add ${n} fasts to my qada tracker`),
    addedMsg: (n) => (n === 1 ? '1 fast added to your qada tracker.' : `${n} fasts added to your qada tracker.`),
    already: (n) => `Already added: ${n}`, openQada: 'Open the qada tracker',
    lengthsTitle: 'Lengths I logged', lengthsNote: 'For your own reference only — not a ruling.', noLengths: 'No finished entries yet.',
  },
  ru: {
    title: 'Календарь хайда и нифаса', neutralTitle: 'Личный календарь',
    lead: 'Тайно отмечайте дни месячных (хайд) и послеродового кровотечения (нифас) и смотрите, какие посты Рамадана нужно восполнить.',
    neutralLead: 'Личный календарь, который видите только вы.',
    private: 'Записи остаются только у вас: на этом устройстве, в резервной копии и в зашифрованной синхронизации аккаунта. Уведомления не отправляются.',
    neutral: 'Нейтральный заголовок', neutralHint: 'Если экран видит кто-то другой, заголовок страницы — просто «Личный календарь».',
    rulingTitle: 'Положение на сайте', ruling: 'Женщина не возмещает намазы дней менструации и послеродового кровотечения, но возмещает посты.',
    rulingSrc: 'Аиша (да будет доволен ею Аллах) — Муслим 335', rulingMore: 'Подробнее в учёте возмещения',
    madhab: 'Положения об истихаде и о наименьшем и наибольшем сроке хайда и нифаса различаются в мазхабах. Этот календарь не определяет, хайд это, нифас или истихада, — он лишь показывает отмеченные вами дни. О своей ситуации спросите учёного.',
    learn: 'Чтобы узнать больше', links: { hayd: 'Словарь: хайд', nifas: 'Словарь: нифас', istihadah: 'Словарь: истихада', ghusl: 'Урок: гусль', fidyah: 'Урок: восполнение поста, каффара и фидья' },
    addTitle: 'Новая запись', editTitle: 'Изменить запись', kind: 'Вид', kinds: { hayd: 'Хайд (месячные)', nifas: 'Нифас (после родов)' },
    start: 'Первый день', end: 'Последний день', endHint: 'Оставьте пустым, если ещё продолжается.', note: 'Заметка (необязательно)',
    save: 'Сохранить', update: 'Сохранить изменения', cancel: 'Отмена', edit: 'Изменить', del: 'Удалить', endToday: 'Закончилось сегодня',
    confirmDel: 'Удалить эту запись?', yes: 'Да, удалить', no: 'Нет',
    badStart: 'Первый день не может быть позже сегодняшнего.', badEnd: 'Последний день не может быть раньше первого или позже сегодняшнего.',
    added: 'Запись добавлена.', updated: 'Запись обновлена.', deleted: 'Запись удалена.',
    list: 'Мои записи', empty: 'Записей пока нет.', ongoing: 'продолжается',
    days: (n) => `${n} ${ruForm(n, 'день', 'дня', 'дней')}`, dayN: (n) => `${n}-й день`,
    ramadanDays: (n) => `В Рамадан: ${n} ${ruForm(n, 'день', 'дня', 'дней')} (примерно)`,
    makeupTitle: 'Посты Рамадана для восполнения', makeupEmpty: 'Ни одна запись не приходится на Рамадан.',
    makeupNote: 'Дни Рамадана считаются по календарю Умм аль-Кура и могут на день отличаться от начала в вашей стране. Считайте только дни, когда вы действительно не постились.',
    count: 'Число постов', addBtn: (n) => `Добавить ${n} ${ruForm(n, 'пост', 'поста', 'постов')} в учёт возмещения`,
    addedMsg: (n) => `В учёт возмещения ${ruForm(n, 'добавлен', 'добавлено', 'добавлено')} ${n} ${ruForm(n, 'пост', 'поста', 'постов')}.`,
    already: (n) => `Уже добавлено: ${n}`, openQada: 'Открыть учёт возмещения',
    lengthsTitle: 'Отмеченная мной длительность', lengthsNote: 'Только для вашего сведения — это не решение.', noLengths: 'Завершённых записей пока нет.',
  },
  ar: {
    title: 'تقويم الحيض والنفاس', neutralTitle: 'تقويم خاص',
    lead: 'دوّني سرًّا أيام الحيض والنفاس، واعرفي أيّ أيام رمضان يجب قضاؤها.',
    neutralLead: 'تقويم خاص لا يراه غيرك.',
    private: 'سجلاتك تبقى عندك: على هذا الجهاز وفي النسخة الاحتياطية وفي مزامنة الحساب المشفّرة. لا تُرسَل إشعارات.',
    neutral: 'عنوان محايد', neutralHint: 'إذا رأى غيرك الشاشة يكون عنوان الصفحة «تقويم خاص» فقط.',
    rulingTitle: 'الحكم في الموقع', ruling: 'لا تقضي المرأة صلوات أيام الحيض والنفاس، وتقضي الصيام.',
    rulingSrc: 'عائشة رضي الله عنها — مسلم 335', rulingMore: 'المزيد في متابعة القضاء',
    madhab: 'تختلف المذاهب في أحكام الاستحاضة وفي أقل الحيض والنفاس وأكثرهما. وهذا التقويم لا يحكم بأن الدم حيض أو نفاس أو استحاضة، بل يعرض الأيام التي سجّلتِها فقط. اسألي عالمًا عن حالتك.',
    learn: 'للاستزادة', links: { hayd: 'المعجم: الحيض', nifas: 'المعجم: النفاس', istihadah: 'المعجم: الاستحاضة', ghusl: 'درس: الغسل', fidyah: 'درس: قضاء الصوم والكفارة والفدية' },
    addTitle: 'سجل جديد', editTitle: 'تعديل السجل', kind: 'النوع', kinds: { hayd: 'حيض', nifas: 'نفاس (بعد الولادة)' },
    start: 'اليوم الأول', end: 'اليوم الأخير', endHint: 'اتركيه فارغًا إن كان مستمرًّا.', note: 'ملاحظة (اختياري)',
    save: 'حفظ', update: 'حفظ التعديل', cancel: 'إلغاء', edit: 'تعديل', del: 'حذف', endToday: 'انتهى اليوم',
    confirmDel: 'هل تريدين حذف هذا السجل؟', yes: 'نعم، احذفي', no: 'لا',
    badStart: 'لا يصح أن يكون اليوم الأول بعد اليوم.', badEnd: 'لا يصح أن يكون اليوم الأخير قبل الأول أو بعد اليوم.',
    added: 'أُضيف السجل.', updated: 'حُدّث السجل.', deleted: 'حُذف السجل.',
    list: 'سجلاتي', empty: 'لا سجلات بعد.', ongoing: 'مستمر',
    days: (n) => arDays(n), dayN: (n) => `اليوم ${n}`, ramadanDays: (n) => `في رمضان: ${arDays(n)} (تقريبًا)`,
    makeupTitle: 'أيام رمضان التي تُقضى', makeupEmpty: 'لا يقع أيّ من سجلاتك في رمضان.',
    makeupNote: 'تُحسب أيام رمضان بتقويم أم القرى وقد تختلف بيوم عن بدايته في بلدك. احسبي فقط الأيام التي لم تصومي فيها فعلًا.',
    count: 'عدد الأيام', addBtn: (n) => `أضيفي ${arFasts(n)} إلى متابعة القضاء`, addedMsg: (n) => `أُضيف ${arFasts(n)} إلى متابعة القضاء.`,
    already: (n) => `أُضيف من قبل: ${n}`, openQada: 'افتحي متابعة القضاء',
    lengthsTitle: 'المدد التي سجّلتُها', lengthsNote: 'للاطلاع الشخصي فقط — وليست حكمًا.', noLengths: 'لا سجلات منتهية بعد.',
  },
  tr: {
    title: 'Hayız ve nifas takvimi', neutralTitle: 'Özel takvim',
    lead: 'Hayız ve nifas günlerinizi gizlice kaydedin; hangi Ramazan oruçlarının kazasının tutulacağını görün.',
    neutralLead: 'Yalnızca sizin görebildiğiniz özel bir takvim.',
    private: 'Kayıtlar yalnızca sizdedir: bu cihazda, yedekte ve hesabınızın şifreli eşitlemesinde. Bildirim gönderilmez.',
    neutral: 'Nötr başlık', neutralHint: 'Ekranı başkası gördüğünde sayfa başlığı yalnızca “Özel takvim” olur.',
    rulingTitle: 'Sitedeki hüküm', ruling: 'Kadın hayız ve nifas günlerinde kılmadığı namazları kaza etmez, tutmadığı oruçları ise kaza eder.',
    rulingSrc: 'Âişe (Allah ondan razı olsun) — Müslim 335', rulingMore: 'Kaza takibinde ayrıntılı',
    madhab: 'İstihâze ile hayız ve nifasın en az ve en çok süresine dair hükümler mezheplere göre farklıdır. Bu takvim kanın hayız, nifas veya istihâze olduğuna karar vermez — yalnızca kaydettiğiniz günleri gösterir. Kendi durumunuzu bir âlime sorun.',
    learn: 'Daha fazlası için', links: { hayd: 'Sözlük: hayız', nifas: 'Sözlük: nifas', istihadah: 'Sözlük: istihâze', ghusl: 'Ders: gusül', fidyah: 'Ders: oruç kazası, kefaret ve fidye' },
    addTitle: 'Yeni kayıt', editTitle: 'Kaydı düzenle', kind: 'Tür', kinds: { hayd: 'Hayız (âdet)', nifas: 'Nifas (doğumdan sonra)' },
    start: 'İlk gün', end: 'Son gün', endHint: 'Hâlâ devam ediyorsa boş bırakın.', note: 'Not (isteğe bağlı)',
    save: 'Kaydet', update: 'Değişikliği kaydet', cancel: 'İptal', edit: 'Düzenle', del: 'Sil', endToday: 'Bugün bitti',
    confirmDel: 'Bu kayıt silinsin mi?', yes: 'Evet, sil', no: 'Hayır',
    badStart: 'İlk gün bugünden sonra olamaz.', badEnd: 'Son gün ilk günden önce veya bugünden sonra olamaz.',
    added: 'Kayıt eklendi.', updated: 'Kayıt güncellendi.', deleted: 'Kayıt silindi.',
    list: 'Kayıtlarım', empty: 'Henüz kayıt yok.', ongoing: 'devam ediyor',
    days: (n) => `${n} gün`, dayN: (n) => `${n}. gün`, ramadanDays: (n) => `Ramazan’a ${n} gün denk geliyor (yaklaşık)`,
    makeupTitle: 'Kazası tutulacak Ramazan oruçları', makeupEmpty: 'Kayıtlarınızda Ramazan’a denk gelen gün yok.',
    makeupNote: 'Ramazan günleri Ümmü’l-Kurâ takvimiyle hesaplanır ve ülkenizdeki başlangıçtan bir gün farklı olabilir. Yalnızca gerçekten oruç tutmadığınız günleri sayın.',
    count: 'Oruç sayısı', addBtn: (n) => `Kaza takibine ${n} oruç ekle`, addedMsg: (n) => `Kaza takibine ${n} oruç eklendi.`,
    already: (n) => `Zaten eklendi: ${n}`, openQada: 'Kaza takibini aç',
    lengthsTitle: 'Kaydettiğim süreler', lengthsNote: 'Yalnızca kendi bilginiz için — hüküm değildir.', noLengths: 'Henüz bitmiş kayıt yok.',
  },
}

const EMPTY_FORM = { id: null, k: 'hayd', s: '', e: '', no: '' }

export default function HaidCalendarPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const navigate = useNavigate()
  const [data, setData] = useState({ v: 1, l: [] })
  const [ready, setReady] = useState(false)
  const [today, setToday] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [counts, setCounts] = useState({})
  const formRef = useRef(null)
  const listHeadRef = useRef(null)

  useEffect(() => {
    const load = () => setData(readHaid())
    load()
    const d = localDay()
    setToday(d)
    setForm((f) => (f.s ? f : { ...f, s: d }))
    setReady(true)
    const onStorage = (e) => { if (!e.key || e.key === HAID_KEY || e.key.endsWith(`:${HAID_KEY}`)) load() }
    window.addEventListener('storage', onStorage)
    window.addEventListener(HAID_EVENT, load)
    window.addEventListener('mcc-profile', load)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(HAID_EVENT, load)
      window.removeEventListener('mcc-profile', load)
    }
  }, [])

  // Neytral seçim; mount-dan əvvəl (prerender) həmişə neytral başlıq — həqiqi başlıq bir an belə görünməsin
  const pref = Boolean(data.p?.n)
  const neutral = !ready || pref
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const resetForm = () => setForm({ ...EMPTY_FORM, s: today })
  const go = (e, href) => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(href); window.scrollTo(0, 0) }

  function submit(e) {
    e.preventDefault()
    const r = saveHaidEntry({ id: form.id || undefined, k: form.k, s: form.s, e: form.e || undefined, no: form.no }, undefined, Date.now(), today)
    if (!r.ok) { setErr(r.code === 'start' ? t.badStart : t.badEnd); return }
    setErr('')
    setData(r.data)
    setMsg(form.id ? t.updated : t.added)
    resetForm()
  }
  function startEdit(x) {
    setForm({ id: x.id, k: x.k, s: x.s, e: x.e || '', no: x.no || '' })
    setErr('')
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ block: 'start' })
      formRef.current?.querySelector('input[type="radio"]:checked')?.focus()
    })
  }
  function endToday(x) {
    const r = saveHaidEntry({ ...x, e: today }, undefined, Date.now(), today)
    if (r.ok) { setData(r.data); setMsg(t.updated) }
  }
  function doDelete(id) {
    setData(removeHaidEntry(id))
    setConfirmId(null)
    setMsg(t.deleted)
    if (form.id === id) resetForm()
    requestAnimationFrame(() => listHeadRef.current?.focus())
  }
  function addToQada(row) {
    const n = Math.max(0, Math.min(60, Math.round(Number(counts[row.id] ?? row.left) || 0)))
    if (!n) return
    if (!saveQada(adjustOwed(loadQada(), 'fast', n))) return
    setData(markAdded(row.id, n))
    setCounts((c) => { const x = { ...c }; delete x[row.id]; return x })
    setMsg(t.addedMsg(n))
  }

  // Ramazan hesabı ay-ay (gün-gün yox) — siyahı dəyişəndə bir dəfə
  const makeup = useMemo(() => (ready && today ? makeupList(data, today) : []), [data, today, ready])
  const list = [...data.l].reverse()
  const editing = Boolean(form.id)
  const title = neutral ? t.neutralTitle : t.title
  const qadaHref = pathFor('qada', lang)
  const LINKS = [
    ['hayd', pathFor('glossary', lang, 'hayd')], ['nifas', pathFor('glossary', lang, 'nifas')],
    ['istihadah', pathFor('glossary', lang, 'istihadah')], ['ghusl', pathFor('learn', lang, 'ghusl')],
    ['fidyah', pathFor('learn', lang, 'kaffarah-fidyah')],
  ]
  const range = (x) => `${dayLabel(x.s, lang)} – ${x.e ? dayLabel(x.e, lang) : t.ongoing}`

  return (
    <div className="hdc-page">
      <header className="ui-page-hero hdc-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <HeroOrnament />
        <div className="ui-container ui-container--narrow">
          <div className="ui-page-hero__text">
            <Breadcrumb setPage={setPage} current={title} />
            {!neutral && <span className="ui-eyebrow">{navGroupLabel(navGroupOf('haid'), lang)}</span>}
            <h1 className="ui-display">{title}</h1>
            <p className="ui-lead">{neutral ? t.neutralLead : t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="lock" size={16} /> {t.private}</p>
            <div className="hdc-neutral">
              <button type="button" className="ui-chip" aria-pressed={pref} disabled={!ready} aria-describedby="hdc-neutral-hint"
                onClick={() => setData(setNeutral(!pref))} data-testid="hdc-neutral">
                <Icon name="eye" size={16} /> {t.neutral}
              </button>
              <span className="hdc-hint" id="hdc-neutral-hint">{t.neutralHint}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="ui-section ui-section--tight">
        <div className="ui-container ui-container--narrow hdc-main">
          <section className="ui-card hdc-ruling" aria-labelledby="hdc-ruling-title">
            <h2 className="ui-title ui-title--sm" id="hdc-ruling-title">{t.rulingTitle}</h2>
            <p className="hdc-ruling__text">{t.ruling}</p>
            <p className="hdc-muted">— {t.rulingSrc} · <a className="ui-link" href={qadaHref} onClick={(e) => go(e, qadaHref)}>{t.rulingMore}</a></p>
            <p className="hdc-madhab" data-testid="hdc-madhab"><Icon name="info" size={16} /> {t.madhab}</p>
            <h3 className="hdc-sub">{t.learn}</h3>
            <ul className="hdc-links">
              {LINKS.map(([k, href]) => (
                <li key={k}><a className="ui-link" href={href} onClick={(e) => go(e, href)}>{t.links[k]}</a></li>
              ))}
            </ul>
          </section>

          <form ref={formRef} className="ui-card hdc-form" onSubmit={submit} aria-labelledby="hdc-form-title" noValidate>
            <h2 className="ui-title ui-title--sm" id="hdc-form-title">{editing ? t.editTitle : t.addTitle}</h2>
            <fieldset className="hdc-kinds">
              <legend className="ui-field__label">{t.kind}</legend>
              <div className="hdc-kinds__row">
                {HAID_KINDS.map((k) => (
                  <label key={k} className={`ui-chip hdc-kind${form.k === k ? ' is-on' : ''}`}>
                    <input type="radio" name="hdc-kind" value={k} checked={form.k === k} onChange={set('k')} className="hdc-kind__input" />
                    <span>{t.kinds[k]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="hdc-grid">
              <label className="ui-field">
                <span className="ui-field__label">{t.start}</span>
                <input className="ui-input" type="date" required value={form.s} min="1900-01-01" max={today || undefined} onChange={set('s')} disabled={!ready} />
              </label>
              <label className="ui-field">
                <span className="ui-field__label">{t.end}</span>
                <input className="ui-input" type="date" value={form.e} min={form.s || '1900-01-01'} max={today || undefined} onChange={set('e')} disabled={!ready} aria-describedby="hdc-end-hint" />
                <span className="hdc-hint" id="hdc-end-hint">{t.endHint}</span>
              </label>
            </div>
            <label className="ui-field">
              <span className="ui-field__label">{t.note}</span>
              <textarea className="ui-input hdc-note" dir="auto" rows={2} maxLength={NOTE_MAX} value={form.no} onChange={set('no')} />
            </label>
            {err && <p className="hdc-error" role="alert">{err}</p>}
            <div className="hdc-form__actions">
              {editing && (
                <button type="button" className="ui-btn ui-btn--ghost" onClick={() => { resetForm(); setErr('') }}>
                  <Icon name="close" className="ui-btn__icon" /> {t.cancel}
                </button>
              )}
              <button type="submit" className="ui-btn ui-btn--primary" disabled={!ready}>
                <Icon name="check" className="ui-btn__icon" /> {editing ? t.update : t.save}
              </button>
            </div>
          </form>

          <p className="ui-sr-only" role="status" aria-live="polite">{msg}</p>

          <section aria-labelledby="hdc-list-title" className="hdc-list-wrap">
            <h2 className="ui-title ui-title--sm" id="hdc-list-title" tabIndex={-1} ref={listHeadRef}>{t.list}</h2>
            {ready && list.length === 0 && <p className="hdc-muted">{t.empty}</p>}
            {list.length > 0 && (
              <ul className="hdc-list">
                {list.map((x) => {
                  const n = spanDays(x, today)
                  const label = `${t.kinds[x.k]}, ${range(x)}`
                  return (
                    <li key={x.id} className="ui-card hdc-item" data-kind={x.k} data-testid="hdc-item">
                      <p className="hdc-item__title"><strong>{t.kinds[x.k]}</strong> <span className="ui-num hdc-item__range">{range(x)}</span></p>
                      <p className="hdc-item__len ui-num">{x.e ? t.days(n) : `${t.ongoing} · ${t.dayN(n)}`}</p>
                      {x.no && <p className="hdc-item__note" dir="auto">{x.no}</p>}
                      {confirmId === x.id ? (
                        <div className="hdc-item__actions" role="group" aria-label={t.confirmDel}>
                          <span className="hdc-confirm">{t.confirmDel}</span>
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--secondary hdc-danger" onClick={() => doDelete(x.id)} autoFocus>{t.yes}</button>
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => setConfirmId(null)}>{t.no}</button>
                        </div>
                      ) : (
                        <div className="hdc-item__actions">
                          {!x.e && (
                            <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => endToday(x)} aria-label={`${t.endToday}: ${label}`}>
                              <Icon name="check" size={16} className="ui-btn__icon" /> {t.endToday}
                            </button>
                          )}
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => startEdit(x)} aria-label={`${t.edit}: ${label}`}>
                            <Icon name="edit" size={16} className="ui-btn__icon" /> {t.edit}
                          </button>
                          <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={() => setConfirmId(x.id)} aria-label={`${t.del}: ${label}`}>
                            <Icon name="trash" size={16} className="ui-btn__icon" /> {t.del}
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="ui-card hdc-makeup" aria-labelledby="hdc-makeup-title">
            <h2 className="ui-title ui-title--sm" id="hdc-makeup-title">{t.makeupTitle}</h2>
            <p className="hdc-muted">{t.makeupNote}</p>
            {ready && makeup.length === 0 && <p className="hdc-muted">{t.makeupEmpty}</p>}
            {makeup.length > 0 && (
              <ul className="hdc-makeup__list">
                {makeup.map((row) => {
                  const val = counts[row.id] ?? String(row.left)
                  const n = Math.max(0, Math.min(60, Math.round(Number(val) || 0)))
                  const inputId = `hdc-n-${row.id}`
                  return (
                    <li key={row.id} className="hdc-makeup__row" data-testid="hdc-makeup">
                      <p className="hdc-makeup__what"><strong>{t.kinds[row.k]}</strong> <span className="ui-num">{range(row)}</span></p>
                      <p className="hdc-makeup__days ui-num">{t.ramadanDays(row.days)}{row.added ? ` · ${t.already(row.added)}` : ''}</p>
                      <div className="hdc-makeup__act">
                        <label className="ui-field hdc-makeup__count" htmlFor={inputId}>
                          <span className="ui-field__label">{t.count}</span>
                          <input id={inputId} className="ui-input ui-num" type="number" min="0" max="60" step="1" inputMode="numeric" value={val}
                            onChange={(e) => setCounts((c) => ({ ...c, [row.id]: e.target.value }))} />
                        </label>
                        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={!n} onClick={() => addToQada(row)}>
                          <Icon name="plus" size={16} className="ui-btn__icon" /> {t.addBtn(n)}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            <a className="ui-link hdc-open" href={qadaHref} onClick={(e) => go(e, qadaHref)}>{t.openQada} <Icon name="chevron" size={14} className="ui-flip-rtl" /></a>
          </section>

          <section className="ui-card hdc-lengths" aria-labelledby="hdc-len-title">
            <h2 className="ui-title ui-title--sm" id="hdc-len-title">{t.lengthsTitle}</h2>
            <p className="hdc-muted">{t.lengthsNote}</p>
            {HAID_KINDS.map((k) => {
              const ls = lengthsByKind(data, k)
              return (
                <div key={k} className="hdc-lengths__row">
                  <h3 className="hdc-sub">{t.kinds[k]}</h3>
                  {ls.length
                    ? <ul className="hdc-lengths__list ui-num">{ls.map((x) => <li key={x.id}>{dayLabel(x.s, lang)}: {t.days(x.days)}</li>)}</ul>
                    : <p className="hdc-muted">{t.noLengths}</p>}
                </div>
              )
            })}
          </section>
        </div>
      </section>
    </div>
  )
}
