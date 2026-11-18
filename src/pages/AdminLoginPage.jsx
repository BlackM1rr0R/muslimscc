import { useState, useRef, useEffect } from 'react'
import { useLang } from '../contexts/LangContext'
import { watchAdmin, signInAdmin, verifyAdminTwoFactor } from '../api/adminAuth'
import Icon, { BrandMark } from '../components/Icon'
import '../styles/AdminPage.css'
import { pickUi } from '../utils/uiText'

// Giriş — öz serverimiz (POST /api/admin/login, server/auth.js): e-poçt + şifrə,
// HttpOnly cookie sessiyası. Admin hesabı serverdə yaradılır:
// server/scripts/admin-user.js create <e-poçt> (müvəqqəti şifrə — ilk girişdə
// panel onu dəyişdirməyi tələb edir). E-poçt xidməti YOXDUR: "Şifrəni
// unutmusunuz?" sıfırlama linki göndərmir — şifrəni serverdə dəyişməyi izah edir.
// Mətnlərdə ox simvolu yoxdur — ox <Icon> ilədir (ərəbcədə güzgülənir)
const LABELS = {
  az: { title:'Admin paneli', sub:'Davam etmək üçün hesabınıza daxil olun', email:'E-poçt', password:'Şifrə', login:'Daxil ol', signingIn:'Yoxlanılır...', forgot:'Şifrəni unutmusunuz?', back:'Sayta qayıt', show:'Şifrəni göstər', hide:'Şifrəni gizlət',
    // lang-ok: serverdəki əmrin və sənədin adı tərcümə olunmur
    errCreds:'E-poçt və ya şifrə yanlışdır', errMany:'Çox cəhd edildi. Bir az sonra yenidən sınayın', errNet:'Şəbəkə xətası. İnternet bağlantısını yoxlayın', errUnknown:'Daxil olmaq alınmadı', errEmail:'Əvvəlcə e-poçt ünvanını yazın', forgotInfo:'E-poçtla bərpa yoxdur. Şifrəni serverdə admin-user.js set-password əmri ilə dəyişin — admin sənədinə baxın (docs/ADMIN-SECURITY.md).', hint:'Yalnız admin üçündür.' },
  en: { title:'Admin Panel', sub:'Sign in to your account to continue', email:'Email', password:'Password', login:'Sign in', signingIn:'Checking...', forgot:'Forgot your password?', back:'Back to the site', show:'Show password', hide:'Hide password',
    errCreds:'Incorrect email or password', errMany:'Too many attempts. Please try again later', errNet:'Network error. Check your internet connection', errUnknown:'Could not sign in', errEmail:'Enter your email address first', forgotInfo:'There is no email recovery. Change the password on the server with the admin-user.js set-password command — see the admin docs (docs/ADMIN-SECURITY.md).', hint:'For admin only.' },
  ru: { title:'Админ-панель', sub:'Войдите в свой аккаунт, чтобы продолжить', email:'Эл. почта', password:'Пароль', login:'Войти', signingIn:'Проверка...', forgot:'Забыли пароль?', back:'Вернуться на сайт', show:'Показать пароль', hide:'Скрыть пароль',
    // lang-ok: serverdəki əmrin və sənədin adı tərcümə olunmur
    errCreds:'Неверная почта или пароль', errMany:'Слишком много попыток. Повторите позже', errNet:'Ошибка сети. Проверьте подключение к интернету', errUnknown:'Не удалось войти', errEmail:'Сначала введите адрес почты', forgotInfo:'Восстановления по почте нет. Смените пароль на сервере командой admin-user.js set-password — см. документацию администратора (docs/ADMIN-SECURITY.md).', hint:'Только для администратора.' },
  ar: { title:'لوحة الإدارة', sub:'سجّل الدخول إلى حسابك للمتابعة', email:'البريد الإلكتروني', password:'كلمة المرور', login:'دخول', signingIn:'جارٍ التحقق...', forgot:'هل نسيت كلمة المرور؟', back:'العودة إلى الموقع', show:'إظهار كلمة المرور', hide:'إخفاء كلمة المرور',
    // lang-ok: serverdəki əmrin və sənədin adı tərcümə olunmur
    errCreds:'البريد الإلكتروني أو كلمة المرور غير صحيحة', errMany:'محاولات كثيرة جدًا. حاول مرة أخرى لاحقًا', errNet:'خطأ في الشبكة. تحقق من اتصالك بالإنترنت', errUnknown:'تعذّر تسجيل الدخول', errEmail:'أدخل عنوان البريد الإلكتروني أولًا', forgotInfo:'لا توجد استعادة عبر البريد. غيّر كلمة المرور على الخادم بالأمر admin-user.js set-password — راجع توثيق الإدارة (docs/ADMIN-SECURITY.md).', hint:'للمسؤولين فقط' },
  tr: { title:'Yönetim Paneli', sub:'Devam etmek için hesabınıza giriş yapın', email:'E-posta', password:'Şifre', login:'Giriş yap', signingIn:'Kontrol ediliyor...', forgot:'Şifrenizi mi unuttunuz?', back:'Siteye dön', show:'Şifreyi göster', hide:'Şifreyi gizle',
    // lang-ok: serverdəki əmrin və sənədin adı tərcümə olunmur
    errCreds:'E-posta veya şifre yanlış', errMany:'Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin', errNet:'Ağ hatası. İnternet bağlantınızı kontrol edin', errUnknown:'Giriş yapılamadı', errEmail:'Önce e-posta adresinizi yazın', forgotInfo:'E-postayla kurtarma yok. Şifreyi sunucuda admin-user.js set-password komutuyla değiştirin — yönetici belgelerine bakın (docs/ADMIN-SECURITY.md).', hint:'Sadece yöneticiler için.' },
}

