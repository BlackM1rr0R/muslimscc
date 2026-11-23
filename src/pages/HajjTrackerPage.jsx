// ═══════════════════════════════════════════════════════
// /hajj-tracker — Həcc ailə izləyicisi (server/hajjJourney.js). noindex.
//
//   (girişli)  zəvvar: "Həcc / Ümrə səfəri" açır, mərhələyə toxunur, ailə dairəsi ilə və ya gizli keçidlə paylaşır,
//              fasilə verir, dayandırır (silinir). Ailə üzvü: dairədəki zəvvarların cari mərhələsi (canlı).
//   #h=<token> — gizli keçid (girişsiz baxış). Token URL FRAQMENTİNDƏDİR, serverə POST gövdəsində gedir.
// • Canlı: 30 s polling + ETag (304), yalnız səhifə görünəndə. YER HEÇ VAXT soruşulmur və göndərilmir.
// • Hər mərhələ üçün dua YALNIZ saytın Hisnul-Müslim məlumatındandır (components/p3/HisnItems, mənbə ilə);
//   Hisnul-Müslimdə xüsusi dua olmayan mərhələdə bu açıq deyilir və Həcc bələdçisinə keçid verilir.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import { useAuthUser, refreshMe } from '../api/userSession'
import {
  getHajjJourney, startHajjJourney, setHajjStage, setHajjShare, createHajjLink, revokeHajjLink, stopHajjJourney,
  pollHajjFamily, pollHajjLink, AuthError,
} from '../api/p3'
import HisnItems, { useHisn } from '../components/p3/HisnItems'
import { Confirm, Msg, Loading, SignInCard, fmtDate, fmtTime } from '../components/p3/p3Ui'
import '../styles/Account.css'
import '../styles/ReadTogether.css'
import '../styles/P3.css'

