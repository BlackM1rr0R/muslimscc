// ═══════════════════════════════════════════════════════
// /name-in-arabic — "Adın ərəb xəttilə" (v7 "Toxunma")
//
// Ad yazılır → ərəbcə yazılış:
//   • lüğətdən (data/arabicNames.js) — standart yazılış, "dəqiq";
//   • tapılmayan söz — fonetik transliterasiya, açıq-aydın "TƏXMİNİ" (utils/arabicName.js);
//   • istifadəçi hərf-hərf düzəldə bilər (ərəb hərf seçicisi).
// Sonra: qələm hərəkəti ilə yazılış (NameInk; nəsx / rüq‘ə / kufi), barmaqla
// üstündən yazmaq (TraceCanvas), PNG paylaşma kartı (utils/nameCard.js).
// Məna — yalnız lüğətdə dəqiq verilmiş adlarda. "Əbd" + Allahdan başqası olan
// adlarda yumşaq qeyd: İbn Həzmin icması (İbn əl-Qəyyim, "Tuhfətul-məvdud").
// Ad yalnız bu cihazda saxlanır (localStorage 'ncal_last_v1').
// ═══════════════════════════════════════════════════════
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import Icon3D from '../components/Icon3D'
import { useLang } from '../contexts/LangContext'
import Icon from '../components/Icon'
import PageLink from '../components/PageLink'
import NameInk from '../components/trace/NameInk'
import { toArabic, PICKER_LETTERS, PICKER_EXTRA } from '../utils/arabicName'
import { drawNameCard } from '../utils/nameCard'
import { saveBlob, canShareFile, preopenWindow } from '../utils/quoteCard'
import { copyText } from '../components/reader/share'
import { pickUi } from '../utils/uiText'
import '../styles/NameCalligraphy.css'

const TraceCanvas = lazy(() => import('../components/trace/TraceCanvas'))

const STYLES = [
  { id: 'naskh', family: "'Amiri', 'Noto Naskh Arabic', serif", weight: 400, ar: 'نسخ' },
  { id: 'ruqaa', family: "'Aref Ruqaa', 'Amiri', serif", weight: 400, ar: 'رقعة' },
  { id: 'kufi', family: "'Reem Kufi', 'Amiri', sans-serif", weight: 500, ar: 'كوفي' },
]
// Nümunə adlar hər dildə öz yazılışı ilə (başqa dilin hərfi səhifəyə düşməsin)
const EXAMPLES = {
  az: ['Məhəmməd', 'Fatimə', 'Yusif', 'Məryəm', 'Əli', 'Abdurrahman'],
  en: ['Muhammad', 'Fatima', 'Yusuf', 'Maryam', 'Ali', 'Abdurrahman'],
  ru: ['Мухаммад', 'Фатима', 'Юсуф', 'Марьям', 'Али', 'Абдуррахман'],
  ar: ['Muhammad', 'Fatima', 'Yusuf', 'Maryam', 'Ali', 'Abdurrahman'],   // lang-ok: ad latın hərfləri ilə yazılır (giriş sahəsi latın/kiril qəbul edir)
  tr: ['Muhammed', 'Fatma', 'Yusuf', 'Meryem', 'Ali', 'Abdurrahman'],
}
const KEY = 'ncal_last_v1'
// İbn Həzmin sözü (İbn əl-Qəyyim, Tuhfətul-məvdud) — hər dildə ərəbcə əsli göstərilir
const ABD_QUOTE = 'قال أبو محمد بن حزم: «اتفقوا على تحريم كل اسم معبَّد لغير الله كعبد عمرو وعبد الكعبة وما أشبه ذلك، حاشا عبد المطلب».'

