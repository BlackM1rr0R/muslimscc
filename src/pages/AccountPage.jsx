// ═══════════════════════════════════════════════════════
// /account — istifadəçi hesabının idarəsi (server/users.js, docs/USER-ACCOUNTS.md)
//
// Girişsiz (GET /api/auth/me → 401) → /login?next=/account.
// Bölmələr: profil (ad), e-poçt təsdiqi (+ məktubu təkrar), şifrə (dəyiş / şifrəsiz hesabda
// təyin et), passkey-lər (siyahı, əlavə et, sil — server adı dəyişməyi dəstəkləmir),
// aktiv sessiyalar (birini və ya digər hamısını bağla), rol nişanı (+ məscid nümayəndəsinin
// məscidi), "Hesabla nə edə bilərsiniz", çıxış, hesabı silmə (səhifədə təsdiqlə).
// noindex (src/seo/routes.js).
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { pickUi } from '../utils/uiText'
import { pathFor } from '../seo/routes'
import Icon from '../components/Icon'
import { AuthMessage, PasswordField, useAuthText } from '../components/account/AuthUi'
import { fillText } from '../components/account/authText'
import { useAuthUser, initialOf } from '../api/userSession'
import {
  MAX_NAME, addPasskey, changePassword, deleteAccount, errorKey, isPanelRole, listSessions, logoutUser,
  passkeySupported, passwordStrength, refreshMe, removePasskey, resendVerification, revokeOtherSessions,
  revokeSession, updateProfile,
} from '../api/userAuth'
import '../styles/Account.css'