export const STAGES = {
  hajj: ['ihram', 'arrive_makkah', 'tawaf_qudum', 'sai', 'mina_8', 'arafah', 'muzdalifah', 'jamarat', 'hady', 'halq', 'tawaf_ifadah', 'tawaf_wada'],
  umrah: ['ihram', 'arrive_makkah', 'tawaf', 'sai', 'halq'],
}
// Mərhələ → Hisnul-Müslim fəsilləri (public/data/hisn): 116 təlbiyə, 117 Həcərül-Əsvəd küncündə təkbir,
// 118 Yəmani küncü ilə Həcərül-Əsvəd arası, 119 Səfa və Mərvə, 120 Ərəfə günü, 121 Məşəril-Haram, 122 cəmrələr.
// Məkkəyə çatmaq, Mina (8-ci gün), saçın qırxılması — Hisnda xüsusi fəsil yoxdur → boş.
export const STAGE_HISN = {
  ihram: [116], arrive_makkah: [], tawaf_qudum: [117, 118], mina_8: [], arafah: [120], muzdalifah: [121], jamarat: [122],
  tawaf_ifadah: [117, 118], tawaf_wada: [117, 118], tawaf: [117, 118], sai: [119], hady: [], halq: [],
}
const POLL_MS = 30000
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/
export const parseHajjHash = (hash) => {
  const m = /(?:^#|&)h=([A-Za-z0-9_-]{43})(?:&|$)/.exec(String(hash || ''))
  return m && TOKEN_RE.test(m[1]) ? m[1] : null
}

export const HT = {
  az: {
    eyebrow: 'Həcc və Ümrə', title: 'Həcc ailə izləyicisi',
    lead: 'Zəvvar mərhələləri özü qeyd edir, ailəsi isə hansı mərhələdə olduğunu və o mərhələ üçün Sünnədən nəqlini görür. Yer məlumatı heç vaxt paylaşılmır.',
    kinds: { hajj: 'Həcc', umrah: 'Ümrə' },
    stages: { ihram: 'İhram', arrive_makkah: 'Məkkəyə çatdı', tawaf_qudum: 'Qudum (ümrə) təvafı', mina_8: 'Mina, 8 Zülhiccə', arafah: 'Ərəfə günü', muzdalifah: 'Müzdəlifə', jamarat: 'Cəmrələrə daş atmaq', tawaf_ifadah: 'İfadə təvafı', tawaf_wada: 'Vida təvafı', tawaf: 'Təvaf', sai: 'Səfa ilə Mərvə arasında səy', hady: 'Qurban (hədy) kəsmək', halq: 'Saçı qırxmaq və ya qısaltmaq' },
    mine: 'Mənim səfərim', start: 'Səfərə başla', kind: 'Növ', name: 'Keçiddə görünən ad (istəyə bağlı)', namePh: 'məs. Atam',
    shareFamily: 'Ailə dairəmlə paylaş', noCircle: 'Ailə dairəniz yoxdur — onu hesab səhifəsində yarada bilərsiniz. Gizli keçid ilə də paylaşa bilərsiniz.', openFamily: 'Ailə dairəsi',
    consent: 'Razıyam: muslims.cc serverində səfərin növü, seçdiyim ad, mərhələlər və onların vaxtı saxlanılsın və paylaşdığım insanlara göstərilsin. Yer saxlanılmır. 30 gündən sonra və ya dayandıranda silinir.',
    consentNeed: 'Əvvəlcə razılığı təsdiqləyin.',
    tapStage: 'Olduğunuz mərhələyə toxunun:', current: 'İndiki mərhələ', notStarted: 'Hələ mərhələ seçilməyib', updated: (x) => `Yeniləndi: ${x}`,
    expires: (d) => `Paylaşma ${d} tarixində avtomatik bitir`,
    share: 'Paylaşma', pause: 'Paylaşmaya fasilə ver', paused: 'Paylaşma dayandırılıb', pausedNote: 'Baxanlar yalnız paylaşmanın dayandırıldığını görür.',
    link: 'Gizli keçid', linkNew: 'Gizli keçid yarat', linkAgain: 'Yeni keçid yarat (köhnəsi işləməyəcək)', linkRevoke: 'Keçidi ləğv et',
    linkNote: 'Keçidi olan hər kəs girişsiz baxa bilər. Keçid yalnız indi göstərilir — sonra yenisini yarada bilərsiniz.', linkOn: 'Gizli keçid aktivdir.', copy: 'Kopyala', copied: 'Kopyalandı',
    stop: 'Səfəri dayandır və sil', stopAsk: 'Dayandırırsınız? Səfər və paylaşma silinir.', yes: 'Bəli', cancel: 'Ləğv et', stopped: 'Səfər silindi.',
    family: 'Ailədəki zəvvarlar', familyNone: 'Ailə dairənizdə hazırda paylaşılan səfər yoxdur.',
    dua: 'Bu mərhələ üçün Sünnədən (Hisnul-Müslim)', noDua: 'Hisnul-Müslimdə bu mərhələ üçün xüsusi dua yoxdur.', guide: 'Həcc bələdçisi', openHisn: 'Hisnul-Müslimdə aç',
    viewTitle: 'Zəvvarın səfəri', pilgrim: 'Zəvvar', invalid: 'Bu keçid artıq etibarlı deyil (ləğv olunub və ya vaxtı bitib).',
    live: 'Canlı — hər 30 saniyədə yenilənir', signIn: 'Səfərə başlamaq və ya ailənizin səfərini görmək üçün daxil olun.', signInBtn: 'Daxil ol',
    loading: 'Yüklənir…', failed: 'Alınmadı. Bir az sonra yenidən cəhd edin.', back: 'Hesaba qayıt',
  },
  en: {
    eyebrow: 'Hajj and Umrah', title: 'Hajj family tracker',
    lead: 'The pilgrim marks each stage, and the family sees which stage they are at, together with what the Sunnah reports for that stage. Location is never shared.',
    kinds: { hajj: 'Hajj', umrah: 'Umrah' },
    stages: { ihram: 'Ihram', arrive_makkah: 'Arrived in Makkah', tawaf_qudum: 'Arrival tawaf (qudum / umrah)', mina_8: 'Mina, 8th Dhul-Hijjah', arafah: 'Day of Arafah', muzdalifah: 'Muzdalifah', jamarat: 'Stoning the Jamarat', tawaf_ifadah: 'Tawaf al-Ifadah', tawaf_wada: 'Farewell tawaf', tawaf: 'Tawaf', sai: 'Sa’i between Safa and Marwah', hady: 'Slaughtering the offering (hady)', halq: 'Shaving or shortening the hair' },
    mine: 'My journey', start: 'Start journey', kind: 'Type', name: 'Name shown on the link (optional)', namePh: 'e.g. Dad',
    shareFamily: 'Share with my family circle', noCircle: 'You have no family circle yet — you can create one on the account page. You can also share with a secret link.', openFamily: 'Family circle',
    consent: 'I agree that muslims.cc stores on its server the journey type, the name I chose, the stages and their times, and shows them to the people I share with. No location is stored. It is deleted after 30 days or when I stop.',
    consentNeed: 'Please confirm your consent first.',
    tapStage: 'Tap the stage you are at:', current: 'Current stage', notStarted: 'No stage chosen yet', updated: (x) => `Updated: ${x}`,
    expires: (d) => `Sharing ends automatically on ${d}`,
    share: 'Sharing', pause: 'Pause sharing', paused: 'Sharing is paused', pausedNote: 'Viewers only see that sharing is paused.',
    link: 'Secret link', linkNew: 'Create a secret link', linkAgain: 'Create a new link (the old one stops working)', linkRevoke: 'Revoke link',
    linkNote: 'Anyone with the link can view without signing in. The link is shown only now — you can create a new one later.', linkOn: 'A secret link is active.', copy: 'Copy', copied: 'Copied',
    stop: 'Stop and delete journey', stopAsk: 'Stop? The journey and its sharing are deleted.', yes: 'Yes', cancel: 'Cancel', stopped: 'The journey was deleted.',
    family: 'Pilgrims in my family', familyNone: 'No journey is being shared in your family circle right now.',
    dua: 'From the Sunnah for this stage (Hisn al-Muslim)', noDua: 'Hisn al-Muslim has no specific dua for this stage.', guide: 'Hajj guide', openHisn: 'Open in Hisn al-Muslim',
    viewTitle: 'Pilgrim’s journey', pilgrim: 'Pilgrim', invalid: 'This link is no longer valid (it was revoked or has expired).',
    live: 'Live — updates every 30 seconds', signIn: 'Sign in to start a journey or to follow your family’s journey.', signInBtn: 'Sign in',
    loading: 'Loading…', failed: 'Something went wrong. Please try again later.', back: 'Back to account',
  },
  ru: {
    eyebrow: 'Хадж и умра', title: 'Хадж: трекер для семьи',
    lead: 'Паломник сам отмечает этапы, а семья видит, на каком он этапе, и то, что передано из Сунны для этого этапа. Местоположение никогда не передаётся.',
    kinds: { hajj: 'Хадж', umrah: 'Умра' },
    stages: { ihram: 'Ихрам', arrive_makkah: 'Прибыл в Мекку', tawaf_qudum: 'Таваф прибытия (кудум / умра)', mina_8: 'Мина, 8 зуль-хиджа', arafah: 'День Арафа', muzdalifah: 'Муздалифа', jamarat: 'Бросание камней в джамараты', tawaf_ifadah: 'Таваф аль-ифада', tawaf_wada: 'Прощальный таваф', tawaf: 'Таваф', sai: 'Сай между Сафой и Марвой', hady: 'Жертвоприношение (хадй)', halq: 'Бритьё или укорачивание волос' },
    mine: 'Моё путешествие', start: 'Начать путешествие', kind: 'Вид', name: 'Имя по ссылке (необязательно)', namePh: 'напр. Папа',
    shareFamily: 'Показывать моему семейному кругу', noCircle: 'У вас пока нет семейного круга — его можно создать на странице аккаунта. Можно также поделиться тайной ссылкой.', openFamily: 'Семейный круг',
    consent: 'Я согласен, что muslims.cc хранит на сервере вид путешествия, выбранное имя, этапы и их время и показывает их тем, с кем я делюсь. Местоположение не хранится. Всё удаляется через 30 дней или при остановке.',
    consentNeed: 'Сначала подтвердите согласие.',
    tapStage: 'Нажмите на этап, на котором вы сейчас:', current: 'Текущий этап', notStarted: 'Этап ещё не выбран', updated: (x) => `Обновлено: ${x}`,
    expires: (d) => `Показ автоматически закончится ${d}`,
    share: 'Доступ', pause: 'Приостановить показ', paused: 'Показ приостановлен', pausedNote: 'Зрители видят только, что показ приостановлен.',
    link: 'Тайная ссылка', linkNew: 'Создать тайную ссылку', linkAgain: 'Создать новую ссылку (старая перестанет работать)', linkRevoke: 'Отозвать ссылку',
    linkNote: 'Любой, у кого есть ссылка, может смотреть без входа. Ссылка показывается только сейчас — позже можно создать новую.', linkOn: 'Тайная ссылка активна.', copy: 'Копировать', copied: 'Скопировано',
    stop: 'Остановить и удалить', stopAsk: 'Остановить? Путешествие и доступ к нему будут удалены.', yes: 'Да', cancel: 'Отмена', stopped: 'Путешествие удалено.',
    family: 'Паломники в моей семье', familyNone: 'Сейчас в вашем семейном круге никто не делится путешествием.',
    dua: 'Из Сунны для этого этапа («Хисн аль-муслим»)', noDua: 'В «Хисн аль-муслим» нет особого дуа для этого этапа.', guide: 'Путеводитель по хаджу', openHisn: 'Открыть в «Хисн аль-муслим»',
    viewTitle: 'Путешествие паломника', pilgrim: 'Паломник', invalid: 'Эта ссылка больше не действует (отозвана или истекла).',
    live: 'В реальном времени — обновляется каждые 30 секунд', signIn: 'Войдите, чтобы начать путешествие или следить за путешествием семьи.', signInBtn: 'Войти',
    loading: 'Загрузка…', failed: 'Не получилось. Попробуйте позже.', back: 'Назад в аккаунт',
  },
  tr: {
    eyebrow: 'Hac ve Umre', title: 'Hac aile takipçisi',
    lead: 'Hacı aşamaları kendisi işaretler; ailesi hangi aşamada olduğunu ve o aşama için Sünnet’ten nakledileni görür. Konum asla paylaşılmaz.',
    kinds: { hajj: 'Hac', umrah: 'Umre' },
    stages: { ihram: 'İhram', arrive_makkah: 'Mekke’ye vardı', tawaf_qudum: 'Varış (kudüm / umre) tavafı', mina_8: 'Mina, 8 Zilhicce', arafah: 'Arefe günü', muzdalifah: 'Müzdelife', jamarat: 'Cemrelere taş atma', tawaf_ifadah: 'İfâda tavafı', tawaf_wada: 'Veda tavafı', tawaf: 'Tavaf', sai: 'Safa ile Merve arasında say', hady: 'Kurban (hedy) kesmek', halq: 'Saçları tıraş etmek veya kısaltmak' },
    mine: 'Yolculuğum', start: 'Yolculuğa başla', kind: 'Tür', name: 'Bağlantıda görünen ad (isteğe bağlı)', namePh: 'ör. Babam',
    shareFamily: 'Aile çevremle paylaş', noCircle: 'Henüz aile çevreniz yok — hesap sayfasında oluşturabilirsiniz. Gizli bağlantıyla da paylaşabilirsiniz.', openFamily: 'Aile çevresi',
    consent: 'muslims.cc sunucusunda yolculuk türünün, seçtiğim adın, aşamaların ve zamanlarının saklanmasını ve paylaştığım kişilere gösterilmesini kabul ediyorum. Konum saklanmaz. 30 gün sonra veya durdurduğumda silinir.',
    consentNeed: 'Önce onayınızı verin.',
    tapStage: 'Bulunduğunuz aşamaya dokunun:', current: 'Şimdiki aşama', notStarted: 'Henüz aşama seçilmedi', updated: (x) => `Güncellendi: ${x}`,
    expires: (d) => `Paylaşım ${d} tarihinde otomatik olarak biter`,
    share: 'Paylaşım', pause: 'Paylaşıma ara ver', paused: 'Paylaşım durduruldu', pausedNote: 'İzleyenler yalnızca paylaşımın durdurulduğunu görür.',
    link: 'Gizli bağlantı', linkNew: 'Gizli bağlantı oluştur', linkAgain: 'Yeni bağlantı oluştur (eskisi çalışmaz)', linkRevoke: 'Bağlantıyı iptal et',
    linkNote: 'Bağlantıya sahip herkes giriş yapmadan izleyebilir. Bağlantı yalnızca şimdi gösterilir — sonra yenisini oluşturabilirsiniz.', linkOn: 'Gizli bağlantı etkin.', copy: 'Kopyala', copied: 'Kopyalandı',
    stop: 'Yolculuğu durdur ve sil', stopAsk: 'Durduruyor musunuz? Yolculuk ve paylaşımı silinir.', yes: 'Evet', cancel: 'Vazgeç', stopped: 'Yolculuk silindi.',
    family: 'Ailemdeki hacılar', familyNone: 'Aile çevrenizde şu anda paylaşılan bir yolculuk yok.',
    dua: 'Bu aşama için Sünnet’ten (Hısnu’l-Müslim)', noDua: 'Hısnu’l-Müslim’de bu aşama için özel bir dua yok.', guide: 'Hac rehberi', openHisn: 'Hısnu’l-Müslim’de aç',
    viewTitle: 'Hacının yolculuğu', pilgrim: 'Hacı', invalid: 'Bu bağlantı artık geçerli değil (iptal edildi veya süresi doldu).',
    live: 'Canlı — her 30 saniyede güncellenir', signIn: 'Yolculuğa başlamak veya ailenizin yolculuğunu izlemek için giriş yapın.', signInBtn: 'Giriş yap',
    loading: 'Yükleniyor…', failed: 'Olmadı. Biraz sonra tekrar deneyin.', back: 'Hesaba dön',
  },
  ar: {
    eyebrow: 'الحج والعمرة', title: 'متابعة الحج للعائلة',
    lead: 'يسجّل الحاج المراحل بنفسه، وترى عائلته المرحلة التي هو فيها مع ما ورد في تلك المرحلة. لا يُشارَك الموقع أبدًا.',
    kinds: { hajj: 'الحج', umrah: 'العمرة' },
    stages: { ihram: 'الإحرام', arrive_makkah: 'الوصول إلى مكة', tawaf_qudum: 'طواف القدوم (العمرة)', mina_8: 'منى، الثامن من ذي الحجة', arafah: 'يوم عرفة', muzdalifah: 'مزدلفة', jamarat: 'رمي الجمرات', tawaf_ifadah: 'طواف الإفاضة', tawaf_wada: 'طواف الوداع', tawaf: 'الطواف', sai: 'السعي بين الصفا والمروة', hady: 'ذبح الهدي', halq: 'الحلق أو التقصير' },
    mine: 'رحلتي', start: 'ابدأ الرحلة', kind: 'النوع', name: 'الاسم الظاهر في الرابط (اختياري)', namePh: 'مثل: أبي',
    shareFamily: 'شارك مع دائرة عائلتي', noCircle: 'ليست لديك دائرة عائلية بعد — يمكنك إنشاؤها في صفحة الحساب. ويمكنك أيضًا المشاركة برابط سري.', openFamily: 'دائرة العائلة',
    consent: 'أوافق على أن يحفظ muslims.cc على خادمه نوع الرحلة والاسم الذي اخترته والمراحل وأوقاتها، وأن يعرضها لمن أشاركهم. لا يُحفظ الموقع. تُحذف بعد 30 يومًا أو عند الإيقاف.',
    consentNeed: 'يرجى تأكيد الموافقة أولًا.',
    tapStage: 'اضغط على المرحلة التي أنت فيها:', current: 'المرحلة الحالية', notStarted: 'لم تُختر مرحلة بعد', updated: (x) => `آخر تحديث: ${x}`,
    expires: (d) => `تنتهي المشاركة تلقائيًا في ${d}`,
    share: 'المشاركة', pause: 'إيقاف المشاركة مؤقتًا', paused: 'المشاركة متوقفة مؤقتًا', pausedNote: 'يرى المتابعون فقط أن المشاركة متوقفة.',
    link: 'رابط سري', linkNew: 'أنشئ رابطًا سريًا', linkAgain: 'أنشئ رابطًا جديدًا (يتوقف القديم)', linkRevoke: 'ألغِ الرابط',
    linkNote: 'يستطيع كل من لديه الرابط المتابعة دون تسجيل الدخول. يظهر الرابط الآن فقط — ويمكنك إنشاء رابط جديد لاحقًا.', linkOn: 'يوجد رابط سري فعّال.', copy: 'نسخ', copied: 'تم النسخ',
    stop: 'أوقف الرحلة واحذفها', stopAsk: 'هل توقفها؟ تُحذف الرحلة ومشاركتها.', yes: 'نعم', cancel: 'إلغاء', stopped: 'حُذفت الرحلة.',
    family: 'الحجاج في عائلتي', familyNone: 'لا توجد رحلة مشارَكة في دائرة عائلتك الآن.',
    dua: 'ما ورد في هذه المرحلة (حصن المسلم)', noDua: 'لا يوجد في حصن المسلم دعاء خاص بهذه المرحلة.', guide: 'دليل الحج', openHisn: 'افتح في حصن المسلم',
    viewTitle: 'رحلة الحاج', pilgrim: 'حاج', invalid: 'هذا الرابط لم يعد صالحًا (أُلغي أو انتهت مدته).',
    live: 'مباشر — يُحدَّث كل 30 ثانية', signIn: 'سجّل الدخول لبدء رحلة أو لمتابعة رحلة عائلتك.', signInBtn: 'تسجيل الدخول',
    loading: 'جارٍ التحميل…', failed: 'لم ينجح ذلك. حاول مرة أخرى لاحقًا.', back: 'العودة إلى الحساب',
  },
}

/** Görünən səhifədə ETag ilə polling. fetcher(etag, signal) → { notModified } | { data, etag } */
function useTaggedPoll(fetcher, key, doneWhen = null) {
  const [state, setState] = useState({ data: null, error: null })
  const fRef = useRef(fetcher)
  fRef.current = fetcher
  useEffect(() => {
    if (!key) return undefined
    let alive = true, etag = '', timer = 0, busy = false, stop = false
    const ctrl = new AbortController()
    const tick = async () => {
      clearTimeout(timer)
      if (!alive || busy || stop) return
      if (document.visibilityState === 'hidden') { timer = setTimeout(tick, POLL_MS); return }
      busy = true
      try {
        const r = await fRef.current(etag, ctrl.signal)
        if (alive && !r.notModified) { etag = r.etag; setState({ data: r.data, error: null }); if (doneWhen && doneWhen(r.data)) stop = true }
      } catch (e) {
        if (!alive || e?.name === 'AbortError') return
        if (e instanceof AuthError && (e.status === 404 || e.status === 401 || e.status === 403)) stop = true
        setState((s) => ({ ...s, error: e }))
      } finally { busy = false }
      if (alive && !stop) timer = setTimeout(tick, POLL_MS)
    }
    const vis = () => { if (document.visibilityState === 'visible') tick() }
    tick()
    document.addEventListener('visibilitychange', vis)
    return () => { alive = false; clearTimeout(timer); ctrl.abort(); document.removeEventListener('visibilitychange', vis) }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return state
}

function StageDua({ stage, t, lang, siteLang, hisn }) {
  const ids = STAGE_HISN[stage] || []
  return (
    <div className="p3-dua" data-testid="ht-dua">
      <h3 className="p3-dua__h"><Icon name="hisn" size={18} /> {t.dua}</h3>
      {ids.length ? (hisn === false ? <p className="rt-note">{t.failed}</p> : <HisnItems map={hisn} ids={ids} lang={lang} siteLang={siteLang} openLabel={t.openHisn} testId="ht-hisn" />) : (
        <p className="rt-note" data-testid="ht-nodua">{t.noDua} <a href={pathFor('hajjguide', siteLang)}>{t.guide}</a></p>
      )}
    </div>
  )
}

/** Baxan üçün: mərhələ zolağı + cari mərhələnin duası */
function JourneyView({ j, t, lang, siteLang, hisn, testId }) {
  const list = STAGES[j.kind] || []
  const done = new Set((j.history || []).map((h) => h.s))
  return (
    <div className="p3-view" data-testid={testId}>
      <p className="p3-view__who"><Icon name="user" size={16} /> <bdi>{j.name || t.pilgrim}</bdi> · {t.kinds[j.kind]}</p>
      {j.paused ? <p className="p3-paused" data-testid="ht-paused"><Icon name="pause" size={16} /> {t.paused}</p> : (
        <>
          <p className="p3-view__cur"><span className="ui-eyebrow">{t.current}</span><strong>{j.stage ? t.stages[j.stage] : t.notStarted}</strong>
            {j.stageAt ? <small className="rt-note"> {t.updated(fmtTime(j.stageAt, lang))}</small> : null}</p>
          <ol className="p3-steps">
            {list.map((s) => (
              <li key={s} className={`p3-step${s === j.stage ? ' is-current' : done.has(s) ? ' is-done' : ''}`} aria-current={s === j.stage ? 'step' : undefined}>
                <span className="p3-step__dot" aria-hidden="true">{done.has(s) && s !== j.stage ? <Icon name="check" size={12} /> : null}</span>
                <span>{t.stages[s]}</span>
              </li>
            ))}
          </ol>
          {j.stage && <StageDua stage={j.stage} t={t} lang={lang} siteLang={siteLang} hisn={hisn} />}
        </>
      )}
    </div>
  )
}

function LinkViewer({ token, t, lang, siteLang }) {
  const fetcher = useCallback((etag, signal) => pollHajjLink(token, etag, signal), [token])
  const { data, error } = useTaggedPoll(fetcher, token)
  const hisn = useHisn(lang, Boolean(data?.journey?.stage))
  if (error && !data) {
    const invalid = error instanceof AuthError && error.status === 404
    return <p className="rt-msg" role="alert" data-testid="ht-link-error">{invalid ? t.invalid : t.failed}</p>
  }
  if (!data) return <Loading label={t.loading} />
  return (
    <section className="ui-card acc-section" aria-labelledby="ht-view-h">
      <h2 className="acc-section__title" id="ht-view-h">{t.viewTitle}</h2>
      {error && error instanceof AuthError && error.status === 404 ? <p className="rt-msg" role="alert">{t.invalid}</p> : null}
      <JourneyView j={data.journey} t={t} lang={lang} siteLang={siteLang} hisn={hisn} testId="ht-link-view" />
      <p className="rt-note p3-live"><span className="p3-live__dot" aria-hidden="true" /> {t.live}</p>
    </section>
  )
}

function FamilyJourneys({ t, lang, siteLang }) {
  const { data } = useTaggedPoll(pollHajjFamily, 'family', (d) => !d?.inCircle)
  const list = data?.journeys || []
  const hisn = useHisn(lang, list.some((j) => j.stage))
  if (!data?.inCircle) return null
  return (
    <section className="ui-card acc-section" aria-labelledby="ht-fam-h" data-testid="ht-family">
      <h2 className="acc-section__title" id="ht-fam-h"><Icon name="user" size={18} /> {t.family}</h2>
      {list.length ? list.map((j) => <JourneyView key={j.id} j={j} t={t} lang={lang} siteLang={siteLang} hisn={hisn} testId="ht-family-item" />)
        : <p className="rt-note">{t.familyNone}</p>}
      {list.length > 0 && <p className="rt-note p3-live"><span className="p3-live__dot" aria-hidden="true" /> {t.live}</p>}
    </section>
  )
}

function MyJourney({ t, lang, siteLang }) {
  const [s, setS] = useState(null)
  const [form, setForm] = useState({ kind: 'hajj', name: '', family: true, consent: false })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const j = s?.journey
  const hisn = useHisn(lang, Boolean(j?.stage))
  const load = useCallback(() => getHajjJourney().then(setS).catch(() => setS(false)), [])
  useEffect(() => { load() }, [load])
  const run = async (fn, ok) => {
    setBusy(true); setMsg(null)
    try { const r = await fn(); if (r?.journey !== undefined) setS((x) => ({ ...x, journey: r.journey })); if (ok) setMsg({ tone: 'ok', text: ok }); return r } catch { setMsg({ tone: 'bad', text: t.failed }); return null } finally { setBusy(false) }
  }
  if (s === null) return <Loading label={t.loading} />
  if (s === false) return <p className="rt-msg" role="alert">{t.failed}</p>
  const family = pathFor('account', siteLang) + '#family'

  if (!j) {
    const onStart = () => {
      if (!form.consent) { setMsg({ tone: 'bad', text: t.consentNeed }); return }
      run(() => startHajjJourney({ kind: form.kind, name: form.name.trim(), family: s.inCircle && form.family }))
    }
    return (
      <section className="ui-card acc-section" aria-labelledby="ht-mine-h" data-testid="ht-start">
        <h2 className="acc-section__title" id="ht-mine-h">{t.mine}</h2>
        <div className="p3-chips" role="group" aria-label={t.kind}>
          {['hajj', 'umrah'].map((k) => (
            <button key={k} type="button" aria-pressed={form.kind === k} className="ui-chip" onClick={() => setForm((f) => ({ ...f, kind: k }))} data-testid={`ht-kind-${k}`}>{t.kinds[k]}</button>
          ))}
        </div>
        <div className="ui-field">
          <label className="ui-field__label" htmlFor="ht-name">{t.name}</label>
          <input id="ht-name" className="ui-input" dir="auto" maxLength={40} value={form.name} placeholder={t.namePh} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoComplete="off" />
        </div>
        {s.inCircle ? (
          <label className="acc-check" htmlFor="ht-family">
            <input id="ht-family" type="checkbox" checked={form.family} onChange={(e) => setForm((f) => ({ ...f, family: e.target.checked }))} />
            <span>{t.shareFamily}</span>
          </label>
        ) : <p className="rt-note">{t.noCircle} <a href={family}>{t.openFamily}</a></p>}
        <label className="acc-check" htmlFor="ht-consent">
          <input id="ht-consent" type="checkbox" checked={form.consent} onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))} data-testid="ht-consent" />
          <span>{t.consent}</span>
        </label>
        <Msg msg={msg} />
        <div><button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={busy} onClick={onStart} data-testid="ht-start-btn"><Icon name="hajjguide" className="ui-btn__icon" /> {t.start}</button></div>
      </section>
    )
  }

  const onLink = async () => {
    const r = await run(() => createHajjLink())
    if (r?.token) { setLink(`${window.location.origin}${pathFor('hajjtracker', siteLang)}#h=${r.token}`); setCopied(false) }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true) } catch { /* əl ilə seçmək olar */ } }
  return (
    <section className="ui-card acc-section" aria-labelledby="ht-mine-h" data-testid="ht-mine">
      <h2 className="acc-section__title" id="ht-mine-h">{t.mine} · {t.kinds[j.kind]}</h2>
      <p className="rt-note">{t.tapStage}</p>
      <ol className="p3-stage-btns">
        {STAGES[j.kind].map((st) => (
          <li key={st}>
            <button type="button" className={`p3-stage-btn${st === j.stage ? ' is-current' : ''}`} aria-pressed={st === j.stage} disabled={busy} onClick={() => run(() => setHajjStage(st))} data-testid={`ht-stage-${st}`}>
              <span className="p3-step__dot" aria-hidden="true">{st === j.stage ? <Icon name="check" size={12} /> : null}</span> {t.stages[st]}
            </button>
          </li>
        ))}
      </ol>
      {j.stage && <StageDua stage={j.stage} t={t} lang={lang} siteLang={siteLang} hisn={hisn} />}

      <h3 className="p3-dua__h"><Icon name="share" size={18} /> {t.share}</h3>
      {s.inCircle ? (
        <label className="acc-check" htmlFor="ht-share-family">
          <input id="ht-share-family" type="checkbox" checked={j.family} disabled={busy} onChange={(e) => run(() => setHajjShare({ family: e.target.checked }))} />
          <span>{t.shareFamily}</span>
        </label>
      ) : <p className="rt-note">{t.noCircle} <a href={family}>{t.openFamily}</a></p>}
      <label className="acc-check" htmlFor="ht-pause">
        <input id="ht-pause" type="checkbox" checked={j.paused} disabled={busy} onChange={(e) => run(() => setHajjShare({ paused: e.target.checked }))} data-testid="ht-pause" />
        <span>{t.pause}</span>
      </label>
      {j.paused && <p className="rt-note">{t.pausedNote}</p>}
      <div className="p3-link">
        <p className="rt-note"><strong>{t.link}.</strong> {t.linkNote}</p>
        {link && (
          <div className="p3-link__row">
            <input className="ui-input" readOnly value={link} aria-label={t.link} onFocus={(e) => e.target.select()} dir="ltr" data-testid="ht-link-url" />
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={copy}><Icon name="copy" className="ui-btn__icon" /> {copied ? t.copied : t.copy}</button>
          </div>
        )}
        {!link && j.link && <p className="rt-note">{t.linkOn}</p>}
        <div className="p3-row">
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={busy} onClick={onLink} data-testid="ht-link-new"><Icon name="link" className="ui-btn__icon" /> {j.link ? t.linkAgain : t.linkNew}</button>
          {j.link && <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" disabled={busy} onClick={() => { setLink(''); run(() => revokeHajjLink()) }} data-testid="ht-link-revoke">{t.linkRevoke}</button>}
        </div>
      </div>
      <p className="rt-note">{t.expires(fmtDate(j.expiresAt, lang))}</p>
      <Msg msg={msg} />
      <div><Confirm label={t.stop} ask={t.stopAsk} yes={t.yes} cancel={t.cancel} disabled={busy} testId="ht-stop"
        onYes={async () => { setLink(''); const r = await run(() => stopHajjJourney(), t.stopped); if (r) setS((x) => ({ ...x, journey: null })) }} /></div>
    </section>
  )
}