const T = {
  az: { ey: 'Ərəb xətti', title: 'Adın ərəb xəttilə', lead: 'Adını yaz — ərəbcə yazılışını qələm hərəkəti ilə gör, barmağınla üstündən yaz və kart kimi paylaş.',
    how: 'Məşhur adlar lüğətdən standart yazılışla gəlir; lüğətdə olmayan adlar təxmini çevrilir — hərf-hərf düzəldə bilərsiniz.',
    label: 'Adınız (latın və ya kiril hərfləri ilə)', ph: 'məs. Məhəmməd', write: 'Yaz', examples: 'Nümunələr:',
    style: 'Xətt üslubu', styles: { naskh: 'Nəsx', ruqaa: 'Rüq‘ə', kufi: 'Kufi' },
    dict: 'Standart ərəb yazılışı (lüğətimizdən).', approx: 'Təxmini yazılış — ərəb dilini bilən birinə yoxladın.', edited: 'Sizin düzəlişinizlə.',
    meaning: 'Mənası', replay: 'Yenidən yaz', edit: 'Hərf-hərf düzəlt', editDone: 'Düzəlişi bağla', trace: 'Özün yaz', traceClose: 'Yazmanı bağla',
    share: 'Kart kimi paylaş', copy: 'Ərəbcə mətni kopyala', copied: 'Kopyalandı', saved: 'Şəkil yükləndi',
    pickLead: 'Hərfə toxunun, sonra aşağıdan yenisini seçin.', add: 'Hərf əlavə et', del: 'Seçilən hərfi sil', space: 'Boşluq', resetEdit: 'Avtomatik yazılışa qayıt',
    suggest: (a) => `Bəlkə «Əbdürrəhman» (${a}) nəzərdə tutursunuz?`, useIt: 'Bunu yaz',
    abdTitle: 'Ad haqqında qısa qeyd',
    abdText: 'Allahdan başqasına «qul» mənası verən adlar (Əbdünnəbi, Əbdülhüseyn və s.) tövsiyə olunmur. İbn Həzm alimlərin bu cür adların haram olduğunda yekdil olduğunu bildirib (yalnız Əbdülmüttəlib istisna edilib). Ən sevimli adlar — Abdullah və Əbdürrəhmandır.',
    cite: 'İbn Həzmdən nəql: İbn əl-Qəyyim, «Tuhfətul-məvdud bi-əhkəmil-məvlud», adlar haqqında fəsil. «Ən sevimli adlar» — Müslim, 2132.',
    traceLead: 'Adınızın üstündən barmaqla yazın — sağdan sola, ən sağdakı hissədən başlayın.',
    aboutTitle: 'Necə işləyir', about: [
      'Lüğətdə 120-dən çox geniş yayılmış müsəlman adı var; azərbaycanca, türkcə, ingiliscə və rusca yazılışları eyni standart ərəb yazılışına bağlanır.',
      'Lüğətdə olmayan ad səslərinə görə çevrilir. Ərəb əlifbasında olmayan səslər (p, g, v, ç) yaxın hərflə yazılır — buna görə nəticə təxminidir.',
      'Məna yalnız adın ərəb sözündən birbaşa gəldiyi və dəqiq bilindiyi hallarda göstərilir.',
      'Ad heç yerə göndərilmir — yalnız bu cihazda saxlanır.',
    // lang-ok[Amiri,Aref,Ruqaa,Reem,Kufi]: şrift adlarıdır
    ], fonts: 'Şriftlər: Amiri, Aref Ruqaa, Reem Kufi (SIL OFL 1.1).', licenses: 'Lisenziyalar', cardEy: 'Adım ərəb xəttilə' },
  en: { ey: 'Arabic calligraphy', title: 'Your name in Arabic calligraphy', lead: 'Type your name — watch it written in Arabic stroke by stroke, trace it with your finger and share it as a card.',
    how: 'Well-known names come from our dictionary with their standard spelling; names not in it are converted approximately — you can fix them letter by letter.',
    label: 'Your name (Latin or Cyrillic letters)', ph: 'e.g. Muhammad', write: 'Write', examples: 'Examples:',
    style: 'Script style', styles: { naskh: 'Naskh', ruqaa: 'Ruqʿah', kufi: 'Kufi' },
    dict: 'Standard Arabic spelling (from our dictionary).', approx: 'Approximate spelling — check with someone who knows Arabic.', edited: 'With your edits.',
    meaning: 'Meaning', replay: 'Write again', edit: 'Edit letter by letter', editDone: 'Close editing', trace: 'Write it yourself', traceClose: 'Close tracing',
    share: 'Share as a card', copy: 'Copy Arabic text', copied: 'Copied', saved: 'Image downloaded',
    pickLead: 'Tap a letter, then choose a new one below.', add: 'Add a letter', del: 'Delete selected letter', space: 'Space', resetEdit: 'Back to the automatic spelling',
    suggest: (a) => `Did you mean “Abdurrahman” (${a})?`, useIt: 'Write this',
    abdTitle: 'A short note about the name',
    abdText: 'Names that make a person a “servant” of other than Allah (Abd an-Nabi, Abd al-Husayn etc.) are not recommended. Ibn Hazm reported that the scholars agreed such names are forbidden (with the single exception of Abd al-Muttalib). The most beloved names are Abdullah and Abdurrahman.',
    cite: 'Ibn Hazm, quoted by Ibn al-Qayyim, Tuhfat al-Mawdud bi-Ahkam al-Mawlud, the chapter on names. “The most beloved names” — Muslim, 2132.',
    traceLead: 'Write over your name with your finger — right to left, starting with the rightmost part.',
    aboutTitle: 'How it works', about: [
      'The dictionary has over 120 widely used Muslim names; their Azerbaijani, Turkish, English and Russian spellings all map to one standard Arabic spelling.',
      'A name that is not in the dictionary is converted by its sounds. Sounds Arabic does not have (p, g, v, ch) are written with the nearest letter — so the result is approximate.',
      'A meaning is shown only when the name comes directly from an Arabic word and the meaning is certain.',
      'Your name is not sent anywhere — it is saved on this device only.',
    // lang-ok[Amiri,Aref,Ruqaa,Reem,Kufi]: şrift adlarıdır
    ], fonts: 'Fonts: Amiri, Aref Ruqaa, Reem Kufi (SIL OFL 1.1).', licenses: 'Licences', cardEy: 'My name in Arabic calligraphy' },
  ru: { ey: 'Арабская каллиграфия', title: 'Ваше имя арабской каллиграфией', lead: 'Введите имя — посмотрите, как оно пишется по-арабски штрих за штрихом, обведите его пальцем и поделитесь карточкой.',
    how: 'Известные имена берутся из нашего словаря в стандартном написании; остальные переводятся приблизительно — их можно исправить по буквам.',
    label: 'Ваше имя (латиницей или кириллицей)', ph: 'напр. Мухаммад', write: 'Написать', examples: 'Примеры:',
    style: 'Стиль письма', styles: { naskh: 'Насх', ruqaa: 'Рук‘а', kufi: 'Куфи' },
    dict: 'Стандартное арабское написание (из нашего словаря).', approx: 'Приблизительное написание — проверьте у знающего арабский.', edited: 'С вашими правками.',
    meaning: 'Значение', replay: 'Написать снова', edit: 'Исправить по буквам', editDone: 'Закрыть правку', trace: 'Напишите сами', traceClose: 'Закрыть письмо',
    share: 'Поделиться карточкой', copy: 'Копировать арабский текст', copied: 'Скопировано', saved: 'Картинка загружена',
    pickLead: 'Нажмите на букву, затем выберите новую ниже.', add: 'Добавить букву', del: 'Удалить выбранную букву', space: 'Пробел', resetEdit: 'Вернуть автоматическое написание',
    suggest: (a) => `Возможно, вы имели в виду «Абдуррахман» (${a})?`, useIt: 'Написать это',
    abdTitle: 'Короткое примечание об имени',
    abdText: 'Имена, делающие человека «рабом» кого-то кроме Аллаха (Абдунаби, Абдульхусейн и т. п.), не рекомендуются. Ибн Хазм передал единогласие учёных о запрете таких имён (единственное исключение — Абдульмутталиб). Самые любимые имена — Абдуллах и Абдуррахман.',
    cite: 'Ибн Хазм, цит. по: Ибн аль-Каййим, «Тухфат аль-маудуд би-ахкам аль-маулюд», глава об именах. «Самые любимые имена» — Муслим, 2132.',
    traceLead: 'Обведите своё имя пальцем — справа налево, начиная с самой правой части.',
    aboutTitle: 'Как это работает', about: [
      'В словаре более 120 распространённых мусульманских имён; азербайджанские, турецкие, английские и русские написания ведут к одному стандартному арабскому.',
      'Имя, которого нет в словаре, переводится по звучанию. Звуки, которых нет в арабском (п, г, в, ч), пишутся ближайшей буквой — поэтому результат приблизительный.',
      'Значение показывается, только если имя прямо происходит от арабского слова и значение известно точно.',
      'Имя никуда не отправляется — оно хранится только на этом устройстве.',
    // lang-ok[Amiri,Aref,Ruqaa,Reem,Kufi]: şrift adlarıdır
    ], fonts: 'Шрифты: Amiri, Aref Ruqaa, Reem Kufi (SIL OFL 1.1).', licenses: 'Лицензии', cardEy: 'Моё имя арабской каллиграфией' },
  ar: { ey: 'الخط العربي', title: 'اسمك بالخط العربي', lead: 'اكتب اسمك لتراه يُكتب بالعربية بحركة القلم، ثم تتبّعه بإصبعك وشاركه بطاقةً.',
    how: 'الأسماء المشهورة تأتي من معجمنا برسمها المعروف، وما ليس فيه يُنقل تقريبيًّا — ويمكنك تصحيحه حرفًا حرفًا.',
    // lang-ok[Muhammad]: istifadəçi adı latınca yazır — nümunə latıncadır
    label: 'اسمك (بالحروف اللاتينية أو الكيريلية)', ph: 'مثل: Muhammad', write: 'اكتب', examples: 'أمثلة:',
    style: 'نوع الخط', styles: { naskh: 'النسخ', ruqaa: 'الرقعة', kufi: 'الكوفي' },
    dict: 'الرسم المعروف للاسم بالعربية (من معجمنا).', approx: 'رسم تقريبي — راجعه مع من يُحسن العربية.', edited: 'بتعديلك.',
    meaning: 'المعنى', replay: 'اكتب مجددًا', edit: 'عدّل حرفًا حرفًا', editDone: 'أغلق التعديل', trace: 'اكتبه بنفسك', traceClose: 'أغلق الكتابة',
    share: 'شارك بطاقةً', copy: 'انسخ النص العربي', copied: 'نُسخ', saved: 'نُزّلت الصورة',
    pickLead: 'اضغط على حرف ثم اختر بديله من الأسفل.', add: 'أضف حرفًا', del: 'احذف الحرف المحدد', space: 'مسافة', resetEdit: 'ارجع إلى الرسم التلقائي',
    suggest: (a) => `لعلك تقصد «عبد الرحمن» (${a})؟`, useIt: 'اكتب هذا',
    abdTitle: 'تنبيه لطيف حول الاسم',
    abdText: 'الأسماء المعبَّدة لغير الله (كعبد النبي وعبد الحسين) لا تُستحسن؛ فقد نقل ابن حزم اتفاق العلماء على تحريم كل اسم معبَّد لغير الله، حاشا عبد المطلب. وأحب الأسماء إلى الله عبد الله وعبد الرحمن.',
    cite: 'ابن القيم، تحفة المودود بأحكام المولود، فصل الأسماء. «أحب الأسماء» — رواه مسلم (2132).',
    traceLead: 'اكتب فوق اسمك بإصبعك — من اليمين إلى اليسار، مبتدئًا بالجزء الأيمن.',
    aboutTitle: 'كيف يعمل', about: [
      'في المعجم أكثر من 120 اسمًا من أسماء المسلمين الشائعة، وتُردّ صيغها الأذربيجانية والتركية والإنجليزية والروسية إلى رسم عربي واحد.',
      'الاسم الذي ليس في المعجم يُنقل بحسب أصواته، وما لا يوجد في العربية من الأصوات يُكتب بأقرب حرف إليه، فالنتيجة تقريبية.',
      'لا يُذكر المعنى إلا إذا كان الاسم مأخوذًا مباشرة من كلمة عربية معلومة المعنى.',
      'لا يُرسل اسمك إلى أي مكان، بل يُحفظ على هذا الجهاز فقط.',
    // lang-ok[Amiri,Aref,Ruqaa,Reem,Kufi]: şrift adlarıdır
    ], fonts: 'الخطوط: Amiri وAref Ruqaa وReem Kufi (رخصة SIL OFL 1.1).', licenses: 'التراخيص', cardEy: 'اسمي بالخط العربي' },
  tr: { ey: 'Arap hattı', title: 'Adın Arap hattıyla', lead: 'Adını yaz — Arapça yazılışını kalem hareketiyle gör, parmağınla üzerinden yaz ve kart olarak paylaş.',
    how: 'Bilinen isimler sözlüğümüzden standart yazılışıyla gelir; sözlükte olmayanlar yaklaşık çevrilir — harf harf düzeltebilirsiniz.',
    label: 'Adınız (Latin veya Kiril harfleriyle)', ph: 'örn. Mehmet', write: 'Yaz', examples: 'Örnekler:',
    style: 'Hat üslubu', styles: { naskh: 'Nesih', ruqaa: 'Rika', kufi: 'Kûfî' },
    dict: 'Standart Arapça yazılış (sözlüğümüzden).', approx: 'Yaklaşık yazılış — Arapça bilen birine kontrol ettirin.', edited: 'Sizin düzeltmenizle.',
    meaning: 'Anlamı', replay: 'Yeniden yaz', edit: 'Harf harf düzelt', editDone: 'Düzeltmeyi kapat', trace: 'Kendin yaz', traceClose: 'Yazmayı kapat',
    share: 'Kart olarak paylaş', copy: 'Arapça metni kopyala', copied: 'Kopyalandı', saved: 'Resim indirildi',
    pickLead: 'Bir harfe dokunun, sonra aşağıdan yenisini seçin.', add: 'Harf ekle', del: 'Seçili harfi sil', space: 'Boşluk', resetEdit: 'Otomatik yazılışa dön',
    suggest: (a) => `“Abdurrahman” (${a}) mı demek istediniz?`, useIt: 'Bunu yaz',
    abdTitle: 'İsim hakkında kısa not',
    abdText: 'Allah’tan başkasına “kul” anlamı veren isimler (Abdünnebi, Abdülhüseyin vb.) tavsiye edilmez. İbn Hazm, âlimlerin bu tür isimlerin haram olduğunda ittifak ettiğini nakletmiştir (yalnızca Abdülmuttalib müstesna). En sevimli isimler Abdullah ve Abdurrahman’dır.',
    cite: 'İbn Hazm’dan nakil: İbnü’l-Kayyim, Tuhfetü’l-Mevdûd bi-Ahkâmi’l-Mevlûd, isimler bölümü. “En sevimli isimler” — Müslim, 2132.',
    traceLead: 'Adınızın üzerinden parmakla yazın — sağdan sola, en sağdaki parçadan başlayarak.',
    aboutTitle: 'Nasıl çalışır', about: [
      'Sözlükte 120’den fazla yaygın Müslüman ismi var; Azerbaycanca, Türkçe, İngilizce ve Rusça yazılışları aynı standart Arapça yazılışa bağlanır.',
      'Sözlükte olmayan isim seslerine göre çevrilir. Arapçada olmayan sesler (p, g, v, ç) en yakın harfle yazılır — bu yüzden sonuç yaklaşıktır.',
      'Anlam yalnızca isim doğrudan Arapça bir kelimeden geliyorsa ve anlamı kesin biliniyorsa gösterilir.',
      'Adınız hiçbir yere gönderilmez — yalnızca bu cihazda saklanır.',
    // lang-ok[Amiri,Aref,Ruqaa,Reem,Kufi]: şrift adlarıdır
    ], fonts: 'Yazı tipleri: Amiri, Aref Ruqaa, Reem Kufi (SIL OFL 1.1).', licenses: 'Lisanslar', cardEy: 'Adım Arap hattıyla' },
}