const LABELS = {
  az: {
    eyebrow: 'Hesab', title: 'Hesabım', loading: 'Yüklənir…', loadError: 'Hesab məlumatlarını yükləmək alınmadı.', retry: 'Yenidən sına',
    logout: 'Çıxış', role: 'Rol', mosque: 'Bağlı məscid',
    profile: 'Profil', name: 'Ad', nameHint: 'Yalnız hesabınızda görünür (ən çox {n} simvol).', save: 'Yadda saxla', saved: 'Yadda saxlanıldı.',
    email: 'E-poçt', verified: 'Təsdiqlənib', unverified: 'Təsdiqlənməyib',
    verifyNote: 'Təsdiq məktubundakı keçidi açın. Təsdiqlənmiş e-poçt hesabı Google ilə bağlamağa imkan verir.',
    resend: 'Məktubu yenidən göndər', resent: 'Təsdiq məktubu göndərildi. Gələnlər qutusunu yoxlayın.',
    methods: 'Giriş üsulları', mPassword: 'Şifrə',
    pwChange: 'Şifrəni dəyiş', pwSet: 'Şifrə təyin et',
    pwSetLead: 'Hesabınızda şifrə yoxdur — Google və ya passkey ilə daxil olursunuz. Şifrə təyin etsəniz, e-poçt və şifrə ilə də daxil ola bilərsiniz.',
    pwNote: 'Şifrə dəyişəndə digər cihazlardakı girişlər bağlanır.', pwSave: 'Şifrəni yadda saxla',
    pwSaved: 'Şifrə yadda saxlanıldı. Digər cihazlardakı girişlər bağlandı.',
    passkeys: 'Passkey-lər',
    passkeysLead: 'Passkey — şifrəsiz giriş: barmaq izi, üz və ya cihazın PIN kodu ilə. Gizli açar cihazınızdan çıxmır.',
    pkName: 'Ad (istəyə bağlı)', pkPlaceholder: 'Məsələn: telefonum', pkAdd: 'Passkey əlavə et', pkAdded: 'Passkey əlavə olundu.',
    pkNone: 'Hələ passkey yoxdur.', pkUnsupported: 'Bu brauzer passkey-i dəstəkləmir.', pkCreated: 'Əlavə olunub', pkUsed: 'Son istifadə', pkNever: 'hələ yox',
    remove: 'Sil', confirmRemove: 'Silinsin?', yes: 'Bəli, sil', cancel: 'Ləğv et', pkRemoved: 'Passkey silindi.',
    sessions: 'Aktiv sessiyalar', sessionsLead: 'Hesabınıza daxil olunmuş cihazlar. Tanımadığınız girişi bağlayın.',
    thisDevice: 'Bu cihaz', sStarted: 'Giriş', sSeen: 'Son fəallıq', revoke: 'Bağla', revokeAll: 'Digər bütün cihazlardan çıx',
    revokedAll: 'Digər cihazlardakı girişlər bağlandı.', revokedOne: 'Sessiya bağlandı.', sOnly: 'Başqa aktiv sessiya yoxdur.',
    canTitle: 'Hesabla nə edə bilərsiniz',
    can: [
      'Hesabın təhlükəsizliyini idarə edin: şifrə və e-poçt təsdiqi',
      'Passkey əlavə edib şifrəsiz daxil olun',
      'Aktiv sessiyalara baxın və tanımadığınız girişləri bağlayın',
    ],
    canMosque: 'Məscid nümayəndəsi kimi məscidinizin məlumatlarını idarə etmək — tezliklə.',
    canPanel: 'Rolunuz saytın idarəsi ilə bağlıdır. Admin paneli ayrıca hesabla açılır — paneldəki giriş məlumatlarınızla daxil olun.',
    openPanel: 'Admin panelini aç',
    danger: 'Hesabı sil',
    dangerLead: 'Hesab və ona bağlı hər şey (sessiyalar, passkey-lər, Google bağlantısı) birdəfəlik silinir. Bunu geri qaytarmaq olmaz.',
    deleteBtn: 'Hesabı sil', confirmPw: 'Təsdiq üçün şifrənizi yazın', confirmWord: 'Təsdiq üçün DELETE yazın', deleteNow: 'Birdəfəlik sil',
  },
  en: {
    eyebrow: 'Account', title: 'My account', loading: 'Loading…', loadError: 'Could not load your account details.', retry: 'Try again',
    logout: 'Sign out', role: 'Role', mosque: 'Linked mosque',
    profile: 'Profile', name: 'Name', nameHint: 'Shown only in your account (up to {n} characters).', save: 'Save', saved: 'Saved.',
    email: 'Email', verified: 'Confirmed', unverified: 'Not confirmed',
    verifyNote: 'Open the link in the confirmation email. A confirmed email lets you link your account with Google.',
    resend: 'Send the email again', resent: 'Confirmation email sent. Check your inbox.',
    methods: 'Sign-in methods', mPassword: 'Password',
    pwChange: 'Change password', pwSet: 'Set a password',
    pwSetLead: 'Your account has no password — you sign in with Google or a passkey. If you set a password, you can also sign in with email and password.',
    pwNote: 'Changing the password signs out your other devices.', pwSave: 'Save password',
    pwSaved: 'Password saved. Your other devices have been signed out.',
    passkeys: 'Passkeys',
    passkeysLead: 'A passkey lets you sign in without a password — with your fingerprint, face or device PIN. The private key never leaves your device.',
    pkName: 'Name (optional)', pkPlaceholder: 'For example: my phone', pkAdd: 'Add a passkey', pkAdded: 'Passkey added.',
    pkNone: 'No passkeys yet.', pkUnsupported: 'This browser does not support passkeys.', pkCreated: 'Added', pkUsed: 'Last used', pkNever: 'not yet',
    remove: 'Remove', confirmRemove: 'Remove it?', yes: 'Yes, remove', cancel: 'Cancel', pkRemoved: 'Passkey removed.',
    sessions: 'Active sessions', sessionsLead: 'Devices signed in to your account. Sign out any session you do not recognise.',
    thisDevice: 'This device', sStarted: 'Signed in', sSeen: 'Last active', revoke: 'Sign out', revokeAll: 'Sign out all other devices',
    revokedAll: 'Your other devices have been signed out.', revokedOne: 'Session signed out.', sOnly: 'No other active sessions.',
    canTitle: 'What you can do with your account',
    can: [
      'Manage your account security: password and email confirmation',
      'Add a passkey and sign in without a password',
      'Review active sessions and sign out the ones you do not recognise',
    ],
    canMosque: 'As a mosque representative: managing your mosque’s information — coming soon.',
    canPanel: 'Your role is related to running the site. The admin panel uses a separate account — sign in with your panel credentials.',
    openPanel: 'Open the admin panel',
    danger: 'Delete account',
    dangerLead: 'Your account and everything linked to it (sessions, passkeys, Google link) will be deleted permanently. This cannot be undone.',
    deleteBtn: 'Delete account', confirmPw: 'Enter your password to confirm', confirmWord: 'Type DELETE to confirm', deleteNow: 'Delete permanently',
  },
  ru: {
    eyebrow: 'Аккаунт', title: 'Мой аккаунт', loading: 'Загрузка…', loadError: 'Не удалось загрузить данные аккаунта.', retry: 'Повторить',
    logout: 'Выйти', role: 'Роль', mosque: 'Привязанная мечеть',
    profile: 'Профиль', name: 'Имя', nameHint: 'Видно только в вашем аккаунте (до {n} символов).', save: 'Сохранить', saved: 'Сохранено.',
    email: 'Эл. почта', verified: 'Подтверждена', unverified: 'Не подтверждена',
    verifyNote: 'Откройте ссылку из письма с подтверждением. Подтверждённая почта позволяет связать аккаунт с Google.',
    resend: 'Отправить письмо ещё раз', resent: 'Письмо с подтверждением отправлено. Проверьте входящие.',
    methods: 'Способы входа', mPassword: 'Пароль',
    pwChange: 'Сменить пароль', pwSet: 'Задать пароль',
    pwSetLead: 'У аккаунта нет пароля — вы входите через Google или с ключом доступа. Если задать пароль, можно будет входить и по почте с паролем.',
    pwNote: 'При смене пароля входы на других устройствах закрываются.', pwSave: 'Сохранить пароль',
    pwSaved: 'Пароль сохранён. Входы на других устройствах закрыты.',
    passkeys: 'Ключи доступа',
    // lang-ok[PIN]: cihazın PIN kodu — texniki termin
    passkeysLead: 'Ключ доступа — вход без пароля: по отпечатку пальца, лицу или PIN-коду устройства. Секретный ключ не покидает ваше устройство.',
    pkName: 'Название (необязательно)', pkPlaceholder: 'Например: мой телефон', pkAdd: 'Добавить ключ доступа', pkAdded: 'Ключ доступа добавлен.',
    pkNone: 'Ключей доступа пока нет.', pkUnsupported: 'Этот браузер не поддерживает ключи доступа.', pkCreated: 'Добавлен', pkUsed: 'Последнее использование', pkNever: 'ещё нет',
    remove: 'Удалить', confirmRemove: 'Удалить?', yes: 'Да, удалить', cancel: 'Отмена', pkRemoved: 'Ключ доступа удалён.',
    sessions: 'Активные сеансы', sessionsLead: 'Устройства, на которых выполнен вход в аккаунт. Закройте сеанс, который вы не узнаёте.',
    thisDevice: 'Это устройство', sStarted: 'Вход', sSeen: 'Последняя активность', revoke: 'Закрыть', revokeAll: 'Выйти на всех других устройствах',
    revokedAll: 'Входы на других устройствах закрыты.', revokedOne: 'Сеанс закрыт.', sOnly: 'Других активных сеансов нет.',
    canTitle: 'Что можно делать с аккаунтом',
    can: [
      'Управлять безопасностью аккаунта: пароль и подтверждение почты',
      'Добавить ключ доступа и входить без пароля',
      'Просматривать активные сеансы и закрывать незнакомые',
    ],
    canMosque: 'Как представитель мечети: управление информацией о вашей мечети — скоро.',
    canPanel: 'Ваша роль связана с управлением сайтом. Админ-панель открывается отдельным аккаунтом — войдите с учётными данными панели.',
    openPanel: 'Открыть админ-панель',
    danger: 'Удалить аккаунт',
    dangerLead: 'Аккаунт и всё, что с ним связано (сеансы, ключи доступа, привязка Google), будут удалены навсегда. Отменить это нельзя.',
    // lang-ok[DELETE]: serverin tələb etdiyi təsdiq sözü (server/users.js) tərcümə olunmur
    deleteBtn: 'Удалить аккаунт', confirmPw: 'Введите пароль для подтверждения', confirmWord: 'Введите DELETE для подтверждения', deleteNow: 'Удалить навсегда',
  },
  tr: {
    eyebrow: 'Hesap', title: 'Hesap ayarları', loading: 'Yükleniyor…', loadError: 'Hesap bilgileri yüklenemedi.', retry: 'Tekrar dene',
    logout: 'Çıkış yap', role: 'Rol', mosque: 'Bağlı cami',
    profile: 'Profil', name: 'Ad', nameHint: 'Yalnızca hesabınızda görünür (en fazla {n} karakter).', save: 'Kaydet', saved: 'Kaydedildi.',
    email: 'E-posta', verified: 'Onaylandı', unverified: 'Onaylanmadı',
    verifyNote: 'Onay e-postasındaki bağlantıyı açın. Onaylanmış e-posta, hesabınızı Google’a bağlamanızı sağlar.',
    resend: 'E-postayı yeniden gönder', resent: 'Onay e-postası gönderildi. Gelen kutunuzu kontrol edin.',
    methods: 'Giriş yöntemleri', mPassword: 'Şifre',
    pwChange: 'Şifreyi değiştir', pwSet: 'Şifre belirle',
    pwSetLead: 'Hesabınızın şifresi yok — Google veya geçiş anahtarıyla giriş yapıyorsunuz. Bir şifre belirlerseniz e-posta ve şifreyle de giriş yapabilirsiniz.',
    pwNote: 'Şifre değişince diğer cihazlardaki oturumlar kapanır.', pwSave: 'Şifreyi kaydet',
    pwSaved: 'Şifre kaydedildi. Diğer cihazlardaki oturumlar kapatıldı.',
    passkeys: 'Geçiş anahtarları',
    passkeysLead: 'Geçiş anahtarı, şifresiz giriş sağlar: parmak izi, yüz veya cihaz PIN’i ile. Gizli anahtar cihazınızdan çıkmaz.',
    pkName: 'Ad (isteğe bağlı)', pkPlaceholder: 'Örneğin: telefonum', pkAdd: 'Geçiş anahtarı ekle', pkAdded: 'Geçiş anahtarı eklendi.',
    pkNone: 'Henüz geçiş anahtarı yok.', pkUnsupported: 'Bu tarayıcı geçiş anahtarlarını desteklemiyor.', pkCreated: 'Eklendi', pkUsed: 'Son kullanım', pkNever: 'henüz yok',
    remove: 'Kaldır', confirmRemove: 'Kaldırılsın mı?', yes: 'Evet, kaldır', cancel: 'Vazgeç', pkRemoved: 'Geçiş anahtarı kaldırıldı.',
    sessions: 'Etkin oturumlar', sessionsLead: 'Hesabınıza giriş yapılmış cihazlar. Tanımadığınız oturumu kapatın.',
    thisDevice: 'Bu cihaz', sStarted: 'Giriş', sSeen: 'Son etkinlik', revoke: 'Kapat', revokeAll: 'Diğer tüm cihazlardan çıkış yap',
    revokedAll: 'Diğer cihazlardaki oturumlar kapatıldı.', revokedOne: 'Oturum kapatıldı.', sOnly: 'Başka etkin oturum yok.',
    canTitle: 'Hesabınızla neler yapabilirsiniz',
    can: [
      'Hesap güvenliğinizi yönetin: şifre ve e-posta onayı',
      'Geçiş anahtarı ekleyip şifresiz giriş yapın',
      'Etkin oturumları görün ve tanımadıklarınızı kapatın',
    ],
    canMosque: 'Cami temsilcisi olarak caminizin bilgilerini yönetmek — yakında.',
    canPanel: 'Rolünüz sitenin yönetimiyle ilgilidir. Yönetim paneli ayrı bir hesapla açılır — panel giriş bilgilerinizle giriş yapın.',
    openPanel: 'Yönetim panelini aç',
    danger: 'Hesabı sil',
    dangerLead: 'Hesabınız ve ona bağlı her şey (oturumlar, geçiş anahtarları, Google bağlantısı) kalıcı olarak silinir. Bu geri alınamaz.',
    deleteBtn: 'Hesabı sil', confirmPw: 'Onaylamak için şifrenizi yazın', confirmWord: 'Onaylamak için DELETE yazın', deleteNow: 'Kalıcı olarak sil',
  },
  ar: {
    eyebrow: 'الحساب', title: 'حسابي', loading: 'جارٍ التحميل…', loadError: 'تعذّر تحميل بيانات الحساب.', retry: 'إعادة المحاولة',
    logout: 'تسجيل الخروج', role: 'الدور', mosque: 'المسجد المرتبط',
    profile: 'الملف الشخصي', name: 'الاسم', nameHint: 'يظهر في حسابك فقط (حتى {n} حرفًا).', save: 'حفظ', saved: 'تم الحفظ.',
    email: 'البريد الإلكتروني', verified: 'مؤكَّد', unverified: 'غير مؤكَّد',
    verifyNote: 'افتح الرابط في رسالة التأكيد. البريد المؤكَّد يتيح لك ربط حسابك بـ Google.',
    resend: 'أعد إرسال الرسالة', resent: 'أُرسلت رسالة التأكيد. تحقّق من صندوق الوارد.',
    methods: 'طرق تسجيل الدخول', mPassword: 'كلمة المرور',
    pwChange: 'تغيير كلمة المرور', pwSet: 'تعيين كلمة مرور',
    pwSetLead: 'لا توجد كلمة مرور لحسابك — تدخل عبر Google أو بمفتاح المرور. إذا عيّنت كلمة مرور يمكنك الدخول أيضًا بالبريد وكلمة المرور.',
    pwNote: 'عند تغيير كلمة المرور يُغلق الدخول على الأجهزة الأخرى.', pwSave: 'حفظ كلمة المرور',
    pwSaved: 'حُفظت كلمة المرور، وأُغلق الدخول على الأجهزة الأخرى.',
    passkeys: 'مفاتيح المرور',
    // lang-ok[PIN]: cihazın PIN kodu — texniki termin
    passkeysLead: 'مفتاح المرور دخول بلا كلمة مرور: ببصمة الإصبع أو الوجه أو رمز PIN للجهاز. المفتاح السري لا يغادر جهازك.',
    pkName: 'الاسم (اختياري)', pkPlaceholder: 'مثلًا: هاتفي', pkAdd: 'إضافة مفتاح مرور', pkAdded: 'أُضيف مفتاح المرور.',
    pkNone: 'لا توجد مفاتيح مرور بعد.', pkUnsupported: 'هذا المتصفح لا يدعم مفاتيح المرور.', pkCreated: 'أُضيف', pkUsed: 'آخر استخدام', pkNever: 'لم يُستخدم بعد',
    remove: 'حذف', confirmRemove: 'هل تريد الحذف؟', yes: 'نعم، احذف', cancel: 'إلغاء', pkRemoved: 'حُذف مفتاح المرور.',
    sessions: 'الجلسات النشطة', sessionsLead: 'الأجهزة التي سُجّل الدخول منها إلى حسابك. أغلق أي جلسة لا تعرفها.',
    thisDevice: 'هذا الجهاز', sStarted: 'الدخول', sSeen: 'آخر نشاط', revoke: 'إغلاق', revokeAll: 'الخروج من جميع الأجهزة الأخرى',
    revokedAll: 'أُغلق الدخول على الأجهزة الأخرى.', revokedOne: 'أُغلقت الجلسة.', sOnly: 'لا توجد جلسات نشطة أخرى.',
    canTitle: 'ماذا يمكنك أن تفعل بحسابك',
    can: [
      'إدارة أمان حسابك: كلمة المرور وتأكيد البريد الإلكتروني',
      'إضافة مفتاح مرور والدخول بلا كلمة مرور',
      'الاطلاع على الجلسات النشطة وإغلاق ما لا تعرفه',
    ],
    canMosque: 'بصفتك ممثلًا لمسجد: إدارة معلومات مسجدك — قريبًا.',
    canPanel: 'دورك متعلق بإدارة الموقع. تُفتح لوحة الإدارة بحساب منفصل — سجّل الدخول ببيانات اللوحة.',
    openPanel: 'فتح لوحة الإدارة',
    danger: 'حذف الحساب',
    dangerLead: 'سيُحذف حسابك وكل ما يرتبط به (الجلسات ومفاتيح المرور وربط Google) نهائيًا. لا يمكن التراجع عن ذلك.',
    // lang-ok[DELETE]: serverin tələb etdiyi təsdiq sözü (server/users.js) tərcümə olunmur
    deleteBtn: 'حذف الحساب', confirmPw: 'اكتب كلمة المرور للتأكيد', confirmWord: 'اكتب DELETE للتأكيد', deleteNow: 'احذف نهائيًا',
  },
}