// İki addımlı yoxlama (server/auth.js → POST /api/admin/2fa): şifrə düzdürsə kod soruşulur
const TF_LABELS = {
  az: { tfTitle:'İki addımlı yoxlama', tfSub:'Kod tətbiqindəki 6 rəqəmli kodu yazın', tfSubBackup:'Ehtiyat kodlarınızdan birini yazın', tfCode:'Kod', tfBackup:'Ehtiyat kodu', tfVerify:'Təsdiqlə', tfUseBackup:'Ehtiyat kodu işlət', tfUseApp:'Tətbiqdəki kodu işlət', tfBack:'Girişə qayıt', errCode:'Kod yanlışdır. Tətbiqdəki yeni kodu yazın', errTicket:'Yoxlama vaxtı bitdi və ya cəhdlər tükəndi. Yenidən daxil olun' },
  en: { tfTitle:'Two-step verification', tfSub:'Enter the 6-digit code from your authenticator app', tfSubBackup:'Enter one of your backup codes', tfCode:'Code', tfBackup:'Backup code', tfVerify:'Verify', tfUseBackup:'Use a backup code', tfUseApp:'Use the code from the app', tfBack:'Back to sign in', errCode:'Wrong code. Enter the new code from your app', errTicket:'The check timed out or you ran out of attempts. Please sign in again' },
  ru: { tfTitle:'Двухэтапная проверка', tfSub:'Введите 6-значный код из приложения-аутентификатора', tfSubBackup:'Введите один из резервных кодов', tfCode:'Код', tfBackup:'Резервный код', tfVerify:'Подтвердить', tfUseBackup:'Использовать резервный код', tfUseApp:'Использовать код из приложения', tfBack:'Вернуться ко входу', errCode:'Неверный код. Введите новый код из приложения', errTicket:'Время проверки истекло или попытки закончились. Войдите снова' },
  ar: { tfTitle:'التحقق بخطوتين', tfSub:'أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة', tfSubBackup:'أدخل أحد رموزك الاحتياطية', tfCode:'الرمز', tfBackup:'رمز احتياطي', tfVerify:'تحقّق', tfUseBackup:'استخدم رمزًا احتياطيًا', tfUseApp:'استخدم الرمز من التطبيق', tfBack:'العودة إلى تسجيل الدخول', errCode:'الرمز غير صحيح. أدخل الرمز الجديد من التطبيق', errTicket:'انتهت مهلة التحقق أو نفدت المحاولات. سجّل الدخول مرة أخرى' },
  tr: { tfTitle:'İki adımlı doğrulama', tfSub:'Doğrulama uygulamanızdaki 6 haneli kodu girin', tfSubBackup:'Yedek kodlarınızdan birini girin', tfCode:'Kod', tfBackup:'Yedek kod', tfVerify:'Doğrula', tfUseBackup:'Yedek kod kullan', tfUseApp:'Uygulamadaki kodu kullan', tfBack:'Girişe dön', errCode:'Kod yanlış. Uygulamadaki yeni kodu girin', errTicket:'Doğrulama süresi doldu veya deneme hakkınız bitti. Yeniden giriş yapın' },
}