export default function HajjTrackerPage() {
  const { lang, siteLang = lang } = useLang()
  const t = pickUi(HT, lang, 'en')
  const { status } = useAuthUser()
  const [token, setToken] = useState(() => (typeof window === 'undefined' ? null : parseHajjHash(window.location.hash)))
  useEffect(() => {
    const on = () => setToken(parseHajjHash(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => { if (!token && status === 'unknown') refreshMe().catch(() => {}) }, [status, token])

  let body
  if (token) body = <LinkViewer key={token} token={token} t={t} lang={lang} siteLang={siteLang} />
  else if (status === 'anon') body = <SignInCard text={t.signIn} btn={t.signInBtn} pageKey="hajjtracker" siteLang={siteLang} testId="ht-signin" />
  else if (status !== 'user') body = <Loading label={t.loading} />
  else body = <><FamilyJourneys t={t} lang={lang} siteLang={siteLang} /><MyJourney t={t} lang={lang} siteLang={siteLang} /></>

  return (
    <div className="acc-account p3-page">
      <section className="ui-page-hero">
        <div className="ui-container ui-container--narrow">
          <p className="ui-eyebrow">{t.eyebrow}</p>
          <h1 className="ui-title">{t.title}</h1>
          <p className="ui-lead">{t.lead}</p>
        </div>
      </section>
      <div className="ui-container ui-container--narrow acc-sections">
        {body}
        {!token && <p><a className="ui-btn ui-btn--ghost ui-btn--sm" href={pathFor('account', siteLang)}><Icon name="arrow" className="ui-btn__icon ui-flip-rtl" /> {t.back}</a></p>}
      </div>
    </div>
  )
}