const ROLE_TONE = { user: '', mosque_rep: 'ui-badge--accent', editor: 'ui-badge--brand', admin: 'ui-badge--solid', superadmin: 'ui-badge--solid acc-role--super' }

/** Bölmə kartı: ikon + başlıq + (istəyə bağlı) alt mətn. */
function Section({ icon, title, lead, children, tone = '', id }) {
  return (
    <section className={`ui-card acc-section${tone ? ` acc-section--${tone}` : ''}`} aria-labelledby={id}>
      <header className="acc-section__head">
        <span className={`ui-icon-tile${tone === 'danger' ? ' acc-tile--danger' : ''}`}><Icon name={icon} size={20} /></span>
        <div>
          <h2 className="acc-section__title" id={id}>{title}</h2>
          {lead && <p className="acc-section__lead">{lead}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

export default function AccountPage() {
  const { lang, siteLang = lang } = useLang()
  const l = pickUi(LABELS, lang)
  const { t, errText } = useAuthText()
  const navigate = useNavigate()
  const { status, user } = useAuthUser()
  const [load, setLoad] = useState('loading')       // loading | ready | error
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  // Çıxış / silmə özü ana səhifəyə aparır — "anonim oldu → girişə" effekti mane olmasın
  const leaving = useRef(false)

  const toLogin = useCallback(() => {
    navigate(`${pathFor('login', siteLang)}?next=${encodeURIComponent(pathFor('account', siteLang))}`, { replace: true })
  }, [navigate, siteLang])

  const fetchMe = useCallback(() => {
    setLoad('loading')
    refreshMe().then((u) => {
      if (!alive.current) return
      if (!u) toLogin()
      else setLoad('ready')
    }).catch(() => { if (alive.current) setLoad('error') })
  }, [toLogin])
  useEffect(() => { fetchMe() }, [fetchMe])

  // Başqa yerdən çıxış (başlıq menyusu, sessiya bağlandı) — girişə
  useEffect(() => {
    if (load === 'ready' && status === 'anon' && !leaving.current) toLogin()
  }, [load, status, toLogin])

  const fmt = useMemo(() => {
    let f = null
    try { f = new Intl.DateTimeFormat(lang === 'az' ? 'az-Latn-AZ' : lang, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) } catch { /* köhnə brauzer */ }
    return (ms) => (ms ? (f ? f.format(new Date(ms)) : new Date(ms).toLocaleString()) : '')
  }, [lang])

  if (load !== 'ready' || !user) {
    return (
      <div className="acc-account">
        <section className="ui-page-hero"><div className="ui-container ui-container--narrow">
          <h1 className="ui-title">{l.title}</h1>
        </div></section>
        <div className="ui-container ui-container--narrow acc-sections">
          {load === 'error' ? (
            <div className="ui-card acc-section" role="alert">
              <p>{l.loadError}</p>
              <button type="button" className="ui-btn ui-btn--secondary" onClick={fetchMe}><Icon name="refresh" className="ui-btn__icon" /> {l.retry}</button>
            </div>
          ) : (
            <div className="spinner-wrap" role="status" aria-live="polite"><div className="spinner" /><span className="ui-sr-only">{l.loading}</span></div>
          )}
        </div>
      </div>
    )
  }

  const onLogout = async () => {
    leaving.current = true
    try { await logoutUser() } catch { /* ipucu onsuz da silindi */ }
    navigate(pathFor('home', siteLang))
  }

  return (
    <div className="acc-account">
      <section className="ui-page-hero acc-hero">
        <div className="ui-container ui-container--narrow acc-hero__row">
          <span className="acc-avatar acc-avatar--lg" aria-hidden="true">{initialOf(user)}</span>
          <div className="acc-hero__text">
            <p className="ui-eyebrow">{l.eyebrow}</p>
            <h1 className="ui-title">{user.displayName || l.title}</h1>
            <p className="acc-hero__email"><bdi>{user.email}</bdi></p>
            <p className="acc-hero__badges">
              <span className="ui-sr-only">{l.role}: </span>
              <span className={`ui-badge ${ROLE_TONE[user.role] || ''}`} data-testid="role-badge">{t.roles[user.role] || user.role}</span>
              {user.role === 'mosque_rep' && user.mosqueId && (
                <span className="ui-badge ui-badge--outline"><Icon name="mosques" size={14} /> {l.mosque}: <bdi>{user.mosqueId}</bdi></span>
              )}
            </p>
          </div>
          <button type="button" className="ui-btn ui-btn--secondary acc-hero__logout" onClick={onLogout}>
            <Icon name="logout" className="ui-btn__icon ui-flip-rtl" /> {l.logout}
          </button>
        </div>
      </section>

      <div className="ui-container ui-container--narrow acc-sections">
        {!user.emailVerified && user.email && <VerifyBanner l={l} errText={errText} lang={lang} />}
        <ProfileSection l={l} t={t} errText={errText} user={user} lang={lang} />
        <PasswordSection l={l} t={t} errText={errText} user={user} />
        <PasskeySection l={l} errText={errText} user={user} fmt={fmt} />
        <SessionsSection l={l} errText={errText} fmt={fmt} onSignedOut={toLogin} />
        <CanDoSection l={l} user={user} siteLang={siteLang} />
        <DeleteSection l={l} t={t} errText={errText} user={user} onLeaving={(on) => { leaving.current = on }} onDeleted={() => navigate(pathFor('home', siteLang))} />
      </div>
    </div>
  )
}

/** Kiçik vəziyyət köməkçisi: busy + mesaj + run(fn). */
function useAction(errText) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const seq = useRef(0)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const show = useCallback((tone, text) => setMsg({ tone, text, seq: ++seq.current }), [])
  const run = async (fn, okText) => {
    if (busy) return false
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      if (alive.current && okText) show('ok', okText)
      return true
    } catch (e) {
      if (!alive.current) return false
      const k = errorKey(e)
      if (k !== 'cancelled') show('bad', errText(k))
      return false
    } finally {
      if (alive.current) setBusy(false)
    }
  }
  return { busy, msg, show, run, setMsg }
}

function VerifyBanner({ l, errText, lang }) {
  const a = useAction(errText)
  return (
    <div className="ui-callout ui-callout--warn acc-verify" data-testid="verify-banner">
      <Icon name="mail" />
      <div>
        <strong className="ui-callout__title">{l.email}: {l.unverified}</strong>
        <p>{l.verifyNote}</p>
        <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" disabled={a.busy} onClick={() => a.run(() => resendVerification(lang), l.resent)}>
          <Icon name="send" className="ui-btn__icon ui-flip-rtl" /> {l.resend}
        </button>
        <AuthMessage msg={a.msg} />
      </div>
    </div>
  )
}

function ProfileSection({ l, t, errText, user, lang }) {
  const [name, setName] = useState(user.displayName || '')
  const a = useAction(errText)
  const methods = [
    user.hasPassword && l.mPassword,
    (user.providers || []).includes('google') && 'Google',
    (user.passkeys || []).length > 0 && `${l.passkeys} · ${(user.passkeys || []).length}`,
  ].filter(Boolean)
  const onSave = (e) => {
    e.preventDefault()
    a.run(() => updateProfile(name.trim()), l.saved)
  }
  return (
    <Section icon="user" title={l.profile} id="acc-profile">
      <form className="acc-form acc-form--row" onSubmit={onSave} noValidate>
        <div className="ui-field acc-field">
          <label className="ui-field__label" htmlFor="acc-dn">{l.name}</label>
          <input id="acc-dn" className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="nickname" aria-describedby="acc-dn-hint" />
          <span className="ui-field__hint" id="acc-dn-hint">{fillText(l.nameHint, lang, { n: MAX_NAME })}</span>
        </div>
        <button type="submit" className="ui-btn ui-btn--primary" disabled={a.busy || name.trim() === (user.displayName || '')}>{a.busy ? t.busy : l.save}</button>
      </form>
      <AuthMessage msg={a.msg} />
      <dl className="ui-kv acc-kv">
        <div>
          <dt>{l.email}</dt>
          <dd>
            <bdi>{user.email}</bdi>{' '}
            <span className={`ui-badge ${user.emailVerified ? 'ui-badge--ok' : 'ui-badge--warn'}`}>{user.emailVerified ? l.verified : l.unverified}</span>
          </dd>
        </div>
        <div>
          <dt>{l.methods}</dt>
          <dd className="acc-chips">{methods.map(m => <span key={m} className="ui-badge ui-badge--outline">{m}</span>)}</dd>
        </div>
      </dl>
    </Section>
  )
}

function PasswordSection({ l, t, errText, user }) {
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const a = useAction(errText)
  const has = user.hasPassword
  const onSave = async (e) => {
    e.preventDefault()
    if (passwordStrength(next, user.email).short) { a.show('bad', errText('errWeak')); return }
    const ok = await a.run(async () => {
      await changePassword(has ? cur : '', next)
      await refreshMe().catch(() => {})
    }, l.pwSaved)
    if (ok) { setCur(''); setNext('') }
  }
  return (
    <Section icon="lock" title={has ? l.pwChange : l.pwSet} lead={has ? l.pwNote : l.pwSetLead} id="acc-password">
      <form className="acc-form" onSubmit={onSave} noValidate>
        {/* Parol menecerləri üçün: hansı hesabın şifrəsidir */}
        <input type="email" name="username" autoComplete="username" value={user.email || ''} readOnly hidden />
        {has && <PasswordField label={t.currentPassword} value={cur} onChange={setCur} autoComplete="current-password" name="current" />}
        <PasswordField label={t.newPassword} value={next} onChange={setNext} autoComplete="new-password" withHint email={user.email} name="new" />
        <div>
          <button type="submit" className="ui-btn ui-btn--primary" disabled={a.busy || !next || (has && !cur)}>{a.busy ? t.busy : l.pwSave}</button>
        </div>
      </form>
      <AuthMessage msg={a.msg} />
    </Section>
  )
}

function PasskeySection({ l, errText, user, fmt }) {
  const [keys, setKeys] = useState(user.passkeys || [])
  const [name, setName] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const a = useAction(errText)
  const supported = passkeySupported()
  useEffect(() => { setKeys(user.passkeys || []) }, [user.passkeys])

  const onAdd = async () => {
    await a.run(async () => {
      const list = await addPasskey(name)
      setKeys(list)
      setName('')
      await refreshMe().catch(() => {})
    }, l.pkAdded)
  }
  const onRemove = async (id) => {
    setConfirmId(null)
    await a.run(async () => {
      const list = await removePasskey(id)
      setKeys(list)
      await refreshMe().catch(() => {})
    }, l.pkRemoved)
  }

  return (
    <Section icon="key" title={l.passkeys} lead={l.passkeysLead} id="acc-passkeys">
      {keys.length === 0 ? <p className="acc-empty">{l.pkNone}</p> : (
        <ul className="acc-list" data-testid="passkey-list">
          {keys.map(k => (
            <li key={k.id} className="acc-list__item">
              <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--neutral"><Icon name="key" size={16} /></span>
              <div className="acc-list__main">
                <strong><bdi>{k.name || 'Passkey'}</bdi></strong>
                <span className="acc-list__meta">
                  {l.pkCreated}: {fmt(k.createdAt)} · {l.pkUsed}: {k.lastUsedAt ? fmt(k.lastUsedAt) : l.pkNever}
                </span>
              </div>
              <div className="acc-list__actions">
                {confirmId === k.id ? (
                  <>
                    <span className="acc-confirm-q">{l.confirmRemove}</span>
                    <button type="button" className="ui-btn ui-btn--sm acc-btn-danger" onClick={() => onRemove(k.id)} disabled={a.busy}>{l.yes}</button>
                    <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setConfirmId(null)}>{l.cancel}</button>
                  </>
                ) : (
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setConfirmId(k.id)} disabled={a.busy}
                    aria-label={`${l.remove}: ${k.name || 'Passkey'}`}>
                    <Icon name="trash" className="ui-btn__icon" /> {l.remove}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {supported ? (
        <div className="acc-form acc-form--row">
          <div className="ui-field acc-field">
            <label className="ui-field__label" htmlFor="acc-pk-name">{l.pkName}</label>
            <input id="acc-pk-name" className="ui-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={l.pkPlaceholder} autoComplete="off" />
          </div>
          <button type="button" className="ui-btn ui-btn--primary" onClick={onAdd} disabled={a.busy}>
            <Icon name="plus" className="ui-btn__icon" /> {l.pkAdd}
          </button>
        </div>
      ) : <p className="acc-empty">{l.pkUnsupported}</p>}
      <AuthMessage msg={a.msg} />
    </Section>
  )
}

function SessionsSection({ l, errText, fmt, onSignedOut }) {
  const [list, setList] = useState(null)
  const a = useAction(errText)
  const reload = useCallback(() => listSessions().then(setList).catch(() => setList([])), [])
  useEffect(() => { reload() }, [reload])
  const others = (list || []).filter(s => !s.current)

  const onRevoke = async (s) => {
    const ok = await a.run(() => revokeSession(s.id), l.revokedOne)
    if (ok && s.current) { onSignedOut(); return }
    reload()
  }
  const onRevokeAll = async () => {
    await a.run(() => revokeOtherSessions(), l.revokedAll)
    reload()
  }

  return (
    <Section icon="device" title={l.sessions} lead={l.sessionsLead} id="acc-sessions">
      {list === null ? <div className="spinner-wrap"><div className="spinner" /></div> : (
        <ul className="acc-list" data-testid="session-list">
          {list.map(s => (
            <li key={s.id} className={`acc-list__item${s.current ? ' is-current' : ''}`}>
              <span className="ui-icon-tile ui-icon-tile--sm ui-icon-tile--neutral"><Icon name="device" size={16} /></span>
              <div className="acc-list__main">
                <strong><bdi>{s.label || '—'}</bdi>{s.current && <> <span className="ui-badge ui-badge--ok">{l.thisDevice}</span></>}</strong>
                <span className="acc-list__meta">{l.sStarted}: {fmt(s.createdAt)} · {l.sSeen}: {fmt(s.lastSeenAt)}</span>
              </div>
              {!s.current && (
                <div className="acc-list__actions">
                  <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => onRevoke(s)} disabled={a.busy}
                    aria-label={`${l.revoke}: ${s.label || ''}`}>
                    <Icon name="logout" className="ui-btn__icon ui-flip-rtl" /> {l.revoke}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {list && (others.length > 0
        ? <div><button type="button" className="ui-btn ui-btn--secondary" onClick={onRevokeAll} disabled={a.busy}>{l.revokeAll}</button></div>
        : <p className="acc-empty">{l.sOnly}</p>)}
      <AuthMessage msg={a.msg} />
    </Section>
  )
}

function CanDoSection({ l, user, siteLang }) {
  return (
    <Section icon="info" title={l.canTitle} id="acc-can">
      <ul className="acc-perks acc-perks--plain">
        {l.can.map((c, i) => <li key={i}><Icon name="check" size={18} /> <span>{c}</span></li>)}
        {user.role === 'mosque_rep' && <li><Icon name="mosques" size={18} /> <span>{l.canMosque}</span></li>}
      </ul>
      {isPanelRole(user.role) && (
        <div className="ui-callout ui-callout--note">
          <Icon name="shield" />
          <div>
            <p>{l.canPanel}</p>
            <p><a className="ui-btn ui-btn--secondary ui-btn--sm" href={pathFor('admin', siteLang)}>{l.openPanel}</a></p>
          </div>
        </div>
      )}
    </Section>
  )
}

function DeleteSection({ l, t, errText, user, onLeaving, onDeleted }) {
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [word, setWord] = useState('')
  const a = useAction(errText)
  const has = user.hasPassword
  const ready = has ? pw.length > 0 : word === 'DELETE'
  const onDelete = async (e) => {
    e.preventDefault()
    if (!ready) { a.show('bad', errText(has ? 'errWrongPw' : 'errConfirm')); return }
    onLeaving(true)
    const ok = await a.run(() => deleteAccount(has ? { password: pw } : { confirm: 'DELETE' }))
    if (ok) onDeleted()
    else onLeaving(false)
  }
  return (
    <Section icon="trash" title={l.danger} lead={l.dangerLead} tone="danger" id="acc-delete">
      {!open ? (
        <div><button type="button" className="ui-btn acc-btn-danger" onClick={() => setOpen(true)}>{l.deleteBtn}</button></div>
      ) : (
        <form className="acc-form" onSubmit={onDelete} noValidate>
          {has ? (
            <PasswordField label={l.confirmPw} value={pw} onChange={setPw} autoComplete="current-password" name="delete-password" autoFocus />
          ) : (
            <div className="ui-field acc-field">
              <label className="ui-field__label" htmlFor="acc-del-word">{l.confirmWord}</label>
              <input id="acc-del-word" className="ui-input" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} autoFocus />
            </div>
          )}
          <div className="acc-row">
            <button type="submit" className="ui-btn acc-btn-danger" disabled={a.busy || !ready}>
              <Icon name="trash" className="ui-btn__icon" /> {a.busy ? t.busy : l.deleteNow}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => { setOpen(false); setPw(''); setWord(''); a.setMsg(null) }}>{l.cancel}</button>
          </div>
        </form>
      )}
      <AuthMessage msg={a.msg} />
    </Section>
  )
}