// api/adminAuth.js xəta kodu → mətn açarı
const ERR_KEY = { creds: 'errCreds', many: 'errMany', net: 'errNet', code: 'errCode', ticket: 'errTicket' }
const errKeyOf = (code) => ERR_KEY[code] || 'errUnknown'

export default function AdminLoginPage({ setPage }) {
  const { lang } = useLang()
  const l = { ...pickUi(LABELS, lang), ...pickUi(TF_LABELS, lang) }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  // { tone:'bad'|'ok', key } — mətn dil dəyişəndə də düzgün qalsın deyə açar saxlanır
  const [msg, setMsg] = useState(null)
  // Hər yanlış cəhddə xəta qutusu yenidən "silkələnsin" (key dəyişir)
  const [errKey, setErrKey] = useState(0)
  const [reveal, setReveal] = useState(false)
  // 2FA: şifrə düzdür, kod gözlənilir
  const [ticket, setTicket] = useState(null)
  const [code, setCode] = useState('')
  const [backup, setBackup] = useState(false)
  const mounted = useRef(true)
  // Effekt gövdəsində yenidən true: React StrictMode (dev) effekti iki dəfə
  // işlədir — əvvəl ilk təmizləmə ref-i həmişəlik false qoyurdu və giriş
  // xətası / "admin deyil" / sıfırlama mesajı heç vaxt göstərilmir,
  // düymə "Yoxlanılır..." vəziyyətində qalırdı
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // Panelə keçid bir dəfə (giriş və sessiya yoxlaması eyni anda xəbər verə bilər)
  const navigated = useRef(false)
  const goAdmin = () => {
    if (navigated.current) return
    navigated.current = true
    setPage('admin')
  }

  // Artıq admin kimi daxil olubsa — birbaşa panelə
  useEffect(() => watchAdmin(({ status }) => {
    if (status === 'admin') goAdmin()
  // Bir dəfəlik abunə; goAdmin ref ilə qorunur (təkrar keçid olmur)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  const showError = (key) => {
    setMsg({ tone: 'bad', key })
    setErrKey(k => k + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (!email.trim()) { showError('errEmail'); return }
    setBusy(true)
    setMsg(null)
    const res = await signInAdmin(email, password, lang)
    if (!mounted.current) return
    setBusy(false)
    if (!res.ok) { showError(errKeyOf(res.code)); return }
    if (res.twoFactor) { setTicket(res.ticket); setPassword(''); setCode(''); return }
    // Müvəqqəti şifrədirsə panel özü "Şifrəni dəyiş" formasını göstərir
    goAdmin()
  }

  const handleCode = async (e) => {
    e.preventDefault()
    if (busy || !code.trim()) return
    setBusy(true)
    setMsg(null)
    const res = await verifyAdminTwoFactor(ticket, backup ? { backupCode: code } : { code }, lang)
    if (!mounted.current) return
    setBusy(false)
    setCode('')
    if (res.ok) { goAdmin(); return }
    if (res.code === 'ticket') { setTicket(null); setBackup(false) }
    showError(errKeyOf(res.code))
  }

  // E-poçt xidməti yoxdur — sıfırlama linki əvəzinə dürüst izah
  const handleReset = () => setMsg({ tone: 'note', key: 'forgotInfo' })

  return (
    <div className="admin-login-page">
      <div className="ui-pattern ui-pattern--fade" aria-hidden="true"></div>
      <div className="admin-login-card ui-card">
        <div className="admin-login-icon" aria-hidden="true"><BrandMark size={56} /></div>
        <h1 className="admin-login-title">{l.title}</h1>
        <p className="admin-login-sub">{l.sub}</p>

        {msg && (
          <div
            key={msg.tone === 'bad' ? errKey : 'ok'}
            className={`admin-alert admin-alert--${msg.tone}${msg.tone === 'bad' ? ' admin-login-error' : ''}`}
            role={msg.tone === 'bad' ? 'alert' : 'status'}
          >
            <Icon name={msg.tone === 'bad' ? 'alert' : msg.tone === 'note' ? 'info' : 'check'} size={18} /> {l[msg.key]}
          </div>
        )}

        {ticket ? (
          <form onSubmit={handleCode} className="admin-login-form" aria-busy={busy || undefined} data-testid="admin-2fa">
            <h2 className="admin-login-sub">{l.tfTitle}</h2>
            <p className="admin-login-sub" id="adm-2fa-hint">{backup ? l.tfSubBackup : l.tfSub}</p>
            <label className="ui-field">
              <span className="ui-field__label">{backup ? l.tfBackup : l.tfCode}</span>
              <input
                type="text"
                name={backup ? 'backup-code' : 'otp'}
                className="ui-input admin-login-input"
                value={code}
                onChange={(e) => setCode(backup ? e.target.value : e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                inputMode={backup ? 'text' : 'numeric'}
                autoComplete="one-time-code"
                maxLength={backup ? 11 : 6}
                aria-describedby="adm-2fa-hint"
                dir="ltr"
                required
                autoFocus
              />
            </label>
            <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block" disabled={busy || (!backup && code.length !== 6)}>
              <Icon name="check" className="ui-btn__icon" /> {busy ? l.signingIn : l.tfVerify}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setBackup((b) => !b); setCode('') }} disabled={busy}>
              {backup ? l.tfUseApp : l.tfUseBackup}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => { setTicket(null); setBackup(false); setMsg(null) }} disabled={busy}>
              {l.tfBack}
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="admin-login-form" aria-busy={busy || undefined}>
          <label className="ui-field">
            <span className="ui-field__label">{l.email}</span>
            <span className="admin-login-input-wrap">
              <Icon name="user" size={18} className="admin-login-input-icon" />
              <input
                type="email"
                name="email"
                className="ui-input admin-login-input"
                placeholder={l.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                inputMode="email"
                required
                autoFocus
              />
            </span>
          </label>

          <label className="ui-field">
            <span className="ui-field__label">{l.password}</span>
            <span className="admin-login-input-wrap">
              <Icon name="shield" size={18} className="admin-login-input-icon" />
              <input
                type={reveal ? 'text' : 'password'}
                name="password"
                className="ui-input admin-login-input"
                placeholder={l.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                aria-invalid={msg?.tone === 'bad' || undefined}
                required
              />
              <button
                type="button"
                className="ui-icon-btn admin-login-reveal"
                onClick={() => setReveal(v => !v)}
                aria-label={reveal ? l.hide : l.show}
                aria-pressed={reveal}
              >
                <Icon name={reveal ? 'close' : 'eye'} size={18} />
              </button>
            </span>
          </label>

          <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block" disabled={busy}>
            <Icon name="enter" className="ui-btn__icon ui-flip-rtl" /> {busy ? l.signingIn : l.login}
          </button>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={handleReset} disabled={busy}>
            {l.forgot}
          </button>
        </form>
        )}

        <div className="admin-login-hint">
          <p>{l.hint}</p>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setPage('home')}>
            <Icon name="arrow" size={16} className="ui-btn__icon admin-back-arrow" /> {l.back}
          </button>
        </div>
      </div>
    </div>
  )
}