const loadLast = () => { try { return localStorage.getItem(KEY) || '' } catch { return '' } }

export default function NameCalligraphyPage({ setPage }) {
  const { lang } = useLang()
  const t = pickUi(T, lang, 'en')
  const [input, setInput] = useState('')
  const [name, setName] = useState('')        // təsdiqlənmiş ad
  const [edited, setEdited] = useState(null)   // hərf-hərf düzəliş (null — avtomatik)
  const [styleId, setStyleId] = useState('naskh')
  const [play, setPlay] = useState(0)
  const [editing, setEditing] = useState(false)
  const [sel, setSel] = useState(0)
  const [tracing, setTracing] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => { const last = loadLast(); if (last) { setInput(last); setName(last) } }, [])

  const conv = useMemo(() => toArabic(name), [name])
  const ar = edited ?? conv.ar
  const style = STYLES.find(s => s.id === styleId) || STYLES[0]
  const chars = Array.from(ar)

  const submit = (v) => {
    const val = String(v ?? input).trim().slice(0, 40)
    setInput(val); setName(val); setEdited(null); setEditing(false); setTracing(false); setSel(0); setPlay(p => p + 1); setStatus('')
    try { if (val) localStorage.setItem(KEY, val); else localStorage.removeItem(KEY) } catch { /* yaddaş bağlıdır */ }
  }

  // ── Hərf-hərf düzəliş ──
  const setChars = (arr) => { setEdited(arr.join('').replace(/\s+/g, ' ')); setPlay(p => p + 1) }
  const pickLetter = (ch) => {
    const arr = [...chars]
    if (!arr.length) { setChars([ch]); setSel(0); return }
    arr[Math.min(sel, arr.length - 1)] = ch
    setChars(arr)
  }
  const addLetter = () => { const arr = [...chars, 'ا']; setChars(arr); setSel(arr.length - 1) }
  const delLetter = () => {
    if (!chars.length) return
    const arr = chars.filter((_, i) => i !== sel)
    setChars(arr); setSel(Math.max(0, Math.min(sel, arr.length - 1)))
  }

  const share = async () => {
    if (!ar) return
    const win = preopenWindow()
    try {
      const fam = (style.family.match(/'([^']+)'/) || [])[1]
      if (fam && document.fonts?.load) await document.fonts.load(`${style.weight} 200px "${fam}"`, ar).catch(() => {})
      const c = document.createElement('canvas'); c.width = 1080; c.height = 1350
      drawNameCard(c.getContext('2d'), { ar, latin: name || input, family: style.family, weight: style.weight, eyebrow: t.cardEy })
      const blob = await new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'))
      const file = new File([blob], 'muslims-cc-name.png', { type: 'image/png' })
      if (canShareFile(file)) {
        try { await navigator.share({ files: [file] }); win?.close(); return } catch (e) { if (e?.name === 'AbortError') { win?.close(); return } }
      }
      saveBlob(blob, file.name, win)
      setStatus(t.saved)
    } catch { win?.close() }
  }
  const copy = async () => { if (ar && await copyText(ar)) setStatus(t.copied) }

  const kind = edited != null ? 'edited' : conv.approximate ? 'approx' : 'dict'

  return (
    <>
      <header className="ui-page-hero ncal-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <Icon3D name="namecalligraphy" size={60} className="ui-hero-i3d" />
            <span className="ui-eyebrow">{t.ey}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{t.lead}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} /> {t.how}</p>
          </div>
        </div>
      </header>

      <section className="ui-section">
        <div className="ui-container ncal">
          <form className="ncal-form" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <label htmlFor="ncal-input">{t.label}</label>
            <div className="ncal-form__row">
              <input id="ncal-input" className="ui-input" type="text" value={input} maxLength={40} autoComplete="given-name" spellCheck={false}
                placeholder={t.ph} onChange={(e) => setInput(e.target.value)} dir="auto" />
              <button type="submit" className="ui-btn ui-btn--primary" disabled={!input.trim()}>
                <Icon name="edit" className="ui-btn__icon" /> {t.write}
              </button>
            </div>
            <div className="ncal-examples">
              <span>{t.examples}</span>
              {(EXAMPLES[lang] || EXAMPLES.en).map(x => <button key={x} type="button" className="ui-chip" onClick={() => submit(x)}>{x}</button>)}
            </div>
          </form>

          {ar && (
            <>
              <div className="ncal-frame" data-testid="ncal-frame">
                <svg className="ncal-frame__pattern" aria-hidden="true" focusable="false">
                  <defs>
                    <pattern id="ncal-star" width="28" height="28" patternUnits="userSpaceOnUse">
                      <g fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="8" y="8" width="12" height="12" />
                        <rect x="8" y="8" width="12" height="12" transform="rotate(45 14 14)" />
                      </g>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#ncal-star)" />
                </svg>
                <div className="ncal-frame__inner">
                  <NameInk key={`${play}-${styleId}-${ar}`} text={ar} family={style.family} weight={style.weight} />
                  <p className="ncal-latin">{name}</p>
                </div>
              </div>

              <div className="ncal-styles" role="radiogroup" aria-label={t.style}>
                {STYLES.map(s => (
                  <button key={s.id} type="button" role="radio" aria-checked={styleId === s.id} className="ui-chip" aria-pressed={styleId === s.id}
                    onClick={() => { setStyleId(s.id); setPlay(p => p + 1) }}>
                    {t.styles[s.id]} <b lang="ar" style={{ fontFamily: s.family, fontWeight: s.weight }}>{s.ar}</b>
                  </button>
                ))}
              </div>

              <p className={`ncal-status ncal-status--${kind === 'dict' ? 'ok' : 'warn'}`} data-testid="ncal-status" data-kind={kind}>
                <Icon name={kind === 'dict' ? 'check' : 'alert'} size={18} />
                <span>{kind === 'dict' ? t.dict : kind === 'edited' ? `${t.edited} ${t.approx}` : t.approx}</span>
              </p>

              {kind === 'dict' && conv.mean && (
                <p className="ncal-mean" data-testid="ncal-meaning"><b>{t.meaning}:</b> {pickUi(conv.mean, lang, 'en')}</p>
              )}

              {conv.suggest && (
                <p className="ncal-status ncal-status--ok">
                  <Icon name="bulb" size={18} />
                  <span>{t.suggest(conv.suggest)}{' '}<button type="button" className="ui-link" onClick={() => submit('Abdurrahman')}>{t.useIt}</button></span>
                </p>
              )}

              {conv.abdNote && (
                <aside className="ncal-note" aria-label={t.abdTitle} data-testid="ncal-abd-note">
                  <p><b>{t.abdTitle}.</b> {t.abdText}</p>
                  <p className="ncal-note__ar" lang="ar" dir="rtl">{ABD_QUOTE}</p>
                  <cite>{t.cite}</cite>
                </aside>
              )}

              <div className="ncal-actions">
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setPlay(p => p + 1)}>
                  <Icon name="refresh" className="ui-btn__icon" /> {t.replay}
                </button>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" aria-expanded={editing} onClick={() => setEditing(v => !v)}>
                  <Icon name="type" className="ui-btn__icon" /> {editing ? t.editDone : t.edit}
                </button>
                <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" aria-expanded={tracing} onClick={() => setTracing(v => !v)}>
                  <Icon name="touch" className="ui-btn__icon" /> {tracing ? t.traceClose : t.trace}
                </button>
                <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" onClick={share}>
                  <Icon name="share" className="ui-btn__icon" /> {t.share}
                </button>
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={copy}>
                  <Icon name="copy" className="ui-btn__icon" /> {t.copy}
                </button>
              </div>
              <p className="ncal-sub" role="status">{status}</p>

              {editing && (
                <div className="ncal-edit" data-testid="ncal-edit">
                  <p className="ncal-sub">{t.pickLead}</p>
                  <div className="ncal-edit__word" lang="ar">
                    {chars.map((c, i) => (
                      <button key={i} type="button" className={`ncal-edit__ch${c === ' ' ? ' ncal-edit__ch--space' : ''}`} aria-pressed={sel === i}
                        aria-label={c === ' ' ? t.space : c} onClick={() => setSel(i)}>{c === ' ' ? '␣' : c}</button>
                    ))}
                  </div>
                  <div className="ncal-edit__picker" lang="ar">
                    {[...PICKER_LETTERS, ...PICKER_EXTRA].map(c => <button key={c} type="button" onClick={() => pickLetter(c)}>{c}</button>)}
                    <button type="button" onClick={() => pickLetter(' ')} aria-label={t.space} style={{ fontFamily: 'system-ui', fontSize: '.85rem' }}>{t.space}</button>
                  </div>
                  <div className="ncal-edit__bar">
                    <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={addLetter}><Icon name="plus" className="ui-btn__icon" /> {t.add}</button>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={delLetter} disabled={!chars.length}><Icon name="trash" className="ui-btn__icon" /> {t.del}</button>
                    {edited != null && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setEdited(null); setPlay(p => p + 1) }}><Icon name="refresh" className="ui-btn__icon" /> {t.resetEdit}</button>}
                  </div>
                </div>
              )}

              {tracing && ar.trim() && (
                <div className="ncal-trace">
                  <p className="ncal-sub">{t.traceLead}</p>
                  <Suspense fallback={<div className="ui-skeleton" style={{ height: 300 }} />}>
                    <TraceCanvas key={`${ar}-${styleId}`} text={ar.trim()} kind="word" font={style.family} weight={style.weight} lang={lang} label={name} />
                  </Suspense>
                </div>
              )}
            </>
          )}

          <section className="ncal-about ui-card" aria-labelledby="ncal-about-h">
            <h2 id="ncal-about-h" className="ui-title ui-title--sm">{t.aboutTitle}</h2>
            <ul>{t.about.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <p className="ncal-sub">
              {t.fonts} <PageLink to="licenses" setPage={setPage} className="ui-link">{t.licenses}</PageLink>
            </p>
          </section>
        </div>
      </section>
    </>
  )
}
